import hashlib
import logging
import secrets
from datetime import timedelta
from decimal import Decimal, InvalidOperation

import requests
from django.conf import settings
from django.core.mail import send_mail
from django.db import transaction
from django.utils import timezone

from .models import (
    BuyerDeliveryToken,
    BuyerDeliveryConfirmation,
    ExportOrder,
    ShipmentRecord,
    NotificationItem,
)

logger = logging.getLogger(__name__)

# Allowed file extensions for delivery evidence
ALLOWED_EVIDENCE_EXTENSIONS = {'.pdf', '.jpg', '.jpeg', '.png', '.webp'}
MAX_EVIDENCE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB


def dispatch_cardalink_email(subject: str, plain_message: str, html_message: str, recipient_email: str) -> dict:
    """
    Intelligent multi-tier email dispatcher:
    1. HTTP Tier (Port 443 HTTPS - Works 100% on Render/Cloud without SMTP port restrictions):
       - If RESEND_API_KEY is configured: sends via https://api.resend.com/emails
       - If BREVO_API_KEY is configured: sends via https://api.brevo.com/v3/smtp/email
    2. Django SMTP Tier (Port 587/465):
       - If EMAIL_HOST_USER and EMAIL_HOST_PASSWORD are set, sends via smtplib with timeout.
       - If connection is blocked (e.g. Render Free tier blocking outbound 587/465), catches error and explains.
    3. Console Mode Detection:
       - If running with console.EmailBackend, notes that credentials are not configured in live environment.
    """
    # 1. Check HTTP Providers (Port 443)
    resend_key = getattr(settings, 'RESEND_API_KEY', '').strip()
    if resend_key:
        try:
            from_addr = "CardaLink Exports <onboarding@resend.dev>"
            custom_from = getattr(settings, 'DEFAULT_FROM_EMAIL', '')
            if custom_from and 'resend.dev' not in custom_from and '@' in custom_from and 'no-reply@cardalink.com' not in custom_from:
                from_addr = custom_from

            res = requests.post(
                "https://api.resend.com/emails",
                headers={
                    "Authorization": f"Bearer {resend_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "from": from_addr,
                    "to": [recipient_email],
                    "subject": subject,
                    "html": html_message,
                    "text": plain_message
                },
                timeout=10
            )
            if res.status_code in [200, 201]:
                return {"success": True, "message": f"Confirmation email sent to {recipient_email} via Resend."}
            else:
                logger.warning(f"Resend API error ({res.status_code}): {res.text}")
        except Exception as e:
            logger.warning(f"Resend dispatch failed: {e}")

    brevo_key = getattr(settings, 'BREVO_API_KEY', '').strip()
    if brevo_key:
        try:
            sender_email = getattr(settings, 'EMAIL_HOST_USER', '').strip()
            if not sender_email or '@' not in sender_email:
                default_from = getattr(settings, 'DEFAULT_FROM_EMAIL', '')
                if '<' in default_from and '>' in default_from:
                    sender_email = default_from.split('<')[1].split('>')[0].strip()
                elif '@' in default_from:
                    sender_email = default_from.strip()
            if not sender_email or '@' not in sender_email:
                sender_email = 'angel.renoy19@gmail.com'

            sender_name = "CardaLink Exports"
            default_from = getattr(settings, 'DEFAULT_FROM_EMAIL', '')
            if '<' in default_from:
                sender_name = default_from.split('<')[0].strip() or sender_name

            res = requests.post(
                "https://api.brevo.com/v3/smtp/email",
                headers={
                    "api-key": brevo_key,
                    "Content-Type": "application/json"
                },
                json={
                    "sender": {"name": sender_name, "email": sender_email},
                    "to": [{"email": recipient_email}],
                    "subject": subject,
                    "htmlContent": html_message,
                    "textContent": plain_message
                },
                timeout=10
            )
            if res.status_code in [200, 201]:
                return {"success": True, "message": f"Confirmation email sent to {recipient_email} via Brevo."}
            else:
                logger.warning(f"Brevo API error ({res.status_code}): {res.text}")
                return {
                    "success": False,
                    "error": f"BREVO_API_ERROR_{res.status_code}",
                    "message": f"Brevo API error ({res.status_code}): {res.text}"
                }
        except Exception as e:
            logger.warning(f"Brevo dispatch failed: {e}")
            return {
                "success": False,
                "error": "BREVO_EXCEPTION",
                "message": f"Brevo dispatch failed: {str(e)}"
            }

    # 2. Check SMTP Credentials
    email_user = getattr(settings, 'EMAIL_HOST_USER', '').strip()
    email_pwd = getattr(settings, 'EMAIL_HOST_PASSWORD', '').strip()
    backend_name = getattr(settings, 'EMAIL_BACKEND', '')

    if not (email_user and email_pwd) or 'console' in backend_name.lower():
        logger.warning(f"Email credentials missing in environment variables. Email was logged to console simulation, not delivered to {recipient_email}.")
        return {
            "success": False,
            "error": "SMTP_NOT_CONFIGURED",
            "message": "Email credentials (EMAIL_HOST_USER, EMAIL_HOST_PASSWORD) are not set in the live environment variables. Please add them in the Render Dashboard."
        }

    from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', None) or f"CardaLink Exports <{email_user}>"

    try:
        send_mail(
            subject=subject,
            message=plain_message,
            from_email=from_email,
            recipient_list=[recipient_email],
            html_message=html_message,
            fail_silently=False
        )
        return {
            "success": True,
            "message": f"Confirmation email sent to {recipient_email}"
        }
    except Exception as e:
        err_msg = str(e)
        logger.warning(f"SMTP dispatch to {recipient_email} failed: {err_msg}")
        if any(kw in err_msg.lower() for kw in ['timeout', 'connection timed out', 'connection refused', 'network is unreachable', '111', '110']):
            friendly = "SMTP connection failed: Outbound ports 587/465 appear blocked or restricted by the cloud host. Render blocks standard SMTP on free instances. Add a RESEND_API_KEY in Render Environment Variables for guaranteed delivery over HTTPS."
        elif '535' in err_msg:
            friendly = "Google SMTP authentication failed: Invalid App Password. Please generate a 16-character App Password at https://myaccount.google.com/apppasswords."
        elif '553' in err_msg or '5.7.1' in err_msg:
            friendly = f"Google SMTP rejected sender address: DEFAULT_FROM_EMAIL must match your Gmail address ({email_user})."
        else:
            friendly = f"Could not send email to {recipient_email} via SMTP: {err_msg}"

        return {
            "success": False,
            "error": err_msg,
            "message": friendly
        }



def hash_token(raw_token: str) -> str:
    """Computes SHA-256 hash of raw token."""
    return hashlib.sha256(raw_token.strip().encode('utf-8')).hexdigest()


def generate_delivery_token(export_order: ExportOrder, expiry_hours: int = None, token_type: str = 'ORDER_CONFIRM'):
    """
    Generates a secure, expiring, single-use token for buyer order confirmation or delivery review.
    Invalidates any previous active tokens of the given token_type for this order.
    Returns (raw_token, token_obj).
    """
    if expiry_hours is None:
        expiry_hours = getattr(settings, 'DELIVERY_CONFIRMATION_EXPIRY_HOURS', 72)

    with transaction.atomic():
        # Invalidate / revoke any prior active tokens of this type for this order
        BuyerDeliveryToken.objects.filter(
            export_order=export_order,
            token_type=token_type,
            is_used=False,
            is_revoked=False
        ).update(
            is_revoked=True,
            revoked_at=timezone.now()
        )

        raw_token = secrets.token_urlsafe(32)
        token_hash = hash_token(raw_token)
        expires_at = timezone.now() + timedelta(hours=expiry_hours)

        recipient_email = export_order.email or (export_order.buyer.email if export_order.buyer else '')

        token_obj = BuyerDeliveryToken.objects.create(
            export_order=export_order,
            buyer=export_order.buyer,
            token_type=token_type,
            token_hash=token_hash,
            expires_at=expires_at,
            sent_to_email=recipient_email or 'unknown@buyer.com',
            is_used=False,
            is_revoked=False
        )

    return raw_token, token_obj


def send_order_confirmation_email(export_order: ExportOrder, raw_token: str):
    """
    STAGE 1: Sends the initial order confirmation email to the International Buyer.
    Button in email says 'Confirm Order'.
    """
    recipient_email = export_order.email or (export_order.buyer.email if export_order.buyer else '')
    if not recipient_email:
        return {
            "success": False,
            "error": "No email address found for this export order's buyer.",
            "message": "Buyer email address is missing."
        }

    frontend_base = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173').rstrip('/')
    confirmation_link = f"{frontend_base}/confirm-delivery/{raw_token}"

    buyer_name = export_order.buyer_name or 'Valued Customer'
    exporter_name = getattr(export_order.exporter, 'company_name', None) or export_order.exporter.full_name

    subject = f"CardaLink — Please Confirm Export Order {export_order.order_code}"

    plain_message = f"""Dear {buyer_name},

Export Order {export_order.order_code} has been initiated by {exporter_name}.

Order Details:
- Order ID: {export_order.order_code}
- Exporter: {exporter_name}
- Product: {export_order.cardamom_variety} ({export_order.grade})
- Quantity: {export_order.quantity_kg} KG
- Destination: {export_order.destination_port}, {export_order.destination_country}
- Incoterms: {export_order.incoterms}

Please verify the order details and confirm your purchase by clicking the link below:
{confirmation_link}

IMPORTANT NOTICE:
- This is a secure, single-use confirmation link valid for 72 hours.
- No registration or login is required.

Best regards,
CardaLink Global Spice Export Network
"""

    html_message = f"""
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F4F7F4; margin: 0; padding: 20px; color: #1A202C; }}
    .container {{ max-width: 600px; margin: 0 auto; background-color: #FFFFFF; border-radius: 16px; border: 1px solid #E2E8F0; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }}
    .header {{ background-color: #1B4D2E; color: #FFFFFF; padding: 24px 32px; text-align: left; }}
    .header h1 {{ margin: 0; font-size: 22px; font-weight: 800; }}
    .header p {{ margin: 6px 0 0; font-size: 13px; color: #A5D6A7; }}
    .content {{ padding: 32px; }}
    .card {{ background-color: #F8FAF8; border-radius: 12px; border: 1px solid #E5EBE5; padding: 20px; margin: 20px 0; }}
    .row {{ display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #EDF2F7; font-size: 14px; }}
    .row:last-child {{ border-bottom: none; }}
    .label {{ color: #718096; font-weight: 600; }}
    .val {{ color: #1A202C; font-weight: 700; text-align: right; }}
    .btn {{ display: inline-block; background-color: #16A34A; color: #FFFFFF !important; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-weight: 800; font-size: 15px; margin: 20px 0; text-align: center; }}
    .notice {{ font-size: 12px; color: #718096; line-height: 1.6; margin-top: 24px; padding-top: 16px; border-top: 1px solid #E2E8F0; }}
    .footer {{ background-color: #F8FAF8; padding: 16px 32px; text-align: center; font-size: 12px; color: #A0AEC0; }}
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>CardaLink Export Network</h1>
      <p>Smart Cardamom Plantation and Export Management System</p>
    </div>
    <div class="content">
      <h2 style="font-size: 18px; color: #1B4D2E; margin-top: 0;">Please Confirm Your Export Order</h2>
      <p style="font-size: 14px; line-height: 1.6;">Dear <strong>{buyer_name}</strong>,</p>
      <p style="font-size: 14px; line-height: 1.6;">Your cardamom export order <strong>{export_order.order_code}</strong> has been initiated by <strong>{exporter_name}</strong>. Please review the details below and confirm your order:</p>
      
      <div class="card">
        <div class="row"><span class="label">Order Code</span><span class="val">{export_order.order_code}</span></div>
        <div class="row"><span class="label">Cardamom Variety</span><span class="val">{export_order.cardamom_variety} ({export_order.grade})</span></div>
        <div class="row"><span class="label">Ordered Quantity</span><span class="val">{export_order.quantity_kg} KG</span></div>
        <div class="row"><span class="label">Destination</span><span class="val">{export_order.destination_port}, {export_order.destination_country}</span></div>
        <div class="row"><span class="label">Incoterms</span><span class="val">{export_order.incoterms}</span></div>
      </div>

      <div style="text-align: center;">
        <a href="{confirmation_link}" class="btn">Confirm Order</a>
      </div>

      <div class="notice">
        <strong>Security &amp; Expiry Notice:</strong><br>
        This link is cryptographically secured, single-use, and valid for <strong>72 hours</strong>. No login or registration is required.
      </div>
    </div>
    <div class="footer">
      CardaLink &copy; 2026. Secure Cardamom Export Management. All rights reserved.
    </div>
  </div>
</body>
</html>
"""

    res = dispatch_cardalink_email(
        subject=subject,
        plain_message=plain_message,
        html_message=html_message,
        recipient_email=recipient_email
    )
    res["link"] = confirmation_link
    return res



def send_delivery_review_email(export_order: ExportOrder, raw_token: str):
    """
    STAGE 2: Sends the Delivery Review & Condition Confirmation email to the International Buyer
    after the shipment has been manually marked DELIVERED by the exporter.
    """
    recipient_email = export_order.email or (export_order.buyer.email if export_order.buyer else '')
    if not recipient_email:
        return {
            "success": False,
            "error": "No email address found for this export order's buyer.",
            "message": "Buyer email address is missing."
        }

    frontend_base = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173').rstrip('/')
    confirmation_link = f"{frontend_base}/confirm-delivery/{raw_token}"

    latest_shipment = export_order.shipments.order_by('-created_at').first()
    tracking_number = latest_shipment.tracking_number if latest_shipment else 'N/A'
    carrier = latest_shipment.carrier if latest_shipment else (export_order.shipment_method or 'Freight')
    shipment_date = latest_shipment.dispatch_date if latest_shipment else (export_order.expected_shipment_date or export_order.order_date)

    buyer_name = export_order.buyer_name or 'Valued Customer'
    exporter_name = getattr(export_order.exporter, 'company_name', None) or export_order.exporter.full_name

    subject = f"CardaLink — Shipment Delivered: Please Review Delivery & Confirm Condition for Order {export_order.order_code}"

    plain_message = f"""Dear {buyer_name},

Your cardamom shipment for Export Order {export_order.order_code} has arrived and been delivered by {exporter_name}.

Delivery & Cargo Details:
- Order ID: {export_order.order_code}
- Exporter: {exporter_name}
- Product: {export_order.cardamom_variety} ({export_order.grade})
- Delivered Quantity: {export_order.quantity_kg} KG
- Carrier: {carrier}
- Tracking Number: {tracking_number}
- Shipment Date: {shipment_date}
- Destination: {export_order.destination_port}, {export_order.destination_country}

Please inspect your delivery and submit your condition review, received quantity verification, and any feedback by clicking the secure link below:
{confirmation_link}

IMPORTANT NOTICE:
- Single-use link valid for 72 hours.
- If you received damaged pods or parcel shortages, you can report a problem and upload evidence directly using this link.

Best regards,
CardaLink Global Spice Export Network
"""

    html_message = f"""
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F4F7F4; margin: 0; padding: 20px; color: #1A202C; }}
    .container {{ max-width: 600px; margin: 0 auto; background-color: #FFFFFF; border-radius: 16px; border: 1px solid #E2E8F0; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }}
    .header {{ background-color: #0F5A2C; color: #FFFFFF; padding: 24px 32px; text-align: left; }}
    .header h1 {{ margin: 0; font-size: 22px; font-weight: 800; }}
    .header p {{ margin: 6px 0 0; font-size: 13px; color: #BBF7D0; }}
    .content {{ padding: 32px; }}
    .card {{ background-color: #F8FAF8; border-radius: 12px; border: 1px solid #E5EBE5; padding: 20px; margin: 20px 0; }}
    .row {{ display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #EDF2F7; font-size: 14px; }}
    .row:last-child {{ border-bottom: none; }}
    .label {{ color: #718096; font-weight: 600; }}
    .val {{ color: #1A202C; font-weight: 700; text-align: right; }}
    .btn {{ display: inline-block; background-color: #0F5A2C; color: #FFFFFF !important; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-weight: 800; font-size: 15px; margin: 20px 0; text-align: center; }}
    .notice {{ font-size: 12px; color: #718096; line-height: 1.6; margin-top: 24px; padding-top: 16px; border-top: 1px solid #E2E8F0; }}
    .footer {{ background-color: #F8FAF8; padding: 16px 32px; text-align: center; font-size: 12px; color: #A0AEC0; }}
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>CardaLink Export Network</h1>
      <p>Smart Cardamom Plantation and Export Management System</p>
    </div>
    <div class="content">
      <h2 style="font-size: 18px; color: #0F5A2C; margin-top: 0;">Shipment Delivered — Please Review &amp; Confirm Condition</h2>
      <p style="font-size: 14px; line-height: 1.6;">Dear <strong>{buyer_name}</strong>,</p>
      <p style="font-size: 14px; line-height: 1.6;">Your cardamom order <strong>{export_order.order_code}</strong> has arrived and reached delivery. Please inspect your goods and confirm the delivery condition and observations:</p>
      
      <div class="card">
        <div class="row"><span class="label">Order Code</span><span class="val">{export_order.order_code}</span></div>
        <div class="row"><span class="label">Cardamom Variety</span><span class="val">{export_order.cardamom_variety} ({export_order.grade})</span></div>
        <div class="row"><span class="label">Delivered Quantity</span><span class="val">{export_order.quantity_kg} KG</span></div>
        <div class="row"><span class="label">Carrier</span><span class="val">{carrier}</span></div>
        <div class="row"><span class="label">Tracking Number</span><span class="val">{tracking_number}</span></div>
        <div class="row"><span class="label">Shipment Date</span><span class="val">{shipment_date}</span></div>
        <div class="row"><span class="label">Destination</span><span class="val">{export_order.destination_port}, {export_order.destination_country}</span></div>
      </div>

      <div style="text-align: center;">
        <a href="{confirmation_link}" class="btn">Review Delivery &amp; Confirm Receipt</a>
      </div>

      <div class="notice">
        <strong>Security &amp; Expiry Notice:</strong><br>
        This link is cryptographically secured, single-use, and valid for <strong>72 hours</strong>. No login or registration is required.<br>
        If parcels arrived damaged or incomplete, you can report a delivery issue directly using this link.
      </div>
    </div>
    <div class="footer">
      CardaLink &copy; 2026. Secure Cardamom Export Management. All rights reserved.
    </div>
  </div>
</body>
</html>
"""

    res = dispatch_cardalink_email(
        subject=subject,
        plain_message=plain_message,
        html_message=html_message,
        recipient_email=recipient_email
    )
    res["link"] = confirmation_link
    return res



def send_delivery_confirmation_email(export_order: ExportOrder, raw_token: str, token_type: str = None):
    """
    Router that sends the appropriate email based on token_type or order delivery status.
    """
    if token_type == 'DELIVERY_REVIEW' or export_order.status in ['DELIVERED', 'ARRIVED']:
        return send_delivery_review_email(export_order, raw_token)
    return send_order_confirmation_email(export_order, raw_token)


def validate_token_and_get_details(raw_token: str):
    """
    Validates a raw delivery token and returns authorized order information.
    Determines whether this is Stage 1 (ORDER_CONFIRM) or Stage 2 (DELIVERY_REVIEW).
    """
    if not raw_token or not isinstance(raw_token, str):
        return {
            "valid": False,
            "code": "INVALID_TOKEN",
            "message": "Confirmation token is missing or malformed."
        }

    token_hash = hash_token(raw_token)
    try:
        token = BuyerDeliveryToken.objects.select_related('export_order', 'export_order__exporter', 'buyer').get(token_hash=token_hash)
    except BuyerDeliveryToken.DoesNotExist:
        return {
            "valid": False,
            "code": "INVALID_TOKEN",
            "message": "This confirmation link is invalid or does not exist."
        }

    if token.is_revoked:
        return {
            "valid": False,
            "code": "TOKEN_REVOKED",
            "message": "This confirmation link was replaced with a newer link or revoked by the exporter. Please check your latest email."
        }

    order = token.export_order

    # If the token was revoked and order is not confirmed yet, reject
    if token.is_revoked and not order.buyer_confirmed_order:
        return {
            "valid": False,
            "code": "TOKEN_REVOKED",
            "message": "This confirmation link was replaced with a newer link or revoked by the exporter. Please check your latest email."
        }

    # If order has NOT yet been confirmed by the buyer, enforce token expiry
    if not order.buyer_confirmed_order:
        if timezone.now() > token.expires_at:
            return {
                "valid": False,
                "code": "TOKEN_EXPIRED",
                "message": "This confirmation link has expired (validity was 72 hours). Please contact the exporter to request a replacement link."
            }

    latest_shipment = order.shipments.order_by('-created_at').first()

    exporter = order.exporter
    exporter_name = getattr(exporter, 'company_name', None) or exporter.full_name

    # Check existing delivery confirmation
    delivery_conf = None
    if hasattr(order, 'delivery_confirmation'):
        dc = order.delivery_confirmation
        delivery_conf = {
            "id": dc.id,
            "confirmation_reference": dc.confirmation_reference,
            "quantity_ordered_kg": str(dc.quantity_ordered_kg),
            "quantity_received_kg": str(dc.quantity_received_kg),
            "delivery_condition": dc.delivery_condition,
            "condition_display": dc.get_delivery_condition_display(),
            "comments": dc.comments,
            "is_dispute": dc.is_dispute,
            "confirmed_at": dc.confirmed_at.isoformat() if dc.confirmed_at else None,
            "evidence_file_url": dc.evidence_file.url if dc.evidence_file else None,
        }

    # Determine workflow stage:
    if not order.buyer_confirmed_order:
        stage = 'ORDER_CONFIRM'
    elif delivery_conf:
        stage = 'DELIVERY_CONFIRMED'
    elif order.status in ['DELIVERED', 'ARRIVED']:
        stage = 'DELIVERY_REVIEW'
    else:
        stage = 'LIVE_TRACKER'

    # Build quality records
    quality_records = [
        {
            "id": q.id,
            "moisture_percentage": str(q.moisture_percentage) if q.moisture_percentage is not None else '10.5',
            "size_mm": q.size_mm or '8mm',
            "color_appearance": q.color_appearance or 'Deep Green',
            "quality_status": q.quality_status or 'APPROVED',
            "inspection_date": q.inspection_date.isoformat() if q.inspection_date else None,
            "inspector_name": q.inspector_name or 'CardaLink Quality Inspector',
            "remarks": q.remarks or '',
        }
        for q in order.quality_records.all().order_by('-id')
    ]

    # Build packaging records
    packaging_records = [
        {
            "id": p.id,
            "packaging_type": p.packaging_type or 'Vacuum Pack',
            "number_of_packages": p.number_of_packages,
            "weight_per_package_kg": str(p.weight_per_package_kg),
            "total_quantity_kg": str(p.total_quantity_kg),
            "packaging_date": p.packaging_date.isoformat() if p.packaging_date else None,
            "batch_number": p.batch_number or order.batch_code,
            "notes": p.notes or '',
        }
        for p in order.packaging_records.all().order_by('-id')
    ]

    # Build export documents
    documents = [
        {
            "id": d.id,
            "document_type": d.document_type,
            "document_name": d.document_name,
            "document_number": d.document_number,
            "status": d.status,
            "issued_date": d.issued_date.isoformat() if d.issued_date else None,
        }
        for d in order.documents.all().order_by('-id')
    ]

    # Build shipment history
    shipments = [
        {
            "id": s.id,
            "carrier": s.carrier,
            "shipping_method": s.shipping_method,
            "tracking_number": s.tracking_number,
            "status": s.status,
            "origin": s.origin,
            "destination": s.destination,
            "dispatch_date": s.dispatch_date.isoformat() if s.dispatch_date else None,
            "estimated_delivery": s.estimated_delivery.isoformat() if s.estimated_delivery else None,
        }
        for s in order.shipments.all().order_by('-id')
    ]

    order_details = {
        "order_code": order.order_code,
        "exporter_name": exporter_name,
        "exporter_company_name": exporter_name,
        "exporter_email": exporter.email,
        "cardamom_variety": order.cardamom_variety,
        "variety_name": order.cardamom_variety,
        "grade": order.grade,
        "quantity_kg": str(order.quantity_kg),
        "quantity_ordered_kg": str(order.quantity_kg),
        "order_date": order.order_date.isoformat() if order.order_date else None,
        "shipment_date": str(latest_shipment.dispatch_date if latest_shipment else (order.expected_shipment_date or order.order_date)),
        "carrier": latest_shipment.carrier if latest_shipment else order.shipment_method,
        "tracking_number": latest_shipment.tracking_number if latest_shipment else 'N/A',
        "shipping_method": latest_shipment.shipping_method if latest_shipment else (order.shipment_method or 'SEA'),
        "origin_port": latest_shipment.origin if latest_shipment else 'Cochin Port, India',
        "destination_country": order.destination_country,
        "destination_port": order.destination_port,
        "incoterms": order.incoterms,
        "buyer_name": order.buyer_name,
        "company_name": order.company_name,
        "expires_at": token.expires_at.isoformat(),
        "token_expires_at": token.expires_at.isoformat(),
        "stage": stage,
        "token_type": token.token_type,
        "order_status": order.status,
        "buyer_confirmed_order": order.buyer_confirmed_order,
        "buyer_confirmed_order_at": order.buyer_confirmed_order_at.isoformat() if order.buyer_confirmed_order_at else None,
        "quality_records": quality_records,
        "packaging_records": packaging_records,
        "documents": documents,
        "shipments": shipments,
        "delivery_confirmation": delivery_conf,
    }

    return {
        "valid": True,
        "token_obj": token,
        "order": order,
        "order_details": order_details
    }


def confirm_buyer_order(
    raw_token: str,
    quantity_confirmed_kg: any = None,
    client_ip: str = None,
    user_agent: str = None
):
    """
    STAGE 1 Confirmation: Validates token and confirms buyer order acceptance.
    Updates order.buyer_confirmed_order = True and sets quantity.
    """
    if not raw_token or not isinstance(raw_token, str):
        return {"success": False, "code": "INVALID_TOKEN", "message": "Confirmation token is required."}

    token_hash = hash_token(raw_token)

    with transaction.atomic():
        try:
            token = BuyerDeliveryToken.objects.select_for_update().get(token_hash=token_hash)
        except BuyerDeliveryToken.DoesNotExist:
            return {"success": False, "code": "INVALID_TOKEN", "message": "This confirmation token is invalid."}

        if token.is_revoked:
            return {"success": False, "code": "TOKEN_REVOKED", "message": "This confirmation link has been revoked or replaced."}

        if token.is_used:
            return {"success": False, "code": "ORDER_ALREADY_CONFIRMED", "message": "This export order has already been confirmed."}

        if timezone.now() > token.expires_at:
            return {"success": False, "code": "TOKEN_EXPIRED", "message": "This confirmation link has expired."}

        order = ExportOrder.objects.select_for_update().get(id=token.export_order_id)

        # Validate confirmed quantity if provided
        qty_val = order.quantity_kg
        if quantity_confirmed_kg is not None and str(quantity_confirmed_kg).strip() != '':
            try:
                parsed_qty = Decimal(str(quantity_confirmed_kg).strip())
                if parsed_qty <= Decimal('0'):
                    return {"success": False, "code": "INVALID_QUANTITY", "message": "Quantity must be greater than 0 KG."}
                qty_val = parsed_qty
                order.quantity_kg = qty_val
                if order.price_per_kg:
                    order.total_value_usd = (qty_val * order.price_per_kg).quantize(Decimal('0.01'))
            except (InvalidOperation, TypeError, ValueError):
                return {"success": False, "code": "INVALID_QUANTITY", "message": "Please enter a valid numeric quantity."}

        order.buyer_confirmed_order = True
        order.buyer_confirmed_order_at = timezone.now()
        order.save()

        token.is_used = True
        token.used_at = timezone.now()
        token.save()

        # Create system notification for Exporter
        NotificationItem.objects.create(
            recipient=order.exporter,
            title=f"Order Confirmed: {order.order_code}",
            message=f"Buyer {order.buyer_name} confirmed Export Order {order.order_code} for {qty_val} KG of {order.cardamom_variety}.",
            category='EXPORT_ORDER'
        )

    return {
        "success": True,
        "code": "ORDER_CONFIRMED_SUCCESS",
        "stage": "ORDER_CONFIRM",
        "message": f"Export Order {order.order_code} has been successfully confirmed. Thank you!",
        "confirmation": {
            "order_code": order.order_code,
            "buyer_name": order.buyer_name,
            "confirmed_at": order.buyer_confirmed_order_at.isoformat(),
            "quantity_ordered_kg": str(order.quantity_kg),
            "variety": order.cardamom_variety,
            "grade": order.grade,
        }
    }


def confirm_buyer_delivery(
    raw_token: str,
    quantity_received_kg: any,
    delivery_condition: str,
    comments: str = '',
    evidence_file = None,
    client_ip: str = None,
    user_agent: str = None
):
    """
    STAGE 2 Confirmation: Validates token and saves buyer delivery review and condition.
    Atomically creates BuyerDeliveryConfirmation and updates order status.
    """
    if not raw_token or not isinstance(raw_token, str):
        return {"success": False, "code": "INVALID_TOKEN", "message": "Confirmation token is required."}

    # Validate condition choice
    valid_conditions = {'GOOD', 'PARTIAL', 'DAMAGED'}
    condition_clean = str(delivery_condition or '').strip().upper()
    if condition_clean not in valid_conditions:
        return {
            "success": False,
            "code": "INVALID_CONDITION",
            "message": "Delivery condition must be one of: Received in Good Condition, Partial Delivery, Damaged Goods."
        }

    # Validate quantity received
    try:
        qty_received = Decimal(str(quantity_received_kg).strip())
        if qty_received < 0:
            return {"success": False, "code": "INVALID_QUANTITY", "message": "Quantity received cannot be negative."}
        if qty_received > Decimal('999999.99'):
            return {"success": False, "code": "INVALID_QUANTITY", "message": "Quantity received value is unreasonably large."}
    except (InvalidOperation, TypeError, ValueError):
        return {"success": False, "code": "INVALID_QUANTITY", "message": "Please enter a valid numeric received quantity."}

    # Validate evidence file if provided
    evidence_name = ''
    if evidence_file:
        file_name = getattr(evidence_file, 'name', '')
        ext = '.' + file_name.split('.')[-1].lower() if '.' in file_name else ''
        if ext not in ALLOWED_EVIDENCE_EXTENSIONS:
            return {
                "success": False,
                "code": "INVALID_FILE_TYPE",
                "message": f"Invalid file format '{ext}'. Allowed formats: PDF, JPG, PNG, WEBP."
            }
        if getattr(evidence_file, 'size', 0) > MAX_EVIDENCE_SIZE_BYTES:
            return {
                "success": False,
                "code": "FILE_TOO_LARGE",
                "message": "Uploaded evidence file exceeds the 10 MB size limit."
            }
        evidence_name = file_name

    token_hash = hash_token(raw_token)

    with transaction.atomic():
        try:
            token = BuyerDeliveryToken.objects.select_for_update().get(token_hash=token_hash)
        except BuyerDeliveryToken.DoesNotExist:
            return {"success": False, "code": "INVALID_TOKEN", "message": "This confirmation token is invalid."}

        if token.is_revoked:
            return {"success": False, "code": "TOKEN_REVOKED", "message": "This confirmation link has been revoked or replaced."}

        order = ExportOrder.objects.select_for_update().get(id=token.export_order_id)

        # Ensure order does not already have a confirmation
        if BuyerDeliveryConfirmation.objects.filter(export_order=order).exists():
            return {"success": False, "code": "ALREADY_CONFIRMED", "message": "A delivery confirmation for this order has already been recorded."}

        if token.is_used:
            # If the token was previously used for initial order confirmation, allow it for final delivery review
            # once the shipment has been marked DELIVERED or ARRIVED
            if token.token_type == 'ORDER_CONFIRM' and order.status in ['DELIVERED', 'ARRIVED']:
                pass
            else:
                return {"success": False, "code": "ALREADY_USED", "message": "Receipt for this order has already been confirmed."}

        # Determine dispute vs full delivery
        is_dispute = (condition_clean in ('PARTIAL', 'DAMAGED')) or (qty_received < order.quantity_kg)
        new_order_status = 'DELIVERY_DISPUTE' if is_dispute else 'DELIVERED'

        # Generate unique confirmation reference
        confirmation_ref = f"CFM-EXP-{secrets.token_hex(4).upper()}"

        # Create confirmation record
        confirmation = BuyerDeliveryConfirmation.objects.create(
            export_order=order,
            buyer=token.buyer or order.buyer,
            token=token,
            confirmation_reference=confirmation_ref,
            quantity_ordered_kg=order.quantity_kg,
            quantity_received_kg=qty_received,
            delivery_condition=condition_clean,
            comments=(comments or '').strip(),
            evidence_file=evidence_file if evidence_file else None,
            evidence_file_name=evidence_name,
            is_dispute=is_dispute,
            ip_address=client_ip,
            user_agent=user_agent[:255] if user_agent else None
        )

        token.is_used = True
        token.used_at = timezone.now()
        token.save()

        order.status = new_order_status
        order.save()

        latest_shipment = order.shipments.order_by('-created_at').first()
        if latest_shipment:
            latest_shipment.status = new_order_status
            latest_shipment.save()

        condition_label = dict(BuyerDeliveryConfirmation.CONDITION_CHOICES).get(condition_clean, condition_clean)
        dispute_text = " [ATTENTION: Dispute/Discrepancy Reported]" if is_dispute else ""
        NotificationItem.objects.create(
            recipient=order.exporter,
            title=f"Delivery Confirmed: {order.order_code}{dispute_text}",
            message=(
                f"Buyer {order.buyer_name} confirmed receipt for order {order.order_code}. "
                f"Condition: {condition_label}. Received: {qty_received} KG of {order.quantity_kg} KG. "
                f"Ref: {confirmation_ref}."
            ),
            category='SHIPMENT'
        )

    return {
        "success": True,
        "code": "CONFIRMED_SUCCESS",
        "stage": "DELIVERY_REVIEW",
        "message": "Delivery receipt and condition review successfully submitted. Thank you!",
        "confirmation": {
            "reference": confirmation.confirmation_reference,
            "order_code": order.order_code,
            "confirmed_at": confirmation.confirmed_at.isoformat(),
            "quantity_ordered_kg": str(confirmation.quantity_ordered_kg),
            "quantity_received_kg": str(confirmation.quantity_received_kg),
            "delivery_condition": confirmation.delivery_condition,
            "is_dispute": confirmation.is_dispute,
            "status": new_order_status
        }
    }


# Rate Limiting In-Memory Store
_RATE_LIMIT_STORE = {}
RATE_LIMIT_MAX_REQUESTS = 20
RATE_LIMIT_WINDOW_SECONDS = 60


def get_client_ip(request) -> str:
    """Extracts client IP address safely from request headers."""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0].strip()
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip or '127.0.0.1'


def is_rate_limited(client_ip: str, action: str = 'validate') -> bool:
    """Checks if a client IP has exceeded request rate limit for an action."""
    import time
    if not client_ip:
        return False

    key = f"{action}:{client_ip}"
    now = time.time()
    timestamps = _RATE_LIMIT_STORE.get(key, [])

    valid_timestamps = [t for t in timestamps if now - t < RATE_LIMIT_WINDOW_SECONDS]

    if len(valid_timestamps) >= RATE_LIMIT_MAX_REQUESTS:
        _RATE_LIMIT_STORE[key] = valid_timestamps
        return True

    valid_timestamps.append(now)
    _RATE_LIMIT_STORE[key] = valid_timestamps
    return False

import json
from decimal import Decimal
from datetime import timedelta
from django.test import TestCase, Client
from django.utils import timezone
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework import status

from iam.models import (
    User,
    InternationalBuyer,
    ExportOrder,
    BuyerDeliveryToken,
    BuyerDeliveryConfirmation,
    ShipmentRecord,
)
from iam.auth import generate_jwt_token
from iam.delivery_service import (
    generate_delivery_token,
    validate_token_and_get_details,
    confirm_buyer_delivery,
    send_delivery_confirmation_email,
)


class BuyerDeliveryConfirmationTests(TestCase):
    """
    Automated test suite verifying the 16 core requirements for
    secure single-use buyer delivery confirmation.
    """

    def setUp(self):
        self.client = Client()

        # 1. Create Exporter User
        self.exporter = User.objects.create(
            full_name="Spice Global Exports",
            email="exporter@cardalink.test",
            phone="+919876543210",
            role="EXPORTER",
            password_hash="testpasshash",
            is_verified=True,
            status="APPROVED",
        )
        self.exporter_token = generate_jwt_token(self.exporter)

        # 2. Create Another Exporter (for unauthorized access test)
        self.other_exporter = User.objects.create(
            full_name="Other Trading Co",
            email="other@cardalink.test",
            phone="+919876543211",
            role="EXPORTER",
            password_hash="testpasshash",
            is_verified=True,
            status="APPROVED",
        )
        self.other_exporter_token = generate_jwt_token(self.other_exporter)

        # 3. Create International Buyer
        self.buyer = InternationalBuyer.objects.create(
            exporter=self.exporter,
            name="Al-Zahra Spices LLC",
            company_name="Al-Zahra Group",
            country="United Arab Emirates",
            email="buyer@alzahra.ae",
            phone="+971501234567",
            address="Deira Souk, Dubai",
        )

        # 4. Create Export Order
        self.order = ExportOrder.objects.create(
            order_code="ORD-EXP-TEST-001",
            exporter=self.exporter,
            buyer=self.buyer,
            buyer_name=self.buyer.name,
            company_name=self.buyer.company_name,
            email=self.buyer.email,
            destination_country="United Arab Emirates",
            destination_port="Jebel Ali Port",
            cardamom_variety="Njallani Green Gold",
            grade="AGEB 8mm",
            quantity_kg=Decimal("500.00"),
            price_per_kg=Decimal("35.00"),
            total_value_usd=Decimal("17500.00"),
            order_date=timezone.now().date(),
            payment_status="PENDING",
            status="SHIPPED",
        )

    # 1. Valid token opens correct order
    def test_valid_token_opens_correct_order(self):
        raw_token, token_obj = generate_delivery_token(self.order)
        response = self.client.get(f"/api/buyer/delivery/validate/{raw_token}")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        res_data = response.json()
        self.assertTrue(res_data["success"])
        order_details = res_data["data"]["order"]
        self.assertEqual(order_details["order_code"], self.order.order_code)
        self.assertEqual(float(order_details["quantity_ordered_kg"]), 500.0)
        self.assertEqual(order_details["buyer_name"], "Al-Zahra Spices LLC")

    # 2. Invalid token is rejected
    def test_invalid_token_is_rejected(self):
        fake_token = "completely_invalid_random_token_string_12345"
        response = self.client.get(f"/api/buyer/delivery/validate/{fake_token}")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        res_data = response.json()
        self.assertFalse(res_data["success"])
        self.assertEqual(res_data["code"], "INVALID_TOKEN")

    # 3. Expired token is rejected
    def test_expired_token_is_rejected(self):
        raw_token, token_obj = generate_delivery_token(self.order)
        # Set token expiry to 2 hours in the past
        token_obj.expires_at = timezone.now() - timedelta(hours=2)
        token_obj.save()

        response = self.client.get(f"/api/buyer/delivery/validate/{raw_token}")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        res_data = response.json()
        self.assertFalse(res_data["success"])
        self.assertEqual(res_data["code"], "TOKEN_EXPIRED")

    # 4. Used token cannot be reused
    def test_used_token_cannot_be_reused(self):
        raw_token, token_obj = generate_delivery_token(self.order)

        # Confirm order receipt first time
        confirm_resp = self.client.post(
            "/api/buyer/delivery/confirm",
            data={
                "token": raw_token,
                "quantity_received_kg": "500.00",
                "delivery_condition": "GOOD",
                "comments": "Received in pristine condition.",
            },
        )
        self.assertEqual(confirm_resp.status_code, status.HTTP_201_CREATED)

        # Second validation attempt on the same token must fail
        val_resp = self.client.get(f"/api/buyer/delivery/validate/{raw_token}")
        self.assertEqual(val_resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(val_resp.json()["code"], "ALREADY_USED")

        # Second confirmation attempt on the same token must fail
        second_confirm = self.client.post(
            "/api/buyer/delivery/confirm",
            data={
                "token": raw_token,
                "quantity_received_kg": "500.00",
                "delivery_condition": "GOOD",
            },
        )
        self.assertEqual(second_confirm.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(second_confirm.json()["code"], "ALREADY_USED")

    # 5. Replacement token invalidates previous token
    def test_replacement_token_invalidates_previous_token(self):
        first_raw_token, first_token_obj = generate_delivery_token(self.order)
        # Generate replacement token
        second_raw_token, second_token_obj = generate_delivery_token(self.order)

        # Verify first token is revoked in DB
        first_token_obj.refresh_from_db()
        self.assertTrue(first_token_obj.is_revoked)

        # First token should now be rejected as REVOKED / INVALID
        first_resp = self.client.get(f"/api/buyer/delivery/validate/{first_raw_token}")
        self.assertEqual(first_resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(first_resp.json()["code"], "TOKEN_REVOKED")

        # Second token must be valid
        second_resp = self.client.get(f"/api/buyer/delivery/validate/{second_raw_token}")
        self.assertEqual(second_resp.status_code, status.HTTP_200_OK)

    # 6. Buyer confirms correct received quantity
    def test_buyer_confirms_correct_received_quantity(self):
        raw_token, token_obj = generate_delivery_token(self.order)
        confirm_resp = self.client.post(
            "/api/buyer/delivery/confirm",
            data={
                "token": raw_token,
                "quantity_received_kg": "498.50",
                "delivery_condition": "GOOD",
                "comments": "Weighed on calibrated warehouse scale.",
            },
        )
        self.assertEqual(confirm_resp.status_code, status.HTTP_201_CREATED)
        confirmation = BuyerDeliveryConfirmation.objects.get(export_order=self.order)
        self.assertEqual(confirmation.quantity_received_kg, Decimal("498.50"))
        self.assertEqual(confirmation.comments, "Weighed on calibrated warehouse scale.")

    # 7. Full delivery updates status to DELIVERED
    def test_full_delivery_updates_status_correctly(self):
        raw_token, token_obj = generate_delivery_token(self.order)
        confirm_resp = self.client.post(
            "/api/buyer/delivery/confirm",
            data={
                "token": raw_token,
                "quantity_received_kg": "500.00",
                "delivery_condition": "GOOD",
            },
        )
        self.assertEqual(confirm_resp.status_code, status.HTTP_201_CREATED)
        self.order.refresh_from_db()
        self.assertEqual(self.order.status, "DELIVERED")

    # 8. Partial delivery creates a delivery dispute
    def test_partial_delivery_creates_delivery_dispute(self):
        raw_token, token_obj = generate_delivery_token(self.order)
        confirm_resp = self.client.post(
            "/api/buyer/delivery/confirm",
            data={
                "token": raw_token,
                "quantity_received_kg": "420.00",
                "delivery_condition": "PARTIAL",
                "comments": "80 KG missing from shipment carton #4.",
            },
        )
        self.assertEqual(confirm_resp.status_code, status.HTTP_201_CREATED)
        self.order.refresh_from_db()
        self.assertEqual(self.order.status, "DELIVERY_DISPUTE")
        confirmation = BuyerDeliveryConfirmation.objects.get(export_order=self.order)
        self.assertTrue(confirmation.is_dispute)
        self.assertEqual(confirmation.delivery_condition, "PARTIAL")

    # 9. Damaged goods create a delivery dispute
    def test_damaged_goods_create_delivery_dispute(self):
        raw_token, token_obj = generate_delivery_token(self.order)
        confirm_resp = self.client.post(
            "/api/buyer/delivery/confirm",
            data={
                "token": raw_token,
                "quantity_received_kg": "500.00",
                "delivery_condition": "DAMAGED",
                "comments": "Packaging was torn with water damage.",
            },
        )
        self.assertEqual(confirm_resp.status_code, status.HTTP_201_CREATED)
        self.order.refresh_from_db()
        self.assertEqual(self.order.status, "DELIVERY_DISPUTE")
        confirmation = BuyerDeliveryConfirmation.objects.get(export_order=self.order)
        self.assertTrue(confirmation.is_dispute)
        self.assertEqual(confirmation.delivery_condition, "DAMAGED")

    # 10. Buyer cannot confirm another order using a different order ID
    def test_buyer_cannot_confirm_another_order(self):
        # Create second order belonging to other buyer
        other_order = ExportOrder.objects.create(
            order_code="ORD-EXP-TEST-002",
            exporter=self.exporter,
            buyer=self.buyer,
            buyer_name=self.buyer.name,
            quantity_kg=Decimal("1000.00"),
            total_value_usd=Decimal("35000.00"),
            order_date=timezone.now().date(),
            status="SHIPPED",
        )

        raw_token, token_obj = generate_delivery_token(self.order)

        # Attempt to confirm using token for self.order, but trying to pass other_order id
        confirm_resp = self.client.post(
            "/api/buyer/delivery/confirm",
            data={
                "token": raw_token,
                "order_id": other_order.id,  # Arbitrary foreign ID
                "quantity_received_kg": "500.00",
                "delivery_condition": "GOOD",
            },
        )
        self.assertEqual(confirm_resp.status_code, status.HTTP_201_CREATED)
        # self.order MUST be updated, other_order MUST NOT be updated
        self.order.refresh_from_db()
        other_order.refresh_from_db()
        self.assertEqual(self.order.status, "DELIVERED")
        self.assertEqual(other_order.status, "SHIPPED")
        self.assertFalse(hasattr(other_order, "delivery_confirmation"))

    # 11. Repeated submissions cannot duplicate confirmations
    def test_repeated_submissions_cannot_duplicate_confirmations(self):
        raw_token, token_obj = generate_delivery_token(self.order)

        # 1st call
        res1 = confirm_buyer_delivery(
            raw_token=raw_token,
            quantity_received_kg=Decimal("500.00"),
            delivery_condition="GOOD",
            comments="First submission",
        )
        self.assertTrue(res1["success"])

        # 2nd call
        res2 = confirm_buyer_delivery(
            raw_token=raw_token,
            quantity_received_kg=Decimal("300.00"),
            delivery_condition="DAMAGED",
            comments="Duplicate attempt",
        )
        self.assertFalse(res2["success"])
        self.assertEqual(res2["code"], "ALREADY_USED")

        # Confirm count in DB is exactly 1
        self.assertEqual(BuyerDeliveryConfirmation.objects.filter(export_order=self.order).count(), 1)

    # 12. Email configuration failure is handled gracefully
    def test_email_configuration_failure_handled_gracefully(self):
        raw_token, token_obj = generate_delivery_token(self.order)
        # Call send_delivery_confirmation_email with default/dummy environment
        res = send_delivery_confirmation_email(self.order, raw_token)
        # Must return dict with success boolean and confirmation link without throwing unhandled exception
        self.assertIn("success", res)
        self.assertIn("link", res)
        self.assertIn(raw_token, res["link"])

    # 13. Exporter can view saved confirmation details
    def test_exporter_can_view_saved_confirmation(self):
        raw_token, token_obj = generate_delivery_token(self.order)
        self.client.post(
            "/api/buyer/delivery/confirm",
            data={
                "token": raw_token,
                "quantity_received_kg": "500.00",
                "delivery_condition": "GOOD",
                "comments": "Received in good order.",
            },
        )

        response = self.client.get(
            f"/api/exporter/orders/{self.order.id}/delivery-confirmation",
            HTTP_AUTHORIZATION=f"Bearer {self.exporter_token}",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        res_data = response.json()
        self.assertTrue(res_data["success"])
        self.assertEqual(float(res_data["data"]["confirmation"]["quantity_received_kg"]), 500.0)

    # 14. Unauthorized users cannot resend confirmation emails
    def test_unauthorized_users_cannot_resend_confirmation(self):
        # Without auth header
        anon_resp = self.client.post(f"/api/exporter/orders/{self.order.id}/send-confirmation")
        self.assertEqual(anon_resp.status_code, status.HTTP_401_UNAUTHORIZED)

        # With other exporter auth header
        other_resp = self.client.post(
            f"/api/exporter/orders/{self.order.id}/send-confirmation",
            HTTP_AUTHORIZATION=f"Bearer {self.other_exporter_token}",
        )
        self.assertEqual(other_resp.status_code, status.HTTP_404_NOT_FOUND)

        # With authorized exporter
        auth_resp = self.client.post(
            f"/api/exporter/orders/{self.order.id}/send-confirmation",
            HTTP_AUTHORIZATION=f"Bearer {self.exporter_token}",
        )
        self.assertEqual(auth_resp.status_code, status.HTTP_200_OK)

    # 15. Payment status is not automatically changed to PAID
    def test_payment_status_is_not_automatically_changed(self):
        self.assertEqual(self.order.payment_status, "PENDING")
        raw_token, token_obj = generate_delivery_token(self.order)
        self.client.post(
            "/api/buyer/delivery/confirm",
            data={
                "token": raw_token,
                "quantity_received_kg": "500.00",
                "delivery_condition": "GOOD",
            },
        )
        self.order.refresh_from_db()
        self.assertEqual(self.order.status, "DELIVERED")
        # Payment status must remain PENDING
        self.assertEqual(self.order.payment_status, "PENDING")

    # 16. Proof of delivery evidence upload validation
    def test_proof_of_delivery_evidence_upload(self):
        raw_token, token_obj = generate_delivery_token(self.order)
        file_content = b"%PDF-1.4 Fake test PDF content for delivery confirmation receipt"
        uploaded_file = SimpleUploadedFile(
            "delivery_receipt.pdf",
            file_content,
            content_type="application/pdf",
        )

        confirm_resp = self.client.post(
            "/api/buyer/delivery/confirm",
            data={
                "token": raw_token,
                "quantity_received_kg": "500.00",
                "delivery_condition": "GOOD",
                "evidence_file": uploaded_file,
            },
        )
        self.assertEqual(confirm_resp.status_code, status.HTTP_201_CREATED)
        confirmation = BuyerDeliveryConfirmation.objects.get(export_order=self.order)
        self.assertTrue(bool(confirmation.evidence_file))

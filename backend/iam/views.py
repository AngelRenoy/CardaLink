import os
import re
import secrets
import urllib.parse
import requests
from django.db import connection, transaction
from django.shortcuts import redirect
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status

from django.db.models import Sum, Count, Q
from iam.models import (
    User, UserIdentity, AuditLog, CardamomVariety, Plantation, HarvestCycle, HarvestRecord,
    InventoryItem, AgrochemicalUsage, IrrigationRecord, ExpenseRecord,
    SaleRecord, TransactionRecord, ExportOrder, ExportDocument, ShipmentRecord, NotificationItem,
    MarketplaceListing, PurchaseRequest, ExportSupplyRequest
)
from iam.serializers import (
    UserSerializer, AuditLogSerializer, CardamomVarietySerializer, PlantationSerializer,
    HarvestCycleSerializer, HarvestRecordSerializer, InventoryItemSerializer, AgrochemicalUsageSerializer,
    IrrigationRecordSerializer, ExpenseRecordSerializer, SaleRecordSerializer,
    TransactionRecordSerializer, ExportOrderSerializer, ExportDocumentSerializer,
    ShipmentRecordSerializer, NotificationItemSerializer,
    MarketplaceListingSerializer, PurchaseRequestSerializer, ExportSupplyRequestSerializer
)

from iam.config import get_permissions_for_role, PERMISSIONS
from iam.auth import generate_jwt_token, hash_password, check_password, JWTAuthentication

def get_client_ip(request):
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        return x_forwarded_for.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR')

def send_response(status_code, message, data=None, success=True):
    payload = {'success': success, 'message': message}
    if data is not None:
        payload['data'] = data
    return Response(payload, status=status_code)

def send_error(status_code, message):
    return Response({'success': False, 'message': message}, status=status_code)

# 1. Registration Endpoint
@api_view(['POST'])
@authentication_classes([])
@permission_classes([AllowAny])
def register(request):
    body = request.data
    full_name = (body.get('full_name') or '').strip()
    email = (body.get('email') or '').strip().lower()
    phone = (body.get('phone') or '').strip()
    password = body.get('password') or ''
    confirm_password = body.get('confirmPassword') or ''
    role = (body.get('role') or '').strip().upper()

    if not full_name or len(full_name) < 2 or len(full_name) > 150:
        return send_error(status.HTTP_400_BAD_REQUEST, 'Full name must be between 2 and 150 characters')

    email_regex = r'^[^\s@]+@[^\s@]+\.[^\s@]+$'
    if not email or not re.match(email_regex, email):
        return send_error(status.HTTP_400_BAD_REQUEST, 'Please enter a valid email address')

    clean_phone = re.sub(r'[\s\-]', '', phone)
    indian_phone_regex = r'^(\+91)?[6789]\d{9}$'
    if not clean_phone or not re.match(indian_phone_regex, clean_phone):
        return send_error(status.HTTP_400_BAD_REQUEST, 'Please enter a valid phone number')

    formatted_phone = clean_phone if clean_phone.startswith('+91') else f'+91{clean_phone}'

    if not password or len(password) < 8:
        return send_error(status.HTTP_400_BAD_REQUEST, 'Password must be at least 8 characters')

    password_complexity_regex = r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};\':"\\|,.<>\/?]).{8,}$'
    if not re.match(password_complexity_regex, password):
        return send_error(status.HTTP_400_BAD_REQUEST, 'Password must contain uppercase, lowercase, number and special character')

    if password != confirm_password:
        return send_error(status.HTTP_400_BAD_REQUEST, 'Passwords do not match')

    allowed_roles = ['FARMER', 'TRADER', 'EXPORTER']
    if not role or role not in allowed_roles:
        return send_error(status.HTTP_400_BAD_REQUEST, 'Invalid role selection. Admin registration is not allowed')

    if User.objects.filter(email=email).exists():
        return send_error(status.HTTP_400_BAD_REQUEST, 'Email is already registered')

    password_hash = hash_password(password)
    user = User.objects.create(
        full_name=full_name,
        email=email,
        phone=formatted_phone,
        role=role,
        password_hash=password_hash,
        status='APPROVED'
    )

    AuditLog.objects.create(
        user=user,
        email=user.email,
        action='REGISTRATION',
        details=f'CardaLink {user.role} user registered successfully',
        ip_address=get_client_ip(request)
    )

    serializer = UserSerializer(user)
    return send_response(
        status.HTTP_201_CREATED,
        'Registration successful. Account created and ready for authentication.',
        {'user': serializer.data}
    )

# 2. Login Endpoint
@api_view(['POST'])
@authentication_classes([])
@permission_classes([AllowAny])
def login(request):
    body = request.data
    email = (body.get('email') or '').strip().lower()
    password = body.get('password') or ''

    if not email or not password:
        return send_error(status.HTTP_400_BAD_REQUEST, 'Email and password are required')

    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        AuditLog.objects.create(
            user=None, email=email, action='LOGIN_FAILED',
            details='Failed login attempt - user not found', ip_address=get_client_ip(request)
        )
        return send_error(status.HTTP_401_UNAUTHORIZED, 'Invalid email or password')

    chk = check_password(password, user.password_hash)
    if email == 'admin@cardalink.com':
        print(f"[DEBUG LOGIN] email={email}, pwd={password}, hash={user.password_hash}, check={chk}")

    if not chk:
        AuditLog.objects.create(
            user=user, email=user.email, action='LOGIN_FAILED',
            details='Failed login attempt - incorrect password', ip_address=get_client_ip(request)
        )
        return send_error(status.HTTP_401_UNAUTHORIZED, 'Invalid email or password')

    # Account Status Enforcement
    if user.status == 'PENDING':
        return send_error(status.HTTP_403_FORBIDDEN, 'Account registered but waiting for administrator approval')
    if user.status == 'REJECTED':
        return send_error(status.HTTP_403_FORBIDDEN, 'Your account application has been rejected')
    if user.status == 'SUSPENDED':
        return send_error(status.HTTP_403_FORBIDDEN, 'Your account has been suspended by system administration')
    if user.status != 'APPROVED':
        return send_error(status.HTTP_403_FORBIDDEN, f'Account status [{user.status}] is not permitted to log in')

    token = generate_jwt_token(user)

    AuditLog.objects.create(
        user=user, email=user.email, action='LOGIN_SUCCESS',
        details=f'User logged in via password authentication ({user.role})', ip_address=get_client_ip(request)
    )

    serializer = UserSerializer(user)
    resp = send_response(
        status.HTTP_200_OK,
        'IAM Authentication Successful',
        {'user': serializer.data, 'token': token}
    )
    resp.set_cookie(
        'cardalink_token', token, httponly=True, samesite='Lax', max_age=86400,
        secure=os.getenv('NODE_ENV') == 'production'
    )
    return resp

# 3. Initiate Google OAuth 2.0 Redirection
@api_view(['GET'])
@authentication_classes([])
@permission_classes([AllowAny])
def initiate_google_auth(request):
    google_client_id = os.getenv('GOOGLE_CLIENT_ID', '')
    frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:5173')
    callback_url = os.getenv('GOOGLE_CALLBACK_URL', 'http://localhost:5000/api/auth/google/callback')

    if not google_client_id:
        return redirect(f"{frontend_url}/login?error={urllib.parse.quote('Google OAuth Client ID is missing in backend/.env')}")

    params = {
        'client_id': google_client_id,
        'redirect_uri': callback_url,
        'response_type': 'code',
        'scope': 'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
        'access_type': 'offline',
        'prompt': 'select_account',
    }
    authorize_url = f"https://accounts.google.com/o/oauth2/v2/auth?{urllib.parse.urlencode(params)}"
    return redirect(authorize_url)

# 4. Handle Google OAuth 2.0 Callback
@api_view(['GET'])
@authentication_classes([])
@permission_classes([AllowAny])
def handle_google_callback(request):
    frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:5173')
    google_client_id = os.getenv('GOOGLE_CLIENT_ID', '')
    google_client_secret = os.getenv('GOOGLE_CLIENT_SECRET', '')
    callback_url = os.getenv('GOOGLE_CALLBACK_URL', 'http://localhost:5000/api/auth/google/callback')

    error_param = request.GET.get('error')
    if error_param:
        return redirect(f"{frontend_url}/login?error={urllib.parse.quote('Google authentication was cancelled or failed')}")

    code = request.GET.get('code')
    if not code:
        return redirect(f"{frontend_url}/login?error={urllib.parse.quote('Google OAuth authorization code missing')}")

    try:
        # Code exchange for tokens
        token_resp = requests.post(
            'https://oauth2.googleapis.com/token',
            data={
                'code': code,
                'client_id': google_client_id,
                'client_secret': google_client_secret,
                'redirect_uri': callback_url,
                'grant_type': 'authorization_code'
            },
            timeout=10
        )

        if token_resp.status_code != 200:
            return redirect(f"{frontend_url}/login?error={urllib.parse.quote('Failed to exchange authorization code with Google')}")

        token_data = token_resp.json()
        access_token = token_data.get('access_token')

        userinfo_resp = requests.get(
            'https://www.googleapis.com/oauth2/v3/userinfo',
            headers={'Authorization': f'Bearer {access_token}'},
            timeout=10
        )
        if userinfo_resp.status_code != 200:
            return redirect(f"{frontend_url}/login?error={urllib.parse.quote('Unable to retrieve verified profile from Google identity')}")

        google_user = userinfo_resp.json()
        google_sub = google_user.get('sub')
        google_email = (google_user.get('email') or '').strip().lower()
        google_name = google_user.get('name') or google_email.split('@')[0]

        if not google_email:
            return redirect(f"{frontend_url}/login?error={urllib.parse.quote('Unable to retrieve verified email from Google identity')}")

        # Check existing linked identity
        try:
            identity = UserIdentity.objects.get(provider='GOOGLE', provider_user_id=google_sub)
            linked_user = identity.user
            if linked_user.status != 'APPROVED':
                return redirect(f"{frontend_url}/login?error={urllib.parse.quote(f'Google account access denied: Status [{linked_user.status}]')}")

            token = generate_jwt_token(linked_user)
            AuditLog.objects.create(
                user=linked_user, email=linked_user.email, action='GOOGLE_LOGIN_SUCCESS',
                details=f'Google OAuth login for existing linked user ({linked_user.role})', ip_address=get_client_ip(request)
            )
            return redirect(f"{frontend_url}/login?token={token}&role={linked_user.role}")
        except UserIdentity.DoesNotExist:
            pass

        # Check existing email match
        try:
            existing_user = User.objects.get(email=google_email)
            UserIdentity.objects.get_or_create(user=existing_user, provider='GOOGLE', provider_user_id=google_sub)
            if existing_user.status != 'APPROVED':
                return redirect(f"{frontend_url}/login?error={urllib.parse.quote(f'Google account access denied: Status [{existing_user.status}]')}")

            token = generate_jwt_token(existing_user)
            AuditLog.objects.create(
                user=existing_user, email=existing_user.email, action='GOOGLE_LOGIN_SUCCESS',
                details=f'Linked Google identity to existing CardaLink user ({existing_user.role})', ip_address=get_client_ip(request)
            )
            return redirect(f"{frontend_url}/login?token={token}&role={existing_user.role}")
        except User.DoesNotExist:
            pass

        # New Google user requires role selection
        redirect_url = f"{frontend_url}/login?selectRole=true&email={urllib.parse.quote(google_email)}&name={urllib.parse.quote(google_name)}&sub={urllib.parse.quote(google_sub)}"
        return redirect(redirect_url)

    except Exception as err:
        print('[Google Callback Exception]:', err)
        return redirect(f"{frontend_url}/login?error={urllib.parse.quote('Google authentication error. Please try again.')}")

# 5. Confirm Role for New Google User
@api_view(['POST'])
@authentication_classes([])
@permission_classes([AllowAny])
def confirm_google_role(request):
    body = request.data
    role = (body.get('role') or '').strip().upper()
    email = (body.get('email') or '').strip().lower()
    name = (body.get('name') or '').strip()
    google_sub = (body.get('googleSub') or '').strip()

    allowed_roles = ['FARMER', 'TRADER', 'EXPORTER']
    if not role or role not in allowed_roles:
        return send_error(status.HTTP_400_BAD_REQUEST, 'Invalid role selection. Admin registration is not allowed')

    if not email or not google_sub:
        return send_error(status.HTTP_400_BAD_REQUEST, 'Missing verified Google identity information')

    # Check if user exists
    try:
        user = User.objects.get(email=email)
        UserIdentity.objects.get_or_create(user=user, provider='GOOGLE', provider_user_id=google_sub)
    except User.DoesNotExist:
        random_pwd = secrets.token_hex(16) + 'A1!'
        user = User.objects.create(
            full_name=name or email.split('@')[0],
            email=email,
            phone='+919999999999',
            role=role,
            password_hash=hash_password(random_pwd),
            status='APPROVED'
        )
        UserIdentity.objects.create(user=user, provider='GOOGLE', provider_user_id=google_sub)

    token = generate_jwt_token(user)
    AuditLog.objects.create(
        user=user, email=user.email, action='GOOGLE_REGISTRATION_SUCCESS',
        details=f'New Google user onboarded with role [{user.role}]', ip_address=get_client_ip(request)
    )

    serializer = UserSerializer(user)
    resp = send_response(
        status.HTTP_201_CREATED,
        'CardaLink account created and authenticated via Google',
        {'user': serializer.data, 'token': token}
    )
    resp.set_cookie(
        'cardalink_token', token, httponly=True, samesite='Lax', max_age=86400,
        secure=os.getenv('NODE_ENV') == 'production'
    )
    return resp

# 6. Legacy POST /api/auth/google
@api_view(['POST'])
@authentication_classes([])
@permission_classes([AllowAny])
def google_auth(request):
    return confirm_google_role(request)

# 7. Get Authoritative User Profile
@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def get_me(request):
    user = request.user
    serializer = UserSerializer(user)
    return send_response(status.HTTP_200_OK, 'IAM Identity & Session Verified', {'user': serializer.data})

# 8. Logout
@api_view(['POST'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def logout(request):
    if request.user:
        AuditLog.objects.create(
            user=request.user, email=request.user.email, action='LOGOUT',
            details='User logged out and IAM session terminated', ip_address=get_client_ip(request)
        )
    resp = send_response(status.HTTP_200_OK, 'IAM Session Terminated Successfully')
    resp.delete_cookie('cardalink_token')
    return resp

# 9. Change Password
@api_view(['POST'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def change_password(request):
    user = request.user
    current_password = request.data.get('currentPassword') or ''
    new_password = request.data.get('newPassword') or ''

    if not current_password or not new_password:
        return send_error(status.HTTP_400_BAD_REQUEST, 'Current password and new password are required')

    if len(new_password) < 8:
        return send_error(status.HTTP_400_BAD_REQUEST, 'New password must be at least 8 characters')

    password_complexity_regex = r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};\':"\\|,.<>\/?]).{8,}$'
    if not re.match(password_complexity_regex, new_password):
        return send_error(status.HTTP_400_BAD_REQUEST, 'New password must contain uppercase, lowercase, number and special character')

    if not check_password(current_password, user.password_hash):
        AuditLog.objects.create(
            user=user, email=user.email, action='PASSWORD_CHANGE_FAILED',
            details='Incorrect current password provided', ip_address=get_client_ip(request)
        )
        return send_error(status.HTTP_400_BAD_REQUEST, 'Current password is incorrect')

    user.password_hash = hash_password(new_password)
    user.save()

    AuditLog.objects.create(
        user=user, email=user.email, action='PASSWORD_CHANGED',
        details='Password updated successfully', ip_address=get_client_ip(request)
    )
    return send_response(status.HTTP_200_OK, 'Password changed successfully')

# 10. Admin: Get All Users
@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def admin_get_users(request):
    if request.user.role != 'ADMIN':
        return send_error(status.HTTP_403_FORBIDDEN, 'IAM Authorization Error: Role [ADMIN] required')

    users = User.objects.all().order_by('-created_at')
    serializer = UserSerializer(users, many=True)
    return send_response(status.HTTP_200_OK, 'User directory retrieved successfully', {'users': serializer.data})

# 11. Admin: Update User Status
@api_view(['PUT'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def admin_update_user_status(request, user_id):
    if request.user.role != 'ADMIN':
        return send_error(status.HTTP_403_FORBIDDEN, 'IAM Authorization Error: Role [ADMIN] required')

    new_status = (request.data.get('status') or '').strip().upper()
    allowed_statuses = ['PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED']
    if not new_status or new_status not in allowed_statuses:
        return send_error(status.HTTP_400_BAD_REQUEST, f'Invalid status value. Allowed: [{", ".join(allowed_statuses)}]')

    try:
        target_user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return send_error(status.HTTP_404_NOT_FOUND, 'User account not found')

    if target_user.role == 'ADMIN' and new_status != 'APPROVED':
        return send_error(status.HTTP_403_FORBIDDEN, 'System Administrator status cannot be altered')

    target_user.status = new_status
    target_user.save()

    action_map = {
        'APPROVED': 'ACCOUNT_APPROVED',
        'REJECTED': 'ACCOUNT_REJECTED',
        'SUSPENDED': 'ACCOUNT_SUSPENDED',
        'PENDING': 'ACCOUNT_PENDING',
    }
    AuditLog.objects.create(
        user=request.user, email=request.user.email,
        action=action_map.get(new_status, 'ACCOUNT_STATUS_CHANGED'),
        details=f'Administrator {request.user.email} changed status of {target_user.email} to [{new_status}]',
        ip_address=get_client_ip(request)
    )

    serializer = UserSerializer(target_user)
    return send_response(status.HTTP_200_OK, f'Account status for {target_user.email} updated to [{new_status}]', {'user': serializer.data})

# 12. Admin: Get Audit Logs
@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def admin_get_audit_logs(request):
    if request.user.role != 'ADMIN':
        return send_error(status.HTTP_403_FORBIDDEN, 'IAM Authorization Error: Role [ADMIN] required')

    try:
        limit = int(request.GET.get('limit', 100))
    except ValueError:
        limit = 100

    logs = AuditLog.objects.all()[:limit]
    serializer = AuditLogSerializer(logs, many=True)
    return send_response(status.HTTP_200_OK, 'Security audit logs retrieved successfully', {'logs': serializer.data})

# 13. Farmer Demonstration Endpoint with Ownership Check
@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def farmer_plantation_view(request, farmer_id):
    if request.user.role not in ['FARMER', 'ADMIN']:
        return send_error(status.HTTP_403_FORBIDDEN, f'IAM Authorization Error: Role [{request.user.role}] not allowed')

    # Ownership check
    if request.user.role != 'ADMIN' and str(request.user.id) != str(farmer_id):
        return send_error(status.HTTP_403_FORBIDDEN, 'IAM Authorization Error: Access denied. You do not own this resource.')

    return send_response(
        status.HTTP_200_OK,
        'Access Granted: Farmer plantation data accessed securely',
        {
            'plantation': {
                'id': 'PLANT_001',
                'farmer_id': request.user.id,
                'farmer_name': request.user.full_name,
                'estate_name': 'Idukki Western Ghats Cardamom Estate',
                'location': 'Vandanmedu, Idukki, Kerala',
                'total_area_acres': 14.5,
                'variety': 'Spices Board Green Gold (Njallani)',
            }
        }
    )

# 14. Health Check Endpoint
@api_view(['GET'])
@authentication_classes([])
@permission_classes([AllowAny])
def health_check(request):
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT NOW()")
            db_now = cursor.fetchone()[0]
        return Response({
            'status': 'UP',
            'system': 'CardaLink Django Backend API',
            'timestamp': db_now,
            'environment': os.getenv('NODE_ENV', 'development')
        })
    except Exception as e:
        return Response({'status': 'DOWN', 'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# 15. IAM Test Endpoint: Farmer Inventory Access
@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def iam_test_farmer_inventory(request):
    if request.user.role not in ['FARMER', 'ADMIN']:
        return send_error(status.HTTP_403_FORBIDDEN, f'IAM Authorization Error: Role [{request.user.role}] not allowed')
    return send_response(status.HTTP_200_OK, 'Farmer inventory access authorized')

# 16. IAM Test Endpoint: Admin Only Access
@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def iam_test_admin_only(request):
    if request.user.role != 'ADMIN':
        return send_error(status.HTTP_403_FORBIDDEN, f'IAM Authorization Error: Role [{request.user.role}] not allowed')
    return send_response(status.HTTP_200_OK, 'Admin access authorized')

# 17. Admin Dashboard Summary Statistics
@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def admin_dashboard_stats(request):
    if request.user.role != 'ADMIN':
        return send_error(status.HTTP_403_FORBIDDEN, 'IAM Authorization Error: Role [ADMIN] required')

    total_users = User.objects.count()
    farmers_count = User.objects.filter(role='FARMER').count()
    traders_count = User.objects.filter(role='TRADER').count()
    exporters_count = User.objects.filter(role='EXPORTER').count()
    pending_approvals = User.objects.filter(status='PENDING').count()
    total_plantations = Plantation.objects.count()

    harvest_sum = HarvestRecord.objects.aggregate(Sum('dried_quantity_kg'))['dried_quantity_kg__sum'] or Decimal('0.00')
    inventory_sum = InventoryItem.objects.aggregate(Sum('quantity_kg'))['quantity_kg__sum'] or Decimal('0.00')
    active_export_orders = ExportOrder.objects.filter(status__in=['PROCESSING', 'IN_TRANSIT']).count()

    return send_response(
        status.HTTP_200_OK,
        'Admin dashboard stats calculated from database',
        {
            'stats': {
                'total_users': total_users,
                'farmers_count': farmers_count,
                'traders_count': traders_count,
                'exporters_count': exporters_count,
                'pending_approvals': pending_approvals,
                'total_plantations': total_plantations,
                'total_harvest_kg': float(harvest_sum),
                'total_inventory_kg': float(inventory_sum),
                'active_export_orders': active_export_orders,
            }
        }
    )

# 18. Admin Pending Approvals List
@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def admin_get_pending_approvals(request):
    if request.user.role != 'ADMIN':
        return send_error(status.HTTP_403_FORBIDDEN, 'IAM Authorization Error: Role [ADMIN] required')

    pending_users = User.objects.filter(status='PENDING').order_by('-created_at')
    serializer = UserSerializer(pending_users, many=True)
    return send_response(status.HTTP_200_OK, 'Pending approvals retrieved', {'users': serializer.data})

# 19. Admin Plantations List
@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def admin_get_plantations(request):
    if request.user.role != 'ADMIN':
        return send_error(status.HTTP_403_FORBIDDEN, 'IAM Authorization Error: Role [ADMIN] required')

    plantations = Plantation.objects.all().order_by('-created_at')
    serializer = PlantationSerializer(plantations, many=True)
    return send_response(status.HTTP_200_OK, 'Plantations retrieved', {'plantations': serializer.data})

# 20. Admin Cardamom Varieties List
@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def admin_get_varieties(request):
    if request.user.role != 'ADMIN':
        return send_error(status.HTTP_403_FORBIDDEN, 'IAM Authorization Error: Role [ADMIN] required')

    varieties = CardamomVariety.objects.all().order_by('name')
    serializer = CardamomVarietySerializer(varieties, many=True)
    return send_response(status.HTTP_200_OK, 'Cardamom varieties retrieved', {'varieties': serializer.data})

# 21. Admin Harvest Records List
@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def admin_get_harvests(request):
    if request.user.role != 'ADMIN':
        return send_error(status.HTTP_403_FORBIDDEN, 'IAM Authorization Error: Role [ADMIN] required')

    harvests = HarvestRecord.objects.all().order_by('-harvest_date')
    serializer = HarvestRecordSerializer(harvests, many=True)
    return send_response(status.HTTP_200_OK, 'Harvest records retrieved', {'harvests': serializer.data})

# 22. Admin Inventory List
@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def admin_get_inventory(request):
    if request.user.role != 'ADMIN':
        return send_error(status.HTTP_403_FORBIDDEN, 'IAM Authorization Error: Role [ADMIN] required')

    inventory = InventoryItem.objects.all().order_by('-created_at')
    serializer = InventoryItemSerializer(inventory, many=True)
    return send_response(status.HTTP_200_OK, 'Inventory items retrieved', {'inventory': serializer.data})

# 23. Admin Agrochemicals Usage List (Fertilizer / Pesticide)
@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def admin_get_agrochemicals(request):
    if request.user.role != 'ADMIN':
        return send_error(status.HTTP_403_FORBIDDEN, 'IAM Authorization Error: Role [ADMIN] required')

    usage_type = request.GET.get('type', '').upper()
    if usage_type in ['FERTILIZER', 'PESTICIDE']:
        records = AgrochemicalUsage.objects.filter(usage_type=usage_type).order_by('-application_date')
    else:
        records = AgrochemicalUsage.objects.all().order_by('-application_date')

    serializer = AgrochemicalUsageSerializer(records, many=True)
    return send_response(status.HTTP_200_OK, 'Agrochemical usage records retrieved', {'records': serializer.data})

# 24. Admin Irrigation List
@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def admin_get_irrigation(request):
    if request.user.role != 'ADMIN':
        return send_error(status.HTTP_403_FORBIDDEN, 'IAM Authorization Error: Role [ADMIN] required')

    irrigations = IrrigationRecord.objects.all().order_by('-irrigation_date')
    serializer = IrrigationRecordSerializer(irrigations, many=True)
    return send_response(status.HTTP_200_OK, 'Irrigation records retrieved', {'irrigations': serializer.data})

# 25. Admin Expenses List
@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def admin_get_expenses(request):
    if request.user.role != 'ADMIN':
        return send_error(status.HTTP_403_FORBIDDEN, 'IAM Authorization Error: Role [ADMIN] required')

    expenses = ExpenseRecord.objects.all().order_by('-expense_date')
    serializer = ExpenseRecordSerializer(expenses, many=True)
    return send_response(status.HTTP_200_OK, 'Expense records retrieved', {'expenses': serializer.data})

# 26. Admin Sales List
@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def admin_get_sales(request):
    if request.user.role != 'ADMIN':
        return send_error(status.HTTP_403_FORBIDDEN, 'IAM Authorization Error: Role [ADMIN] required')

    sales = SaleRecord.objects.all().order_by('-sale_date')
    serializer = SaleRecordSerializer(sales, many=True)
    return send_response(status.HTTP_200_OK, 'Sales records retrieved', {'sales': serializer.data})

# 27. Admin Transactions List
@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def admin_get_transactions(request):
    if request.user.role != 'ADMIN':
        return send_error(status.HTTP_403_FORBIDDEN, 'IAM Authorization Error: Role [ADMIN] required')

    transactions = TransactionRecord.objects.all().order_by('-created_at')
    serializer = TransactionRecordSerializer(transactions, many=True)
    return send_response(status.HTTP_200_OK, 'Transactions retrieved', {'transactions': serializer.data})

# 28. Admin Export Orders List
@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def admin_get_export_orders(request):
    if request.user.role != 'ADMIN':
        return send_error(status.HTTP_403_FORBIDDEN, 'IAM Authorization Error: Role [ADMIN] required')

    orders = ExportOrder.objects.all().order_by('-order_date')
    serializer = ExportOrderSerializer(orders, many=True)
    return send_response(status.HTTP_200_OK, 'Export orders retrieved', {'export_orders': serializer.data})

# 29. Admin Export Documents List
@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def admin_get_export_documents(request):
    if request.user.role != 'ADMIN':
        return send_error(status.HTTP_403_FORBIDDEN, 'IAM Authorization Error: Role [ADMIN] required')

    documents = ExportDocument.objects.all().order_by('-issued_date')
    serializer = ExportDocumentSerializer(documents, many=True)
    return send_response(status.HTTP_200_OK, 'Export documents retrieved', {'documents': serializer.data})

# 30. Admin Shipments List
@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def admin_get_shipments(request):
    if request.user.role != 'ADMIN':
        return send_error(status.HTTP_403_FORBIDDEN, 'IAM Authorization Error: Role [ADMIN] required')

    shipments = ShipmentRecord.objects.all().order_by('-dispatch_date')
    serializer = ShipmentRecordSerializer(shipments, many=True)
    return send_response(status.HTTP_200_OK, 'Shipments retrieved', {'shipments': serializer.data})

# 31. Admin Notifications List
@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def admin_get_notifications(request):
    if request.user.role != 'ADMIN':
        return send_error(status.HTTP_403_FORBIDDEN, 'IAM Authorization Error: Role [ADMIN] required')

    notifications = NotificationItem.objects.all().order_by('-created_at')
    serializer = NotificationItemSerializer(notifications, many=True)
    return send_response(status.HTTP_200_OK, 'Notifications retrieved', {'notifications': serializer.data})

# 32. Admin System Summary Reports
@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def admin_get_reports(request):
    if request.user.role != 'ADMIN':
        return send_error(status.HTTP_403_FORBIDDEN, 'IAM Authorization Error: Role [ADMIN] required')

    from decimal import Decimal
    role_counts = list(User.objects.values('role').annotate(count=Count('role')))
    status_counts = list(User.objects.values('status').annotate(count=Count('status')))
    variety_harvest = list(HarvestRecord.objects.values('variety').annotate(total_kg=Sum('dried_quantity_kg')))
    sales_total = float(SaleRecord.objects.aggregate(Sum('total_amount'))['total_amount__sum'] or Decimal('0.00'))
    export_val_total = float(ExportOrder.objects.aggregate(Sum('total_value_usd'))['total_value_usd__sum'] or Decimal('0.00'))

    return send_response(
        status.HTTP_200_OK,
        'System summary report analytics generated',
        {
            'reports': {
                'users_by_role': role_counts,
                'users_by_status': status_counts,
                'harvest_by_variety': variety_harvest,
                'total_domestic_sales_inr': sales_total,
                'total_export_value_usd': export_val_total,
            }
        }
    )


# ==============================================================================
# FARMER MODULE API VIEWS
# ==============================================================================

from decimal import Decimal, InvalidOperation
from datetime import datetime, timedelta, date

def check_farmer_auth(request):
    if not request.user or not request.user.is_authenticated:
        return send_error(status.HTTP_401_UNAUTHORIZED, 'Authentication required')
    if request.user.role != 'FARMER':
        return send_error(status.HTTP_403_FORBIDDEN, 'IAM Authorization Error: Role [FARMER] required')
    if request.user.status != 'APPROVED':
        return send_error(status.HTTP_403_FORBIDDEN, 'Account approval required')
    return None

def parse_decimal_safe(val, default=None):
    if val is None or val == '':
        return default
    val_str = str(val).strip()
    if 'e' in val_str.lower():
        raise ValueError("Scientific notation (e.g. 2.7e+48) is strictly prohibited.")
    try:
        d = Decimal(val_str)
        if d.is_nan() or d.is_infinite():
            raise ValueError("Invalid decimal number.")
        return d
    except (InvalidOperation, ValueError, TypeError):
        raise ValueError("Please enter a valid numeric value.")

# 33. Farmer Dashboard Stats
@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def farmer_dashboard_stats(request):
    auth_err = check_farmer_auth(request)
    if auth_err: return auth_err

    user = request.user
    today = date.today()
    start_of_month = today.replace(day=1)

    plantations_count = Plantation.objects.filter(farmer=user).count()
    harvest_this_month = HarvestRecord.objects.filter(farmer=user, harvest_date__gte=start_of_month).aggregate(s=Sum('fresh_quantity_kg'))['s'] or Decimal('0.00')
    total_fresh = HarvestRecord.objects.filter(farmer=user).aggregate(s=Sum('fresh_quantity_kg'))['s'] or Decimal('0.00')
    total_dried = HarvestRecord.objects.filter(farmer=user).aggregate(s=Sum('dried_quantity_kg'))['s'] or Decimal('0.00')
    current_inv = InventoryItem.objects.filter(owner=user).aggregate(s=Sum('quantity_kg'))['s'] or Decimal('0.00')
    total_expenses = ExpenseRecord.objects.filter(farmer=user).aggregate(s=Sum('amount'))['s'] or Decimal('0.00')
    total_sales = SaleRecord.objects.filter(farmer=user).aggregate(s=Sum('total_amount'))['s'] or Decimal('0.00')

    return send_response(status.HTTP_200_OK, 'Farmer stats loaded', {
        'stats': {
            'my_plantations': plantations_count,
            'harvest_this_month': float(harvest_this_month),
            'total_fresh_harvest': float(total_fresh),
            'total_dried_harvest': float(total_dried),
            'current_inventory_kg': float(current_inv),
            'total_expenses': float(total_expenses),
            'total_sales': float(total_sales),
        }
    })

# 34. Farmer Harvests List & Create
@api_view(['GET', 'POST'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def farmer_harvest_list_create(request):
    auth_err = check_farmer_auth(request)
    if auth_err: return auth_err

    user = request.user

    if request.method == 'GET':
        qs = HarvestRecord.objects.filter(farmer=user)

        plantation_id = request.GET.get('plantation_id')
        if plantation_id:
            qs = qs.filter(plantation_id=plantation_id)

        variety = request.GET.get('variety')
        if variety:
            qs = qs.filter(variety__icontains=variety)

        search = request.GET.get('search')
        if search:
            qs = qs.filter(plantation__name__icontains=search)

        date_filter = request.GET.get('date_filter')
        today = date.today()
        if date_filter == 'today':
            qs = qs.filter(harvest_date=today)
        elif date_filter == 'week':
            start_of_week = today - timedelta(days=today.weekday())
            qs = qs.filter(harvest_date__gte=start_of_week)
        elif date_filter == 'month':
            start_of_month = today.replace(day=1)
            qs = qs.filter(harvest_date__gte=start_of_month)
        elif date_filter == 'custom':
            start_date = request.GET.get('start_date')
            end_date = request.GET.get('end_date')
            if start_date:
                qs = qs.filter(harvest_date__gte=start_date)
            if end_date:
                qs = qs.filter(harvest_date__lte=end_date)

        qs = qs.order_by('-harvest_date', '-id')
        serializer = HarvestRecordSerializer(qs, many=True)
        return send_response(status.HTTP_200_OK, 'Harvest records loaded', {'harvests': serializer.data})

    elif request.method == 'POST':
        data = request.data
        harvest_date = data.get('harvest_date')
        plantation_id = data.get('plantation_id')
        variety = (data.get('variety') or '').strip()
        fresh_qty_raw = data.get('fresh_quantity_kg')
        dried_qty_raw = data.get('dried_quantity_kg', 0)
        unit = (data.get('unit') or 'kg').strip()
        notes = (data.get('notes') or '').strip()
        grade = (data.get('grade') or '8mm Bold').strip()

        if not harvest_date:
            return send_error(status.HTTP_400_BAD_REQUEST, 'Harvest date is required')
        try:
            parsed_date = datetime.strptime(str(harvest_date), '%Y-%m-%d').date()
        except ValueError:
            return send_error(status.HTTP_400_BAD_REQUEST, 'Invalid harvest date format. Use YYYY-MM-DD.')

        if not plantation_id:
            return send_error(status.HTTP_400_BAD_REQUEST, 'Plantation selection is required')

        try:
            plantation = Plantation.objects.get(id=plantation_id, farmer=user)
        except Plantation.DoesNotExist:
            return send_error(status.HTTP_404_NOT_FOUND, 'Selected plantation not found or access denied')

        if not variety:
            return send_error(status.HTTP_400_BAD_REQUEST, 'Cardamom variety is required')

        try:
            fresh_qty = parse_decimal_safe(fresh_qty_raw)
            if fresh_qty is None or fresh_qty <= 0:
                return send_error(status.HTTP_400_BAD_REQUEST, 'Fresh cardamom quantity must be greater than 0')
            if fresh_qty > Decimal('999999.99'):
                return send_error(status.HTTP_400_BAD_REQUEST, 'Quantity value is too large')
        except ValueError as e:
            return send_error(status.HTTP_400_BAD_REQUEST, str(e))

        try:
            dried_qty = parse_decimal_safe(dried_qty_raw, default=Decimal('0.00'))
            if dried_qty < 0:
                return send_error(status.HTTP_400_BAD_REQUEST, 'Dried cardamom quantity cannot be negative')
            if dried_qty > Decimal('999999.99'):
                return send_error(status.HTTP_400_BAD_REQUEST, 'Dried quantity value is too large')
        except ValueError as e:
            return send_error(status.HTTP_400_BAD_REQUEST, str(e))

        harvest = HarvestRecord.objects.create(
            farmer=user,
            plantation=plantation,
            harvest_date=parsed_date,
            variety=variety,
            fresh_quantity_kg=fresh_qty,
            dried_quantity_kg=dried_qty,
            unit=unit,
            notes=notes,
            grade=grade
        )

        AuditLog.objects.create(
            user=user, email=user.email, action='CREATE_HARVEST',
            details=f"Harvest recorded: {fresh_qty} kg of {variety} on {parsed_date}",
            ip_address=get_client_ip(request)
        )

        serializer = HarvestRecordSerializer(harvest)
        return send_response(status.HTTP_201_CREATED, 'Harvest record saved successfully', {'harvest': serializer.data})

# 35. Farmer Harvest Detail, Update & Delete
@api_view(['GET', 'PUT', 'DELETE'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def farmer_harvest_detail_update_delete(request, harvest_id):
    auth_err = check_farmer_auth(request)
    if auth_err: return auth_err

    user = request.user
    try:
        harvest = HarvestRecord.objects.get(id=harvest_id, farmer=user)
    except HarvestRecord.DoesNotExist:
        return send_error(status.HTTP_404_NOT_FOUND, 'Harvest record not found or access denied')

    if request.method == 'GET':
        serializer = HarvestRecordSerializer(harvest)
        return send_response(status.HTTP_200_OK, 'Harvest record retrieved', {'harvest': serializer.data})

    elif request.method == 'PUT':
        data = request.data
        if 'harvest_date' in data:
            try:
                harvest.harvest_date = datetime.strptime(str(data['harvest_date']), '%Y-%m-%d').date()
            except ValueError:
                return send_error(status.HTTP_400_BAD_REQUEST, 'Invalid harvest date format')

        if 'plantation_id' in data:
            try:
                harvest.plantation = Plantation.objects.get(id=data['plantation_id'], farmer=user)
            except Plantation.DoesNotExist:
                return send_error(status.HTTP_404_NOT_FOUND, 'Plantation not found or access denied')

        if 'variety' in data:
            harvest.variety = (data['variety'] or '').strip() or harvest.variety

        if 'fresh_quantity_kg' in data:
            try:
                fresh_qty = parse_decimal_safe(data['fresh_quantity_kg'])
                if fresh_qty is None or fresh_qty <= 0 or fresh_qty > Decimal('999999.99'):
                    return send_error(status.HTTP_400_BAD_REQUEST, 'Invalid fresh quantity')
                harvest.fresh_quantity_kg = fresh_qty
            except ValueError as e:
                return send_error(status.HTTP_400_BAD_REQUEST, str(e))

        if 'dried_quantity_kg' in data:
            try:
                dried_qty = parse_decimal_safe(data['dried_quantity_kg'], default=Decimal('0.00'))
                if dried_qty < 0 or dried_qty > Decimal('999999.99'):
                    return send_error(status.HTTP_400_BAD_REQUEST, 'Invalid dried quantity')
                harvest.dried_quantity_kg = dried_qty
            except ValueError as e:
                return send_error(status.HTTP_400_BAD_REQUEST, str(e))

        if 'unit' in data:
            harvest.unit = (data['unit'] or 'kg').strip()
        if 'notes' in data:
            harvest.notes = (data['notes'] or '').strip()

        harvest.save()
        serializer = HarvestRecordSerializer(harvest)
        return send_response(status.HTTP_200_OK, 'Harvest record updated successfully', {'harvest': serializer.data})

    elif request.method == 'DELETE':
        harvest.delete()
        AuditLog.objects.create(
            user=user, email=user.email, action='DELETE_HARVEST',
            details=f"Harvest record #{harvest_id} deleted", ip_address=get_client_ip(request)
        )
        return send_response(status.HTTP_200_OK, 'Harvest record deleted successfully')

# 36. Farmer Harvest Summary
@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def farmer_harvest_summary(request):
    auth_err = check_farmer_auth(request)
    if auth_err: return auth_err

    user = request.user
    qs = HarvestRecord.objects.filter(farmer=user)

    plantation_id = request.GET.get('plantation_id')
    if plantation_id:
        qs = qs.filter(plantation_id=plantation_id)

    variety = request.GET.get('variety')
    if variety:
        qs = qs.filter(variety__icontains=variety)

    period = request.GET.get('period', 'monthly')
    start_date_str = request.GET.get('start_date')
    end_date_str = request.GET.get('end_date')

    today = date.today()
    if period == 'daily':
        qs = qs.filter(harvest_date=today)
    elif period == 'weekly':
        start_of_week = today - timedelta(days=today.weekday())
        qs = qs.filter(harvest_date__gte=start_of_week)
    elif period == 'monthly':
        start_of_month = today.replace(day=1)
        qs = qs.filter(harvest_date__gte=start_of_month)
    elif period == 'custom':
        if start_date_str:
            qs = qs.filter(harvest_date__gte=start_date_str)
        if end_date_str:
            qs = qs.filter(harvest_date__lte=end_date_str)

    total_days = qs.values('harvest_date').distinct().count()
    from django.db.models import Max, Min
    aggregates = qs.aggregate(
        total_fresh=Sum('fresh_quantity_kg'),
        total_dried=Sum('dried_quantity_kg')
    )

    total_fresh = float(aggregates['total_fresh'] or 0.0)
    total_dried = float(aggregates['total_dried'] or 0.0)
    avg_fresh = round(total_fresh / total_days, 2) if total_days > 0 else 0.0
    avg_dried = round(total_dried / total_days, 2) if total_days > 0 else 0.0

    highest_day = None
    lowest_day = None
    if total_days > 0:
        h_rec = qs.order_by('-fresh_quantity_kg').first()
        l_rec = qs.order_by('fresh_quantity_kg').first()
        if h_rec:
            highest_day = {'date': str(h_rec.harvest_date), 'fresh_kg': float(h_rec.fresh_quantity_kg)}
        if l_rec:
            lowest_day = {'date': str(l_rec.harvest_date), 'fresh_kg': float(l_rec.fresh_quantity_kg)}

    daily_groups = list(
        qs.values('harvest_date')
          .annotate(fresh_kg=Sum('fresh_quantity_kg'), dried_kg=Sum('dried_quantity_kg'))
          .order_by('harvest_date')
    )

    breakdown = []
    for item in daily_groups:
        breakdown.append({
            'date': str(item['harvest_date']),
            'fresh_kg': float(item['fresh_kg'] or 0.0),
            'dried_kg': float(item['dried_kg'] or 0.0)
        })

    # Calculated Weekly & Monthly Aggregations from PostgreSQL
    all_month_records = HarvestRecord.objects.filter(farmer=user)
    if plantation_id:
        all_month_records = all_month_records.filter(plantation_id=plantation_id)
    if variety:
        all_month_records = all_month_records.filter(variety__icontains=variety)

    start_of_m = today.replace(day=1)
    month_records = list(all_month_records.filter(harvest_date__gte=start_of_m))

    w1_fresh = sum(float(r.fresh_quantity_kg) for r in month_records if 1 <= r.harvest_date.day <= 7)
    w2_fresh = sum(float(r.fresh_quantity_kg) for r in month_records if 8 <= r.harvest_date.day <= 14)
    w3_fresh = sum(float(r.fresh_quantity_kg) for r in month_records if 15 <= r.harvest_date.day <= 21)
    w4_fresh = sum(float(r.fresh_quantity_kg) for r in month_records if r.harvest_date.day >= 22)
    month_total_fresh = sum(float(r.fresh_quantity_kg) for r in month_records)

    month_name = today.strftime('%B %Y')
    short_month = today.strftime('%b')

    weekly_summary = [
        {"week": "Week 1", "range": f"01 {short_month} – 07 {short_month}", "total_kg": round(w1_fresh, 2)},
        {"week": "Week 2", "range": f"08 {short_month} – 14 {short_month}", "total_kg": round(w2_fresh, 2)},
        {"week": "Week 3", "range": f"15 {short_month} – 21 {short_month}", "total_kg": round(w3_fresh, 2)},
        {"week": "Week 4", "range": f"22 {short_month} – End", "total_kg": round(w4_fresh, 2)},
    ]

    return send_response(status.HTTP_200_OK, 'Harvest summary generated', {
        'summary': {
            'total_harvest_days': total_days,
            'total_fresh_harvest_kg': total_fresh,
            'total_dried_harvest_kg': total_dried,
            'avg_fresh_per_day_kg': avg_fresh,
            'avg_dried_per_day_kg': avg_dried,
            'highest_harvest_day': highest_day,
            'lowest_harvest_day': lowest_day,
            'period': period,
            'breakdown': breakdown,
            'weekly_summary': weekly_summary,
            'month_name': month_name,
            'monthly_total_kg': round(month_total_fresh, 2)
        }
    })


# ==============================================================================
# HARVEST CYCLE SYSTEM API VIEWS
# ==============================================================================

def compute_harvest_cycle_summary(cycle):
    records = HarvestRecord.objects.filter(harvest_cycle=cycle)
    total_days = records.values('harvest_date').distinct().count()
    aggregates = records.aggregate(
        total_fresh=Sum('fresh_quantity_kg'),
        total_dried=Sum('dried_quantity_kg')
    )
    total_fresh = float(aggregates['total_fresh'] or 0.0)
    total_dried = float(aggregates['total_dried'] or 0.0)
    avg_fresh = round(total_fresh / total_days, 2) if total_days > 0 else 0.0
    avg_dried = round(total_dried / total_days, 2) if total_days > 0 else 0.0

    highest_day = None
    lowest_day = None
    if total_days > 0:
        h_rec = records.order_by('-fresh_quantity_kg').first()
        l_rec = records.order_by('fresh_quantity_kg').first()
        if h_rec:
            highest_day = {'date': str(h_rec.harvest_date), 'fresh_kg': float(h_rec.fresh_quantity_kg)}
        if l_rec:
            lowest_day = {'date': str(l_rec.harvest_date), 'fresh_kg': float(l_rec.fresh_quantity_kg)}

    daily_serializer = HarvestRecordSerializer(records.order_by('harvest_date'), many=True)

    full_dry_val = float(cycle.full_dry_quantity) if cycle.full_dry_quantity is not None else None

    return {
        'total_harvest_days': total_days,
        'total_fresh_harvest_kg': total_fresh,
        'total_dried_harvest_kg': total_dried,
        'full_dry_quantity_kg': full_dry_val,
        'avg_fresh_per_day_kg': avg_fresh,
        'avg_dried_per_day_kg': avg_dried,
        'highest_harvest_day': highest_day,
        'lowest_harvest_day': lowest_day,
        'daily_records': daily_serializer.data
    }

# 1. Get Active Harvest Cycle & Live Metrics
@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def farmer_get_active_harvest_cycle(request):
    auth_err = check_farmer_auth(request)
    if auth_err: return auth_err

    user = request.user
    active_cycle = HarvestCycle.objects.filter(farmer=user, status='ACTIVE').first()

    if not active_cycle:
        return send_response(status.HTTP_200_OK, 'No active harvest cycle found', {'active_cycle': None})

    summary = compute_harvest_cycle_summary(active_cycle)
    cycle_serializer = HarvestCycleSerializer(active_cycle)

    return send_response(status.HTTP_200_OK, 'Active harvest cycle retrieved', {
        'active_cycle': cycle_serializer.data,
        'live_summary': summary
    })

# 2. Start New Harvest Cycle (Enforces ONLY ONE ACTIVE HARVEST)
@api_view(['POST'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def farmer_start_harvest_cycle(request):
    auth_err = check_farmer_auth(request)
    if auth_err: return auth_err

    user = request.user
    if HarvestCycle.objects.filter(farmer=user, status='ACTIVE').exists():
        return send_error(
            status.HTTP_400_BAD_REQUEST,
            'You already have an active harvest. Complete the current harvest before starting a new one.'
        )

    data = request.data
    name = (data.get('name') or '').strip()
    start_date = data.get('start_date')
    expected_end_date = data.get('expected_end_date')
    plantation_id = data.get('plantation_id')
    variety = (data.get('variety') or '').strip()

    if not name or not start_date or not expected_end_date or not plantation_id or not variety:
        return send_error(status.HTTP_400_BAD_REQUEST, 'Cycle name, start date, expected end date, plantation and variety are required')

    try:
        parsed_start = datetime.strptime(str(start_date), '%Y-%m-%d').date()
        parsed_end = datetime.strptime(str(expected_end_date), '%Y-%m-%d').date()
        if parsed_end < parsed_start:
            return send_error(status.HTTP_400_BAD_REQUEST, 'Expected end date cannot be earlier than start date')
    except ValueError:
        return send_error(status.HTTP_400_BAD_REQUEST, 'Invalid date format. Use YYYY-MM-DD.')

    try:
        plantation = Plantation.objects.get(id=plantation_id, farmer=user)
    except Plantation.DoesNotExist:
        return send_error(status.HTTP_404_NOT_FOUND, 'Selected plantation not found or access denied')

    cycle = HarvestCycle.objects.create(
        farmer=user,
        plantation=plantation,
        name=name,
        variety=variety,
        start_date=parsed_start,
        expected_end_date=parsed_end,
        status='ACTIVE'
    )

    AuditLog.objects.create(
        user=user, email=user.email, action='START_HARVEST_CYCLE',
        details=f"Harvest Cycle started: '{name}' from {parsed_start} to {parsed_end}",
        ip_address=get_client_ip(request)
    )

    serializer = HarvestCycleSerializer(cycle)
    return send_response(status.HTTP_201_CREATED, 'Harvest Cycle started successfully', {'cycle': serializer.data})

# 3. Add Daily Harvest Record to Active Cycle
@api_view(['POST'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def farmer_add_daily_harvest(request, cycle_id):
    auth_err = check_farmer_auth(request)
    if auth_err: return auth_err

    user = request.user
    try:
        cycle = HarvestCycle.objects.get(id=cycle_id, farmer=user)
    except HarvestCycle.DoesNotExist:
        return send_error(status.HTTP_404_NOT_FOUND, 'Harvest Cycle not found or access denied')

    if cycle.status != 'ACTIVE':
        return send_error(status.HTTP_400_BAD_REQUEST, 'Cannot add daily records to a completed harvest cycle.')

    data = request.data
    harvest_date = data.get('harvest_date')
    fresh_qty_raw = data.get('fresh_quantity_kg')
    dried_qty_raw = data.get('dried_quantity_kg', 0)
    notes = (data.get('notes') or '').strip()

    if not harvest_date:
        return send_error(status.HTTP_400_BAD_REQUEST, 'Harvest date is required')

    try:
        parsed_date = datetime.strptime(str(harvest_date), '%Y-%m-%d').date()
    except ValueError:
        return send_error(status.HTTP_400_BAD_REQUEST, 'Invalid date format')

    # Date scope validation: Must be between start_date and expected_end_date
    if parsed_date < cycle.start_date or parsed_date > cycle.expected_end_date:
        return send_error(
            status.HTTP_400_BAD_REQUEST,
            f"Selected date must be within the harvest period ({cycle.start_date} to {cycle.expected_end_date})."
        )

    # Prevent duplicate daily entry
    if HarvestRecord.objects.filter(harvest_cycle=cycle, harvest_date=parsed_date).exists():
        return send_error(
            status.HTTP_400_BAD_REQUEST,
            f"Harvest for this date has already been recorded."
        )

    try:
        fresh_qty = parse_decimal_safe(fresh_qty_raw)
        if fresh_qty is None or fresh_qty <= 0:
            return send_error(status.HTTP_400_BAD_REQUEST, 'Fresh harvest quantity must be greater than 0')
    except ValueError as e:
        return send_error(status.HTTP_400_BAD_REQUEST, str(e))

    try:
        dried_qty = parse_decimal_safe(dried_qty_raw, default=Decimal('0.00'))
        if dried_qty < 0:
            return send_error(status.HTTP_400_BAD_REQUEST, 'Dried harvest quantity cannot be negative')
    except ValueError as e:
        return send_error(status.HTTP_400_BAD_REQUEST, str(e))

    daily_rec = HarvestRecord.objects.create(
        farmer=user,
        plantation=cycle.plantation,
        harvest_cycle=cycle,
        harvest_date=parsed_date,
        variety=cycle.variety,
        fresh_quantity_kg=fresh_qty,
        dried_quantity_kg=dried_qty,
        unit='kg',
        notes=notes
    )

    serializer = HarvestRecordSerializer(daily_rec)
    live_summary = compute_harvest_cycle_summary(cycle)
    return send_response(status.HTTP_201_CREATED, "Today's harvest saved successfully", {
        'daily_record': serializer.data,
        'live_summary': live_summary
    })

# 4. Complete Active Harvest Cycle
@api_view(['POST'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def farmer_complete_harvest_cycle(request, cycle_id):
    auth_err = check_farmer_auth(request)
    if auth_err: return auth_err

    user = request.user
    try:
        cycle = HarvestCycle.objects.get(id=cycle_id, farmer=user)
    except HarvestCycle.DoesNotExist:
        return send_error(status.HTTP_404_NOT_FOUND, 'Harvest Cycle not found or access denied')

    if cycle.status == 'COMPLETED':
        return send_error(status.HTTP_400_BAD_REQUEST, 'Harvest cycle is already completed')

    data = request.data
    full_dry_raw = data.get('full_dry_quantity')
    if full_dry_raw is None or str(full_dry_raw).strip() == '':
        return send_error(status.HTTP_400_BAD_REQUEST, 'Full Dry KG is required to complete the harvest')

    try:
        full_dry_qty = parse_decimal_safe(full_dry_raw)
        if full_dry_qty is None or full_dry_qty <= 0:
            return send_error(status.HTTP_400_BAD_REQUEST, 'Full Dry KG must be a valid number greater than 0')
        if full_dry_qty > Decimal('999999.99'):
            return send_error(status.HTTP_400_BAD_REQUEST, 'Full Dry KG value is too large')
    except ValueError as e:
        return send_error(status.HTTP_400_BAD_REQUEST, str(e))

    cycle.full_dry_quantity = full_dry_qty
    cycle.status = 'COMPLETED'
    cycle.completed_date = date.today()
    cycle.save()

    AuditLog.objects.create(
        user=user, email=user.email, action='COMPLETE_HARVEST_CYCLE',
        details=f"Harvest Cycle '{cycle.name}' completed on {cycle.completed_date} with Full Dry KG = {full_dry_qty}",
        ip_address=get_client_ip(request)
    )

    final_summary = compute_harvest_cycle_summary(cycle)
    cycle_serializer = HarvestCycleSerializer(cycle)

    return send_response(status.HTTP_200_OK, 'Harvest cycle completed successfully', {
        'cycle': cycle_serializer.data,
        'final_summary': final_summary
    })

# 5. Get Harvest Cycle History (Completed Cycles)
@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def farmer_get_harvest_history(request):
    auth_err = check_farmer_auth(request)
    if auth_err: return auth_err

    user = request.user
    completed_cycles = HarvestCycle.objects.filter(farmer=user, status='COMPLETED').order_by('-completed_date', '-created_at')

    history_list = []
    for cycle in completed_cycles:
        summary = compute_harvest_cycle_summary(cycle)
        cycle_data = HarvestCycleSerializer(cycle).data
        cycle_data['summary'] = {
            'total_fresh_harvest_kg': summary['total_fresh_harvest_kg'],
            'total_dried_harvest_kg': summary['total_dried_harvest_kg'],
            'full_dry_quantity_kg': summary['full_dry_quantity_kg'],
            'total_harvest_days': summary['total_harvest_days']
        }
        history_list.append(cycle_data)

    return send_response(status.HTTP_200_OK, 'Harvest history loaded', {'history': history_list})

# 6. Get Specific Harvest Cycle Summary Details
@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def farmer_get_cycle_summary_detail(request, cycle_id):
    auth_err = check_farmer_auth(request)
    if auth_err: return auth_err

    user = request.user
    try:
        cycle = HarvestCycle.objects.get(id=cycle_id, farmer=user)
    except HarvestCycle.DoesNotExist:
        return send_error(status.HTTP_404_NOT_FOUND, 'Harvest cycle not found or access denied')

    summary = compute_harvest_cycle_summary(cycle)
    cycle_serializer = HarvestCycleSerializer(cycle)

    return send_response(status.HTTP_200_OK, 'Harvest cycle summary retrieved', {
        'cycle': cycle_serializer.data,
        'summary': summary
    })


# 7. Update Full Dry KG for Completed Harvest Cycle
@api_view(['POST', 'PUT'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def farmer_update_cycle_dry_kg(request, cycle_id):
    auth_err = check_farmer_auth(request)
    if auth_err: return auth_err

    user = request.user
    try:
        cycle = HarvestCycle.objects.get(id=cycle_id, farmer=user)
    except HarvestCycle.DoesNotExist:
        return send_error(status.HTTP_404_NOT_FOUND, 'Harvest cycle not found or access denied')

    if cycle.status != 'COMPLETED':
        return send_error(status.HTTP_400_BAD_REQUEST, 'Dry KG can only be added or updated for completed harvest cycles')

    data = request.data
    full_dry_raw = data.get('full_dry_quantity')
    if full_dry_raw is None or str(full_dry_raw).strip() == '':
        return send_error(status.HTTP_400_BAD_REQUEST, 'Dry KG quantity is required')

    try:
        from decimal import Decimal
        full_dry_qty = Decimal(str(full_dry_raw).strip())
        if full_dry_qty < Decimal('0'):
            return send_error(status.HTTP_400_BAD_REQUEST, 'Dry KG must be greater than or equal to 0')
        if full_dry_qty > Decimal('999999.99'):
            return send_error(status.HTTP_400_BAD_REQUEST, 'Dry KG value is too large')
    except Exception:
        return send_error(status.HTTP_400_BAD_REQUEST, 'Please enter a valid numeric dry quantity')

    cycle.full_dry_quantity = full_dry_qty
    cycle.save()

    AuditLog.objects.create(
        user=user, email=user.email, action='UPDATE_HARVEST_CYCLE_DRY_KG',
        details=f"Harvest Cycle '{cycle.name}' (ID {cycle.id}) updated Full Dry KG = {full_dry_qty}",
        ip_address=get_client_ip(request)
    )

    final_summary = compute_harvest_cycle_summary(cycle)
    cycle_serializer = HarvestCycleSerializer(cycle)

    return send_response(status.HTTP_200_OK, 'Dry KG saved successfully', {
        'cycle': cycle_serializer.data,
        'summary': final_summary
    })


# 37. Farmer Plantations List & Create
@api_view(['GET', 'POST'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def farmer_plantations_list_create(request):
    auth_err = check_farmer_auth(request)
    if auth_err: return auth_err

    user = request.user
    if request.method == 'GET':
        plantations = Plantation.objects.filter(farmer=user).order_by('-created_at')
        serializer = PlantationSerializer(plantations, many=True)
        return send_response(status.HTTP_200_OK, 'Plantations loaded', {'plantations': serializer.data})
    elif request.method == 'POST':
        data = request.data
        name = (data.get('name') or '').strip()
        location = (data.get('location') or '').strip()
        area_raw = data.get('area_acres')
        number_of_plants_raw = data.get('number_of_plants')
        variety = (data.get('variety') or 'Njallani Green Gold').strip()

        if not name or not location:
            return send_error(status.HTTP_400_BAD_REQUEST, 'Plantation name and location are required')

        try:
            area = parse_decimal_safe(area_raw)
            if area is None or area <= 0:
                return send_error(status.HTTP_400_BAD_REQUEST, 'Area in acres must be greater than 0')
        except ValueError as e:
            return send_error(status.HTTP_400_BAD_REQUEST, str(e))

        number_of_plants = 0
        if number_of_plants_raw is not None:
            try:
                number_of_plants = int(number_of_plants_raw)
                if number_of_plants < 1:
                    return send_error(status.HTTP_400_BAD_REQUEST, 'Number of plants must be at least 1')
            except (ValueError, TypeError):
                return send_error(status.HTTP_400_BAD_REQUEST, 'Number of plants must be a valid positive whole number')

        plantation = Plantation.objects.create(
            farmer=user,
            name=name,
            location=location,
            area_acres=area,
            number_of_plants=number_of_plants,
            variety=variety,
            details=(data.get('details') or '').strip()
        )
        serializer = PlantationSerializer(plantation)
        return send_response(status.HTTP_201_CREATED, 'Plantation created successfully', {'plantation': serializer.data})

# 38. Farmer Varieties List & Create
@api_view(['GET', 'POST'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def farmer_varieties_list_create(request):
    auth_err = check_farmer_auth(request)
    if auth_err: return auth_err

    if request.method == 'GET':
        varieties = CardamomVariety.objects.all().order_by('name')
        serializer = CardamomVarietySerializer(varieties, many=True)
        return send_response(status.HTTP_200_OK, 'Varieties loaded', {'varieties': serializer.data})
    elif request.method == 'POST':
        data = request.data
        name = (data.get('name') or '').strip()
        code = (data.get('code') or '').strip().upper()
        if not name:
            return send_error(status.HTTP_400_BAD_REQUEST, 'Variety name is required')
        if not code:
            code = name.replace(' ', '_').upper()[:20]

        if CardamomVariety.objects.filter(code=code).exists():
            code = f"{code}_{CardamomVariety.objects.count() + 1}"

        variety = CardamomVariety.objects.create(
            name=name,
            code=code,
            description=(data.get('description') or '').strip(),
            optimal_altitude=(data.get('optimal_altitude') or '').strip()
        )
        serializer = CardamomVarietySerializer(variety)
        return send_response(status.HTTP_201_CREATED, 'Variety created successfully', {'variety': serializer.data})

# 39. Farmer Agrochemicals List & Create
@api_view(['GET', 'POST'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def farmer_agrochemicals_list_create(request):
    auth_err = check_farmer_auth(request)
    if auth_err: return auth_err

    user = request.user
    if request.method == 'GET':
        usage_type = request.GET.get('type')
        qs = AgrochemicalUsage.objects.filter(farmer=user)
        if usage_type in ['FERTILIZER', 'PESTICIDE']:
            qs = qs.filter(usage_type=usage_type)
        serializer = AgrochemicalUsageSerializer(qs.order_by('-application_date'), many=True)
        return send_response(status.HTTP_200_OK, 'Agrochemical usage records loaded', {'agrochemicals': serializer.data})

    elif request.method == 'POST':
        try:
            data = request.data
            usage_type = (data.get('usage_type') or 'FERTILIZER').strip().upper()
            plantation_id = data.get('plantation') or data.get('plantation_id')
            name = (data.get('product_name') or data.get('name') or '').strip()
            qty_raw = data.get('quantity')
            app_date = data.get('date_applied') or data.get('application_date')

            # Next date to apply is optional
            next_app_date_raw = data.get('next_date_to_apply') if 'next_date_to_apply' in data else data.get('next_application_date')
            next_app_date = None
            if next_app_date_raw and str(next_app_date_raw).strip():
                next_app_date = str(next_app_date_raw).strip()

            cost_raw = data.get('cost')

            if usage_type not in ['FERTILIZER', 'PESTICIDE']:
                return send_error(status.HTTP_400_BAD_REQUEST, 'Invalid usage type')
            if not name or not app_date or not plantation_id:
                return send_error(status.HTTP_400_BAD_REQUEST, 'Plantation, product name, and application date are required')

            try:
                plantation = Plantation.objects.get(id=plantation_id, farmer=user)
            except (Plantation.DoesNotExist, ValueError, TypeError):
                return send_error(status.HTTP_404_NOT_FOUND, 'Plantation not found or access denied')

            try:
                qty = parse_decimal_safe(qty_raw)
                if qty is None or qty <= 0:
                    return send_error(status.HTTP_400_BAD_REQUEST, 'Quantity must be greater than 0')
            except ValueError as e:
                return send_error(status.HTTP_400_BAD_REQUEST, str(e))

            cost = Decimal('0.00')
            if cost_raw is not None and str(cost_raw).strip() != '':
                try:
                    cost = parse_decimal_safe(cost_raw)
                    if cost is None or cost < 0:
                        return send_error(status.HTTP_400_BAD_REQUEST, 'Cost must be positive')
                except ValueError as e:
                    return send_error(status.HTTP_400_BAD_REQUEST, str(e))

            rec = AgrochemicalUsage.objects.create(
                usage_type=usage_type,
                farmer=user,
                plantation=plantation,
                name=name,
                quantity=qty,
                unit=(data.get('unit') or 'KG').strip(),
                application_date=app_date,
                next_application_date=next_app_date,
                cost=cost,
                purpose=(data.get('purpose') or '').strip()
            )
            serializer = AgrochemicalUsageSerializer(rec)
            return send_response(status.HTTP_201_CREATED, 'Agrochemical usage recorded', {'agrochemical': serializer.data})
        except Exception as err:
            return send_error(status.HTTP_400_BAD_REQUEST, f"Failed to record agrochemical usage: {str(err)}")

# 40. Farmer Irrigation List & Create
@api_view(['GET', 'POST'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def farmer_irrigation_list_create(request):
    auth_err = check_farmer_auth(request)
    if auth_err: return auth_err

    user = request.user
    if request.method == 'GET':
        qs = IrrigationRecord.objects.filter(farmer=user).order_by('-irrigation_date')
        serializer = IrrigationRecordSerializer(qs, many=True)
        return send_response(status.HTTP_200_OK, 'Irrigation records loaded', {'irrigations': serializer.data})

    elif request.method == 'POST':
        data = request.data
        plantation_id = data.get('plantation_id')
        method = (data.get('method') or 'Drip Irrigation').strip()
        duration_raw = data.get('duration_hours')
        water_raw = data.get('water_volume_liters')
        irr_date = data.get('irrigation_date')

        if not plantation_id or not irr_date:
            return send_error(status.HTTP_400_BAD_REQUEST, 'Plantation and irrigation date are required')

        try:
            plantation = Plantation.objects.get(id=plantation_id, farmer=user)
        except Plantation.DoesNotExist:
            return send_error(status.HTTP_404_NOT_FOUND, 'Plantation not found or access denied')

        try:
            duration = parse_decimal_safe(duration_raw, Decimal('1.0'))
            water = parse_decimal_safe(water_raw, Decimal('1000.0'))
        except ValueError as e:
            return send_error(status.HTTP_400_BAD_REQUEST, str(e))

        rec = IrrigationRecord.objects.create(
            farmer=user,
            plantation=plantation,
            method=method,
            duration_hours=duration,
            water_volume_liters=water,
            irrigation_date=irr_date
        )
        serializer = IrrigationRecordSerializer(rec)
        return send_response(status.HTTP_201_CREATED, 'Irrigation record saved', {'irrigation': serializer.data})

# 41. Farmer Inventory List & Create
@api_view(['GET', 'POST'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def farmer_inventory_list_create(request):
    auth_err = check_farmer_auth(request)
    if auth_err: return auth_err

    user = request.user
    if request.method == 'GET':
        qs = InventoryItem.objects.filter(owner=user).order_by('-created_at')
        serializer = InventoryItemSerializer(qs, many=True)
        return send_response(status.HTTP_200_OK, 'Inventory items loaded', {'inventory': serializer.data})

    elif request.method == 'POST':
        data = request.data
        variety = (data.get('variety') or 'Njallani Green Gold').strip()
        qty_raw = data.get('quantity_kg') or data.get('quantity')
        grade = (data.get('grade') or '8mm Bold').strip()
        plantation_id = data.get('plantation_id') or data.get('plantation')
        price_raw = data.get('price_per_kg') or data.get('purchase_price_per_kg')

        plantation = None
        if plantation_id:
            try:
                plantation = Plantation.objects.get(id=int(plantation_id), farmer=user)
            except (Plantation.DoesNotExist, ValueError, TypeError):
                pass
        if not plantation:
            plantation = Plantation.objects.filter(farmer=user).first()

        price_per_kg = Decimal('2000.00')
        if price_raw is not None and str(price_raw).strip() != '':
            try:
                p = parse_decimal_safe(price_raw)
                if p and p > 0:
                    price_per_kg = p
            except ValueError:
                pass

        try:
            qty = parse_decimal_safe(qty_raw)
            if qty is None or qty <= 0:
                return send_error(status.HTTP_400_BAD_REQUEST, 'Inventory quantity must be greater than 0')
        except ValueError as e:
            return send_error(status.HTTP_400_BAD_REQUEST, str(e))

        batch_code = f"INV-FARM-{user.id}-{int(datetime.now().timestamp())}"
        inv = InventoryItem.objects.create(
            owner=user,
            plantation=plantation,
            variety=variety,
            quantity_kg=qty,
            unit=(data.get('unit') or 'KG').strip(),
            grade=grade,
            purchase_price_per_kg=price_per_kg,
            total_cost=qty * price_per_kg,
            status='IN_STOCK',
            batch_code=batch_code
        )
        serializer = InventoryItemSerializer(inv)
        return send_response(status.HTTP_201_CREATED, 'Inventory item created', {'inventory_item': serializer.data})

# 42. Farmer Expenses List & Create
@api_view(['GET', 'POST'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def farmer_expenses_list_create(request):
    auth_err = check_farmer_auth(request)
    if auth_err: return auth_err

    user = request.user
    if request.method == 'GET':
        qs = ExpenseRecord.objects.filter(farmer=user).order_by('-expense_date')
        serializer = ExpenseRecordSerializer(qs, many=True)
        return send_response(status.HTTP_200_OK, 'Expense records loaded', {'expenses': serializer.data})

    elif request.method == 'POST':
        data = request.data
        category = (data.get('category') or 'Fertilizer & Labor').strip()
        amount_raw = data.get('amount')
        exp_date = data.get('expense_date') or str(date.today())
        plantation_id = data.get('plantation_id')

        plantation = None
        if plantation_id:
            try:
                plantation = Plantation.objects.get(id=plantation_id, farmer=user)
            except Plantation.DoesNotExist:
                pass

        try:
            amount = parse_decimal_safe(amount_raw)
            if amount is None or amount <= 0:
                return send_error(status.HTTP_400_BAD_REQUEST, 'Expense amount must be greater than 0')
        except ValueError as e:
            return send_error(status.HTTP_400_BAD_REQUEST, str(e))

        expense = ExpenseRecord.objects.create(
            farmer=user,
            plantation=plantation,
            category=category,
            amount=amount,
            description=(data.get('description') or '').strip(),
            expense_date=exp_date
        )
        serializer = ExpenseRecordSerializer(expense)
        return send_response(status.HTTP_201_CREATED, 'Expense recorded successfully', {'expense': serializer.data})

# 43. Farmer Sales List
@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def farmer_sales_list(request):
    auth_err = check_farmer_auth(request)
    if auth_err: return auth_err

    user = request.user
    qs = SaleRecord.objects.filter(farmer=user).order_by('-sale_date')
    serializer = SaleRecordSerializer(qs, many=True)
    return send_response(status.HTTP_200_OK, 'Sales records loaded', {'sales': serializer.data})

# 44. Farmer Transactions List
@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def farmer_transactions_list(request):
    auth_err = check_farmer_auth(request)
    if auth_err: return auth_err

    user = request.user
    from django.db.models import Q
    qs = TransactionRecord.objects.filter(Q(sender=user) | Q(receiver=user)).order_by('-created_at')
    serializer = TransactionRecordSerializer(qs, many=True)
    return send_response(status.HTTP_200_OK, 'Transaction records loaded', {'transactions': serializer.data})



# =============================================================================
# TRADER MODULE API VIEWS
# =============================================================================

def check_trader_auth(request):
    if not request.user or not request.user.is_authenticated:
        return send_error(status.HTTP_401_UNAUTHORIZED, 'Authentication required')
    if request.user.role != 'TRADER':
        return send_error(status.HTTP_403_FORBIDDEN, 'IAM Authorization Error: Role [TRADER] required')
    if request.user.status != 'APPROVED':
        return send_error(status.HTTP_403_FORBIDDEN, 'Account approval required')
    return None

def check_trader_or_farmer_auth(request):
    if not request.user or not request.user.is_authenticated:
        return send_error(status.HTTP_401_UNAUTHORIZED, 'Authentication required')
    if request.user.role not in ['TRADER', 'FARMER', 'ADMIN']:
        return send_error(status.HTTP_403_FORBIDDEN, 'IAM Authorization Error: Role [TRADER, FARMER, ADMIN] required')
    if request.user.status != 'APPROVED':
        return send_error(status.HTTP_403_FORBIDDEN, 'Account approval required')
    return None


# 45. Trader Dashboard Stats
@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def trader_dashboard_stats(request):
    auth_err = check_trader_auth(request)
    if auth_err: return auth_err

    user = request.user

    # Available Cardamom listings count
    available_cardamom_count = MarketplaceListing.objects.filter(status='AVAILABLE', available_quantity_kg__gt=0).count()
    # Add count of completed farmer dry harvests if no listings
    completed_harvests_count = HarvestRecord.objects.filter(dried_quantity_kg__gt=0).count()
    total_available_items = available_cardamom_count + completed_harvests_count

    # Pending purchase requests
    pending_purchase_requests = PurchaseRequest.objects.filter(trader=user, status='PENDING').count()

    # Total Purchased KG
    purchased_agg = PurchaseRequest.objects.filter(trader=user, status='COMPLETED').aggregate(total=Sum('requested_quantity_kg'))
    total_purchased_kg = float(purchased_agg['total'] or 0)

    # Current Inventory KG
    inventory_agg = InventoryItem.objects.filter(owner=user, status='IN_STOCK').aggregate(total=Sum('quantity_kg'))
    current_inventory_kg = float(inventory_agg['total'] or 0)

    # Total Sales Value
    sales_agg = SaleRecord.objects.filter(Q(farmer=user) | Q(buyer=user)).aggregate(total=Sum('total_amount'))
    total_sales_amount = float(sales_agg['total'] or 0)

    # Active Export Supply Orders
    active_orders_count = ExportSupplyRequest.objects.filter(trader=user, status__in=['PENDING', 'ACCEPTED']).count()

    # Transactions count
    transactions_count = TransactionRecord.objects.filter(Q(sender=user) | Q(receiver=user)).count()

    stats_data = {
        'available_cardamom': total_available_items,
        'pending_purchase_requests': pending_purchase_requests,
        'total_purchased_kg': total_purchased_kg,
        'current_inventory_kg': current_inventory_kg,
        'total_sales': total_sales_amount,
        'active_orders': active_orders_count,
        'transactions': transactions_count
    }

    return send_response(status.HTTP_200_OK, 'Trader dashboard stats loaded', {'stats': stats_data})


# 46. Trader Marketplace List
@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def trader_marketplace_list(request):
    auth_err = check_trader_or_farmer_auth(request)
    if auth_err: return auth_err

    variety_filter = request.GET.get('variety', '').strip()

    listings_data = []
    seen_ids = set()

    # 1. Explicit Marketplace Listings from Farmers
    qs = MarketplaceListing.objects.filter(status='AVAILABLE', available_quantity_kg__gt=0, farmer__role='FARMER').select_related('farmer', 'plantation')
    if variety_filter:
        qs = qs.filter(variety__icontains=variety_filter)

    for m in qs:
        key = f"m-{m.id}"
        seen_ids.add(key)
        listings_data.append({
            'id': key,
            'listing_id': m.id,
            'farmer_id': m.farmer.id,
            'farmer_name': m.farmer.full_name,
            'farmer_phone': m.farmer.phone,
            'variety': m.variety,
            'grade': m.grade or '8mm Bold',
            'available_quantity_kg': float(m.available_quantity_kg),
            'unit': m.unit or 'KG',
            'price_per_kg': float(m.price_per_kg) if m.price_per_kg and m.price_per_kg > 0 else 2000.00,
            'plantation_id': m.plantation.id if m.plantation else None,
            'plantation_name': m.plantation.name if m.plantation else 'Highland Cardamom Estate',
            'location': m.plantation.location if m.plantation else 'Vandanmedu, Idukki',
            'status': 'AVAILABLE',
            'available_date': str(m.available_date),
            'notes': m.notes or 'Organic high-altitude dry cured cardamom.'
        })

    # 2. Completed Dry Harvest Records from Farmers
    harvest_records = HarvestRecord.objects.filter(dried_quantity_kg__gt=0, farmer__role='FARMER').select_related('farmer', 'plantation')
    if variety_filter:
        harvest_records = harvest_records.filter(variety__icontains=variety_filter)

    for h in harvest_records:
        key = f"h-{h.id}"
        if key not in seen_ids:
            seen_ids.add(key)
            listings_data.append({
                'id': key,
                'harvest_record_id': h.id,
                'farmer_id': h.farmer.id,
                'farmer_name': h.farmer.full_name,
                'farmer_phone': h.farmer.phone,
                'variety': h.variety,
                'grade': h.grade or '8mm Bold',
                'available_quantity_kg': float(h.dried_quantity_kg),
                'unit': 'KG',
                'price_per_kg': 2000.00,
                'plantation_id': h.plantation.id if h.plantation else None,
                'plantation_name': h.plantation.name if h.plantation else 'Highland Cardamom Estate',
                'location': h.plantation.location if h.plantation else 'Vandanmedu, Idukki',
                'status': 'AVAILABLE',
                'available_date': str(h.harvest_date),
                'notes': h.notes or 'Premium dry harvest stock.'
            })

    # 3. Farmer Inventory Items
    inv_items = InventoryItem.objects.filter(
        status__in=['IN_STOCK', 'AVAILABLE'],
        quantity_kg__gt=0,
        owner__role__iexact='FARMER'
    ).select_related('owner', 'plantation').order_by('-created_at')

    if variety_filter:
        inv_items = inv_items.filter(variety__icontains=variety_filter)

    for inv in inv_items:
        key = f"i-{inv.id}"
        if key not in seen_ids:
            seen_ids.add(key)
            plant = inv.plantation or Plantation.objects.filter(farmer=inv.owner).first()
            p_id = plant.id if plant else None
            p_name = plant.name if plant else 'Highland Cardamom Estate'
            p_loc = plant.location if plant else 'Vandanmedu, Idukki'
            price_val = float(inv.purchase_price_per_kg) if inv.purchase_price_per_kg and inv.purchase_price_per_kg > 0 else 2000.00

            listings_data.append({
                'id': key,
                'inventory_item_id': inv.id,
                'farmer_id': inv.owner.id,
                'farmer_name': inv.owner.full_name,
                'farmer_phone': inv.owner.phone,
                'variety': inv.variety,
                'grade': inv.grade or '8mm Bold',
                'available_quantity_kg': float(inv.quantity_kg),
                'unit': inv.unit or 'KG',
                'price_per_kg': price_val,
                'plantation_id': p_id,
                'plantation_name': p_name,
                'location': p_loc,
                'status': 'AVAILABLE',
                'batch_code': inv.batch_code,
                'available_date': str(inv.created_at.date()),
                'notes': f"Available in-stock inventory ({inv.batch_code})"
            })

    return send_response(status.HTTP_200_OK, 'Marketplace available cardamom loaded', {'marketplace': listings_data})


# 47. Trader Marketplace Detail
@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def trader_marketplace_detail(request, listing_id):
    auth_err = check_trader_or_farmer_auth(request)
    if auth_err: return auth_err

    if str(listing_id).startswith('h-'):
        harvest_id = int(str(listing_id).replace('h-', ''))
        try:
            h = HarvestRecord.objects.select_related('farmer', 'plantation').get(id=harvest_id)
            item = {
                'id': f"h-{h.id}",
                'farmer_id': h.farmer.id,
                'farmer_name': h.farmer.full_name,
                'farmer_phone': h.farmer.phone,
                'variety': h.variety,
                'available_quantity_kg': float(h.dried_quantity_kg),
                'unit': 'KG',
                'price_per_kg': 2000.00,
                'grade': h.grade or '8mm Bold',
                'plantation_id': h.plantation.id if h.plantation else None,
                'plantation_name': h.plantation.name if h.plantation else 'Highland Cardamom Estate',
                'location': h.plantation.location if h.plantation else 'Vandanmedu, Idukki',
                'harvest_record_id': h.id,
                'status': 'AVAILABLE',
                'available_date': str(h.harvest_date),
                'notes': h.notes or 'Premium organic dry cured cardamom.'
            }
            return send_response(status.HTTP_200_OK, 'Cardamom details loaded', {'listing': item})
        except HarvestRecord.DoesNotExist:
            return send_error(status.HTTP_404_NOT_FOUND, 'Harvest record not found')
    elif str(listing_id).startswith('i-'):
        inv_id = int(str(listing_id).replace('i-', ''))
        try:
            inv = InventoryItem.objects.select_related('owner', 'plantation').get(id=inv_id)
            item = {
                'id': f"i-{inv.id}",
                'farmer_id': inv.owner.id,
                'farmer_name': inv.owner.full_name,
                'farmer_phone': inv.owner.phone,
                'variety': inv.variety,
                'available_quantity_kg': float(inv.quantity_kg),
                'unit': inv.unit or 'KG',
                'price_per_kg': 2000.00,
                'grade': inv.grade or '8mm Bold',
                'plantation_id': inv.plantation.id if inv.plantation else None,
                'plantation_name': inv.plantation.name if inv.plantation else 'Highland Cardamom Estate',
                'location': inv.plantation.location if inv.plantation else 'Vandanmedu, Idukki',
                'inventory_item_id': inv.id,
                'status': 'AVAILABLE',
                'available_date': str(inv.created_at.date()),
                'notes': f"Available in-stock inventory ({inv.batch_code})"
            }
            return send_response(status.HTTP_200_OK, 'Cardamom details loaded', {'listing': item})
        except InventoryItem.DoesNotExist:
            return send_error(status.HTTP_404_NOT_FOUND, 'Inventory item not found')
    else:
        try:
            clean_id = int(str(listing_id).replace('m-', ''))
            listing = MarketplaceListing.objects.select_related('farmer', 'plantation').get(id=clean_id)
            serializer = MarketplaceListingSerializer(listing)
            return send_response(status.HTTP_200_OK, 'Cardamom details loaded', {'listing': serializer.data})
        except (MarketplaceListing.DoesNotExist, ValueError):
            return send_error(status.HTTP_404_NOT_FOUND, 'Marketplace listing not found')


# 48. Trader Create Purchase Request
@api_view(['POST'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def trader_create_purchase_request(request):
    auth_err = check_trader_auth(request)
    if auth_err: return auth_err

    data = request.data
    farmer_id = data.get('farmer_id')
    variety = data.get('variety') or 'Njallani Gold'
    grade = data.get('grade') or '8mm Bold'
    plantation_id = data.get('plantation_id')
    listing_id_raw = data.get('marketplace_listing_id') or data.get('listing_id') or data.get('id')
    available_qty_raw = data.get('available_quantity_kg')
    requested_qty_raw = data.get('requested_quantity_kg')
    price_raw = data.get('price_per_kg')
    notes = data.get('notes', '')

    if not farmer_id or not requested_qty_raw or not price_raw:
        return send_error(status.HTTP_400_BAD_REQUEST, 'Farmer ID, requested quantity, and price per kg are required')

    try:
        farmer = User.objects.get(id=int(farmer_id), role='FARMER')
    except (User.DoesNotExist, ValueError):
        return send_error(status.HTTP_400_BAD_REQUEST, 'Valid Farmer target required')

    plantation = None
    if plantation_id:
        try:
            plantation = Plantation.objects.get(id=int(plantation_id))
        except (Plantation.DoesNotExist, ValueError):
            pass

    marketplace_listing = None
    if listing_id_raw:
        s_id = str(listing_id_raw)
        if s_id.startswith('m-') or s_id.isdigit():
            try:
                m_id = int(s_id.replace('m-', ''))
                marketplace_listing = MarketplaceListing.objects.get(id=m_id)
                if not available_qty_raw:
                    available_qty_raw = marketplace_listing.available_quantity_kg
            except (MarketplaceListing.DoesNotExist, ValueError):
                pass
        elif s_id.startswith('i-'):
            try:
                inv_id = int(s_id.replace('i-', ''))
                inv_item = InventoryItem.objects.get(id=inv_id)
                if not available_qty_raw:
                    available_qty_raw = inv_item.quantity_kg
                if not plantation and inv_item.plantation:
                    plantation = inv_item.plantation
            except (InventoryItem.DoesNotExist, ValueError):
                pass
        elif s_id.startswith('h-'):
            try:
                h_id = int(s_id.replace('h-', ''))
                h_rec = HarvestRecord.objects.get(id=h_id)
                if not available_qty_raw:
                    available_qty_raw = h_rec.dried_quantity_kg
                if not plantation and h_rec.plantation:
                    plantation = h_rec.plantation
            except (HarvestRecord.DoesNotExist, ValueError):
                pass

    try:
        requested_qty = parse_decimal_safe(requested_qty_raw)
        price_per_kg = parse_decimal_safe(price_raw)
        available_qty = parse_decimal_safe(available_qty_raw, default=requested_qty)
    except ValueError as e:
        return send_error(status.HTTP_400_BAD_REQUEST, str(e))

    if requested_qty is None or requested_qty <= 0:
        return send_error(status.HTTP_400_BAD_REQUEST, 'Requested quantity must be greater than 0')
    if price_per_kg is None or price_per_kg <= 0:
        return send_error(status.HTTP_400_BAD_REQUEST, 'Price per kg must be greater than 0')
    if requested_qty > available_qty:
        return send_error(status.HTTP_400_BAD_REQUEST, f'Requested quantity ({requested_qty} KG) cannot exceed available quantity ({available_qty} KG)')

    total_amount = requested_qty * price_per_kg
    payment_method = (data.get('payment_method') or 'ONLINE').strip().upper()
    if payment_method not in ['ONLINE', 'DIRECT']:
        payment_method = 'ONLINE'

    pr = PurchaseRequest.objects.create(
        trader=request.user,
        farmer=farmer,
        marketplace_listing=marketplace_listing,
        plantation=plantation,
        variety=variety,
        grade=grade,
        available_quantity_kg=available_qty,
        requested_quantity_kg=requested_qty,
        price_per_kg=price_per_kg,
        total_amount=total_amount,
        payment_method=payment_method,
        payment_status='PENDING',
        pickup_status='PENDING',
        notes=notes,
        status='PENDING'
    )

    # Send Notification to Farmer
    NotificationItem.objects.create(
        recipient=farmer,
        title='New Purchase Request Received',
        message=f"Trader {request.user.full_name} submitted a purchase request for {requested_qty} kg of {variety} ({grade}) at ₹{price_per_kg}/kg (Total: ₹{total_amount}, Payment: {payment_method}).",
        category='PURCHASE'
    )

    serializer = PurchaseRequestSerializer(pr)
    return send_response(status.HTTP_201_CREATED, 'Purchase request submitted successfully', {'purchase_request': serializer.data})


# Helper function to execute atomic purchase completion idempotently
def execute_atomic_purchase_completion(pr_id):
    from django.utils import timezone
    with transaction.atomic():
        pr_locked = PurchaseRequest.objects.select_for_update().get(id=pr_id)
        if pr_locked.status == 'COMPLETED':
            return pr_locked, True

        farmer = pr_locked.farmer
        trader = pr_locked.trader
        requested_qty = pr_locked.requested_quantity_kg

        # 1. Deduct from associated MarketplaceListing if present
        if pr_locked.marketplace_listing:
            listing = MarketplaceListing.objects.select_for_update().filter(id=pr_locked.marketplace_listing.id).first()
            if listing:
                deduct = min(listing.available_quantity_kg, requested_qty)
                listing.available_quantity_kg -= deduct
                if listing.available_quantity_kg <= 0:
                    listing.available_quantity_kg = Decimal('0.00')
                    listing.status = 'SOLD'
                listing.save()

        # 2. Deduct from Farmer's InventoryItems if present
        farmer_inventory = InventoryItem.objects.select_for_update().filter(
            owner=farmer, status__in=['IN_STOCK', 'AVAILABLE'], variety__icontains=pr_locked.variety
        )
        remaining_to_deduct = requested_qty
        for item in farmer_inventory:
            if remaining_to_deduct <= 0:
                break
            deduct = min(item.quantity_kg, remaining_to_deduct)
            item.quantity_kg -= deduct
            if item.quantity_kg <= 0:
                item.quantity_kg = Decimal('0.00')
                item.status = 'SOLD'
            item.save()
            remaining_to_deduct -= deduct

        # 3. Deduct from HarvestRecords if inventory was not enough
        if remaining_to_deduct > 0:
            harvest_records = HarvestRecord.objects.select_for_update().filter(
                farmer=farmer, variety__icontains=pr_locked.variety, dried_quantity_kg__gt=0
            )
            for h in harvest_records:
                if remaining_to_deduct <= 0:
                    break
                deduct = min(h.dried_quantity_kg, remaining_to_deduct)
                h.dried_quantity_kg -= deduct
                if h.dried_quantity_kg <= 0:
                    h.dried_quantity_kg = Decimal('0.00')
                h.save()
                remaining_to_deduct -= deduct

        # Mark Purchase Request as COMPLETED
        pr_locked.status = 'COMPLETED'
        pr_locked.pickup_status = 'COMPLETED'
        pr_locked.completed_at = timezone.now()
        pr_locked.save()

        # 4. Add to Trader's Inventory
        batch_code = f"BATCH-TRD-{secrets.token_hex(4).upper()}"
        InventoryItem.objects.create(
            owner=trader,
            source_farmer=farmer,
            plantation=pr_locked.plantation,
            variety=pr_locked.variety,
            quantity_kg=pr_locked.requested_quantity_kg,
            unit='KG',
            grade=pr_locked.grade or '8mm Bold',
            purchase_price_per_kg=pr_locked.price_per_kg,
            total_cost=pr_locked.total_amount,
            status='IN_STOCK',
            batch_code=batch_code
        )

        # 5. Record Transaction
        tx_code = f"TX-PR-{secrets.token_hex(4).upper()}"
        TransactionRecord.objects.create(
            transaction_code=tx_code,
            sender=trader,
            receiver=farmer,
            amount=pr_locked.total_amount,
            payment_method='Pay Online' if pr_locked.payment_method == 'ONLINE' else 'Direct Payment',
            status='SUCCESS'
        )

        # 6. Create Sale Record for Farmer
        from datetime import date
        SaleRecord.objects.create(
            farmer=farmer,
            buyer=trader,
            cardamom_variety=pr_locked.variety,
            grade=pr_locked.grade or '8mm Bold',
            plantation=pr_locked.plantation,
            quantity_kg=pr_locked.requested_quantity_kg,
            price_per_kg=pr_locked.price_per_kg,
            total_amount=pr_locked.total_amount,
            sale_date=date.today(),
            transaction_code=tx_code,
            status='COMPLETED'
        )

        # 7. Notify Trader & Farmer
        NotificationItem.objects.create(
            recipient=trader,
            title='Transaction Completed',
            message=f"Purchase of {pr_locked.requested_quantity_kg} kg {pr_locked.variety} from Farmer {farmer.full_name} is completed. Stock added to inventory.",
            category='PURCHASE'
        )

        NotificationItem.objects.create(
            recipient=farmer,
            title='Transaction Completed',
            message=f"Sale of {pr_locked.requested_quantity_kg} kg {pr_locked.variety} to Trader {trader.full_name} is finalized for ₹{pr_locked.total_amount}.",
            category='SALE'
        )

        return pr_locked, False


# 49. Trader & Farmer Purchase Requests List
@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def trader_purchase_requests_list(request):
    auth_err = check_trader_or_farmer_auth(request)
    if auth_err: return auth_err

    user = request.user
    if user.role == 'TRADER':
        qs = PurchaseRequest.objects.filter(trader=user)
    elif user.role == 'FARMER':
        qs = PurchaseRequest.objects.filter(farmer=user)
    else:
        qs = PurchaseRequest.objects.all()

    status_filter = request.GET.get('status', '').strip().upper()
    if status_filter:
        qs = qs.filter(status=status_filter)

    variety_filter = request.GET.get('variety', '').strip()
    if variety_filter:
        qs = qs.filter(variety__icontains=variety_filter)

    qs = qs.order_by('-created_at')
    serializer = PurchaseRequestSerializer(qs, many=True)
    return send_response(status.HTTP_200_OK, 'Purchase requests loaded', {'purchase_requests': serializer.data})


# 50. Respond / Action Purchase Request (Accept, Reject, Pay, Pickup, Handover, Complete, Cancel)
@api_view(['POST'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def respond_purchase_request(request, request_id):
    from django.utils import timezone
    auth_err = check_trader_or_farmer_auth(request)
    if auth_err: return auth_err

    try:
        pr = PurchaseRequest.objects.select_related('trader', 'farmer', 'plantation', 'marketplace_listing').get(id=int(request_id))
    except (PurchaseRequest.DoesNotExist, ValueError):
        return send_error(status.HTTP_404_NOT_FOUND, 'Purchase request not found')

    action = (request.data.get('action') or '').strip().upper()
    valid_actions = [
        'ACCEPT', 'REJECT', 'PAY_ONLINE', 'CONFIRM_DIRECT_PAYMENT',
        'SWITCH_PAYMENT_METHOD', 'CONFIRM_PICKUP', 'CONFIRM_HANDOVER',
        'COMPLETE', 'CANCEL'
    ]
    if action not in valid_actions:
        return send_error(status.HTTP_400_BAD_REQUEST, f"Invalid action. Allowed: {', '.join(valid_actions)}")

    user = request.user

    # Status check
    if pr.status in ['COMPLETED', 'REJECTED', 'CANCELLED'] and action not in ['COMPLETE']:
        return send_error(status.HTTP_400_BAD_REQUEST, f"Purchase request is already {pr.status.lower()}")

    # 1. Farmer Accepts Request
    if action == 'ACCEPT':
        if user != pr.farmer and user.role != 'ADMIN':
            return send_error(status.HTTP_403_FORBIDDEN, 'Only the target Farmer can accept this purchase request')

        pr.status = 'PAYMENT_PENDING'
        pr.payment_status = 'PENDING'
        pr.save()

        NotificationItem.objects.create(
            recipient=pr.trader,
            title='Purchase Request Accepted',
            message=f"Farmer {pr.farmer.full_name} accepted your purchase request for {pr.requested_quantity_kg} kg {pr.variety}. Status: PAYMENT PENDING.",
            category='PURCHASE'
        )
        serializer = PurchaseRequestSerializer(pr)
        return send_response(status.HTTP_200_OK, 'Purchase request accepted! Reserved stock and awaiting payment.', {'purchase_request': serializer.data})

    # 2. Farmer Rejects Request
    elif action == 'REJECT':
        if user != pr.farmer and user.role != 'ADMIN':
            return send_error(status.HTTP_403_FORBIDDEN, 'Only the target Farmer can reject this purchase request')

        pr.status = 'REJECTED'
        pr.save()

        NotificationItem.objects.create(
            recipient=pr.trader,
            title='Purchase Request Rejected',
            message=f"Farmer {pr.farmer.full_name} rejected your purchase request for {pr.requested_quantity_kg} kg {pr.variety}.",
            category='PURCHASE'
        )
        serializer = PurchaseRequestSerializer(pr)
        return send_response(status.HTTP_200_OK, 'Purchase request rejected', {'purchase_request': serializer.data})

    # 3. Trader Pays Online
    elif action == 'PAY_ONLINE':
        if user != pr.trader and user.role != 'ADMIN':
            return send_error(status.HTTP_403_FORBIDDEN, 'Only the requesting Trader can initiate online payment')

        payment_ref = request.data.get('payment_reference') or f"PAY-ONLINE-{secrets.token_hex(4).upper()}"
        pr.payment_method = 'ONLINE'
        pr.payment_status = 'PAID'
        pr.payment_reference = payment_ref
        pr.paid_at = timezone.now()
        pr.status = 'READY_FOR_PICKUP'
        pr.pickup_status = 'READY_FOR_PICKUP'
        pr.ready_for_pickup_at = timezone.now()
        pr.save()

        NotificationItem.objects.create(
            recipient=pr.farmer,
            title='Online Payment Received',
            message=f"Trader {pr.trader.full_name} completed online payment of ₹{pr.total_amount} (Ref: {payment_ref}). Stock is ready for pickup!",
            category='PURCHASE'
        )
        NotificationItem.objects.create(
            recipient=pr.trader,
            title='Payment Successful',
            message=f"Your online payment of ₹{pr.total_amount} for request #{pr.id} was successful! Stock is ready for pickup.",
            category='PURCHASE'
        )

        serializer = PurchaseRequestSerializer(pr)
        return send_response(status.HTTP_200_OK, 'Online payment verified successfully! Stock is ready for pickup.', {'purchase_request': serializer.data})

    # 4. Switch Payment Method
    elif action == 'SWITCH_PAYMENT_METHOD':
        new_method = (request.data.get('payment_method') or 'DIRECT').strip().upper()
        if new_method not in ['ONLINE', 'DIRECT']:
            new_method = 'DIRECT'
        pr.payment_method = new_method
        pr.save()
        serializer = PurchaseRequestSerializer(pr)
        return send_response(status.HTTP_200_OK, f'Payment method updated to {new_method}', {'purchase_request': serializer.data})

    # 5. Farmer Confirms Direct Payment Received
    elif action == 'CONFIRM_DIRECT_PAYMENT':
        if user != pr.farmer and user.role != 'ADMIN':
            return send_error(status.HTTP_403_FORBIDDEN, 'Only the target Farmer can confirm direct payment')

        pr.payment_status = 'PAID'
        pr.payment_reference = f"Direct Payment confirmed by Farmer {user.full_name} at {timezone.now().strftime('%d-%m-%Y %H:%M')}"
        pr.paid_at = timezone.now()
        pr.status = 'READY_FOR_PICKUP'
        pr.pickup_status = 'READY_FOR_PICKUP'
        pr.ready_for_pickup_at = timezone.now()
        pr.save()

        NotificationItem.objects.create(
            recipient=pr.trader,
            title='Direct Payment Confirmed',
            message=f"Farmer {pr.farmer.full_name} confirmed receipt of direct payment for request #{pr.id}. Stock is ready for pickup!",
            category='PURCHASE'
        )
        NotificationItem.objects.create(
            recipient=pr.farmer,
            title='Direct Payment Confirmed',
            message=f"You confirmed direct payment of ₹{pr.total_amount} for request #{pr.id}. Stock is ready for pickup.",
            category='SALE'
        )

        serializer = PurchaseRequestSerializer(pr)
        return send_response(status.HTTP_200_OK, 'Direct payment confirmed by Farmer! Stock is ready for pickup.', {'purchase_request': serializer.data})

    # 6. Trader Confirms Pickup
    elif action == 'CONFIRM_PICKUP':
        if user != pr.trader and user.role != 'ADMIN':
            return send_error(status.HTTP_403_FORBIDDEN, 'Only the Trader can confirm pickup')

        pr.pickup_confirmed_by_trader = True
        pr.pickup_status = 'PICKUP_CONFIRMED'
        pr.save()

        NotificationItem.objects.create(
            recipient=pr.farmer,
            title='Trader Confirmed Pickup',
            message=f"Trader {pr.trader.full_name} confirmed stock pickup for request #{pr.id}.",
            category='PURCHASE'
        )

        # Trigger completion if both confirmed or pickup confirmed
        pr_completed, _ = execute_atomic_purchase_completion(pr.id)
        serializer = PurchaseRequestSerializer(pr_completed)
        return send_response(status.HTTP_200_OK, 'Pickup confirmed and transaction completed successfully!', {'purchase_request': serializer.data})

    # 7. Farmer Confirms Handover
    elif action == 'CONFIRM_HANDOVER':
        if user != pr.farmer and user.role != 'ADMIN':
            return send_error(status.HTTP_403_FORBIDDEN, 'Only the Farmer can confirm handover')

        pr.handover_confirmed_by_farmer = True
        pr.pickup_status = 'PICKUP_CONFIRMED'
        pr.save()

        NotificationItem.objects.create(
            recipient=pr.trader,
            title='Farmer Confirmed Stock Handover',
            message=f"Farmer {pr.farmer.full_name} confirmed stock handover for request #{pr.id}.",
            category='PURCHASE'
        )

        # Trigger completion
        pr_completed, _ = execute_atomic_purchase_completion(pr.id)
        serializer = PurchaseRequestSerializer(pr_completed)
        return send_response(status.HTTP_200_OK, 'Stock handover confirmed and transaction completed successfully!', {'purchase_request': serializer.data})

    # 8. Complete Action (Explicit)
    elif action == 'COMPLETE':
        pr_completed, _ = execute_atomic_purchase_completion(pr.id)
        serializer = PurchaseRequestSerializer(pr_completed)
        return send_response(status.HTTP_200_OK, 'Purchase request completed successfully!', {'purchase_request': serializer.data})

    # 9. Cancel Action
    elif action == 'CANCEL':
        if user != pr.trader and user != pr.farmer and user.role != 'ADMIN':
            return send_error(status.HTTP_403_FORBIDDEN, 'Unauthorized to cancel this purchase request')

        pr.status = 'CANCELLED'
        pr.save()

        other_user = pr.farmer if user == pr.trader else pr.trader
        NotificationItem.objects.create(
            recipient=other_user,
            title='Purchase Request Cancelled',
            message=f"Purchase request #{pr.id} for {pr.requested_quantity_kg} kg {pr.variety} was cancelled.",
            category='PURCHASE'
        )
        serializer = PurchaseRequestSerializer(pr)
        return send_response(status.HTTP_200_OK, 'Purchase request cancelled', {'purchase_request': serializer.data})


# 51. Trader Inventory List & Create
@api_view(['GET', 'POST'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def trader_inventory_list(request):
    auth_err = check_trader_auth(request)
    if auth_err: return auth_err

    user = request.user
    if request.method == 'GET':
        qs = InventoryItem.objects.filter(owner=user).order_by('-created_at')
        serializer = InventoryItemSerializer(qs, many=True)
        return send_response(status.HTTP_200_OK, 'Trader inventory loaded', {'inventory': serializer.data})

    elif request.method == 'POST':
        data = request.data
        variety = data.get('variety') or 'Njallani Gold'
        qty_raw = data.get('quantity_kg')
        grade = data.get('grade') or '8mm Bold'

        try:
            qty = parse_decimal_safe(qty_raw)
            if qty is None or qty <= 0:
                return send_error(status.HTTP_400_BAD_REQUEST, 'Quantity must be greater than 0')
        except ValueError as e:
            return send_error(status.HTTP_400_BAD_REQUEST, str(e))

        batch_code = f"BATCH-TRD-{secrets.token_hex(4).upper()}"
        item = InventoryItem.objects.create(
            owner=user,
            variety=variety,
            quantity_kg=qty,
            unit='KG',
            grade=grade,
            status='IN_STOCK',
            batch_code=batch_code
        )

        serializer = InventoryItemSerializer(item)
        return send_response(status.HTTP_201_CREATED, 'Inventory item added', {'inventory_item': serializer.data})


# 52. Trader Purchase History
@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def trader_purchase_history(request):
    auth_err = check_trader_auth(request)
    if auth_err: return auth_err

    user = request.user
    qs = PurchaseRequest.objects.filter(trader=user, status='COMPLETED').order_by('-updated_at')

    variety_filter = request.GET.get('variety', '').strip()
    if variety_filter:
        qs = qs.filter(variety__icontains=variety_filter)

    serializer = PurchaseRequestSerializer(qs, many=True)
    return send_response(status.HTTP_200_OK, 'Purchase history loaded', {'purchase_history': serializer.data})


# 53. Trader Sales List & Create
@api_view(['GET', 'POST'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def trader_sales_list_create(request):
    auth_err = check_trader_auth(request)
    if auth_err: return auth_err

    user = request.user
    if request.method == 'GET':
        qs = SaleRecord.objects.filter(Q(farmer=user) | Q(buyer=user)).order_by('-sale_date')
        serializer = SaleRecordSerializer(qs, many=True)
        return send_response(status.HTTP_200_OK, 'Trader sales records loaded', {'sales': serializer.data})

    elif request.method == 'POST':
        data = request.data
        variety = data.get('variety') or 'Njallani Gold'
        qty_raw = data.get('quantity_kg')
        price_raw = data.get('selling_price_per_kg')
        buyer_name = data.get('buyer') or 'Domestic Market Buyer'
        notes = data.get('notes', '')

        try:
            qty = parse_decimal_safe(qty_raw)
            price = parse_decimal_safe(price_raw)
            if qty is None or qty <= 0:
                return send_error(status.HTTP_400_BAD_REQUEST, 'Sale quantity must be greater than 0')
            if price is None or price <= 0:
                return send_error(status.HTTP_400_BAD_REQUEST, 'Selling price must be greater than 0')
            if qty > 999999.99 or price > 999999.99:
                return send_error(status.HTTP_400_BAD_REQUEST, 'Value is out of valid bounds')
        except ValueError as e:
            return send_error(status.HTTP_400_BAD_REQUEST, str(e))

        # Check Trader Inventory available stock
        inventory_items = InventoryItem.objects.filter(owner=user, status='IN_STOCK')
        total_available = inventory_items.aggregate(total=Sum('quantity_kg'))['total'] or Decimal('0.00')

        if qty > total_available:
            return send_error(
                status.HTTP_400_BAD_REQUEST,
                f"Cannot sell {qty} kg. Total available inventory is {total_available} kg."
            )

        # Deduct quantity from inventory items
        remaining_to_deduct = qty
        with transaction.atomic():
            for item in inventory_items.order_by('created_at'):
                if remaining_to_deduct <= 0:
                    break
                if item.quantity_kg <= remaining_to_deduct:
                    remaining_to_deduct -= item.quantity_kg
                    item.quantity_kg = Decimal('0.00')
                    item.status = 'SOLD_OUT'
                    item.save()
                else:
                    item.quantity_kg -= remaining_to_deduct
                    remaining_to_deduct = Decimal('0.00')
                    item.save()

            total_amount = qty * price
            from datetime import date

            # Find or create a dummy buyer user for record
            buyer_user = User.objects.filter(role='EXPORTER').first() or user

            sale = SaleRecord.objects.create(
                farmer=user, # Trader acts as seller
                buyer=buyer_user,
                cardamom_variety=variety,
                quantity_kg=qty,
                total_amount=total_amount,
                sale_date=date.today(),
                status='COMPLETED'
            )

            # Record Transaction
            tx_code = f"TX-SALE-{secrets.token_hex(4).upper()}"
            TransactionRecord.objects.create(
                transaction_code=tx_code,
                sender=buyer_user,
                receiver=user,
                amount=total_amount,
                payment_method='Bank Transfer',
                status='SUCCESS'
            )

        serializer = SaleRecordSerializer(sale)
        return send_response(status.HTTP_201_CREATED, 'Sale completed and inventory updated successfully!', {'sale': serializer.data})


# 54. Trader Transactions List
@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def trader_transactions_list(request):
    auth_err = check_trader_auth(request)
    if auth_err: return auth_err

    user = request.user
    qs = TransactionRecord.objects.filter(Q(sender=user) | Q(receiver=user)).order_by('-created_at')
    serializer = TransactionRecordSerializer(qs, many=True)
    return send_response(status.HTTP_200_OK, 'Transactions loaded', {'transactions': serializer.data})


# 55. Trader Export Supply List & Create
@api_view(['GET', 'POST'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def trader_export_supply_list_create(request):
    auth_err = check_trader_auth(request)
    if auth_err: return auth_err

    user = request.user
    if request.method == 'GET':
        qs = ExportSupplyRequest.objects.filter(trader=user).order_by('-created_at')
        serializer = ExportSupplyRequestSerializer(qs, many=True)
        return send_response(status.HTTP_200_OK, 'Export supply requests loaded', {'export_supplies': serializer.data})

    elif request.method == 'POST':
        data = request.data
        variety = data.get('variety') or 'Njallani Gold'
        qty_raw = data.get('quantity_kg')
        price_raw = data.get('price_per_kg', 0)
        notes = data.get('notes', '')

        try:
            qty = parse_decimal_safe(qty_raw)
            price = parse_decimal_safe(price_raw, default=Decimal('0.00'))
            if qty is None or qty <= 0:
                return send_error(status.HTTP_400_BAD_REQUEST, 'Supply quantity must be greater than 0')
        except ValueError as e:
            return send_error(status.HTTP_400_BAD_REQUEST, str(e))

        exporter = User.objects.filter(role='EXPORTER').first()

        supply = ExportSupplyRequest.objects.create(
            trader=user,
            exporter=exporter,
            variety=variety,
            quantity_kg=qty,
            price_per_kg=price,
            notes=notes,
            status='PENDING'
        )

        serializer = ExportSupplyRequestSerializer(supply)
        return send_response(status.HTTP_201_CREATED, 'Export supply offer submitted to exporters', {'export_supply': serializer.data})


# 56. Trader Reports & Analytics
@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def trader_reports(request):
    auth_err = check_trader_auth(request)
    if auth_err: return auth_err

    user = request.user

    # Purchases Summary
    purchases_qs = PurchaseRequest.objects.filter(trader=user, status='COMPLETED')
    total_purchased_qty = float(purchases_qs.aggregate(total=Sum('requested_quantity_kg'))['total'] or 0)
    total_purchased_val = float(purchases_qs.aggregate(total=Sum('total_amount'))['total'] or 0)
    unique_farmers = purchases_qs.values('farmer').distinct().count()

    # Inventory Summary
    inventory_qs = InventoryItem.objects.filter(owner=user, status='IN_STOCK')
    current_stock = float(inventory_qs.aggregate(total=Sum('quantity_kg'))['total'] or 0)

    # Sales Summary
    sales_qs = SaleRecord.objects.filter(Q(farmer=user) | Q(buyer=user))
    total_sold_qty = float(sales_qs.aggregate(total=Sum('quantity_kg'))['total'] or 0)
    total_sales_val = float(sales_qs.aggregate(total=Sum('total_amount'))['total'] or 0)
    sales_count = sales_qs.count()

    # Gross Margin = Sales Value - Purchase Cost
    gross_margin = total_sales_val - total_purchased_val

    reports_data = {
        'purchase_report': {
            'total_quantity_purchased_kg': total_purchased_qty,
            'total_purchase_value': total_purchased_val,
            'number_of_farmers': unique_farmers,
        },
        'inventory_report': {
            'current_stock_kg': current_stock,
            'total_purchased_kg': total_purchased_qty,
            'total_sold_kg': total_sold_qty,
            'remaining_stock_kg': current_stock,
        },
        'sales_report': {
            'total_quantity_sold_kg': total_sold_qty,
            'total_sales_value': total_sales_val,
            'number_of_sales': sales_count,
        },
        'margin_report': {
            'purchase_value': total_purchased_val,
            'sales_value': total_sales_val,
            'gross_margin': gross_margin
        }
    }

    return send_response(status.HTTP_200_OK, 'Trader reports loaded', {'reports': reports_data})


# 57. Trader Notifications
@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def trader_notifications(request):
    auth_err = check_trader_auth(request)
    if auth_err: return auth_err

    user = request.user
    qs = NotificationItem.objects.filter(Q(recipient=user) | Q(recipient__isnull=True)).order_by('-created_at')[:50]
    serializer = NotificationItemSerializer(qs, many=True)
    return send_response(status.HTTP_200_OK, 'Notifications loaded', {'notifications': serializer.data})


# 58. Trader Update Profile
@api_view(['PUT'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def trader_update_profile(request):
    auth_err = check_trader_auth(request)
    if auth_err: return auth_err

    user = request.user
    data = request.data

    full_name = data.get('full_name')
    phone = data.get('phone')

    if full_name:
        user.full_name = str(full_name).strip()
    if phone:
        user.phone = str(phone).strip()

    user.save()
    serializer = UserSerializer(user)
    return send_response(status.HTTP_200_OK, 'Profile updated successfully', {'user': serializer.data})


# 59. Farmer Reports & Analytics API
@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def farmer_reports(request):
    if request.user.role != 'FARMER':
        return send_error(status.HTTP_403_FORBIDDEN, 'Only farmers can access farmer reports')

    user = request.user

    # Query params
    period = request.GET.get('period', 'all')
    start_date_str = request.GET.get('start_date')
    end_date_str = request.GET.get('end_date')

    # Base Querysets strictly owned by logged in Farmer
    harvest_qs = HarvestRecord.objects.filter(farmer=user).order_by('-harvest_date')
    cycles_qs = HarvestCycle.objects.filter(farmer=user).order_by('-created_at')
    inventory_qs = InventoryItem.objects.filter(owner=user).order_by('-created_at')
    sales_qs = SaleRecord.objects.filter(farmer=user).order_by('-sale_date')
    expenses_qs = ExpenseRecord.objects.filter(farmer=user).order_by('-expense_date')
    agro_qs = AgrochemicalUsage.objects.filter(farmer=user).order_by('-application_date')
    irrigation_qs = IrrigationRecord.objects.filter(farmer=user).order_by('-irrigation_date')
    plantations_qs = Plantation.objects.filter(farmer=user)
    transactions_qs = TransactionRecord.objects.filter(Q(sender=user) | Q(receiver=user)).order_by('-created_at')

    # Date Filtering Helper
    from datetime import date, datetime, timedelta
    today = date.today()
    filter_start = None
    filter_end = None

    if period == 'today':
        filter_start = today
        filter_end = today
    elif period == 'week':
        filter_start = today - timedelta(days=7)
        filter_end = today
    elif period == 'month':
        filter_start = today.replace(day=1)
        filter_end = today
    elif period == 'year':
        filter_start = today.replace(month=1, day=1)
        filter_end = today
    elif period == 'custom' and start_date_str and end_date_str:
        try:
            filter_start = datetime.strptime(start_date_str, '%Y-%m-%d').date()
            filter_end = datetime.strptime(end_date_str, '%Y-%m-%d').date()
        except ValueError:
            pass

    if filter_start and filter_end:
        harvest_qs = harvest_qs.filter(harvest_date__gte=filter_start, harvest_date__lte=filter_end)
        sales_qs = sales_qs.filter(sale_date__gte=filter_start, sale_date__lte=filter_end)
        expenses_qs = expenses_qs.filter(expense_date__gte=filter_start, expense_date__lte=filter_end)
        agro_qs = agro_qs.filter(application_date__gte=filter_start, application_date__lte=filter_end)
        irrigation_qs = irrigation_qs.filter(irrigation_date__gte=filter_start, irrigation_date__lte=filter_end)

    # 1. Harvest Report Data
    harvest_list = list(harvest_qs.values('id', 'harvest_date', 'fresh_quantity_kg', 'dried_quantity_kg', 'variety', 'grade', 'notes', 'plantation__name', 'harvest_cycle__name'))
    total_fresh = sum(float(h['fresh_quantity_kg'] or 0) for h in harvest_list)
    total_dry = sum(float(h['dried_quantity_kg'] or 0) for h in harvest_list)
    unique_harvest_days = len(set(h['harvest_date'] for h in harvest_list))
    avg_fresh_per_day = round(total_fresh / unique_harvest_days, 2) if unique_harvest_days > 0 else 0
    avg_dry_per_day = round(total_dry / unique_harvest_days, 2) if unique_harvest_days > 0 else 0

    highest_harvest_record = max(harvest_list, key=lambda x: float(x['fresh_quantity_kg'] or 0), default=None)
    lowest_harvest_record = min(harvest_list, key=lambda x: float(x['fresh_quantity_kg'] or 0), default=None)

    active_cycles_cnt = cycles_qs.filter(status='ACTIVE').count()
    completed_cycles_cnt = cycles_qs.filter(status='COMPLETED').count()

    # 2. Inventory Report Data
    inventory_list = list(inventory_qs.values('id', 'batch_code', 'variety', 'grade', 'quantity_kg', 'unit', 'status', 'created_at', 'plantation__name'))
    total_inventory_kg = sum(float(i['quantity_kg'] or 0) for i in inventory_list)
    in_stock_kg = sum(float(i['quantity_kg'] or 0) for i in inventory_list if i['status'] in ['IN_STOCK', 'AVAILABLE'])
    sold_inventory_kg = sum(float(i['quantity_kg'] or 0) for i in inventory_list if i['status'] == 'SOLD')
    available_inventory_kg = in_stock_kg

    variety_inventory = {}
    grade_inventory = {}
    for item in inventory_list:
        v = item['variety'] or 'Unknown'
        g = item['grade'] or 'Ungraded'
        q = float(item['quantity_kg'] or 0)
        variety_inventory[v] = variety_inventory.get(v, 0) + q
        grade_inventory[g] = grade_inventory.get(g, 0) + q

    # 3. Sales Report Data
    sales_list = list(sales_qs.values('id', 'buyer__full_name', 'cardamom_variety', 'grade', 'quantity_kg', 'price_per_kg', 'total_amount', 'sale_date', 'transaction_code', 'status', 'plantation__name'))
    total_sales_val = sum(float(s['total_amount'] or 0) for s in sales_list)
    total_sold_qty = sum(float(s['quantity_kg'] or 0) for s in sales_list)
    avg_selling_price = round(total_sales_val / total_sold_qty, 2) if total_sold_qty > 0 else 0
    highest_sale = max(sales_list, key=lambda s: float(s['total_amount'] or 0), default=None)
    lowest_sale = min(sales_list, key=lambda s: float(s['total_amount'] or 0), default=None)

    # Sales by trader
    trader_sales = {}
    for s in sales_list:
        trader = s['buyer__full_name'] or 'Direct Trader'
        if trader not in trader_sales:
            trader_sales[trader] = {'quantity_kg': 0, 'total_amount': 0, 'count': 0}
        trader_sales[trader]['quantity_kg'] += float(s['quantity_kg'] or 0)
        trader_sales[trader]['total_amount'] += float(s['total_amount'] or 0)
        trader_sales[trader]['count'] += 1

    # 4. Expense Report Data
    expense_list = list(expenses_qs.values('id', 'category', 'amount', 'description', 'expense_date', 'plantation__name'))
    total_expenses_val = sum(float(e['amount'] or 0) for e in expense_list)
    fertilizer_expenses = sum(float(e['amount'] or 0) for e in expense_list if 'fertilizer' in (e['category'] or '').lower())
    pesticide_expenses = sum(float(e['amount'] or 0) for e in expense_list if 'pesticide' in (e['category'] or '').lower())
    irrigation_expenses = sum(float(e['amount'] or 0) for e in expense_list if 'irrigation' in (e['category'] or '').lower())
    other_expenses = total_expenses_val - (fertilizer_expenses + pesticide_expenses + irrigation_expenses)

    # 5. Agrochemical Report Data
    agro_list = list(agro_qs.values('id', 'name', 'usage_type', 'quantity', 'unit', 'application_date', 'next_application_date', 'cost', 'purpose', 'plantation__name'))
    fert_items = [a for a in agro_list if a['usage_type'] == 'FERTILIZER']
    pest_items = [a for a in agro_list if a['usage_type'] == 'PESTICIDE']

    total_fert_qty = sum(float(a['quantity'] or 0) for a in fert_items)
    total_fert_cost = sum(float(a['cost'] or 0) for a in fert_items)
    total_pest_qty = sum(float(a['quantity'] or 0) for a in pest_items)
    total_pest_cost = sum(float(a['cost'] or 0) for a in pest_items)

    # 6. Irrigation Report Data
    irrigation_list = list(irrigation_qs.values('id', 'method', 'duration_hours', 'water_volume_liters', 'irrigation_date', 'plantation__name'))
    total_water_liters = sum(float(i['water_volume_liters'] or 0) for i in irrigation_list)
    total_irrigation_hours = sum(float(i['duration_hours'] or 0) for i in irrigation_list)
    last_irrigation = irrigation_list[0]['irrigation_date'].strftime('%Y-%m-%d') if irrigation_list else None

    # 7. Overall Summary
    total_plantations_cnt = plantations_qs.count()
    gross_difference = total_sales_val - total_expenses_val

    data = {
        'period': period,
        'date_range': {'start': filter_start.strftime('%Y-%m-%d') if filter_start else None, 'end': filter_end.strftime('%Y-%m-%d') if filter_end else None},
        'harvest_report': {
            'total_harvest_days': unique_harvest_days,
            'total_fresh_kg': total_fresh,
            'total_dry_kg': total_dry,
            'avg_fresh_per_day': avg_fresh_per_day,
            'avg_dry_per_day': avg_dry_per_day,
            'highest_harvest_record': highest_harvest_record,
            'lowest_harvest_record': lowest_harvest_record,
            'active_cycles_count': active_cycles_cnt,
            'completed_cycles_count': completed_cycles_cnt,
            'records': harvest_list
        },
        'inventory_report': {
            'total_inventory_kg': total_inventory_kg,
            'items_count': len(inventory_list),
            'in_stock_kg': in_stock_kg,
            'sold_kg': sold_inventory_kg,
            'available_kg': available_inventory_kg,
            'variety_wise': variety_inventory,
            'grade_wise': grade_inventory,
            'records': inventory_list
        },
        'sales_report': {
            'total_sales': len(sales_list),
            'total_quantity_sold_kg': total_sold_qty,
            'total_sales_amount': total_sales_val,
            'avg_selling_price_per_kg': avg_selling_price,
            'highest_sale': highest_sale,
            'lowest_sale': lowest_sale,
            'trader_sales_breakdown': trader_sales,
            'records': sales_list
        },
        'expense_report': {
            'total_expenses': total_expenses_val,
            'fertilizer_cost': fertilizer_expenses + total_fert_cost,
            'pesticide_cost': pesticide_expenses + total_pest_cost,
            'irrigation_cost': irrigation_expenses,
            'other_expenses': max(0, other_expenses - (total_fert_cost + total_pest_cost)),
            'records': expense_list
        },
        'agrochemical_report': {
            'total_fertilizer_qty': total_fert_qty,
            'total_fertilizer_cost': total_fert_cost,
            'total_pesticide_qty': total_pest_qty,
            'total_pesticide_cost': total_pest_cost,
            'total_applications': len(agro_list),
            'records': agro_list
        },
        'irrigation_report': {
            'records_count': len(irrigation_list),
            'total_water_liters': total_water_liters,
            'total_duration_hours': total_irrigation_hours,
            'last_irrigation_date': last_irrigation,
            'records': irrigation_list
        },
        'overall_summary': {
            'total_plantations': total_plantations_cnt,
            'total_fresh_harvest_kg': total_fresh,
            'total_dry_harvest_kg': total_dry,
            'total_inventory_kg': total_inventory_kg,
            'total_sales_amount': total_sales_val,
            'total_expenses_amount': total_expenses_val,
            'total_transactions_count': transactions_qs.count(),
            'gross_difference': gross_difference
        }
    }

    return send_response(status.HTTP_200_OK, 'Farmer reports fetched successfully', data)





import os
import json
import base64
import hmac
import hashlib
import time
from django.contrib.auth.hashers import make_password as dj_make_password, check_password as dj_check_password
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed, PermissionDenied
from iam.models import User
from iam.config import get_permissions_for_role

JWT_SECRET = os.getenv('JWT_SECRET', 'cardalink_super_secret_jwt_key_2026')

def _base64url_encode(input_bytes):
    return base64.urlsafe_b64encode(input_bytes).rstrip(b'=').decode('utf-8')

def _base64url_decode(input_str):
    rem = len(input_str) % 4
    if rem > 0:
        input_str += '=' * (4 - rem)
    return base64.urlsafe_b64decode(input_str.encode('utf-8'))

def generate_jwt_token(user):
    header = {'alg': 'HS256', 'typ': 'JWT'}
    payload = {
        'userId': user.id,
        'role': user.role,
        'exp': int(time.time()) + 86400,
        'iat': int(time.time())
    }
    
    header_b64 = _base64url_encode(json.dumps(header, separators=(',', ':')).encode('utf-8'))
    payload_b64 = _base64url_encode(json.dumps(payload, separators=(',', ':')).encode('utf-8'))
    
    signing_input = f"{header_b64}.{payload_b64}".encode('utf-8')
    signature = hmac.new(JWT_SECRET.encode('utf-8'), signing_input, hashlib.sha256).digest()
    signature_b64 = _base64url_encode(signature)
    
    return f"{header_b64}.{payload_b64}.{signature_b64}"

def verify_jwt_token(token):
    try:
        parts = token.split('.')
        if len(parts) != 3:
            raise AuthenticationFailed('IAM Authentication Error: Token invalid or corrupted')
        
        header_b64, payload_b64, signature_b64 = parts
        signing_input = f"{header_b64}.{payload_b64}".encode('utf-8')
        
        expected_sig = hmac.new(JWT_SECRET.encode('utf-8'), signing_input, hashlib.sha256).digest()
        actual_sig = _base64url_decode(signature_b64)
        
        if not hmac.compare_digest(expected_sig, actual_sig):
            raise AuthenticationFailed('IAM Authentication Error: Token signature invalid')
        
        payload = json.loads(_base64url_decode(payload_b64).decode('utf-8'))
        
        if 'exp' in payload and time.time() > payload['exp']:
            raise AuthenticationFailed('IAM Session Expired: Please log in again')
            
        return payload
    except AuthenticationFailed:
        raise
    except Exception:
        raise AuthenticationFailed('IAM Authentication Error: Token invalid or corrupted')

def hash_password(password):
    return dj_make_password(password)

def check_password(password, password_hash):
    if not password_hash:
        return False
    try:
        if password_hash.startswith('$2a$') or password_hash.startswith('$2b$') or password_hash.startswith('$2y$'):
            try:
                import bcrypt
                if bcrypt.checkpw(password.encode('utf-8'), password_hash.encode('utf-8')):
                    return True
            except Exception:
                pass
        return dj_check_password(password, password_hash)
    except Exception:
        return False

class JWTAuthentication(BaseAuthentication):
    def authenticate_header(self, request):
        return 'Bearer realm="api"'

    def authenticate(self, request):
        token = None
        auth_header = request.headers.get('Authorization')
        
        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]
        elif 'cardalink_token' in request.COOKIES:
            token = request.COOKIES['cardalink_token']
        elif 'token' in request.COOKIES:
            token = request.COOKIES['token']
        elif request.META.get('HTTP_COOKIE'):
            for item in request.META.get('HTTP_COOKIE').split(';'):
                item = item.strip()
                if item.startswith('cardalink_token='):
                    token = item.split('cardalink_token=')[1]
                    break
                elif item.startswith('token='):
                    token = item.split('token=')[1]
                    break
        
        if not token:
            return None

        decoded = verify_jwt_token(token)
        user_id = decoded.get('userId')
        
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            raise AuthenticationFailed('IAM Identity Error: User account no longer exists')

        # Enforce Account Status
        st = (user.status or '').strip().upper()
        if st == 'PENDING':
            raise PermissionDenied('IAM Access Denied: Your account is pending administrator approval')
        if st == 'REJECTED':
            raise PermissionDenied('IAM Access Denied: Your account registration has been rejected')
        if st == 'SUSPENDED':
            raise PermissionDenied('IAM Access Denied: Your account has been suspended by system administrator')
        if st != 'APPROVED':
            raise PermissionDenied(f'IAM Access Denied: Account status [{st}] is not permitted')

        user.permissions = get_permissions_for_role(user.role)
        return (user, token)

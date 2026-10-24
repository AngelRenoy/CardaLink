import os
from pathlib import Path
from dotenv import load_dotenv

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# Load environment variables from backend/.env (reload on update)
load_dotenv(BASE_DIR / '.env', override=True)

SECRET_KEY = os.getenv('JWT_SECRET', 'cardalink_super_secret_django_key_2026')
DEBUG = os.getenv('NODE_ENV', 'development') != 'production'

ALLOWED_HOSTS = ['*']

# Reverse Proxy SSL Header for Render / Cloud deployments
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
USE_X_FORWARDED_HOST = True

INSTALLED_APPS = [
    'django.contrib.contenttypes',
    'django.contrib.auth',
    'django.contrib.sessions',
    'django.contrib.messages',
    'corsheaders',
    'rest_framework',
    'iam',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
]

ROOT_URLCONF = 'cardalink_server.urls'

TEMPLATES = []

WSGI_APPLICATION = 'cardalink_server.wsgi.application'

import dj_database_url

# PostgreSQL Database Configuration
database_url = os.getenv('DATABASE_URL')
if database_url:
    DATABASES = {
        'default': dj_database_url.config(default=database_url, conn_max_age=600, ssl_require=False)
    }
else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': os.getenv('DB_NAME', 'cardalink_db'),
            'USER': os.getenv('DB_USER', 'postgres'),
            'PASSWORD': os.getenv('DB_PASSWORD', 'root'),
            'HOST': os.getenv('DB_HOST', 'localhost'),
            'PORT': os.getenv('DB_PORT', '5432'),
        }
    }

# CORS Settings
CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOWED_ORIGINS = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:5000',
    'http://127.0.0.1:5000',
]
CORS_ALLOW_CREDENTIALS = True

# REST Framework Configuration
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'iam.auth.JWTAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.AllowAny',
    ],
    'UNAUTHENTICATED_USER': None,
}

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# Static & Media Files
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# Frontend Application Base URL
raw_frontend = os.getenv('FRONTEND_URL', '').strip()
if not raw_frontend:
    if os.getenv('RENDER') or os.getenv('NODE_ENV') == 'production':
        FRONTEND_URL = 'https://carda-link.vercel.app'
    else:
        FRONTEND_URL = 'http://localhost:5173'
else:
    FRONTEND_URL = raw_frontend.rstrip('/')

# Email Configuration
EMAIL_HOST_USER = os.getenv('EMAIL_HOST_USER', '').strip()
# Automatically clean password: strip whitespace and spaces from Google App Password
EMAIL_HOST_PASSWORD = os.getenv('EMAIL_HOST_PASSWORD', '').strip().replace(' ', '')

EMAIL_BACKEND = os.getenv(
    'EMAIL_BACKEND',
    'django.core.mail.backends.smtp.EmailBackend' if (EMAIL_HOST_USER and EMAIL_HOST_PASSWORD) else 'django.core.mail.backends.console.EmailBackend'
)
EMAIL_HOST = os.getenv('EMAIL_HOST', 'smtp.gmail.com').strip()
EMAIL_PORT = int(os.getenv('EMAIL_PORT', 587))
EMAIL_TIMEOUT = int(os.getenv('EMAIL_TIMEOUT', 10))

# SSL vs TLS: port 465 uses SSL, port 587 uses TLS (mutually exclusive in Django)
use_ssl_env = os.getenv('EMAIL_USE_SSL', '').strip().lower()
if use_ssl_env in ('true', '1', 't') or EMAIL_PORT == 465:
    EMAIL_USE_SSL = True
    EMAIL_USE_TLS = False
else:
    EMAIL_USE_SSL = False
    EMAIL_USE_TLS = os.getenv('EMAIL_USE_TLS', 'True').lower() in ('true', '1', 't')

# Default From Email: Ensure valid sender header matching EMAIL_HOST_USER for Gmail SMTP
default_from = os.getenv('DEFAULT_FROM_EMAIL', '').strip()
if default_from and 'no-reply@cardalink.com' not in default_from:
    DEFAULT_FROM_EMAIL = default_from
elif EMAIL_HOST_USER:
    DEFAULT_FROM_EMAIL = f"CardaLink Exports <{EMAIL_HOST_USER}>"
else:
    DEFAULT_FROM_EMAIL = 'CardaLink Exports <no-reply@cardalink.com>'

# Cloud HTTP Email Services (Recommended on cloud platforms like Render where SMTP ports 25, 465, 587 are blocked)
RESEND_API_KEY = os.getenv('RESEND_API_KEY', '').strip()
BREVO_API_KEY = os.getenv('BREVO_API_KEY', '').strip()

# Buyer Delivery Confirmation Expiry in hours (default: 72 hours)
DELIVERY_CONFIRMATION_EXPIRY_HOURS = int(os.getenv('DELIVERY_CONFIRMATION_EXPIRY_HOURS', 72))


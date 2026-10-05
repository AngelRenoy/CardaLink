import os
import sys
from dotenv import load_dotenv

load_dotenv()

# Add backend directory to PYTHONPATH
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'cardalink_server.settings')
django.setup()

from django.db import connection
from iam.models import User
from iam.auth import hash_password

def init_database():
    print('Initializing CardaLink IAM Django Database & Admin Seeder...')
    schema_path = os.path.join(os.path.dirname(__file__), 'schema.sql')
    if os.path.exists(schema_path):
        with open(schema_path, 'r', encoding='utf-8') as f:
            sql_statements = f.read()
        with connection.cursor() as cursor:
            cursor.execute(sql_statements)
        print('PostgreSQL schema, user_identities, and audit_logs tables verified.')

    admin_email = os.getenv('ADMIN_EMAIL', 'admin@cardalink.com')
    admin_password = os.getenv('ADMIN_INITIAL_PASSWORD', 'Admin@1234')

    existing_admin = User.objects.filter(role='ADMIN').first()
    if not existing_admin:
        if not admin_password:
            print('[DB Security Notice] Production environment: ADMIN_INITIAL_PASSWORD not set. Skipping admin seed.')
        else:
            User.objects.create(
                full_name='CardaLink System Administrator',
                email=admin_email,
                phone='+919876543210',
                role='ADMIN',
                password_hash=hash_password(admin_password),
                status='APPROVED',
                is_verified=True
            )
            print(f'Seeded System Administrator user ({admin_email}) successfully.')
    else:
        from iam.auth import check_password
        if admin_password and not check_password(admin_password, existing_admin.password_hash):
            existing_admin.password_hash = hash_password(admin_password)
            existing_admin.save()
            print(f'Updated System Administrator password hash ({admin_email}).')
        else:
            print('System Administrator account verified in database.')

    print('IAM Database initialization complete.')

if __name__ == '__main__':
    init_database()

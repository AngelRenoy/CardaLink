import sys
import os
import django

sys.path.insert(0, os.path.join(os.path.dirname(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'cardalink_server.settings')
django.setup()

from django.db import connection

with connection.cursor() as cursor:
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS harvest_cycles (
            id SERIAL PRIMARY KEY,
            farmer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            plantation_id INTEGER NOT NULL REFERENCES plantations(id) ON DELETE CASCADE,
            name VARCHAR(150) NOT NULL,
            variety VARCHAR(100) NOT NULL,
            start_date DATE NOT NULL,
            expected_end_date DATE NOT NULL,
            completed_date DATE NULL,
            status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
    """)
    cursor.execute("""
        ALTER TABLE harvest_records 
        ADD COLUMN IF NOT EXISTS harvest_cycle_id INTEGER NULL REFERENCES harvest_cycles(id) ON DELETE CASCADE;
        ALTER TABLE purchase_requests ADD COLUMN IF NOT EXISTS grade VARCHAR(50) DEFAULT '8mm Bold';
        ALTER TABLE purchase_requests ADD COLUMN IF NOT EXISTS plantation_id INTEGER NULL REFERENCES plantations(id) ON DELETE SET NULL;
        ALTER TABLE sale_records ADD COLUMN IF NOT EXISTS grade VARCHAR(50) DEFAULT '8mm Bold';
        ALTER TABLE sale_records ADD COLUMN IF NOT EXISTS price_per_kg NUMERIC(10,2) DEFAULT 0.00;
        ALTER TABLE sale_records ADD COLUMN IF NOT EXISTS plantation_id INTEGER NULL REFERENCES plantations(id) ON DELETE SET NULL;
        ALTER TABLE sale_records ADD COLUMN IF NOT EXISTS transaction_code VARCHAR(100) NULL;
        ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS source_farmer_id INTEGER NULL REFERENCES users(id) ON DELETE SET NULL;
        ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS plantation_id INTEGER NULL REFERENCES plantations(id) ON DELETE SET NULL;
        ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS purchase_price_per_kg NUMERIC(10,2) DEFAULT 0.00;
        ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS total_cost NUMERIC(12,2) DEFAULT 0.00;
        ALTER TABLE purchase_requests ADD COLUMN IF NOT EXISTS payment_method VARCHAR(30) DEFAULT 'ONLINE';
        ALTER TABLE purchase_requests ADD COLUMN IF NOT EXISTS payment_status VARCHAR(30) DEFAULT 'PENDING';
        ALTER TABLE purchase_requests ADD COLUMN IF NOT EXISTS pickup_status VARCHAR(30) DEFAULT 'PENDING';
        ALTER TABLE purchase_requests ADD COLUMN IF NOT EXISTS payment_reference VARCHAR(255) NULL;
        ALTER TABLE purchase_requests ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP WITH TIME ZONE NULL;
        ALTER TABLE purchase_requests ADD COLUMN IF NOT EXISTS ready_for_pickup_at TIMESTAMP WITH TIME ZONE NULL;
        ALTER TABLE purchase_requests ADD COLUMN IF NOT EXISTS handover_confirmed_by_farmer BOOLEAN DEFAULT FALSE;
        ALTER TABLE purchase_requests ADD COLUMN IF NOT EXISTS pickup_confirmed_by_trader BOOLEAN DEFAULT FALSE;
        ALTER TABLE purchase_requests ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE NULL;
        ALTER TABLE agrochemical_usages ADD COLUMN IF NOT EXISTS next_application_date DATE NULL;
        ALTER TABLE agrochemical_usages ADD COLUMN IF NOT EXISTS cost NUMERIC(12,2) DEFAULT 0.00;
    """)
    print("PostgreSQL table harvest_cycles and workflow columns successfully created/updated.")



import os
import sys
from decimal import Decimal
from datetime import date, timedelta

from dotenv import load_dotenv

load_dotenv()

# Add backend directory to PYTHONPATH
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'cardalink_server.settings')
django.setup()

from django.db import connection
from iam.models import (
    User, CardamomVariety, Plantation, HarvestRecord, InventoryItem,
    AgrochemicalUsage, IrrigationRecord, ExpenseRecord, SaleRecord,
    TransactionRecord, ExportOrder, ExportDocument, ShipmentRecord, NotificationItem
)
from iam.auth import hash_password

def seed_domain_data():
    print("Seeding CardaLink Domain Records in PostgreSQL...")

    # Ensure tables exist
    with connection.cursor() as cursor:
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS cardamom_varieties (
            id SERIAL PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            code VARCHAR(20) UNIQUE NOT NULL,
            description TEXT,
            optimal_altitude VARCHAR(100),
            yield_potential_kg_acre DECIMAL(10,2) DEFAULT 0,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS plantations (
            id SERIAL PRIMARY KEY,
            farmer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            name VARCHAR(150) NOT NULL,
            location VARCHAR(255) NOT NULL,
            area_acres DECIMAL(8,2) NOT NULL,
            number_of_plants INTEGER DEFAULT 0,
            variety VARCHAR(100) DEFAULT 'Njallani Green Gold',
            details TEXT,
            status VARCHAR(20) DEFAULT 'ACTIVE',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS harvest_records (
            id SERIAL PRIMARY KEY,
            farmer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            plantation_id INTEGER NOT NULL REFERENCES plantations(id) ON DELETE CASCADE,
            harvest_date DATE NOT NULL,
            fresh_quantity_kg DECIMAL(10,2) NOT NULL,
            dried_quantity_kg DECIMAL(10,2) NOT NULL,
            variety VARCHAR(100) NOT NULL,
            grade VARCHAR(50) DEFAULT '8mm Bold',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS inventory_items (
            id SERIAL PRIMARY KEY,
            owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            variety VARCHAR(100) NOT NULL,
            quantity_kg DECIMAL(10,2) NOT NULL,
            unit VARCHAR(20) DEFAULT 'KG',
            grade VARCHAR(50) DEFAULT 'AGEB 8mm',
            status VARCHAR(30) DEFAULT 'IN_STOCK',
            batch_code VARCHAR(50) UNIQUE NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS agrochemical_usages (
            id SERIAL PRIMARY KEY,
            usage_type VARCHAR(20) NOT NULL,
            farmer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            plantation_id INTEGER NOT NULL REFERENCES plantations(id) ON DELETE CASCADE,
            name VARCHAR(150) NOT NULL,
            quantity DECIMAL(10,2) NOT NULL,
            unit VARCHAR(20) DEFAULT 'KG',
            application_date DATE NOT NULL,
            next_application_date DATE,
            cost DECIMAL(12,2) DEFAULT 0,
            purpose TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS irrigation_records (
            id SERIAL PRIMARY KEY,
            farmer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            plantation_id INTEGER NOT NULL REFERENCES plantations(id) ON DELETE CASCADE,
            method VARCHAR(100) NOT NULL,
            duration_hours DECIMAL(6,2) NOT NULL,
            water_volume_liters DECIMAL(10,2) NOT NULL,
            irrigation_date DATE NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS expense_records (
            id SERIAL PRIMARY KEY,
            farmer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            plantation_id INTEGER REFERENCES plantations(id) ON DELETE SET NULL,
            category VARCHAR(100) NOT NULL,
            amount DECIMAL(12,2) NOT NULL,
            description TEXT,
            expense_date DATE NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS sale_records (
            id SERIAL PRIMARY KEY,
            farmer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            buyer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            cardamom_variety VARCHAR(100) NOT NULL,
            quantity_kg DECIMAL(10,2) NOT NULL,
            total_amount DECIMAL(12,2) NOT NULL,
            sale_date DATE NOT NULL,
            status VARCHAR(30) DEFAULT 'COMPLETED',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS transaction_records (
            id SERIAL PRIMARY KEY,
            transaction_code VARCHAR(50) UNIQUE NOT NULL,
            sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            receiver_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            amount DECIMAL(12,2) NOT NULL,
            payment_method VARCHAR(50) DEFAULT 'UPI / Bank Transfer',
            status VARCHAR(30) DEFAULT 'SUCCESS',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS export_orders (
            id SERIAL PRIMARY KEY,
            order_code VARCHAR(50) UNIQUE NOT NULL,
            exporter_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            buyer_name VARCHAR(150) NOT NULL,
            destination_country VARCHAR(100) NOT NULL,
            cardamom_variety VARCHAR(100) NOT NULL,
            quantity_kg DECIMAL(10,2) NOT NULL,
            total_value_usd DECIMAL(12,2) NOT NULL,
            order_date DATE NOT NULL,
            status VARCHAR(30) DEFAULT 'PROCESSING',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS export_documents (
            id SERIAL PRIMARY KEY,
            export_order_id INTEGER NOT NULL REFERENCES export_orders(id) ON DELETE CASCADE,
            document_type VARCHAR(100) NOT NULL,
            document_number VARCHAR(100) NOT NULL,
            status VARCHAR(30) DEFAULT 'VERIFIED',
            issued_date DATE NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS shipment_records (
            id SERIAL PRIMARY KEY,
            export_order_id INTEGER NOT NULL REFERENCES export_orders(id) ON DELETE CASCADE,
            tracking_number VARCHAR(100) UNIQUE NOT NULL,
            carrier VARCHAR(100) NOT NULL,
            status VARCHAR(30) DEFAULT 'IN_TRANSIT',
            origin VARCHAR(100) DEFAULT 'Cochin Port, India',
            destination VARCHAR(100) NOT NULL,
            dispatch_date DATE NOT NULL,
            estimated_delivery DATE NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS notification_items (
            id SERIAL PRIMARY KEY,
            recipient_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            title VARCHAR(150) NOT NULL,
            message TEXT NOT NULL,
            category VARCHAR(50) DEFAULT 'SYSTEM',
            is_read BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        """)

    # Seed Sample Farmers, Traders, Exporters if not exist
    pwd = hash_password('Password@1234')

    farmer1, _ = User.objects.get_or_create(
        email='kerala.farmer@cardalink.com',
        defaults={
            'full_name': 'Ramesh Kurup',
            'phone': '+919876543201',
            'role': 'FARMER',
            'password_hash': pwd,
            'status': 'APPROVED',
            'is_verified': True
        }
    )

    farmer2, _ = User.objects.get_or_create(
        email='idukki.planter@cardalink.com',
        defaults={
            'full_name': 'Mathew Joseph',
            'phone': '+919876543202',
            'role': 'FARMER',
            'password_hash': pwd,
            'status': 'APPROVED',
            'is_verified': True
        }
    )

    trader1, _ = User.objects.get_or_create(
        email='spices.trader@cardalink.com',
        defaults={
            'full_name': 'Suresh Spices Trading Co.',
            'phone': '+919876543203',
            'role': 'TRADER',
            'password_hash': pwd,
            'status': 'APPROVED',
            'is_verified': True
        }
    )

    exporter1, _ = User.objects.get_or_create(
        email='global.exporter@cardalink.com',
        defaults={
            'full_name': 'Malabar Spices Global Exports',
            'phone': '+919876543204',
            'role': 'EXPORTER',
            'password_hash': pwd,
            'status': 'APPROVED',
            'is_verified': True
        }
    )

    # Pending User for testing
    User.objects.get_or_create(
        email='new.farmer.pending@cardalink.com',
        defaults={
            'full_name': 'Anish Nair',
            'phone': '+919876543205',
            'role': 'FARMER',
            'password_hash': pwd,
            'status': 'PENDING',
            'is_verified': True
        }
    )

    # Cardamom Varieties
    varieties = [
        ('Njallani Green Gold', 'VAR_NJALLANI', 'High-yield cardamom variety developed in Idukki', '800m - 1200m MSL', Decimal('450.00')),
        ('Green Gold Bold', 'VAR_GREEN_GOLD', 'Large capsule 8mm+ bold green cardamom', '900m - 1300m MSL', Decimal('500.00')),
        ('Vandalmedu Special', 'VAR_VANDAL', 'Aromatic small cardamom with intense essential oils', '700m - 1100m MSL', Decimal('380.00')),
    ]
    for name, code, desc, alt, yld in varieties:
        CardamomVariety.objects.get_or_create(
            code=code,
            defaults={'name': name, 'description': desc, 'optimal_altitude': alt, 'yield_potential_kg_acre': yld}
        )

    # Plantations
    p1, _ = Plantation.objects.get_or_create(
        farmer=farmer1,
        name='High Range Green Gold Estate',
        defaults={'location': 'Vandanmedu, Idukki, Kerala', 'area_acres': Decimal('14.50'), 'variety': 'Njallani Green Gold', 'details': 'Prime High Range cardamom estate with micro-drip irrigation', 'status': 'ACTIVE'}
    )
    p2, _ = Plantation.objects.get_or_create(
        farmer=farmer2,
        name='Western Ghats Misty Hills Plantation',
        defaults={'location': 'Munnar Valley, Idukki, Kerala', 'area_acres': Decimal('22.00'), 'variety': 'Green Gold Bold', 'details': 'Organic certified shaded plantation under silver oak canopy', 'status': 'ACTIVE'}
    )

    # Harvest Records
    today = date.today()
    if not HarvestRecord.objects.filter(plantation=p1).exists():
        HarvestRecord.objects.create(
            farmer=farmer1, plantation=p1, harvest_date=today - timedelta(days=12),
            fresh_quantity_kg=Decimal('1250.00'), dried_quantity_kg=Decimal('280.00'),
            variety='Njallani Green Gold', grade='8mm Extra Bold'
        )
        HarvestRecord.objects.create(
            farmer=farmer2, plantation=p2, harvest_date=today - timedelta(days=5),
            fresh_quantity_kg=Decimal('1890.00'), dried_quantity_kg=Decimal('420.00'),
            variety='Green Gold Bold', grade='AGEB 8mm'
        )

    # Inventory Items
    if not InventoryItem.objects.filter(owner=farmer1).exists():
        InventoryItem.objects.create(
            owner=farmer1, variety='Njallani Green Gold', quantity_kg=Decimal('280.00'),
            unit='KG', grade='8mm Extra Bold', status='IN_STOCK', batch_code='BATCH_IDK_2026_01'
        )
        InventoryItem.objects.create(
            owner=trader1, variety='Green Gold Bold', quantity_kg=Decimal('1500.00'),
            unit='KG', grade='AGEB 8mm', status='READY_FOR_SALE', batch_code='BATCH_TRD_2026_09'
        )

    # Agrochemical Usage
    if not AgrochemicalUsage.objects.filter(plantation=p1).exists():
        AgrochemicalUsage.objects.create(
            usage_type='FERTILIZER', farmer=farmer1, plantation=p1,
            name='Organic Neem Cake + NPK 10:26:26', quantity=Decimal('250.00'), unit='KG',
            application_date=today - timedelta(days=20), purpose='Post-harvest soil nutrient replenishment'
        )
        AgrochemicalUsage.objects.create(
            usage_type='PESTICIDE', farmer=farmer2, plantation=p2,
            name='Bio-fungicide Trichoderma Harzianum', quantity=Decimal('45.00'), unit='KG',
            application_date=today - timedelta(days=15), purpose='Capsule rot prevention during monsoon'
        )

    # Irrigation Records
    if not IrrigationRecord.objects.filter(plantation=p1).exists():
        IrrigationRecord.objects.create(
            farmer=farmer1, plantation=p1, method='Micro-Sprinkler Drip System',
            duration_hours=Decimal('4.50'), water_volume_liters=Decimal('15000.00'),
            irrigation_date=today - timedelta(days=2)
        )

    # Expense Records
    if not ExpenseRecord.objects.filter(farmer=farmer1).exists():
        ExpenseRecord.objects.create(
            farmer=farmer1, plantation=p1, category='Labor & Plucking',
            amount=Decimal('34500.00'), description='Harvest plucking wages for 15 workers over 3 days',
            expense_date=today - timedelta(days=10)
        )
        ExpenseRecord.objects.create(
            farmer=farmer1, plantation=p1, category='Curing & Drying',
            amount=Decimal('12000.00'), description='Firewood and electricity charges for curing house',
            expense_date=today - timedelta(days=8)
        )

    # Sale Records
    if not SaleRecord.objects.filter(farmer=farmer1).exists():
        SaleRecord.objects.create(
            farmer=farmer1, buyer=trader1, cardamom_variety='Njallani Green Gold',
            quantity_kg=Decimal('200.00'), total_amount=Decimal('480000.00'),
            sale_date=today - timedelta(days=6), status='COMPLETED'
        )

    # Transaction Records
    if not TransactionRecord.objects.filter(sender=trader1).exists():
        TransactionRecord.objects.create(
            transaction_code='TXN_20260916_8801', sender=trader1, receiver=farmer1,
            amount=Decimal('480000.00'), payment_method='NEFT Bank Transfer', status='SUCCESS'
        )

    # Export Orders
    exp_order, _ = ExportOrder.objects.get_or_create(
        order_code='EXP_UAE_2026_001',
        defaults={
            'exporter': exporter1, 'buyer_name': 'Al-Habtoor Spices Trading LLC',
            'destination_country': 'United Arab Emirates', 'cardamom_variety': 'AGEB 8mm Green Gold',
            'quantity_kg': Decimal('3500.00'), 'total_value_usd': Decimal('98000.00'),
            'order_date': today - timedelta(days=14), 'status': 'PROCESSING'
        }
    )

    # Export Documents
    if not ExportDocument.objects.filter(export_order=exp_order).exists():
        ExportDocument.objects.create(
            export_order=exp_order, document_type='Spices Board Phytosanitary Certificate',
            document_number='PHYTO_IND_2026_9941', status='VERIFIED', issued_date=today - timedelta(days=10)
        )
        ExportDocument.objects.create(
            export_order=exp_order, document_type='Certificate of Origin (Cochin Chamber)',
            document_number='COO_COK_2026_4412', status='VERIFIED', issued_date=today - timedelta(days=8)
        )

    # Shipment Records
    if not ShipmentRecord.objects.filter(export_order=exp_order).exists():
        ShipmentRecord.objects.create(
            export_order=exp_order, tracking_number='MSK_CONTAINER_984421',
            carrier='Maersk Container Lines', status='IN_TRANSIT', origin='Cochin Sea Port (INCOK)',
            destination='Jebel Ali Port, Dubai (AEJEA)', dispatch_date=today - timedelta(days=4),
            estimated_delivery=today + timedelta(days=8)
        )

    # Notifications
    if not NotificationItem.objects.exists():
        NotificationItem.objects.create(
            recipient=exporter1, title='Export Phytosanitary Certificate Issued',
            message='Phytosanitary Certificate PHYTO_IND_2026_9941 verified by Spices Board India.',
            category='EXPORT', is_read=False
        )
        NotificationItem.objects.create(
            recipient=farmer1, title='New Purchase Order Received',
            message='Suresh Spices Trading Co. submitted a purchase request for 200kg Green Gold Cardamom.',
            category='TRADE', is_read=True
        )

    print("CardaLink Domain Records Seeded Successfully.")

if __name__ == '__main__':
    seed_domain_data()

from django.db import models

class User(models.Model):
    ROLE_CHOICES = [
        ('FARMER', 'Farmer'),
        ('TRADER', 'Trader'),
        ('EXPORTER', 'Exporter'),
        ('ADMIN', 'Admin'),
    ]

    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
        ('SUSPENDED', 'Suspended'),
    ]

    full_name = models.CharField(max_length=150)
    email = models.EmailField(unique=True, max_length=255)
    phone = models.CharField(max_length=20)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    password_hash = models.CharField(max_length=255)
    avatar = models.TextField(null=True, blank=True)
    is_verified = models.BooleanField(default=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='APPROVED')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'users'

    @property
    def is_authenticated(self):
        return True

    @property
    def is_anonymous(self):
        return False

    def __str__(self):
        return f"{self.full_name} ({self.email}) [{self.role}]"

class UserIdentity(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='identities')
    provider = models.CharField(max_length=50)
    provider_user_id = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'user_identities'
        unique_together = ('provider', 'provider_user_id')

class AuditLog(models.Model):
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='audit_logs')
    email = models.CharField(max_length=255, null=True, blank=True)
    action = models.CharField(max_length=100)
    details = models.TextField(blank=True, null=True)
    ip_address = models.CharField(max_length=45, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'audit_logs'
        ordering = ['-created_at']

class CardamomVariety(models.Model):
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=20, unique=True)
    description = models.TextField(blank=True, null=True)
    optimal_altitude = models.CharField(max_length=100, blank=True, null=True)
    yield_potential_kg_acre = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'cardamom_varieties'

    def __str__(self):
        return self.name

class Plantation(models.Model):
    farmer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='plantations')
    name = models.CharField(max_length=150)
    location = models.CharField(max_length=255)
    area_acres = models.DecimalField(max_digits=8, decimal_places=2)
    number_of_plants = models.IntegerField(default=0)
    variety = models.CharField(max_length=100, default='Njallani Green Gold')
    details = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=20, default='ACTIVE')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'plantations'

    def __str__(self):
        return f"{self.name} - {self.farmer.full_name}"

class HarvestCycle(models.Model):
    STATUS_CHOICES = [
        ('ACTIVE', 'Active'),
        ('COMPLETED', 'Completed'),
    ]

    farmer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='harvest_cycles')
    plantation = models.ForeignKey(Plantation, on_delete=models.CASCADE, related_name='harvest_cycles')
    name = models.CharField(max_length=150)
    variety = models.CharField(max_length=100)
    start_date = models.DateField()
    expected_end_date = models.DateField()
    completed_date = models.DateField(null=True, blank=True)
    full_dry_quantity = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='ACTIVE')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'harvest_cycles'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} ({self.status}) - {self.farmer.full_name}"

class HarvestRecord(models.Model):
    farmer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='harvests')
    plantation = models.ForeignKey(Plantation, on_delete=models.CASCADE, related_name='harvests')
    harvest_cycle = models.ForeignKey(HarvestCycle, on_delete=models.CASCADE, null=True, blank=True, related_name='daily_records')
    harvest_date = models.DateField()
    fresh_quantity_kg = models.DecimalField(max_digits=10, decimal_places=2)
    dried_quantity_kg = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    variety = models.CharField(max_length=100)
    grade = models.CharField(max_length=50, default='8mm Bold')
    unit = models.CharField(max_length=20, default='kg')
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'harvest_records'
        ordering = ['-harvest_date']

class InventoryItem(models.Model):
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='inventory_items')
    source_farmer = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='supplied_inventories')
    plantation = models.ForeignKey(Plantation, on_delete=models.SET_NULL, null=True, blank=True)
    variety = models.CharField(max_length=100)
    quantity_kg = models.DecimalField(max_digits=10, decimal_places=2)
    unit = models.CharField(max_length=20, default='KG')
    grade = models.CharField(max_length=50, default='AGEB 8mm')
    purchase_price_per_kg = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    total_cost = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    status = models.CharField(max_length=30, default='IN_STOCK')
    batch_code = models.CharField(max_length=50, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'inventory_items'

class AgrochemicalUsage(models.Model):
    TYPE_CHOICES = [('FERTILIZER', 'Fertilizer'), ('PESTICIDE', 'Pesticide')]
    usage_type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    farmer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='agrochemical_usages')
    plantation = models.ForeignKey(Plantation, on_delete=models.CASCADE, related_name='agrochemical_usages')
    name = models.CharField(max_length=150)
    quantity = models.DecimalField(max_digits=10, decimal_places=2)
    unit = models.CharField(max_length=20, default='KG')
    application_date = models.DateField()
    next_application_date = models.DateField(null=True, blank=True)
    cost = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    purpose = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'agrochemical_usages'

class IrrigationRecord(models.Model):
    farmer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='irrigations')
    plantation = models.ForeignKey(Plantation, on_delete=models.CASCADE, related_name='irrigations')
    method = models.CharField(max_length=100)
    duration_hours = models.DecimalField(max_digits=6, decimal_places=2)
    water_volume_liters = models.DecimalField(max_digits=10, decimal_places=2)
    irrigation_date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'irrigation_records'

class ExpenseRecord(models.Model):
    farmer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='expenses')
    plantation = models.ForeignKey(Plantation, on_delete=models.CASCADE, null=True, blank=True)
    category = models.CharField(max_length=100)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    description = models.TextField(blank=True, null=True)
    expense_date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'expense_records'

class SaleRecord(models.Model):
    farmer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sales_as_farmer')
    buyer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sales_as_buyer')
    cardamom_variety = models.CharField(max_length=100)
    grade = models.CharField(max_length=50, default='8mm Bold')
    plantation = models.ForeignKey(Plantation, on_delete=models.SET_NULL, null=True, blank=True)
    quantity_kg = models.DecimalField(max_digits=10, decimal_places=2)
    price_per_kg = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2)
    sale_date = models.DateField()
    transaction_code = models.CharField(max_length=100, null=True, blank=True)
    status = models.CharField(max_length=30, default='COMPLETED')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'sale_records'

class TransactionRecord(models.Model):
    transaction_code = models.CharField(max_length=50, unique=True)
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_transactions')
    receiver = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_transactions')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    payment_method = models.CharField(max_length=50, default='UPI / Bank Transfer')
    status = models.CharField(max_length=30, default='SUCCESS')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'transaction_records'

class ExportOrder(models.Model):
    order_code = models.CharField(max_length=50, unique=True)
    exporter = models.ForeignKey(User, on_delete=models.CASCADE, related_name='export_orders')
    buyer_name = models.CharField(max_length=150)
    destination_country = models.CharField(max_length=100)
    cardamom_variety = models.CharField(max_length=100)
    quantity_kg = models.DecimalField(max_digits=10, decimal_places=2)
    total_value_usd = models.DecimalField(max_digits=12, decimal_places=2)
    order_date = models.DateField()
    status = models.CharField(max_length=30, default='PROCESSING')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'export_orders'

class ExportDocument(models.Model):
    export_order = models.ForeignKey(ExportOrder, on_delete=models.CASCADE, related_name='documents')
    document_type = models.CharField(max_length=100)
    document_number = models.CharField(max_length=100)
    status = models.CharField(max_length=30, default='VERIFIED')
    issued_date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'export_documents'

class ShipmentRecord(models.Model):
    export_order = models.ForeignKey(ExportOrder, on_delete=models.CASCADE, related_name='shipments')
    tracking_number = models.CharField(max_length=100, unique=True)
    carrier = models.CharField(max_length=100)
    status = models.CharField(max_length=30, default='IN_TRANSIT')
    origin = models.CharField(max_length=100, default='Cochin Port, India')
    destination = models.CharField(max_length=100)
    dispatch_date = models.DateField()
    estimated_delivery = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'shipment_records'

class NotificationItem(models.Model):
    recipient = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True, related_name='notifications')
    title = models.CharField(max_length=150)
    message = models.TextField()
    category = models.CharField(max_length=50, default='SYSTEM')
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'notification_items'
        ordering = ['-created_at']

class MarketplaceListing(models.Model):
    farmer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='marketplace_listings')
    variety = models.CharField(max_length=100)
    available_quantity_kg = models.DecimalField(max_digits=10, decimal_places=2)
    unit = models.CharField(max_length=20, default='KG')
    price_per_kg = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    grade = models.CharField(max_length=50, default='8mm Bold')
    plantation = models.ForeignKey(Plantation, on_delete=models.SET_NULL, null=True, blank=True)
    harvest_record = models.ForeignKey(HarvestRecord, on_delete=models.SET_NULL, null=True, blank=True)
    status = models.CharField(max_length=30, default='AVAILABLE')
    available_date = models.DateField(auto_now_add=True)
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'marketplace_listings'
        ordering = ['-created_at']

class PurchaseRequest(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('ACCEPTED', 'Accepted'),
        ('PAYMENT_PENDING', 'Payment Pending'),
        ('PAID', 'Paid'),
        ('READY_FOR_PICKUP', 'Ready For Pickup'),
        ('PICKUP_CONFIRMED', 'Pickup Confirmed'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
        ('COMPLETED', 'Completed'),
        ('CANCELLED', 'Cancelled'),
    ]

    PAYMENT_METHOD_CHOICES = [
        ('ONLINE', 'Pay Online'),
        ('DIRECT', 'Pay Directly'),
    ]

    PAYMENT_STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('PAID', 'Paid'),
        ('FAILED', 'Failed'),
    ]

    PICKUP_STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('READY_FOR_PICKUP', 'Ready For Pickup'),
        ('PICKUP_CONFIRMED', 'Pickup Confirmed'),
        ('COMPLETED', 'Completed'),
    ]

    trader = models.ForeignKey(User, on_delete=models.CASCADE, related_name='purchase_requests_as_trader')
    farmer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='purchase_requests_as_farmer')
    marketplace_listing = models.ForeignKey(MarketplaceListing, on_delete=models.SET_NULL, null=True, blank=True, related_name='purchase_requests')
    variety = models.CharField(max_length=100)
    grade = models.CharField(max_length=50, default='8mm Bold')
    plantation = models.ForeignKey(Plantation, on_delete=models.SET_NULL, null=True, blank=True)
    available_quantity_kg = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    requested_quantity_kg = models.DecimalField(max_digits=10, decimal_places=2)
    price_per_kg = models.DecimalField(max_digits=10, decimal_places=2)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2)
    payment_method = models.CharField(max_length=30, choices=PAYMENT_METHOD_CHOICES, default='ONLINE')
    payment_status = models.CharField(max_length=30, choices=PAYMENT_STATUS_CHOICES, default='PENDING')
    pickup_status = models.CharField(max_length=30, choices=PICKUP_STATUS_CHOICES, default='PENDING')
    payment_reference = models.CharField(max_length=255, blank=True, null=True)
    handover_confirmed_by_farmer = models.BooleanField(default=False)
    pickup_confirmed_by_trader = models.BooleanField(default=False)
    paid_at = models.DateTimeField(blank=True, null=True)
    ready_for_pickup_at = models.DateTimeField(blank=True, null=True)
    completed_at = models.DateTimeField(blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='PENDING')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'purchase_requests'
        ordering = ['-created_at']

class ExportSupplyRequest(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('ACCEPTED', 'Accepted'),
        ('REJECTED', 'Rejected'),
        ('COMPLETED', 'Completed'),
    ]

    trader = models.ForeignKey(User, on_delete=models.CASCADE, related_name='export_supplies_as_trader')
    exporter = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='export_supplies_as_exporter')
    variety = models.CharField(max_length=100)
    quantity_kg = models.DecimalField(max_digits=10, decimal_places=2)
    price_per_kg = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    notes = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='PENDING')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'export_supply_requests'
        ordering = ['-created_at']


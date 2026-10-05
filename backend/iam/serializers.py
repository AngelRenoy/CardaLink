from rest_framework import serializers
from iam.models import (
    User, AuditLog, CardamomVariety, Plantation, HarvestCycle, HarvestRecord, InventoryItem,
    AgrochemicalUsage, IrrigationRecord, ExpenseRecord, SaleRecord,
    TransactionRecord, ExportOrder, ExportDocument, ShipmentRecord, NotificationItem,
    MarketplaceListing, PurchaseRequest, ExportSupplyRequest, InternationalBuyer, QualityRecord, PackagingRecord
)
from iam.config import get_permissions_for_role

class UserSerializer(serializers.ModelSerializer):
    permissions = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'full_name', 'email', 'phone', 'role', 'status', 'avatar', 'is_verified', 'permissions', 'created_at', 'updated_at']

    def get_permissions(self, obj):
        return get_permissions_for_role(obj.role)

class AuditLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = AuditLog
        fields = ['id', 'user_id', 'email', 'action', 'details', 'ip_address', 'created_at']

class CardamomVarietySerializer(serializers.ModelSerializer):
    class Meta:
        model = CardamomVariety
        fields = '__all__'

class PlantationSerializer(serializers.ModelSerializer):
    farmer_name = serializers.ReadOnlyField(source='farmer.full_name')
    farmer_email = serializers.ReadOnlyField(source='farmer.email')

    class Meta:
        model = Plantation
        fields = ['id', 'farmer_id', 'farmer_name', 'farmer_email', 'name', 'location', 'area_acres', 'number_of_plants', 'variety', 'details', 'status', 'created_at']

class HarvestCycleSerializer(serializers.ModelSerializer):
    farmer_name = serializers.ReadOnlyField(source='farmer.full_name')
    plantation_name = serializers.ReadOnlyField(source='plantation.name')

    class Meta:
        model = HarvestCycle
        fields = ['id', 'farmer_id', 'farmer_name', 'plantation_id', 'plantation_name', 'name', 'variety', 'start_date', 'expected_end_date', 'completed_date', 'full_dry_quantity', 'status', 'created_at', 'updated_at']

class HarvestRecordSerializer(serializers.ModelSerializer):
    farmer_name = serializers.ReadOnlyField(source='farmer.full_name')
    plantation_name = serializers.ReadOnlyField(source='plantation.name')

    class Meta:
        model = HarvestRecord
        fields = ['id', 'farmer_id', 'farmer_name', 'plantation_id', 'plantation_name', 'harvest_cycle_id', 'harvest_date', 'fresh_quantity_kg', 'dried_quantity_kg', 'variety', 'grade', 'unit', 'notes', 'created_at']

class InventoryItemSerializer(serializers.ModelSerializer):
    owner_name = serializers.ReadOnlyField(source='owner.full_name')
    owner_role = serializers.ReadOnlyField(source='owner.role')
    source_farmer_name = serializers.ReadOnlyField(source='source_farmer.full_name')
    source_trader_name = serializers.ReadOnlyField(source='source_trader.full_name')
    plantation_name = serializers.ReadOnlyField(source='plantation.name')

    class Meta:
        model = InventoryItem
        fields = ['id', 'owner_id', 'owner_name', 'owner_role', 'source_farmer_id', 'source_farmer_name', 'source_trader_id', 'source_trader_name', 'plantation_id', 'plantation_name', 'variety', 'quantity_kg', 'unit', 'grade', 'purchase_price_per_kg', 'total_cost', 'status', 'batch_code', 'created_at']

class AgrochemicalUsageSerializer(serializers.ModelSerializer):
    farmer_name = serializers.ReadOnlyField(source='farmer.full_name')
    plantation_name = serializers.ReadOnlyField(source='plantation.name')
    product_name = serializers.ReadOnlyField(source='name')
    date_applied = serializers.SerializerMethodField()
    next_date_to_apply = serializers.SerializerMethodField()

    class Meta:
        model = AgrochemicalUsage
        fields = [
            'id', 'usage_type', 'farmer_id', 'farmer_name', 'plantation_id', 'plantation_name',
            'name', 'product_name', 'quantity', 'unit', 'application_date', 'date_applied',
            'next_application_date', 'next_date_to_apply', 'cost', 'purpose', 'created_at'
        ]

    def get_date_applied(self, obj):
        return str(obj.application_date) if obj.application_date else None

    def get_next_date_to_apply(self, obj):
        return str(obj.next_application_date) if obj.next_application_date else None

class IrrigationRecordSerializer(serializers.ModelSerializer):
    farmer_name = serializers.ReadOnlyField(source='farmer.full_name')
    plantation_name = serializers.ReadOnlyField(source='plantation.name')

    class Meta:
        model = IrrigationRecord
        fields = ['id', 'farmer_id', 'farmer_name', 'plantation_id', 'plantation_name', 'method', 'duration_hours', 'water_volume_liters', 'irrigation_date', 'created_at']

class ExpenseRecordSerializer(serializers.ModelSerializer):
    farmer_name = serializers.ReadOnlyField(source='farmer.full_name')
    plantation_name = serializers.ReadOnlyField(source='plantation.name')

    class Meta:
        model = ExpenseRecord
        fields = ['id', 'farmer_id', 'farmer_name', 'plantation_id', 'plantation_name', 'category', 'amount', 'description', 'expense_date', 'created_at']

class SaleRecordSerializer(serializers.ModelSerializer):
    farmer_name = serializers.ReadOnlyField(source='farmer.full_name')
    buyer_name = serializers.ReadOnlyField(source='buyer.full_name')
    plantation_name = serializers.ReadOnlyField(source='plantation.name')

    class Meta:
        model = SaleRecord
        fields = ['id', 'farmer_id', 'farmer_name', 'buyer_id', 'buyer_name', 'cardamom_variety', 'grade', 'plantation_id', 'plantation_name', 'quantity_kg', 'price_per_kg', 'total_amount', 'sale_date', 'transaction_code', 'status', 'created_at']

class TransactionRecordSerializer(serializers.ModelSerializer):
    sender_name = serializers.ReadOnlyField(source='sender.full_name')
    receiver_name = serializers.ReadOnlyField(source='receiver.full_name')

    class Meta:
        model = TransactionRecord
        fields = ['id', 'transaction_code', 'sender_id', 'sender_name', 'receiver_id', 'receiver_name', 'amount', 'payment_method', 'status', 'created_at']

class InternationalBuyerSerializer(serializers.ModelSerializer):
    exporter_name = serializers.ReadOnlyField(source='exporter.full_name')

    class Meta:
        model = InternationalBuyer
        fields = ['id', 'exporter_id', 'exporter_name', 'name', 'company_name', 'country', 'email', 'phone', 'address', 'created_at']

class QualityRecordSerializer(serializers.ModelSerializer):
    order_code = serializers.ReadOnlyField(source='export_order.order_code')

    class Meta:
        model = QualityRecord
        fields = ['id', 'export_order_id', 'order_code', 'variety', 'grade', 'moisture_percentage', 'size_mm', 'color_appearance', 'quality_status', 'inspection_date', 'inspector_name', 'remarks', 'created_at']

class PackagingRecordSerializer(serializers.ModelSerializer):
    order_code = serializers.ReadOnlyField(source='export_order.order_code')

    class Meta:
        model = PackagingRecord
        fields = ['id', 'export_order_id', 'order_code', 'packaging_type', 'number_of_packages', 'weight_per_package_kg', 'total_quantity_kg', 'packaging_date', 'batch_number', 'notes', 'created_at']

class ExportDocumentSerializer(serializers.ModelSerializer):
    order_code = serializers.ReadOnlyField(source='export_order.order_code')

    class Meta:
        model = ExportDocument
        fields = ['id', 'export_order_id', 'order_code', 'document_type', 'document_name', 'document_number', 'file_url', 'status', 'issued_date', 'created_at']

class ShipmentRecordSerializer(serializers.ModelSerializer):
    order_code = serializers.ReadOnlyField(source='export_order.order_code')

    class Meta:
        model = ShipmentRecord
        fields = ['id', 'export_order_id', 'order_code', 'tracking_number', 'carrier', 'shipping_method', 'status', 'origin', 'destination', 'dispatch_date', 'estimated_delivery', 'created_at']

class ExportOrderSerializer(serializers.ModelSerializer):
    exporter_name = serializers.ReadOnlyField(source='exporter.full_name')
    buyer_company = serializers.ReadOnlyField(source='buyer.company_name')
    quality_records = QualityRecordSerializer(many=True, read_only=True)
    packaging_records = PackagingRecordSerializer(many=True, read_only=True)
    documents = ExportDocumentSerializer(many=True, read_only=True)
    shipments = ShipmentRecordSerializer(many=True, read_only=True)

    class Meta:
        model = ExportOrder
        fields = [
            'id', 'order_code', 'exporter_id', 'exporter_name', 'buyer_id', 'buyer_name',
            'buyer_company', 'company_name', 'email', 'phone', 'address', 'destination_country',
            'destination_port', 'shipment_method', 'expected_shipment_date', 'incoterms',
            'inventory_item_id', 'cardamom_variety', 'grade', 'batch_code', 'quantity_kg',
            'price_per_kg', 'total_value_usd', 'order_date', 'payment_method', 'payment_status',
            'payment_reference', 'payment_date', 'notes', 'status', 'quality_records',
            'packaging_records', 'documents', 'shipments', 'created_at', 'updated_at'
        ]

class NotificationItemSerializer(serializers.ModelSerializer):
    recipient_email = serializers.ReadOnlyField(source='recipient.email')

    class Meta:
        model = NotificationItem
        fields = ['id', 'recipient_id', 'recipient_email', 'title', 'message', 'category', 'is_read', 'created_at']

class MarketplaceListingSerializer(serializers.ModelSerializer):
    farmer_name = serializers.ReadOnlyField(source='farmer.full_name')
    farmer_phone = serializers.ReadOnlyField(source='farmer.phone')
    plantation_name = serializers.ReadOnlyField(source='plantation.name')
    location = serializers.ReadOnlyField(source='plantation.location')

    class Meta:
        model = MarketplaceListing
        fields = ['id', 'farmer_id', 'farmer_name', 'farmer_phone', 'variety', 'available_quantity_kg', 'unit', 'price_per_kg', 'grade', 'plantation_id', 'plantation_name', 'location', 'harvest_record_id', 'status', 'available_date', 'notes', 'created_at']

class PurchaseRequestSerializer(serializers.ModelSerializer):
    trader_name = serializers.ReadOnlyField(source='trader.full_name')
    trader_email = serializers.ReadOnlyField(source='trader.email')
    trader_phone = serializers.ReadOnlyField(source='trader.phone')
    trader_location = serializers.SerializerMethodField()
    farmer_name = serializers.ReadOnlyField(source='farmer.full_name')
    plantation_name = serializers.ReadOnlyField(source='plantation.name')
    request_date = serializers.SerializerMethodField()
    completion_date = serializers.SerializerMethodField()

    class Meta:
        model = PurchaseRequest
        fields = [
            'id', 'trader_id', 'trader_name', 'trader_email', 'trader_phone', 'trader_location',
            'farmer_id', 'farmer_name', 'marketplace_listing_id', 'plantation_id', 'plantation_name',
            'variety', 'grade', 'available_quantity_kg', 'requested_quantity_kg', 'price_per_kg',
            'total_amount', 'payment_method', 'payment_status', 'pickup_status', 'payment_reference',
            'handover_confirmed_by_farmer', 'pickup_confirmed_by_trader', 'paid_at', 'ready_for_pickup_at',
            'completed_at', 'completion_date', 'notes', 'status', 'request_date', 'created_at', 'updated_at'
        ]

    def get_trader_location(self, obj):
        if hasattr(obj.trader, 'location') and getattr(obj.trader, 'location'):
            return str(getattr(obj.trader, 'location'))
        if obj.plantation and obj.plantation.location:
            return str(obj.plantation.location)
        return 'Kattappana, Idukki'

    def get_request_date(self, obj):
        if obj.created_at:
            return obj.created_at.strftime('%d-%m-%Y')
        return None

    def get_completion_date(self, obj):
        if obj.completed_at:
            return obj.completed_at.strftime('%d-%m-%Y')
        return None

class ExportSupplyRequestSerializer(serializers.ModelSerializer):
    trader_name = serializers.ReadOnlyField(source='trader.full_name')
    trader_email = serializers.ReadOnlyField(source='trader.email')
    trader_phone = serializers.ReadOnlyField(source='trader.phone')
    trader_location = serializers.SerializerMethodField()
    exporter_name = serializers.ReadOnlyField(source='exporter.full_name')
    request_date = serializers.SerializerMethodField()

    class Meta:
        model = ExportSupplyRequest
        fields = [
            'id', 'trader_id', 'trader_name', 'trader_email', 'trader_phone', 'trader_location', 'exporter_id',
            'exporter_name', 'inventory_item_id', 'variety', 'grade', 'quantity_kg', 'price_per_kg',
            'total_amount', 'batch_code', 'expected_supply_date', 'payment_method', 'payment_status',
            'payment_reference', 'notes', 'received_at', 'completed_at', 'status', 'request_date',
            'created_at', 'updated_at'
        ]

    def get_trader_location(self, obj):
        if hasattr(obj.trader, 'location') and getattr(obj.trader, 'location'):
            return str(getattr(obj.trader, 'location'))
        return 'Kattappana, Idukki'

    def get_request_date(self, obj):
        if obj.created_at:
            return obj.created_at.strftime('%d-%m-%Y')
        return None




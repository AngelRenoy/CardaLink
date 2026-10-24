import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import {
  Sprout, LogOut, Globe, Box, Package, Truck, FileText, CheckCircle2,
  Clock, AlertCircle, Plus, Search, Filter, Eye, X, CheckCircle, ShieldCheck,
  Building2, User, Users, CreditCard, BarChart3, ChevronRight, Layers, Award,
  Sparkles, RefreshCw, Anchor, Compass, DollarSign, Calendar, Mail, Send,
  ExternalLink, AlertTriangle, Printer, Check, Loader2
} from 'lucide-react';
import {
  fetchExporterDashboardStatsApi,
  fetchExporterExportSuppliesApi,
  fetchExporterExportSupplyDetailApi,
  actionExporterExportSupplyApi,
  fetchExporterTradersApi,
  fetchExporterInventoryApi,
  createExporterInventoryApi,
  fetchExporterBuyersApi,
  createExporterBuyerApi,
  fetchExporterBuyerDetailApi,
  fetchExporterOrdersApi,
  createExporterOrderApi,
  fetchExporterOrderDetailApi,
  updateExporterOrderStatusApi,
  updateExporterOrderPaymentApi,
  createExporterOrderQualityApi,
  createExporterOrderPackagingApi,
  createExporterOrderDocumentApi,
  fetchExporterShipmentsApi,
  createExporterShipmentApi,
  updateExporterShipmentStatusApi,
  fetchExporterTransactionsApi,
  fetchExporterReportsApi,
  fetchExporterNotificationsApi,
  updateExporterProfileApi,
  resendDeliveryConfirmationApi,
  fetchDeliveryConfirmationApi
} from '../services/api';

const OrderTracker = ({ status, order, shipment }) => {
  const steps = [
    { key: 'QUALITY_APPROVED', label: 'Quality Approved' },
    { key: 'PACKAGING', label: 'Packaging Completed' },
    { key: 'DOCUMENTS_PENDING', label: 'Documents Completed' },
    { key: 'READY_FOR_SHIPMENT', label: 'Ready for Shipment' },
    { key: 'SHIPPED', label: 'Shipped' },
    { key: 'IN_TRANSIT', label: 'In Transit' },
    { key: 'AWAITING_BUYER_CONFIRMATION', label: 'Awaiting Buyer Confirmation' },
    { key: 'DELIVERED', label: 'Delivered & Confirmed' },
  ];

  const isQualityDone = Boolean(order?.quality_records && order.quality_records.some(q => q.quality_status === 'APPROVED')) ||
    ['QUALITY_APPROVED', 'PACKAGING', 'DOCUMENTS_PENDING', 'READY_FOR_SHIPMENT', 'SHIPPED', 'IN_TRANSIT', 'ARRIVED', 'AWAITING_BUYER_CONFIRMATION', 'DELIVERED', 'COMPLETED'].includes(status);

  const isPackagingDone = Boolean(order?.packaging_records && order.packaging_records.length > 0) ||
    ['PACKAGING', 'DOCUMENTS_PENDING', 'READY_FOR_SHIPMENT', 'SHIPPED', 'IN_TRANSIT', 'ARRIVED', 'AWAITING_BUYER_CONFIRMATION', 'DELIVERED', 'COMPLETED'].includes(status);

  const isDocsDone = Boolean(order?.documents && order.documents.length > 0) ||
    ['DOCUMENTS_PENDING', 'READY_FOR_SHIPMENT', 'SHIPPED', 'IN_TRANSIT', 'ARRIVED', 'AWAITING_BUYER_CONFIRMATION', 'DELIVERED', 'COMPLETED'].includes(status);

  const isReadyShipment = Boolean(shipment) ||
    ['READY_FOR_SHIPMENT', 'SHIPPED', 'IN_TRANSIT', 'ARRIVED', 'AWAITING_BUYER_CONFIRMATION', 'DELIVERED', 'COMPLETED'].includes(shipment?.status || status);

  const isShipped = ['SHIPPED', 'IN_TRANSIT', 'ARRIVED', 'AWAITING_BUYER_CONFIRMATION', 'DELIVERED', 'COMPLETED'].includes(shipment?.status || status);

  const isInTransit = ['IN_TRANSIT', 'ARRIVED', 'AWAITING_BUYER_CONFIRMATION', 'DELIVERED', 'COMPLETED'].includes(shipment?.status || status);

  const isAwaitingConfirmation = ['AWAITING_BUYER_CONFIRMATION', 'DELIVERED', 'COMPLETED'].includes(shipment?.status || status) || Boolean(order?.active_token);

  const isDelivered = ['DELIVERED', 'COMPLETED'].includes(shipment?.status || status) || Boolean(order?.delivery_confirmation);

  const stepDoneMap = {
    QUALITY_APPROVED: isQualityDone,
    PACKAGING: isPackagingDone,
    DOCUMENTS_PENDING: isDocsDone,
    READY_FOR_SHIPMENT: isReadyShipment,
    SHIPPED: isShipped,
    IN_TRANSIT: isInTransit,
    AWAITING_BUYER_CONFIRMATION: isAwaitingConfirmation,
    DELIVERED: isDelivered,
  };

  if (status === 'QUALITY_REJECTED') {
    return (
      <div style={{ padding: '0.5rem 0.75rem', backgroundColor: '#FEF2F2', borderRadius: '8px', border: '1px solid #FECACA', color: '#DC2626', fontSize: '0.75rem', fontWeight: '800' }}>
        ✖ QUALITY REJECTED: Inspection failed. Re-inspection or batch replacement required.
      </div>
    );
  }

  if (status === 'DELIVERY_DISPUTE' || order?.delivery_confirmation?.is_dispute) {
    return (
      <div style={{ padding: '0.65rem 0.85rem', backgroundColor: '#FEF2F2', borderRadius: '10px', border: '1.5px solid #FECACA', color: '#DC2626', fontSize: '0.78rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span>⚠️ DELIVERY DISPUTE: Buyer reported delivery problem / shortage / damages. Review required.</span>
      </div>
    );
  }

  if (status === 'CANCELLED') {
    return (
      <div style={{ padding: '0.5rem 0.75rem', backgroundColor: '#F1F5F9', borderRadius: '8px', border: '1px solid #CBD5E1', color: '#64748B', fontSize: '0.75rem', fontWeight: '800' }}>
        🚫 CANCELLED
      </div>
    );
  }

  return (
    <div style={{ margin: '0.75rem 0', backgroundColor: '#F8FAF8', padding: '0.85rem 1rem', borderRadius: '12px', border: '1px solid #E5EBE5' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.55rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div style={{ fontSize: '0.72rem', fontWeight: '900', color: '#1B4D2E', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          🗺️ Export Order Fulfillment Pipeline
        </div>
        {order?.buyer_confirmed_order && (
          <span style={{ fontSize: '0.7rem', color: '#166534', backgroundColor: '#DCFCE7', padding: '0.15rem 0.5rem', borderRadius: '6px', fontWeight: '800', border: '1px solid #BBF7D0' }}>
            ✓ Initial Order Confirmed by Buyer
          </span>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.35rem' }}>
        {steps.map((step, idx) => {
          const isDone = Boolean(stepDoneMap[step.key]);
          const isCurrent = !isDone && (idx === 0 || Boolean(stepDoneMap[steps[idx - 1].key]));
          let bg = '#F1F5F9';
          let fg = '#94A3B8';
          let border = '#E2E8F0';

          if (isDone) {
            bg = '#E8F5E9';
            fg = '#166534';
            border = '#86EFAC';
          } else if (isCurrent) {
            bg = '#FEF3C7';
            fg = '#92400E';
            border = '#FDE68A';
          }

          return (
            <React.Fragment key={step.key}>
              <span style={{
                fontSize: '0.7rem',
                fontWeight: isCurrent || isDone ? '800' : '600',
                padding: '0.25rem 0.6rem',
                borderRadius: '8px',
                backgroundColor: bg,
                color: fg,
                border: `1px solid ${border}`,
                display: 'inline-flex',
                alignItems: 'center',
                boxShadow: isCurrent ? '0 1px 3px rgba(217,119,6,0.15)' : 'none'
              }}>
                {isDone ? '✓ ' : ''}{step.label}
              </span>
              {idx < steps.length - 1 && (
                <span style={{ fontSize: '0.75rem', color: isDone ? '#16A34A' : '#CBD5E1', fontWeight: '900' }}>→</span>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export const ExporterDashboard = () => {
  const { user, permissions, logout } = useAuth();
  const navigate = useNavigate();

  // Active Tab
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Core Data States
  const [stats, setStats] = useState(null);
  const [exportSupplies, setExportSupplies] = useState([]);
  const [traders, setTraders] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [buyers, setBuyers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [shipments, setShipments] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(false);

  // Filters & Search
  const [suppliesSearch, setSuppliesSearch] = useState('');
  const [suppliesStatusFilter, setSuppliesStatusFilter] = useState('');
  const [ordersSearch, setOrdersSearch] = useState('');
  const [fulfillmentSearch, setFulfillmentSearch] = useState('');
  const [fulfillmentStageFilter, setFulfillmentStageFilter] = useState('ALL');
  const [reportsPeriod, setReportsPeriod] = useState('all');
  const [reportsStartDate, setReportsStartDate] = useState('');
  const [reportsEndDate, setReportsEndDate] = useState('');

  // Messages & Feedback
  const [message, setMessage] = useState({ type: '', text: '' });

  // Modals
  const [showSupplyDetailModal, setShowSupplyDetailModal] = useState(false);
  const [selectedSupply, setSelectedSupply] = useState(null);

  const [showAddInventoryModal, setShowAddInventoryModal] = useState(false);
  const [inventoryForm, setInventoryForm] = useState({ variety: '', grade: 'AGEB 8mm', quantity_kg: '', purchase_price_per_kg: '' });

  const [showAddBuyerModal, setShowAddBuyerModal] = useState(false);
  const [buyerForm, setBuyerForm] = useState({ name: '', company_name: '', country: '', email: '', phone: '', address: '' });
  const [showBuyerDetailModal, setShowBuyerDetailModal] = useState(false);
  const [selectedBuyerDetail, setSelectedBuyerDetail] = useState(null);

  const [showCreateOrderModal, setShowCreateOrderModal] = useState(false);
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [orderFormErrors, setOrderFormErrors] = useState({});
  const [orderForm, setOrderForm] = useState({
    buyer_id: '', buyer_name: '', company_name: '', email: '', phone: '', address: '',
    destination_country: '', destination_port: 'Dubai Port', shipment_method: 'SEA',
    expected_shipment_date: '', incoterms: 'FOB', inventory_item_id: '', variety: '',
    grade: 'AGEB 8mm', quantity_kg: '', price_per_kg: '', notes: ''
  });
  const [showOrderDetailModal, setShowOrderDetailModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const [showQualityModal, setShowQualityModal] = useState(false);
  const [qualityModalError, setQualityModalError] = useState('');
  const [qualitySubmitting, setQualitySubmitting] = useState(false);
  const [qualityForm, setQualityForm] = useState({ moisture_percentage: '10.5', size_mm: '8mm', color_appearance: 'Deep Green', quality_status: 'APPROVED', inspector_name: '', remarks: '' });

  const [showPackagingModal, setShowPackagingModal] = useState(false);
  const [packagingModalError, setPackagingModalError] = useState('');
  const [packagingSubmitting, setPackagingSubmitting] = useState(false);
  const [packagingForm, setPackagingForm] = useState({ packaging_type: 'Vacuum Pack', number_of_packages: '1', weight_per_package_kg: '10', notes: '' });

  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [documentModalError, setDocumentModalError] = useState('');
  const [documentSubmitting, setDocumentSubmitting] = useState(false);
  const [documentForm, setDocumentForm] = useState({ document_type: 'Commercial Invoice', document_name: '', document_number: '', file_url: '' });

  const [showShipmentModal, setShowShipmentModal] = useState(false);
  const [shipmentForm, setShipmentForm] = useState({ export_order_id: '', carrier: 'Maersk Line', shipping_method: 'SEA', origin: 'Cochin Port, India', destination: '', dispatch_date: '', estimated_delivery: '' });

  // Delivery Confirmation States
  const [showDeliveryConfirmationModal, setShowDeliveryConfirmationModal] = useState(false);
  const [selectedConfirmationOrder, setSelectedConfirmationOrder] = useState(null);
  const [resendingConfirmationId, setResendingConfirmationId] = useState(null);

  useEffect(() => {
    loadAllData();
  }, []);

  useEffect(() => {
    if (activeTab === 'reports') {
      loadReportsData();
    }
  }, [reportsPeriod, reportsStartDate, reportsEndDate, activeTab]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [
        statsRes, suppliesRes, tradersRes, invRes, buyersRes, ordersRes, shipRes, txRes
      ] = await Promise.all([
        fetchExporterDashboardStatsApi().catch(() => ({ data: { stats: null } })),
        fetchExporterExportSuppliesApi().catch(() => ({ data: { export_supplies: [] } })),
        fetchExporterTradersApi().catch(() => ({ data: { traders: [] } })),
        fetchExporterInventoryApi().catch(() => ({ data: { inventory: [] } })),
        fetchExporterBuyersApi().catch(() => ({ data: { buyers: [] } })),
        fetchExporterOrdersApi().catch(() => ({ data: { orders: [] } })),
        fetchExporterShipmentsApi().catch(() => ({ data: { shipments: [] } })),
        fetchExporterTransactionsApi().catch(() => ({ data: { transactions: [] } }))
      ]);

      if (statsRes?.data?.stats) setStats(statsRes.data.stats);
      if (suppliesRes?.data?.export_supplies) setExportSupplies(suppliesRes.data.export_supplies);
      if (tradersRes?.data?.traders) setTraders(tradersRes.data.traders);
      if (invRes?.data?.inventory) setInventory(invRes.data.inventory);
      if (buyersRes?.data?.buyers) setBuyers(buyersRes.data.buyers);
      if (ordersRes?.data?.orders) setOrders(ordersRes.data.orders);
      if (shipRes?.data?.shipments) setShipments(shipRes.data.shipments);
      if (txRes?.data?.transactions) setTransactions(txRes.data.transactions);
    } catch (err) {
      console.error('Error loading Exporter data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadReportsData = async () => {
    try {
      const params = { period: reportsPeriod };
      if (reportsPeriod === 'custom') {
        if (reportsStartDate) params.start_date = reportsStartDate;
        if (reportsEndDate) params.end_date = reportsEndDate;
      }
      const res = await fetchExporterReportsApi(params);
      if (res?.data) {
        setReports(res.data);
      }
    } catch (err) {
      console.error('Error loading Exporter reports:', err);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const showMsg = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  // Supply Action Handler
  const handleSupplyAction = async (requestId, action, payload = {}) => {
    try {
      const res = await actionExporterExportSupplyApi(requestId, action, payload);
      showMsg('success', res.message || `Action ${action} executed successfully`);
      setShowSupplyDetailModal(false);
      loadAllData();
    } catch (err) {
      showMsg('error', err.message || 'Action failed');
    }
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleExporterOnlinePayment = async (supply) => {
    const rzpKey = import.meta.env.VITE_RAZORPAY_KEY_ID;
    const isLiveKey = rzpKey && !rzpKey.includes('your_razorpay') && rzpKey.startsWith('rzp_');

    if (isLiveKey) {
      const resLoad = await loadRazorpayScript();
      if (!resLoad) {
        showMsg('error', 'Razorpay SDK failed to load. Please check your internet connection.');
        return;
      }

      try {
        const options = {
          key: rzpKey,
          amount: Math.round(Number(supply.total_amount) * 100),
          currency: 'INR',
          name: 'CardaLink Spices',
          description: `Supply Payment: ${supply.variety} (${supply.quantity_kg} KG) to ${supply.trader_name}`,
          prefill: {
            name: user?.full_name || 'Exporter',
            email: user?.email || '',
            contact: user?.phone || ''
          },
          theme: { color: '#2E7D32' },
          handler: async function (response) {
            await handleSupplyAction(supply.id, 'PAY', {
              payment_method: 'ONLINE',
              payment_reference: response.razorpay_payment_id
            });
          },
          modal: {
            ondismiss: function () {
              showMsg('info', 'Razorpay checkout cancelled.');
            }
          }
        };
        const paymentObject = new window.Razorpay(options);
        paymentObject.open();
      } catch (err) {
        showMsg('error', `Unable to open Razorpay gateway: ${err.message}`);
      }
    } else {
      const ref = `RZP-EXP-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
      await handleSupplyAction(supply.id, 'PAY', {
        payment_method: 'ONLINE',
        payment_reference: ref
      });
    }
  };

  // Add Inventory Submit
  const handleAddInventorySubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await createExporterInventoryApi(inventoryForm);
      showMsg('success', res.message || 'Inventory added');
      setShowAddInventoryModal(false);
      setInventoryForm({ variety: '', grade: 'AGEB 8mm', quantity_kg: '', purchase_price_per_kg: '' });
      loadAllData();
    } catch (err) {
      showMsg('error', err.message || 'Failed to add inventory');
    }
  };

  // Add Buyer Submit
  const handleAddBuyerSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await createExporterBuyerApi(buyerForm);
      showMsg('success', res.message || 'International Buyer added successfully');
      setShowAddBuyerModal(false);
      const newBuyer = res.data?.buyer;
      if (newBuyer) {
        setBuyers(prev => [newBuyer, ...prev.filter(b => b.id !== newBuyer.id)]);
        setOrderForm(prev => ({
          ...prev,
          buyer_id: String(newBuyer.id),
          buyer_name: newBuyer.name || prev.buyer_name,
          company_name: newBuyer.company_name || prev.company_name,
          email: newBuyer.email || prev.email,
          phone: newBuyer.phone || prev.phone,
          address: newBuyer.address || prev.address,
          destination_country: newBuyer.country || prev.destination_country
        }));
      }
      setBuyerForm({ name: '', company_name: '', country: '', email: '', phone: '', address: '' });
      await loadAllData();
    } catch (err) {
      showMsg('error', err.message || 'Failed to add buyer');
    }
  };

  // View Buyer Detail
  const handleOpenBuyerDetail = async (buyerId) => {
    try {
      const res = await fetchExporterBuyerDetailApi(buyerId);
      if (res?.data?.buyer) {
        setSelectedBuyerDetail(res.data.buyer);
        setShowBuyerDetailModal(true);
      }
    } catch (err) {
      showMsg('error', err.message || 'Failed to load buyer details');
    }
  };

  // Create Order Submit
  const handleCreateOrderSubmit = async (e) => {
    e.preventDefault();
    setOrderFormErrors({});

    if (!orderForm.buyer_name?.trim()) {
      setOrderFormErrors({ buyer_name: 'Buyer Name is required' });
      return showMsg('error', 'Please enter or select a Buyer Name');
    }

    if (!orderForm.destination_country?.trim()) {
      setOrderFormErrors({ destination_country: 'Destination Country is required' });
      return showMsg('error', 'Please enter Destination Country');
    }

    if (!orderForm.variety?.trim()) {
      setOrderFormErrors({ variety: 'Cardamom Variety is required' });
      return showMsg('error', 'Please select or enter Cardamom Variety');
    }

    const qty = parseFloat(orderForm.quantity_kg);
    if (isNaN(qty) || qty <= 0) {
      setOrderFormErrors({ quantity_kg: 'Export quantity must be greater than 0 KG' });
      return showMsg('error', 'Export quantity must be greater than 0 KG');
    }

    const price = parseFloat(orderForm.price_per_kg);
    if (isNaN(price) || price <= 0) {
      setOrderFormErrors({ price_per_kg: 'Price per KG must be greater than $0 USD' });
      return showMsg('error', 'Price per KG must be greater than $0 USD');
    }

    if (orderForm.inventory_item_id) {
      const inv = inventory.find(i => String(i.id) === String(orderForm.inventory_item_id));
      if (inv && qty > parseFloat(inv.quantity_kg)) {
        setOrderFormErrors({ quantity_kg: `Quantity (${qty} KG) exceeds available inventory (${inv.quantity_kg} KG)` });
        return showMsg('error', `Export quantity (${qty} KG) cannot exceed available inventory stock (${inv.quantity_kg} KG)`);
      }
    }

    setSubmittingOrder(true);
    try {
      const res = await createExporterOrderApi(orderForm);
      if (res.success || res.status === 201 || res.data?.order) {
        const orderCode = res.data?.order?.order_code ? ` (${res.data.order.order_code})` : '';
        showMsg('success', res.message || `Export order${orderCode} created successfully!`);
        setShowCreateOrderModal(false);
        setOrderForm({
          buyer_id: '', buyer_name: '', company_name: '', email: '', phone: '', address: '',
          destination_country: '', destination_port: 'Dubai Port', shipment_method: 'SEA',
          expected_shipment_date: '', incoterms: 'FOB', inventory_item_id: '', variety: '',
          grade: 'AGEB 8mm', quantity_kg: '', price_per_kg: '', notes: ''
        });
        setOrderFormErrors({});
        await loadAllData();
      } else {
        showMsg('error', res.message || 'Failed to create export order');
        setOrderFormErrors({ general: res.message || 'Failed to create export order' });
      }
    } catch (err) {
      showMsg('error', err.message || 'Failed to create export order');
      setOrderFormErrors({ general: err.message || 'Failed to create export order' });
    } finally {
      setSubmittingOrder(false);
    }
  };

  // Update Order Status
  const handleUpdateOrderStatus = async (orderId, status) => {
    try {
      const res = await updateExporterOrderStatusApi(orderId, status);
      showMsg('success', res.message || `Order status updated to ${status}`);
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(res.data.order);
      }
      loadAllData();
    } catch (err) {
      showMsg('error', err.message || 'Failed to update order status');
    }
  };

  // Modal Open Handlers with smart pre-population
  const handleOpenQualityModal = (ord) => {
    setSelectedOrder(ord);
    setQualityModalError('');
    if (ord?.quality_records && ord.quality_records.length > 0) {
      const q = ord.quality_records[0];
      setQualityForm({
        moisture_percentage: q.moisture_percentage !== undefined ? String(q.moisture_percentage) : '10.5',
        size_mm: q.size_mm || '8mm',
        color_appearance: q.color_appearance || 'Deep Green',
        quality_status: q.quality_status || 'APPROVED',
        inspector_name: q.inspector_name || '',
        remarks: q.remarks || ''
      });
    } else {
      setQualityForm({
        moisture_percentage: '10.5',
        size_mm: '8mm',
        color_appearance: 'Deep Green',
        quality_status: 'APPROVED',
        inspector_name: '',
        remarks: ''
      });
    }
    setShowQualityModal(true);
  };

  const handleOpenPackagingModal = (ord) => {
    setSelectedOrder(ord);
    setPackagingModalError('');
    const orderQty = parseFloat(ord?.quantity_kg) || 0;

    if (ord?.packaging_records && ord.packaging_records.length > 0) {
      const p = ord.packaging_records[0];
      setPackagingForm({
        packaging_type: p.packaging_type || 'Vacuum Pack',
        number_of_packages: String(p.number_of_packages || 1),
        weight_per_package_kg: String(p.weight_per_package_kg || (orderQty > 0 ? orderQty : 1)),
        notes: p.notes || ''
      });
    } else {
      let pkgs = 1;
      let wt = orderQty > 0 ? orderQty : 1;
      if (orderQty > 20 && orderQty % 25 === 0) {
        pkgs = orderQty / 25;
        wt = 25;
      } else if (orderQty > 20 && orderQty % 10 === 0) {
        pkgs = orderQty / 10;
        wt = 10;
      }
      setPackagingForm({
        packaging_type: 'Vacuum Pack',
        number_of_packages: String(pkgs),
        weight_per_package_kg: String(wt),
        notes: ''
      });
    }
    setShowPackagingModal(true);
  };

  const handleOpenDocumentModal = (ord) => {
    setSelectedOrder(ord);
    setDocumentModalError('');
    setDocumentForm({
      document_type: 'Commercial Invoice',
      document_name: '',
      document_number: '',
      file_url: ''
    });
    setShowDocumentModal(true);
  };

  // Quality Submit
  const handleQualitySubmit = async (e) => {
    e.preventDefault();
    if (!selectedOrder) return;
    setQualityModalError('');
    setQualitySubmitting(true);
    try {
      const res = await createExporterOrderQualityApi(selectedOrder.id, qualityForm);
      showMsg('success', res.message || 'Quality record saved successfully');
      setShowQualityModal(false);
      loadAllData();
    } catch (err) {
      setQualityModalError(err.message || 'Failed to save quality record. Please check inputs and retry.');
    } finally {
      setQualitySubmitting(false);
    }
  };

  // Packaging Submit with Client-Side Validation
  const handlePackagingSubmit = async (e) => {
    e.preventDefault();
    if (!selectedOrder) return;
    setPackagingModalError('');

    const numPkgs = parseInt(packagingForm.number_of_packages, 10);
    const wtPerPkg = parseFloat(packagingForm.weight_per_package_kg);
    const orderQty = parseFloat(selectedOrder.quantity_kg) || 0;

    if (isNaN(numPkgs) || numPkgs <= 0) {
      setPackagingModalError('Please enter a valid number of packages (minimum 1).');
      return;
    }
    if (isNaN(wtPerPkg) || wtPerPkg <= 0) {
      setPackagingModalError('Please enter a valid weight per package in KG (greater than 0).');
      return;
    }

    const totalPkgQty = parseFloat((numPkgs * wtPerPkg).toFixed(2));
    if (orderQty > 0 && totalPkgQty > (orderQty + 0.05)) {
      setPackagingModalError(
        `Total packaging weight (${totalPkgQty} KG) exceeds the order quantity (${orderQty} KG). Please adjust the number of packages or package weight.`
      );
      return;
    }

    setPackagingSubmitting(true);
    try {
      const res = await createExporterOrderPackagingApi(selectedOrder.id, packagingForm);
      showMsg('success', res.message || 'Packaging record saved successfully');
      setShowPackagingModal(false);
      loadAllData();
    } catch (err) {
      setPackagingModalError(err.message || 'Failed to save packaging record. Please try again.');
    } finally {
      setPackagingSubmitting(false);
    }
  };

  // Document Submit
  const handleDocumentSubmit = async (e) => {
    e.preventDefault();
    if (!selectedOrder) return;
    setDocumentModalError('');
    setDocumentSubmitting(true);
    try {
      const res = await createExporterOrderDocumentApi(selectedOrder.id, documentForm);
      showMsg('success', res.message || 'Document uploaded successfully');
      setShowDocumentModal(false);
      setDocumentForm({ document_type: 'Commercial Invoice', document_name: '', document_number: '', file_url: '' });
      loadAllData();
    } catch (err) {
      setDocumentModalError(err.message || 'Failed to upload document. Please retry.');
    } finally {
      setDocumentSubmitting(false);
    }
  };

  // Shipment Submit
  const handleShipmentSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await createExporterShipmentApi(shipmentForm);
      showMsg('success', res.message || 'Shipment created successfully');
      setShowShipmentModal(false);
      setShipmentForm({ export_order_id: '', carrier: 'Maersk Line', shipping_method: 'SEA', origin: 'Cochin Port, India', destination: '', dispatch_date: '', estimated_delivery: '' });
      loadAllData();
    } catch (err) {
      showMsg('error', err.message || 'Failed to create shipment');
    }
  };

  // Shipment Status Update
  const handleShipmentStatusUpdate = async (shipmentId, status) => {
    try {
      const res = await updateExporterShipmentStatusApi(shipmentId, status);
      const emailNote = res.data?.email_result?.success ? ' Delivery review email dispatched to buyer.' : '';
      showMsg('success', (res.message || `Shipment status updated to ${status}`) + emailNote);
      loadAllData();
    } catch (err) {
      showMsg('error', err.message || 'Failed to update shipment status');
    }
  };

  // Resend Buyer Delivery Confirmation Email
  const handleResendConfirmationLink = async (orderId) => {
    try {
      setResendingConfirmationId(orderId);
      const res = await resendDeliveryConfirmationApi(orderId);
      if (res.success) {
        showMsg('success', res.message || 'Delivery confirmation email dispatched to international buyer.');
        await loadAllData();
      } else {
        showMsg('error', res.message || 'Failed to send confirmation link.');
      }
    } catch (err) {
      showMsg('error', err.message || 'Failed to send confirmation link.');
    } finally {
      setResendingConfirmationId(null);
    }
  };

  // Open Delivery Confirmation / Dispute Modal
  const handleOpenDeliveryConfirmation = async (order) => {
    setSelectedConfirmationOrder(order);
    setShowDeliveryConfirmationModal(true);
    if (!order.delivery_confirmation) {
      try {
        const res = await fetchDeliveryConfirmationApi(order.id);
        if (res.success && res.data?.confirmation) {
          setSelectedConfirmationOrder(prev => ({
            ...prev,
            delivery_confirmation: res.data.confirmation
          }));
        }
      } catch (err) {
        // Handled gracefully in modal
      }
    }
  };

  // Filtered Export Supply Requests
  const filteredSupplies = exportSupplies.filter(s => {
    const term = suppliesSearch.toLowerCase();
    const matchesSearch = !suppliesSearch ||
      (s.trader_name && s.trader_name.toLowerCase().includes(term)) ||
      (s.variety && s.variety.toLowerCase().includes(term)) ||
      (s.grade && s.grade.toLowerCase().includes(term)) ||
      (s.batch_code && s.batch_code.toLowerCase().includes(term)) ||
      String(s.id).includes(term);

    if (!matchesSearch) return false;
    if (!suppliesStatusFilter || suppliesStatusFilter === 'ALL') return true;
    if (suppliesStatusFilter === 'PENDING') return s.status === 'PENDING';
    if (suppliesStatusFilter === 'ACCEPTED') return s.status === 'ACCEPTED';
    if (suppliesStatusFilter === 'PAYMENT_PENDING') return s.status === 'PAYMENT_PENDING';
    if (suppliesStatusFilter === 'PAID') return s.status === 'PAID' || s.payment_status === 'PAID';
    if (suppliesStatusFilter === 'READY_FOR_PICKUP') return ['READY_FOR_PICKUP', 'READY_FOR_RECEIPT'].includes(s.status);
    if (suppliesStatusFilter === 'PICKUP_CONFIRMED') return ['PICKUP_CONFIRMED', 'RECEIVED'].includes(s.status);
    if (suppliesStatusFilter === 'COMPLETED') return s.status === 'COMPLETED' || s.status === 'RECEIVED';
    if (suppliesStatusFilter === 'REJECTED') return ['REJECTED', 'CANCELLED'].includes(s.status);
    return s.status === suppliesStatusFilter;
  });

  // Filtered Export Orders
  const filteredOrders = orders.filter(o => {
    return !ordersSearch ||
      (o.order_code && o.order_code.toLowerCase().includes(ordersSearch.toLowerCase())) ||
      (o.buyer_name && o.buyer_name.toLowerCase().includes(ordersSearch.toLowerCase())) ||
      (o.destination_country && o.destination_country.toLowerCase().includes(ordersSearch.toLowerCase())) ||
      (o.cardamom_variety && o.cardamom_variety.toLowerCase().includes(ordersSearch.toLowerCase()));
  });

  // Filtered Fulfillment Pipeline Orders
  const filteredFulfillmentOrders = orders.filter(o => {
    const matchesSearch = !fulfillmentSearch ||
      (o.order_code && o.order_code.toLowerCase().includes(fulfillmentSearch.toLowerCase())) ||
      (o.buyer_name && o.buyer_name.toLowerCase().includes(fulfillmentSearch.toLowerCase())) ||
      (o.destination_country && o.destination_country.toLowerCase().includes(fulfillmentSearch.toLowerCase())) ||
      (o.cardamom_variety && o.cardamom_variety.toLowerCase().includes(fulfillmentSearch.toLowerCase()));

    if (!matchesSearch) return false;

    if (fulfillmentStageFilter === 'ALL') return true;
    if (fulfillmentStageFilter === 'BUYER_CONFIRMED') return Boolean(o.buyer_confirmed_order);
    if (fulfillmentStageFilter === 'QUALITY_PENDING') return !o.quality_records || o.quality_records.length === 0;
    if (fulfillmentStageFilter === 'PACKAGING_PENDING') return !o.packaging_records || o.packaging_records.length === 0;
    if (fulfillmentStageFilter === 'DOCS_PENDING') return !o.documents || o.documents.length === 0;
    if (fulfillmentStageFilter === 'READY_FOR_SHIPMENT') return o.status === 'READY_FOR_SHIPMENT';
    if (fulfillmentStageFilter === 'SHIPPED') return ['SHIPPED', 'IN_TRANSIT'].includes(o.status);
    if (fulfillmentStageFilter === 'AWAITING_CONFIRMATION') return o.status === 'AWAITING_BUYER_CONFIRMATION';
    if (fulfillmentStageFilter === 'DELIVERED') return ['DELIVERED', 'COMPLETED'].includes(o.status) || Boolean(o.delivery_confirmation);
    return true;
  });

  const availableInventory = inventory.filter(i => parseFloat(i.quantity_kg || 0) > 0);
  const selectedInventory = inventory.find(i => String(i.id) === String(orderForm.inventory_item_id));

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F4F7F4', fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* HEADER BAR */}
      <header style={{
        backgroundColor: '#FFFFFF', borderBottom: '1px solid #E5EBE5',
        padding: '0.85rem 1.75rem', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50,
        boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#2E7D32', padding: '0.2rem' }}>
            <Layers size={22} />
          </button>
          <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: '#1B4D2E', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(27,77,46,0.3)' }}>
            <Globe size={22} />
          </div>
          <div>
            <span style={{ fontSize: '1.25rem', fontWeight: '900', color: '#1B4D2E', letterSpacing: '-0.02em' }}>
              Carda<span style={{ color: '#43A047' }}>Link</span>
            </span>
            <span style={{ fontSize: '0.78rem', color: '#718096', marginLeft: '0.5rem', fontWeight: '700' }}>
              | International Exporter Portal
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <button onClick={loadAllData} title="Refresh Data" style={{ backgroundColor: '#E8F5E9', color: '#2E7D32', border: '1px solid #C8E6C9', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
          </button>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.88rem', fontWeight: '900', color: '#1A202C' }}>{user?.full_name}</div>
            <div style={{ fontSize: '0.72rem', color: '#2E7D32', fontWeight: '800' }}>ROLE: EXPORTER</div>
          </div>

          <button onClick={handleLogout} style={{ backgroundColor: '#FFEBEE', color: '#D32F2F', border: '1px solid #FFCDD2', padding: '0.45rem 0.85rem', borderRadius: '8px', fontWeight: '800', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer' }}>
            <LogOut size={15} /> Logout
          </button>
        </div>
      </header>

      {/* FEEDBACK NOTIFICATION BANNER */}
      {message.text && (
        <div style={{
          backgroundColor: message.type === 'error' ? '#FFEBEE' : '#E8F5E9',
          color: message.type === 'error' ? '#C62828' : '#1B5E20',
          borderBottom: `2px solid ${message.type === 'error' ? '#EF9A9A' : '#A5D6A7'}`,
          padding: '0.75rem 1.75rem', fontSize: '0.88rem', fontWeight: '800',
          display: 'flex', alignItems: 'center', gap: '0.5rem'
        }}>
          {message.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
          {message.text}
        </div>
      )}

      <div style={{ display: 'flex' }}>
        {/* SIDEBAR NAVIGATION */}
        {sidebarOpen && (
          <aside style={{
            width: '260px', backgroundColor: '#FFFFFF', borderRight: '1px solid #E5EBE5',
            minHeight: 'calc(100vh - 65px)', padding: '1.25rem 0.85rem', flexShrink: 0
          }}>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              {[
                { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
                { id: 'supplies', label: 'Incoming Supply Requests', icon: Truck, count: stats?.pending_export_requests },
                { id: 'inventory', label: 'Exporter Inventory', icon: Box },
                { id: 'orders', label: 'Export Orders', icon: Package, count: stats?.accepted_orders },
                { id: 'buyers', label: 'International Buyers', icon: Globe },
                { id: 'fulfillment', label: 'Order Fulfillment & Tracking', icon: Anchor, count: stats?.active_shipments || orders.filter(o => o.status !== 'DELIVERED').length },
                { id: 'transactions', label: 'Financial Transactions', icon: DollarSign },
                { id: 'reports', label: 'Reports & Analytics', icon: BarChart3 },
                { id: 'profile', label: 'My Exporter Profile', icon: User },
              ].map(tab => {
                const Icon = tab.icon;
                const isActive = tab.id === 'fulfillment'
                  ? ['fulfillment', 'quality', 'packaging', 'documents', 'shipments'].includes(activeTab)
                  : activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      width: '100%', padding: '0.7rem 0.85rem', borderRadius: '10px',
                      border: 'none', backgroundColor: isActive ? '#E8F5E9' : 'transparent',
                      color: isActive ? '#1B4D2E' : '#4A5568', fontWeight: isActive ? '900' : '700',
                      fontSize: '0.85rem', cursor: 'pointer', textAlign: 'left',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <Icon size={18} color={isActive ? '#2E7D32' : '#718096'} />
                      {tab.label}
                    </div>
                    {tab.count > 0 && (
                      <span style={{ backgroundColor: '#2E7D32', color: '#FFF', padding: '0.15rem 0.45rem', borderRadius: '999px', fontSize: '0.7rem', fontWeight: '900' }}>
                        {tab.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </aside>
        )}

        {/* MAIN CONTENT AREA */}
        <main style={{ flex: 1, padding: '1.75rem', overflowX: 'hidden' }}>
          {/* ========================================================================= */}
          {/* TAB 1: DASHBOARD OVERVIEW */}
          {/* ========================================================================= */}
          {activeTab === 'dashboard' && (
            <div>
              <div style={{
                backgroundColor: '#FFFFFF', borderRadius: '20px', padding: '1.5rem 1.75rem',
                border: '1px solid #E5EBE5', marginBottom: '1.5rem', boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem'
              }}>
                <div>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: '900', color: '#1B4D2E', margin: 0 }}>
                    Exporter Trade Overview
                  </h2>
                  <p style={{ fontSize: '0.88rem', color: '#718096', margin: '0.2rem 0 0', fontWeight: '500' }}>
                    Real-time statistics for cardamom export supply, orders, shipments, and global buyer transactions.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <button onClick={() => setShowCreateOrderModal(true)} style={{ backgroundColor: '#43A047', color: '#FFFFFF', border: 'none', padding: '0.65rem 1.25rem', borderRadius: '12px', fontWeight: '900', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', boxShadow: '0 4px 10px rgba(67,160,71,0.3)' }}>
                    <Plus size={16} /> + Create Export Order
                  </button>
                  <button onClick={() => setShowAddBuyerModal(true)} style={{ backgroundColor: '#E8F5E9', color: '#2E7D32', border: '1px solid #A5D6A7', padding: '0.65rem 1.15rem', borderRadius: '12px', fontWeight: '900', fontSize: '0.85rem', cursor: 'pointer' }}>
                    + Add Buyer
                  </button>
                </div>
              </div>

              {/* STATS GRID */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
                {[
                  { label: 'Total International Buyers', val: stats?.total_international_buyers || buyers.length, color: '#1B4D2E', bg: '#E8F5E9' },
                  { label: 'Active Buyers', val: buyers.length, color: '#059669', bg: '#ECFDF5' },
                  { label: 'Total Export Orders', val: stats?.total_export_orders || 0, color: '#1B4D2E', bg: '#E8F5E9' },
                  { label: 'Pending Export Requests', val: stats?.pending_export_requests || 0, color: '#D97706', bg: '#FEF3C7' },
                  { label: 'Accepted Orders', val: stats?.accepted_orders || 0, color: '#0284C7', bg: '#E0F2FE' },
                  { label: 'Payment Pending', val: stats?.payment_pending || 0, color: '#DC2626', bg: '#FEE2E2' },
                  { label: 'Ready for Shipment', val: stats?.ready_for_shipment || 0, color: '#2563EB', bg: '#DBEAFE' },
                  { label: 'Active Shipments', val: stats?.active_shipments || 0, color: '#7C3AED', bg: '#F3E8FF' },
                  { label: 'Completed Exports', val: stats?.completed_exports || 0, color: '#16A34A', bg: '#DCFCE7' },
                  { label: 'Total Export Quantity', val: `${stats?.total_export_quantity_kg || 0} KG`, color: '#059669', bg: '#ECFDF5' },
                  { label: 'Total Export Value', val: `$${parseFloat(stats?.total_export_value_usd || 0).toLocaleString('en-US')}`, color: '#1B4D2E', bg: '#E8F5E9' },
                  { label: 'Pending Payments Value', val: `$${parseFloat(stats?.pending_payments_usd || 0).toLocaleString('en-US')}`, color: '#DC2626', bg: '#FEF2F2' },
                ].map((s, idx) => (
                  <div key={idx} style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '1.25rem', border: '1px solid #E5EBE5', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: '800', color: '#718096', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{s.label}</div>
                    <div style={{ fontSize: '1.6rem', fontWeight: '900', color: s.color, marginTop: '0.35rem' }}>{s.val}</div>
                  </div>
                ))}
              </div>

              {/* RECENT REQUESTS & RECENT ORDERS SUMMARY */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.25rem' }}>
                {/* Pending Export Supplies Card */}
                <div style={{ backgroundColor: '#FFFFFF', borderRadius: '20px', padding: '1.5rem', border: '1px solid #E5EBE5' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '900', color: '#1B4D2E', margin: 0 }}>Pending Trader Export Supply Requests</h3>
                    <button onClick={() => setActiveTab('supplies')} style={{ background: 'none', border: 'none', color: '#2E7D32', fontWeight: '800', fontSize: '0.8rem', cursor: 'pointer' }}>View All →</button>
                  </div>
                  {exportSupplies.length === 0 ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: '#718096', backgroundColor: '#F8FAF8', borderRadius: '12px', fontSize: '0.85rem' }}>
                      No data available yet.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {exportSupplies.slice(0, 4).map(s => (
                        <div key={s.id} style={{ backgroundColor: '#F8FAF8', borderRadius: '12px', padding: '0.85rem 1rem', border: '1px solid #E5EBE5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <div style={{ fontSize: '0.85rem', fontWeight: '900', color: '#1A202C' }}>#ES-{s.id} | {s.trader_name}</div>
                            <div style={{ fontSize: '0.75rem', color: '#718096', fontWeight: '600' }}>{s.variety} ({s.grade}) • <strong>{s.quantity_kg} KG</strong></div>
                          </div>
                          <button onClick={() => { setSelectedSupply(s); setShowSupplyDetailModal(true); }} style={{ backgroundColor: '#E8F5E9', color: '#2E7D32', border: '1px solid #A5D6A7', padding: '0.35rem 0.75rem', borderRadius: '8px', fontSize: '0.75rem', fontWeight: '800', cursor: 'pointer' }}>
                            View Details
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Recent Export Orders Card */}
                <div style={{ backgroundColor: '#FFFFFF', borderRadius: '20px', padding: '1.5rem', border: '1px solid #E5EBE5' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '900', color: '#1B4D2E', margin: 0 }}>Active Export Orders</h3>
                    <button onClick={() => setActiveTab('orders')} style={{ background: 'none', border: 'none', color: '#2E7D32', fontWeight: '800', fontSize: '0.8rem', cursor: 'pointer' }}>View All →</button>
                  </div>
                  {orders.length === 0 ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: '#718096', backgroundColor: '#F8FAF8', borderRadius: '12px', fontSize: '0.85rem' }}>
                      No data available yet.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {orders.slice(0, 4).map(o => (
                        <div key={o.id} style={{ backgroundColor: '#F8FAF8', borderRadius: '12px', padding: '0.85rem 1rem', border: '1px solid #E5EBE5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <div style={{ fontSize: '0.85rem', fontWeight: '900', color: '#1A202C' }}>{o.order_code} | {o.buyer_name}</div>
                            <div style={{ fontSize: '0.75rem', color: '#718096', fontWeight: '600' }}>{o.cardamom_variety} • {o.quantity_kg} KG • <strong>${parseFloat(o.total_value_usd).toLocaleString('en-US')}</strong></div>
                          </div>
                          <span style={{ backgroundColor: '#E0F2FE', color: '#0284C7', padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.7rem', fontWeight: '800' }}>
                            {o.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: INCOMING SUPPLY REQUESTS / TRADER OFFERS */}
          {/* ========================================================================= */}
          {activeTab === 'supplies' && (
            <div>
              <div style={{ backgroundColor: '#FFFFFF', borderRadius: '20px', padding: '1.5rem', border: '1px solid #E5EBE5', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
                  <div>
                    <h2 style={{ fontSize: '1.35rem', fontWeight: '900', color: '#1B4D2E', margin: 0 }}>
                      Incoming Supply Requests (Trader Cardamom Offers)
                    </h2>
                    <p style={{ fontSize: '0.85rem', color: '#718096', margin: '0.2rem 0 0' }}>
                      Review cardamom supply offers submitted by authenticated Traders and purchase directly into Exporter inventory.
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <div style={{ position: 'relative' }}>
                      <Search size={16} color="#94A3B8" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                      <input
                        type="text"
                        placeholder="Search trader, variety, grade, batch..."
                        value={suppliesSearch}
                        onChange={e => setSuppliesSearch(e.target.value)}
                        style={{ paddingLeft: '2rem', paddingRight: '0.75rem', paddingTop: '0.45rem', paddingBottom: '0.45rem', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '0.82rem' }}
                      />
                    </div>
                  </div>
                </div>

                {/* STATUS FILTER PILLS */}
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
                  {[
                    { label: 'All Offers', val: 'ALL', count: exportSupplies.length },
                    { label: 'Pending Offers', val: 'PENDING', count: exportSupplies.filter(s => s.status === 'PENDING').length },
                    { label: 'Accepted Purchases', val: 'ACCEPTED', count: exportSupplies.filter(s => s.status === 'ACCEPTED').length },
                    { label: 'Payment Pending', val: 'PAYMENT_PENDING', count: exportSupplies.filter(s => s.status === 'PAYMENT_PENDING').length },
                    { label: 'Paid', val: 'PAID', count: exportSupplies.filter(s => s.status === 'PAID' || s.payment_status === 'PAID').length },
                    { label: 'Ready for Pickup', val: 'READY_FOR_PICKUP', count: exportSupplies.filter(s => ['READY_FOR_PICKUP', 'READY_FOR_RECEIPT'].includes(s.status)).length },
                    { label: 'Pickup Confirmed', val: 'PICKUP_CONFIRMED', count: exportSupplies.filter(s => ['PICKUP_CONFIRMED', 'RECEIVED'].includes(s.status)).length },
                    { label: 'Completed Stock', val: 'COMPLETED', count: exportSupplies.filter(s => s.status === 'COMPLETED' || s.status === 'RECEIVED').length },
                    { label: 'Rejected / Cancelled', val: 'REJECTED', count: exportSupplies.filter(s => ['REJECTED', 'CANCELLED'].includes(s.status)).length },
                  ].map(filter => {
                    const isSelected = suppliesStatusFilter === filter.val || (filter.val === 'ALL' && !suppliesStatusFilter);
                    return (
                      <button
                        key={filter.val}
                        onClick={() => setSuppliesStatusFilter(filter.val === 'ALL' ? '' : filter.val)}
                        style={{
                          padding: '0.35rem 0.85rem',
                          borderRadius: '999px',
                          fontSize: '0.78rem',
                          fontWeight: isSelected ? '900' : '700',
                          border: isSelected ? '1px solid #2E7D32' : '1px solid #CBD5E1',
                          backgroundColor: isSelected ? '#E8F5E9' : '#FFFFFF',
                          color: isSelected ? '#1B4D2E' : '#64748B',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem'
                        }}
                      >
                        <span>{filter.label}</span>
                        <span style={{
                          fontSize: '0.7rem',
                          backgroundColor: isSelected ? '#2E7D32' : '#E2E8F0',
                          color: isSelected ? '#FFFFFF' : '#475569',
                          padding: '0.1rem 0.45rem',
                          borderRadius: '999px',
                          fontWeight: '800'
                        }}>
                          {filter.count}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {filteredSupplies.length === 0 ? (
                  <div style={{ padding: '3rem', textAlign: 'center', color: '#718096', backgroundColor: '#F8FAF8', borderRadius: '14px', fontSize: '0.9rem' }}>
                    No export supply requests match your filters.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                    {filteredSupplies.map(req => (
                      <div
                        key={req.id}
                        style={{
                          backgroundColor: '#F8FAF8', borderRadius: '12px', padding: '0.85rem 1.15rem',
                          border: '1px solid #E5EBE5', display: 'flex', justifyContent: 'space-between',
                          alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: '900', color: '#1B4D2E', fontSize: '0.9rem' }}>
                            #ES-{req.id}
                          </span>
                          <span style={{ fontSize: '0.88rem', color: '#1A202C', fontWeight: '800' }}>
                            Trader: {req.trader_name}
                          </span>
                          <span style={{ fontSize: '0.85rem', color: '#4A5568', fontWeight: '700' }}>
                            {req.variety} ({req.grade})
                          </span>
                          <span style={{ fontSize: '0.85rem', color: '#2E7D32', fontWeight: '900' }}>
                            {req.quantity_kg} KG
                          </span>
                          <span style={{ fontSize: '0.85rem', color: '#475569', fontWeight: '800' }}>
                            ₹{parseFloat(req.price_per_kg || 0).toLocaleString('en-IN')}/KG
                          </span>
                          <span style={{ fontSize: '0.88rem', color: '#059669', fontWeight: '900' }}>
                            Total: ₹{parseFloat(req.total_amount || 0).toLocaleString('en-IN')}
                          </span>
                          <span style={{ fontSize: '0.78rem', color: '#718096' }}>
                            Date: {req.request_date || req.created_at?.split('T')[0]}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <span style={{
                            backgroundColor: req.status === 'COMPLETED' ? '#E8F5E9' : (req.status === 'PENDING' ? '#FEF3C7' : (req.status === 'REJECTED' ? '#FEE2E2' : '#E0F2FE')),
                            color: req.status === 'COMPLETED' ? '#2E7D32' : (req.status === 'PENDING' ? '#92400E' : (req.status === 'REJECTED' ? '#DC2626' : '#0284C7')),
                            padding: '0.25rem 0.65rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: '900',
                            border: `1px solid ${req.status === 'COMPLETED' ? '#A5D6A7' : (req.status === 'PENDING' ? '#FDE68A' : (req.status === 'REJECTED' ? '#FECACA' : '#BAE6FD'))}`
                          }}>
                            {req.status}
                          </span>

                          <button
                            onClick={() => { setSelectedSupply(req); setShowSupplyDetailModal(true); }}
                            style={{
                              backgroundColor: '#2E7D32', color: '#FFFFFF', border: 'none',
                              padding: '0.45rem 0.85rem', borderRadius: '8px', fontWeight: '800',
                              fontSize: '0.78rem', cursor: 'pointer', boxShadow: '0 2px 6px rgba(46,125,50,0.2)'
                            }}
                          >
                            View Details
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: EXPORTER INVENTORY */}
          {/* ========================================================================= */}
          {activeTab === 'inventory' && (
            <div>
              <div style={{ backgroundColor: '#FFFFFF', borderRadius: '20px', padding: '1.5rem', border: '1px solid #E5EBE5', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
                  <div>
                    <h2 style={{ fontSize: '1.35rem', fontWeight: '900', color: '#1B4D2E', margin: 0 }}>Exporter Cardamom Inventory</h2>
                    <p style={{ fontSize: '0.85rem', color: '#718096', margin: '0.2rem 0 0' }}>Available stock acquired from Traders or added manually.</p>
                  </div>
                  <button onClick={() => setShowAddInventoryModal(true)} style={{ backgroundColor: '#43A047', color: '#FFFFFF', border: 'none', padding: '0.65rem 1.15rem', borderRadius: '12px', fontWeight: '900', fontSize: '0.85rem', cursor: 'pointer' }}>
                    + Add Inventory
                  </button>
                </div>

                {inventory.length === 0 ? (
                  <div style={{ padding: '3rem', textAlign: 'center', color: '#718096', backgroundColor: '#F8FAF8', borderRadius: '14px', fontSize: '0.85rem' }}>
                    No Exporter inventory items yet. Acquired stock from Traders will appear here automatically.
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#F8FAF8', color: '#4A5568', borderBottom: '2px solid #E5EBE5' }}>
                          <th style={{ padding: '0.75rem 1rem' }}>Batch / Lot Ref</th>
                          <th style={{ padding: '0.75rem 1rem' }}>Variety</th>
                          <th style={{ padding: '0.75rem 1rem' }}>Grade</th>
                          <th style={{ padding: '0.75rem 1rem' }}>Available Qty</th>
                          <th style={{ padding: '0.75rem 1rem' }}>Purchase Price</th>
                          <th style={{ padding: '0.75rem 1rem' }}>Source Trader</th>
                          <th style={{ padding: '0.75rem 1rem' }}>Purchase Date</th>
                          <th style={{ padding: '0.75rem 1rem' }}>Inventory Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {inventory.map(inv => (
                          <tr key={inv.id} style={{ borderBottom: '1px solid #F4F7F4' }}>
                            <td style={{ padding: '0.75rem 1rem', fontWeight: '900', color: '#1B4D2E' }}>
                              <code>{inv.batch_code}</code>
                            </td>
                            <td style={{ padding: '0.75rem 1rem', fontWeight: '800' }}>{inv.variety}</td>
                            <td style={{ padding: '0.75rem 1rem' }}>{inv.grade}</td>
                            <td style={{ padding: '0.75rem 1rem', fontWeight: '900', color: '#2E7D32' }}>{inv.quantity_kg} KG</td>
                            <td style={{ padding: '0.75rem 1rem' }}>₹{parseFloat(inv.purchase_price_per_kg || 0).toLocaleString('en-IN')}/KG</td>
                            <td style={{ padding: '0.75rem 1rem' }}>
                              <span style={{ backgroundColor: inv.source_trader_name ? '#E8F5E9' : '#F1F5F9', color: inv.source_trader_name ? '#1B4D2E' : '#64748B', padding: '0.2rem 0.55rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '800' }}>
                                {inv.source_trader_name ? `Trader: ${inv.source_trader_name}` : 'Self Stock'}
                              </span>
                            </td>
                            <td style={{ padding: '0.75rem 1rem', color: '#64748B', fontSize: '0.8rem' }}>
                              {inv.created_at ? new Date(inv.created_at).toLocaleDateString() : 'N/A'}
                            </td>
                            <td style={{ padding: '0.75rem 1rem' }}>
                              <span style={{ backgroundColor: inv.quantity_kg > 0 ? '#E8F5E9' : '#FFEBEE', color: inv.quantity_kg > 0 ? '#2E7D32' : '#C62828', padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.72rem', fontWeight: '800' }}>
                                {inv.status || (inv.quantity_kg > 0 ? 'AVAILABLE' : 'EXPORTED')}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 4: EXPORT ORDERS */}
          {/* ========================================================================= */}
          {activeTab === 'orders' && (
            <div>
              <div style={{ backgroundColor: '#FFFFFF', borderRadius: '20px', padding: '1.5rem', border: '1px solid #E5EBE5', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
                  <div>
                    <h2 style={{ fontSize: '1.35rem', fontWeight: '900', color: '#1B4D2E', margin: 0 }}>International Export Orders</h2>
                    <p style={{ fontSize: '0.85rem', color: '#718096', margin: '0.2rem 0 0' }}>Manage global cardamom shipments, quality approval, packaging, documents & tracking.</p>
                  </div>
                  <button onClick={() => setShowCreateOrderModal(true)} style={{ backgroundColor: '#43A047', color: '#FFFFFF', border: 'none', padding: '0.65rem 1.25rem', borderRadius: '12px', fontWeight: '900', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', boxShadow: '0 4px 10px rgba(67,160,71,0.3)' }}>
                    <Plus size={16} /> + Create Export Order
                  </button>
                </div>

                {filteredOrders.length === 0 ? (
                  <div style={{ padding: '3rem', textAlign: 'center', color: '#718096', backgroundColor: '#F8FAF8', borderRadius: '14px', fontSize: '0.85rem' }}>
                    No export orders created yet.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {filteredOrders.map(ord => {
                      const isDispute = ord.status === 'DELIVERY_DISPUTE' || Boolean(ord.delivery_confirmation?.is_dispute);
                      const isDelivered = ord.status === 'DELIVERED';
                      const isAwaiting = ord.status === 'AWAITING_BUYER_CONFIRMATION';
                      const isShippedStage = ['SHIPPED', 'IN_TRANSIT', 'AWAITING_BUYER_CONFIRMATION'].includes(ord.status);

                      let badgeBg = '#E0F2FE';
                      let badgeColor = '#0284C7';
                      let badgeBorder = '#BAE6FD';
                      let badgeText = ord.status;

                      if (isDelivered) {
                        badgeBg = '#DCFCE7';
                        badgeColor = '#166534';
                        badgeBorder = '#BBF7D0';
                        badgeText = '✓ Delivered & Confirmed';
                      } else if (isDispute) {
                        badgeBg = '#FEE2E2';
                        badgeColor = '#991B1B';
                        badgeBorder = '#FECACA';
                        badgeText = '⚠️ Delivery Dispute';
                      } else if (isAwaiting) {
                        badgeBg = '#FEF3C7';
                        badgeColor = '#92400E';
                        badgeBorder = '#FDE68A';
                        badgeText = '⏳ Awaiting Buyer Confirmation';
                      }

                      return (
                        <div key={ord.id} style={{ backgroundColor: '#F8FAF8', borderRadius: '14px', padding: '1.25rem', border: isDispute ? '1.5px solid #FCA5A5' : '1px solid #E5EBE5' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
                            <div>
                              <div style={{ fontSize: '1.05rem', fontWeight: '900', color: '#1A202C' }}>
                                {ord.order_code} | Buyer: {ord.buyer_name} ({ord.destination_country})
                              </div>
                              <div style={{ fontSize: '0.8rem', color: '#15803D', fontWeight: '800', margin: '0.2rem 0', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                <Mail size={14} />
                                <span>Buyer Email: <strong>{ord.email || ord.buyer_email || 'No email saved'}</strong></span>
                              </div>
                              <div style={{ fontSize: '0.78rem', color: '#718096', fontWeight: '600', margin: '0.2rem 0' }}>
                                Variety: <strong>{ord.cardamom_variety}</strong> ({ord.grade}) • Quantity: <strong>{ord.quantity_kg} KG</strong> • Total Value: <strong style={{ color: '#059669' }}>${parseFloat(ord.total_value_usd).toLocaleString('en-US')}</strong>
                              </div>
                              <div style={{ fontSize: '0.75rem', color: '#4A5568', fontWeight: '700' }}>
                                Port: {ord.destination_port} | Method: {ord.shipment_method} | Incoterms: {ord.incoterms}
                              </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                              <span style={{ backgroundColor: badgeBg, color: badgeColor, padding: '0.3rem 0.75rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: '900', border: `1px solid ${badgeBorder}` }}>
                                {badgeText}
                              </span>

                              {ord.buyer_confirmed_order && !ord.delivery_confirmation && (
                                <span style={{ backgroundColor: '#DCFCE7', color: '#166534', padding: '0.3rem 0.65rem', borderRadius: '999px', fontSize: '0.72rem', fontWeight: '800', border: '1px solid #BBF7D0', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                                  <CheckCircle2 size={12} />
                                  <span>Buyer Confirmed Order</span>
                                </span>
                              )}

                              {ord.delivery_confirmation ? (
                                <button
                                  type="button"
                                  onClick={() => handleOpenDeliveryConfirmation(ord)}
                                  style={{
                                    backgroundColor: isDispute ? '#DC2626' : '#16A34A',
                                    color: '#FFF',
                                    border: 'none',
                                    padding: '0.45rem 0.85rem',
                                    borderRadius: '8px',
                                    fontSize: '0.78rem',
                                    fontWeight: '800',
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.35rem'
                                  }}
                                >
                                  {isDispute ? <AlertTriangle size={14} /> : <CheckCircle2 size={14} />}
                                  <span>{isDispute ? 'Review Delivery Dispute' : 'View Delivery Confirmation'}</span>
                                </button>
                              ) : !ord.delivery_confirmation ? (
                                <button
                                  type="button"
                                  disabled={resendingConfirmationId === ord.id}
                                  onClick={() => handleResendConfirmationLink(ord.id)}
                                  title={`Send to ${ord.email || ord.buyer_email || 'buyer'}`}
                                  style={{
                                    backgroundColor: '#0F5A2C',
                                    color: '#FFF',
                                    border: 'none',
                                    padding: '0.45rem 0.85rem',
                                    borderRadius: '8px',
                                    fontSize: '0.78rem',
                                    fontWeight: '800',
                                    cursor: resendingConfirmationId === ord.id ? 'not-allowed' : 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.35rem'
                                  }}
                                >
                                  {resendingConfirmationId === ord.id ? (
                                    <RefreshCw size={14} className="animate-spin" />
                                  ) : (
                                    <Mail size={14} />
                                  )}
                                  <span>
                                    {ord.status === 'DELIVERED'
                                      ? (ord.active_token?.token_type === 'DELIVERY_REVIEW' ? 'Resend Delivery Review' : 'Send Delivery Review Email')
                                      : (ord.active_token ? 'Resend Order Link' : 'Send Confirmation Email')}
                                  </span>
                                </button>
                              ) : null}

                              <button onClick={() => { setSelectedOrder(ord); setShowOrderDetailModal(true); }} style={{ backgroundColor: '#2E7D32', color: '#FFF', border: 'none', padding: '0.45rem 0.85rem', borderRadius: '8px', fontSize: '0.78rem', fontWeight: '800', cursor: 'pointer' }}>
                                View Order Details
                              </button>
                            </div>
                          </div>

                          {/* Buyer Delivery Confirmation Summary Strip */}
                          {ord.delivery_confirmation && (
                            <div style={{
                              marginTop: '0.75rem',
                              padding: '0.65rem 0.85rem',
                              backgroundColor: isDispute ? '#FFF5F5' : '#F0FDF4',
                              borderRadius: '8px',
                              border: isDispute ? '1px solid #FECACA' : '1px solid #BBF7D0',
                              fontSize: '0.78rem',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              flexWrap: 'wrap',
                              gap: '0.5rem'
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                                <span style={{ fontWeight: '800', color: isDispute ? '#991B1B' : '#166534' }}>
                                  Ref: {ord.delivery_confirmation.confirmation_reference}
                                </span>
                                <span style={{ color: '#475569' }}>
                                  Received: <strong>{ord.delivery_confirmation.quantity_received_kg} KG</strong> / {ord.quantity_kg} KG
                                </span>
                                <span style={{
                                  padding: '0.15rem 0.5rem',
                                  borderRadius: '6px',
                                  fontSize: '0.72rem',
                                  fontWeight: '800',
                                  backgroundColor: isDispute ? '#FEE2E2' : '#DCFCE7',
                                  color: isDispute ? '#B91C1C' : '#15803D'
                                }}>
                                  {ord.delivery_confirmation.delivery_condition_display}
                                </span>
                                <span style={{ color: '#64748B' }}>
                                  Confirmed: {new Date(ord.delivery_confirmation.confirmed_at).toLocaleDateString()}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleOpenDeliveryConfirmation(ord)}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: isDispute ? '#DC2626' : '#16A34A',
                                  fontWeight: '800',
                                  fontSize: '0.75rem',
                                  cursor: 'pointer',
                                  textDecoration: 'underline'
                                }}
                              >
                                View full receipt &amp; evidence →
                              </button>
                            </div>
                          )}

                          {/* Link Active / Expired notice if pending confirmation */}
                          {!ord.delivery_confirmation && ord.active_token && (
                            <div style={{
                              marginTop: '0.65rem',
                              padding: '0.5rem 0.75rem',
                              backgroundColor: '#FFFBEB',
                              borderRadius: '8px',
                              border: '1px solid #FDE68A',
                              fontSize: '0.75rem',
                              color: '#92400E',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              flexWrap: 'wrap',
                              gap: '0.5rem'
                            }}>
                              <span>
                                ✉️ Confirmation email sent to <strong>{ord.active_token.sent_to_email || ord.buyer_email}</strong>.
                                Link expires: {new Date(ord.active_token.expires_at).toLocaleString()}.
                              </span>
                              <button
                                type="button"
                                disabled={resendingConfirmationId === ord.id}
                                onClick={() => handleResendConfirmationLink(ord.id)}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: '#B45309',
                                  fontWeight: '800',
                                  fontSize: '0.75rem',
                                  cursor: 'pointer',
                                  textDecoration: 'underline'
                                }}
                              >
                                Resend now
                              </button>
                            </div>
                          )}

                          {/* Order Step Tracker Bar */}
                          <OrderTracker status={ord.status} order={ord} shipment={shipments.find(s => s.export_order === ord.id || s.order_code === ord.order_code)} />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 5: INTERNATIONAL BUYERS */}
          {/* ========================================================================= */}
          {activeTab === 'buyers' && (
            <div>
              <div style={{ backgroundColor: '#FFFFFF', borderRadius: '20px', padding: '1.5rem', border: '1px solid #E5EBE5', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
                  <div>
                    <h2 style={{ fontSize: '1.35rem', fontWeight: '900', color: '#1B4D2E', margin: 0 }}>International Buyers Management</h2>
                    <p style={{ fontSize: '0.85rem', color: '#718096', margin: '0.2rem 0 0' }}>Global importer company profiles, contact details & purchase history.</p>
                  </div>
                  <button onClick={() => setShowAddBuyerModal(true)} style={{ backgroundColor: '#43A047', color: '#FFFFFF', border: 'none', padding: '0.65rem 1.15rem', borderRadius: '12px', fontWeight: '900', fontSize: '0.85rem', cursor: 'pointer' }}>
                    + Add New Buyer
                  </button>
                </div>

                {buyers.length === 0 ? (
                  <div style={{ padding: '3rem', textAlign: 'center', color: '#718096', backgroundColor: '#F8FAF8', borderRadius: '14px', fontSize: '0.85rem' }}>
                    No international buyers added yet. Click "+ Add New Buyer" above.
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                    {buyers.map(b => (
                      <div key={b.id} style={{ backgroundColor: '#F8FAF8', borderRadius: '14px', padding: '1.25rem', border: '1px solid #E5EBE5' }}>
                        <div style={{ fontSize: '1.05rem', fontWeight: '900', color: '#1A202C' }}>{b.name}</div>
                        <div style={{ fontSize: '0.82rem', fontWeight: '800', color: '#2E7D32', margin: '0.2rem 0 0.4rem' }}>{b.company_name} ({b.country})</div>
                        <div style={{ fontSize: '0.78rem', color: '#4A5568', lineHeight: 1.6 }}>
                          <div>📧 {b.email}</div>
                          <div>📞 {b.phone}</div>
                          <div>📍 {b.address}</div>
                        </div>
                        <button onClick={() => handleOpenBuyerDetail(b.id)} style={{ marginTop: '0.85rem', width: '100%', backgroundColor: '#E8F5E9', color: '#2E7D32', border: '1px solid #A5D6A7', padding: '0.45rem', borderRadius: '8px', fontWeight: '800', fontSize: '0.78rem', cursor: 'pointer' }}>
                          View History & Details
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 6-9 UNIFIED: ORDER FULFILLMENT & TRACKING PIPELINE */}
          {/* ========================================================================= */}
          {['fulfillment', 'quality', 'packaging', 'documents', 'shipments'].includes(activeTab) && (
            <div>
              <div style={{ backgroundColor: '#FFFFFF', borderRadius: '20px', padding: '1.5rem', border: '1px solid #E5EBE5', marginBottom: '1.5rem', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
                  <div>
                    <h2 style={{ fontSize: '1.4rem', fontWeight: '900', color: '#1B4D2E', margin: 0, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <Anchor size={24} color="#16A34A" />
                      Order Fulfillment &amp; Step Tracking
                    </h2>
                    <p style={{ fontSize: '0.85rem', color: '#718096', margin: '0.25rem 0 0' }}>
                      Unified export execution pipeline: Quality Approved → Packaging → Export Documents → Shipment Tracking → Buyer Delivery Review.
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <div style={{ position: 'relative' }}>
                      <Search size={16} color="#94A3B8" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                      <input
                        type="text"
                        placeholder="Search order, buyer, variety..."
                        value={fulfillmentSearch}
                        onChange={e => setFulfillmentSearch(e.target.value)}
                        style={{ paddingLeft: '2rem', paddingRight: '0.75rem', paddingTop: '0.45rem', paddingBottom: '0.45rem', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '0.82rem', width: '220px' }}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowShipmentModal(true)}
                      style={{ backgroundColor: '#43A047', color: '#FFFFFF', border: 'none', padding: '0.55rem 1.15rem', borderRadius: '10px', fontWeight: '900', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', boxShadow: '0 4px 10px rgba(67,160,71,0.2)' }}
                    >
                      <Plus size={15} /> + Create New Shipment
                    </button>
                  </div>
                </div>

                {/* FILTER PILLS */}
                <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
                  {[
                    { label: 'All Orders', val: 'ALL', count: orders.length },
                    { label: 'Buyer Confirmed', val: 'BUYER_CONFIRMED', count: orders.filter(o => o.buyer_confirmed_order).length },
                    { label: 'Quality Pending', val: 'QUALITY_PENDING', count: orders.filter(o => !o.quality_records || o.quality_records.length === 0).length },
                    { label: 'Packaging Pending', val: 'PACKAGING_PENDING', count: orders.filter(o => !o.packaging_records || o.packaging_records.length === 0).length },
                    { label: 'Documents Pending', val: 'DOCS_PENDING', count: orders.filter(o => !o.documents || o.documents.length === 0).length },
                    { label: 'Ready for Shipment', val: 'READY_FOR_SHIPMENT', count: orders.filter(o => o.status === 'READY_FOR_SHIPMENT').length },
                    { label: 'Shipped & In Transit', val: 'SHIPPED', count: orders.filter(o => ['SHIPPED', 'IN_TRANSIT'].includes(o.status)).length },
                    { label: 'Awaiting Buyer Review', val: 'AWAITING_CONFIRMATION', count: orders.filter(o => o.status === 'AWAITING_BUYER_CONFIRMATION').length },
                    { label: 'Delivered & Confirmed', val: 'DELIVERED', count: orders.filter(o => ['DELIVERED', 'COMPLETED'].includes(o.status) || o.delivery_confirmation).length },
                  ].map(filter => {
                    const isSelected = fulfillmentStageFilter === filter.val;
                    return (
                      <button
                        key={filter.val}
                        onClick={() => setFulfillmentStageFilter(filter.val)}
                        style={{
                          padding: '0.35rem 0.8rem',
                          borderRadius: '999px',
                          fontSize: '0.75rem',
                          fontWeight: isSelected ? '900' : '700',
                          border: isSelected ? '1px solid #16A34A' : '1px solid #E2E8F0',
                          backgroundColor: isSelected ? '#DCFCE7' : '#FFFFFF',
                          color: isSelected ? '#166534' : '#64748B',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <span>{filter.label}</span>
                        {filter.count > 0 && (
                          <span style={{ fontSize: '0.68rem', backgroundColor: isSelected ? '#16A34A' : '#E2E8F0', color: isSelected ? '#FFF' : '#475569', padding: '0.1rem 0.45rem', borderRadius: '999px', fontWeight: '800' }}>
                            {filter.count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* ORDERS PIPELINE LIST */}
                {filteredFulfillmentOrders.length === 0 ? (
                  <div style={{ padding: '3.5rem', textAlign: 'center', color: '#718096', backgroundColor: '#F8FAF8', borderRadius: '16px', fontSize: '0.9rem' }}>
                    No export orders match this filter. Create an export order or adjust your filter above.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    {filteredFulfillmentOrders.map(ord => {
                      const matchingShipment = shipments.find(s => s.export_order === ord.id || s.order_code === ord.order_code);
                      const confirmation = ord.delivery_confirmation;
                      const isDispute = ord.status === 'DELIVERY_DISPUTE' || Boolean(confirmation?.is_dispute);

                      return (
                        <div key={ord.id} style={{
                          backgroundColor: '#FFFFFF',
                          borderRadius: '16px',
                          padding: '1.4rem',
                          border: isDispute ? '1.5px solid #FCA5A5' : '1px solid #E2E8F0',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.9rem'
                        }}>
                          {/* Top Row: Order Header */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                                <span style={{ fontSize: '1.15rem', fontWeight: '900', color: '#1B4D2E' }}>
                                  {ord.order_code}
                                </span>
                                <span style={{ color: '#475569', fontSize: '0.9rem', fontWeight: '700' }}>
                                  | Buyer: <strong>{ord.buyer_name}</strong> ({ord.destination_country})
                                </span>
                                {ord.buyer_confirmed_order && (
                                  <span style={{ backgroundColor: '#DCFCE7', color: '#166534', padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.72rem', fontWeight: '800', border: '1px solid #BBF7D0', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                                    <CheckCircle2 size={12} />
                                    <span>Buyer Confirmed Order</span>
                                  </span>
                                )}
                              </div>
                              <div style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: '600', marginTop: '0.25rem' }}>
                                Variety: <strong>{ord.cardamom_variety}</strong> ({ord.grade}) • Quantity: <strong>{ord.quantity_kg} KG</strong> • Total Value: <strong style={{ color: '#059669' }}>${parseFloat(ord.total_value_usd).toLocaleString('en-US')}</strong> • Port: {ord.destination_port} ({ord.incoterms})
                              </div>
                            </div>

                            {/* Top Right Action Buttons */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                              <span style={{ backgroundColor: ord.status === 'DELIVERED' ? '#DCFCE7' : '#E0F2FE', color: ord.status === 'DELIVERED' ? '#166534' : '#0369A1', padding: '0.3rem 0.75rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: '800', border: '1px solid #BAE6FD' }}>
                                {ord.status.replace(/_/g, ' ')}
                              </span>

                              {confirmation ? (
                                <button
                                  type="button"
                                  onClick={() => handleOpenDeliveryConfirmation(ord)}
                                  style={{
                                    backgroundColor: isDispute ? '#DC2626' : '#16A34A',
                                    color: '#FFF',
                                    border: 'none',
                                    padding: '0.4rem 0.8rem',
                                    borderRadius: '8px',
                                    fontSize: '0.75rem',
                                    fontWeight: '800',
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.35rem'
                                  }}
                                >
                                  {isDispute ? <AlertTriangle size={13} /> : <CheckCircle2 size={13} />}
                                  <span>{isDispute ? 'Review Dispute' : 'View Delivery Receipt'}</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  disabled={resendingConfirmationId === ord.id}
                                  onClick={() => handleResendConfirmationLink(ord.id)}
                                  title={`Send to ${ord.email || ord.buyer_email || 'buyer'}`}
                                  style={{
                                    backgroundColor: ['DELIVERED', 'ARRIVED'].includes(ord.status) ? '#D97706' : '#0F5A2C',
                                    color: '#FFF',
                                    border: 'none',
                                    padding: '0.4rem 0.8rem',
                                    borderRadius: '8px',
                                    fontSize: '0.75rem',
                                    fontWeight: '800',
                                    cursor: resendingConfirmationId === ord.id ? 'not-allowed' : 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.35rem'
                                  }}
                                >
                                  {resendingConfirmationId === ord.id ? <RefreshCw size={13} className="animate-spin" /> : <Mail size={13} />}
                                  <span>{['DELIVERED', 'ARRIVED'].includes(ord.status) ? 'Resend Delivery Review' : (ord.buyer_confirmed_order ? 'Resend Order Link' : 'Send Order Confirmation')}</span>
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => { setSelectedOrder(ord); setShowOrderDetailModal(true); }}
                                style={{ backgroundColor: '#F1F5F9', color: '#334155', border: '1px solid #CBD5E1', padding: '0.4rem 0.75rem', borderRadius: '8px', fontSize: '0.75rem', fontWeight: '800', cursor: 'pointer' }}
                              >
                                View Order
                              </button>
                            </div>
                          </div>

                          {/* Order Tracking Progress Bar: Quality Approved → Packaging → Documents → Ready → Shipped → In Transit → Awaiting → Delivered */}
                          <OrderTracker status={ord.status} order={ord} shipment={matchingShipment} />

                          {/* 4-in-1 Direct Execution Grid */}
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.85rem' }}>
                            {/* Card 1: Quality & Grading */}
                            <div style={{ backgroundColor: '#F8FAF8', borderRadius: '12px', padding: '0.9rem', border: '1px solid #E5EBE5', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                              <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                                  <span style={{ fontSize: '0.78rem', fontWeight: '800', color: '#1B4D2E', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                    <Award size={15} color="#16A34A" /> Quality &amp; Grading
                                  </span>
                                  {ord.quality_records && ord.quality_records.length > 0 ? (
                                    <span style={{ fontSize: '0.68rem', backgroundColor: '#DCFCE7', color: '#166534', padding: '0.15rem 0.45rem', borderRadius: '6px', fontWeight: '800' }}>
                                      ✓ APPROVED
                                    </span>
                                  ) : (
                                    <span style={{ fontSize: '0.68rem', backgroundColor: '#FEF3C7', color: '#92400E', padding: '0.15rem 0.45rem', borderRadius: '6px', fontWeight: '800' }}>
                                      Pending
                                    </span>
                                  )}
                                </div>
                                {ord.quality_records && ord.quality_records.length > 0 ? (
                                  <div style={{ fontSize: '0.72rem', color: '#475569', lineHeight: 1.5 }}>
                                    <div>Moisture: <strong>{ord.quality_records[0].moisture_percentage}%</strong> | Size: <strong>{ord.quality_records[0].size_mm}</strong></div>
                                    <div>Color: {ord.quality_records[0].color_appearance} | Status: <strong>{ord.quality_records[0].quality_status}</strong></div>
                                  </div>
                                ) : (
                                  <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>
                                    Moisture &amp; grading check not recorded yet.
                                  </div>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={() => handleOpenQualityModal(ord)}
                                style={{ marginTop: '0.65rem', backgroundColor: '#E8F5E9', color: '#2E7D32', border: '1px solid #A5D6A7', padding: '0.4rem 0.65rem', borderRadius: '8px', fontSize: '0.72rem', fontWeight: '800', cursor: 'pointer', textAlign: 'center' }}
                              >
                                {ord.quality_records?.length > 0 ? 'Edit / Re-check Quality' : '+ Record Quality Check'}
                              </button>
                            </div>

                            {/* Card 2: Packaging Records */}
                            <div style={{ backgroundColor: '#F8FAF8', borderRadius: '12px', padding: '0.9rem', border: '1px solid #E5EBE5', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                              <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                                  <span style={{ fontSize: '0.78rem', fontWeight: '800', color: '#0369A1', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                    <Layers size={15} color="#0284C7" /> Packaging
                                  </span>
                                  {ord.packaging_records && ord.packaging_records.length > 0 ? (
                                    <span style={{ fontSize: '0.68rem', backgroundColor: '#E0F2FE', color: '#0369A1', padding: '0.15rem 0.45rem', borderRadius: '6px', fontWeight: '800' }}>
                                      ✓ PACKAGED
                                    </span>
                                  ) : (
                                    <span style={{ fontSize: '0.68rem', backgroundColor: '#F1F5F9', color: '#64748B', padding: '0.15rem 0.45rem', borderRadius: '6px', fontWeight: '800' }}>
                                      Pending
                                    </span>
                                  )}
                                </div>
                                {ord.packaging_records && ord.packaging_records.length > 0 ? (
                                  <div style={{ fontSize: '0.72rem', color: '#475569', lineHeight: 1.5 }}>
                                    <div><strong>{ord.packaging_records[0].packaging_type}</strong></div>
                                    <div>{ord.packaging_records[0].number_of_packages} pkgs @ {ord.packaging_records[0].weight_per_package_kg} KG/pkg</div>
                                  </div>
                                ) : (
                                  <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>
                                    Specify vacuum packs, cartons or jute bags.
                                  </div>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={() => handleOpenPackagingModal(ord)}
                                style={{ marginTop: '0.65rem', backgroundColor: '#E0F2FE', color: '#0369A1', border: '1px solid #BAE6FD', padding: '0.4rem 0.65rem', borderRadius: '8px', fontSize: '0.72rem', fontWeight: '800', cursor: 'pointer', textAlign: 'center' }}
                              >
                                {ord.packaging_records?.length > 0 ? 'Edit / Add Packaging' : '+ Add Packaging Record'}
                              </button>
                            </div>

                            {/* Card 3: Export Documents */}
                            <div style={{ backgroundColor: '#F8FAF8', borderRadius: '12px', padding: '0.9rem', border: '1px solid #E5EBE5', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                              <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                                  <span style={{ fontSize: '0.78rem', fontWeight: '800', color: '#7C3AED', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                    <FileText size={15} color="#7C3AED" /> Export Documents
                                  </span>
                                  <span style={{ fontSize: '0.68rem', backgroundColor: ord.documents?.length > 0 ? '#F3E8FF' : '#F1F5F9', color: ord.documents?.length > 0 ? '#6D28D9' : '#64748B', padding: '0.15rem 0.45rem', borderRadius: '6px', fontWeight: '800' }}>
                                    {ord.documents?.length || 0} Uploaded
                                  </span>
                                </div>
                                {ord.documents && ord.documents.length > 0 ? (
                                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', maxHeight: '55px', overflowY: 'auto' }}>
                                    {ord.documents.map(d => (
                                      <span key={d.id} style={{ fontSize: '0.68rem', backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', padding: '0.15rem 0.4rem', borderRadius: '4px', color: '#334155' }}>
                                        📄 {d.document_type}
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>
                                    Invoice, Packing List, Phyto certs.
                                  </div>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={() => handleOpenDocumentModal(ord)}
                                style={{ marginTop: '0.65rem', backgroundColor: '#F3E8FF', color: '#6D28D9', border: '1px solid #DDD6FE', padding: '0.4rem 0.65rem', borderRadius: '8px', fontSize: '0.72rem', fontWeight: '800', cursor: 'pointer', textAlign: 'center' }}
                              >
                                + Upload Export Document
                              </button>
                            </div>

                            {/* Card 4: Shipment & Tracking Status */}
                            <div style={{ backgroundColor: '#F8FAF8', borderRadius: '12px', padding: '0.9rem', border: '1px solid #E5EBE5', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                              <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                                  <span style={{ fontSize: '0.78rem', fontWeight: '800', color: '#0F5A2C', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                    <Truck size={15} color="#0F5A2C" /> Shipment Tracking
                                  </span>
                                  {matchingShipment ? (
                                    <span style={{ fontSize: '0.68rem', backgroundColor: '#DCFCE7', color: '#166534', padding: '0.15rem 0.45rem', borderRadius: '6px', fontWeight: '800' }}>
                                      {matchingShipment.status}
                                    </span>
                                  ) : (
                                    <span style={{ fontSize: '0.68rem', backgroundColor: '#F1F5F9', color: '#64748B', padding: '0.15rem 0.45rem', borderRadius: '6px', fontWeight: '800' }}>
                                      No Shipment
                                    </span>
                                  )}
                                </div>
                                {matchingShipment ? (
                                  <div style={{ fontSize: '0.72rem', color: '#475569', lineHeight: 1.4 }}>
                                    <div>Track: <strong>#{matchingShipment.tracking_number}</strong></div>
                                    <div>{matchingShipment.carrier} ({matchingShipment.shipping_method})</div>
                                  </div>
                                ) : (
                                  <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>
                                    Ready to dispatch container or air cargo.
                                  </div>
                                )}
                              </div>

                              {matchingShipment ? (
                                <div style={{ marginTop: '0.65rem' }}>
                                  <label style={{ fontSize: '0.68rem', fontWeight: '800', color: '#64748B', display: 'block', marginBottom: '0.2rem' }}>Update Tracking Status:</label>
                                  <select
                                    value={matchingShipment.status}
                                    onChange={e => handleShipmentStatusUpdate(matchingShipment.id, e.target.value)}
                                    style={{ width: '100%', padding: '0.35rem 0.5rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.72rem', fontWeight: '800', backgroundColor: '#FFF' }}
                                  >
                                    <option value="PREPARING">PREPARING</option>
                                    <option value="READY_FOR_SHIPMENT">READY FOR SHIPMENT</option>
                                    <option value="SHIPPED">SHIPPED</option>
                                    <option value="IN_TRANSIT">IN TRANSIT</option>
                                    <option value="AWAITING_BUYER_CONFIRMATION">AWAITING BUYER CONFIRMATION</option>
                                    <option value="ARRIVED">ARRIVED</option>
                                    <option value="DELIVERED">DELIVERED (Sends Review Email)</option>
                                    <option value="DELIVERY_DISPUTE">DELIVERY DISPUTE</option>
                                  </select>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setShipmentForm({
                                      export_order_id: ord.id,
                                      carrier: 'Maersk Line',
                                      shipping_method: ord.shipment_method || 'SEA',
                                      origin: 'Cochin Port, India',
                                      destination: ord.destination_port || '',
                                      dispatch_date: new Date().toISOString().split('T')[0],
                                      estimated_delivery: ''
                                    });
                                    setShowShipmentModal(true);
                                  }}
                                  style={{ marginTop: '0.65rem', backgroundColor: '#0F5A2C', color: '#FFF', border: 'none', padding: '0.4rem 0.65rem', borderRadius: '8px', fontSize: '0.72rem', fontWeight: '800', cursor: 'pointer', textAlign: 'center' }}
                                >
                                  + Create Shipment for this Order
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Bottom Receipt Status if confirmed */}
                          {confirmation && (
                            <div style={{
                              padding: '0.65rem 0.85rem',
                              backgroundColor: isDispute ? '#FEF2F2' : '#F0FDF4',
                              borderRadius: '10px',
                              border: isDispute ? '1px solid #FECACA' : '1px solid #BBF7D0',
                              fontSize: '0.75rem',
                              color: isDispute ? '#991B1B' : '#166534',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              flexWrap: 'wrap',
                              gap: '0.5rem'
                            }}>
                              <span>
                                <strong>Buyer Delivery Confirmed:</strong> {confirmation.quantity_received_kg} KG received ({confirmation.delivery_condition_display}) on {new Date(confirmation.confirmed_at).toLocaleDateString()}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleOpenDeliveryConfirmation(ord)}
                                style={{ background: 'none', border: 'none', color: isDispute ? '#DC2626' : '#16A34A', fontWeight: '800', fontSize: '0.75rem', cursor: 'pointer', textDecoration: 'underline' }}
                              >
                                View full receipt &amp; evidence →
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 10: TRANSACTIONS LOG */}
          {/* ========================================================================= */}
          {activeTab === 'transactions' && (
            <div>
              <div style={{ backgroundColor: '#FFFFFF', borderRadius: '20px', padding: '1.5rem', border: '1px solid #E5EBE5', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.35rem', fontWeight: '900', color: '#1B4D2E', margin: '0 0 0.4rem' }}>Financial Transactions Log</h2>
                <p style={{ fontSize: '0.85rem', color: '#718096', marginBottom: '1.25rem' }}>Audit log of payments sent to Traders and payments received from International Buyers.</p>

                {transactions.length === 0 ? (
                  <div style={{ padding: '3rem', textAlign: 'center', color: '#718096', backgroundColor: '#F8FAF8', borderRadius: '14px', fontSize: '0.85rem' }}>
                    No financial transactions recorded yet.
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#F8FAF8', color: '#4A5568', borderBottom: '2px solid #E5EBE5' }}>
                          <th style={{ padding: '0.75rem 1rem' }}>TX Code</th>
                          <th style={{ padding: '0.75rem 1rem' }}>Sender</th>
                          <th style={{ padding: '0.75rem 1rem' }}>Receiver</th>
                          <th style={{ padding: '0.75rem 1rem' }}>Amount</th>
                          <th style={{ padding: '0.75rem 1rem' }}>Method</th>
                          <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                          <th style={{ padding: '0.75rem 1rem' }}>Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {transactions.map(tx => (
                          <tr key={tx.id} style={{ borderBottom: '1px solid #F4F7F4' }}>
                            <td style={{ padding: '0.75rem 1rem', fontWeight: '900', color: '#1B4D2E' }}>{tx.transaction_code}</td>
                            <td style={{ padding: '0.75rem 1rem' }}>{tx.sender_name}</td>
                            <td style={{ padding: '0.75rem 1rem' }}>{tx.receiver_name}</td>
                            <td style={{ padding: '0.75rem 1rem', fontWeight: '900', color: '#059669' }}>₹{parseFloat(tx.amount || 0).toLocaleString('en-IN')}</td>
                            <td style={{ padding: '0.75rem 1rem' }}>{tx.payment_method}</td>
                            <td style={{ padding: '0.75rem 1rem' }}>
                              <span style={{ backgroundColor: '#E8F5E9', color: '#2E7D32', padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.72rem', fontWeight: '800' }}>
                                {tx.status}
                              </span>
                            </td>
                            <td style={{ padding: '0.75rem 1rem', color: '#718096' }}>{tx.created_at?.split('T')[0]}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 11: REPORTS & ANALYTICS */}
          {/* ========================================================================= */}
          {activeTab === 'reports' && (
            <div>
              <div style={{ backgroundColor: '#FFFFFF', borderRadius: '20px', padding: '1.5rem', border: '1px solid #E5EBE5', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
                  <div>
                    <h2 style={{ fontSize: '1.35rem', fontWeight: '900', color: '#1B4D2E', margin: 0 }}>Export Reports & Analytics</h2>
                    <p style={{ fontSize: '0.85rem', color: '#718096', margin: '0.2rem 0 0' }}>Comprehensive export analytics derived directly from PostgreSQL database records.</p>
                  </div>

                  {/* Date Filter Bar */}
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    {['all', 'today', 'week', 'month', 'year', 'custom'].map(p => (
                      <button
                        key={p}
                        onClick={() => setReportsPeriod(p)}
                        style={{
                          padding: '0.45rem 0.85rem', borderRadius: '8px', border: '1px solid #C8E6C9',
                          backgroundColor: reportsPeriod === p ? '#2E7D32' : '#E8F5E9',
                          color: reportsPeriod === p ? '#FFF' : '#2E7D32', fontWeight: '800',
                          fontSize: '0.78rem', cursor: 'pointer', textTransform: 'capitalize'
                        }}
                      >
                        {p}
                      </button>
                    ))}

                    {reportsPeriod === 'custom' && (
                      <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                        <input type="date" value={reportsStartDate} onChange={e => setReportsStartDate(e.target.value)} style={{ padding: '0.35rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.78rem' }} />
                        <span style={{ fontSize: '0.8rem', color: '#718096' }}>to</span>
                        <input type="date" value={reportsEndDate} onChange={e => setReportsEndDate(e.target.value)} style={{ padding: '0.35rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.78rem' }} />
                      </div>
                    )}
                  </div>
                </div>

                {/* OVERVIEW SUMMARY CARDS */}
                {reports?.overview && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div style={{ backgroundColor: '#F8FAF8', borderRadius: '14px', padding: '1rem', border: '1px solid #E5EBE5' }}>
                      <div style={{ fontSize: '0.72rem', fontWeight: '800', color: '#718096' }}>Total Orders</div>
                      <div style={{ fontSize: '1.4rem', fontWeight: '900', color: '#1B4D2E' }}>{reports.overview.total_export_orders}</div>
                    </div>
                    <div style={{ backgroundColor: '#F8FAF8', borderRadius: '14px', padding: '1rem', border: '1px solid #E5EBE5' }}>
                      <div style={{ fontSize: '0.72rem', fontWeight: '800', color: '#718096' }}>Completed Exports</div>
                      <div style={{ fontSize: '1.4rem', fontWeight: '900', color: '#16A34A' }}>{reports.overview.completed_exports}</div>
                    </div>
                    <div style={{ backgroundColor: '#F8FAF8', borderRadius: '14px', padding: '1rem', border: '1px solid #E5EBE5' }}>
                      <div style={{ fontSize: '0.72rem', fontWeight: '800', color: '#718096' }}>Total Export Quantity</div>
                      <div style={{ fontSize: '1.4rem', fontWeight: '900', color: '#059669' }}>{reports.overview.total_export_quantity_kg} KG</div>
                    </div>
                    <div style={{ backgroundColor: '#F8FAF8', borderRadius: '14px', padding: '1rem', border: '1px solid #E5EBE5' }}>
                      <div style={{ fontSize: '0.72rem', fontWeight: '800', color: '#718096' }}>Total Export Value</div>
                      <div style={{ fontSize: '1.4rem', fontWeight: '900', color: '#1B4D2E' }}>${parseFloat(reports.overview.total_export_value_usd || 0).toLocaleString('en-US')}</div>
                    </div>
                  </div>
                )}

                {/* 7 DETAILED REPORT CARDS */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
                  {/* 1. Country-wise Export Report */}
                  <div style={{ backgroundColor: '#F8FAF8', borderRadius: '14px', padding: '1.25rem', border: '1px solid #E5EBE5' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: '900', color: '#1B4D2E', margin: '0 0 0.85rem' }}>🌍 1. Country-wise Export Report</h3>
                    {(!reports?.reports?.country_wise || reports.reports.country_wise.length === 0) ? (
                      <div style={{ color: '#718096', fontSize: '0.85rem' }}>No data available yet.</div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {reports.reports.country_wise.map((c, i) => (
                          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', padding: '0.35rem 0', borderBottom: '1px solid #E5EBE5' }}>
                            <span><strong>{c.destination_country}</strong> ({c.count} orders)</span>
                            <span style={{ fontWeight: '800', color: '#2E7D32' }}>{c.total_qty} KG • ${parseFloat(c.total_val || 0).toLocaleString('en-US')}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 2. Variety-wise Export Report */}
                  <div style={{ backgroundColor: '#F8FAF8', borderRadius: '14px', padding: '1.25rem', border: '1px solid #E5EBE5' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: '900', color: '#1B4D2E', margin: '0 0 0.85rem' }}>🌾 2. Variety-wise Export Report</h3>
                    {(!reports?.reports?.variety_wise || reports.reports.variety_wise.length === 0) ? (
                      <div style={{ color: '#718096', fontSize: '0.85rem' }}>No data available yet.</div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {reports.reports.variety_wise.map((v, i) => (
                          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', padding: '0.35rem 0', borderBottom: '1px solid #E5EBE5' }}>
                            <span><strong>{v.cardamom_variety}</strong> ({v.count} orders)</span>
                            <span style={{ fontWeight: '800', color: '#2E7D32' }}>{v.total_qty} KG</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 3. Grade-wise Export Report */}
                  <div style={{ backgroundColor: '#F8FAF8', borderRadius: '14px', padding: '1.25rem', border: '1px solid #E5EBE5' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: '900', color: '#1B4D2E', margin: '0 0 0.85rem' }}>🏷️ 3. Grade-wise Export Report</h3>
                    {(!reports?.reports?.grade_wise || reports.reports.grade_wise.length === 0) ? (
                      <div style={{ color: '#718096', fontSize: '0.85rem' }}>No data available yet.</div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {reports.reports.grade_wise.map((g, i) => (
                          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', padding: '0.35rem 0', borderBottom: '1px solid #E5EBE5' }}>
                            <span><strong>{g.grade}</strong> ({g.count} orders)</span>
                            <span style={{ fontWeight: '800', color: '#2E7D32' }}>{g.total_qty} KG</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 4. Buyer-wise Export Report */}
                  <div style={{ backgroundColor: '#F8FAF8', borderRadius: '14px', padding: '1.25rem', border: '1px solid #E5EBE5' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: '900', color: '#1B4D2E', margin: '0 0 0.85rem' }}>🏢 4. Buyer-wise Export Report</h3>
                    {(!reports?.reports?.buyer_wise || reports.reports.buyer_wise.length === 0) ? (
                      <div style={{ color: '#718096', fontSize: '0.85rem' }}>No data available yet.</div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {reports.reports.buyer_wise.map((b, i) => (
                          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', padding: '0.35rem 0', borderBottom: '1px solid #E5EBE5' }}>
                            <span><strong>{b.buyer_name}</strong> ({b.company_name})</span>
                            <span style={{ fontWeight: '800', color: '#2E7D32' }}>${parseFloat(b.total_val || 0).toLocaleString('en-US')}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 12: EXPORTER PROFILE */}
          {/* ========================================================================= */}
          {activeTab === 'profile' && (
            <div>
              <div style={{ backgroundColor: '#FFFFFF', borderRadius: '20px', padding: '2rem', maxWidth: '600px', margin: '0 auto', border: '1px solid #E5EBE5' }}>
                <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                  <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#1B4D2E', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '1.5rem', margin: '0 auto 0.75rem' }}>
                    {user?.full_name ? user.full_name.charAt(0) : 'E'}
                  </div>
                  <h2 style={{ fontSize: '1.35rem', fontWeight: '900', color: '#1A202C', margin: 0 }}>{user?.full_name}</h2>
                  <div style={{ fontSize: '0.85rem', color: '#2E7D32', fontWeight: '800', marginTop: '4px' }}>ROLE: EXPORTER</div>
                </div>

                <div style={{ backgroundColor: '#F8FAF8', borderRadius: '12px', padding: '1rem', border: '1px solid #E5EBE5', fontSize: '0.85rem', lineHeight: 1.8, marginBottom: '1.25rem' }}>
                  <div><strong>Email:</strong> {user?.email}</div>
                  <div><strong>Phone:</strong> {user?.phone}</div>
                  <div><strong>Status:</strong> <span style={{ color: '#2E7D32', fontWeight: '800' }}>{user?.status}</span></div>
                  <div><strong>Permissions:</strong> {permissions?.join(', ')}</div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: EXPORT SUPPLY REQUEST DETAILS */}
      {/* ========================================================================= */}
      {showSupplyDetailModal && selectedSupply && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '20px', width: '100%', maxWidth: '640px', maxHeight: '90vh', overflowY: 'auto', padding: '1.75rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '900', color: '#1B4D2E', margin: 0 }}>
                  Supply Offer Details (#ES-{selectedSupply.id})
                </h3>
                <span style={{ fontSize: '0.8rem', color: '#718096' }}>
                  Submitted on: {selectedSupply.request_date || selectedSupply.created_at?.split('T')[0]}
                </span>
              </div>
              <button onClick={() => setShowSupplyDetailModal(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#718096' }}><X size={20} /></button>
            </div>

            {/* FEEDBACK NOTIFICATION BANNER */}
            {message.text && (
              <div style={{
                backgroundColor: message.type === 'error' ? '#FFEBEE' : '#E8F5E9',
                color: message.type === 'error' ? '#C62828' : '#1B5E20',
                border: `1px solid ${message.type === 'error' ? '#EF9A9A' : '#A5D6A7'}`,
                padding: '0.65rem 1rem', borderRadius: '10px', fontSize: '0.85rem', fontWeight: '800',
                marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem'
              }}>
                {message.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
                {message.text}
              </div>
            )}

            {/* WORKFLOW TRACKER */}
            {(() => {
              const steps = [
                { key: 'PENDING', label: '1. PENDING' },
                { key: 'ACCEPTED', label: '2. ACCEPTED' },
                { key: 'PAYMENT_PENDING', label: '3. PAYMENT PENDING' },
                { key: 'PAID', label: '4. PAID' },
                { key: 'READY_FOR_PICKUP', label: '5. READY FOR PICKUP' },
                { key: 'PICKUP_CONFIRMED', label: '6. PICKUP CONFIRMED' },
                { key: 'COMPLETED', label: '7. COMPLETED' },
              ];

              if (selectedSupply.status === 'REJECTED' || selectedSupply.status === 'CANCELLED') {
                const isCancelled = selectedSupply.status === 'CANCELLED';
                const reason = selectedSupply.rejection_reason || (isCancelled ? selectedSupply.notes : null);
                return (
                  <div style={{ backgroundColor: isCancelled ? '#F8FAFC' : '#FEF2F2', borderRadius: '12px', padding: '0.85rem 1rem', border: `1px solid ${isCancelled ? '#CBD5E1' : '#FECACA'}`, marginBottom: '1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: '900', color: isCancelled ? '#475569' : '#DC2626', backgroundColor: isCancelled ? '#E2E8F0' : '#FEE2E2', padding: '0.2rem 0.6rem', borderRadius: '999px', border: `1px solid ${isCancelled ? '#94A3B8' : '#F87171'}` }}>
                        {selectedSupply.status}
                      </span>
                      <span style={{ fontSize: '0.85rem', fontWeight: '800', color: isCancelled ? '#334155' : '#991B1B' }}>
                        {isCancelled ? 'Request Cancelled by Trader' : 'Request Rejected'}
                      </span>
                    </div>
                    {reason && (
                      <div style={{ fontSize: '0.82rem', color: isCancelled ? '#475569' : '#B91C1C', marginTop: '0.35rem', backgroundColor: '#FFFFFF', padding: '0.5rem 0.75rem', borderRadius: '8px', border: `1px dashed ${isCancelled ? '#CBD5E1' : '#FCA5A5'}` }}>
                        <strong>Reason:</strong> {reason}
                      </div>
                    )}
                  </div>
                );
              }

              const getStepIndex = (st) => {
                switch (st) {
                  case 'PENDING': return 0;
                  case 'ACCEPTED': return 1;
                  case 'PAYMENT_PENDING': return 2;
                  case 'PAID': return 3;
                  case 'READY_FOR_PICKUP':
                  case 'READY_FOR_RECEIPT': return 4;
                  case 'PICKUP_CONFIRMED':
                  case 'RECEIVED': return 5;
                  case 'COMPLETED': return 6;
                  default: return 0;
                }
              };

              const curIdx = getStepIndex(selectedSupply.status);

              return (
                <div style={{ marginBottom: '1.25rem', backgroundColor: '#F8FAF8', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid #E5EBE5' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: '900', color: '#2E7D32', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      SUPPLY & PURCHASE WORKFLOW STATUS
                    </div>
                    <span style={{
                      fontSize: '0.72rem',
                      fontWeight: '900',
                      padding: '0.15rem 0.55rem',
                      borderRadius: '999px',
                      backgroundColor: selectedSupply.status === 'COMPLETED' ? '#E8F5E9' : (selectedSupply.status === 'PENDING' ? '#FEF3C7' : '#E0F2FE'),
                      color: selectedSupply.status === 'COMPLETED' ? '#2E7D32' : (selectedSupply.status === 'PENDING' ? '#92400E' : '#0284C7'),
                      border: `1px solid ${selectedSupply.status === 'COMPLETED' ? '#A5D6A7' : (selectedSupply.status === 'PENDING' ? '#FDE68A' : '#BAE6FD')}`
                    }}>
                      Current: {selectedSupply.status}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.35rem' }}>
                    {steps.map((step, idx) => {
                      const isDone = idx < curIdx || (selectedSupply.status === 'COMPLETED' && idx === 6);
                      const isCurrent = idx === curIdx && selectedSupply.status !== 'COMPLETED';

                      let bg = '#F1F5F9';
                      let fg = '#94A3B8';
                      let border = '#E2E8F0';

                      if (isDone) {
                        bg = '#E8F5E9';
                        fg = '#2E7D32';
                        border = '#A5D6A7';
                      } else if (isCurrent) {
                        bg = '#FEF3C7';
                        fg = '#92400E';
                        border = '#F59E0B';
                      }

                      return (
                        <React.Fragment key={step.key}>
                          <span
                            style={{
                              fontSize: '0.68rem',
                              fontWeight: isCurrent ? '900' : '700',
                              padding: '0.2rem 0.55rem',
                              borderRadius: '6px',
                              backgroundColor: bg,
                              color: fg,
                              border: `1px solid ${border}`,
                              display: 'inline-flex',
                              alignItems: 'center',
                              boxShadow: isCurrent ? '0 0 0 2px rgba(245, 158, 11, 0.25)' : 'none'
                            }}
                          >
                            {isDone ? '✓ ' : isCurrent ? '● ' : ''}{step.label}
                          </span>
                          {idx < steps.length - 1 && (
                            <span style={{ fontSize: '0.72rem', color: isDone ? '#2E7D32' : (isCurrent ? '#D97706' : '#CBD5E1'), fontWeight: 'bold' }}>
                              ↓
                            </span>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* SECTION 1: TRADER DETAILS */}
            <div style={{ backgroundColor: '#F8FAF8', borderRadius: '12px', padding: '1rem', border: '1px solid #E5EBE5', fontSize: '0.85rem', lineHeight: 1.8, marginBottom: '1rem' }}>
              <div style={{ fontWeight: '900', color: '#2E7D32', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Building2 size={16} /> TRADER DETAILS
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.35rem' }}>
                <div><strong>Trader Name:</strong> {selectedSupply.trader_name}</div>
                <div><strong>Business Name:</strong> {selectedSupply.trader_business_name || 'N/A'}</div>
                <div><strong>Business Email:</strong> {selectedSupply.trader_email}</div>
                <div><strong>Business Phone:</strong> {selectedSupply.trader_phone}</div>
                <div><strong>Location:</strong> {selectedSupply.trader_location || 'Kattappana, Idukki, Kerala'}</div>
              </div>
            </div>

            {/* SECTION 2: CARDAMOM DETAILS */}
            <div style={{ backgroundColor: '#F8FAF8', borderRadius: '12px', padding: '1rem', border: '1px solid #E5EBE5', fontSize: '0.85rem', lineHeight: 1.8, marginBottom: '1rem' }}>
              <div style={{ fontWeight: '900', color: '#2E7D32', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Sprout size={16} /> CARDAMOM DETAILS
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.35rem' }}>
                <div><strong>Variety:</strong> {selectedSupply.variety}</div>
                <div><strong>Grade:</strong> {selectedSupply.grade}</div>
                <div><strong>Quantity Offered:</strong> <strong style={{ color: '#2E7D32' }}>{selectedSupply.quantity_kg} KG</strong></div>
                <div><strong>Price per KG:</strong> ₹{parseFloat(selectedSupply.price_per_kg || 0).toLocaleString('en-IN')}</div>
                <div><strong>Total Amount:</strong> <strong style={{ color: '#059669', fontSize: '0.95rem' }}>₹{parseFloat(selectedSupply.total_amount || 0).toLocaleString('en-IN')}</strong></div>
                <div><strong>Batch / Lot Ref:</strong> <code>{selectedSupply.batch_code || `TR-INV-${selectedSupply.id}`}</code></div>
                <div><strong>Expected Supply Date:</strong> {selectedSupply.expected_supply_date || 'Immediate'}</div>
                <div><strong>Account Status:</strong> <span style={{ color: '#2E7D32', fontWeight: '800' }}>Active & Verified</span></div>
              </div>
              {selectedSupply.notes && (
                <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px dashed #CBD5E1', fontSize: '0.82rem' }}>
                  <strong>Trader Notes:</strong> {selectedSupply.notes}
                </div>
              )}
            </div>

            {/* SECTION 3: PAYMENT DETAILS */}
            <div style={{ backgroundColor: '#F8FAF8', borderRadius: '12px', padding: '1rem', border: '1px solid #E5EBE5', fontSize: '0.85rem', lineHeight: 1.8, marginBottom: '1.25rem' }}>
              <div style={{ fontWeight: '900', color: '#2E7D32', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <CreditCard size={16} /> PAYMENT DETAILS
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.35rem' }}>
                <div><strong>Payment Preference:</strong> {selectedSupply.payment_method === 'ONLINE' ? 'Online Payment (Razorpay / UPI / Card)' : 'Direct Payment (Bank Wire / NEFT / Cash)'}</div>
                <div>
                  <strong>Payment Status:</strong>{' '}
                  <span style={{
                    backgroundColor: selectedSupply.payment_status === 'PAID' ? '#E8F5E9' : '#FEF3C7',
                    color: selectedSupply.payment_status === 'PAID' ? '#2E7D32' : '#92400E',
                    padding: '0.15rem 0.55rem', borderRadius: '999px', fontSize: '0.72rem', fontWeight: '800'
                  }}>
                    {selectedSupply.payment_status || 'PENDING'}
                  </span>
                </div>
                <div><strong>Payment Reference:</strong> <code>{selectedSupply.payment_reference || 'Pending settlement'}</code></div>
              </div>
            </div>

            {/* ACTION BUTTONS */}
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'flex-end', alignItems: 'center' }}>
              {selectedSupply.status === 'PENDING' && (
                <>
                  <button onClick={() => handleSupplyAction(selectedSupply.id, 'REJECT')} style={{ backgroundColor: '#FFEBEE', color: '#C62828', border: '1px solid #FFCDD2', padding: '0.55rem 1.15rem', borderRadius: '10px', fontWeight: '800', fontSize: '0.85rem', cursor: 'pointer' }}>
                    [ Reject Request ]
                  </button>
                  <button onClick={() => handleSupplyAction(selectedSupply.id, 'ACCEPT')} style={{ backgroundColor: '#43A047', color: '#FFFFFF', border: 'none', padding: '0.55rem 1.25rem', borderRadius: '10px', fontWeight: '900', fontSize: '0.85rem', cursor: 'pointer' }}>
                    [ Accept Request ]
                  </button>
                </>
              )}

              {selectedSupply.status === 'ACCEPTED' && (
                <>
                  <button onClick={() => handleSupplyAction(selectedSupply.id, 'PAY', { payment_method: 'DIRECT', payment_reference: 'DIRECT_PAYMENT_PENDING' })} style={{ backgroundColor: '#FEF3C7', color: '#92400E', border: '1px solid #FDE68A', padding: '0.55rem 1.15rem', borderRadius: '10px', fontWeight: '800', fontSize: '0.85rem', cursor: 'pointer' }}>
                    [ Pay Directly (Bank Wire / NEFT) ]
                  </button>
                  <button onClick={() => handleExporterOnlinePayment(selectedSupply)} style={{ backgroundColor: '#0284C7', color: '#FFFFFF', border: 'none', padding: '0.55rem 1.25rem', borderRadius: '10px', fontWeight: '900', fontSize: '0.85rem', cursor: 'pointer' }}>
                    [ Pay Online (Razorpay) ]
                  </button>
                </>
              )}

              {selectedSupply.status === 'PAYMENT_PENDING' && (
                <button onClick={() => handleSupplyAction(selectedSupply.id, 'CONFIRM_DIRECT_PAYMENT')} style={{ backgroundColor: '#FEF3C7', color: '#92400E', border: '1px solid #FDE68A', padding: '0.55rem 1.15rem', borderRadius: '10px', fontWeight: '800', fontSize: '0.85rem', cursor: 'pointer' }}>
                  ✓ Confirm Direct Payment Received
                </button>
              )}

              {['ACCEPTED', 'PAYMENT_PENDING', 'PAID', 'READY_FOR_PICKUP', 'READY_FOR_RECEIPT', 'PICKUP_CONFIRMED', 'RECEIVED'].includes(selectedSupply.status) && selectedSupply.status !== 'COMPLETED' && (
                <button onClick={() => handleSupplyAction(selectedSupply.id, 'MARK_RECEIVED')} style={{ backgroundColor: '#16A34A', color: '#FFFFFF', border: 'none', padding: '0.55rem 1.25rem', borderRadius: '10px', fontWeight: '900', fontSize: '0.85rem', cursor: 'pointer' }}>
                  ✓ Confirm Pickup & Mark Received (Complete)
                </button>
              )}

              <button onClick={() => setShowSupplyDetailModal(false)} style={{ backgroundColor: '#F1F5F9', color: '#475569', border: 'none', padding: '0.55rem 1rem', borderRadius: '10px', fontWeight: '800', fontSize: '0.85rem', cursor: 'pointer' }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD INVENTORY */}
      {showAddInventoryModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '20px', width: '100%', maxWidth: '500px', padding: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '900', color: '#1B4D2E', margin: 0 }}>Add Exporter Inventory</h3>
              <button onClick={() => setShowAddInventoryModal(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#718096' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleAddInventorySubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: '800', color: '#2D3748', display: 'block', marginBottom: '0.35rem' }}>Variety *</label>
                <input type="text" required placeholder="e.g. Njallani Green Gold" value={inventoryForm.variety} onChange={e => setInventoryForm({ ...inventoryForm, variety: e.target.value })} style={{ width: '100%', padding: '0.6rem', borderRadius: '10px', border: '1px solid #CBD5E1' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: '800', color: '#2D3748', display: 'block', marginBottom: '0.35rem' }}>Grade *</label>
                <input type="text" required placeholder="e.g. AGEB 8mm" value={inventoryForm.grade} onChange={e => setInventoryForm({ ...inventoryForm, grade: e.target.value })} style={{ width: '100%', padding: '0.6rem', borderRadius: '10px', border: '1px solid #CBD5E1' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: '800', color: '#2D3748', display: 'block', marginBottom: '0.35rem' }}>Quantity (KG) *</label>
                <input type="number" step="0.01" min="0.01" required placeholder="e.g. 500" value={inventoryForm.quantity_kg} onChange={e => setInventoryForm({ ...inventoryForm, quantity_kg: e.target.value })} style={{ width: '100%', padding: '0.6rem', borderRadius: '10px', border: '1px solid #CBD5E1' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: '800', color: '#2D3748', display: 'block', marginBottom: '0.35rem' }}>Purchase Price per KG (₹)</label>
                <input type="number" step="0.01" min="0" placeholder="e.g. 2100" value={inventoryForm.purchase_price_per_kg} onChange={e => setInventoryForm({ ...inventoryForm, purchase_price_per_kg: e.target.value })} style={{ width: '100%', padding: '0.6rem', borderRadius: '10px', border: '1px solid #CBD5E1' }} />
              </div>
              <button type="submit" style={{ backgroundColor: '#43A047', color: '#FFF', border: 'none', padding: '0.75rem', borderRadius: '10px', fontWeight: '900', cursor: 'pointer', marginTop: '0.5rem' }}>
                Save Exporter Inventory
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: ADD INTERNATIONAL BUYER */}
      {showAddBuyerModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 120, padding: '1rem' }}>
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '20px', width: '100%', maxWidth: '540px', padding: '1.75rem', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Users size={20} color="#2E7D32" />
                <h3 style={{ fontSize: '1.2rem', fontWeight: '900', color: '#1B4D2E', margin: 0 }}>Add International Buyer</h3>
              </div>
              <button onClick={() => setShowAddBuyerModal(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#718096' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleAddBuyerSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: '800', color: '#2D3748', display: 'block', marginBottom: '0.35rem' }}>Buyer Name *</label>
                <input type="text" required placeholder="e.g. Tariq Al-Mansoor" value={buyerForm.name} onChange={e => setBuyerForm({ ...buyerForm, name: e.target.value })} style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '10px', border: '1px solid #CBD5E1', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: '800', color: '#2D3748', display: 'block', marginBottom: '0.35rem' }}>Company Name *</label>
                <input type="text" required placeholder="e.g. Gulf Spices Trading LLC" value={buyerForm.company_name} onChange={e => setBuyerForm({ ...buyerForm, company_name: e.target.value })} style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '10px', border: '1px solid #CBD5E1', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: '800', color: '#2D3748', display: 'block', marginBottom: '0.35rem' }}>Country *</label>
                <input type="text" required placeholder="e.g. United Arab Emirates" value={buyerForm.country} onChange={e => setBuyerForm({ ...buyerForm, country: e.target.value })} style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '10px', border: '1px solid #CBD5E1', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: '800', color: '#2D3748', display: 'block', marginBottom: '0.35rem' }}>Email Address *</label>
                <input type="email" required placeholder="e.g. tariq@gulfspices.ae" value={buyerForm.email} onChange={e => setBuyerForm({ ...buyerForm, email: e.target.value })} style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '10px', border: '1px solid #CBD5E1', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: '800', color: '#2D3748', display: 'block', marginBottom: '0.35rem' }}>Phone Number</label>
                <input type="text" placeholder="e.g. +971 50 123 4567" value={buyerForm.phone} onChange={e => setBuyerForm({ ...buyerForm, phone: e.target.value })} style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '10px', border: '1px solid #CBD5E1', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: '800', color: '#2D3748', display: 'block', marginBottom: '0.35rem' }}>Address</label>
                <textarea rows="2" placeholder="e.g. Deira Spice Souk, Dubai, UAE" value={buyerForm.address} onChange={e => setBuyerForm({ ...buyerForm, address: e.target.value })} style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '10px', border: '1px solid #CBD5E1', boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setShowAddBuyerModal(false)} style={{ backgroundColor: '#F8FAFC', color: '#475569', border: '1px solid #CBD5E1', padding: '0.65rem 1.15rem', borderRadius: '10px', fontWeight: '800', cursor: 'pointer' }}>
                  Cancel
                </button>
                <button type="submit" style={{ backgroundColor: '#2E7D32', color: '#FFF', border: 'none', padding: '0.65rem 1.35rem', borderRadius: '10px', fontWeight: '900', cursor: 'pointer' }}>
                  Save Buyer Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: CREATE EXPORT ORDER */}
      {showCreateOrderModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
          <style>{`
            .order-modal-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 1rem;
            }
            @media (max-width: 640px) {
              .order-modal-grid {
                grid-template-columns: 1fr;
                gap: 0.85rem;
              }
            }
          `}</style>
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '20px', width: '100%', maxWidth: '720px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
            {/* Modal Header */}
            <div style={{ padding: '1.25rem 1.75rem', borderBottom: '1px solid #E5EBE5', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFFFFF', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#E8F5E9', color: '#2E7D32', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Box size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: '900', color: '#1B4D2E', margin: 0 }}>Create Export Order</h3>
                  <p style={{ fontSize: '0.78rem', color: '#718096', margin: '0.15rem 0 0' }}>Assign international buyer, allocate stock &amp; set shipment details</p>
                </div>
              </div>
              <button onClick={() => setShowCreateOrderModal(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#718096', padding: '0.35rem', borderRadius: '8px' }} title="Close modal">
                <X size={20} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateOrderSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, margin: 0 }}>
              {/* Scrollable Form Body */}
              <div style={{ padding: '1.5rem 1.75rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '1.4rem' }}>
                
                {/* 1. INTERNATIONAL BUYER SECTION */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.85rem', paddingBottom: '0.4rem', borderBottom: '1px solid #E2E8F0' }}>
                    <Users size={18} color="#2E7D32" />
                    <h4 style={{ fontSize: '0.95rem', fontWeight: '800', color: '#1B4D2E', margin: 0, textTransform: 'uppercase', letterSpacing: '0.03em' }}>International Buyer</h4>
                  </div>

                  {/* Row 1: Select Existing Buyer + Add New Buyer */}
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: '800', color: '#2D3748', display: 'block', marginBottom: '0.4rem' }}>
                      Select Existing Buyer
                    </label>
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', width: '100%' }}>
                      <select
                        id="order-buyer-select"
                        value={orderForm.buyer_id}
                        onChange={e => {
                          const bId = e.target.value;
                          const b = buyers.find(x => String(x.id) === String(bId));
                          if (b) {
                            setOrderForm(prev => ({
                              ...prev,
                              buyer_id: String(b.id),
                              buyer_name: b.name || '',
                              company_name: b.company_name || '',
                              email: b.email || '',
                              phone: b.phone || '',
                              address: b.address || '',
                              destination_country: b.country || prev.destination_country || ''
                            }));
                          } else {
                            setOrderForm(prev => ({
                              ...prev,
                              buyer_id: ''
                            }));
                          }
                          if (orderFormErrors.buyer_name) setOrderFormErrors(prev => ({ ...prev, buyer_name: '' }));
                        }}
                        style={{
                          flex: 1,
                          minWidth: 0,
                          padding: '0.65rem 0.85rem',
                          borderRadius: '10px',
                          border: '1px solid #CBD5E1',
                          fontSize: '0.875rem',
                          backgroundColor: '#FFFFFF',
                          color: '#1A202C',
                          outline: 'none',
                          boxSizing: 'border-box'
                        }}
                      >
                        <option value="">-- Manual Buyer Input / Select Saved Buyer --</option>
                        {buyers.map(b => (
                          <option key={b.id} value={b.id}>
                            {b.name} ({b.company_name ? `${b.company_name} - ` : ''}{b.country})
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        id="btn-add-new-buyer"
                        onClick={() => setShowAddBuyerModal(true)}
                        style={{
                          flexShrink: 0,
                          backgroundColor: '#E8F5E9',
                          color: '#2E7D32',
                          border: '1.5px solid #A5D6A7',
                          padding: '0.65rem 1rem',
                          borderRadius: '10px',
                          fontWeight: '800',
                          fontSize: '0.85rem',
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          boxSizing: 'border-box'
                        }}
                      >
                        <Plus size={16} /> + Add New Buyer
                      </button>
                    </div>
                  </div>

                  {/* Row 2: Buyer Name * & Company Name */}
                  <div className="order-modal-grid" style={{ marginBottom: '1rem' }}>
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: '800', color: '#2D3748', display: 'block', marginBottom: '0.4rem' }}>
                        Buyer Name *
                      </label>
                      <input
                        type="text"
                        id="order-buyer-name"
                        required
                        placeholder="e.g. Tariq Al-Mansoor"
                        value={orderForm.buyer_name}
                        onChange={e => {
                          setOrderForm({ ...orderForm, buyer_name: e.target.value });
                          if (orderFormErrors.buyer_name) setOrderFormErrors(prev => ({ ...prev, buyer_name: '' }));
                        }}
                        style={{
                          width: '100%',
                          padding: '0.65rem 0.85rem',
                          borderRadius: '10px',
                          border: orderFormErrors.buyer_name ? '1.5px solid #EF4444' : '1px solid #CBD5E1',
                          fontSize: '0.875rem',
                          boxSizing: 'border-box'
                        }}
                      />
                      {orderFormErrors.buyer_name && (
                        <span style={{ fontSize: '0.75rem', color: '#EF4444', marginTop: '0.25rem', display: 'block' }}>
                          {orderFormErrors.buyer_name}
                        </span>
                      )}
                    </div>

                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: '800', color: '#2D3748', display: 'block', marginBottom: '0.4rem' }}>
                        Company Name
                      </label>
                      <input
                        type="text"
                        id="order-buyer-company"
                        placeholder="e.g. Gulf Spices Trading LLC"
                        value={orderForm.company_name}
                        onChange={e => setOrderForm({ ...orderForm, company_name: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '0.65rem 0.85rem',
                          borderRadius: '10px',
                          border: '1px solid #CBD5E1',
                          fontSize: '0.875rem',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                  </div>

                  {/* Row 3: Buyer Email & Buyer Phone */}
                  <div className="order-modal-grid" style={{ marginBottom: '1rem' }}>
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: '800', color: '#2D3748', display: 'block', marginBottom: '0.4rem' }}>
                        Buyer Email
                      </label>
                      <input
                        type="email"
                        id="order-buyer-email"
                        placeholder="e.g. tariq@gulfspices.ae"
                        value={orderForm.email}
                        onChange={e => setOrderForm({ ...orderForm, email: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '0.65rem 0.85rem',
                          borderRadius: '10px',
                          border: '1px solid #CBD5E1',
                          fontSize: '0.875rem',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: '800', color: '#2D3748', display: 'block', marginBottom: '0.4rem' }}>
                        Buyer Phone
                      </label>
                      <input
                        type="text"
                        id="order-buyer-phone"
                        placeholder="e.g. +971 50 123 4567"
                        value={orderForm.phone}
                        onChange={e => setOrderForm({ ...orderForm, phone: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '0.65rem 0.85rem',
                          borderRadius: '10px',
                          border: '1px solid #CBD5E1',
                          fontSize: '0.875rem',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                  </div>

                  {/* Row 4: Buyer Address */}
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: '800', color: '#2D3748', display: 'block', marginBottom: '0.4rem' }}>
                      Buyer Address
                    </label>
                    <input
                      type="text"
                      id="order-buyer-address"
                      placeholder="e.g. Deira Spice Souk, PO Box 4521, Dubai, UAE"
                      value={orderForm.address}
                      onChange={e => setOrderForm({ ...orderForm, address: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.65rem 0.85rem',
                        borderRadius: '10px',
                        border: '1px solid #CBD5E1',
                        fontSize: '0.875rem',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>

                {/* 2. EXPORT PRODUCT & INVENTORY SECTION */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.85rem', paddingBottom: '0.4rem', borderBottom: '1px solid #E2E8F0' }}>
                    <Package size={18} color="#2E7D32" />
                    <h4 style={{ fontSize: '0.95rem', fontWeight: '800', color: '#1B4D2E', margin: 0, textTransform: 'uppercase', letterSpacing: '0.03em' }}>Export Product &amp; Inventory</h4>
                  </div>

                  {/* No inventory notice */}
                  {availableInventory.length === 0 && (
                    <div style={{ backgroundColor: '#FEF3C7', border: '1px solid #FCD34D', borderRadius: '10px', padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#92400E', fontSize: '0.825rem', marginBottom: '1rem' }}>
                      <AlertCircle size={18} color="#B45309" style={{ flexShrink: 0 }} />
                      <span>No available stock. Receive cardamom through Incoming Supply Requests before creating an export order.</span>
                    </div>
                  )}

                  {/* Row 1: Select Stock & Variety */}
                  <div className="order-modal-grid" style={{ marginBottom: '1rem' }}>
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: '800', color: '#2D3748', display: 'block', marginBottom: '0.4rem' }}>
                        Select Stock from Exporter Inventory
                      </label>
                      <select
                        id="order-inventory-select"
                        value={orderForm.inventory_item_id}
                        onChange={e => {
                          const invId = e.target.value;
                          const inv = inventory.find(x => String(x.id) === String(invId));
                          if (inv) {
                            setOrderForm(prev => ({
                              ...prev,
                              inventory_item_id: String(inv.id),
                              variety: inv.variety || '',
                              grade: inv.grade || 'AGEB 8mm'
                            }));
                          } else {
                            setOrderForm(prev => ({
                              ...prev,
                              inventory_item_id: ''
                            }));
                          }
                          if (orderFormErrors.variety) setOrderFormErrors(prev => ({ ...prev, variety: '' }));
                          if (orderFormErrors.quantity_kg) setOrderFormErrors(prev => ({ ...prev, quantity_kg: '' }));
                        }}
                        style={{
                          width: '100%',
                          padding: '0.65rem 0.85rem',
                          borderRadius: '10px',
                          border: '1px solid #CBD5E1',
                          fontSize: '0.875rem',
                          backgroundColor: '#FFFFFF',
                          color: '#1A202C',
                          outline: 'none',
                          boxSizing: 'border-box'
                        }}
                      >
                        <option value="">-- Manual Stock Entry --</option>
                        {availableInventory.map(i => (
                          <option key={i.id} value={i.id}>
                            {i.variety} ({i.grade}) - {parseFloat(i.quantity_kg).toLocaleString()} KG [Batch: {i.batch_code || 'N/A'}]
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: '800', color: '#2D3748', display: 'block', marginBottom: '0.4rem' }}>
                        Cardamom Variety *
                      </label>
                      <input
                        type="text"
                        id="order-variety"
                        required
                        placeholder="e.g. Malabar, Mysore, Vazhukka"
                        value={orderForm.variety}
                        onChange={e => {
                          setOrderForm({ ...orderForm, variety: e.target.value });
                          if (orderFormErrors.variety) setOrderFormErrors(prev => ({ ...prev, variety: '' }));
                        }}
                        readOnly={Boolean(orderForm.inventory_item_id)}
                        style={{
                          width: '100%',
                          padding: '0.65rem 0.85rem',
                          borderRadius: '10px',
                          border: orderFormErrors.variety ? '1.5px solid #EF4444' : '1px solid #CBD5E1',
                          fontSize: '0.875rem',
                          backgroundColor: orderForm.inventory_item_id ? '#F8FAFC' : '#FFFFFF',
                          color: orderForm.inventory_item_id ? '#475569' : '#1A202C',
                          boxSizing: 'border-box'
                        }}
                      />
                      {orderFormErrors.variety && (
                        <span style={{ fontSize: '0.75rem', color: '#EF4444', marginTop: '0.25rem', display: 'block' }}>
                          {orderFormErrors.variety}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Row 2: Grade & Available Quantity */}
                  <div className="order-modal-grid" style={{ marginBottom: '1rem' }}>
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: '800', color: '#2D3748', display: 'block', marginBottom: '0.4rem' }}>
                        Grade
                      </label>
                      {orderForm.inventory_item_id ? (
                        <input
                          type="text"
                          id="order-grade-readonly"
                          readOnly
                          value={orderForm.grade || 'AGEB 8mm'}
                          style={{
                            width: '100%',
                            padding: '0.65rem 0.85rem',
                            borderRadius: '10px',
                            border: '1px solid #CBD5E1',
                            fontSize: '0.875rem',
                            backgroundColor: '#F8FAFC',
                            color: '#475569',
                            boxSizing: 'border-box'
                          }}
                        />
                      ) : (
                        <select
                          id="order-grade-select"
                          value={orderForm.grade}
                          onChange={e => setOrderForm({ ...orderForm, grade: e.target.value })}
                          style={{
                            width: '100%',
                            padding: '0.65rem 0.85rem',
                            borderRadius: '10px',
                            border: '1px solid #CBD5E1',
                            fontSize: '0.875rem',
                            backgroundColor: '#FFFFFF',
                            color: '#1A202C',
                            outline: 'none',
                            boxSizing: 'border-box'
                          }}
                        >
                          <option value="AGEB 8mm">AGEB (Extra Bold &gt; 8mm)</option>
                          <option value="AGB 7-8mm">AGB (Bold 7-8mm)</option>
                          <option value="AGS 6-7mm">AGS (Superior 6-7mm)</option>
                          <option value="AGS Special">AGS Special</option>
                          <option value="Split / Bulk">Split / Bulk</option>
                        </select>
                      )}
                    </div>

                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: '800', color: '#2D3748', display: 'block', marginBottom: '0.4rem' }}>
                        Available Quantity (KG)
                      </label>
                      <div style={{
                        width: '100%',
                        padding: '0.65rem 0.85rem',
                        borderRadius: '10px',
                        border: '1px solid #CBD5E1',
                        fontSize: '0.875rem',
                        backgroundColor: '#F8FAFC',
                        color: selectedInventory ? '#2E7D32' : '#64748B',
                        fontWeight: selectedInventory ? '800' : '500',
                        boxSizing: 'border-box',
                        minHeight: '38px',
                        display: 'flex',
                        alignItems: 'center'
                      }}>
                        {selectedInventory ? `${parseFloat(selectedInventory.quantity_kg).toLocaleString()} KG available` : 'Manual Stock Mode'}
                      </div>
                    </div>
                  </div>

                  {/* Row 3: Export Quantity (KG) * & Price per KG (USD) * */}
                  <div className="order-modal-grid">
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: '800', color: '#2D3748', display: 'block', marginBottom: '0.4rem' }}>
                        Export Quantity (KG) *
                      </label>
                      <input
                        type="number"
                        id="order-quantity"
                        step="0.01"
                        min="0.01"
                        required
                        placeholder="e.g. 300"
                        value={orderForm.quantity_kg}
                        onChange={e => {
                          setOrderForm({ ...orderForm, quantity_kg: e.target.value });
                          if (orderFormErrors.quantity_kg) setOrderFormErrors(prev => ({ ...prev, quantity_kg: '' }));
                        }}
                        style={{
                          width: '100%',
                          padding: '0.65rem 0.85rem',
                          borderRadius: '10px',
                          border: orderFormErrors.quantity_kg || (selectedInventory && parseFloat(orderForm.quantity_kg) > parseFloat(selectedInventory.quantity_kg)) ? '1.5px solid #EF4444' : '1px solid #CBD5E1',
                          fontSize: '0.875rem',
                          boxSizing: 'border-box'
                        }}
                      />
                      {orderFormErrors.quantity_kg ? (
                        <span style={{ fontSize: '0.75rem', color: '#EF4444', marginTop: '0.25rem', display: 'block' }}>
                          {orderFormErrors.quantity_kg}
                        </span>
                      ) : selectedInventory && parseFloat(orderForm.quantity_kg) > parseFloat(selectedInventory.quantity_kg) ? (
                        <span style={{ fontSize: '0.75rem', color: '#EF4444', marginTop: '0.25rem', display: 'block' }}>
                          Exceeds available stock ({parseFloat(selectedInventory.quantity_kg).toLocaleString()} KG)
                        </span>
                      ) : null}
                    </div>

                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: '800', color: '#2D3748', display: 'block', marginBottom: '0.4rem' }}>
                        Price per KG (USD) *
                      </label>
                      <input
                        type="number"
                        id="order-price"
                        step="0.01"
                        min="0.01"
                        required
                        placeholder="e.g. 32.50"
                        value={orderForm.price_per_kg}
                        onChange={e => {
                          setOrderForm({ ...orderForm, price_per_kg: e.target.value });
                          if (orderFormErrors.price_per_kg) setOrderFormErrors(prev => ({ ...prev, price_per_kg: '' }));
                        }}
                        style={{
                          width: '100%',
                          padding: '0.65rem 0.85rem',
                          borderRadius: '10px',
                          border: orderFormErrors.price_per_kg ? '1.5px solid #EF4444' : '1px solid #CBD5E1',
                          fontSize: '0.875rem',
                          boxSizing: 'border-box'
                        }}
                      />
                      {orderFormErrors.price_per_kg && (
                        <span style={{ fontSize: '0.75rem', color: '#EF4444', marginTop: '0.25rem', display: 'block' }}>
                          {orderFormErrors.price_per_kg}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* 3. DESTINATION & SHIPMENT DETAILS */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.85rem', paddingBottom: '0.4rem', borderBottom: '1px solid #E2E8F0' }}>
                    <Globe size={18} color="#2E7D32" />
                    <h4 style={{ fontSize: '0.95rem', fontWeight: '800', color: '#1B4D2E', margin: 0, textTransform: 'uppercase', letterSpacing: '0.03em' }}>Destination &amp; Shipment Details</h4>
                  </div>

                  {/* Row 1: Destination Country * & Destination Port */}
                  <div className="order-modal-grid" style={{ marginBottom: '1rem' }}>
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: '800', color: '#2D3748', display: 'block', marginBottom: '0.4rem' }}>
                        Destination Country *
                      </label>
                      <input
                        type="text"
                        id="order-destination-country"
                        required
                        placeholder="e.g. United Arab Emirates, Saudi Arabia"
                        value={orderForm.destination_country}
                        onChange={e => {
                          setOrderForm({ ...orderForm, destination_country: e.target.value });
                          if (orderFormErrors.destination_country) setOrderFormErrors(prev => ({ ...prev, destination_country: '' }));
                        }}
                        style={{
                          width: '100%',
                          padding: '0.65rem 0.85rem',
                          borderRadius: '10px',
                          border: orderFormErrors.destination_country ? '1.5px solid #EF4444' : '1px solid #CBD5E1',
                          fontSize: '0.875rem',
                          boxSizing: 'border-box'
                        }}
                      />
                      {orderFormErrors.destination_country && (
                        <span style={{ fontSize: '0.75rem', color: '#EF4444', marginTop: '0.25rem', display: 'block' }}>
                          {orderFormErrors.destination_country}
                        </span>
                      )}
                    </div>

                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: '800', color: '#2D3748', display: 'block', marginBottom: '0.4rem' }}>
                        Destination Port
                      </label>
                      <input
                        type="text"
                        id="order-destination-port"
                        placeholder="e.g. Jebel Ali Port, Dubai"
                        value={orderForm.destination_port}
                        onChange={e => setOrderForm({ ...orderForm, destination_port: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '0.65rem 0.85rem',
                          borderRadius: '10px',
                          border: '1px solid #CBD5E1',
                          fontSize: '0.875rem',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                  </div>

                  {/* Row 2: Expected Shipment Date & Shipping Method */}
                  <div className="order-modal-grid">
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: '800', color: '#2D3748', display: 'block', marginBottom: '0.4rem' }}>
                        Expected Shipment Date
                      </label>
                      <input
                        type="date"
                        id="order-shipment-date"
                        min={new Date().toISOString().split('T')[0]}
                        value={orderForm.expected_shipment_date}
                        onChange={e => setOrderForm({ ...orderForm, expected_shipment_date: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '0.65rem 0.85rem',
                          borderRadius: '10px',
                          border: '1px solid #CBD5E1',
                          fontSize: '0.875rem',
                          backgroundColor: '#FFFFFF',
                          color: '#1A202C',
                          outline: 'none',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: '800', color: '#2D3748', display: 'block', marginBottom: '0.4rem' }}>
                        Shipping Method
                      </label>
                      <select
                        id="order-shipment-method"
                        value={orderForm.shipment_method}
                        onChange={e => setOrderForm({ ...orderForm, shipment_method: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '0.65rem 0.85rem',
                          borderRadius: '10px',
                          border: '1px solid #CBD5E1',
                          fontSize: '0.875rem',
                          backgroundColor: '#FFFFFF',
                          color: '#1A202C',
                          outline: 'none',
                          boxSizing: 'border-box'
                        }}
                      >
                        <option value="SEA">Sea Freight (Ocean Container)</option>
                        <option value="AIR">Air Cargo (Express)</option>
                        <option value="COURIER">Courier / Parcel Delivery</option>
                        <option value="LAND">Land Transport (Cross-Border)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* 4. FINANCIAL CALCULATION SUMMARY */}
                <div style={{
                  backgroundColor: '#F0FDF4',
                  borderRadius: '12px',
                  border: '1.5px solid #BBF7D0',
                  padding: '1rem 1.25rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem', flexWrap: 'wrap', gap: '0.35rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#166534', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Export Quantity × Price per KG = Total Export Value
                    </span>
                    <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#15803D' }}>Currency: USD ($)</span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem', alignItems: 'center' }}>
                    <div style={{ backgroundColor: '#FFFFFF', padding: '0.55rem 0.85rem', borderRadius: '8px', border: '1px solid #DCFCE7' }}>
                      <div style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: '700' }}>Export Quantity</div>
                      <div style={{ fontSize: '1rem', fontWeight: '900', color: '#1E293B', marginTop: '0.1rem' }}>
                        {parseFloat(orderForm.quantity_kg || 0) > 0 ? `${parseFloat(orderForm.quantity_kg).toLocaleString()} KG` : '0 KG'}
                      </div>
                    </div>

                    <div style={{ backgroundColor: '#FFFFFF', padding: '0.55rem 0.85rem', borderRadius: '8px', border: '1px solid #DCFCE7' }}>
                      <div style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: '700' }}>Price per KG</div>
                      <div style={{ fontSize: '1rem', fontWeight: '900', color: '#1E293B', marginTop: '0.1rem' }}>
                        {parseFloat(orderForm.price_per_kg || 0) > 0 ? `$${parseFloat(orderForm.price_per_kg).toFixed(2)} USD` : '$0.00 USD'}
                      </div>
                    </div>

                    <div style={{ backgroundColor: '#DCFCE7', padding: '0.55rem 0.85rem', borderRadius: '8px', border: '1px solid #86EFAC' }}>
                      <div style={{ fontSize: '0.7rem', color: '#166534', fontWeight: '800' }}>Total Export Value</div>
                      <div style={{ fontSize: '1.15rem', fontWeight: '900', color: '#14532D', marginTop: '0.1rem' }}>
                        ${((parseFloat(orderForm.quantity_kg || 0) * parseFloat(orderForm.price_per_kg || 0))).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* Fixed Modal Footer */}
              <div style={{
                padding: '1rem 1.75rem',
                borderTop: '1px solid #E5EBE5',
                display: 'flex',
                justifyContent: 'flex-end',
                alignItems: 'center',
                gap: '0.75rem',
                backgroundColor: '#F8FAFC',
                flexShrink: 0
              }}>
                <button
                  type="button"
                  onClick={() => setShowCreateOrderModal(false)}
                  style={{
                    backgroundColor: '#FFFFFF',
                    color: '#475569',
                    border: '1px solid #CBD5E1',
                    padding: '0.65rem 1.25rem',
                    borderRadius: '10px',
                    fontWeight: '800',
                    fontSize: '0.85rem',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="btn-submit-create-export-order"
                  disabled={submittingOrder || Boolean(selectedInventory && parseFloat(orderForm.quantity_kg) > parseFloat(selectedInventory.quantity_kg))}
                  style={{
                    backgroundColor: submittingOrder || (selectedInventory && parseFloat(orderForm.quantity_kg) > parseFloat(selectedInventory.quantity_kg)) ? '#A5D6A7' : '#2E7D32',
                    color: '#FFFFFF',
                    border: 'none',
                    padding: '0.65rem 1.5rem',
                    borderRadius: '10px',
                    fontWeight: '900',
                    fontSize: '0.85rem',
                    cursor: submittingOrder || (selectedInventory && parseFloat(orderForm.quantity_kg) > parseFloat(selectedInventory.quantity_kg)) ? 'not-allowed' : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    boxShadow: '0 4px 12px rgba(46, 125, 50, 0.25)',
                    transition: 'background-color 0.2s ease'
                  }}
                >
                  {submittingOrder ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      <span>Creating Export Order...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle size={16} />
                      <span>Create Export Order</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: QUALITY CHECK */}
      {showQualityModal && selectedOrder && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '20px', width: '100%', maxWidth: '500px', padding: '1.75rem', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: '900', color: '#1B4D2E', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Award size={20} color="#16A34A" /> Quality Check ({selectedOrder.order_code})
                </h3>
                <div style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '0.2rem' }}>
                  {selectedOrder.cardamom_variety} &bull; {selectedOrder.grade} &bull; {selectedOrder.quantity_kg} KG
                </div>
              </div>
              <button onClick={() => setShowQualityModal(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#718096', padding: '0.3rem' }}><X size={20} /></button>
            </div>

            {/* In-Modal Error Display */}
            {qualityModalError && (
              <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: '10px', padding: '0.75rem 1rem', marginBottom: '1rem', display: 'flex', alignItems: 'flex-start', gap: '0.6rem' }}>
                <AlertTriangle size={18} color="#DC2626" style={{ marginTop: '0.1rem', flexShrink: 0 }} />
                <div style={{ flex: 1, fontSize: '0.82rem', color: '#991B1B', fontWeight: '600', lineHeight: 1.4 }}>
                  {qualityModalError}
                </div>
                <button type="button" onClick={() => setQualityModalError('')} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#991B1B', fontWeight: 'bold' }}>&times;</button>
              </div>
            )}

            <form onSubmit={handleQualitySubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: '800', color: '#2D3748', display: 'block', marginBottom: '0.35rem' }}>Moisture Percentage (%)</label>
                <input type="number" step="0.1" value={qualityForm.moisture_percentage} onChange={e => { setQualityModalError(''); setQualityForm({ ...qualityForm, moisture_percentage: e.target.value }); }} style={{ width: '100%', padding: '0.6rem', borderRadius: '10px', border: '1px solid #CBD5E1' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: '800', color: '#2D3748', display: 'block', marginBottom: '0.35rem' }}>Capsule Size (mm)</label>
                <input type="text" value={qualityForm.size_mm} onChange={e => { setQualityModalError(''); setQualityForm({ ...qualityForm, size_mm: e.target.value }); }} style={{ width: '100%', padding: '0.6rem', borderRadius: '10px', border: '1px solid #CBD5E1' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: '800', color: '#2D3748', display: 'block', marginBottom: '0.35rem' }}>Quality Status</label>
                <select value={qualityForm.quality_status} onChange={e => setQualityForm({ ...qualityForm, quality_status: e.target.value })} style={{ width: '100%', padding: '0.6rem', borderRadius: '10px', border: '1px solid #CBD5E1' }}>
                  <option value="APPROVED">APPROVED</option>
                  <option value="REJECTED">REJECTED</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setShowQualityModal(false)} style={{ flex: 1, backgroundColor: '#F1F5F9', color: '#475569', border: 'none', padding: '0.75rem', borderRadius: '10px', fontWeight: '800', cursor: 'pointer' }}>
                  Cancel
                </button>
                <button type="submit" disabled={qualitySubmitting} style={{ flex: 2, backgroundColor: qualitySubmitting ? '#86EFAC' : '#16A34A', color: '#FFF', border: 'none', padding: '0.75rem', borderRadius: '10px', fontWeight: '900', cursor: qualitySubmitting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  {qualitySubmitting ? <><Loader2 size={16} className="animate-spin" /> Saving Quality...</> : 'Save Quality Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 6: PACKAGING */}
      {showPackagingModal && selectedOrder && (() => {
        const orderQty = parseFloat(selectedOrder.quantity_kg) || 0;
        const numPkgs = parseInt(packagingForm.number_of_packages, 10) || 0;
        const wtPerPkg = parseFloat(packagingForm.weight_per_package_kg) || 0;
        const totalKg = parseFloat((numPkgs * wtPerPkg).toFixed(2)) || 0;
        const isExceeded = orderQty > 0 && totalKg > (orderQty + 0.05);
        const diffKg = Math.abs(totalKg - orderQty).toFixed(2);

        return (
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
            <div style={{ backgroundColor: '#FFFFFF', borderRadius: '20px', width: '100%', maxWidth: '520px', padding: '1.75rem', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: '900', color: '#0F5A2C', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Layers size={22} color="#0284C7" /> Add Packaging Record
                  </h3>
                  <div style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '0.2rem' }}>
                    Order: <strong style={{ color: '#0F5A2C' }}>{selectedOrder.order_code}</strong> &bull; Total Required: <strong style={{ color: '#0284C7' }}>{orderQty} KG</strong>
                  </div>
                </div>
                <button onClick={() => setShowPackagingModal(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#718096', padding: '0.3rem', borderRadius: '50%' }}>
                  <X size={20} />
                </button>
              </div>

              {/* In-Modal Error Display */}
              {packagingModalError && (
                <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: '12px', padding: '0.75rem 1rem', marginBottom: '1.2rem', display: 'flex', alignItems: 'flex-start', gap: '0.6rem' }}>
                  <AlertTriangle size={18} color="#DC2626" style={{ marginTop: '0.1rem', flexShrink: 0 }} />
                  <div style={{ flex: 1, fontSize: '0.82rem', color: '#991B1B', fontWeight: '600', lineHeight: 1.4 }}>
                    {packagingModalError}
                  </div>
                  <button type="button" onClick={() => setPackagingModalError('')} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#991B1B', padding: 0, fontWeight: 'bold' }}>
                    &times;
                  </button>
                </div>
              )}

              {/* Order Info & Live Calculation Card */}
              <div style={{ backgroundColor: isExceeded ? '#FEF2F2' : '#F0F9FF', border: `1px solid ${isExceeded ? '#FECACA' : '#BAE6FD'}`, borderRadius: '12px', padding: '0.85rem 1rem', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: '800', color: isExceeded ? '#991B1B' : '#0369A1', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Packaging Allocation
                  </span>
                  <span style={{ fontSize: '0.75rem', fontWeight: '800', color: isExceeded ? '#DC2626' : '#0284C7' }}>
                    Order Quantity: {orderQty} KG
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontSize: '0.92rem', fontWeight: '900', color: isExceeded ? '#991B1B' : '#0F172A' }}>
                    {numPkgs} pkgs &times; {wtPerPkg} KG = <span style={{ color: isExceeded ? '#DC2626' : '#0284C7' }}>{totalKg} KG</span>
                  </div>
                  {isExceeded ? (
                    <span style={{ fontSize: '0.72rem', backgroundColor: '#FEE2E2', color: '#B91C1C', padding: '0.2rem 0.5rem', borderRadius: '6px', fontWeight: '800' }}>
                      Exceeds by +{diffKg} KG
                    </span>
                  ) : totalKg === orderQty ? (
                    <span style={{ fontSize: '0.72rem', backgroundColor: '#DCFCE7', color: '#166534', padding: '0.2rem 0.5rem', borderRadius: '6px', fontWeight: '800' }}>
                      Exact Match (100%)
                    </span>
                  ) : (
                    <span style={{ fontSize: '0.72rem', backgroundColor: '#E0F2FE', color: '#0369A1', padding: '0.2rem 0.5rem', borderRadius: '6px', fontWeight: '800' }}>
                      {diffKg} KG Remaining
                    </span>
                  )}
                </div>
              </div>

              <form onSubmit={handlePackagingSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: '800', color: '#2D3748', display: 'block', marginBottom: '0.35rem' }}>
                    Packaging Type
                  </label>
                  <select
                    value={packagingForm.packaging_type}
                    onChange={e => setPackagingForm({ ...packagingForm, packaging_type: e.target.value })}
                    style={{ width: '100%', padding: '0.65rem', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                  >
                    <option value="Vacuum Pack">Vacuum Pack (Moisture &amp; Aroma Preserved)</option>
                    <option value="Aroma-Lock Pouches">Aroma-Lock Pouches</option>
                    <option value="Jute Bags with Poly-Liner">Jute Bags with Poly-Liner</option>
                    <option value="Corrugated Carton Box">Corrugated Carton Box</option>
                    <option value="Master Wooden Crates">Master Wooden Crates</option>
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: '800', color: '#2D3748', display: 'block', marginBottom: '0.35rem' }}>
                      Number of Packages
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={packagingForm.number_of_packages}
                      onChange={e => {
                        setPackagingModalError('');
                        setPackagingForm({ ...packagingForm, number_of_packages: e.target.value });
                      }}
                      style={{ width: '100%', padding: '0.65rem', borderRadius: '10px', border: isExceeded ? '1px solid #F87171' : '1px solid #CBD5E1', fontSize: '0.85rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: '800', color: '#2D3748', display: 'block', marginBottom: '0.35rem' }}>
                      Weight per Package (KG)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      required
                      value={packagingForm.weight_per_package_kg}
                      onChange={e => {
                        setPackagingModalError('');
                        setPackagingForm({ ...packagingForm, weight_per_package_kg: e.target.value });
                      }}
                      style={{ width: '100%', padding: '0.65rem', borderRadius: '10px', border: isExceeded ? '1px solid #F87171' : '1px solid #CBD5E1', fontSize: '0.85rem' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: '800', color: '#2D3748', display: 'block', marginBottom: '0.35rem' }}>
                    Packaging Notes / Remarks <span style={{ color: '#94A3B8', fontWeight: 'normal' }}>(Optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Export grade 70-micron multi-layer food-grade poly bags"
                    value={packagingForm.notes || ''}
                    onChange={e => setPackagingForm({ ...packagingForm, notes: e.target.value })}
                    style={{ width: '100%', padding: '0.65rem', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => setShowPackagingModal(false)}
                    style={{ flex: 1, backgroundColor: '#F1F5F9', color: '#475569', border: 'none', padding: '0.75rem', borderRadius: '10px', fontWeight: '800', cursor: 'pointer', fontSize: '0.85rem' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={packagingSubmitting || isExceeded}
                    style={{
                      flex: 2,
                      backgroundColor: isExceeded ? '#94A3B8' : (packagingSubmitting ? '#38BDF8' : '#0284C7'),
                      color: '#FFF',
                      border: 'none',
                      padding: '0.75rem',
                      borderRadius: '10px',
                      fontWeight: '900',
                      cursor: (packagingSubmitting || isExceeded) ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      fontSize: '0.85rem',
                      transition: 'background-color 0.2s'
                    }}
                  >
                    {packagingSubmitting ? (
                      <>
                        <Loader2 size={16} className="animate-spin" /> Saving Details...
                      </>
                    ) : (
                      'Save Packaging Details'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {/* MODAL 7: UPLOAD DOCUMENT */}
      {showDocumentModal && selectedOrder && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '20px', width: '100%', maxWidth: '500px', padding: '1.75rem', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: '900', color: '#1B4D2E', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FileText size={20} color="#7C3AED" /> Upload Export Document
                </h3>
                <div style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '0.2rem' }}>
                  Order: <strong>{selectedOrder.order_code}</strong> &bull; Destination: {selectedOrder.destination_country}
                </div>
              </div>
              <button onClick={() => setShowDocumentModal(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#718096', padding: '0.3rem' }}><X size={20} /></button>
            </div>

            {/* In-Modal Error Display */}
            {documentModalError && (
              <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: '10px', padding: '0.75rem 1rem', marginBottom: '1rem', display: 'flex', alignItems: 'flex-start', gap: '0.6rem' }}>
                <AlertTriangle size={18} color="#DC2626" style={{ marginTop: '0.1rem', flexShrink: 0 }} />
                <div style={{ flex: 1, fontSize: '0.82rem', color: '#991B1B', fontWeight: '600', lineHeight: 1.4 }}>
                  {documentModalError}
                </div>
                <button type="button" onClick={() => setDocumentModalError('')} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#991B1B', fontWeight: 'bold' }}>&times;</button>
              </div>
            )}

            <form onSubmit={handleDocumentSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: '800', color: '#2D3748', display: 'block', marginBottom: '0.35rem' }}>Document Type</label>
                <select value={documentForm.document_type} onChange={e => setDocumentForm({ ...documentForm, document_type: e.target.value })} style={{ width: '100%', padding: '0.6rem', borderRadius: '10px', border: '1px solid #CBD5E1' }}>
                  <option value="Commercial Invoice">Commercial Invoice</option>
                  <option value="Packing List">Packing List</option>
                  <option value="Certificate of Origin">Certificate of Origin</option>
                  <option value="Quality Certificate">Quality Certificate</option>
                  <option value="Phytosanitary Certificate">Phytosanitary Certificate</option>
                  <option value="Shipping Bill">Shipping Bill</option>
                  <option value="Bill of Lading / Airway Bill">Bill of Lading / Airway Bill</option>
                  <option value="Other Documents">Other Documents</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: '800', color: '#2D3748', display: 'block', marginBottom: '0.35rem' }}>Document Reference / Number</label>
                <input type="text" placeholder="e.g. INV-2026-0892" value={documentForm.document_number} onChange={e => { setDocumentModalError(''); setDocumentForm({ ...documentForm, document_number: e.target.value }); }} style={{ width: '100%', padding: '0.6rem', borderRadius: '10px', border: '1px solid #CBD5E1' }} />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setShowDocumentModal(false)} style={{ flex: 1, backgroundColor: '#F1F5F9', color: '#475569', border: 'none', padding: '0.75rem', borderRadius: '10px', fontWeight: '800', cursor: 'pointer' }}>
                  Cancel
                </button>
                <button type="submit" disabled={documentSubmitting} style={{ flex: 2, backgroundColor: documentSubmitting ? '#A78BFA' : '#7C3AED', color: '#FFF', border: 'none', padding: '0.75rem', borderRadius: '10px', fontWeight: '900', cursor: documentSubmitting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  {documentSubmitting ? <><Loader2 size={16} className="animate-spin" /> Uploading...</> : 'Upload & Verify Document'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 8: BUYER DETAIL (HISTORY) */}
      {showBuyerDetailModal && selectedBuyerDetail && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '20px', width: '100%', maxWidth: '600px', padding: '1.75rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '900', color: '#1B4D2E', margin: 0 }}>Buyer Details</h3>
              <button onClick={() => setShowBuyerDetailModal(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#718096' }}><X size={20} /></button>
            </div>
            
            <div style={{ backgroundColor: '#F8FAF8', borderRadius: '12px', padding: '1.25rem', border: '1px solid #E5EBE5', fontSize: '0.85rem', lineHeight: 1.8, marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '1.2rem', fontWeight: '900', color: '#1A202C', marginBottom: '0.2rem' }}>{selectedBuyerDetail.company_name}</div>
              <div style={{ color: '#2E7D32', fontWeight: '800', marginBottom: '0.5rem', fontSize: '0.9rem' }}>{selectedBuyerDetail.name} • {selectedBuyerDetail.country}</div>
              <div><strong>Email:</strong> {selectedBuyerDetail.email}</div>
              <div><strong>Phone:</strong> {selectedBuyerDetail.phone}</div>
              <div><strong>Address:</strong> {selectedBuyerDetail.address}</div>
            </div>

            <h4 style={{ fontSize: '1.1rem', fontWeight: '900', color: '#1B4D2E', margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Layers size={18} /> EXPORT HISTORY
            </h4>
            {(!selectedBuyerDetail.orders || selectedBuyerDetail.orders.length === 0) ? (
              <div style={{ padding: '1.5rem', textAlign: 'center', color: '#718096', backgroundColor: '#F8FAF8', borderRadius: '12px', fontSize: '0.85rem', border: '1px dashed #CBD5E1' }}>
                No export history found for this buyer.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {selectedBuyerDetail.orders.map(hist => (
                  <div key={hist.id} style={{ backgroundColor: '#F8FAF8', borderRadius: '12px', padding: '1rem', border: '1px solid #E5EBE5' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                      <span style={{ fontWeight: '900', color: '#1A202C', fontSize: '0.95rem' }}>{hist.order_code}</span>
                      <span style={{ fontSize: '0.75rem', fontWeight: '800', padding: '0.3rem 0.75rem', borderRadius: '8px', backgroundColor: '#E8F5E9', color: '#2E7D32', border: '1px solid #A5D6A7' }}>{hist.status}</span>
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#4A5568', fontWeight: '600' }}>{hist.cardamom_variety} • {hist.quantity_kg} KG</div>
                    <div style={{ fontSize: '1rem', fontWeight: '900', color: '#059669', marginTop: '0.5rem' }}>
                      ${parseFloat(hist.total_export_value || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 9: CREATE SHIPMENT */}
      {showShipmentModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '20px', width: '100%', maxWidth: '520px', padding: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '900', color: '#1B4D2E', margin: 0 }}>Create Shipment</h3>
              <button onClick={() => setShowShipmentModal(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#718096' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleShipmentSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: '800', color: '#2D3748', display: 'block', marginBottom: '0.35rem' }}>Select Export Order *</label>
                <select required value={shipmentForm.export_order_id} onChange={e => setShipmentForm({ ...shipmentForm, export_order_id: e.target.value })} style={{ width: '100%', padding: '0.6rem', borderRadius: '10px', border: '1px solid #CBD5E1' }}>
                  <option value="">-- Select Order --</option>
                  {orders.map(o => (
                    <option key={o.id} value={o.id}>{o.order_code} - {o.buyer_name} ({o.destination_country})</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: '800', color: '#2D3748', display: 'block', marginBottom: '0.35rem' }}>Carrier / Shipping Line</label>
                <input type="text" value={shipmentForm.carrier} onChange={e => setShipmentForm({ ...shipmentForm, carrier: e.target.value })} style={{ width: '100%', padding: '0.6rem', borderRadius: '10px', border: '1px solid #CBD5E1' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: '800', color: '#2D3748', display: 'block', marginBottom: '0.35rem' }}>Shipping Method</label>
                <select value={shipmentForm.shipping_method} onChange={e => setShipmentForm({ ...shipmentForm, shipping_method: e.target.value })} style={{ width: '100%', padding: '0.6rem', borderRadius: '10px', border: '1px solid #CBD5E1' }}>
                  <option value="SEA">SEA FREIGHT</option>
                  <option value="AIR">AIR CARGO</option>
                  <option value="LAND">LAND TRANSPORT</option>
                </select>
              </div>
              <button type="submit" style={{ backgroundColor: '#43A047', color: '#FFF', border: 'none', padding: '0.75rem', borderRadius: '10px', fontWeight: '900', cursor: 'pointer' }}>
                Create &amp; Dispatch Shipment
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 10: DELIVERY CONFIRMATION & DISPUTE REVIEW */}
      {showDeliveryConfirmationModal && selectedConfirmationOrder && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 110, padding: '1rem' }}>
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '20px', width: '100%', maxWidth: '680px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', border: '1px solid #E2E8F0' }}>
            {/* Header */}
            {(() => {
              const conf = selectedConfirmationOrder.delivery_confirmation;
              const isDispute = selectedConfirmationOrder.status === 'DELIVERY_DISPUTE' || Boolean(conf?.is_dispute);

              return (
                <div>
                  <div style={{
                    padding: '1.25rem 1.75rem',
                    borderBottom: '1px solid #E5EBE5',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    backgroundColor: isDispute ? '#FEF2F2' : '#F0FDF4'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <div style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '10px',
                        backgroundColor: isDispute ? '#FEE2E2' : '#DCFCE7',
                        color: isDispute ? '#DC2626' : '#15803D',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        {isDispute ? <AlertTriangle size={22} /> : <CheckCircle2 size={22} />}
                      </div>
                      <div>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: '900', color: isDispute ? '#991B1B' : '#073B1E', margin: 0 }}>
                          {isDispute ? 'Review Delivery Dispute' : 'Buyer Delivery Confirmation'}
                        </h3>
                        <p style={{ fontSize: '0.78rem', color: isDispute ? '#7F1D1D' : '#166534', margin: '0.15rem 0 0' }}>
                          Export Order: <strong>{selectedConfirmationOrder.order_code}</strong>
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowDeliveryConfirmationModal(false)}
                      style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#64748B', padding: '0.35rem' }}
                    >
                      <X size={20} />
                    </button>
                  </div>

                  {/* Body Content */}
                  <div style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    {conf ? (
                      <>
                        {/* Summary Card */}
                        <div style={{
                          backgroundColor: '#F8FAFC',
                          borderRadius: '14px',
                          border: '1px solid #E2E8F0',
                          padding: '1.25rem'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid #E2E8F0', flexWrap: 'wrap', gap: '0.5rem' }}>
                            <div>
                              <div style={{ fontSize: '0.72rem', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Confirmation Reference
                              </div>
                              <div style={{ fontSize: '1.1rem', fontWeight: '900', color: '#0F172A', fontFamily: 'monospace' }}>
                                {conf.confirmation_reference}
                              </div>
                            </div>
                            <span style={{
                              padding: '0.3rem 0.85rem',
                              borderRadius: '20px',
                              fontWeight: '800',
                              fontSize: '0.8rem',
                              backgroundColor: isDispute ? '#FEE2E2' : '#DCFCE7',
                              color: isDispute ? '#B91C1C' : '#15803D',
                              border: `1px solid ${isDispute ? '#FECACA' : '#BBF7D0'}`
                            }}>
                              {conf.delivery_condition_display}
                            </span>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', fontSize: '0.85rem' }}>
                            <div>
                              <div style={{ color: '#64748B', fontSize: '0.75rem' }}>Buyer Company</div>
                              <div style={{ fontWeight: '800', color: '#1E293B', marginTop: '0.15rem' }}>
                                {selectedConfirmationOrder.buyer_name} ({selectedConfirmationOrder.destination_country})
                              </div>
                            </div>
                            <div>
                              <div style={{ color: '#64748B', fontSize: '0.75rem' }}>Confirmed Timestamp</div>
                              <div style={{ fontWeight: '700', color: '#1E293B', marginTop: '0.15rem' }}>
                                {new Date(conf.confirmed_at).toLocaleString()}
                              </div>
                            </div>
                            <div>
                              <div style={{ color: '#64748B', fontSize: '0.75rem' }}>Ordered Quantity</div>
                              <div style={{ fontWeight: '800', color: '#1E293B', marginTop: '0.15rem' }}>
                                {conf.quantity_ordered_kg} KG
                              </div>
                            </div>
                            <div>
                              <div style={{ color: '#64748B', fontSize: '0.75rem' }}>Actual Quantity Received</div>
                              <div style={{
                                fontWeight: '900',
                                color: parseFloat(conf.quantity_received_kg) < parseFloat(conf.quantity_ordered_kg) ? '#DC2626' : '#15803D',
                                marginTop: '0.15rem'
                              }}>
                                {conf.quantity_received_kg} KG
                                {parseFloat(conf.quantity_received_kg) < parseFloat(conf.quantity_ordered_kg) && (
                                  <span style={{ fontSize: '0.75rem', marginLeft: '6px', color: '#DC2626' }}>
                                    (-{(parseFloat(conf.quantity_ordered_kg) - parseFloat(conf.quantity_received_kg)).toFixed(2)} KG shortage)
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Buyer Comments */}
                          {conf.comments && (
                            <div style={{ marginTop: '1rem', paddingTop: '0.85rem', borderTop: '1px solid #E2E8F0' }}>
                              <div style={{ color: '#64748B', fontSize: '0.75rem', marginBottom: '0.35rem', fontWeight: '700' }}>
                                Buyer Observations / Dispute Notes:
                              </div>
                              <div style={{
                                backgroundColor: '#FFFFFF',
                                padding: '0.85rem 1rem',
                                borderRadius: '8px',
                                border: '1px solid #E2E8F0',
                                color: '#334155',
                                fontSize: '0.875rem',
                                fontStyle: 'italic',
                                lineHeight: 1.5
                              }}>
                                "{conf.comments}"
                              </div>
                            </div>
                          )}

                          {/* Evidence Document File */}
                          {conf.evidence_file && (
                            <div style={{ marginTop: '1rem', paddingTop: '0.85rem', borderTop: '1px solid #E2E8F0' }}>
                              <div style={{ color: '#64748B', fontSize: '0.75rem', marginBottom: '0.35rem', fontWeight: '700' }}>
                                Proof of Delivery / Damaged Goods Evidence:
                              </div>
                              <a
                                href={conf.evidence_file}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.45rem',
                                  padding: '0.5rem 0.85rem',
                                  borderRadius: '8px',
                                  backgroundColor: '#E8F5E9',
                                  color: '#2E7D32',
                                  fontWeight: '800',
                                  fontSize: '0.8rem',
                                  textDecoration: 'none',
                                  border: '1px solid #A5D6A7'
                                }}
                              >
                                <ExternalLink size={14} />
                                <span>Download / View Evidence Attachment</span>
                              </a>
                            </div>
                          )}

                          {/* Audit Info */}
                          <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px dashed #CBD5E1', fontSize: '0.72rem', color: '#94A3B8' }}>
                            <span>Security Audit: Verified from IP {conf.ip_address || 'client'} • SSL Encrypted Single-Use Link</span>
                          </div>
                        </div>

                        {/* Dispute resolution guidelines */}
                        {isDispute && (
                          <div style={{
                            backgroundColor: '#FEF2F2',
                            border: '1px solid #FECACA',
                            borderRadius: '12px',
                            padding: '1rem',
                            fontSize: '0.825rem',
                            color: '#991B1B'
                          }}>
                            <strong>Dispute Resolution Notice:</strong>
                            <p style={{ marginTop: '0.25rem', margin: 0, lineHeight: 1.5 }}>
                              The buyer has flagged this export order for review. Please inspect the received quantity
                              discrepancy and evidence above. Contact the buyer directly or file an insurance/freight
                              claim with the shipping carrier. Payment processing remains independent.
                            </p>
                          </div>
                        )}
                      </>
                    ) : (
                      <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#64748B' }}>
                        <Clock size={36} style={{ color: '#F59E0B', margin: '0 auto 0.75rem' }} />
                        <h4 style={{ fontSize: '1.05rem', fontWeight: '800', color: '#1E293B', marginBottom: '0.35rem' }}>
                          Delivery Confirmation Pending
                        </h4>
                        <p style={{ fontSize: '0.85rem', maxWidth: '440px', margin: '0 auto 1.25rem' }}>
                          The buyer has not confirmed receipt of this order yet. You can resend the confirmation
                          link to their saved email address.
                        </p>
                        <button
                          type="button"
                          disabled={resendingConfirmationId === selectedConfirmationOrder.id}
                          onClick={async () => {
                            await handleResendConfirmationLink(selectedConfirmationOrder.id);
                            setShowDeliveryConfirmationModal(false);
                          }}
                          style={{
                            backgroundColor: '#0F5A2C',
                            color: '#FFFFFF',
                            border: 'none',
                            padding: '0.65rem 1.25rem',
                            borderRadius: '10px',
                            fontWeight: '800',
                            fontSize: '0.85rem',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.45rem'
                          }}
                        >
                          <Mail size={16} />
                          <span>Resend Confirmation Email</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div style={{
                    padding: '1rem 1.75rem',
                    borderTop: '1px solid #E5EBE5',
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: '0.75rem',
                    backgroundColor: '#F8FAFC'
                  }}>
                    <button
                      type="button"
                      onClick={() => setShowDeliveryConfirmationModal(false)}
                      style={{
                        backgroundColor: '#FFFFFF',
                        color: '#475569',
                        border: '1px solid #CBD5E1',
                        padding: '0.6rem 1.25rem',
                        borderRadius: '10px',
                        fontWeight: '800',
                        fontSize: '0.85rem',
                        cursor: 'pointer'
                      }}
                    >
                      Close
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* MODAL 11: ORDER DETAILS MODAL */}
      {showOrderDetailModal && selectedOrder && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 105, padding: '1rem' }}>
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '20px', width: '100%', maxWidth: '720px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', border: '1px solid #E2E8F0' }}>
            <div style={{ padding: '1.25rem 1.75rem', borderBottom: '1px solid #E5EBE5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '900', color: '#1B4D2E', margin: 0 }}>
                  Order Details ({selectedOrder.order_code})
                </h3>
                <p style={{ fontSize: '0.8rem', color: '#718096', margin: '0.15rem 0 0' }}>
                  Buyer: {selectedOrder.buyer_name} • Port: {selectedOrder.destination_port}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowOrderDetailModal(false)}
                style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#718096' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '1.5rem 1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <OrderTracker status={selectedOrder.status} order={selectedOrder} shipment={shipments.find(s => s.export_order === selectedOrder.id || s.order_code === selectedOrder.order_code)} />

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', backgroundColor: '#F8FAF8', padding: '1rem', borderRadius: '12px', border: '1px solid #E5EBE5', fontSize: '0.85rem' }}>
                <div><strong>Variety:</strong> {selectedOrder.cardamom_variety}</div>
                <div><strong>Grade:</strong> {selectedOrder.grade}</div>
                <div><strong>Ordered Quantity:</strong> {selectedOrder.quantity_kg} KG</div>
                <div><strong>Price per KG:</strong> ${parseFloat(selectedOrder.price_per_kg || 0).toFixed(2)} USD</div>
                <div><strong>Total Value:</strong> ${parseFloat(selectedOrder.total_value_usd || 0).toLocaleString()} USD</div>
                <div><strong>Status:</strong> {selectedOrder.status}</div>
                <div><strong>Payment Status:</strong> {selectedOrder.payment_status || 'PENDING'}</div>
                <div><strong>Shipping Method:</strong> {selectedOrder.shipment_method}</div>
              </div>

              {/* Delivery Confirmation Section */}
              <div style={{ padding: '1rem', borderRadius: '12px', border: '1px solid #E2E8F0', backgroundColor: selectedOrder.delivery_confirmation ? '#F0FDF4' : '#F8FAFC' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: '800', color: '#1B4D2E', margin: 0 }}>
                    Buyer Delivery Confirmation Status
                  </h4>
                  {selectedOrder.delivery_confirmation ? (
                    <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#166534', backgroundColor: '#DCFCE7', padding: '0.2rem 0.6rem', borderRadius: '999px' }}>
                      ✓ Confirmed
                    </span>
                  ) : (
                    <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#92400E', backgroundColor: '#FEF3C7', padding: '0.2rem 0.6rem', borderRadius: '999px' }}>
                      Pending Receipt
                    </span>
                  )}
                </div>

                {selectedOrder.delivery_confirmation ? (
                  <div style={{ fontSize: '0.825rem', color: '#334155', lineHeight: 1.6 }}>
                    <div><strong>Reference:</strong> {selectedOrder.delivery_confirmation.confirmation_reference}</div>
                    <div><strong>Condition:</strong> {selectedOrder.delivery_confirmation.delivery_condition_display}</div>
                    <div><strong>Received:</strong> {selectedOrder.delivery_confirmation.quantity_received_kg} KG</div>
                    {selectedOrder.delivery_confirmation.comments && (
                      <div><strong>Comments:</strong> "{selectedOrder.delivery_confirmation.comments}"</div>
                    )}
                  </div>
                ) : (
                  <div style={{ fontSize: '0.825rem', color: '#64748B' }}>
                    Buyer delivery receipt has not been confirmed yet. An expiring secure email link is sent when the shipment is dispatched.
                  </div>
                )}
              </div>
            </div>

            <div style={{ padding: '1rem 1.75rem', borderTop: '1px solid #E5EBE5', display: 'flex', justifyContent: 'flex-end', backgroundColor: '#F8FAFC' }}>
              <button
                type="button"
                onClick={() => setShowOrderDetailModal(false)}
                style={{ backgroundColor: '#2E7D32', color: '#FFFFFF', border: 'none', padding: '0.55rem 1.25rem', borderRadius: '10px', fontWeight: '800', fontSize: '0.85rem', cursor: 'pointer' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


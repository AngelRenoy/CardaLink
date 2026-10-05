import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import {
  Sprout, LogOut, Globe, Box, Package, Truck, FileText, CheckCircle2,
  Clock, AlertCircle, Plus, Search, Filter, Eye, X, CheckCircle, ShieldCheck,
  Building2, User, CreditCard, BarChart3, ChevronRight, Layers, Award,
  Sparkles, RefreshCw, Anchor, Compass, DollarSign, Calendar
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
  updateExporterProfileApi
} from '../services/api';

const OrderTracker = ({ status }) => {
  const steps = [
    { key: 'CONFIRMED', label: 'Order Created' },
    { key: 'QUALITY_APPROVED', label: 'Quality Approved' },
    { key: 'PACKAGING', label: 'Packaging Completed' },
    { key: 'DOCUMENTS_PENDING', label: 'Documents Completed' },
    { key: 'READY_FOR_SHIPMENT', label: 'Ready for Shipment' },
    { key: 'SHIPPED', label: 'Shipped' },
    { key: 'IN_TRANSIT', label: 'In Transit' },
    { key: 'ARRIVED', label: 'Arrived' },
    { key: 'DELIVERED', label: 'Delivered' },
  ];

  const getStepIndex = (st) => {
    switch (st) {
      case 'CONFIRMED': return 0;
      case 'QUALITY_CHECK': return 0;
      case 'QUALITY_APPROVED': return 1;
      case 'PACKAGING': return 2;
      case 'DOCUMENTS_PENDING': return 3;
      case 'READY_FOR_SHIPMENT': return 4;
      case 'SHIPPED': return 5;
      case 'IN_TRANSIT': return 6;
      case 'ARRIVED': return 7;
      case 'DELIVERED': return 8;
      case 'COMPLETED': return 8;
      default: return 0;
    }
  };

  if (status === 'QUALITY_REJECTED') {
    return (
      <div style={{ padding: '0.5rem 0.75rem', backgroundColor: '#FEF2F2', borderRadius: '8px', border: '1px solid #FECACA', color: '#DC2626', fontSize: '0.75rem', fontWeight: '800' }}>
        ✖ QUALITY REJECTED
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

  const currentIndex = getStepIndex(status);

  return (
    <div style={{ margin: '0.75rem 0', backgroundColor: '#F8FAF8', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid #E5EBE5' }}>
      <div style={{ fontSize: '0.7rem', fontWeight: '900', color: '#2E7D32', textTransform: 'uppercase', marginBottom: '0.5rem', letterSpacing: '0.05em' }}>
        🗺️ EXPORT ORDER TRACKING PROGRESS
      </div>
      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.35rem' }}>
        {steps.map((step, idx) => {
          const isDone = idx <= currentIndex;
          const isCurrent = idx === currentIndex;
          let bg = '#F1F5F9';
          let fg = '#94A3B8';
          let border = '#E2E8F0';

          if (isDone) {
            bg = '#E8F5E9';
            fg = '#2E7D32';
            border = '#A5D6A7';
          }
          if (isCurrent) {
            bg = '#FEF3C7';
            fg = '#92400E';
            border = '#FDE68A';
          }

          return (
            <React.Fragment key={step.key}>
              <span style={{
                fontSize: '0.68rem',
                fontWeight: isCurrent ? '900' : '700',
                padding: '0.2rem 0.55rem',
                borderRadius: '6px',
                backgroundColor: bg,
                color: fg,
                border: `1px solid ${border}`,
                display: 'inline-flex',
                alignItems: 'center'
              }}>
                {isDone ? '✓ ' : ''}{step.label}
              </span>
              {idx < steps.length - 1 && (
                <span style={{ fontSize: '0.68rem', color: isDone ? '#2E7D32' : '#CBD5E1', fontWeight: 'bold' }}>→</span>
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
  const [orderForm, setOrderForm] = useState({
    buyer_id: '', buyer_name: '', company_name: '', email: '', phone: '', address: '',
    destination_country: '', destination_port: 'Dubai Port', shipment_method: 'SEA',
    expected_shipment_date: '', incoterms: 'FOB', inventory_item_id: '', variety: '',
    grade: 'AGEB 8mm', quantity_kg: '', price_per_kg: '', notes: ''
  });
  const [showOrderDetailModal, setShowOrderDetailModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const [showQualityModal, setShowQualityModal] = useState(false);
  const [qualityForm, setQualityForm] = useState({ moisture_percentage: '10.5', size_mm: '8mm', color_appearance: 'Deep Green', quality_status: 'APPROVED', inspector_name: '', remarks: '' });

  const [showPackagingModal, setShowPackagingModal] = useState(false);
  const [packagingForm, setPackagingForm] = useState({ packaging_type: 'Vacuum Pack', number_of_packages: '50', weight_per_package_kg: '10', notes: '' });

  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [documentForm, setDocumentForm] = useState({ document_type: 'Commercial Invoice', document_name: '', document_number: '', file_url: '' });

  const [showShipmentModal, setShowShipmentModal] = useState(false);
  const [shipmentForm, setShipmentForm] = useState({ export_order_id: '', carrier: 'Maersk Line', shipping_method: 'SEA', origin: 'Cochin Port, India', destination: '', dispatch_date: '', estimated_delivery: '' });

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
      showMsg('success', res.message || 'International Buyer added');
      setShowAddBuyerModal(false);
      setBuyerForm({ name: '', company_name: '', country: '', email: '', phone: '', address: '' });
      loadAllData();
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
    try {
      const res = await createExporterOrderApi(orderForm);
      showMsg('success', res.message || 'Export order created successfully');
      setShowCreateOrderModal(false);
      setOrderForm({
        buyer_id: '', buyer_name: '', company_name: '', email: '', phone: '', address: '',
        destination_country: '', destination_port: 'Dubai Port', shipment_method: 'SEA',
        expected_shipment_date: '', incoterms: 'FOB', inventory_item_id: '', variety: '',
        grade: 'AGEB 8mm', quantity_kg: '', price_per_kg: '', notes: ''
      });
      loadAllData();
    } catch (err) {
      showMsg('error', err.message || 'Failed to create export order');
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

  // Quality Submit
  const handleQualitySubmit = async (e) => {
    e.preventDefault();
    if (!selectedOrder) return;
    try {
      const res = await createExporterOrderQualityApi(selectedOrder.id, qualityForm);
      showMsg('success', res.message || 'Quality record saved');
      setShowQualityModal(false);
      loadAllData();
    } catch (err) {
      showMsg('error', err.message || 'Failed to save quality record');
    }
  };

  // Packaging Submit
  const handlePackagingSubmit = async (e) => {
    e.preventDefault();
    if (!selectedOrder) return;
    try {
      const res = await createExporterOrderPackagingApi(selectedOrder.id, packagingForm);
      showMsg('success', res.message || 'Packaging record saved');
      setShowPackagingModal(false);
      loadAllData();
    } catch (err) {
      showMsg('error', err.message || 'Failed to save packaging record');
    }
  };

  // Document Submit
  const handleDocumentSubmit = async (e) => {
    e.preventDefault();
    if (!selectedOrder) return;
    try {
      const res = await createExporterOrderDocumentApi(selectedOrder.id, documentForm);
      showMsg('success', res.message || 'Document uploaded successfully');
      setShowDocumentModal(false);
      setDocumentForm({ document_type: 'Commercial Invoice', document_name: '', document_number: '', file_url: '' });
      loadAllData();
    } catch (err) {
      showMsg('error', err.message || 'Failed to upload document');
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
      showMsg('success', res.message || `Shipment status updated to ${status}`);
      loadAllData();
    } catch (err) {
      showMsg('error', err.message || 'Failed to update shipment status');
    }
  };

  // Filtered Export Supply Requests
  const filteredSupplies = exportSupplies.filter(s => {
    const matchesSearch = !suppliesSearch ||
      (s.trader_name && s.trader_name.toLowerCase().includes(suppliesSearch.toLowerCase())) ||
      (s.variety && s.variety.toLowerCase().includes(suppliesSearch.toLowerCase())) ||
      (s.batch_code && s.batch_code.toLowerCase().includes(suppliesSearch.toLowerCase()));

    const matchesStatus = !suppliesStatusFilter || s.status === suppliesStatusFilter;
    return matchesSearch && matchesStatus;
  });

  // Filtered Export Orders
  const filteredOrders = orders.filter(o => {
    return !ordersSearch ||
      (o.order_code && o.order_code.toLowerCase().includes(ordersSearch.toLowerCase())) ||
      (o.buyer_name && o.buyer_name.toLowerCase().includes(ordersSearch.toLowerCase())) ||
      (o.destination_country && o.destination_country.toLowerCase().includes(ordersSearch.toLowerCase())) ||
      (o.cardamom_variety && o.cardamom_variety.toLowerCase().includes(ordersSearch.toLowerCase()));
  });

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
                { id: 'supplies', label: 'Export Supply Requests', icon: Truck, count: stats?.pending_export_requests },
                { id: 'inventory', label: 'Exporter Inventory', icon: Box },
                { id: 'orders', label: 'Export Orders', icon: Package, count: stats?.accepted_orders },
                { id: 'buyers', label: 'International Buyers', icon: Globe },
                { id: 'quality', label: 'Quality & Grading', icon: Award },
                { id: 'packaging', label: 'Packaging', icon: Layers },
                { id: 'documents', label: 'Export Documents', icon: FileText },
                { id: 'shipments', label: 'Shipments & Tracking', icon: Anchor, count: stats?.active_shipments },
                { id: 'transactions', label: 'Financial Transactions', icon: DollarSign },
                { id: 'reports', label: 'Reports & Analytics', icon: BarChart3 },
                { id: 'profile', label: 'My Exporter Profile', icon: User },
              ].map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
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
          {/* TAB 2: EXPORT SUPPLY REQUESTS (COMPACT LIST VIEW) */}
          {/* ========================================================================= */}
          {activeTab === 'supplies' && (
            <div>
              <div style={{ backgroundColor: '#FFFFFF', borderRadius: '20px', padding: '1.5rem', border: '1px solid #E5EBE5', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
                  <div>
                    <h2 style={{ fontSize: '1.35rem', fontWeight: '900', color: '#1B4D2E', margin: 0 }}>
                      Export Supply Requests Received from Traders
                    </h2>
                    <p style={{ fontSize: '0.85rem', color: '#718096', margin: '0.2rem 0 0' }}>
                      Compact view of cardamom offers submitted by authenticated Traders.
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <div style={{ position: 'relative' }}>
                      <Search size={16} color="#94A3B8" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                      <input
                        type="text"
                        placeholder="Search trader, variety, batch..."
                        value={suppliesSearch}
                        onChange={e => setSuppliesSearch(e.target.value)}
                        style={{ paddingLeft: '2rem', paddingRight: '0.75rem', paddingTop: '0.45rem', paddingBottom: '0.45rem', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '0.82rem' }}
                      />
                    </div>

                    <select
                      value={suppliesStatusFilter}
                      onChange={e => setSuppliesStatusFilter(e.target.value)}
                      style={{ padding: '0.45rem 0.75rem', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '0.82rem', backgroundColor: '#FFF' }}
                    >
                      <option value="">All Statuses</option>
                      <option value="PENDING">PENDING</option>
                      <option value="ACCEPTED">ACCEPTED</option>
                      <option value="PAYMENT_PENDING">PAYMENT_PENDING</option>
                      <option value="PAID">PAID</option>
                      <option value="READY_FOR_RECEIPT">READY_FOR_RECEIPT</option>
                      <option value="RECEIVED">RECEIVED</option>
                      <option value="COMPLETED">COMPLETED</option>
                      <option value="REJECTED">REJECTED</option>
                    </select>
                  </div>
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
                          <span style={{ fontSize: '0.88rem', color: '#059669', fontWeight: '900' }}>
                            ₹{parseFloat(req.total_amount || 0).toLocaleString('en-IN')}
                          </span>
                          <span style={{ fontSize: '0.78rem', color: '#718096' }}>
                            Date: {req.request_date || req.created_at?.split('T')[0]}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <span style={{
                            backgroundColor: req.status === 'COMPLETED' ? '#E8F5E9' : (req.status === 'PENDING' ? '#FEF3C7' : '#E0F2FE'),
                            color: req.status === 'COMPLETED' ? '#2E7D32' : (req.status === 'PENDING' ? '#92400E' : '#0284C7'),
                            padding: '0.25rem 0.65rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: '900',
                            border: `1px solid ${req.status === 'COMPLETED' ? '#A5D6A7' : '#FDE68A'}`
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
                          <th style={{ padding: '0.75rem 1rem' }}>Batch Code</th>
                          <th style={{ padding: '0.75rem 1rem' }}>Variety</th>
                          <th style={{ padding: '0.75rem 1rem' }}>Grade</th>
                          <th style={{ padding: '0.75rem 1rem' }}>Quantity</th>
                          <th style={{ padding: '0.75rem 1rem' }}>Purchase Price</th>
                          <th style={{ padding: '0.75rem 1rem' }}>Source Trader</th>
                          <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {inventory.map(inv => (
                          <tr key={inv.id} style={{ borderBottom: '1px solid #F4F7F4' }}>
                            <td style={{ padding: '0.75rem 1rem', fontWeight: '900', color: '#1B4D2E' }}>{inv.batch_code}</td>
                            <td style={{ padding: '0.75rem 1rem', fontWeight: '800' }}>{inv.variety}</td>
                            <td style={{ padding: '0.75rem 1rem' }}>{inv.grade}</td>
                            <td style={{ padding: '0.75rem 1rem', fontWeight: '900', color: '#2E7D32' }}>{inv.quantity_kg} KG</td>
                            <td style={{ padding: '0.75rem 1rem' }}>₹{parseFloat(inv.purchase_price_per_kg || 0).toLocaleString('en-IN')}/KG</td>
                            <td style={{ padding: '0.75rem 1rem', color: '#4A5568' }}>{inv.source_trader_name || 'Self/Manual'}</td>
                            <td style={{ padding: '0.75rem 1rem' }}>
                              <span style={{ backgroundColor: inv.quantity_kg > 0 ? '#E8F5E9' : '#FFEBEE', color: inv.quantity_kg > 0 ? '#2E7D32' : '#C62828', padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.72rem', fontWeight: '800' }}>
                                {inv.quantity_kg > 0 ? 'AVAILABLE' : 'EXPORTED'}
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
                    {filteredOrders.map(ord => (
                      <div key={ord.id} style={{ backgroundColor: '#F8FAF8', borderRadius: '14px', padding: '1.15rem', border: '1px solid #E5EBE5' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
                          <div>
                            <div style={{ fontSize: '1.05rem', fontWeight: '900', color: '#1A202C' }}>{ord.order_code} | Buyer: {ord.buyer_name} ({ord.destination_country})</div>
                            <div style={{ fontSize: '0.78rem', color: '#718096', fontWeight: '600', margin: '0.2rem 0' }}>
                              Variety: <strong>{ord.cardamom_variety}</strong> ({ord.grade}) • Quantity: <strong>{ord.quantity_kg} KG</strong> • Total Value: <strong style={{ color: '#059669' }}>${parseFloat(ord.total_value_usd).toLocaleString('en-US')}</strong>
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#4A5568', fontWeight: '700' }}>
                              Port: {ord.destination_port} | Method: {ord.shipment_method} | Incoterms: {ord.incoterms}
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ backgroundColor: '#E0F2FE', color: '#0284C7', padding: '0.25rem 0.65rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: '900', border: '1px solid #BAE6FD' }}>
                              {ord.status}
                            </span>
                            <button onClick={() => { setSelectedOrder(ord); setShowOrderDetailModal(true); }} style={{ backgroundColor: '#2E7D32', color: '#FFF', border: 'none', padding: '0.45rem 0.85rem', borderRadius: '8px', fontSize: '0.78rem', fontWeight: '800', cursor: 'pointer' }}>
                              View Order Details
                            </button>
                          </div>
                        </div>

                        {/* Order Step Tracker Bar */}
                        <OrderTracker status={ord.status} />
                      </div>
                    ))}
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
          {/* TAB 6: QUALITY & GRADING */}
          {/* ========================================================================= */}
          {activeTab === 'quality' && (
            <div>
              <div style={{ backgroundColor: '#FFFFFF', borderRadius: '20px', padding: '1.5rem', border: '1px solid #E5EBE5', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.35rem', fontWeight: '900', color: '#1B4D2E', margin: '0 0 0.4rem' }}>Quality & Grading Verification</h2>
                <p style={{ fontSize: '0.85rem', color: '#718096', marginBottom: '1.25rem' }}>Record moisture content, color, capsule size, and quality inspection results prior to export.</p>

                {orders.length === 0 ? (
                  <div style={{ padding: '3rem', textAlign: 'center', color: '#718096', backgroundColor: '#F8FAF8', borderRadius: '14px', fontSize: '0.85rem' }}>
                    No active export orders to inspect.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {orders.map(ord => (
                      <div key={ord.id} style={{ backgroundColor: '#F8FAF8', borderRadius: '12px', padding: '1rem 1.25rem', border: '1px solid #E5EBE5', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                        <div>
                          <div style={{ fontSize: '0.9rem', fontWeight: '900', color: '#1A202C' }}>{ord.order_code} | {ord.cardamom_variety} ({ord.grade})</div>
                          <div style={{ fontSize: '0.78rem', color: '#718096' }}>Buyer: {ord.buyer_name} • Quantity: {ord.quantity_kg} KG • Status: <strong>{ord.status}</strong></div>
                          {ord.quality_records && ord.quality_records.length > 0 && (
                            <div style={{ fontSize: '0.75rem', color: '#2E7D32', fontWeight: '800', marginTop: '0.2rem' }}>
                              ✓ Inspected: Moisture {ord.quality_records[0].moisture_percentage}% | Size {ord.quality_records[0].size_mm} | Status: {ord.quality_records[0].quality_status}
                            </div>
                          )}
                        </div>

                        <button onClick={() => { setSelectedOrder(ord); setShowQualityModal(true); }} style={{ backgroundColor: '#43A047', color: '#FFF', border: 'none', padding: '0.45rem 0.85rem', borderRadius: '8px', fontSize: '0.78rem', fontWeight: '800', cursor: 'pointer' }}>
                          + Record Quality Check
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 7: PACKAGING */}
          {/* ========================================================================= */}
          {activeTab === 'packaging' && (
            <div>
              <div style={{ backgroundColor: '#FFFFFF', borderRadius: '20px', padding: '1.5rem', border: '1px solid #E5EBE5', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.35rem', fontWeight: '900', color: '#1B4D2E', margin: '0 0 0.4rem' }}>Export Packaging Records</h2>
                <p style={{ fontSize: '0.85rem', color: '#718096', marginBottom: '1.25rem' }}>Record package types (e.g., Vacuum Pack, Jute Bag), package counts, and total weights.</p>

                {orders.length === 0 ? (
                  <div style={{ padding: '3rem', textAlign: 'center', color: '#718096', backgroundColor: '#F8FAF8', borderRadius: '14px', fontSize: '0.85rem' }}>
                    No export orders available for packaging.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {orders.map(ord => (
                      <div key={ord.id} style={{ backgroundColor: '#F8FAF8', borderRadius: '12px', padding: '1rem 1.25rem', border: '1px solid #E5EBE5', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                        <div>
                          <div style={{ fontSize: '0.9rem', fontWeight: '900', color: '#1A202C' }}>{ord.order_code} | {ord.cardamom_variety}</div>
                          <div style={{ fontSize: '0.78rem', color: '#718096' }}>Export Quantity: {ord.quantity_kg} KG • Status: <strong>{ord.status}</strong></div>
                          {ord.packaging_records && ord.packaging_records.length > 0 && (
                            <div style={{ fontSize: '0.75rem', color: '#0284C7', fontWeight: '800', marginTop: '0.2rem' }}>
                              📦 Packaged: {ord.packaging_records[0].packaging_type} • {ord.packaging_records[0].number_of_packages} pkgs @ {ord.packaging_records[0].weight_per_package_kg} KG/pkg
                            </div>
                          )}
                        </div>

                        <button onClick={() => { setSelectedOrder(ord); setShowPackagingModal(true); }} style={{ backgroundColor: '#0284C7', color: '#FFF', border: 'none', padding: '0.45rem 0.85rem', borderRadius: '8px', fontSize: '0.78rem', fontWeight: '800', cursor: 'pointer' }}>
                          + Add Packaging Record
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 8: EXPORT DOCUMENTS */}
          {/* ========================================================================= */}
          {activeTab === 'documents' && (
            <div>
              <div style={{ backgroundColor: '#FFFFFF', borderRadius: '20px', padding: '1.5rem', border: '1px solid #E5EBE5', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.35rem', fontWeight: '900', color: '#1B4D2E', margin: '0 0 0.4rem' }}>Export Documents Management</h2>
                <p style={{ fontSize: '0.85rem', color: '#718096', marginBottom: '1.25rem' }}>Upload & manage Commercial Invoices, Packing Lists, Certificates of Origin, Phytosanitary Certificates & Bills of Lading.</p>

                {orders.length === 0 ? (
                  <div style={{ padding: '3rem', textAlign: 'center', color: '#718096', backgroundColor: '#F8FAF8', borderRadius: '14px', fontSize: '0.85rem' }}>
                    No export orders available for document upload.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {orders.map(ord => (
                      <div key={ord.id} style={{ backgroundColor: '#F8FAF8', borderRadius: '12px', padding: '1rem 1.25rem', border: '1px solid #E5EBE5' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                          <div>
                            <div style={{ fontSize: '0.9rem', fontWeight: '900', color: '#1A202C' }}>{ord.order_code} | {ord.buyer_name}</div>
                            <div style={{ fontSize: '0.75rem', color: '#718096' }}>Documents Uploaded: {ord.documents?.length || 0}</div>
                          </div>
                          <button onClick={() => { setSelectedOrder(ord); setShowDocumentModal(true); }} style={{ backgroundColor: '#2E7D32', color: '#FFF', border: 'none', padding: '0.45rem 0.85rem', borderRadius: '8px', fontSize: '0.78rem', fontWeight: '800', cursor: 'pointer' }}>
                            + Upload Export Document
                          </button>
                        </div>

                        {ord.documents && ord.documents.length > 0 && (
                          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                            {ord.documents.map(d => (
                              <span key={d.id} style={{ backgroundColor: '#E0F2FE', color: '#0369A1', padding: '0.25rem 0.6rem', borderRadius: '6px', fontSize: '0.72rem', fontWeight: '800', border: '1px solid #BAE6FD' }}>
                                📄 {d.document_type} (#{d.document_number}) - {d.status}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 9: SHIPMENTS & TRACKING */}
          {/* ========================================================================= */}
          {activeTab === 'shipments' && (
            <div>
              <div style={{ backgroundColor: '#FFFFFF', borderRadius: '20px', padding: '1.5rem', border: '1px solid #E5EBE5', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
                  <div>
                    <h2 style={{ fontSize: '1.35rem', fontWeight: '900', color: '#1B4D2E', margin: 0 }}>Shipments & Visual Step Tracking</h2>
                    <p style={{ fontSize: '0.85rem', color: '#718096', margin: '0.2rem 0 0' }}>Manage carriers, bill of lading tracking numbers, ports and real-time delivery status.</p>
                  </div>
                  <button onClick={() => setShowShipmentModal(true)} style={{ backgroundColor: '#43A047', color: '#FFFFFF', border: 'none', padding: '0.65rem 1.15rem', borderRadius: '12px', fontWeight: '900', fontSize: '0.85rem', cursor: 'pointer' }}>
                    + Create New Shipment
                  </button>
                </div>

                {shipments.length === 0 ? (
                  <div style={{ padding: '3rem', textAlign: 'center', color: '#718096', backgroundColor: '#F8FAF8', borderRadius: '14px', fontSize: '0.85rem' }}>
                    No shipments dispatched yet. Click "+ Create New Shipment" above.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {shipments.map(shp => (
                      <div key={shp.id} style={{ backgroundColor: '#F8FAF8', borderRadius: '14px', padding: '1.25rem', border: '1px solid #E5EBE5' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
                          <div>
                            <div style={{ fontSize: '1.05rem', fontWeight: '900', color: '#1A202C' }}>Tracking #{shp.tracking_number} | Order: {shp.order_code}</div>
                            <div style={{ fontSize: '0.78rem', color: '#718096', fontWeight: '600', margin: '0.2rem 0' }}>
                              Carrier: <strong>{shp.carrier}</strong> ({shp.shipping_method}) • Port: {shp.origin} → <strong>{shp.destination}</strong>
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#4A5568' }}>
                              Dispatch: {shp.dispatch_date} | Est. Arrival: {shp.estimated_delivery}
                            </div>
                          </div>

                          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <select
                              value={shp.status}
                              onChange={e => handleShipmentStatusUpdate(shp.id, e.target.value)}
                              style={{ padding: '0.35rem 0.65rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.75rem', fontWeight: '800', backgroundColor: '#FFF' }}
                            >
                              <option value="PREPARING">PREPARING</option>
                              <option value="READY_FOR_SHIPMENT">READY FOR SHIPMENT</option>
                              <option value="SHIPPED">SHIPPED</option>
                              <option value="IN_TRANSIT">IN TRANSIT</option>
                              <option value="ARRIVED">ARRIVED</option>
                              <option value="DELIVERED">DELIVERED</option>
                            </select>
                          </div>
                        </div>

                        {/* Shipment Visual Tracking Steps */}
                        <div style={{ marginTop: '0.85rem', paddingTop: '0.85rem', borderTop: '1px solid #E5EBE5', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                          {['PREPARING', 'READY_FOR_SHIPMENT', 'SHIPPED', 'IN_TRANSIT', 'ARRIVED', 'DELIVERED'].map((st, i) => {
                            const isDone = ['PREPARING', 'READY_FOR_SHIPMENT', 'SHIPPED', 'IN_TRANSIT', 'ARRIVED', 'DELIVERED'].indexOf(shp.status) >= i;
                            return (
                              <span key={st} style={{
                                fontSize: '0.7rem', fontWeight: '800', padding: '0.2rem 0.5rem', borderRadius: '6px',
                                backgroundColor: isDone ? '#E8F5E9' : '#F1F5F9', color: isDone ? '#2E7D32' : '#94A3B8',
                                border: `1px solid ${isDone ? '#A5D6A7' : '#E2E8F0'}`
                              }}>
                                {isDone ? '✓ ' : ''}{st.replace('_', ' ')}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    ))}
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
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '20px', width: '100%', maxWidth: '600px', padding: '1.75rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '900', color: '#1B4D2E', margin: 0 }}>Export Supply Request Details (#ES-{selectedSupply.id})</h3>
              <button onClick={() => setShowSupplyDetailModal(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#718096' }}><X size={20} /></button>
            </div>

            <div style={{ backgroundColor: '#F8FAF8', borderRadius: '12px', padding: '1rem', border: '1px solid #E5EBE5', fontSize: '0.85rem', lineHeight: 1.8, marginBottom: '1.25rem' }}>
              <div style={{ fontWeight: '900', color: '#2E7D32', marginBottom: '0.35rem' }}>TRADER DETAILS</div>
              <div><strong>Trader Name:</strong> {selectedSupply.trader_name}</div>
              <div><strong>Email:</strong> {selectedSupply.trader_email}</div>
              <div><strong>Phone:</strong> {selectedSupply.trader_phone}</div>
              <div><strong>Location:</strong> {selectedSupply.trader_location || 'Kattappana, Idukki'}</div>

              <div style={{ fontWeight: '900', color: '#2E7D32', margin: '0.75rem 0 0.35rem', borderTop: '1px solid #E5EBE5', paddingTop: '0.5rem' }}>PRODUCT & SUPPLY DETAILS</div>
              <div><strong>Variety:</strong> {selectedSupply.variety}</div>
              <div><strong>Grade:</strong> {selectedSupply.grade}</div>
              <div><strong>Quantity:</strong> {selectedSupply.quantity_kg} KG</div>
              <div><strong>Price per KG:</strong> ₹{parseFloat(selectedSupply.price_per_kg || 0).toLocaleString('en-IN')}</div>
              <div><strong>Total Amount:</strong> <strong style={{ color: '#059669' }}>₹{parseFloat(selectedSupply.total_amount || 0).toLocaleString('en-IN')}</strong></div>
              <div><strong>Batch Code:</strong> {selectedSupply.batch_code}</div>
              <div><strong>Source Inventory:</strong> {selectedSupply.batch_code || `TR-INV-${selectedSupply.id}`}</div>
              <div><strong>Expected Date:</strong> {selectedSupply.expected_supply_date || 'Immediate'}</div>
              <div><strong>Status:</strong> <span style={{ fontWeight: '900', color: '#2E7D32' }}>{selectedSupply.status}</span></div>
              {selectedSupply.notes && <div><strong>Trader Note:</strong> {selectedSupply.notes}</div>}
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              {selectedSupply.status === 'PENDING' && (
                <>
                  <button onClick={() => handleSupplyAction(selectedSupply.id, 'REJECT')} style={{ backgroundColor: '#FFEBEE', color: '#C62828', border: '1px solid #FFCDD2', padding: '0.55rem 1.15rem', borderRadius: '10px', fontWeight: '800', fontSize: '0.85rem', cursor: 'pointer' }}>
                    [ REJECT ]
                  </button>
                  <button onClick={() => handleSupplyAction(selectedSupply.id, 'ACCEPT')} style={{ backgroundColor: '#43A047', color: '#FFFFFF', border: 'none', padding: '0.55rem 1.25rem', borderRadius: '10px', fontWeight: '900', fontSize: '0.85rem', cursor: 'pointer' }}>
                    [ ACCEPT ]
                  </button>
                </>
              )}

              {selectedSupply.status === 'ACCEPTED' && (
                <>
                  <button onClick={() => handleSupplyAction(selectedSupply.id, 'PAY', { payment_method: 'DIRECT', payment_reference: 'DIRECT_PAYMENT_PENDING' })} style={{ backgroundColor: '#FEF3C7', color: '#92400E', border: '1px solid #FDE68A', padding: '0.55rem 1.15rem', borderRadius: '10px', fontWeight: '800', fontSize: '0.85rem', cursor: 'pointer' }}>
                    [ PAY DIRECTLY ]
                  </button>
                  <button onClick={() => handleSupplyAction(selectedSupply.id, 'PAY', { payment_method: 'ONLINE' })} style={{ backgroundColor: '#0284C7', color: '#FFFFFF', border: 'none', padding: '0.55rem 1.25rem', borderRadius: '10px', fontWeight: '900', fontSize: '0.85rem', cursor: 'pointer' }}>
                    [ PAY ONLINE ]
                  </button>
                </>
              )}

              {selectedSupply.status === 'PAYMENT_PENDING' && (
                <button onClick={() => handleSupplyAction(selectedSupply.id, 'CONFIRM_DIRECT_PAYMENT')} style={{ backgroundColor: '#FEF3C7', color: '#92400E', border: '1px solid #FDE68A', padding: '0.55rem 1.15rem', borderRadius: '10px', fontWeight: '800', fontSize: '0.85rem', cursor: 'pointer' }}>
                  ✓ Confirm Direct Payment Received
                </button>
              )}

              {['ACCEPTED', 'PAYMENT_PENDING', 'PAID', 'READY_FOR_RECEIPT'].includes(selectedSupply.status) && (
                <button onClick={() => handleSupplyAction(selectedSupply.id, 'MARK_RECEIVED')} style={{ backgroundColor: '#16A34A', color: '#FFFFFF', border: 'none', padding: '0.55rem 1.25rem', borderRadius: '10px', fontWeight: '900', fontSize: '0.85rem', cursor: 'pointer' }}>
                  ✓ Mark Stock Received & Complete
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
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '20px', width: '100%', maxWidth: '540px', padding: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '900', color: '#1B4D2E', margin: 0 }}>Add International Buyer</h3>
              <button onClick={() => setShowAddBuyerModal(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#718096' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleAddBuyerSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: '800', color: '#2D3748', display: 'block', marginBottom: '0.35rem' }}>Buyer Name *</label>
                <input type="text" required placeholder="e.g. Tariq Al-Mansoor" value={buyerForm.name} onChange={e => setBuyerForm({ ...buyerForm, name: e.target.value })} style={{ width: '100%', padding: '0.6rem', borderRadius: '10px', border: '1px solid #CBD5E1' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: '800', color: '#2D3748', display: 'block', marginBottom: '0.35rem' }}>Company Name *</label>
                <input type="text" required placeholder="e.g. Gulf Spices Trading LLC" value={buyerForm.company_name} onChange={e => setBuyerForm({ ...buyerForm, company_name: e.target.value })} style={{ width: '100%', padding: '0.6rem', borderRadius: '10px', border: '1px solid #CBD5E1' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: '800', color: '#2D3748', display: 'block', marginBottom: '0.35rem' }}>Country *</label>
                <input type="text" required placeholder="e.g. United Arab Emirates" value={buyerForm.country} onChange={e => setBuyerForm({ ...buyerForm, country: e.target.value })} style={{ width: '100%', padding: '0.6rem', borderRadius: '10px', border: '1px solid #CBD5E1' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: '800', color: '#2D3748', display: 'block', marginBottom: '0.35rem' }}>Email Address *</label>
                <input type="email" required placeholder="e.g. tariq@gulfspices.ae" value={buyerForm.email} onChange={e => setBuyerForm({ ...buyerForm, email: e.target.value })} style={{ width: '100%', padding: '0.6rem', borderRadius: '10px', border: '1px solid #CBD5E1' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: '800', color: '#2D3748', display: 'block', marginBottom: '0.35rem' }}>Phone Number</label>
                <input type="text" placeholder="e.g. +971 50 123 4567" value={buyerForm.phone} onChange={e => setBuyerForm({ ...buyerForm, phone: e.target.value })} style={{ width: '100%', padding: '0.6rem', borderRadius: '10px', border: '1px solid #CBD5E1' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: '800', color: '#2D3748', display: 'block', marginBottom: '0.35rem' }}>Address</label>
                <textarea rows="2" placeholder="e.g. Deira Spice Souk, Dubai, UAE" value={buyerForm.address} onChange={e => setBuyerForm({ ...buyerForm, address: e.target.value })} style={{ width: '100%', padding: '0.6rem', borderRadius: '10px', border: '1px solid #CBD5E1' }} />
              </div>
              <button type="submit" style={{ backgroundColor: '#43A047', color: '#FFF', border: 'none', padding: '0.75rem', borderRadius: '10px', fontWeight: '900', cursor: 'pointer' }}>
                Save Buyer Profile
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: CREATE EXPORT ORDER */}
      {showCreateOrderModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '20px', width: '100%', maxWidth: '640px', padding: '1.75rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '900', color: '#1B4D2E', margin: 0 }}>Create Export Order</h3>
              <button onClick={() => setShowCreateOrderModal(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#718096' }}><X size={20} /></button>
            </div>

            <form onSubmit={handleCreateOrderSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: '800', color: '#2D3748', display: 'block', marginBottom: '0.35rem' }}>Select Buyer</label>
                <select value={orderForm.buyer_id} onChange={e => {
                  const bId = e.target.value;
                  const b = buyers.find(x => x.id === parseInt(bId));
                  if (b) {
                    setOrderForm({
                      ...orderForm,
                      buyer_id: bId, buyer_name: b.name, company_name: b.company_name,
                      email: b.email, phone: b.phone, address: b.address, destination_country: b.country
                    });
                  } else {
                    setOrderForm({ ...orderForm, buyer_id: bId });
                  }
                }} style={{ width: '100%', padding: '0.6rem', borderRadius: '10px', border: '1px solid #CBD5E1' }}>
                  <option value="">-- Manual Buyer Input --</option>
                  {buyers.map(b => (
                    <option key={b.id} value={b.id}>{b.name} ({b.company_name} - {b.country})</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: '800', color: '#2D3748', display: 'block', marginBottom: '0.35rem' }}>Buyer Name *</label>
                <input type="text" required value={orderForm.buyer_name} onChange={e => setOrderForm({ ...orderForm, buyer_name: e.target.value })} style={{ width: '100%', padding: '0.6rem', borderRadius: '10px', border: '1px solid #CBD5E1' }} />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: '800', color: '#2D3748', display: 'block', marginBottom: '0.35rem' }}>Destination Country *</label>
                <input type="text" required placeholder="e.g. UAE, Saudi Arabia, Kuwait" value={orderForm.destination_country} onChange={e => setOrderForm({ ...orderForm, destination_country: e.target.value })} style={{ width: '100%', padding: '0.6rem', borderRadius: '10px', border: '1px solid #CBD5E1' }} />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: '800', color: '#2D3748', display: 'block', marginBottom: '0.35rem' }}>Destination Port</label>
                <input type="text" placeholder="e.g. Jebel Ali Port, Dubai" value={orderForm.destination_port} onChange={e => setOrderForm({ ...orderForm, destination_port: e.target.value })} style={{ width: '100%', padding: '0.6rem', borderRadius: '10px', border: '1px solid #CBD5E1' }} />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: '800', color: '#2D3748', display: 'block', marginBottom: '0.35rem' }}>Select Stock from Exporter Inventory</label>
                <select value={orderForm.inventory_item_id} onChange={e => {
                  const invId = e.target.value;
                  const inv = inventory.find(x => x.id === parseInt(invId));
                  if (inv) {
                    setOrderForm({ ...orderForm, inventory_item_id: invId, variety: inv.variety, grade: inv.grade });
                  } else {
                    setOrderForm({ ...orderForm, inventory_item_id: invId });
                  }
                }} style={{ width: '100%', padding: '0.6rem', borderRadius: '10px', border: '1px solid #CBD5E1' }}>
                  <option value="">-- Manual Stock Input --</option>
                  {inventory.filter(i => i.quantity_kg > 0).map(i => (
                    <option key={i.id} value={i.id}>{i.variety} ({i.grade}) - {i.quantity_kg} KG available [Batch: {i.batch_code}]</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: '800', color: '#2D3748', display: 'block', marginBottom: '0.35rem' }}>Cardamom Variety *</label>
                <input type="text" required value={orderForm.variety} onChange={e => setOrderForm({ ...orderForm, variety: e.target.value })} style={{ width: '100%', padding: '0.6rem', borderRadius: '10px', border: '1px solid #CBD5E1' }} />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: '800', color: '#2D3748', display: 'block', marginBottom: '0.35rem' }}>Export Quantity (KG) *</label>
                <input type="number" step="0.01" min="0.01" required placeholder="e.g. 500" value={orderForm.quantity_kg} onChange={e => setOrderForm({ ...orderForm, quantity_kg: e.target.value })} style={{ width: '100%', padding: '0.6rem', borderRadius: '10px', border: '1px solid #CBD5E1' }} />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: '800', color: '#2D3748', display: 'block', marginBottom: '0.35rem' }}>Price per KG ($ USD) *</label>
                <input type="number" step="0.01" min="0.01" required placeholder="e.g. 32.50" value={orderForm.price_per_kg} onChange={e => setOrderForm({ ...orderForm, price_per_kg: e.target.value })} style={{ width: '100%', padding: '0.6rem', borderRadius: '10px', border: '1px solid #CBD5E1' }} />
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <button type="submit" style={{ width: '100%', backgroundColor: '#43A047', color: '#FFF', border: 'none', padding: '0.75rem', borderRadius: '10px', fontWeight: '900', cursor: 'pointer', marginTop: '0.5rem' }}>
                  Create Export Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: QUALITY CHECK */}
      {showQualityModal && selectedOrder && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '20px', width: '100%', maxWidth: '500px', padding: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '900', color: '#1B4D2E', margin: 0 }}>Quality Check ({selectedOrder.order_code})</h3>
              <button onClick={() => setShowQualityModal(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#718096' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleQualitySubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: '800', color: '#2D3748', display: 'block', marginBottom: '0.35rem' }}>Moisture Percentage (%)</label>
                <input type="number" step="0.1" value={qualityForm.moisture_percentage} onChange={e => setQualityForm({ ...qualityForm, moisture_percentage: e.target.value })} style={{ width: '100%', padding: '0.6rem', borderRadius: '10px', border: '1px solid #CBD5E1' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: '800', color: '#2D3748', display: 'block', marginBottom: '0.35rem' }}>Capsule Size (mm)</label>
                <input type="text" value={qualityForm.size_mm} onChange={e => setQualityForm({ ...qualityForm, size_mm: e.target.value })} style={{ width: '100%', padding: '0.6rem', borderRadius: '10px', border: '1px solid #CBD5E1' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: '800', color: '#2D3748', display: 'block', marginBottom: '0.35rem' }}>Quality Status</label>
                <select value={qualityForm.quality_status} onChange={e => setQualityForm({ ...qualityForm, quality_status: e.target.value })} style={{ width: '100%', padding: '0.6rem', borderRadius: '10px', border: '1px solid #CBD5E1' }}>
                  <option value="APPROVED">APPROVED</option>
                  <option value="REJECTED">REJECTED</option>
                </select>
              </div>
              <button type="submit" style={{ backgroundColor: '#43A047', color: '#FFF', border: 'none', padding: '0.75rem', borderRadius: '10px', fontWeight: '900', cursor: 'pointer' }}>
                Save Quality Record
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 6: PACKAGING */}
      {showPackagingModal && selectedOrder && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '20px', width: '100%', maxWidth: '500px', padding: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '900', color: '#1B4D2E', margin: 0 }}>Add Packaging Record ({selectedOrder.order_code})</h3>
              <button onClick={() => setShowPackagingModal(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#718096' }}><X size={20} /></button>
            </div>
            <form onSubmit={handlePackagingSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: '800', color: '#2D3748', display: 'block', marginBottom: '0.35rem' }}>Packaging Type</label>
                <input type="text" value={packagingForm.packaging_type} onChange={e => setPackagingForm({ ...packagingForm, packaging_type: e.target.value })} style={{ width: '100%', padding: '0.6rem', borderRadius: '10px', border: '1px solid #CBD5E1' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: '800', color: '#2D3748', display: 'block', marginBottom: '0.35rem' }}>Number of Packages</label>
                <input type="number" required value={packagingForm.number_of_packages} onChange={e => setPackagingForm({ ...packagingForm, number_of_packages: e.target.value })} style={{ width: '100%', padding: '0.6rem', borderRadius: '10px', border: '1px solid #CBD5E1' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: '800', color: '#2D3748', display: 'block', marginBottom: '0.35rem' }}>Weight per Package (KG)</label>
                <input type="number" step="0.1" required value={packagingForm.weight_per_package_kg} onChange={e => setPackagingForm({ ...packagingForm, weight_per_package_kg: e.target.value })} style={{ width: '100%', padding: '0.6rem', borderRadius: '10px', border: '1px solid #CBD5E1' }} />
              </div>
              <button type="submit" style={{ backgroundColor: '#0284C7', color: '#FFF', border: 'none', padding: '0.75rem', borderRadius: '10px', fontWeight: '900', cursor: 'pointer' }}>
                Save Packaging Details
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 7: UPLOAD DOCUMENT */}
      {showDocumentModal && selectedOrder && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '20px', width: '100%', maxWidth: '500px', padding: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '900', color: '#1B4D2E', margin: 0 }}>Upload Export Document ({selectedOrder.order_code})</h3>
              <button onClick={() => setShowDocumentModal(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#718096' }}><X size={20} /></button>
            </div>
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
                <input type="text" placeholder="e.g. INV-2026-0892" value={documentForm.document_number} onChange={e => setDocumentForm({ ...documentForm, document_number: e.target.value })} style={{ width: '100%', padding: '0.6rem', borderRadius: '10px', border: '1px solid #CBD5E1' }} />
              </div>
              <button type="submit" style={{ backgroundColor: '#2E7D32', color: '#FFF', border: 'none', padding: '0.75rem', borderRadius: '10px', fontWeight: '900', cursor: 'pointer' }}>
                Upload & Verify Document
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 8: CREATE SHIPMENT */}
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
                Create & Dispatch Shipment
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import {
  Sprout, LogOut, ShoppingBag, ShoppingCart, Boxes, Receipt, BarChart3,
  User, Search, Filter, Eye, X, CheckCircle2, AlertCircle, Plus,
  Layers, Bell, ArrowUpRight, ArrowDownRight, Truck, FileText, CheckCircle, Clock
} from 'lucide-react';
import {
  fetchTraderStatsApi,
  fetchTraderMarketplaceApi,
  createTraderPurchaseRequestApi,
  fetchTraderPurchaseRequestsApi,
  fetchTraderPurchaseHistoryApi,
  fetchTraderInventoryApi,
  createTraderInventoryApi,
  fetchTraderSalesApi,
  createTraderSaleApi,
  fetchTraderTransactionsApi,
  fetchTraderExportSuppliesApi,
  createTraderExportSupplyApi,
  fetchTraderReportsApi,
  actionPurchaseRequestApi
} from '../services/api';

const StatusTracker = ({ status }) => {
  const steps = [
    { key: 'PENDING', label: 'PENDING' },
    { key: 'ACCEPTED', label: 'ACCEPTED' },
    { key: 'PAYMENT_PENDING', label: 'PAYMENT PENDING' },
    { key: 'PAID', label: 'PAID' },
    { key: 'READY_FOR_PICKUP', label: 'READY FOR PICKUP' },
    { key: 'PICKUP_CONFIRMED', label: 'PICKUP CONFIRMED' },
    { key: 'COMPLETED', label: 'COMPLETED' },
  ];

  if (status === 'REJECTED') {
    return (
      <div style={{ padding: '0.5rem 0.75rem', backgroundColor: '#FEF2F2', borderRadius: '8px', border: '1px solid #FECACA', display: 'flex', alignItems: 'center', gap: '0.4rem', margin: '0.5rem 0' }}>
        <span style={{ fontSize: '0.72rem', fontWeight: '800', color: '#DC2626' }}>PENDING</span>
        <span style={{ color: '#94A3B8', fontSize: '0.75rem' }}>↓</span>
        <span style={{ fontSize: '0.72rem', fontWeight: '900', color: '#DC2626', backgroundColor: '#FEE2E2', padding: '0.15rem 0.5rem', borderRadius: '4px' }}>REJECTED</span>
      </div>
    );
  }

  if (status === 'CANCELLED') {
    return (
      <div style={{ padding: '0.5rem 0.75rem', backgroundColor: '#F1F5F9', borderRadius: '8px', border: '1px solid #CBD5E1', display: 'flex', alignItems: 'center', gap: '0.4rem', margin: '0.5rem 0' }}>
        <span style={{ fontSize: '0.72rem', fontWeight: '800', color: '#64748B' }}>PENDING</span>
        <span style={{ color: '#94A3B8', fontSize: '0.75rem' }}>↓</span>
        <span style={{ fontSize: '0.72rem', fontWeight: '900', color: '#475569', backgroundColor: '#E2E8F0', padding: '0.15rem 0.5rem', borderRadius: '4px' }}>CANCELLED</span>
      </div>
    );
  }

  const getStepIndex = (st) => {
    switch (st) {
      case 'PENDING': return 0;
      case 'ACCEPTED': return 1;
      case 'PAYMENT_PENDING': return 2;
      case 'PAID': return 3;
      case 'READY_FOR_PICKUP': return 4;
      case 'PICKUP_CONFIRMED': return 5;
      case 'COMPLETED': return 6;
      default: return 0;
    }
  };

  const currentIndex = getStepIndex(status);

  return (
    <div style={{ margin: '0.5rem 0', backgroundColor: '#F8FAFC', padding: '0.6rem 0.75rem', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
      <div style={{ fontSize: '0.68rem', fontWeight: '800', color: '#64748B', textTransform: 'uppercase', marginBottom: '0.35rem', letterSpacing: '0.04em' }}>
        🔄 WORKFLOW STATUS TRACKER
      </div>
      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.25rem' }}>
        {steps.map((step, idx) => {
          const isDone = idx < currentIndex;
          const isCurrent = idx === currentIndex;
          let bg = '#F1F5F9';
          let fg = '#94A3B8';
          let border = '#E2E8F0';

          if (isDone) {
            bg = '#DCFCE7';
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
                fontSize: '0.68rem',
                fontWeight: isCurrent ? '900' : '700',
                padding: '0.15rem 0.45rem',
                borderRadius: '4px',
                backgroundColor: bg,
                color: fg,
                border: `1px solid ${border}`,
                display: 'inline-flex',
                alignItems: 'center'
              }}>
                {isDone ? '✓ ' : isCurrent ? '● ' : ''}{step.label}
              </span>
              {idx < steps.length - 1 && (
                <span style={{ fontSize: '0.68rem', color: isDone ? '#166534' : '#CBD5E1', fontWeight: 'bold' }}>↓</span>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export const TraderDashboard = () => {
  const { user, permissions, logout } = useAuth();
  const navigate = useNavigate();

  // Navigation & UI States
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'marketplace', 'requests', 'inventory', 'sales', 'transactions', 'export_supply', 'reports', 'profile'
  const [purchasesSubTab, setPurchasesSubTab] = useState('requests'); // 'requests', 'history'
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Data States
  const [stats, setStats] = useState(null);
  const [marketplace, setMarketplace] = useState([]);
  const [purchaseRequests, setPurchaseRequests] = useState([]);
  const [purchaseHistory, setPurchaseHistory] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [sales, setSales] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [exportSupplies, setExportSupplies] = useState([]);
  const [exporters, setExporters] = useState([]);
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(false);

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Notifications & Feedback Messages
  const [message, setMessage] = useState({ type: '', text: '' });

  // Modals
  const [selectedListing, setSelectedListing] = useState(null);
  const [showPurchaseRequestModal, setShowPurchaseRequestModal] = useState(false);
  const [showConfirmRequestModal, setShowConfirmRequestModal] = useState(false);
  const [showAddInventoryModal, setShowAddInventoryModal] = useState(false);
  const [showCreateSaleModal, setShowCreateSaleModal] = useState(false);
  const [showCreateExportSupplyModal, setShowCreateExportSupplyModal] = useState(false);
  const [selectedFarmerItem, setSelectedFarmerItem] = useState(null);
  const [showFarmerDetailsModal, setShowFarmerDetailsModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPaymentRequest, setSelectedPaymentRequest] = useState(null);
  const [paymentRefInput, setPaymentRefInput] = useState('');
  const [paymentModeInput, setPaymentModeInput] = useState('UPI');
  const [showTransactionDetailModal, setShowTransactionDetailModal] = useState(false);
  const [selectedTransactionRequest, setSelectedTransactionRequest] = useState(null);

  const handleOpenFarmerDetailsModal = (item) => {
    setSelectedFarmerItem(item);
    setShowFarmerDetailsModal(true);
  };

  // Forms
  const [purchaseForm, setPurchaseForm] = useState({
    farmer_id: '',
    variety: 'Njallani Gold',
    grade: '8mm Bold',
    plantation_id: '',
    listing_id: '',
    available_quantity_kg: '',
    requested_quantity_kg: '',
    price_per_kg: '2000',
    payment_method: 'ONLINE',
    notes: ''
  });

  const [inventoryForm, setInventoryForm] = useState({
    variety: 'Njallani Gold',
    quantity_kg: '',
    grade: '8mm Bold'
  });

  const [saleForm, setSaleForm] = useState({
    variety: 'Njallani Gold',
    quantity_kg: '',
    selling_price_per_kg: '2100',
    buyer: 'Domestic Wholesale Buyer',
    notes: ''
  });

  const [exportForm, setExportForm] = useState({
    exporter_id: '',
    inventory_id: '',
    variety: 'Njallani Gold',
    grade: 'AGEB 8mm',
    quantity_kg: '',
    price_per_kg: '2400',
    expected_supply_date: '',
    notes: ''
  });

  const [profileForm, setProfileForm] = useState({
    full_name: user?.full_name || '',
    phone: user?.phone || ''
  });

  const showNotification = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  // Load Main Dashboard Data
  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const statsRes = await fetchTraderStatsApi().catch(() => ({ success: false }));
      if (statsRes.success) setStats(statsRes.data.stats);
    } catch (err) {
      console.error('Error loading trader stats:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load Tab Content dynamically
  const loadTabContent = async (tab) => {
    setLoading(true);
    try {
      if (tab === 'dashboard') {
        await loadDashboardData();
      } else if (tab === 'marketplace') {
        const res = await fetchTraderMarketplaceApi();
        if (res.success) setMarketplace(res.data.marketplace || []);
      } else if (tab === 'requests') {
        if (purchasesSubTab === 'requests') {
          const res = await fetchTraderPurchaseRequestsApi({ status: statusFilter });
          if (res.success) setPurchaseRequests(res.data.purchase_requests || []);
        } else {
          const res = await fetchTraderPurchaseHistoryApi();
          if (res.success) setPurchaseHistory(res.data.purchase_history || []);
        }
      } else if (tab === 'inventory') {
        const res = await fetchTraderInventoryApi();
        if (res.success) setInventory(res.data.inventory || []);
      } else if (tab === 'sales') {
        const res = await fetchTraderSalesApi();
        if (res.success) setSales(res.data.sales || []);
      } else if (tab === 'transactions') {
        const res = await fetchTraderTransactionsApi();
        if (res.success) setTransactions(res.data.transactions || []);
      } else if (tab === 'export_supply') {
        const [suppliesRes, expRes, invRes] = await Promise.all([
          fetchTraderExportSuppliesApi().catch(() => ({ success: false })),
          fetchTraderExportersApi().catch(() => ({ success: false })),
          fetchTraderInventoryApi().catch(() => ({ success: false }))
        ]);
        if (suppliesRes.success) setExportSupplies(suppliesRes.data.export_supplies || []);
        if (expRes.success) setExporters(expRes.data.exporters || []);
        if (invRes.success) setInventory(invRes.data.inventory || []);
      } else if (tab === 'reports') {
        const res = await fetchTraderReportsApi();
        if (res.success) setReports(res.data.reports || null);
      }
    } catch (err) {
      console.error(`Error loading content for ${tab}:`, err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadDashboardData(); }, []);
  useEffect(() => { loadTabContent(activeTab); }, [activeTab, purchasesSubTab, statusFilter]);

  // Open Purchase Request Modal for a listing
  const handleOpenPurchaseModal = (item) => {
    setSelectedListing(item);
    setPurchaseForm({
      farmer_id: item.farmer_id,
      variety: item.variety,
      grade: item.grade || '8mm Bold',
      plantation_id: item.plantation_id || '',
      listing_id: item.listing_id || item.harvest_record_id || item.inventory_item_id || item.id,
      available_quantity_kg: item.available_quantity_kg,
      requested_quantity_kg: Math.min(50, item.available_quantity_kg).toString(),
      price_per_kg: item.price_per_kg ? item.price_per_kg.toString() : '2000',
      payment_method: 'ONLINE',
      notes: ''
    });
    setShowPurchaseRequestModal(true);
  };

  // Submit Purchase Request Form Confirmation
  const handlePurchaseRequestFormSubmit = (e) => {
    e.preventDefault();
    const reqQty = parseFloat(purchaseForm.requested_quantity_kg);
    const price = parseFloat(purchaseForm.price_per_kg);
    const availQty = parseFloat(purchaseForm.available_quantity_kg);

    if (isNaN(reqQty) || reqQty <= 0) {
      return showNotification('error', 'Requested quantity must be greater than 0 kg');
    }
    if (reqQty > availQty) {
      return showNotification('error', `Requested quantity (${reqQty} kg) cannot exceed available quantity (${availQty} kg)`);
    }
    if (isNaN(price) || price <= 0) {
      return showNotification('error', 'Price per kg must be greater than ₹0');
    }

    setShowConfirmRequestModal(true);
  };

  // Finalize Sending Purchase Request
  const handleSendPurchaseRequestConfirmed = async () => {
    try {
      const res = await createTraderPurchaseRequestApi({
        farmer_id: purchaseForm.farmer_id,
        variety: purchaseForm.variety,
        grade: purchaseForm.grade,
        plantation_id: purchaseForm.plantation_id,
        listing_id: purchaseForm.listing_id,
        available_quantity_kg: purchaseForm.available_quantity_kg,
        requested_quantity_kg: purchaseForm.requested_quantity_kg,
        price_per_kg: purchaseForm.price_per_kg,
        payment_method: purchaseForm.payment_method,
        notes: purchaseForm.notes
      });

      if (res.success) {
        showNotification('success', `Purchase request for ${purchaseForm.requested_quantity_kg} kg of ${purchaseForm.variety} sent to Farmer!`);
        setShowConfirmRequestModal(false);
        setShowPurchaseRequestModal(false);
        setSelectedListing(null);
        loadDashboardData();
      } else {
        showNotification('error', res.message || 'Failed to send purchase request');
      }
    } catch (err) {
      showNotification('error', err.message || 'Error submitting purchase request');
    }
  };

  // Open Online Payment Gateway Modal
  const handleOpenPayOnlineModal = (pr) => {
    setSelectedPaymentRequest(pr);
    setPaymentRefInput(`GATEWAY-REF-${Math.floor(100000 + Math.random() * 900000)}`);
    setShowPaymentModal(true);
  };

  // Submit Online Payment
  const handleTraderSubmitOnlinePayment = async (e) => {
    e.preventDefault();
    if (!selectedPaymentRequest) return;
    try {
      const res = await actionPurchaseRequestApi(selectedPaymentRequest.id, 'PAY_ONLINE', {
        payment_reference: paymentRefInput
      });
      if (res.success) {
        showNotification('success', 'Payment Successful! Stock is marked Ready for Pickup.');
        setShowPaymentModal(false);
        setSelectedPaymentRequest(null);
        loadTabContent('requests');
        loadDashboardData();
      } else {
        showNotification('error', res.message || 'Online payment failed');
      }
    } catch (err) {
      showNotification('error', err.message || 'Error executing online payment');
    }
  };

  // Trader Confirm Pickup
  const handleTraderConfirmPickup = async (requestId) => {
    try {
      const res = await actionPurchaseRequestApi(requestId, 'CONFIRM_PICKUP');
      if (res.success) {
        showNotification('success', 'Pickup confirmed! Transaction completed & stock added to inventory.');
        loadTabContent('requests');
        loadDashboardData();
      } else {
        showNotification('error', res.message || 'Failed to confirm pickup');
      }
    } catch (err) {
      showNotification('error', err.message);
    }
  };

  // Trader Cancel Request
  const handleTraderCancelRequest = async (requestId) => {
    try {
      const res = await actionPurchaseRequestApi(requestId, 'CANCEL');
      if (res.success) {
        showNotification('success', 'Purchase request cancelled.');
        loadTabContent('requests');
        loadDashboardData();
      } else {
        showNotification('error', res.message || 'Failed to cancel request');
      }
    } catch (err) {
      showNotification('error', err.message);
    }
  };

  // Trader Switch Payment Method
  const handleTraderSwitchPaymentMethod = async (requestId, method) => {
    try {
      const res = await actionPurchaseRequestApi(requestId, 'SWITCH_PAYMENT_METHOD', { payment_method: method });
      if (res.success) {
        showNotification('success', `Payment method updated to ${method === 'ONLINE' ? 'Pay Online' : 'Pay Directly'}`);
        loadTabContent('requests');
      } else {
        showNotification('error', res.message || 'Failed to update payment method');
      }
    } catch (err) {
      showNotification('error', err.message);
    }
  };

  // Complete Approved Purchase Request
  const handleCompleteApprovedPurchase = async (requestId) => {
    try {
      const res = await actionPurchaseRequestApi(requestId, 'COMPLETE');
      if (res.success) {
        showNotification('success', 'Purchase completed successfully! Inventory and transactions updated.');
        loadTabContent('requests');
        loadDashboardData();
      } else {
        showNotification('error', res.message || 'Failed to complete purchase');
      }
    } catch (err) {
      showNotification('error', err.message);
    }
  };

  // Submit New Sale
  const handleCreateSaleSubmit = async (e) => {
    e.preventDefault();
    const qty = parseFloat(saleForm.quantity_kg);
    const price = parseFloat(saleForm.selling_price_per_kg);

    if (isNaN(qty) || qty <= 0) return showNotification('error', 'Sale quantity must be greater than 0 kg');
    if (isNaN(price) || price <= 0) return showNotification('error', 'Selling price must be greater than ₹0');

    try {
      const res = await createTraderSaleApi(saleForm);
      if (res.success) {
        showNotification('success', `Sale of ${saleForm.quantity_kg} kg ${saleForm.variety} completed successfully!`);
        setShowCreateSaleModal(false);
        setSaleForm({ variety: 'Njallani Gold', quantity_kg: '', selling_price_per_kg: '2100', buyer: 'Domestic Wholesale Buyer', notes: '' });
        loadTabContent('sales');
        loadDashboardData();
      } else {
        showNotification('error', res.message || 'Failed to create sale');
      }
    } catch (err) {
      showNotification('error', err.message);
    }
  };

  // Submit Export Supply Offer
  const handleCreateExportSupplySubmit = async (e) => {
    e.preventDefault();
    if (!exportForm.exporter_id) return showNotification('error', 'Please select an Exporter');

    const qty = parseFloat(exportForm.quantity_kg);
    const price = parseFloat(exportForm.price_per_kg);

    if (isNaN(qty) || qty <= 0) return showNotification('error', 'Export supply quantity must be greater than 0 KG');
    if (isNaN(price) || price <= 0) return showNotification('error', 'Price per KG must be greater than ₹0');

    if (exportForm.inventory_id) {
      const invItem = inventory.find(i => String(i.id) === String(exportForm.inventory_id));
      if (invItem && qty > parseFloat(invItem.quantity_kg)) {
        return showNotification('error', `Quantity cannot exceed available Trader inventory (${invItem.quantity_kg} KG)`);
      }
    }

    try {
      const res = await createTraderExportSupplyApi(exportForm);
      if (res.success) {
        showNotification('success', `Export supply request for ${exportForm.quantity_kg} KG ${exportForm.variety} sent to Exporter successfully!`);
        setShowCreateExportSupplyModal(false);
        setExportForm({ exporter_id: '', inventory_id: '', variety: 'Njallani Gold', grade: 'AGEB 8mm', quantity_kg: '', price_per_kg: '2400', expected_supply_date: '', notes: '' });
        loadTabContent('export_supply');
        loadDashboardData();
      } else {
        showNotification('error', res.message || 'Failed to submit export supply request');
      }
    } catch (err) {
      showNotification('error', err.message);
    }
  };

  // Sidebar Items
  const sidebarNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Layers },
    { id: 'marketplace', label: 'Marketplace', icon: ShoppingBag, badge: stats?.available_cardamom || 'Live' },
    { id: 'requests', label: 'Purchase Requests', icon: ShoppingCart, badge: stats?.pending_purchase_requests || 0 },
    { id: 'inventory', label: 'My Inventory', icon: Boxes, badge: stats?.current_inventory_kg ? `${stats.current_inventory_kg} kg` : null },
    { id: 'sales', label: 'Sales', icon: Receipt },
    { id: 'transactions', label: 'Transactions', icon: FileText },
    { id: 'export_supply', label: 'Export Supply', icon: Truck },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'profile', label: 'My Profile', icon: User },
  ];

  return (
    <div data-testid="trader-dashboard" style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#F8FAFC', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}>
      
      {/* ========================================================================= */}
      {/* SIDEBAR NAVIGATION */}
      {/* ========================================================================= */}
      <aside style={{
        width: sidebarOpen ? '250px' : '70px',
        backgroundColor: '#FFFFFF',
        borderRight: '1px solid #E2E8F0',
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.2s ease',
        zIndex: 50,
        position: 'sticky',
        top: 0,
        height: '100vh'
      }}>
        {/* Logo Header */}
        <div style={{ padding: '1.25rem 1.25rem 1rem', display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div style={{
            width: '38px', height: '38px', borderRadius: '10px',
            backgroundColor: '#D97706', display: 'flex', alignItems: 'center',
            justifyContent: 'center', color: '#FFFFFF', flexShrink: 0
          }}>
            <Sprout size={20} />
          </div>
          {sidebarOpen && (
            <div>
              <div style={{ fontSize: '1.15rem', fontWeight: '900', color: '#78350F', letterSpacing: '-0.02em', lineHeight: '1.1' }}>
                Carda<span style={{ color: '#D97706' }}>Link</span>
              </div>
              <div style={{ fontSize: '0.65rem', fontWeight: '800', color: '#D97706', letterSpacing: '0.06em', textTransform: 'uppercase', marginTop: '2px' }}>
                TRADER COMMERCIAL PORTAL
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Nav Items */}
        <nav style={{ flex: 1, padding: '0.75rem 0.65rem', overflowY: 'auto' }}>
          {sidebarNavItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                data-testid={item.id}
                onClick={() => setActiveTab(item.id)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: sidebarOpen ? 'space-between' : 'center',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '12px',
                  border: 'none',
                  backgroundColor: isActive ? '#FEF3C7' : 'transparent',
                  color: isActive ? '#92400E' : '#475569',
                  fontSize: '0.85rem',
                  fontWeight: isActive ? '800' : '600',
                  cursor: 'pointer',
                  marginBottom: '0.25rem',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Icon size={18} color={isActive ? '#D97706' : '#64748B'} />
                  {sidebarOpen && <span>{item.label}</span>}
                </div>
                {sidebarOpen && item.badge !== undefined && item.badge !== null && (
                  <span style={{
                    fontSize: '0.7rem',
                    fontWeight: '800',
                    padding: '0.15rem 0.5rem',
                    borderRadius: '999px',
                    backgroundColor: isActive ? '#FDE68A' : '#F1F5F9',
                    color: isActive ? '#92400E' : '#475569',
                    border: '1px solid #FCD34D'
                  }}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Logout */}
        <div style={{ padding: '0.85rem', borderTop: '1px solid #E2E8F0' }}>
          <button
            data-testid="logout-btn"
            onClick={handleLogout}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.6rem 0.75rem', borderRadius: '10px', border: 'none',
              backgroundColor: 'transparent', color: '#EF4444', fontSize: '0.85rem',
              fontWeight: '700', cursor: 'pointer', justifyContent: sidebarOpen ? 'flex-start' : 'center'
            }}
          >
            <LogOut size={16} />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* MAIN CONTENT AREA */}
      {/* ========================================================================= */}
      <main style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        
        {/* Top Bar */}
        <header style={{
          backgroundColor: '#FFFFFF',
          borderBottom: '1px solid #E2E8F0',
          padding: '0.85rem 2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 40
        }}>
          <div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: '900', color: '#1E293B', margin: 0 }}>
              {activeTab === 'dashboard' ? 'Trader Dashboard' : activeTab.charAt(0).toUpperCase() + activeTab.slice(1).replace('_', ' ')}
            </h1>
            <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: '600', marginTop: '2px' }}>
              IAM Role: TRADER | Account Status: <span style={{ color: '#059669', fontWeight: '800' }}>APPROVED ✓</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              backgroundColor: '#FEF3C7', color: '#92400E', border: '1px solid #FDE68A',
              padding: '0.35rem 0.85rem', borderRadius: '999px', fontSize: '0.78rem',
              fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.35rem'
            }}>
              ⚖️ Cardamom Trading Desk
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', paddingLeft: '0.5rem', borderLeft: '1px solid #E2E8F0' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#D97706', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '0.9rem' }}>
                {user?.full_name ? user.full_name.charAt(0) : 'T'}
              </div>
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: '800', color: '#1E293B', lineHeight: '1.2' }}>{user?.full_name || 'Trader User'}</div>
                <div style={{ fontSize: '0.7rem', color: '#D97706', fontWeight: '700' }}>{user?.email}</div>
              </div>
            </div>
          </div>
        </header>

        {/* Global Notification Banner */}
        {message.text && (
          <div style={{
            margin: '1rem 2rem 0', padding: '0.85rem 1.25rem', borderRadius: '12px',
            backgroundColor: message.type === 'success' ? '#ECFDF5' : '#FEF2F2',
            color: message.type === 'success' ? '#047857' : '#B91C1C',
            border: `1px solid ${message.type === 'success' ? '#A7F3D0' : '#FECACA'}`,
            display: 'flex', alignItems: 'center', gap: '0.65rem', fontWeight: '700', fontSize: '0.88rem'
          }}>
            {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            {message.text}
          </div>
        )}

        {/* Content Body Container */}
        <div style={{ padding: '1.75rem 2rem', flex: 1 }}>

          {/* ========================================================================= */}
          {/* TAB 1: TRADER DASHBOARD OVERVIEW */}
          {/* ========================================================================= */}
          {activeTab === 'dashboard' && (
            <div>
              {/* Welcome Banner */}
              <div style={{
                backgroundColor: '#FFFFFF', borderRadius: '20px', padding: '1.5rem 1.75rem',
                border: '1px solid #E2E8F0', marginBottom: '1.5rem', boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}>
                <div>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: '900', color: '#1E293B', margin: 0 }}>
                    Welcome back, {user?.full_name || 'Trader'} 👋
                  </h2>
                  <p style={{ fontSize: '0.88rem', color: '#64748B', margin: '0.3rem 0 0', fontWeight: '500' }}>
                    Commercial Intermediary Portal for Cardamom Sourcing & Wholesale Sales.
                  </p>
                </div>
                <button onClick={() => setActiveTab('marketplace')} className="btn btn-primary" style={{ padding: '0.6rem 1.2rem', fontSize: '0.85rem', backgroundColor: '#D97706', borderColor: '#D97706' }}>
                  <ShoppingBag size={16} /> Browse Marketplace
                </button>
              </div>

              {/* Stat Cards Grid (7 REAL DB Metrics) */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                
                {/* 1. Available Cardamom */}
                <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '1.25rem', border: '1px solid #E2E8F0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: '800', color: '#64748B' }}>Available Cardamom</span>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <ShoppingBag size={16} />
                    </div>
                  </div>
                  <div style={{ fontSize: '1.8rem', fontWeight: '900', color: '#1E293B', margin: '0.4rem 0 0.1rem' }}>
                    {stats?.available_cardamom ?? 0}
                  </div>
                  <div style={{ fontSize: '0.75rem', fontWeight: '800', color: '#D97706' }}>Farmer Batches Open</div>
                </div>

                {/* 2. Pending Requests */}
                <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '1.25rem', border: '1px solid #E2E8F0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: '800', color: '#64748B' }}>Pending Purchase Requests</span>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#E0F2FE', color: '#0284C7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <ShoppingCart size={16} />
                    </div>
                  </div>
                  <div style={{ fontSize: '1.8rem', fontWeight: '900', color: '#1E293B', margin: '0.4rem 0 0.1rem' }}>
                    {stats?.pending_purchase_requests ?? 0}
                  </div>
                  <div style={{ fontSize: '0.75rem', fontWeight: '800', color: '#0284C7' }}>Awaiting Farmer Approval</div>
                </div>

                {/* 3. Total Purchased */}
                <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '1.25rem', border: '1px solid #E2E8F0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: '800', color: '#64748B' }}>Total Purchased</span>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#ECFDF5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <CheckCircle size={16} />
                    </div>
                  </div>
                  <div style={{ fontSize: '1.8rem', fontWeight: '900', color: '#1E293B', margin: '0.4rem 0 0.1rem' }}>
                    {stats?.total_purchased_kg ? `${stats.total_purchased_kg} kg` : '0 kg'}
                  </div>
                  <div style={{ fontSize: '0.75rem', fontWeight: '800', color: '#059669' }}>Completed Sourcing</div>
                </div>

                {/* 4. Current Inventory */}
                <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '1.25rem', border: '1px solid #E2E8F0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: '800', color: '#64748B' }}>Current Inventory</span>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Boxes size={16} />
                    </div>
                  </div>
                  <div style={{ fontSize: '1.8rem', fontWeight: '900', color: '#1E293B', margin: '0.4rem 0 0.1rem' }}>
                    {stats?.current_inventory_kg ? `${stats.current_inventory_kg} kg` : '0 kg'}
                  </div>
                  <div style={{ fontSize: '0.75rem', fontWeight: '800', color: '#D97706' }}>In Stock</div>
                </div>

                {/* 5. Total Sales */}
                <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '1.25rem', border: '1px solid #E2E8F0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: '800', color: '#64748B' }}>Total Sales</span>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#ECFDF5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Receipt size={16} />
                    </div>
                  </div>
                  <div style={{ fontSize: '1.8rem', fontWeight: '900', color: '#1E293B', margin: '0.4rem 0 0.1rem' }}>
                    ₹{(stats?.total_sales || 0).toLocaleString('en-IN')}
                  </div>
                  <div style={{ fontSize: '0.75rem', fontWeight: '800', color: '#059669' }}>Total Revenue</div>
                </div>

                {/* 6. Active Export Orders */}
                <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '1.25rem', border: '1px solid #E2E8F0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: '800', color: '#64748B' }}>Active Export Offers</span>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#F3E8FF', color: '#9333EA', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Truck size={16} />
                    </div>
                  </div>
                  <div style={{ fontSize: '1.8rem', fontWeight: '900', color: '#1E293B', margin: '0.4rem 0 0.1rem' }}>
                    {stats?.active_orders ?? 0}
                  </div>
                  <div style={{ fontSize: '0.75rem', fontWeight: '800', color: '#9333EA' }}>Offers Pending/Accepted</div>
                </div>

                {/* 7. Transactions */}
                <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '1.25rem', border: '1px solid #E2E8F0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: '800', color: '#64748B' }}>Transactions</span>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#F1F5F9', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <FileText size={16} />
                    </div>
                  </div>
                  <div style={{ fontSize: '1.8rem', fontWeight: '900', color: '#1E293B', margin: '0.4rem 0 0.1rem' }}>
                    {stats?.transactions ?? 0}
                  </div>
                  <div style={{ fontSize: '0.75rem', fontWeight: '800', color: '#475569' }}>Financial Logs</div>
                </div>

              </div>

              {/* Shortcut Navigation Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem' }}>
                <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '1.5rem', border: '1px solid #E2E8F0' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#1E293B', margin: '0 0 0.5rem' }}>🛒 Cardamom Marketplace</h3>
                  <p style={{ fontSize: '0.85rem', color: '#64748B', lineHeight: 1.5, marginBottom: '1rem' }}>
                    Browse dried cardamom offered by registered cardamom farmers across Idukki & Western Ghats plantations.
                  </p>
                  <button onClick={() => setActiveTab('marketplace')} className="btn btn-secondary" style={{ width: '100%' }}>
                    Explore Marketplace Listings →
                  </button>
                </div>

                <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '1.5rem', border: '1px solid #E2E8F0' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#1E293B', margin: '0 0 0.5rem' }}>📦 Stock & Inventory</h3>
                  <p style={{ fontSize: '0.85rem', color: '#64748B', lineHeight: 1.5, marginBottom: '1rem' }}>
                    Track your purchased cardamom inventory, batch codes, and prepare wholesale lots for domestic or export buyers.
                  </p>
                  <button onClick={() => setActiveTab('inventory')} className="btn btn-secondary" style={{ width: '100%' }}>
                    Manage My Inventory →
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: MARKETPLACE / AVAILABLE CARDAMOM */}
          {/* ========================================================================= */}
          {activeTab === 'marketplace' && (
            <div data-testid="marketplace">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.35rem', fontWeight: '900', color: '#1E293B', margin: 0 }}>Marketplace — Available Cardamom</h2>
                  <p style={{ fontSize: '0.85rem', color: '#64748B', margin: '0.2rem 0 0' }}>Farmers with available cardamom stock ready for purchase request.</p>
                </div>
              </div>

              {/* Filter / Search Bar */}
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
                  <Search size={18} color="#94A3B8" style={{ position: 'absolute', left: '12px', top: '12px' }} />
                  <input
                    type="text"
                    placeholder="Search by variety, farmer name, or location..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ width: '100%', paddingLeft: '38px', height: '42px', borderRadius: '10px', border: '1px solid #E2E8F0', fontSize: '0.88rem' }}
                  />
                </div>
              </div>

              {/* Empty State */}
              {marketplace.length === 0 ? (
                <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '4rem 2rem', textAlign: 'center', border: '1px solid #E2E8F0' }}>
                  <ShoppingBag size={48} color="#CBD5E1" style={{ margin: '0 auto 1rem' }} />
                  <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#475569', margin: '0 0 0.5rem' }}>No cardamom available yet.</h3>
                  <p style={{ fontSize: '0.88rem', color: '#94A3B8', margin: 0 }}>No farmers have listed available dry cured harvest for sale at the moment.</p>
                </div>
              ) : (
                /* Marketplace Cards Grid */
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
                  {marketplace
                    .filter(m => !searchTerm || m.variety.toLowerCase().includes(searchTerm.toLowerCase()) || m.farmer_name.toLowerCase().includes(searchTerm.toLowerCase()) || (m.location && m.location.toLowerCase().includes(searchTerm.toLowerCase())))
                    .map(item => (
                      <div key={item.id} style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '1.5rem', border: '1px solid #E2E8F0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                            <span style={{ backgroundColor: '#FEF3C7', color: '#92400E', fontSize: '0.75rem', fontWeight: '800', padding: '0.25rem 0.65rem', borderRadius: '999px', border: '1px solid #FDE68A' }}>
                              {item.variety}
                            </span>
                            <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748B' }}>
                              Grade: {item.grade}
                            </span>
                          </div>

                          <h3 style={{ fontSize: '1.2rem', fontWeight: '900', color: '#1E293B', margin: '0 0 0.25rem' }}>
                            {item.available_quantity_kg} {item.unit || 'KG'}
                          </h3>
                          <div style={{ fontSize: '0.9rem', fontWeight: '800', color: '#D97706', marginBottom: '0.85rem' }}>
                            ₹{item.price_per_kg?.toLocaleString('en-IN') || '1,800'} / kg
                          </div>

                          <div style={{ fontSize: '0.82rem', color: '#475569', lineHeight: 1.6, padding: '0.75rem', backgroundColor: '#F8FAFC', borderRadius: '10px', border: '1px solid #F1F5F9', marginBottom: '1rem' }}>
                            <div>👨‍🌾 <strong>Farmer:</strong> {item.farmer_name}</div>
                            <div>📍 <strong>Estate/Location:</strong> {item.plantation_name || 'Cardamom Estate'}, {item.location || 'Idukki'}</div>
                            <div>📅 <strong>Available Date:</strong> {item.available_date}</div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                          <button
                            data-testid="view-farmer-details"
                            onClick={() => handleOpenFarmerDetailsModal(item)}
                            className="btn btn-secondary"
                            style={{ flex: 1, padding: '0.6rem 0.4rem', fontSize: '0.78rem', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}
                          >
                            <User size={14} /> View Farmer Details
                          </button>
                          <button
                            data-testid="view-cardamom"
                            onClick={() => handleOpenPurchaseModal(item)}
                            className="btn btn-primary"
                            style={{ flex: 1, backgroundColor: '#D97706', borderColor: '#D97706', padding: '0.6rem 0.4rem', fontSize: '0.78rem', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}
                          >
                            <ShoppingCart size={14} /> Purchase Request
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: PURCHASES (PURCHASE REQUESTS & PURCHASE HISTORY) */}
          {/* ========================================================================= */}
          {activeTab === 'requests' && (
            <div data-testid="purchase-requests">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.35rem', fontWeight: '900', color: '#1E293B', margin: 0 }}>Trader Purchases</h2>
                  <p style={{ fontSize: '0.85rem', color: '#64748B', margin: '0.2rem 0 0' }}>Track your submitted purchase requests and completed sourcing history.</p>
                </div>

                {/* Sub-tab Switcher */}
                <div style={{ display: 'flex', backgroundColor: '#E2E8F0', padding: '3px', borderRadius: '10px' }}>
                  <button
                    onClick={() => setPurchasesSubTab('requests')}
                    style={{
                      padding: '0.4rem 1rem', borderRadius: '8px', border: 'none',
                      backgroundColor: purchasesSubTab === 'requests' ? '#FFFFFF' : 'transparent',
                      color: purchasesSubTab === 'requests' ? '#92400E' : '#64748B',
                      fontWeight: '800', fontSize: '0.82rem', cursor: 'pointer'
                    }}
                  >
                    Purchase Requests
                  </button>
                  <button
                    onClick={() => setPurchasesSubTab('history')}
                    style={{
                      padding: '0.4rem 1rem', borderRadius: '8px', border: 'none',
                      backgroundColor: purchasesSubTab === 'history' ? '#FFFFFF' : 'transparent',
                      color: purchasesSubTab === 'history' ? '#92400E' : '#64748B',
                      fontWeight: '800', fontSize: '0.82rem', cursor: 'pointer'
                    }}
                  >
                    Purchase History
                  </button>
                </div>
              </div>

              {/* Status Filter */}
              {purchasesSubTab === 'requests' && (
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
                  {['', 'PENDING', 'PAYMENT_PENDING', 'PAID', 'READY_FOR_PICKUP', 'COMPLETED', 'REJECTED', 'CANCELLED'].map(status => (
                    <button
                      key={status}
                      onClick={() => setStatusFilter(status)}
                      style={{
                        padding: '0.35rem 0.85rem', borderRadius: '999px', fontSize: '0.78rem', fontWeight: '800',
                        border: '1px solid #CBD5E1', cursor: 'pointer',
                        backgroundColor: statusFilter === status ? '#FEF3C7' : '#FFFFFF',
                        color: statusFilter === status ? '#92400E' : '#475569'
                      }}
                    >
                      {status ? status.replace('_', ' ') : 'ALL STATUSES'}
                    </button>
                  ))}
                </div>
              )}

              {/* Requests / History Cards */}
              {(purchasesSubTab === 'requests' ? purchaseRequests : purchaseHistory).length === 0 ? (
                <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '4rem 2rem', textAlign: 'center', border: '1px solid #E2E8F0' }}>
                  <ShoppingCart size={48} color="#CBD5E1" style={{ margin: '0 auto 1rem' }} />
                  <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#475569', margin: '0 0 0.5rem' }}>
                    {purchasesSubTab === 'requests' ? 'No purchase requests found.' : 'No completed purchase history.'}
                  </h3>
                  <p style={{ fontSize: '0.88rem', color: '#94A3B8', margin: 0 }}>Browse the marketplace to send purchase requests to cardamom farmers.</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.25rem' }}>
                  {(purchasesSubTab === 'requests' ? purchaseRequests : purchaseHistory).map(pr => (
                    <div key={pr.id} style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '1.5rem', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div>
                        {/* Header ID & Badge */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                          <span style={{ fontSize: '0.88rem', fontWeight: '900', color: '#1E293B' }}>#PR-{pr.id}</span>
                          <span style={{
                            padding: '0.25rem 0.65rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: '800',
                            backgroundColor: pr.status === 'COMPLETED' ? '#ECFDF5' : pr.status === 'PAID' || pr.status === 'READY_FOR_PICKUP' ? '#EFF6FF' : pr.status === 'REJECTED' || pr.status === 'CANCELLED' ? '#FEF2F2' : '#FEF3C7',
                            color: pr.status === 'COMPLETED' ? '#059669' : pr.status === 'PAID' || pr.status === 'READY_FOR_PICKUP' ? '#2563EB' : pr.status === 'REJECTED' || pr.status === 'CANCELLED' ? '#DC2626' : '#D97706',
                            border: `1px solid ${pr.status === 'COMPLETED' ? '#A7F3D0' : pr.status === 'PAID' || pr.status === 'READY_FOR_PICKUP' ? '#BFDBFE' : pr.status === 'REJECTED' || pr.status === 'CANCELLED' ? '#FECACA' : '#FDE68A'}`
                          }}>
                            {pr.status}
                          </span>
                        </div>

                        {/* Visual Status Tracker Stepper */}
                        <StatusTracker status={pr.status} />

                        {/* Farmer & Plantation Details */}
                        <div style={{ backgroundColor: '#F8FAFC', borderRadius: '10px', padding: '0.85rem', border: '1px solid #F1F5F9', marginBottom: '0.85rem', fontSize: '0.82rem', lineHeight: 1.6 }}>
                          <div style={{ fontSize: '0.72rem', fontWeight: '900', color: '#92400E', textTransform: 'uppercase', marginBottom: '0.25rem' }}>👨‍🌾 FARMER DETAILS</div>
                          <div><strong>Farmer Name:</strong> {pr.farmer_name}</div>
                          <div><strong>Estate/Location:</strong> {pr.plantation_name || 'Cardamom Plantation'}, {pr.trader_location || 'Idukki'}</div>
                          {pr.trader_phone && <div><strong>Contact:</strong> {pr.trader_phone}</div>}
                        </div>

                        {/* Purchase & Payment Details */}
                        <div style={{ backgroundColor: '#FFFBEB', borderRadius: '10px', padding: '0.85rem', border: '1px solid #FEF3C7', marginBottom: '0.85rem', fontSize: '0.82rem', lineHeight: 1.6 }}>
                          <div style={{ fontSize: '0.72rem', fontWeight: '900', color: '#B45309', textTransform: 'uppercase', marginBottom: '0.25rem' }}>🛒 PURCHASE DETAILS</div>
                          <div><strong>Variety:</strong> {pr.variety} ({pr.grade || '8mm Bold'})</div>
                          <div><strong>Requested Qty:</strong> <strong>{pr.requested_quantity_kg} KG</strong></div>
                          <div><strong>Price per KG:</strong> ₹{parseFloat(pr.price_per_kg).toLocaleString('en-IN')}</div>
                          <div><strong>Total Amount:</strong> <span style={{ fontSize: '1.05rem', fontWeight: '900', color: '#92400E' }}>₹{parseFloat(pr.total_amount).toLocaleString('en-IN')}</span></div>
                          <div><strong>Payment Method:</strong> <span style={{ fontWeight: '800', color: '#475569' }}>{pr.payment_method === 'DIRECT' ? 'Direct Payment' : 'Pay Online'}</span></div>
                          <div><strong>Payment Status:</strong> <span style={{ fontWeight: '800', color: pr.payment_status === 'PAID' ? '#059669' : '#D97706' }}>{pr.payment_status || 'PENDING'}</span></div>
                          {pr.payment_reference && <div style={{ fontSize: '0.75rem', color: '#64748B', wordBreak: 'break-all' }}><strong>Ref:</strong> {pr.payment_reference}</div>}
                          <div><strong>Request Date:</strong> {pr.request_date || (pr.created_at ? pr.created_at.split('T')[0] : '-')}</div>
                          {pr.completion_date && <div><strong>Completion Date:</strong> {pr.completion_date}</div>}
                          {pr.notes ? <div><strong>Note:</strong> {pr.notes}</div> : null}
                        </div>
                      </div>

                      {/* Action Buttons based on Status */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                        {pr.status === 'PENDING' && (
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                              onClick={() => handleTraderCancelRequest(pr.id)}
                              style={{ flex: 1, padding: '0.5rem', borderRadius: '8px', border: '1px solid #CBD5E1', backgroundColor: '#FFFFFF', color: '#64748B', fontWeight: '800', fontSize: '0.78rem', cursor: 'pointer' }}
                            >
                              Cancel Request
                            </button>
                          </div>
                        )}

                        {(pr.status === 'ACCEPTED' || pr.status === 'PAYMENT_PENDING') && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {pr.payment_method === 'ONLINE' ? (
                              <>
                                <button
                                  onClick={() => handleOpenPayOnlineModal(pr)}
                                  style={{ padding: '0.6rem', borderRadius: '8px', border: 'none', backgroundColor: '#059669', color: '#FFF', fontWeight: '900', fontSize: '0.82rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                                >
                                  💳 Pay Now (Online ₹{parseFloat(pr.total_amount).toLocaleString('en-IN')})
                                </button>
                                <button
                                  onClick={() => handleTraderSwitchPaymentMethod(pr.id, 'DIRECT')}
                                  style={{ padding: '0.4rem', borderRadius: '8px', border: '1px solid #CBD5E1', backgroundColor: '#F8FAFC', color: '#475569', fontWeight: '700', fontSize: '0.75rem', cursor: 'pointer' }}
                                >
                                  Switch to Direct Payment
                                </button>
                              </>
                            ) : (
                              <>
                                <div style={{ fontSize: '0.78rem', color: '#D97706', fontWeight: '800', backgroundColor: '#FEF3C7', padding: '0.5rem', borderRadius: '6px', textAlign: 'center' }}>
                                  🤝 Direct Payment Selected — Awaiting Farmer Confirmation
                                </div>
                                <button
                                  onClick={() => handleTraderSwitchPaymentMethod(pr.id, 'ONLINE')}
                                  style={{ padding: '0.4rem', borderRadius: '8px', border: '1px solid #CBD5E1', backgroundColor: '#F8FAFC', color: '#475569', fontWeight: '700', fontSize: '0.75rem', cursor: 'pointer' }}
                                >
                                  Switch to Pay Online
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => handleTraderCancelRequest(pr.id)}
                              style={{ padding: '0.35rem', borderRadius: '8px', border: 'none', backgroundColor: 'transparent', color: '#94A3B8', fontWeight: '700', fontSize: '0.75rem', cursor: 'pointer' }}
                            >
                              Cancel Request
                            </button>
                          </div>
                        )}

                        {(pr.status === 'PAID' || pr.status === 'READY_FOR_PICKUP') && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                            <div style={{ fontSize: '0.78rem', color: '#059669', fontWeight: '800', backgroundColor: '#ECFDF5', padding: '0.4rem', borderRadius: '6px', textAlign: 'center' }}>
                              ✓ Payment Successful — Stock Ready for Pickup
                            </div>
                            <button
                              onClick={() => handleTraderConfirmPickup(pr.id)}
                              style={{ padding: '0.6rem', borderRadius: '8px', border: 'none', backgroundColor: '#D97706', color: '#FFF', fontWeight: '900', fontSize: '0.82rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                            >
                              🚚 Confirm Pickup & Receive Stock
                            </button>
                          </div>
                        )}

                        {pr.status === 'COMPLETED' && (
                          <button
                            onClick={() => {
                              setSelectedTransactionRequest(pr);
                              setShowTransactionDetailModal(true);
                            }}
                            style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid #059669', backgroundColor: '#ECFDF5', color: '#059669', fontWeight: '800', fontSize: '0.78rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}
                          >
                            ✓ Transaction Completed — View Details
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 4: MY INVENTORY */}
          {/* ========================================================================= */}
          {activeTab === 'inventory' && (
            <div data-testid="inventory">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.35rem', fontWeight: '900', color: '#1E293B', margin: 0 }}>My Cardamom Inventory</h2>
                  <p style={{ fontSize: '0.85rem', color: '#64748B', margin: '0.2rem 0 0' }}>Trader stock sourced from farmers and available for sale/export.</p>
                </div>
                <button onClick={() => setShowAddInventoryModal(true)} className="btn btn-primary" style={{ backgroundColor: '#D97706', borderColor: '#D97706' }}>
                  <Plus size={16} /> Add Custom Batch
                </button>
              </div>

              {inventory.length === 0 ? (
                <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '4rem 2rem', textAlign: 'center', border: '1px solid #E2E8F0' }}>
                  <Boxes size={48} color="#CBD5E1" style={{ margin: '0 auto 1rem' }} />
                  <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#475569', margin: '0 0 0.5rem' }}>Your inventory is empty.</h3>
                  <p style={{ fontSize: '0.88rem', color: '#94A3B8', margin: 0 }}>Sourced purchases will automatically be added to your stock here.</p>
                </div>
              ) : (
                <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B', fontWeight: '800' }}>
                        <th style={{ padding: '0.85rem 1rem' }}>Batch Code</th>
                        <th style={{ padding: '0.85rem 1rem' }}>Variety</th>
                        <th style={{ padding: '0.85rem 1rem' }}>Grade</th>
                        <th style={{ padding: '0.85rem 1rem' }}>Quantity</th>
                        <th style={{ padding: '0.85rem 1rem' }}>Source Farmer</th>
                        <th style={{ padding: '0.85rem 1rem' }}>Plantation / Source</th>
                        <th style={{ padding: '0.85rem 1rem' }}>Price / kg</th>
                        <th style={{ padding: '0.85rem 1rem' }}>Total Cost</th>
                        <th style={{ padding: '0.85rem 1rem' }}>Date Added</th>
                        <th style={{ padding: '0.85rem 1rem' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inventory.map(item => (
                        <tr key={item.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                          <td style={{ padding: '0.85rem 1rem', fontWeight: '800', color: '#1E293B' }}>{item.batch_code}</td>
                          <td style={{ padding: '0.85rem 1rem', fontWeight: '700' }}>{item.variety}</td>
                          <td style={{ padding: '0.85rem 1rem' }}>{item.grade || '8mm Bold'}</td>
                          <td style={{ padding: '0.85rem 1rem', fontWeight: '900', color: '#D97706' }}>{item.quantity_kg} kg</td>
                          <td style={{ padding: '0.85rem 1rem', fontWeight: '700' }}>{item.source_farmer_name || '-'}</td>
                          <td style={{ padding: '0.85rem 1rem' }}>{item.plantation_name || 'Cardamom Estate'}</td>
                          <td style={{ padding: '0.85rem 1rem' }}>{item.purchase_price_per_kg ? `₹${parseFloat(item.purchase_price_per_kg).toLocaleString('en-IN')}` : '-'}</td>
                          <td style={{ padding: '0.85rem 1rem', fontWeight: '800', color: '#92400E' }}>{item.total_cost ? `₹${parseFloat(item.total_cost).toLocaleString('en-IN')}` : '-'}</td>
                          <td style={{ padding: '0.85rem 1rem', color: '#64748B' }}>{item.created_at ? item.created_at.split('T')[0] : '2026-09-30'}</td>
                          <td style={{ padding: '0.85rem 1rem' }}>
                            <span style={{
                              padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.72rem', fontWeight: '800',
                              backgroundColor: item.status === 'IN_STOCK' ? '#ECFDF5' : '#F1F5F9',
                              color: item.status === 'IN_STOCK' ? '#059669' : '#64748B',
                              border: `1px solid ${item.status === 'IN_STOCK' ? '#A7F3D0' : '#CBD5E1'}`
                            }}>
                              {item.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 5: SALES */}
          {/* ========================================================================= */}
          {activeTab === 'sales' && (
            <div data-testid="create-sale">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.35rem', fontWeight: '900', color: '#1E293B', margin: 0 }}>Trader Wholesale Sales</h2>
                  <p style={{ fontSize: '0.85rem', color: '#64748B', margin: '0.2rem 0 0' }}>Sell cardamom from your available inventory stock.</p>
                </div>
                <button onClick={() => setShowCreateSaleModal(true)} className="btn btn-primary" style={{ backgroundColor: '#D97706', borderColor: '#D97706' }}>
                  <Plus size={16} /> Record New Sale
                </button>
              </div>

              {sales.length === 0 ? (
                <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '4rem 2rem', textAlign: 'center', border: '1px solid #E2E8F0' }}>
                  <Receipt size={48} color="#CBD5E1" style={{ margin: '0 auto 1rem' }} />
                  <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#475569', margin: '0 0 0.5rem' }}>No sales recorded yet.</h3>
                  <p style={{ fontSize: '0.88rem', color: '#94A3B8', margin: 0 }}>Sell stock from your inventory to log transactions and calculate gross margin.</p>
                </div>
              ) : (
                <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B', fontWeight: '800' }}>
                        <th style={{ padding: '0.85rem 1rem' }}>Sale ID</th>
                        <th style={{ padding: '0.85rem 1rem' }}>Buyer</th>
                        <th style={{ padding: '0.85rem 1rem' }}>Variety</th>
                        <th style={{ padding: '0.85rem 1rem' }}>Quantity</th>
                        <th style={{ padding: '0.85rem 1rem' }}>Total Amount</th>
                        <th style={{ padding: '0.85rem 1rem' }}>Sale Date</th>
                        <th style={{ padding: '0.85rem 1rem' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sales.map(s => (
                        <tr key={s.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                          <td style={{ padding: '0.85rem 1rem', fontWeight: '800', color: '#1E293B' }}>#SALE-{s.id}</td>
                          <td style={{ padding: '0.85rem 1rem', fontWeight: '700' }}>{s.buyer_name || 'Domestic Buyer'}</td>
                          <td style={{ padding: '0.85rem 1rem' }}>{s.cardamom_variety}</td>
                          <td style={{ padding: '0.85rem 1rem', fontWeight: '800' }}>{s.quantity_kg} kg</td>
                          <td style={{ padding: '0.85rem 1rem', fontWeight: '900', color: '#059669' }}>₹{parseFloat(s.total_amount).toLocaleString('en-IN')}</td>
                          <td style={{ padding: '0.85rem 1rem', color: '#64748B' }}>{s.sale_date}</td>
                          <td style={{ padding: '0.85rem 1rem' }}>
                            <span style={{ padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.72rem', fontWeight: '800', backgroundColor: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0' }}>
                              {s.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 6: TRANSACTIONS */}
          {/* ========================================================================= */}
          {activeTab === 'transactions' && (
            <div data-testid="transactions">
              <h2 style={{ fontSize: '1.35rem', fontWeight: '900', color: '#1E293B', margin: '0 0 0.5rem' }}>Financial Transactions Log</h2>
              <p style={{ fontSize: '0.85rem', color: '#64748B', marginBottom: '1.5rem' }}>Real-time payment logs for trader sourcing purchases and sales.</p>

              {transactions.length === 0 ? (
                <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '4rem 2rem', textAlign: 'center', border: '1px solid #E2E8F0' }}>
                  <FileText size={48} color="#CBD5E1" style={{ margin: '0 auto 1rem' }} />
                  <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#475569', margin: '0 0 0.5rem' }}>No transaction history found.</h3>
                </div>
              ) : (
                <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B', fontWeight: '800' }}>
                        <th style={{ padding: '0.85rem 1rem' }}>TX Code</th>
                        <th style={{ padding: '0.85rem 1rem' }}>Sender</th>
                        <th style={{ padding: '0.85rem 1rem' }}>Receiver</th>
                        <th style={{ padding: '0.85rem 1rem' }}>Amount</th>
                        <th style={{ padding: '0.85rem 1rem' }}>Method</th>
                        <th style={{ padding: '0.85rem 1rem' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map(tx => (
                        <tr key={tx.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                          <td style={{ padding: '0.85rem 1rem', fontWeight: '800', color: '#1E293B' }}>{tx.transaction_code}</td>
                          <td style={{ padding: '0.85rem 1rem' }}>{tx.sender_name}</td>
                          <td style={{ padding: '0.85rem 1rem' }}>{tx.receiver_name}</td>
                          <td style={{ padding: '0.85rem 1rem', fontWeight: '900', color: '#059669' }}>₹{parseFloat(tx.amount).toLocaleString('en-IN')}</td>
                          <td style={{ padding: '0.85rem 1rem' }}>{tx.payment_method}</td>
                          <td style={{ padding: '0.85rem 1rem' }}>
                            <span style={{ padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.72rem', fontWeight: '800', backgroundColor: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0' }}>
                              {tx.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 7: EXPORT SUPPLY */}
          {/* ========================================================================= */}
          {activeTab === 'export_supply' && (
            <div data-testid="export-supply">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.35rem', fontWeight: '900', color: '#1E293B', margin: 0 }}>Export Supply Offers</h2>
                  <p style={{ fontSize: '0.85rem', color: '#64748B', margin: '0.2rem 0 0' }}>Offer your inventory stock to international exporters.</p>
                </div>
                <button onClick={() => setShowCreateExportSupplyModal(true)} className="btn btn-primary" style={{ backgroundColor: '#D97706', borderColor: '#D97706' }}>
                  <Plus size={16} /> Offer for Export
                </button>
              </div>

              {exportSupplies.length === 0 ? (
                <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '4rem 2rem', textAlign: 'center', border: '1px solid #E2E8F0' }}>
                  <Truck size={48} color="#CBD5E1" style={{ margin: '0 auto 1rem' }} />
                  <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#475569', margin: '0 0 0.5rem' }}>No export supply offers submitted yet.</h3>
                </div>
              ) : (
                <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B', fontWeight: '800' }}>
                        <th style={{ padding: '0.85rem 1rem' }}>Offer ID</th>
                        <th style={{ padding: '0.85rem 1rem' }}>Variety</th>
                        <th style={{ padding: '0.85rem 1rem' }}>Quantity</th>
                        <th style={{ padding: '0.85rem 1rem' }}>Offered Price / kg</th>
                        <th style={{ padding: '0.85rem 1rem' }}>Date</th>
                        <th style={{ padding: '0.85rem 1rem' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {exportSupplies.map(es => (
                        <tr key={es.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                          <td style={{ padding: '0.85rem 1rem', fontWeight: '800', color: '#1E293B' }}>#EXP-{es.id}</td>
                          <td style={{ padding: '0.85rem 1rem', fontWeight: '700' }}>{es.variety}</td>
                          <td style={{ padding: '0.85rem 1rem', fontWeight: '800' }}>{es.quantity_kg} kg</td>
                          <td style={{ padding: '0.85rem 1rem' }}>₹{parseFloat(es.price_per_kg).toLocaleString('en-IN')}</td>
                          <td style={{ padding: '0.85rem 1rem', color: '#64748B' }}>{es.created_at ? es.created_at.split('T')[0] : '2026-09-18'}</td>
                          <td style={{ padding: '0.85rem 1rem' }}>
                            <span style={{ padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.72rem', fontWeight: '800', backgroundColor: '#FEF3C7', color: '#92400E', border: '1px solid #FDE68A' }}>
                              {es.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 8: REPORTS & GROSS MARGIN */}
          {/* ========================================================================= */}
          {activeTab === 'reports' && (
            <div data-testid="reports">
              <h2 style={{ fontSize: '1.35rem', fontWeight: '900', color: '#1E293B', margin: '0 0 0.5rem' }}>Trader Financial & Stock Reports</h2>
              <p style={{ fontSize: '0.85rem', color: '#64748B', marginBottom: '1.5rem' }}>Calculated from real PostgreSQL database records.</p>

              {reports && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
                  {/* Purchase Report */}
                  <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '1.5rem', border: '1px solid #E2E8F0' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: '800', color: '#92400E', margin: '0 0 1rem' }}>🛒 Purchase Report</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.88rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Total Sourced Qty:</span>
                        <strong>{reports.purchase_report?.total_quantity_purchased_kg} kg</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Total Purchase Value:</span>
                        <strong>₹{reports.purchase_report?.total_purchase_value?.toLocaleString('en-IN')}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Unique Farmers Sourced:</span>
                        <strong>{reports.purchase_report?.number_of_farmers}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Inventory Report */}
                  <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '1.5rem', border: '1px solid #E2E8F0' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: '800', color: '#0284C7', margin: '0 0 1rem' }}>📦 Inventory Report</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.88rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Current Available Stock:</span>
                        <strong>{reports.inventory_report?.current_stock_kg} kg</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Total Sourced:</span>
                        <strong>{reports.inventory_report?.total_purchased_kg} kg</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Total Sold:</span>
                        <strong>{reports.inventory_report?.total_sold_kg} kg</strong>
                      </div>
                    </div>
                  </div>

                  {/* Sales & Gross Margin Report */}
                  <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '1.5rem', border: '1px solid #E2E8F0' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: '800', color: '#059669', margin: '0 0 1rem' }}>💰 Sales & Gross Margin Report</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.88rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Sales Revenue:</span>
                        <strong>₹{reports.margin_report?.sales_value?.toLocaleString('en-IN')}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Sourcing Purchase Cost:</span>
                        <strong>₹{reports.margin_report?.purchase_value?.toLocaleString('en-IN')}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #E2E8F0', paddingTop: '0.5rem', marginTop: '0.25rem' }}>
                        <span>Gross Margin (Sales - Cost):</span>
                        <strong style={{ color: reports.margin_report?.gross_margin >= 0 ? '#059669' : '#DC2626', fontSize: '1.05rem' }}>
                          ₹{reports.margin_report?.gross_margin?.toLocaleString('en-IN')}
                        </strong>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 9: MY PROFILE */}
          {/* ========================================================================= */}
          {activeTab === 'profile' && (
            <div data-testid="my-profile">
              <div style={{ backgroundColor: '#FFFFFF', borderRadius: '20px', padding: '2rem', maxWidth: '600px', margin: '0 auto', border: '1px solid #E2E8F0' }}>
                <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                  <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#D97706', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '1.5rem', margin: '0 auto 0.75rem' }}>
                    {user?.full_name ? user.full_name.charAt(0) : 'T'}
                  </div>
                  <h2 style={{ fontSize: '1.35rem', fontWeight: '900', color: '#1E293B', margin: 0 }}>{user?.full_name}</h2>
                  <div style={{ fontSize: '0.85rem', color: '#D97706', fontWeight: '700', marginTop: '4px' }}>ROLE: {user?.role}</div>
                </div>

                <div style={{ backgroundColor: '#F8FAFC', borderRadius: '12px', padding: '1rem', border: '1px solid #F1F5F9', marginBottom: '1.25rem', fontSize: '0.85rem', lineHeight: 1.8 }}>
                  <div><strong>Email Address:</strong> {user?.email}</div>
                  <div><strong>Phone Number:</strong> {user?.phone}</div>
                  <div><strong>Account Status:</strong> <span style={{ color: '#059669', fontWeight: '800' }}>{user?.status}</span></div>
                  <div><strong>Permissions Granted:</strong> {permissions?.join(', ')}</div>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* ========================================================================= */}
      {/* MODAL 1: PURCHASE REQUEST FORM */}
      {/* ========================================================================= */}
      {showPurchaseRequestModal && selectedListing && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '20px', width: '100%', maxWidth: '540px', padding: '1.75rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '900', color: '#1E293B', margin: 0 }}>Send Purchase Request</h3>
              <button onClick={() => setShowPurchaseRequestModal(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#64748B' }}><X size={20} /></button>
            </div>

            <form onSubmit={handlePurchaseRequestFormSubmit}>
              <div style={{ backgroundColor: '#FEF3C7', padding: '0.85rem', borderRadius: '10px', fontSize: '0.85rem', color: '#92400E', marginBottom: '1rem', border: '1px solid #FDE68A' }}>
                <div>👨‍🌾 <strong>Farmer:</strong> {selectedListing.farmer_name}</div>
                <div>🌱 <strong>Variety:</strong> {selectedListing.variety}</div>
                <div>📦 <strong>Available Stock:</strong> {selectedListing.available_quantity_kg} kg</div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '800', color: '#475569', marginBottom: '0.35rem' }}>Requested Quantity (KG):</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={purchaseForm.requested_quantity_kg}
                  onChange={(e) => setPurchaseForm({ ...purchaseForm, requested_quantity_kg: e.target.value })}
                  style={{ width: '100%', height: '42px', padding: '0 0.75rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem' }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '800', color: '#475569', marginBottom: '0.35rem' }}>Offered Price per KG (₹):</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={purchaseForm.price_per_kg}
                  onChange={(e) => setPurchaseForm({ ...purchaseForm, price_per_kg: e.target.value })}
                  style={{ width: '100%', height: '42px', padding: '0 0.75rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem' }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '800', color: '#475569', marginBottom: '0.35rem' }}>Payment Method:</label>
                <select
                  value={purchaseForm.payment_method}
                  onChange={(e) => setPurchaseForm({ ...purchaseForm, payment_method: e.target.value })}
                  style={{ width: '100%', height: '42px', padding: '0 0.75rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem' }}
                >
                  <option value="ONLINE">Pay Online (Card / UPI / NetBanking Gateway)</option>
                  <option value="DIRECT">Pay Directly (Handover Direct Payment)</option>
                </select>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '800', color: '#475569', marginBottom: '0.35rem' }}>Optional Note / Special Instructions:</label>
                <textarea
                  rows={2}
                  value={purchaseForm.notes}
                  onChange={(e) => setPurchaseForm({ ...purchaseForm, notes: e.target.value })}
                  placeholder="E.g., Preferred pickup time or quality requirement..."
                  style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.88rem' }}
                />
              </div>

              {/* Dynamic Calculation */}
              <div style={{ backgroundColor: '#F8FAFC', padding: '1rem', borderRadius: '12px', border: '1px solid #E2E8F0', marginBottom: '1.25rem', textAlign: 'right' }}>
                <div style={{ fontSize: '0.8rem', color: '#64748B' }}>Dynamically Calculated Total:</div>
                <div style={{ fontSize: '1.4rem', fontWeight: '900', color: '#92400E' }}>
                  ₹{((parseFloat(purchaseForm.requested_quantity_kg) || 0) * (parseFloat(purchaseForm.price_per_kg) || 0)).toLocaleString('en-IN')}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button type="button" onClick={() => setShowPurchaseRequestModal(false)} className="btn btn-secondary" style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, backgroundColor: '#D97706', borderColor: '#D97706' }}>Review & Send →</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: CONFIRMATION MODAL BEFORE SENDING */}
      {/* ========================================================================= */}
      {showConfirmRequestModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 110, padding: '1rem' }}>
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '20px', width: '100%', maxWidth: '440px', padding: '1.75rem', textAlign: 'center' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '900', color: '#1E293B', margin: '0 0 0.75rem' }}>Confirm Purchase Request</h3>
            <p style={{ fontSize: '0.9rem', color: '#475569', lineHeight: 1.5, marginBottom: '1.25rem' }}>
              Send purchase request for <strong>{purchaseForm.requested_quantity_kg} kg</strong> of <strong>{purchaseForm.variety}</strong> at <strong>₹{purchaseForm.price_per_kg}/kg</strong> (Total: <strong>₹{((parseFloat(purchaseForm.requested_quantity_kg) || 0) * (parseFloat(purchaseForm.price_per_kg) || 0)).toLocaleString('en-IN')}</strong>)?<br/>
              Payment Method: <strong>{purchaseForm.payment_method === 'DIRECT' ? 'Direct Payment' : 'Pay Online'}</strong>
            </p>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={() => setShowConfirmRequestModal(false)} className="btn btn-secondary" style={{ flex: 1 }}>Cancel</button>
              <button onClick={handleSendPurchaseRequestConfirmed} className="btn btn-primary" style={{ flex: 1, backgroundColor: '#D97706', borderColor: '#D97706' }}>
                Send Request ✓
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ONLINE PAYMENT GATEWAY MODAL */}
      {/* ========================================================================= */}
      {showPaymentModal && selectedPaymentRequest && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 120, padding: '1rem' }}>
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '20px', width: '100%', maxWidth: '480px', padding: '1.75rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '900', color: '#059669', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                💳 CardaLink Payment Gateway
              </h3>
              <button onClick={() => setShowPaymentModal(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#64748B' }}><X size={20} /></button>
            </div>

            <form onSubmit={handleTraderSubmitOnlinePayment}>
              <div style={{ backgroundColor: '#ECFDF5', padding: '1rem', borderRadius: '12px', border: '1px solid #A7F3D0', marginBottom: '1.25rem', fontSize: '0.88rem' }}>
                <div><strong>Order ID:</strong> #PR-{selectedPaymentRequest.id}</div>
                <div><strong>Farmer:</strong> {selectedPaymentRequest.farmer_name}</div>
                <div><strong>Variety / Grade:</strong> {selectedPaymentRequest.variety} ({selectedPaymentRequest.grade || '8mm Bold'})</div>
                <div><strong>Quantity:</strong> {selectedPaymentRequest.requested_quantity_kg} KG</div>
                <div style={{ fontSize: '1.25rem', fontWeight: '900', color: '#059669', marginTop: '0.5rem' }}>
                  Amount Payable: ₹{parseFloat(selectedPaymentRequest.total_amount).toLocaleString('en-IN')}
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '800', color: '#475569', marginBottom: '0.35rem' }}>Payment Mode:</label>
                <select
                  value={paymentModeInput}
                  onChange={(e) => setPaymentModeInput(e.target.value)}
                  style={{ width: '100%', height: '42px', padding: '0 0.75rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem' }}
                >
                  <option value="UPI">UPI (Google Pay / PhonePe / Paytm)</option>
                  <option value="CARD">Credit / Debit Card</option>
                  <option value="NETBANKING">NetBanking</option>
                </select>
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '800', color: '#475569', marginBottom: '0.35rem' }}>Gateway Reference / Transaction ID:</label>
                <input
                  type="text"
                  required
                  value={paymentRefInput}
                  onChange={(e) => setPaymentRefInput(e.target.value)}
                  style={{ width: '100%', height: '42px', padding: '0 0.75rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem', fontFamily: 'monospace' }}
                />
                <span style={{ fontSize: '0.75rem', color: '#64748B' }}>Verified securely via CardaLink Payment Gateway</span>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button type="button" onClick={() => setShowPaymentModal(false)} className="btn btn-secondary" style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, backgroundColor: '#059669', borderColor: '#059669', fontWeight: '900' }}>
                  Pay ₹{parseFloat(selectedPaymentRequest.total_amount).toLocaleString('en-IN')} ✓
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: TRANSACTION DETAILS MODAL */}
      {/* ========================================================================= */}
      {showTransactionDetailModal && selectedTransactionRequest && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 120, padding: '1rem' }}>
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '20px', width: '100%', maxWidth: '520px', padding: '1.75rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '900', color: '#059669', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                ✓ Completed Transaction Details
              </h3>
              <button onClick={() => setShowTransactionDetailModal(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#64748B' }}><X size={20} /></button>
            </div>

            <div style={{ backgroundColor: '#F8FAFC', borderRadius: '12px', padding: '1.25rem', border: '1px solid #E2E8F0', fontSize: '0.88rem', lineHeight: 1.8 }}>
              <div><strong>Request ID:</strong> #PR-{selectedTransactionRequest.id}</div>
              <div><strong>Farmer Name:</strong> {selectedTransactionRequest.farmer_name}</div>
              <div><strong>Plantation:</strong> {selectedTransactionRequest.plantation_name || 'Cardamom Estate'}</div>
              <div><strong>Variety:</strong> {selectedTransactionRequest.variety}</div>
              <div><strong>Grade:</strong> {selectedTransactionRequest.grade || '8mm Bold'}</div>
              <div><strong>Transferred Quantity:</strong> {selectedTransactionRequest.requested_quantity_kg} KG</div>
              <div><strong>Price per KG:</strong> ₹{parseFloat(selectedTransactionRequest.price_per_kg).toLocaleString('en-IN')}</div>
              <div><strong>Total Amount Paid:</strong> <strong style={{ color: '#059669', fontSize: '1.1rem' }}>₹{parseFloat(selectedTransactionRequest.total_amount).toLocaleString('en-IN')}</strong></div>
              <div><strong>Payment Method:</strong> {selectedTransactionRequest.payment_method === 'DIRECT' ? 'Direct Payment' : 'Pay Online'}</div>
              <div><strong>Payment Status:</strong> <span style={{ color: '#059669', fontWeight: '900' }}>PAID</span></div>
              {selectedTransactionRequest.payment_reference && <div><strong>Payment Reference:</strong> {selectedTransactionRequest.payment_reference}</div>}
              <div><strong>Pickup Confirmation:</strong> Confirmed & Received</div>
              <div><strong>Overall Status:</strong> <span style={{ color: '#059669', fontWeight: '900' }}>COMPLETED</span></div>
              {selectedTransactionRequest.completion_date && <div><strong>Completion Date:</strong> {selectedTransactionRequest.completion_date}</div>}
            </div>

            <div style={{ marginTop: '1.25rem', textAlign: 'right' }}>
              <button onClick={() => setShowTransactionDetailModal(false)} className="btn btn-secondary" style={{ padding: '0.5rem 1.25rem' }}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: CREATE SALE FORM */}
      {/* ========================================================================= */}
      {showCreateSaleModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '20px', width: '100%', maxWidth: '500px', padding: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '900', color: '#1E293B', margin: 0 }}>Record New Wholesale Sale</h3>
              <button onClick={() => setShowCreateSaleModal(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#64748B' }}><X size={20} /></button>
            </div>

            <form onSubmit={handleCreateSaleSubmit}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '800', color: '#475569', marginBottom: '0.35rem' }}>Variety:</label>
                <select
                  value={saleForm.variety}
                  onChange={(e) => setSaleForm({ ...saleForm, variety: e.target.value })}
                  style={{ width: '100%', height: '42px', padding: '0 0.75rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem' }}
                >
                  <option value="Njallani Gold">Njallani Gold</option>
                  <option value="Green Gold">Green Gold</option>
                  <option value="Vanderperiyar">Vanderperiyar</option>
                </select>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '800', color: '#475569', marginBottom: '0.35rem' }}>Sale Quantity (KG):</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={saleForm.quantity_kg}
                  onChange={(e) => setSaleForm({ ...saleForm, quantity_kg: e.target.value })}
                  style={{ width: '100%', height: '42px', padding: '0 0.75rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem' }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '800', color: '#475569', marginBottom: '0.35rem' }}>Selling Price per KG (₹):</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={saleForm.selling_price_per_kg}
                  onChange={(e) => setSaleForm({ ...saleForm, selling_price_per_kg: e.target.value })}
                  style={{ width: '100%', height: '42px', padding: '0 0.75rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem' }}
                />
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '800', color: '#475569', marginBottom: '0.35rem' }}>Buyer Info / Company:</label>
                <input
                  type="text"
                  value={saleForm.buyer}
                  onChange={(e) => setSaleForm({ ...saleForm, buyer: e.target.value })}
                  style={{ width: '100%', height: '42px', padding: '0 0.75rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button type="button" onClick={() => setShowCreateSaleModal(false)} className="btn btn-secondary" style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, backgroundColor: '#D97706', borderColor: '#D97706' }}>Confirm Sale ✓</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: CREATE EXPORT SUPPLY FORM */}
      {/* ========================================================================= */}
      {showCreateExportSupplyModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '20px', width: '100%', maxWidth: '520px', padding: '1.75rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '900', color: '#1E293B', margin: 0 }}>Send Export Supply Request</h3>
              <button onClick={() => setShowCreateExportSupplyModal(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#64748B' }}><X size={20} /></button>
            </div>

            <form onSubmit={handleCreateExportSupplySubmit}>
              {/* EXPORTER SELECTION */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '800', color: '#475569', marginBottom: '0.35rem' }}>Exporter *:</label>
                <select
                  required
                  value={exportForm.exporter_id}
                  onChange={(e) => setExportForm({ ...exportForm, exporter_id: e.target.value })}
                  style={{ width: '100%', height: '42px', padding: '0 0.75rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem', backgroundColor: '#FFF' }}
                >
                  <option value="">-- Select Approved Exporter --</option>
                  {exporters.map(exp => (
                    <option key={exp.id} value={exp.id}>{exp.full_name} ({exp.email})</option>
                  ))}
                </select>
              </div>

              {/* INVENTORY SELECTION */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '800', color: '#475569', marginBottom: '0.35rem' }}>Select Trader Inventory Item (Optional):</label>
                <select
                  value={exportForm.inventory_id}
                  onChange={(e) => {
                    const selId = e.target.value;
                    const item = inventory.find(i => String(i.id) === String(selId));
                    if (item) {
                      setExportForm({
                        ...exportForm,
                        inventory_id: selId,
                        variety: item.variety,
                        grade: item.grade || 'AGEB 8mm',
                        quantity_kg: exportForm.quantity_kg || String(item.quantity_kg)
                      });
                    } else {
                      setExportForm({ ...exportForm, inventory_id: selId });
                    }
                  }}
                  style={{ width: '100%', height: '42px', padding: '0 0.75rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.88rem', backgroundColor: '#FFF' }}
                >
                  <option value="">-- Choose from available stock --</option>
                  {inventory.filter(i => parseFloat(i.quantity_kg) > 0).map(inv => (
                    <option key={inv.id} value={inv.id}>
                      {inv.batch_code} | {inv.variety} ({inv.grade}) - {inv.quantity_kg} KG available
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '800', color: '#475569', marginBottom: '0.35rem' }}>Variety *:</label>
                  <input
                    type="text"
                    required
                    value={exportForm.variety}
                    onChange={(e) => setExportForm({ ...exportForm, variety: e.target.value })}
                    style={{ width: '100%', height: '42px', padding: '0 0.75rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '800', color: '#475569', marginBottom: '0.35rem' }}>Grade *:</label>
                  <input
                    type="text"
                    required
                    value={exportForm.grade}
                    onChange={(e) => setExportForm({ ...exportForm, grade: e.target.value })}
                    style={{ width: '100%', height: '42px', padding: '0 0.75rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '800', color: '#475569', marginBottom: '0.35rem' }}>Supply Quantity (KG) *:</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={exportForm.quantity_kg}
                    onChange={(e) => setExportForm({ ...exportForm, quantity_kg: e.target.value })}
                    style={{ width: '100%', height: '42px', padding: '0 0.75rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '800', color: '#475569', marginBottom: '0.35rem' }}>Price per KG (₹) *:</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={exportForm.price_per_kg}
                    onChange={(e) => setExportForm({ ...exportForm, price_per_kg: e.target.value })}
                    style={{ width: '100%', height: '42px', padding: '0 0.75rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem' }}
                  />
                </div>
              </div>

              {/* TOTAL AMOUNT CALCULATED DISPLAY */}
              <div style={{ backgroundColor: '#FEF3C7', padding: '0.75rem 1rem', borderRadius: '10px', fontSize: '0.88rem', color: '#92400E', fontWeight: '900', marginBottom: '1rem', border: '1px solid #FDE68A', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Total Amount (₹):</span>
                <span style={{ fontSize: '1.1rem', color: '#D97706' }}>
                  ₹{((parseFloat(exportForm.quantity_kg) || 0) * (parseFloat(exportForm.price_per_kg) || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '800', color: '#475569', marginBottom: '0.35rem' }}>Expected Supply Date:</label>
                <input
                  type="date"
                  value={exportForm.expected_supply_date}
                  onChange={(e) => setExportForm({ ...exportForm, expected_supply_date: e.target.value })}
                  style={{ width: '100%', height: '42px', padding: '0 0.75rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem' }}
                />
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '800', color: '#475569', marginBottom: '0.35rem' }}>Trader Note:</label>
                <input
                  type="text"
                  placeholder="Special packaging or quality remarks..."
                  value={exportForm.notes}
                  onChange={(e) => setExportForm({ ...exportForm, notes: e.target.value })}
                  style={{ width: '100%', height: '42px', padding: '0 0.75rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button type="button" onClick={() => setShowCreateExportSupplyModal(false)} className="btn btn-secondary" style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1.5, backgroundColor: '#D97706', borderColor: '#D97706', fontWeight: '900' }}>[ Send Export Supply Request ]</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: VIEW FARMER DETAILS */}
      {/* ========================================================================= */}
      {showFarmerDetailsModal && selectedFarmerItem && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '24px', width: '100%', maxWidth: '460px', padding: '2rem', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '900', color: '#1E293B', margin: 0 }}>👨‍🌾 Farmer Details</h3>
                <span style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: '600' }}>Verified Plantation Sourcing Info</span>
              </div>
              <button onClick={() => setShowFarmerDetailsModal(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#64748B' }}><X size={22} /></button>
            </div>

            <div style={{ backgroundColor: '#F8FAFC', borderRadius: '16px', padding: '1.25rem', border: '1px solid #E2E8F0', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: '900', color: '#D97706', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.85rem' }}>
                FARMER DETAILS
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.88rem', color: '#1E293B', lineHeight: 1.5 }}>
                <div><strong>Farmer Name:</strong> {selectedFarmerItem.farmer_name}</div>
                <div><strong>Phone Number:</strong> {selectedFarmerItem.farmer_phone || '-'}</div>
                <div><strong>Location / Address:</strong> {selectedFarmerItem.plantation_name ? `${selectedFarmerItem.plantation_name}, ` : ''}{selectedFarmerItem.location || 'Idukki'}</div>
                <div><strong>Cardamom Variety:</strong> {selectedFarmerItem.variety}</div>
                <div><strong>Grade:</strong> {selectedFarmerItem.grade || '8mm Bold'}</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setShowFarmerDetailsModal(false)}
                className="btn btn-secondary"
                style={{ flex: 1, padding: '0.65rem', fontWeight: '800' }}
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  const item = selectedFarmerItem;
                  setShowFarmerDetailsModal(false);
                  handleOpenPurchaseModal(item);
                }}
                className="btn btn-primary"
                style={{ flex: 1, backgroundColor: '#D97706', borderColor: '#D97706', padding: '0.65rem', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}
              >
                <ShoppingCart size={15} /> Purchase Request →
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

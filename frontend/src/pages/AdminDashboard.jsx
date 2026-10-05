import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import {
  Sprout, LogOut, Users, Shield, RefreshCw, LayoutDashboard,
  TreePine, Flower2, Wheat, Package, Droplets, Bug, CloudRain,
  DollarSign, ShoppingCart, CreditCard, Globe, FileText, Truck,
  Bell, BarChart3, UserCheck, AlertTriangle, CheckCircle, Search,
  Filter, ChevronLeft, ChevronRight, Eye, X, UserX, UserPlus, ShieldAlert
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  fetchUsersApi, updateUserStatusApi, fetchAuditLogsApi, fetchAdminStatsApi,
  fetchPendingApprovalsApi, fetchAdminPlantationsApi, fetchAdminVarietiesApi,
  fetchAdminHarvestsApi, fetchAdminInventoryApi, fetchAdminAgrochemicalsApi,
  fetchAdminIrrigationApi, fetchAdminExpensesApi, fetchAdminSalesApi,
  fetchAdminTransactionsApi, fetchAdminExportOrdersApi, fetchAdminExportDocumentsApi,
  fetchAdminShipmentsApi, fetchAdminNotificationsApi, fetchAdminReportsApi
} from '../services/api';

export const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Active View Navigation State
  const [activeSection, setActiveSection] = useState('dashboard');
  const [activeSubView, setActiveSubView] = useState('');

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Data States
  const [stats, setStats] = useState(null);
  const [usersList, setUsersList] = useState([]);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [plantations, setPlantations] = useState([]);
  const [varieties, setVarieties] = useState([]);
  const [harvests, setHarvests] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [agrochemicals, setAgrochemicals] = useState([]);
  const [irrigations, setIrrigations] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [sales, setSales] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [exportOrders, setExportOrders] = useState([]);
  const [exportDocs, setExportDocs] = useState([]);
  const [shipments, setShipments] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [reports, setReports] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);

  // UI States
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const [modalUser, setModalUser] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null); // { user, newStatus }

  // Load All System Data from PostgreSQL
  const loadAllData = async () => {
    setLoading(true);
    setActionError('');
    try {
      const [
        statsRes, usersRes, pendingRes, plantRes, varRes, harvestRes, invRes,
        agroRes, irrRes, expRes, salesRes, txnRes, expOrdersRes, expDocsRes,
        shipRes, notifRes, repRes, logsRes
      ] = await Promise.all([
        fetchAdminStatsApi().catch(() => null),
        fetchUsersApi().catch(() => null),
        fetchPendingApprovalsApi().catch(() => null),
        fetchAdminPlantationsApi().catch(() => null),
        fetchAdminVarietiesApi().catch(() => null),
        fetchAdminHarvestsApi().catch(() => null),
        fetchAdminInventoryApi().catch(() => null),
        fetchAdminAgrochemicalsApi().catch(() => null),
        fetchAdminIrrigationApi().catch(() => null),
        fetchAdminExpensesApi().catch(() => null),
        fetchAdminSalesApi().catch(() => null),
        fetchAdminTransactionsApi().catch(() => null),
        fetchAdminExportOrdersApi().catch(() => null),
        fetchAdminExportDocumentsApi().catch(() => null),
        fetchAdminShipmentsApi().catch(() => null),
        fetchAdminNotificationsApi().catch(() => null),
        fetchAdminReportsApi().catch(() => null),
        fetchAuditLogsApi(100).catch(() => null),
      ]);

      if (statsRes?.success) setStats(statsRes.data.stats);
      if (usersRes?.success) setUsersList(usersRes.data.users);
      if (pendingRes?.success) setPendingUsers(pendingRes.data.users);
      if (plantRes?.success) setPlantations(plantRes.data.plantations);
      if (varRes?.success) setVarieties(varRes.data.varieties);
      if (harvestRes?.success) setHarvests(harvestRes.data.harvests);
      if (invRes?.success) setInventory(invRes.data.inventory);
      if (agroRes?.success) setAgrochemicals(agroRes.data.records);
      if (irrRes?.success) setIrrigations(irrRes.data.irrigations);
      if (expRes?.success) setExpenses(expRes.data.expenses);
      if (salesRes?.success) setSales(salesRes.data.sales);
      if (txnRes?.success) setTransactions(txnRes.data.transactions);
      if (expOrdersRes?.success) setExportOrders(expOrdersRes.data.export_orders);
      if (expDocsRes?.success) setExportDocs(expDocsRes.data.documents);
      if (shipRes?.success) setShipments(shipRes.data.shipments);
      if (notifRes?.success) setNotifications(notifRes.data.notifications);
      if (repRes?.success) setReports(repRes.data.reports);
      if (logsRes?.success) setAuditLogs(logsRes.data.logs);
    } catch (err) {
      setActionError('Error synchronizing real-time PostgreSQL database records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Status Change Handler with Verification & Audit Log
  const handleStatusChange = async (targetUserId, newStatus) => {
    setActionError('');
    setActionSuccess('');
    try {
      const res = await updateUserStatusApi(targetUserId, newStatus);
      if (res.success) {
        setActionSuccess(`Account #${targetUserId} status successfully set to [${newStatus}].`);
        setConfirmAction(null);
        setModalUser(null);
        loadAllData();
      } else {
        setActionError(res.message || 'Failed to update user status.');
      }
    } catch (err) {
      setActionError(err.message || 'Error executing account status update.');
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  // Filter Helper Function for Users
  const getFilteredUsers = (roleFilterParam = 'ALL', statusFilterParam = 'ALL') => {
    return usersList.filter((u) => {
      const matchRole = roleFilterParam === 'ALL' || u.role === roleFilterParam;
      const matchStatus = statusFilterParam === 'ALL' || u.status === statusFilterParam;
      const matchQuery = !searchQuery ||
        u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.phone?.includes(searchQuery);
      return matchRole && matchStatus && matchQuery;
    });
  };

  // Render Sidebar Sub-item Navigation
  const navItemClass = (sec, sub = '') => {
    const isSelected = activeSection === sec && (sub === '' || activeSubView === sub);
    return {
      display: 'flex',
      alignItems: 'center',
      gap: '0.65rem',
      padding: '0.65rem 1rem',
      borderRadius: '10px',
      fontSize: '0.875rem',
      fontWeight: isSelected ? '700' : '500',
      color: isSelected ? '#FFFFFF' : '#94A3B8',
      backgroundColor: isSelected ? '#15803D' : 'transparent',
      cursor: 'pointer',
      transition: 'all 0.15s ease',
      border: 'none',
      width: '100%',
      textAlign: 'left',
      marginBottom: '0.2rem',
    };
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', backgroundColor: '#F8FAFC', color: '#1E293B', fontFamily: 'Inter, system-ui, sans-serif' }}>
      
      {/* LEFT SIDEBAR NAVIGATION */}
      <aside style={{
        width: '260px',
        backgroundColor: '#073B1E',
        color: '#F8FAFC',
        display: 'flex',
        flexDirection: 'column',
        borderRight: '1px solid #14532D',
        position: 'sticky',
        top: 0,
        height: '100vh',
        overflowY: 'auto',
        flexShrink: 0,
      }}>
        {/* Brand Header */}
        <div style={{ padding: '1.5rem 1.25rem', borderBottom: '1px solid #14532D', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '12px', backgroundColor: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF' }}>
            <Sprout size={22} />
          </div>
          <div>
            <div style={{ fontSize: '1.2rem', fontWeight: '800', color: '#FFFFFF', letterSpacing: '-0.02em' }}>
              Carda<span style={{ color: '#4ADE80' }}>Link</span>
            </div>
            <div style={{ fontSize: '0.7rem', color: '#86EFAC', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Admin Portal
            </div>
          </div>
        </div>

        {/* Sidebar Menu Groups */}
        <div style={{ padding: '1rem 0.75rem', flex: 1 }}>
          
          {/* Main Dashboard */}
          <button onClick={() => { setActiveSection('dashboard'); setActiveSubView(''); setSearchQuery(''); setCurrentPage(1); }} style={navItemClass('dashboard')}>
            <LayoutDashboard size={18} /> Overview Dashboard
          </button>

          {/* User Management Section */}
          <div style={{ margin: '1.25rem 0 0.4rem 0.75rem', fontSize: '0.7rem', fontWeight: '800', color: '#4ADE80', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            User Management
          </div>
          <button onClick={() => { setActiveSection('users'); setActiveSubView('all'); setRoleFilter('ALL'); setStatusFilter('ALL'); setSearchQuery(''); setCurrentPage(1); }} style={navItemClass('users', 'all')}>
            <Users size={16} /> All Users ({usersList.length})
          </button>
          <button onClick={() => { setActiveSection('users'); setActiveSubView('farmers'); setRoleFilter('FARMER'); setStatusFilter('ALL'); setSearchQuery(''); setCurrentPage(1); }} style={navItemClass('users', 'farmers')}>
            <TreePine size={16} /> Farmers ({usersList.filter(u=>u.role==='FARMER').length})
          </button>
          <button onClick={() => { setActiveSection('users'); setActiveSubView('traders'); setRoleFilter('TRADER'); setStatusFilter('ALL'); setSearchQuery(''); setCurrentPage(1); }} style={navItemClass('users', 'traders')}>
            <ShoppingCart size={16} /> Traders ({usersList.filter(u=>u.role==='TRADER').length})
          </button>
          <button onClick={() => { setActiveSection('users'); setActiveSubView('exporters'); setRoleFilter('EXPORTER'); setStatusFilter('ALL'); setSearchQuery(''); setCurrentPage(1); }} style={navItemClass('users', 'exporters')}>
            <Globe size={16} /> Exporters ({usersList.filter(u=>u.role==='EXPORTER').length})
          </button>
          <button onClick={() => { setActiveSection('users'); setActiveSubView('pending'); setRoleFilter('ALL'); setStatusFilter('PENDING'); setSearchQuery(''); setCurrentPage(1); }} style={navItemClass('users', 'pending')}>
            <UserCheck size={16} /> Pending ({pendingUsers.length})
          </button>

          {/* Plantation Management Section */}
          <div style={{ margin: '1.25rem 0 0.4rem 0.75rem', fontSize: '0.7rem', fontWeight: '800', color: '#4ADE80', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Plantation Management
          </div>
          <button onClick={() => { setActiveSection('plantations'); setActiveSubView('list'); }} style={navItemClass('plantations', 'list')}>
            <TreePine size={16} /> Plantations ({plantations.length})
          </button>
          <button onClick={() => { setActiveSection('plantations'); setActiveSubView('varieties'); }} style={navItemClass('plantations', 'varieties')}>
            <Flower2 size={16} /> Cardamom Varieties
          </button>
          <button onClick={() => { setActiveSection('plantations'); setActiveSubView('harvests'); }} style={navItemClass('plantations', 'harvests')}>
            <Wheat size={16} /> Harvest Records
          </button>
          <button onClick={() => { setActiveSection('plantations'); setActiveSubView('inventory'); }} style={navItemClass('plantations', 'inventory')}>
            <Package size={16} /> Overall Inventory
          </button>
          <button onClick={() => { setActiveSection('plantations'); setActiveSubView('fertilizer'); }} style={navItemClass('plantations', 'fertilizer')}>
            <Droplets size={16} /> Fertilizer Usage
          </button>
          <button onClick={() => { setActiveSection('plantations'); setActiveSubView('pesticide'); }} style={navItemClass('plantations', 'pesticide')}>
            <Bug size={16} /> Pesticide Usage
          </button>
          <button onClick={() => { setActiveSection('plantations'); setActiveSubView('irrigation'); }} style={navItemClass('plantations', 'irrigation')}>
            <CloudRain size={16} /> Irrigation Records
          </button>
          <button onClick={() => { setActiveSection('plantations'); setActiveSubView('expenses'); }} style={navItemClass('plantations', 'expenses')}>
            <DollarSign size={16} /> Expenses
          </button>
          <button onClick={() => { setActiveSection('plantations'); setActiveSubView('sales'); }} style={navItemClass('plantations', 'sales')}>
            <ShoppingCart size={16} /> Domestic Sales
          </button>
          <button onClick={() => { setActiveSection('plantations'); setActiveSubView('transactions'); }} style={navItemClass('plantations', 'transactions')}>
            <CreditCard size={16} /> Transactions
          </button>

          {/* Export Management Section */}
          <div style={{ margin: '1.25rem 0 0.4rem 0.75rem', fontSize: '0.7rem', fontWeight: '800', color: '#4ADE80', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Export Management
          </div>
          <button onClick={() => { setActiveSection('export'); setActiveSubView('orders'); }} style={navItemClass('export', 'orders')}>
            <Globe size={16} /> Export Orders ({exportOrders.length})
          </button>
          <button onClick={() => { setActiveSection('export'); setActiveSubView('documents'); }} style={navItemClass('export', 'documents')}>
            <FileText size={16} /> Export Documents
          </button>
          <button onClick={() => { setActiveSection('export'); setActiveSubView('shipments'); }} style={navItemClass('export', 'shipments')}>
            <Truck size={16} /> Shipments & Tracking
          </button>

          {/* System Section */}
          <div style={{ margin: '1.25rem 0 0.4rem 0.75rem', fontSize: '0.7rem', fontWeight: '800', color: '#4ADE80', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            System & Security
          </div>
          <button onClick={() => { setActiveSection('system'); setActiveSubView('notifications'); }} style={navItemClass('system', 'notifications')}>
            <Bell size={16} /> Notifications
          </button>
          <button onClick={() => { setActiveSection('system'); setActiveSubView('reports'); }} style={navItemClass('system', 'reports')}>
            <BarChart3 size={16} /> System Reports
          </button>
          <button onClick={() => { setActiveSection('system'); setActiveSubView('logs'); }} style={navItemClass('system', 'logs')}>
            <Shield size={16} /> Security Audit Logs
          </button>

          {/* Account Section */}
          <div style={{ margin: '1.25rem 0 0.4rem 0.75rem', fontSize: '0.7rem', fontWeight: '800', color: '#4ADE80', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Account
          </div>
          <button onClick={() => { setActiveSection('account'); setActiveSubView('profile'); }} style={navItemClass('account', 'profile')}>
            <UserCheck size={16} /> My Profile
          </button>
        </div>

        {/* User Info Footer */}
        <div style={{ padding: '1rem', borderTop: '1px solid #14532D', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#FFFFFF' }}>{user?.full_name}</div>
            <div style={{ fontSize: '0.7rem', color: '#86EFAC' }}>{user?.email}</div>
          </div>
          <button onClick={handleLogout} title="Logout" style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', padding: '0.4rem' }}>
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main style={{ flex: 1, overflowY: 'auto', padding: '2rem' }}>
        
        {/* Top Header Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0F172A', margin: 0, textTransform: 'capitalize' }}>
              {activeSection} {activeSubView ? `— ${activeSubView.replace('_', ' ')}` : ''}
            </h1>
            <p style={{ fontSize: '0.875rem', color: '#64748B', margin: '0.25rem 0 0 0' }}>
              Real-time platform control powered by PostgreSQL backend database
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button onClick={loadAllData} style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', padding: '0.6rem 1.1rem', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#334155', fontWeight: '600', fontSize: '0.875rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <RefreshCw size={16} /> Sync Real-Time Data
            </button>
          </div>
        </div>

        {/* Global Feedback Banners */}
        {actionError && (
          <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', color: '#991B1B', padding: '1rem 1.25rem', borderRadius: '14px', marginBottom: '1.5rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <AlertTriangle size={20} />
            <span>{actionError}</span>
          </div>
        )}
        {actionSuccess && (
          <div style={{ backgroundColor: '#F0FDF4', border: '1px solid #86EFAC', color: '#166534', padding: '1rem 1.25rem', borderRadius: '14px', marginBottom: '1.5rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <CheckCircle size={20} />
            <span>{actionSuccess}</span>
          </div>
        )}

        {loading ? (
          <div style={{ padding: '5rem', textAlign: 'center', color: '#64748B' }}>
            <div style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '0.5rem' }}>Loading CardaLink Administrator Portal...</div>
            <div style={{ fontSize: '0.85rem' }}>Fetching real PostgreSQL records from backend database</div>
          </div>
        ) : (
          <>
            {/* VIEW 1: OVERVIEW DASHBOARD */}
            {activeSection === 'dashboard' && (
              <div>
                {/* Summary Stat Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
                  <StatCard title="Total Users" value={stats?.total_users || 0} icon={<Users size={22} color="#16A34A" />} bg="#DCFCE7" border="#86EFAC" />
                  <StatCard title="Farmers Registered" value={stats?.farmers_count || 0} icon={<TreePine size={22} color="#15803D" />} bg="#F0FDF4" border="#BBF7D0" />
                  <StatCard title="Traders Active" value={stats?.traders_count || 0} icon={<ShoppingCart size={22} color="#2563EB" />} bg="#EFF6FF" border="#BFDBFE" />
                  <StatCard title="Exporters Active" value={stats?.exporters_count || 0} icon={<Globe size={22} color="#9333EA" />} bg="#F3E8FF" border="#E9D5FF" />
                  <StatCard title="Pending Approvals" value={stats?.pending_approvals || 0} icon={<UserCheck size={22} color="#D97706" />} bg="#FEF3C7" border="#FDE68A" />
                  <StatCard title="Total Plantations" value={stats?.total_plantations || 0} icon={<TreePine size={22} color="#059669" />} bg="#ECFDF5" border="#A7F3D0" />
                  <StatCard title="Total Harvest (Dried)" value={`${stats?.total_harvest_kg || 0} kg`} icon={<Wheat size={22} color="#D97706" />} bg="#FFFBEB" border="#FDE68A" />
                  <StatCard title="Stock Inventory" value={`${stats?.total_inventory_kg || 0} kg`} icon={<Package size={22} color="#0284C7" />} bg="#E0F2FE" border="#BAE6FD" />
                  <StatCard title="Active Export Orders" value={stats?.active_export_orders || 0} icon={<Truck size={22} color="#7C3AED" />} bg="#F5F3FF" border="#DDD6FE" />
                </div>

                {/* Dashboard Quick Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                  {/* Pending Users Widget */}
                  <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '1.5rem', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0F172A', margin: 0 }}>Pending Approval Queue</h3>
                      <button onClick={() => { setActiveSection('users'); setActiveSubView('pending'); setStatusFilter('PENDING'); }} style={{ background: 'none', border: 'none', color: '#16A34A', fontWeight: '700', cursor: 'pointer', fontSize: '0.85rem' }}>
                        View All ({pendingUsers.length})
                      </button>
                    </div>
                    {pendingUsers.length === 0 ? (
                      <div style={{ padding: '2rem', textAlign: 'center', color: '#64748B', backgroundColor: '#F8FAFC', borderRadius: '12px', fontSize: '0.875rem' }}>
                        All user accounts are currently reviewed and approved.
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {pendingUsers.slice(0, 4).map((u) => (
                          <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', backgroundColor: '#FFFBEB', borderRadius: '12px', border: '1px solid #FDE68A' }}>
                            <div>
                              <div style={{ fontWeight: '700', color: '#0F172A', fontSize: '0.9rem' }}>{u.full_name}</div>
                              <div style={{ fontSize: '0.78rem', color: '#B45309' }}>{u.email} • ROLE: {u.role}</div>
                            </div>
                            <div style={{ display: 'flex', gap: '0.4rem' }}>
                              <button onClick={() => setConfirmAction({ user: u, newStatus: 'APPROVED' })} style={{ backgroundColor: '#16A34A', color: '#FFFFFF', border: 'none', padding: '0.35rem 0.75rem', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', fontSize: '0.75rem' }}>
                                Approve
                              </button>
                              <button onClick={() => setConfirmAction({ user: u, newStatus: 'REJECTED' })} style={{ backgroundColor: '#DC2626', color: '#FFFFFF', border: 'none', padding: '0.35rem 0.75rem', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', fontSize: '0.75rem' }}>
                                Reject
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Recent Audit Activity Widget */}
                  <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '1.5rem', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0F172A', margin: 0 }}>Recent IAM Security Events</h3>
                      <button onClick={() => { setActiveSection('system'); setActiveSubView('logs'); }} style={{ background: 'none', border: 'none', color: '#16A34A', fontWeight: '700', cursor: 'pointer', fontSize: '0.85rem' }}>
                        View Full Log
                      </button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                      {auditLogs.slice(0, 5).map((log) => (
                        <div key={log.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.65rem 0.85rem', borderBottom: '1px solid #F1F5F9', fontSize: '0.825rem' }}>
                          <div>
                            <span style={{ fontWeight: '700', color: '#0F172A' }}>{log.action}</span>
                            <span style={{ color: '#64748B', marginLeft: '0.5rem' }}>({log.email || 'System'})</span>
                          </div>
                          <span style={{ color: '#94A3B8', fontSize: '0.75rem' }}>{new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* VIEW 2: USER MANAGEMENT (ALL, FARMERS, TRADERS, EXPORTERS, PENDING) */}
            {activeSection === 'users' && (
              <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '1.75rem', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                {/* Search & Filter Controls */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: '280px' }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                      <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                      <input
                        type="text"
                        placeholder="Search users by name, email, or phone..."
                        value={searchQuery}
                        onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                        style={{ width: '100%', padding: '0.6rem 0.85rem 0.6rem 2.25rem', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '0.875rem', outline: 'none' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <select
                      value={roleFilter}
                      onChange={(e) => { setRoleFilter(e.target.value); setCurrentPage(1); }}
                      style={{ padding: '0.6rem 0.85rem', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '0.875rem', backgroundColor: '#FFFFFF', cursor: 'pointer' }}
                    >
                      <option value="ALL">Filter Role: All Roles</option>
                      <option value="FARMER">FARMER</option>
                      <option value="TRADER">TRADER</option>
                      <option value="EXPORTER">EXPORTER</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>

                    <select
                      value={statusFilter}
                      onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                      style={{ padding: '0.6rem 0.85rem', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '0.875rem', backgroundColor: '#FFFFFF', cursor: 'pointer' }}
                    >
                      <option value="ALL">Filter Status: All Statuses</option>
                      <option value="APPROVED">APPROVED</option>
                      <option value="PENDING">PENDING</option>
                      <option value="REJECTED">REJECTED</option>
                      <option value="SUSPENDED">SUSPENDED</option>
                    </select>
                  </div>
                </div>

                {/* Table Data */}
                {(() => {
                  const filtered = getFilteredUsers(roleFilter, statusFilter);
                  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
                  const startIndex = (currentPage - 1) * itemsPerPage;
                  const paginated = filtered.slice(startIndex, startIndex + itemsPerPage);

                  if (filtered.length === 0) {
                    return <EmptyState message="No matching users found for the selected criteria." />;
                  }

                  return (
                    <>
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                          <thead>
                            <tr style={{ borderBottom: '2px solid #F1F5F9', color: '#64748B', fontWeight: '700' }}>
                              <th style={{ padding: '0.75rem 1rem' }}>User ID</th>
                              <th style={{ padding: '0.75rem 1rem' }}>Full Name</th>
                              <th style={{ padding: '0.75rem 1rem' }}>Email Address</th>
                              <th style={{ padding: '0.75rem 1rem' }}>Phone Number</th>
                              <th style={{ padding: '0.75rem 1rem' }}>Role</th>
                              <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                              <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {paginated.map((u) => (
                              <tr key={u.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                                <td style={{ padding: '0.85rem 1rem', fontWeight: '700', color: '#64748B' }}>#{u.id}</td>
                                <td style={{ padding: '0.85rem 1rem', fontWeight: '700', color: '#0F172A' }}>{u.full_name}</td>
                                <td style={{ padding: '0.85rem 1rem', color: '#334155' }}>{u.email}</td>
                                <td style={{ padding: '0.85rem 1rem', color: '#64748B' }}>{u.phone}</td>
                                <td style={{ padding: '0.85rem 1rem' }}>
                                  <span style={{ backgroundColor: u.role === 'ADMIN' ? '#F3E8FF' : u.role === 'FARMER' ? '#DCFCE7' : u.role === 'TRADER' ? '#DBEAFE' : '#E0E7FF', color: u.role === 'ADMIN' ? '#7E22CE' : u.role === 'FARMER' ? '#15803D' : u.role === 'TRADER' ? '#1E40AF' : '#3730A3', padding: '0.25rem 0.6rem', borderRadius: '6px', fontWeight: '800', fontSize: '0.75rem' }}>
                                    {u.role}
                                  </span>
                                </td>
                                <td style={{ padding: '0.85rem 1rem' }}>
                                  <StatusBadge status={u.status} />
                                </td>
                                <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>
                                  <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center' }}>
                                    <button onClick={() => setModalUser(u)} style={{ backgroundColor: '#F1F5F9', color: '#334155', border: 'none', padding: '0.35rem 0.65rem', borderRadius: '6px', fontWeight: '700', cursor: 'pointer', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                                      <Eye size={12} /> Details
                                    </button>
                                    {u.role !== 'ADMIN' && (
                                      <>
                                        {u.status !== 'APPROVED' && (
                                          <button onClick={() => setConfirmAction({ user: u, newStatus: 'APPROVED' })} style={{ backgroundColor: '#DCFCE7', color: '#15803D', border: 'none', padding: '0.35rem 0.65rem', borderRadius: '6px', fontWeight: '700', cursor: 'pointer', fontSize: '0.75rem' }}>
                                            Approve
                                          </button>
                                        )}
                                        {u.status !== 'SUSPENDED' && (
                                          <button onClick={() => setConfirmAction({ user: u, newStatus: 'SUSPENDED' })} style={{ backgroundColor: '#FEF2F2', color: '#DC2626', border: 'none', padding: '0.35rem 0.65rem', borderRadius: '6px', fontWeight: '700', cursor: 'pointer', fontSize: '0.75rem' }}>
                                            Suspend
                                          </button>
                                        )}
                                        {u.status !== 'REJECTED' && (
                                          <button onClick={() => setConfirmAction({ user: u, newStatus: 'REJECTED' })} style={{ backgroundColor: '#FEF3C7', color: '#D97706', border: 'none', padding: '0.35rem 0.65rem', borderRadius: '6px', fontWeight: '700', cursor: 'pointer', fontSize: '0.75rem' }}>
                                            Reject
                                          </button>
                                        )}
                                      </>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Pagination Controls */}
                      <Pagination current={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
                    </>
                  );
                })()}
              </div>
            )}

            {/* VIEW 3: PLANTATION MANAGEMENT */}
            {activeSection === 'plantations' && (
              <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '1.75rem', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                {activeSubView === 'list' && (
                  <SimpleTable title="CardaLink Registered Plantations" headers={['ID', 'Farmer Name', 'Plantation Name', 'Location', 'Area (Acres)', 'Variety', 'Status']}>
                    {plantations.map((p) => (
                      <tr key={p.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '0.85rem 1rem', fontWeight: '700', color: '#64748B' }}>#{p.id}</td>
                        <td style={{ padding: '0.85rem 1rem', fontWeight: '700', color: '#0F172A' }}>{p.farmer_name}</td>
                        <td style={{ padding: '0.85rem 1rem', color: '#166534', fontWeight: '700' }}>{p.name}</td>
                        <td style={{ padding: '0.85rem 1rem', color: '#475569' }}>{p.location}</td>
                        <td style={{ padding: '0.85rem 1rem', fontWeight: '700' }}>{p.area_acres} acres</td>
                        <td style={{ padding: '0.85rem 1rem', color: '#15803D' }}>{p.variety}</td>
                        <td style={{ padding: '0.85rem 1rem' }}><StatusBadge status={p.status} /></td>
                      </tr>
                    ))}
                  </SimpleTable>
                )}

                {activeSubView === 'varieties' && (
                  <SimpleTable title="Cardamom Variety Repository" headers={['Variety Name', 'Variety Code', 'Optimal Altitude', 'Yield Potential (kg/acre)', 'Description']}>
                    {varieties.map((v) => (
                      <tr key={v.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '0.85rem 1rem', fontWeight: '800', color: '#166534' }}>{v.name}</td>
                        <td style={{ padding: '0.85rem 1rem', fontWeight: '700', color: '#64748B' }}>{v.code}</td>
                        <td style={{ padding: '0.85rem 1rem', color: '#334155' }}>{v.optimal_altitude}</td>
                        <td style={{ padding: '0.85rem 1rem', fontWeight: '700', color: '#0F172A' }}>{v.yield_potential_kg_acre} kg</td>
                        <td style={{ padding: '0.85rem 1rem', color: '#64748B' }}>{v.description}</td>
                      </tr>
                    ))}
                  </SimpleTable>
                )}

                {activeSubView === 'harvests' && (
                  <SimpleTable title="Harvest Log Records" headers={['Harvest Date', 'Farmer Name', 'Plantation', 'Fresh Yield (kg)', 'Dried Yield (kg)', 'Variety', 'Grade']}>
                    {harvests.map((h) => (
                      <tr key={h.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '0.85rem 1rem', color: '#64748B' }}>{h.harvest_date}</td>
                        <td style={{ padding: '0.85rem 1rem', fontWeight: '700', color: '#0F172A' }}>{h.farmer_name}</td>
                        <td style={{ padding: '0.85rem 1rem', color: '#166534' }}>{h.plantation_name}</td>
                        <td style={{ padding: '0.85rem 1rem', fontWeight: '600' }}>{h.fresh_quantity_kg} kg</td>
                        <td style={{ padding: '0.85rem 1rem', fontWeight: '800', color: '#15803D' }}>{h.dried_quantity_kg} kg</td>
                        <td style={{ padding: '0.85rem 1rem' }}>{h.variety}</td>
                        <td style={{ padding: '0.85rem 1rem', fontWeight: '700', color: '#7E22CE' }}>{h.grade}</td>
                      </tr>
                    ))}
                  </SimpleTable>
                )}

                {activeSubView === 'inventory' && (
                  <SimpleTable title="CardaLink Total Cardamom Stock Inventory" headers={['Batch Code', 'Owner', 'Role', 'Variety', 'Quantity (kg)', 'Grade', 'Status']}>
                    {inventory.map((inv) => (
                      <tr key={inv.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '0.85rem 1rem', fontWeight: '800', color: '#0284C7' }}>{inv.batch_code}</td>
                        <td style={{ padding: '0.85rem 1rem', fontWeight: '700', color: '#0F172A' }}>{inv.owner_name}</td>
                        <td style={{ padding: '0.85rem 1rem', fontWeight: '700', color: '#64748B' }}>{inv.owner_role}</td>
                        <td style={{ padding: '0.85rem 1rem', color: '#166534' }}>{inv.variety}</td>
                        <td style={{ padding: '0.85rem 1rem', fontWeight: '800', color: '#0F172A' }}>{inv.quantity_kg} {inv.unit}</td>
                        <td style={{ padding: '0.85rem 1rem', fontWeight: '700', color: '#7E22CE' }}>{inv.grade}</td>
                        <td style={{ padding: '0.85rem 1rem' }}><StatusBadge status={inv.status} /></td>
                      </tr>
                    ))}
                  </SimpleTable>
                )}

                {(activeSubView === 'fertilizer' || activeSubView === 'pesticide') && (
                  <SimpleTable title={`Agrochemical Usage Log (${activeSubView.toUpperCase()})`} headers={['Date', 'Type', 'Farmer', 'Plantation', 'Product Name', 'Quantity', 'Purpose']}>
                    {agrochemicals.filter(a => a.usage_type.toLowerCase() === activeSubView.toLowerCase()).map((a) => (
                      <tr key={a.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '0.85rem 1rem', color: '#64748B' }}>{a.application_date}</td>
                        <td style={{ padding: '0.85rem 1rem', fontWeight: '800', color: a.usage_type === 'FERTILIZER' ? '#0284C7' : '#DC2626' }}>{a.usage_type}</td>
                        <td style={{ padding: '0.85rem 1rem', fontWeight: '700', color: '#0F172A' }}>{a.farmer_name}</td>
                        <td style={{ padding: '0.85rem 1rem', color: '#166534' }}>{a.plantation_name}</td>
                        <td style={{ padding: '0.85rem 1rem', fontWeight: '700' }}>{a.name}</td>
                        <td style={{ padding: '0.85rem 1rem', fontWeight: '800' }}>{a.quantity} {a.unit}</td>
                        <td style={{ padding: '0.85rem 1rem', color: '#64748B' }}>{a.purpose}</td>
                      </tr>
                    ))}
                  </SimpleTable>
                )}

                {activeSubView === 'irrigation' && (
                  <SimpleTable title="Plantation Irrigation Logs" headers={['Date', 'Farmer', 'Plantation', 'Irrigation Method', 'Duration (Hours)', 'Water Volume (Liters)']}>
                    {irrigations.map((irr) => (
                      <tr key={irr.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '0.85rem 1rem', color: '#64748B' }}>{irr.irrigation_date}</td>
                        <td style={{ padding: '0.85rem 1rem', fontWeight: '700', color: '#0F172A' }}>{irr.farmer_name}</td>
                        <td style={{ padding: '0.85rem 1rem', color: '#166534' }}>{irr.plantation_name}</td>
                        <td style={{ padding: '0.85rem 1rem', fontWeight: '700', color: '#0284C7' }}>{irr.method}</td>
                        <td style={{ padding: '0.85rem 1rem', fontWeight: '700' }}>{irr.duration_hours} hrs</td>
                        <td style={{ padding: '0.85rem 1rem', fontWeight: '800', color: '#1D4ED8' }}>{Number(irr.water_volume_liters).toLocaleString()} L</td>
                      </tr>
                    ))}
                  </SimpleTable>
                )}

                {activeSubView === 'expenses' && (
                  <SimpleTable title="Plantation Operating Expenses" headers={['Date', 'Farmer', 'Plantation', 'Expense Category', 'Amount (INR)', 'Description']}>
                    {expenses.map((e) => (
                      <tr key={e.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '0.85rem 1rem', color: '#64748B' }}>{e.expense_date}</td>
                        <td style={{ padding: '0.85rem 1rem', fontWeight: '700', color: '#0F172A' }}>{e.farmer_name}</td>
                        <td style={{ padding: '0.85rem 1rem', color: '#166534' }}>{e.plantation_name || 'General'}</td>
                        <td style={{ padding: '0.85rem 1rem', fontWeight: '700', color: '#7E22CE' }}>{e.category}</td>
                        <td style={{ padding: '0.85rem 1rem', fontWeight: '800', color: '#B45309' }}>₹{Number(e.amount).toLocaleString()}</td>
                        <td style={{ padding: '0.85rem 1rem', color: '#64748B' }}>{e.description}</td>
                      </tr>
                    ))}
                  </SimpleTable>
                )}

                {activeSubView === 'sales' && (
                  <SimpleTable title="Domestic Sales Transactions" headers={['Date', 'Seller (Farmer)', 'Buyer (Trader/Exporter)', 'Variety', 'Quantity (kg)', 'Total Value (INR)', 'Status']}>
                    {sales.map((s) => (
                      <tr key={s.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '0.85rem 1rem', color: '#64748B' }}>{s.sale_date}</td>
                        <td style={{ padding: '0.85rem 1rem', fontWeight: '700', color: '#166534' }}>{s.farmer_name}</td>
                        <td style={{ padding: '0.85rem 1rem', fontWeight: '700', color: '#1E40AF' }}>{s.buyer_name}</td>
                        <td style={{ padding: '0.85rem 1rem' }}>{s.cardamom_variety}</td>
                        <td style={{ padding: '0.85rem 1rem', fontWeight: '700' }}>{s.quantity_kg} kg</td>
                        <td style={{ padding: '0.85rem 1rem', fontWeight: '800', color: '#15803D' }}>₹{Number(s.total_amount).toLocaleString()}</td>
                        <td style={{ padding: '0.85rem 1rem' }}><StatusBadge status={s.status} /></td>
                      </tr>
                    ))}
                  </SimpleTable>
                )}

                {activeSubView === 'transactions' && (
                  <SimpleTable title="Platform Financial Transactions" headers={['Txn Code', 'Sender', 'Receiver', 'Amount (INR)', 'Payment Method', 'Status', 'Date']}>
                    {transactions.map((t) => (
                      <tr key={t.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '0.85rem 1rem', fontWeight: '800', color: '#64748B' }}>{t.transaction_code}</td>
                        <td style={{ padding: '0.85rem 1rem', fontWeight: '700' }}>{t.sender_name}</td>
                        <td style={{ padding: '0.85rem 1rem', fontWeight: '700', color: '#166534' }}>{t.receiver_name}</td>
                        <td style={{ padding: '0.85rem 1rem', fontWeight: '800', color: '#15803D' }}>₹{Number(t.amount).toLocaleString()}</td>
                        <td style={{ padding: '0.85rem 1rem', color: '#334155' }}>{t.payment_method}</td>
                        <td style={{ padding: '0.85rem 1rem' }}><StatusBadge status={t.status} /></td>
                        <td style={{ padding: '0.85rem 1rem', color: '#64748B' }}>{new Date(t.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </SimpleTable>
                )}
              </div>
            )}

            {/* VIEW 4: EXPORT MANAGEMENT */}
            {activeSection === 'export' && (
              <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '1.75rem', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                {activeSubView === 'orders' && (
                  <SimpleTable title="Global Export Orders" headers={['Order Code', 'Exporter Firm', 'Buyer / Importer', 'Destination Country', 'Variety', 'Quantity (kg)', 'Total Value (USD)', 'Status']}>
                    {exportOrders.map((o) => (
                      <tr key={o.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '0.85rem 1rem', fontWeight: '800', color: '#7E22CE' }}>{o.order_code}</td>
                        <td style={{ padding: '0.85rem 1rem', fontWeight: '700', color: '#0F172A' }}>{o.exporter_name}</td>
                        <td style={{ padding: '0.85rem 1rem', color: '#334155' }}>{o.buyer_name}</td>
                        <td style={{ padding: '0.85rem 1rem', fontWeight: '700', color: '#1E40AF' }}>{o.destination_country}</td>
                        <td style={{ padding: '0.85rem 1rem', color: '#166534' }}>{o.cardamom_variety}</td>
                        <td style={{ padding: '0.85rem 1rem', fontWeight: '700' }}>{o.quantity_kg} kg</td>
                        <td style={{ padding: '0.85rem 1rem', fontWeight: '800', color: '#15803D' }}>${Number(o.total_value_usd).toLocaleString()} USD</td>
                        <td style={{ padding: '0.85rem 1rem' }}><StatusBadge status={o.status} /></td>
                      </tr>
                    ))}
                  </SimpleTable>
                )}

                {activeSubView === 'documents' && (
                  <SimpleTable title="Export Regulatory Documents" headers={['Order Code', 'Document Type', 'Document Number', 'Issued Date', 'Verification Status']}>
                    {exportDocs.map((doc) => (
                      <tr key={doc.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '0.85rem 1rem', fontWeight: '800', color: '#7E22CE' }}>{doc.order_code}</td>
                        <td style={{ padding: '0.85rem 1rem', fontWeight: '700', color: '#0F172A' }}>{doc.document_type}</td>
                        <td style={{ padding: '0.85rem 1rem', color: '#475569' }}>{doc.document_number}</td>
                        <td style={{ padding: '0.85rem 1rem', color: '#64748B' }}>{doc.issued_date}</td>
                        <td style={{ padding: '0.85rem 1rem' }}><StatusBadge status={doc.status} /></td>
                      </tr>
                    ))}
                  </SimpleTable>
                )}

                {activeSubView === 'shipments' && (
                  <SimpleTable title="Global Shipments & Logistics Tracking" headers={['Tracking Number', 'Order Code', 'Carrier Line', 'Origin Port', 'Destination Port', 'Dispatch Date', 'Est. Delivery', 'Status']}>
                    {shipments.map((ship) => (
                      <tr key={ship.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '0.85rem 1rem', fontWeight: '800', color: '#0284C7' }}>{ship.tracking_number}</td>
                        <td style={{ padding: '0.85rem 1rem', fontWeight: '700', color: '#7E22CE' }}>{ship.order_code}</td>
                        <td style={{ padding: '0.85rem 1rem', color: '#334155' }}>{ship.carrier}</td>
                        <td style={{ padding: '0.85rem 1rem', color: '#64748B' }}>{ship.origin}</td>
                        <td style={{ padding: '0.85rem 1rem', fontWeight: '700', color: '#1E40AF' }}>{ship.destination}</td>
                        <td style={{ padding: '0.85rem 1rem', color: '#64748B' }}>{ship.dispatch_date}</td>
                        <td style={{ padding: '0.85rem 1rem', color: '#64748B' }}>{ship.estimated_delivery}</td>
                        <td style={{ padding: '0.85rem 1rem' }}><StatusBadge status={ship.status} /></td>
                      </tr>
                    ))}
                  </SimpleTable>
                )}
              </div>
            )}

            {/* VIEW 5: SYSTEM & SECURITY */}
            {activeSection === 'system' && (
              <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '1.75rem', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                {activeSubView === 'notifications' && (
                  <SimpleTable title="System Broadcast Notifications" headers={['Timestamp', 'Category', 'Recipient', 'Notification Title', 'Message Details', 'Read Status']}>
                    {notifications.map((n) => (
                      <tr key={n.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '0.85rem 1rem', color: '#64748B', whiteSpace: 'nowrap' }}>{new Date(n.created_at).toLocaleString()}</td>
                        <td style={{ padding: '0.85rem 1rem', fontWeight: '800', color: '#15803D' }}>{n.category}</td>
                        <td style={{ padding: '0.85rem 1rem', fontWeight: '700', color: '#0F172A' }}>{n.recipient_email || 'ALL USERS'}</td>
                        <td style={{ padding: '0.85rem 1rem', fontWeight: '700' }}>{n.title}</td>
                        <td style={{ padding: '0.85rem 1rem', color: '#475569' }}>{n.message}</td>
                        <td style={{ padding: '0.85rem 1rem' }}><StatusBadge status={n.is_read ? 'READ' : 'UNREAD'} /></td>
                      </tr>
                    ))}
                  </SimpleTable>
                )}

                {activeSubView === 'reports' && (
                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0F172A', marginBottom: '1.5rem' }}>CardaLink System Analytics Summary Reports</h3>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                      <div style={{ backgroundColor: '#F8FAFC', padding: '1.5rem', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                        <h4 style={{ fontWeight: '800', color: '#0F172A', margin: '0 0 1rem 0' }}>Users Distribution by Role</h4>
                        {reports?.users_by_role?.map(r => (
                          <div key={r.role} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #E2E8F0', fontSize: '0.875rem' }}>
                            <span style={{ fontWeight: '700', color: '#15803D' }}>{r.role}</span>
                            <span style={{ fontWeight: '800' }}>{r.count} users</span>
                          </div>
                        ))}
                      </div>

                      <div style={{ backgroundColor: '#F8FAFC', padding: '1.5rem', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                        <h4 style={{ fontWeight: '800', color: '#0F172A', margin: '0 0 1rem 0' }}>Harvest Production by Variety</h4>
                        {reports?.harvest_by_variety?.map(v => (
                          <div key={v.variety} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #E2E8F0', fontSize: '0.875rem' }}>
                            <span style={{ fontWeight: '700', color: '#0284C7' }}>{v.variety}</span>
                            <span style={{ fontWeight: '800' }}>{v.total_kg} kg</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                      <div style={{ backgroundColor: '#DCFCE7', padding: '1.5rem', borderRadius: '12px', border: '1px solid #86EFAC' }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#15803D' }}>TOTAL DOMESTIC SALES REVENUE</div>
                        <div style={{ fontSize: '1.75rem', fontWeight: '900', color: '#14532D', marginTop: '0.5rem' }}>
                          ₹{Number(reports?.total_domestic_sales_inr || 0).toLocaleString()}
                        </div>
                      </div>
                      <div style={{ backgroundColor: '#F3E8FF', padding: '1.5rem', borderRadius: '12px', border: '1px solid #D8B4FE' }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#7E22CE' }}>TOTAL EXPORT ORDER VALUE</div>
                        <div style={{ fontSize: '1.75rem', fontWeight: '900', color: '#581C87', marginTop: '0.5rem' }}>
                          ${Number(reports?.total_export_value_usd || 0).toLocaleString()} USD
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeSubView === 'logs' && (
                  <SimpleTable title="IAM Activity & Security Audit Log" headers={['Timestamp', 'Event Action', 'User Email', 'Details', 'IP Address']}>
                    {auditLogs.map((log) => (
                      <tr key={log.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '0.85rem 1rem', color: '#64748B', whiteSpace: 'nowrap' }}>{new Date(log.created_at).toLocaleString()}</td>
                        <td style={{ padding: '0.85rem 1rem' }}>
                          <span style={{ backgroundColor: log.action.includes('SUCCESS') || log.action.includes('APPROVED') ? '#DCFCE7' : log.action.includes('FAILED') || log.action.includes('SUSPENDED') ? '#FEF2F2' : '#F1F5F9', color: log.action.includes('SUCCESS') || log.action.includes('APPROVED') ? '#15803D' : log.action.includes('FAILED') || log.action.includes('SUSPENDED') ? '#DC2626' : '#475569', padding: '0.25rem 0.55rem', borderRadius: '6px', fontWeight: '800', fontSize: '0.75rem' }}>
                            {log.action}
                          </span>
                        </td>
                        <td style={{ padding: '0.85rem 1rem', fontWeight: '700', color: '#0F172A' }}>{log.email || 'N/A'}</td>
                        <td style={{ padding: '0.85rem 1rem', color: '#475569' }}>{log.details}</td>
                        <td style={{ padding: '0.85rem 1rem', color: '#64748B', fontFamily: 'monospace' }}>{log.ip_address || '127.0.0.1'}</td>
                      </tr>
                    ))}
                  </SimpleTable>
                )}
              </div>
            )}

            {/* VIEW 6: ACCOUNT PROFILE */}
            {activeSection === 'account' && (
              <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '2rem', border: '1px solid #E2E8F0', maxWidth: '650px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0F172A', marginBottom: '1.5rem' }}>System Administrator Profile</h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.9rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid #F1F5F9' }}>
                    <span style={{ color: '#64748B', fontWeight: '600' }}>Full Name:</span>
                    <span style={{ fontWeight: '800', color: '#0F172A' }}>{user?.full_name}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid #F1F5F9' }}>
                    <span style={{ color: '#64748B', fontWeight: '600' }}>Email Address:</span>
                    <span style={{ fontWeight: '800', color: '#0F172A' }}>{user?.email}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid #F1F5F9' }}>
                    <span style={{ color: '#64748B', fontWeight: '600' }}>Assigned System Role:</span>
                    <span style={{ fontWeight: '800', color: '#7E22CE', backgroundColor: '#F3E8FF', padding: '0.2rem 0.6rem', borderRadius: '6px' }}>{user?.role}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid #F1F5F9' }}>
                    <span style={{ color: '#64748B', fontWeight: '600' }}>Account Status:</span>
                    <StatusBadge status={user?.status} />
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* MODAL 1: USER DETAILS MODAL */}
      {modalUser && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, backdropFilter: 'blur(4px)' }}>
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '20px', padding: '2rem', maxWidth: '520px', width: '90%', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#0F172A', margin: 0 }}>CardaLink User Details</h3>
              <button onClick={() => setModalUser(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.875rem' }}>
              <DetailRow label="User ID" value={`#${modalUser.id}`} />
              <DetailRow label="Full Name" value={modalUser.full_name} bold />
              <DetailRow label="Email Address" value={modalUser.email} />
              <DetailRow label="Phone Number" value={modalUser.phone} />
              <DetailRow label="System Role" value={modalUser.role} highlight />
              <DetailRow label="Account Status" value={<StatusBadge status={modalUser.status} />} />
              <DetailRow label="Verification State" value={modalUser.is_verified ? 'Verified Identity' : 'Unverified'} />
              <DetailRow label="Registration Date" value={new Date(modalUser.created_at).toLocaleString()} />
            </div>

            <div style={{ marginTop: '1.75rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button onClick={() => setModalUser(null)} style={{ padding: '0.6rem 1.25rem', borderRadius: '10px', border: '1px solid #CBD5E1', backgroundColor: '#FFFFFF', fontWeight: '700', cursor: 'pointer', color: '#475569' }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: CONFIRM STATUS ACTION MODAL */}
      {confirmAction && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 110, backdropFilter: 'blur(4px)' }}>
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '20px', padding: '2rem', maxWidth: '460px', width: '90%', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '14px', backgroundColor: confirmAction.newStatus === 'APPROVED' ? '#DCFCE7' : confirmAction.newStatus === 'SUSPENDED' ? '#FEF2F2' : '#FEF3C7', color: confirmAction.newStatus === 'APPROVED' ? '#15803D' : confirmAction.newStatus === 'SUSPENDED' ? '#DC2626' : '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
              <AlertTriangle size={24} />
            </div>

            <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#0F172A', margin: '0 0 0.5rem 0' }}>
              Confirm Account {confirmAction.newStatus}
            </h3>

            <p style={{ fontSize: '0.875rem', color: '#64748B', lineHeight: 1.5, margin: '0 0 1.5rem 0' }}>
              Are you sure you want to change status of <strong>{confirmAction.user.full_name} ({confirmAction.user.email})</strong> to <strong style={{ color: '#0F172A' }}>[{confirmAction.newStatus}]</strong>? This change will be saved to PostgreSQL and recorded in audit logs.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button onClick={() => setConfirmAction(null)} style={{ padding: '0.6rem 1.1rem', borderRadius: '10px', border: '1px solid #CBD5E1', backgroundColor: '#FFFFFF', fontWeight: '700', cursor: 'pointer', color: '#475569' }}>
                Cancel
              </button>
              <button onClick={() => handleStatusChange(confirmAction.user.id, confirmAction.newStatus)} style={{ padding: '0.6rem 1.25rem', borderRadius: '10px', border: 'none', backgroundColor: confirmAction.newStatus === 'APPROVED' ? '#16A34A' : confirmAction.newStatus === 'SUSPENDED' ? '#DC2626' : '#D97706', color: '#FFFFFF', fontWeight: '700', cursor: 'pointer' }}>
                Confirm {confirmAction.newStatus}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// HELPER COMPONENTS
const StatCard = ({ title, value, icon, bg, border }) => (
  <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '1.25rem', border: `1px solid ${border}`, boxShadow: '0 2px 6px rgba(0,0,0,0.02)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
    <div style={{ width: '48px', height: '48px', borderRadius: '14px', backgroundColor: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {icon}
    </div>
    <div>
      <div style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.03em' }}>{title}</div>
      <div style={{ fontSize: '1.4rem', fontWeight: '900', color: '#0F172A', marginTop: '0.1rem' }}>{value}</div>
    </div>
  </div>
);

const SimpleTable = ({ title, headers, children }) => (
  <div>
    <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#0F172A', marginBottom: '1.25rem' }}>{title}</h3>
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #F1F5F9', color: '#64748B', fontWeight: '700' }}>
            {headers.map((h, i) => (
              <th key={i} style={{ padding: '0.75rem 1rem' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  </div>
);

const DetailRow = ({ label, value, bold, highlight }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid #F1F5F9' }}>
    <span style={{ color: '#64748B', fontWeight: '600' }}>{label}:</span>
    <span style={{ fontWeight: bold || highlight ? '800' : '600', color: highlight ? '#7E22CE' : '#0F172A' }}>{value}</span>
  </div>
);

const EmptyState = ({ message }) => (
  <div style={{ padding: '4rem', textAlign: 'center', color: '#64748B', backgroundColor: '#F8FAFC', borderRadius: '14px' }}>
    <div style={{ fontWeight: '700', fontSize: '1rem', color: '#475569' }}>No Records Found</div>
    <div style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>{message}</div>
  </div>
);

const Pagination = ({ current, totalPages, onPageChange }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #F1F5F9', fontSize: '0.85rem', color: '#64748B' }}>
    <div>Page <strong>{current}</strong> of <strong>{totalPages}</strong></div>
    <div style={{ display: 'flex', gap: '0.5rem' }}>
      <button disabled={current <= 1} onClick={() => onPageChange(current - 1)} style={{ padding: '0.4rem 0.75rem', borderRadius: '8px', border: '1px solid #CBD5E1', backgroundColor: current <= 1 ? '#F1F5F9' : '#FFFFFF', cursor: current <= 1 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
        <ChevronLeft size={16} /> Prev
      </button>
      <button disabled={current >= totalPages} onClick={() => onPageChange(current + 1)} style={{ padding: '0.4rem 0.75rem', borderRadius: '8px', border: '1px solid #CBD5E1', backgroundColor: current >= totalPages ? '#F1F5F9' : '#FFFFFF', cursor: current >= totalPages ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
        Next <ChevronRight size={16} />
      </button>
    </div>
  </div>
);

const StatusBadge = ({ status }) => {
  const map = {
    APPROVED: { bg: '#DCFCE7', color: '#15803D', label: 'APPROVED' },
    PENDING: { bg: '#FEF3C7', color: '#D97706', label: 'PENDING' },
    REJECTED: { bg: '#FEE2E2', color: '#DC2626', label: 'REJECTED' },
    SUSPENDED: { bg: '#F3F4F6', color: '#4B5563', label: 'SUSPENDED' },
    ACTIVE: { bg: '#DCFCE7', color: '#15803D', label: 'ACTIVE' },
    IN_STOCK: { bg: '#E0F2FE', color: '#0369A1', label: 'IN STOCK' },
    IN_TRANSIT: { bg: '#F3E8FF', color: '#7E22CE', label: 'IN TRANSIT' },
    SUCCESS: { bg: '#DCFCE7', color: '#15803D', label: 'SUCCESS' },
    VERIFIED: { bg: '#DCFCE7', color: '#15803D', label: 'VERIFIED' },
    COMPLETED: { bg: '#DCFCE7', color: '#15803D', label: 'COMPLETED' },
    PROCESSING: { bg: '#FEF3C7', color: '#D97706', label: 'PROCESSING' },
    READ: { bg: '#F1F5F9', color: '#64748B', label: 'READ' },
    UNREAD: { bg: '#FEF3C7', color: '#D97706', label: 'UNREAD' },
  };

  const current = map[status] || { bg: '#F1F5F9', color: '#64748B', label: status || 'N/A' };

  return (
    <span style={{ backgroundColor: current.bg, color: current.color, padding: '0.25rem 0.6rem', borderRadius: '6px', fontWeight: '800', fontSize: '0.75rem', display: 'inline-block' }}>
      {current.label}
    </span>
  );
};

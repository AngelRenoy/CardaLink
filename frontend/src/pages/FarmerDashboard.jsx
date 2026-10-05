import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import {
  Sprout, LogOut, Plus, Calendar, List, TrendingUp, Droplets,
  FlaskConical, Boxes, Receipt, ShoppingBag, ShoppingCart, CreditCard, User,
  Search, Filter, Edit2, Trash2, Eye, X, CheckCircle2, AlertCircle,
  BarChart3, Layers, ChevronRight, Info, ShieldCheck, Key, Menu, Bell,
  Wheat, Trees, Sparkles, RefreshCw, CheckCircle, Clock
} from 'lucide-react';
import {
  fetchFarmerDashboardStatsApi,
  fetchFarmerPlantationsApi,
  createFarmerPlantationApi,
  fetchFarmerVarietiesApi,
  createFarmerVarietyApi,
  fetchActiveHarvestCycleApi,
  startHarvestCycleApi,
  addDailyHarvestApi,
  completeHarvestCycleApi,
  fetchHarvestHistoryApi,
  fetchCycleSummaryDetailApi,
  updateFarmerHarvestApi,
  deleteFarmerHarvestApi,
  fetchFarmerAgrochemicalsApi,
  createFarmerAgrochemicalApi,
  fetchFarmerIrrigationApi,
  createFarmerIrrigationApi,
  fetchFarmerInventoryApi,
  createFarmerInventoryApi,
  fetchFarmerExpensesApi,
  createFarmerExpenseApi,
  fetchFarmerSalesApi,
  fetchFarmerTransactionsApi,
  fetchFarmerPurchaseRequestsApi,
  respondFarmerPurchaseRequestApi,
  fetchFarmerReportsApi,
  updateCycleDryKgApi
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
    <div style={{ margin: '0.5rem 0', backgroundColor: '#F8FAF8', padding: '0.6rem 0.75rem', borderRadius: '10px', border: '1px solid #E5EBE5' }}>
      <div style={{ fontSize: '0.68rem', fontWeight: '800', color: '#2E7D32', textTransform: 'uppercase', marginBottom: '0.35rem', letterSpacing: '0.04em' }}>
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
            bg = '#E8F5E9';
            fg = '#2E7D32';
            border = '#A5D6A7';
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
                <span style={{ fontSize: '0.68rem', color: isDone ? '#2E7D32' : '#CBD5E1', fontWeight: 'bold' }}>↓</span>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export const FarmerDashboard = () => {
  const { user, permissions, logout } = useAuth();
  const navigate = useNavigate();

  // Navigation & UI States
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'harvest', 'plantation', etc.
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Data States from Real DB
  const [stats, setStats] = useState(null);
  const [plantations, setPlantations] = useState([]);
  const [varieties, setVarieties] = useState([]);
  
  // Harvest Cycle System States
  const [activeCycle, setActiveCycle] = useState(null);
  const [liveSummary, setLiveSummary] = useState(null);
  const [harvestHistory, setHarvestHistory] = useState([]);
  const [selectedCycleSummary, setSelectedCycleSummary] = useState(null);

  // Other Domain States
  const [agrochemicals, setAgrochemicals] = useState([]);
  const [irrigations, setIrrigations] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [sales, setSales] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [purchaseRequests, setPurchaseRequests] = useState([]);
  const [recordsSubTab, setRecordsSubTab] = useState('sales');
  const [prStatusFilter, setPrStatusFilter] = useState('');

  // Reports & Analytics States
  const [reportsData, setReportsData] = useState(null);
  const [reportsPeriod, setReportsPeriod] = useState('all');
  const [reportsStartDate, setReportsStartDate] = useState('');
  const [reportsEndDate, setReportsEndDate] = useState('');
  const [activeReportModal, setActiveReportModal] = useState(null);
  const [harvestCompareType, setHarvestCompareType] = useState('month');
  const [harvestCompareItemA, setHarvestCompareItemA] = useState('');
  const [harvestCompareItemB, setHarvestCompareItemB] = useState('');

  // Feedback Messages
  const [message, setMessage] = useState({ type: '', text: '' });

  // Modals
  const [showStartCycleModal, setShowStartCycleModal] = useState(false);
  const [showCompleteConfirmModal, setShowCompleteConfirmModal] = useState(false);
  const [showAddDryKgModal, setShowAddDryKgModal] = useState(false);
  const [selectedCycleForDryKg, setSelectedCycleForDryKg] = useState(null);
  const [dryKgInput, setDryKgInput] = useState('');
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [showAddPlantationModal, setShowAddPlantationModal] = useState(false);
  const [showAddVarietyModal, setShowAddVarietyModal] = useState(false);
  const [showAddAgrochemicalModal, setShowAddAgrochemicalModal] = useState(false);
  const [showAddIrrigationModal, setShowAddIrrigationModal] = useState(false);
  const [showAddInventoryModal, setShowAddInventoryModal] = useState(false);
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  
  const [selectedHarvestForEdit, setSelectedHarvestForEdit] = useState(null);
  const [selectedHarvestForDelete, setSelectedHarvestForDelete] = useState(null);

  const [showFarmerPRDetailsModal, setShowFarmerPRDetailsModal] = useState(false);
  const [selectedFarmerPR, setSelectedFarmerPR] = useState(null);

  const handleOpenFarmerPRDetailsModal = (pr) => {
    setSelectedFarmerPR(pr);
    setShowFarmerPRDetailsModal(true);
  };

  // Start Harvest Cycle Form
  const [cycleForm, setCycleForm] = useState({
    name: 'September Harvest 1',
    start_date: new Date().toISOString().split('T')[0],
    expected_end_date: new Date(Date.now() + 8 * 86400000).toISOString().split('T')[0],
    plantation_id: '',
    variety: 'Njallani Gold'
  });

  // Add Daily Harvest Form
  const [dailyForm, setDailyForm] = useState({
    harvest_date: new Date().toISOString().split('T')[0],
    fresh_quantity_kg: '',
    dried_quantity_kg: '',
    notes: ''
  });

  // Full Dry KG state for Harvest Cycle completion
  const [fullDryKg, setFullDryKg] = useState('');

  // Plantation Form
  const [plantationForm, setPlantationForm] = useState({
    name: '', location: '', area_acres: '', number_of_plants: '', variety: 'Njallani Gold', details: ''
  });

  // Variety Form
  const [varietyForm, setVarietyForm] = useState({ name: '', code: '', description: '', optimal_altitude: '' });

  // Agrochemical Form
  const [agrochemicalForm, setAgrochemicalForm] = useState({
    usage_type: 'FERTILIZER', plantation_id: '', name: '', quantity: '', unit: 'KG',
    application_date: new Date().toISOString().split('T')[0],
    next_application_date: '', cost: '', purpose: ''
  });

  // Irrigation Form
  const [irrigationForm, setIrrigationForm] = useState({
    plantation_id: '', method: 'Drip Micro-Irrigation', duration_hours: '', water_volume_liters: '',
    irrigation_date: new Date().toISOString().split('T')[0]
  });

  // Inventory Form
  const [inventoryForm, setInventoryForm] = useState({ variety: '', grade: '', quantity_kg: '' });

  // Expense Form
  const [expenseForm, setExpenseForm] = useState({ category: 'Fertilizer & Labor', amount: '', description: '', expense_date: new Date().toISOString().split('T')[0], plantation_id: '' });

  // Load Data
  const loadData = async () => {
    try {
      const [
        statsRes, plantationsRes, varietiesRes, agroRes, irrRes, invRes, expRes, salesRes, transRes
      ] = await Promise.all([
        fetchFarmerDashboardStatsApi().catch(() => ({ success: false })),
        fetchFarmerPlantationsApi().catch(() => ({ success: false })),
        fetchFarmerVarietiesApi().catch(() => ({ success: false })),
        fetchFarmerAgrochemicalsApi().catch(() => ({ success: false })),
        fetchFarmerIrrigationApi().catch(() => ({ success: false })),
        fetchFarmerInventoryApi().catch(() => ({ success: false })),
        fetchFarmerExpensesApi().catch(() => ({ success: false })),
        fetchFarmerSalesApi().catch(() => ({ success: false })),
        fetchFarmerTransactionsApi().catch(() => ({ success: false }))
      ]);

      if (statsRes.success) setStats(statsRes.data.stats);
      if (plantationsRes.success) {
        const pList = plantationsRes.data?.plantations || [];
        setPlantations(pList);
        if (pList.length > 0 && !cycleForm.plantation_id) {
          setCycleForm(prev => ({ ...prev, plantation_id: pList[0].id }));
        }
      }
      if (varietiesRes.success) {
        const vList = varietiesRes.data?.varieties || [];
        setVarieties(vList);
        if (vList.length > 0 && !cycleForm.variety) {
          setCycleForm(prev => ({ ...prev, variety: vList[0].name }));
        }
      }
      if (agroRes.success) setAgrochemicals(agroRes.data?.agrochemicals || []);
      if (irrRes.success) setIrrigations(irrRes.data?.irrigations || []);
      if (invRes.success) setInventory(invRes.data?.inventory || []);
      if (expRes.success) setExpenses(expRes.data?.expenses || []);
      if (salesRes.success) setSales(salesRes.data?.sales || []);
      if (transRes.success) setTransactions(transRes.data?.transactions || []);

      await loadHarvestCycleData();
    } catch (err) {
      console.error('Error loading farmer data:', err);
    }
  };

  // Dynamic calculation of Farmer Dashboard Initial & Real values
  const totalPlantations = stats?.total_plantations ?? plantations.length;

  const calculatedHarvestKg = (
    (liveSummary?.total_fresh_harvest_kg || 0) +
    harvestHistory.reduce((acc, h) => acc + (parseFloat(h.summary?.total_fresh_harvest_kg || h.total_fresh_kg || 0) || 0), 0)
  );
  const totalHarvestText = (stats?.total_harvest_kg != null ? stats.total_harvest_kg : calculatedHarvestKg) > 0
    ? `${stats?.total_harvest_kg ?? calculatedHarvestKg} KG`
    : '0 KG';

  const calculatedInventoryKg = inventory.reduce((acc, i) => acc + (parseFloat(i.quantity_kg) || 0), 0);
  const totalInventoryText = (stats?.total_inventory_kg != null ? stats.total_inventory_kg : calculatedInventoryKg) > 0
    ? `${stats?.total_inventory_kg ?? calculatedInventoryKg} KG`
    : '0 KG';

  const calculatedSales = sales.reduce((acc, s) => acc + (parseFloat(s.total_price || s.amount) || 0), 0);
  const totalSalesText = `₹${stats?.total_sales ?? calculatedSales}`;

  const calculatedExpenses = expenses.reduce((acc, e) => acc + (parseFloat(e.amount) || 0), 0);
  const totalExpensesText = `₹${stats?.total_expenses ?? calculatedExpenses}`;

  const totalTransactions = stats?.total_transactions ?? transactions.length;

  const fertilizerItems = agrochemicals.filter(a => (a.usage_type || a.type) === 'FERTILIZER');
  const calculatedFertilizerKg = fertilizerItems.reduce((acc, a) => acc + (parseFloat(a.quantity) || 0), 0);
  const totalFertilizerText = (stats?.total_fertilizer_usage_kg != null ? stats.total_fertilizer_usage_kg : calculatedFertilizerKg) > 0
    ? `${stats?.total_fertilizer_usage_kg ?? calculatedFertilizerKg} KG`
    : '0 KG';

  const pesticideItems = agrochemicals.filter(a => (a.usage_type || a.type) === 'PESTICIDE');
  const totalPesticideUsage = stats?.total_pesticide_usage ?? pesticideItems.length;

  const totalIrrigationRecords = stats?.total_irrigation_records ?? irrigations.length;

  const activeHarvestCycles = stats?.active_harvest_cycles ?? (activeCycle ? 1 : 0);

  const completedHarvestCycles = stats?.completed_harvest_cycles ?? harvestHistory.length;

  const loadHarvestCycleData = async () => {
    try {
      const [activeRes, historyRes] = await Promise.all([
        fetchActiveHarvestCycleApi().catch(() => ({ success: false })),
        fetchHarvestHistoryApi().catch(() => ({ success: false }))
      ]);

      if (activeRes.success) {
        setActiveCycle(activeRes.data.active_cycle);
        setLiveSummary(activeRes.data.live_summary || null);
      }
      if (historyRes.success) {
        setHarvestHistory(historyRes.data.history || []);
      }
    } catch (err) {
      console.error('Error loading harvest cycle data:', err);
    }
  };

  const loadSubTabContent = async (tab) => {
    try {
      if (tab === 'fertilizer' || tab === 'pesticide') {
        const type = tab === 'fertilizer' ? 'FERTILIZER' : 'PESTICIDE';
        const res = await fetchFarmerAgrochemicalsApi(type);
        if (res.success) setAgrochemicals(res.data.agrochemicals);
      } else if (tab === 'irrigation') {
        const res = await fetchFarmerIrrigationApi();
        if (res.success) setIrrigations(res.data.irrigations);
      } else if (tab === 'inventory') {
        const res = await fetchFarmerInventoryApi();
        if (res.success) setInventory(res.data.inventory);
      } else if (tab === 'expenses') {
        const res = await fetchFarmerExpensesApi();
        if (res.success) setExpenses(res.data.expenses);
      } else if (tab === 'sales') {
        const res = await fetchFarmerSalesApi();
        if (res.success) setSales(res.data.sales);
      } else if (tab === 'transactions') {
        const res = await fetchFarmerTransactionsApi();
        if (res.success) setTransactions(res.data.transactions);
      } else if (tab === 'purchase_requests') {
        const res = await fetchFarmerPurchaseRequestsApi();
        if (res.success) setPurchaseRequests(res.data.purchase_requests || []);
      } else if (tab === 'reports') {
        const params = { period: reportsPeriod };
        if (reportsPeriod === 'custom' && reportsStartDate && reportsEndDate) {
          params.start_date = reportsStartDate;
          params.end_date = reportsEndDate;
        }
        const res = await fetchFarmerReportsApi(params);
        if (res.success) setReportsData(res.data);
      }
    } catch (err) {

      console.error(`Error loading content for ${tab}:`, err);
    }
  };

  useEffect(() => { loadData(); }, []);

  useEffect(() => { loadSubTabContent(activeTab); }, [activeTab, reportsPeriod, reportsStartDate, reportsEndDate]);

  const showNotification = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  // ---------------------------------------------------------------------------
  // HARVEST CYCLE WORKFLOW HANDLERS
  // ---------------------------------------------------------------------------

  // Step 1: Start New Harvest Cycle
  const handleStartCycleSubmit = async (e) => {
    e.preventDefault();
    if (activeCycle) {
      return showNotification('error', 'You already have an active harvest. Complete the current harvest before starting a new one.');
    }

    if (!cycleForm.name || !cycleForm.start_date || !cycleForm.expected_end_date || !cycleForm.plantation_id || !cycleForm.variety) {
      return showNotification('error', 'Please fill in all cycle details.');
    }

    if (new Date(cycleForm.expected_end_date) < new Date(cycleForm.start_date)) {
      return showNotification('error', 'Expected end date cannot be earlier than start date.');
    }

    try {
      const res = await startHarvestCycleApi({
        name: cycleForm.name,
        start_date: cycleForm.start_date,
        expected_end_date: cycleForm.expected_end_date,
        plantation_id: parseInt(cycleForm.plantation_id),
        variety: cycleForm.variety
      });

      if (res.success) {
        showNotification('success', `Harvest Cycle '${cycleForm.name}' started successfully!`);
        setShowStartCycleModal(false);
        await loadHarvestCycleData();
      } else {
        showNotification('error', res.message || 'Failed to start harvest cycle');
      }
    } catch (err) {
      showNotification('error', err.message || 'Error starting harvest cycle');
    }
  };

  // Step 2: Add Daily Harvest Entry
  const handleAddDailyHarvestSubmit = async (e) => {
    e.preventDefault();
    if (!activeCycle) return showNotification('error', 'No active harvest cycle found.');

    if (!dailyForm.harvest_date) return showNotification('error', 'Harvest date is required');

    // Date Bounds Validation
    const selectedDate = new Date(dailyForm.harvest_date);
    const startDate = new Date(activeCycle.start_date);
    const endDate = new Date(activeCycle.expected_end_date);

    if (selectedDate < startDate || selectedDate > endDate) {
      return showNotification(
        'error',
        `Selected date must be within the harvest period (${activeCycle.start_date} to ${activeCycle.expected_end_date}).`
      );
    }

    // Duplicate Date Validation
    if (liveSummary?.daily_records?.some(r => r.harvest_date === dailyForm.harvest_date)) {
      return showNotification('error', 'Harvest for this date has already been recorded. Edit the existing record below.');
    }

    const freshVal = parseFloat(dailyForm.fresh_quantity_kg);
    if (isNaN(freshVal) || freshVal <= 0) {
      return showNotification('error', 'Fresh harvest quantity must be greater than 0');
    }

    if (dailyForm.dried_quantity_kg) {
      const driedVal = parseFloat(dailyForm.dried_quantity_kg);
      if (isNaN(driedVal) || driedVal < 0) {
        return showNotification('error', 'Dried harvest quantity cannot be negative');
      }
    }

    try {
      const res = await addDailyHarvestApi(activeCycle.id, {
        harvest_date: dailyForm.harvest_date,
        fresh_quantity_kg: dailyForm.fresh_quantity_kg,
        dried_quantity_kg: dailyForm.dried_quantity_kg || 0,
        notes: dailyForm.notes
      });

      if (res.success) {
        showNotification('success', `Daily harvest for ${dailyForm.harvest_date} recorded!`);
        setDailyForm({
          harvest_date: new Date().toISOString().split('T')[0],
          fresh_quantity_kg: '',
          dried_quantity_kg: '',
          notes: ''
        });
        await loadHarvestCycleData();
        await fetchFarmerDashboardStatsApi().then(r => r.success && setStats(r.data.stats));
      } else {
        showNotification('error', res.message || 'Failed to save daily harvest');
      }
    } catch (err) {
      showNotification('error', err.message || 'Error saving daily harvest');
    }
  };

  // Step 3: Complete Harvest Cycle
  const handleCompleteHarvest = async (e) => {
    if (e) e.preventDefault();
    if (!activeCycle) return;

    if (!fullDryKg || String(fullDryKg).trim() === '') {
      return showNotification('error', 'Full Dry KG is required to complete the harvest');
    }

    const val = parseFloat(fullDryKg);
    if (isNaN(val) || val <= 0) {
      return showNotification('error', 'Full Dry KG must be a valid number greater than 0');
    }

    if (val > 999999.99) {
      return showNotification('error', 'Full Dry KG value is too large');
    }

    try {
      const res = await completeHarvestCycleApi(activeCycle.id, { full_dry_quantity: fullDryKg });
      if (res.success) {
        showNotification('success', `Harvest Cycle '${activeCycle.name}' completed with ${fullDryKg} kg Full Dry Weight!`);
        setShowCompleteConfirmModal(false);
        setFullDryKg('');
        setSelectedCycleSummary({
          cycle: res.data.cycle,
          summary: res.data.final_summary
        });
        setShowSummaryModal(true);
        await loadHarvestCycleData();
        await fetchFarmerDashboardStatsApi().then(r => r.success && setStats(r.data.stats));
      } else {
        showNotification('error', res.message || 'Failed to complete harvest cycle');
      }
    } catch (err) {
      showNotification('error', err.message || 'Error completing harvest cycle');
    }
  };

  // Open Add / Update Dry KG Modal for Completed Harvest Cycle
  const handleOpenAddDryKgModal = (cycle) => {
    setSelectedCycleForDryKg(cycle);
    const existingVal = cycle.summary?.full_dry_quantity_kg ?? cycle.full_dry_quantity ?? '';
    setDryKgInput(existingVal !== null && existingVal !== undefined && existingVal !== '' ? String(existingVal) : '');
    setShowAddDryKgModal(true);
  };

  // Submit Add / Update Dry KG for Specific Completed Harvest Cycle
  const handleSaveDryKgSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCycleForDryKg) return;

    if (dryKgInput === '' || dryKgInput === null || dryKgInput === undefined) {
      return showNotification('error', 'Please enter a valid dry quantity');
    }

    const val = parseFloat(dryKgInput);
    if (isNaN(val) || val < 0) {
      return showNotification('error', 'Dry KG must be greater than or equal to 0');
    }

    if (val > 999999.99) {
      return showNotification('error', 'Dry KG value is too large');
    }

    try {
      const res = await updateCycleDryKgApi(selectedCycleForDryKg.id, val);
      if (res.success) {
        showNotification('success', `Dry KG saved for '${selectedCycleForDryKg.name}' successfully!`);
        setShowAddDryKgModal(false);
        setDryKgInput('');
        setSelectedCycleForDryKg(null);
        await loadHarvestCycleData();
      } else {
        showNotification('error', res.message || 'Failed to update Dry KG');
      }
    } catch (err) {
      showNotification('error', err.message || 'Error updating Dry KG');
    }
  };

  // View Summary Detail of Any Completed Cycle
  const handleViewCycleSummary = async (cycleId) => {
    try {
      const res = await fetchCycleSummaryDetailApi(cycleId);
      if (res.success) {
        setSelectedCycleSummary({
          cycle: res.data.cycle,
          summary: res.data.summary
        });
        setShowSummaryModal(true);
      } else {
        showNotification('error', res.message || 'Failed to fetch summary detail');
      }
    } catch (err) {
      showNotification('error', err.message || 'Error fetching summary');
    }
  };

  // Edit/Delete Daily Records
  const handleUpdateDailyRecord = async (e) => {
    e.preventDefault();
    if (!selectedHarvestForEdit) return;
    try {
      const res = await updateFarmerHarvestApi(selectedHarvestForEdit.id, {
        harvest_date: selectedHarvestForEdit.harvest_date,
        fresh_quantity_kg: selectedHarvestForEdit.fresh_quantity_kg,
        dried_quantity_kg: selectedHarvestForEdit.dried_quantity_kg,
        notes: selectedHarvestForEdit.notes || ''
      });
      if (res.success) {
        showNotification('success', 'Daily harvest record updated!');
        setSelectedHarvestForEdit(null);
        await loadHarvestCycleData();
      } else { showNotification('error', res.message); }
    } catch (err) { showNotification('error', err.message); }
  };

  const handleDeleteDailyRecord = async () => {
    if (!selectedHarvestForDelete) return;
    try {
      const res = await deleteFarmerHarvestApi(selectedHarvestForDelete.id);
      if (res.success) {
        showNotification('success', 'Daily harvest record deleted!');
        setSelectedHarvestForDelete(null);
        await loadHarvestCycleData();
      } else { showNotification('error', res.message); }
    } catch (err) { showNotification('error', err.message); }
  };

  // Plantations Submit
  const handlePlantationSubmit = async (e) => {
    e.preventDefault();
    if (!plantationForm.name || !plantationForm.location || !plantationForm.area_acres || !plantationForm.number_of_plants) {
      return showNotification('error', 'Please fill in name, location, area in acres, and number of plants');
    }
    const numPlants = Number(plantationForm.number_of_plants);
    if (!Number.isInteger(numPlants) || numPlants < 1) {
      return showNotification('error', 'Number of plants must be a positive whole number (minimum 1)');
    }
    try {
      const res = await createFarmerPlantationApi(plantationForm);
      if (res.success) {
        showNotification('success', 'New Plantation created!');
        setShowAddPlantationModal(false);
        setPlantationForm({ name: '', location: '', area_acres: '', number_of_plants: '', variety: 'Njallani Gold', details: '' });
        loadData();
      } else { showNotification('error', res.message); }
    } catch (err) { showNotification('error', err.message); }
  };

  // Variety Submit
  const handleVarietySubmit = async (e) => {
    e.preventDefault();
    if (!varietyForm.name) return showNotification('error', 'Variety name is required');
    try {
      const res = await createFarmerVarietyApi(varietyForm);
      if (res.success) {
        showNotification('success', 'Cardamom Variety added!');
        setShowAddVarietyModal(false);
        setCycleForm(prev => ({ ...prev, variety: varietyForm.name }));
        setVarietyForm({ name: '', code: '', description: '', optimal_altitude: '' });
        loadData();
      } else { showNotification('error', res.message); }
    } catch (err) { showNotification('error', err.message); }
  };

  // Agrochemical Submit
  const handleAgrochemicalSubmit = async (e) => {
    e.preventDefault();
    const plantationId = agrochemicalForm.plantation_id || agrochemicalForm.plantation;
    const productName = agrochemicalForm.name || agrochemicalForm.product_name;
    const dateApplied = agrochemicalForm.application_date || agrochemicalForm.date_applied;
    const nextDateToApply = agrochemicalForm.next_application_date !== undefined ? agrochemicalForm.next_application_date : agrochemicalForm.next_date_to_apply;
    const cost = agrochemicalForm.cost;
    const quantity = agrochemicalForm.quantity;

    if (!plantationId || !productName || !quantity || !dateApplied || cost === '' || cost === null || cost === undefined) {
      return showNotification('error', 'Please fill in all required fields');
    }
    const costVal = parseFloat(cost);
    if (isNaN(costVal) || costVal <= 0) {
      return showNotification('error', 'Cost of Fertilizer must be a positive number');
    }
    const qtyVal = parseFloat(quantity);
    if (isNaN(qtyVal) || qtyVal <= 0) {
      return showNotification('error', 'Quantity must be a positive number');
    }

    const payload = {
      usage_type: agrochemicalForm.usage_type || 'FERTILIZER',
      plantation_id: plantationId,
      plantation: plantationId,
      name: productName,
      product_name: productName,
      quantity: qtyVal,
      unit: agrochemicalForm.unit || 'KG',
      application_date: dateApplied,
      date_applied: dateApplied,
      next_application_date: nextDateToApply || null,
      next_date_to_apply: nextDateToApply || null,
      cost: costVal,
      purpose: agrochemicalForm.purpose || ''
    };

    try {
      const res = await createFarmerAgrochemicalApi(payload);
      if (res.success) {
        showNotification('success', `${agrochemicalForm.usage_type || 'Fertilizer'} record saved!`);
        setShowAddAgrochemicalModal(false);
        setAgrochemicalForm({
          usage_type: 'FERTILIZER', plantation_id: '', plantation: '', name: '', product_name: '', quantity: '', unit: 'KG',
          application_date: new Date().toISOString().split('T')[0],
          date_applied: new Date().toISOString().split('T')[0],
          next_application_date: '', next_date_to_apply: '', cost: '', purpose: ''
        });
        await loadSubTabContent(activeTab || 'fertilizer');
        await loadData();
      } else {
        showNotification('error', res.message || 'Failed to save agrochemical record');
      }
    } catch (err) {
      showNotification('error', err.message || 'Error saving agrochemical record');
    }
  };

  // Irrigation Submit
  const handleIrrigationSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await createFarmerIrrigationApi(irrigationForm);
      if (res.success) {
        showNotification('success', 'Irrigation log saved!');
        setShowAddIrrigationModal(false);
        loadSubTabContent('irrigation');
      } else { showNotification('error', res.message); }
    } catch (err) { showNotification('error', err.message); }
  };

  // Inventory Submit
  const handleInventorySubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await createFarmerInventoryApi(inventoryForm);
      if (res.success) {
        showNotification('success', 'Inventory item added!');
        setInventoryForm({ variety: '', grade: '', quantity_kg: '' });
        setShowAddInventoryModal(false);
        loadSubTabContent('inventory');
        loadData();
      } else { showNotification('error', res.message); }
    } catch (err) { showNotification('error', err.message); }
  };

  // Expense Submit
  const handleExpenseSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await createFarmerExpenseApi(expenseForm);
      if (res.success) {
        showNotification('success', 'Expense recorded!');
        setShowAddExpenseModal(false);
        loadSubTabContent('expenses');
        loadData();
      } else { showNotification('error', res.message); }
    } catch (err) { showNotification('error', err.message); }
  };

  // Farmer Respond to Purchase Request (Accept / Reject)
  const handleFarmerRespondPurchaseRequest = async (requestId, action, payload = {}) => {
    try {
      const res = await respondFarmerPurchaseRequestApi(requestId, action, payload);
      if (res.success) {
        if (action === 'ACCEPT') {
          showNotification('success', 'Purchase request accepted! Stock reserved and payment set to pending.');
        } else if (action === 'REJECT') {
          showNotification('success', 'Purchase request rejected.');
        } else if (action === 'CONFIRM_DIRECT_PAYMENT') {
          showNotification('success', 'Direct payment confirmed! Stock ready for pickup.');
        } else if (action === 'CONFIRM_HANDOVER') {
          showNotification('success', 'Stock handover confirmed! Transaction completed.');
        } else {
          showNotification('success', res.message || 'Action completed successfully.');
        }
        loadSubTabContent('purchase_requests');
        loadSubTabContent('inventory');
        loadSubTabContent('sales');
        loadSubTabContent('transactions');
        loadData();
      } else {
        showNotification('error', res.message || 'Failed to process purchase request');
      }
    } catch (err) {
      showNotification('error', err.message || 'Error processing purchase request');
    }
  };

  // Sidebar Menu Items matching screenshot EXACTLY
  const sidebarNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Layers },
    { id: 'plantation', label: 'My Plantation', icon: Sprout, badge: plantations.length },
    { id: 'fertilizer', label: 'Fertilizer & Pesticide', icon: FlaskConical },
    { id: 'irrigation', label: 'Irrigation', icon: Droplets, badge: 'Due', badgeType: 'due' },
    { id: 'harvest', label: 'Harvest', icon: Wheat, badge: activeCycle ? 1 : 0 },
    { id: 'inventory', label: 'Inventory', icon: Boxes, badge: inventory.length },
    { id: 'purchase_requests', label: 'Purchase Requests', icon: ShoppingCart, badge: purchaseRequests.filter(r => r.status === 'PENDING').length },
    { id: 'records', label: 'Sales & Ledger', icon: Receipt },
    { id: 'reports', label: 'Reports & Analytics', icon: BarChart3 },
    { id: 'profile', label: 'My Profile', icon: User },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#F4F7F4', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}>
      
      {/* ========================================================================= */}
      {/* SIDEBAR - MATCHES SCREENSHOT EXACTLY */}
      {/* ========================================================================= */}
      <aside style={{
        width: sidebarOpen ? '240px' : '70px',
        backgroundColor: '#FFFFFF',
        borderRight: '1px solid #E5EBE5',
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
            width: '38px', height: '38px', borderRadius: '50%',
            backgroundColor: '#2E7D32', display: 'flex', alignItems: 'center',
            justifyContent: 'center', color: '#FFFFFF', flexShrink: 0
          }}>
            <Sprout size={20} />
          </div>
          {sidebarOpen && (
            <div>
              <div style={{ fontSize: '1.15rem', fontWeight: '900', color: '#1B4D2E', letterSpacing: '-0.02em', lineHeight: '1.1' }}>
                Carda<span style={{ color: '#2E7D32' }}>Link</span>
              </div>
              <div style={{ fontSize: '0.65rem', fontWeight: '800', color: '#2E7D32', letterSpacing: '0.06em', textTransform: 'uppercase', marginTop: '2px' }}>
                FARMER ASSISTANT
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
                onClick={() => setActiveTab(item.id)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: sidebarOpen ? 'space-between' : 'center',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '12px',
                  border: 'none',
                  backgroundColor: isActive ? '#E8F5E9' : 'transparent',
                  color: isActive ? '#2E7D32' : '#4A5568',
                  fontSize: '0.85rem',
                  fontWeight: isActive ? '800' : '600',
                  cursor: 'pointer',
                  marginBottom: '0.25rem',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Icon size={18} color={isActive ? '#2E7D32' : '#718096'} />
                  {sidebarOpen && <span>{item.label}</span>}
                </div>
                {sidebarOpen && item.badge !== undefined && (
                  <span style={{
                    fontSize: '0.7rem',
                    fontWeight: '800',
                    padding: item.badgeType === 'due' ? '0.15rem 0.5rem' : '0.1rem 0.45rem',
                    borderRadius: '999px',
                    backgroundColor: item.badgeType === 'due' ? '#E0F2FE' : '#E8F5E9',
                    color: item.badgeType === 'due' ? '#0284C7' : '#2E7D32',
                    border: item.badgeType === 'due' ? '1px solid #BAE6FD' : '1px solid #C8E6C9'
                  }}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div style={{ padding: '0.85rem', borderTop: '1px solid #E5EBE5', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {sidebarOpen && (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              backgroundColor: '#F8FAF8', padding: '0.5rem 0.75rem', borderRadius: '10px',
              border: '1px solid #E5EBE5', fontSize: '0.8rem', fontWeight: '700', color: '#2D3748'
            }}>
              <span>🌐 Language</span>
              <span style={{ backgroundColor: '#2E7D32', color: '#FFF', padding: '0.2rem 0.55rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '700' }}>
                മലയാളം
              </span>
            </div>
          )}

          <button
            onClick={handleLogout}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.55rem 0.75rem', borderRadius: '10px', border: 'none',
              backgroundColor: 'transparent', color: '#E53E3E', fontSize: '0.85rem',
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
        
        {/* Top Header - MATCHES SCREENSHOT EXACTLY */}
        <header style={{
          backgroundColor: '#FFFFFF',
          borderBottom: '1px solid #E5EBE5',
          padding: '0.85rem 2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 40
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              style={{
                width: '34px', height: '34px', borderRadius: '8px', border: '1px solid #E5EBE5',
                backgroundColor: '#F8FAF8', display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: '#4A5568'
              }}
            >
              <Menu size={18} />
            </button>
            <div>
              <h1 style={{ fontSize: '1.25rem', fontWeight: '900', color: '#1A202C', margin: 0 }}>
                {activeTab === 'dashboard' ? 'Dashboard' : activeTab === 'harvest' ? 'Harvest' : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
              </h1>
              <div style={{ fontSize: '0.75rem', color: '#718096', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '2px' }}>
                <span style={{ color: '#2E7D32' }}>📍</span> Wed, Sep 16 • Cardamom Belt, Idukki
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{
              backgroundColor: '#E8F5E9', color: '#2E7D32', border: '1px solid #C8E6C9',
              padding: '0.35rem 0.75rem', borderRadius: '999px', fontSize: '0.78rem',
              fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.35rem'
            }}>
              🌐 മലയാളം
            </div>

            <button style={{ width: '36px', height: '36px', borderRadius: '50%', border: '1px solid #E5EBE5', backgroundColor: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4A5568' }}>
              <Bell size={18} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', paddingLeft: '0.5rem', borderLeft: '1px solid #E5EBE5' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#2E7D32', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '0.9rem' }}>
                {user?.full_name ? user.full_name.charAt(0) : 'R'}
              </div>
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: '800', color: '#1A202C', lineHeight: '1.2' }}>{user?.full_name || 'Ramesh K. Pillai'}</div>
                <div style={{ fontSize: '0.7rem', color: '#2E7D32', fontWeight: '700' }}>✓ My Profile</div>
              </div>
            </div>
          </div>
        </header>

        {/* Global Notification Banner */}
        {message.text && (
          <div style={{
            margin: '1rem 2rem 0', padding: '0.85rem 1.25rem', borderRadius: '12px',
            backgroundColor: message.type === 'success' ? '#E8F5E9' : '#FFEBEE',
            color: message.type === 'success' ? '#2E7D32' : '#C62828',
            border: `1px solid ${message.type === 'success' ? '#A5D6A7' : '#EF9A9A'}`,
            display: 'flex', alignItems: 'center', gap: '0.65rem', fontWeight: '700', fontSize: '0.88rem'
          }}>
            {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            {message.text}
          </div>
        )}

        {/* Content Body Container */}
        <div style={{ padding: '1.75rem 2rem', flex: 1 }}>

          {/* ========================================================================= */}
          {/* TAB 1: MAIN DASHBOARD OVERVIEW - MATCHES SCREENSHOT EXACTLY */}
          {/* ========================================================================= */}
          {activeTab === 'dashboard' && (
            <div>
              {/* Banner Welcome Card */}
              <div style={{
                backgroundColor: '#FFFFFF', borderRadius: '20px', padding: '1.5rem 1.75rem',
                border: '1px solid #E5EBE5', marginBottom: '1.5rem', boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}>
                <div>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: '900', color: '#1A202C', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    Good Evening, {user?.full_name || 'Ramesh K. Pillai'} 👋
                  </h2>
                  <p style={{ fontSize: '0.88rem', color: '#718096', margin: '0.3rem 0 0', fontWeight: '500' }}>
                    Manage your cardamom plantation easily from one place.
                  </p>
                </div>
                <div style={{
                  backgroundColor: '#E8F5E9', color: '#2E7D32', border: '1px solid #C8E6C9',
                  padding: '0.4rem 0.85rem', borderRadius: '999px', fontSize: '0.78rem', fontWeight: '800',
                  display: 'flex', alignItems: 'center', gap: '0.35rem'
                }}>
                  🌱 {plantations.length} Active Estate{plantations.length === 1 ? '' : 's'}
                </div>
              </div>

              {/* Stat Cards Row - Initial Values & Real Data Overview */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                
                {/* Card 1: Total Plantations */}
                <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '1.25rem', border: '1px solid #E5EBE5', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: '800', color: '#718096' }}>Total Plantations</span>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#E8F5E9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2E7D32' }}>
                      <Sprout size={16} />
                    </div>
                  </div>
                  <div style={{ fontSize: '1.8rem', fontWeight: '900', color: '#1A202C', margin: '0.4rem 0 0.1rem' }}>
                    {totalPlantations}
                  </div>
                  <div style={{ fontSize: '0.75rem', fontWeight: '800', color: '#2E7D32' }}>
                    {plantations.reduce((acc, p) => acc + (parseFloat(p.area_acres) || 0), 0)} Acres Total
                  </div>
                </div>

                {/* Card 2: Total Harvest */}
                <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '1.25rem', border: '1px solid #E5EBE5', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: '800', color: '#718096' }}>Total Harvest</span>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#E8F5E9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2E7D32' }}>
                      <Wheat size={16} />
                    </div>
                  </div>
                  <div style={{ fontSize: '1.8rem', fontWeight: '900', color: '#1A202C', margin: '0.4rem 0 0.1rem' }}>
                    {totalHarvestText}
                  </div>
                  <div style={{ fontSize: '0.75rem', fontWeight: '800', color: '#2E7D32' }}>
                    Fresh Yield Total
                  </div>
                </div>

                {/* Card 3: Total Inventory */}
                <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '1.25rem', border: '1px solid #E5EBE5', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: '800', color: '#718096' }}>Total Inventory</span>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#E8F5E9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2E7D32' }}>
                      <Boxes size={16} />
                    </div>
                  </div>
                  <div style={{ fontSize: '1.8rem', fontWeight: '900', color: '#1A202C', margin: '0.4rem 0 0.1rem' }}>
                    {totalInventoryText}
                  </div>
                  <div style={{ fontSize: '0.75rem', fontWeight: '800', color: '#2E7D32' }}>Available Stock</div>
                </div>

                {/* Card 4: Total Sales */}
                <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '1.25rem', border: '1px solid #E5EBE5', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: '800', color: '#718096' }}>Total Sales</span>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#E8F5E9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2E7D32' }}>
                      <TrendingUp size={16} />
                    </div>
                  </div>
                  <div style={{ fontSize: '1.8rem', fontWeight: '900', color: '#1A202C', margin: '0.4rem 0 0.1rem' }}>
                    {totalSalesText}
                  </div>
                  <div style={{ fontSize: '0.75rem', fontWeight: '800', color: '#2E7D32' }}>Revenue</div>
                </div>

                {/* Card 5: Total Expenses */}
                <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '1.25rem', border: '1px solid #E5EBE5', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: '800', color: '#718096' }}>Total Expenses</span>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#FFEBEE', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#C62828' }}>
                      <Receipt size={16} />
                    </div>
                  </div>
                  <div style={{ fontSize: '1.8rem', fontWeight: '900', color: '#1A202C', margin: '0.4rem 0 0.1rem' }}>
                    {totalExpensesText}
                  </div>
                  <div style={{ fontSize: '0.75rem', fontWeight: '800', color: '#C62828' }}>Total Spent</div>
                </div>

                {/* Card 6: Total Transactions */}
                <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '1.25rem', border: '1px solid #E5EBE5', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: '800', color: '#718096' }}>Total Transactions</span>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#E8F5E9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2E7D32' }}>
                      <CreditCard size={16} />
                    </div>
                  </div>
                  <div style={{ fontSize: '1.8rem', fontWeight: '900', color: '#1A202C', margin: '0.4rem 0 0.1rem' }}>
                    {totalTransactions}
                  </div>
                  <div style={{ fontSize: '0.75rem', fontWeight: '800', color: '#2E7D32' }}>Completed</div>
                </div>

                {/* Card 7: Total Fertilizer Usage */}
                <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '1.25rem', border: '1px solid #E5EBE5', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: '800', color: '#718096' }}>Total Fertilizer Usage</span>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#E8F5E9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2E7D32' }}>
                      <FlaskConical size={16} />
                    </div>
                  </div>
                  <div style={{ fontSize: '1.8rem', fontWeight: '900', color: '#1A202C', margin: '0.4rem 0 0.1rem' }}>
                    {totalFertilizerText}
                  </div>
                  <div style={{ fontSize: '0.75rem', fontWeight: '800', color: '#2E7D32' }}>Applied</div>
                </div>

                {/* Card 8: Total Pesticide Usage */}
                <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '1.25rem', border: '1px solid #E5EBE5', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: '800', color: '#718096' }}>Total Pesticide Usage</span>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#E8F5E9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2E7D32' }}>
                      <ShieldCheck size={16} />
                    </div>
                  </div>
                  <div style={{ fontSize: '1.8rem', fontWeight: '900', color: '#1A202C', margin: '0.4rem 0 0.1rem' }}>
                    {totalPesticideUsage}
                  </div>
                  <div style={{ fontSize: '0.75rem', fontWeight: '800', color: '#2E7D32' }}>Applications</div>
                </div>

                {/* Card 9: Total Irrigation Records */}
                <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '1.25rem', border: '1px solid #E5EBE5', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: '800', color: '#718096' }}>Total Irrigation Records</span>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#E0F2FE', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0284C7' }}>
                      <Droplets size={16} />
                    </div>
                  </div>
                  <div style={{ fontSize: '1.8rem', fontWeight: '900', color: '#0284C7', margin: '0.4rem 0 0.1rem' }}>
                    {totalIrrigationRecords}
                  </div>
                  <div style={{ fontSize: '0.75rem', fontWeight: '800', color: '#0284C7' }}>Irrigation Logs</div>
                </div>

                {/* Card 10: Active Harvest Cycles */}
                <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '1.25rem', border: '1px solid #E5EBE5', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: '800', color: '#718096' }}>Active Harvest Cycles</span>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#E8F5E9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2E7D32' }}>
                      <RefreshCw size={16} />
                    </div>
                  </div>
                  <div style={{ fontSize: '1.8rem', fontWeight: '900', color: '#1A202C', margin: '0.4rem 0 0.1rem' }}>
                    {activeHarvestCycles}
                  </div>
                  <div style={{ fontSize: '0.75rem', fontWeight: '800', color: '#2E7D32' }}>In Progress</div>
                </div>

                {/* Card 11: Completed Harvest Cycles */}
                <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '1.25rem', border: '1px solid #E5EBE5', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: '800', color: '#718096' }}>Completed Harvest Cycles</span>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#E8F5E9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2E7D32' }}>
                      <CheckCircle2 size={16} />
                    </div>
                  </div>
                  <div style={{ fontSize: '1.8rem', fontWeight: '900', color: '#1A202C', margin: '0.4rem 0 0.1rem' }}>
                    {completedHarvestCycles}
                  </div>
                  <div style={{ fontSize: '0.75rem', fontWeight: '800', color: '#2E7D32' }}>Past Cycles</div>
                </div>

              </div>

              {/* Quick Actions Bar */}
              <div style={{
                backgroundColor: '#FFFFFF', borderRadius: '20px', padding: '1.25rem 1.5rem',
                border: '1px solid #E5EBE5', marginBottom: '1.5rem', boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
              }}>
                <div style={{ fontSize: '0.9rem', fontWeight: '900', color: '#1A202C', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span style={{ color: '#E53E3E' }}>⚡</span> Quick Actions
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <button onClick={() => setShowAddPlantationModal(true)} style={{ backgroundColor: '#E8F5E9', color: '#2E7D32', border: 'none', padding: '0.65rem 1.15rem', borderRadius: '12px', fontWeight: '800', fontSize: '0.82rem', cursor: 'pointer' }}>
                    + Add Plantation
                  </button>
                  <button onClick={() => { setAgrochemicalForm(p => ({ ...p, usage_type: 'FERTILIZER' })); setShowAddAgrochemicalModal(true); }} style={{ backgroundColor: '#E8F5E9', color: '#2E7D32', border: 'none', padding: '0.65rem 1.15rem', borderRadius: '12px', fontWeight: '800', fontSize: '0.82rem', cursor: 'pointer' }}>
                    🧪 Add Fertilizer
                  </button>
                  <button onClick={() => { setAgrochemicalForm(p => ({ ...p, usage_type: 'PESTICIDE' })); setShowAddAgrochemicalModal(true); }} style={{ backgroundColor: '#E8F5E9', color: '#2E7D32', border: 'none', padding: '0.65rem 1.15rem', borderRadius: '12px', fontWeight: '800', fontSize: '0.82rem', cursor: 'pointer' }}>
                    🪲 Add Pesticide
                  </button>
                  <button onClick={() => setShowAddIrrigationModal(true)} style={{ backgroundColor: '#E0F2FE', color: '#0284C7', border: 'none', padding: '0.65rem 1.15rem', borderRadius: '12px', fontWeight: '800', fontSize: '0.82rem', cursor: 'pointer' }}>
                    💧 Add Irrigation
                  </button>

                  {/* SOLID GREEN RECORD HARVEST BUTTON */}
                  <button
                    onClick={() => {
                      setActiveTab('harvest');
                    }}
                    style={{
                      backgroundColor: '#43A047', color: '#FFFFFF', border: 'none',
                      padding: '0.65rem 1.35rem', borderRadius: '12px', fontWeight: '900',
                      fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem',
                      cursor: 'pointer', boxShadow: '0 4px 10px rgba(67, 160, 71, 0.3)'
                    }}
                  >
                    <Wheat size={18} /> Record Harvest
                  </button>

                  <button onClick={() => setShowAddInventoryModal(true)} style={{ backgroundColor: '#E8F5E9', color: '#2E7D32', border: 'none', padding: '0.65rem 1.15rem', borderRadius: '12px', fontWeight: '800', fontSize: '0.82rem', cursor: 'pointer' }}>
                    📦 Update Inventory
                  </button>
                </div>
              </div>

              {/* Lower Section Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
                <div style={{ backgroundColor: '#FFFFFF', borderRadius: '20px', padding: '1.5rem', border: '1px solid #E5EBE5', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <div style={{ fontSize: '1rem', fontWeight: '900', color: '#1A202C' }}>🌱 My Plantation</div>
                    <button onClick={() => setActiveTab('plantation')} style={{ background: 'none', border: 'none', color: '#2E7D32', fontWeight: '800', fontSize: '0.8rem', cursor: 'pointer' }}>View All →</button>
                  </div>
                  {plantations.length > 0 ? (
                    <div style={{ backgroundColor: '#F8FAF8', borderRadius: '14px', padding: '1.15rem', border: '1px solid #E5EBE5' }}>
                      <div style={{ fontSize: '1.05rem', fontWeight: '900', color: '#1A202C' }}>{plantations[0].name}</div>
                      <div style={{ fontSize: '0.78rem', color: '#718096', fontWeight: '600', margin: '0.2rem 0 0.6rem' }}>
                        {plantations[0].variety || 'Cardamom'} • {plantations[0].area_acres} Acres • {plantations[0].location}
                      </div>
                      <span style={{ backgroundColor: '#E8F5E9', color: '#2E7D32', border: '1px solid #C8E6C9', padding: '0.25rem 0.6rem', borderRadius: '6px', fontSize: '0.72rem', fontWeight: '800' }}>Active Plantation</span>
                    </div>
                  ) : (
                    <div style={{ backgroundColor: '#F8FAF8', borderRadius: '14px', padding: '1.15rem', border: '1px solid #E5EBE5', color: '#718096', fontSize: '0.85rem' }}>
                      No plantations registered yet.
                    </div>
                  )}
                </div>

                <div style={{ backgroundColor: '#FFFFFF', borderRadius: '20px', padding: '1.5rem', border: '1px solid #E5EBE5', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <div style={{ fontSize: '1rem', fontWeight: '900', color: '#1A202C' }}>💧 Irrigation</div>
                    <button onClick={() => setActiveTab('irrigation')} style={{ background: 'none', border: 'none', color: '#0284C7', fontWeight: '800', fontSize: '0.8rem', cursor: 'pointer' }}>View Schedule →</button>
                  </div>
                  {irrigations.length > 0 ? (
                    <div style={{ backgroundColor: '#F0F9FF', borderRadius: '14px', padding: '1.15rem', border: '1px solid #BAE6FD' }}>
                      <div style={{ fontSize: '0.78rem', fontWeight: '800', color: '#0284C7' }}>Latest Irrigation</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: '900', color: '#0369A1', margin: '0.2rem 0' }}>{irrigations[0].irrigation_date}</div>
                      <div style={{ fontSize: '0.78rem', color: '#0369A1', fontWeight: '600' }}>Estate: {irrigations[0].plantation_name}</div>
                    </div>
                  ) : (
                    <div style={{ backgroundColor: '#F0F9FF', borderRadius: '14px', padding: '1.15rem', border: '1px solid #BAE6FD', color: '#0369A1', fontSize: '0.85rem' }}>
                      No irrigation records yet.
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: HARVEST CYCLE SYSTEM (`activeTab === 'harvest'`) */}
          {/* ========================================================================= */}
          {activeTab === 'harvest' && (
            <div>
              {/* Header */}
              <div style={{
                backgroundColor: '#FFFFFF', borderRadius: '20px', padding: '1.5rem 1.75rem',
                border: '1px solid #E5EBE5', marginBottom: '1.5rem', boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem'
              }}>
                <div>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: '900', color: '#1B4D2E', margin: 0 }}>
                    Harvest
                  </h2>
                  <p style={{ fontSize: '0.88rem', color: '#718096', margin: '0.2rem 0 0', fontWeight: '500' }}>
                    Record and manage your cardamom harvest day by day.
                  </p>
                </div>

                {!activeCycle ? (
                  <button
                    onClick={() => setShowStartCycleModal(true)}
                    style={{
                      backgroundColor: '#43A047', color: '#FFFFFF', border: 'none',
                      padding: '0.7rem 1.4rem', borderRadius: '12px', fontWeight: '900',
                      fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '0.5rem',
                      cursor: 'pointer', boxShadow: '0 4px 10px rgba(67, 160, 71, 0.3)'
                    }}
                  >
                    <Plus size={18} /> + Start New Harvest
                  </button>
                ) : (
                  <button
                    onClick={() => setShowCompleteConfirmModal(true)}
                    style={{
                      backgroundColor: '#16A34A', color: '#FFFFFF', border: 'none',
                      padding: '0.7rem 1.4rem', borderRadius: '12px', fontWeight: '900',
                      fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '0.5rem',
                      cursor: 'pointer', boxShadow: '0 4px 10px rgba(22, 163, 74, 0.3)'
                    }}
                  >
                    <CheckCircle size={18} /> ✓ Complete Harvest
                  </button>
                )}
              </div>

              {/* SECTION A: ACTIVE HARVEST CYCLE CARD & DAILY ENTRY */}
              {activeCycle ? (
                <div>
                  {/* Active Harvest Card */}
                  <div style={{
                    backgroundColor: '#FFFFFF', borderRadius: '20px', padding: '1.5rem',
                    border: '2px solid #A5D6A7', marginBottom: '1.5rem', boxShadow: '0 4px 12px rgba(46, 125, 50, 0.05)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                      <div>
                        <div style={{ fontSize: '0.75rem', fontWeight: '900', color: '#2E7D32', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          ACTIVE HARVEST
                        </div>
                        <h3 style={{ fontSize: '1.4rem', fontWeight: '900', color: '#1B4D2E', margin: '0.2rem 0 0.4rem' }}>
                          {activeCycle.name}
                        </h3>
                        <div style={{ fontSize: '0.85rem', color: '#4A5568', fontWeight: '700', display: 'flex', gap: '1.25rem', flexWrap: 'wrap' }}>
                          <span>📅 {activeCycle.start_date} → {activeCycle.expected_end_date}</span>
                          <span>🌱 Plantation: <strong>{activeCycle.plantation_name}</strong></span>
                          <span>🌾 Variety: <strong>{activeCycle.variety}</strong></span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <span style={{
                          backgroundColor: '#E8F5E9', color: '#2E7D32', border: '1px solid #C8E6C9',
                          padding: '0.35rem 0.85rem', borderRadius: '999px', fontSize: '0.8rem', fontWeight: '900',
                          display: 'flex', alignItems: 'center', gap: '0.35rem'
                        }}>
                          ● Active
                        </span>

                        <button
                          onClick={() => setShowCompleteConfirmModal(true)}
                          style={{
                            backgroundColor: '#2E7D32', color: '#FFF', border: 'none',
                            padding: '0.6rem 1.15rem', borderRadius: '10px', fontWeight: '900',
                            fontSize: '0.82rem', cursor: 'pointer'
                          }}
                        >
                          ✓ Complete Harvest
                        </button>
                      </div>
                    </div>

                    {/* LIVE CURRENT HARVEST TOTALS (Dynamic from DB) */}
                    <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid #E5EBE5' }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: '900', color: '#718096', marginBottom: '0.75rem', textTransform: 'uppercase' }}>
                        Current Harvest Summary
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
                        <div style={{ backgroundColor: '#F8FAF8', borderRadius: '12px', padding: '0.85rem 1rem', border: '1px solid #E5EBE5' }}>
                          <div style={{ fontSize: '0.72rem', fontWeight: '800', color: '#718096' }}>Harvest Days</div>
                          <div style={{ fontSize: '1.5rem', fontWeight: '900', color: '#1B4D2E' }}>
                            {liveSummary?.total_harvest_days || 0} Days
                          </div>
                        </div>

                        <div style={{ backgroundColor: '#F8FAF8', borderRadius: '12px', padding: '0.85rem 1rem', border: '1px solid #E5EBE5' }}>
                          <div style={{ fontSize: '0.72rem', fontWeight: '800', color: '#718096' }}>Fresh Harvest</div>
                          <div style={{ fontSize: '1.5rem', fontWeight: '900', color: '#2E7D32' }}>
                            {liveSummary?.total_fresh_harvest_kg || 0} kg
                          </div>
                        </div>

                        <div style={{ backgroundColor: '#F8FAF8', borderRadius: '12px', padding: '0.85rem 1rem', border: '1px solid #E5EBE5' }}>
                          <div style={{ fontSize: '0.72rem', fontWeight: '800', color: '#718096' }}>Dried Harvest</div>
                          <div style={{ fontSize: '1.5rem', fontWeight: '900', color: '#D97706' }}>
                            {liveSummary?.total_dried_harvest_kg || 0} kg
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ADD TODAY'S HARVEST FORM CARD */}
                  <div style={{
                    backgroundColor: '#FFFFFF', borderRadius: '20px', padding: '1.5rem',
                    border: '1px solid #E5EBE5', marginBottom: '1.5rem', boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
                  }}>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: '900', color: '#1B4D2E', margin: '0 0 1rem' }}>
                      Add Today's Harvest
                    </h3>

                    <form onSubmit={handleAddDailyHarvestSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', alignItems: 'end' }}>
                      <div>
                        <label style={{ fontSize: '0.78rem', fontWeight: '800', color: '#2D3748', display: 'block', marginBottom: '0.35rem' }}>
                          Harvest Date *
                        </label>
                        <input
                          type="date"
                          required
                          min={activeCycle.start_date}
                          max={activeCycle.expected_end_date}
                          value={dailyForm.harvest_date}
                          onChange={e => setDailyForm({ ...dailyForm, harvest_date: e.target.value })}
                          style={{ width: '100%', padding: '0.6rem', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '0.88rem' }}
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: '0.78rem', fontWeight: '800', color: '#2D3748', display: 'block', marginBottom: '0.35rem' }}>
                          Fresh Harvest (kg) *
                        </label>
                        <input
                          type="number" step="0.01" min="0.01" required placeholder="e.g. 18"
                          value={dailyForm.fresh_quantity_kg}
                          onChange={e => setDailyForm({ ...dailyForm, fresh_quantity_kg: e.target.value })}
                          style={{ width: '100%', padding: '0.6rem', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '0.88rem' }}
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: '0.78rem', fontWeight: '800', color: '#2D3748', display: 'block', marginBottom: '0.35rem' }}>
                          Dried/Cured Harvest (kg)
                        </label>
                        <input
                          type="number" step="0.01" min="0" placeholder="e.g. 4 (optional)"
                          value={dailyForm.dried_quantity_kg}
                          onChange={e => setDailyForm({ ...dailyForm, dried_quantity_kg: e.target.value })}
                          style={{ width: '100%', padding: '0.6rem', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '0.88rem' }}
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: '0.78rem', fontWeight: '800', color: '#2D3748', display: 'block', marginBottom: '0.35rem' }}>
                          Notes (Optional)
                        </label>
                        <input
                          type="text" placeholder="e.g. Morning harvest"
                          value={dailyForm.notes}
                          onChange={e => setDailyForm({ ...dailyForm, notes: e.target.value })}
                          style={{ width: '100%', padding: '0.6rem', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '0.88rem' }}
                        />
                      </div>

                      <div>
                        <button
                          type="submit"
                          style={{
                            width: '100%', backgroundColor: '#43A047', color: '#FFFFFF', border: 'none',
                            padding: '0.65rem 1rem', borderRadius: '10px', fontWeight: '900', fontSize: '0.88rem',
                            cursor: 'pointer', boxShadow: '0 4px 10px rgba(67, 160, 71, 0.3)'
                          }}
                        >
                          [ Save Today's Harvest ]
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* DAILY HARVEST RECORDS TABLE */}
                  <div style={{
                    backgroundColor: '#FFFFFF', borderRadius: '20px', padding: '1.5rem',
                    border: '1px solid #E5EBE5', marginBottom: '1.5rem', boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
                  }}>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: '900', color: '#1B4D2E', margin: '0 0 1rem' }}>
                      Daily Harvest Records ({activeCycle.name})
                    </h3>

                    {(!liveSummary?.daily_records || liveSummary.daily_records.length === 0) ? (
                      <div style={{ padding: '2.5rem', textAlign: 'center', color: '#718096', backgroundColor: '#F8FAF8', borderRadius: '12px' }}>
                        No daily harvest records entered yet for this cycle. Use the form above to record today's yield.
                      </div>
                    ) : (
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                          <thead>
                            <tr style={{ backgroundColor: '#F8FAF8', color: '#4A5568', borderBottom: '2px solid #E5EBE5' }}>
                              <th style={{ padding: '0.75rem 1rem' }}>Date</th>
                              <th style={{ padding: '0.75rem 1rem' }}>Fresh Harvest</th>
                              <th style={{ padding: '0.75rem 1rem' }}>Dried/Cured</th>
                              <th style={{ padding: '0.75rem 1rem' }}>Notes</th>
                              <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {liveSummary.daily_records.map(r => (
                              <tr key={r.id} style={{ borderBottom: '1px solid #F4F7F4' }}>
                                <td style={{ padding: '0.75rem 1rem', fontWeight: '900', color: '#1B4D2E' }}>{r.harvest_date}</td>
                                <td style={{ padding: '0.75rem 1rem', fontWeight: '900', color: '#2E7D32' }}>{r.fresh_quantity_kg} kg</td>
                                <td style={{ padding: '0.75rem 1rem', fontWeight: '800', color: '#D97706' }}>{r.dried_quantity_kg ? `${r.dried_quantity_kg} kg` : '-'}</td>
                                <td style={{ padding: '0.75rem 1rem', color: '#718096' }}>{r.notes || '-'}</td>
                                <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                                  <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                                    <button
                                      onClick={() => setSelectedHarvestForEdit({ ...r })}
                                      style={{ backgroundColor: '#E0F2FE', border: 'none', color: '#0284C7', padding: '0.3rem 0.5rem', borderRadius: '6px', cursor: 'pointer' }}
                                    >
                                      Edit
                                    </button>
                                    <button
                                      onClick={() => setSelectedHarvestForDelete(r)}
                                      style={{ backgroundColor: '#FFEBEE', border: 'none', color: '#E53E3E', padding: '0.3rem 0.5rem', borderRadius: '6px', cursor: 'pointer' }}
                                    >
                                      Delete
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* NO ACTIVE HARVEST STATE */
                <div style={{
                  backgroundColor: '#FFFFFF', borderRadius: '20px', padding: '3rem 2rem',
                  border: '1px solid #E5EBE5', textAlign: 'center', marginBottom: '1.5rem'
                }}>
                  <Wheat size={48} color="#81C784" style={{ marginBottom: '0.75rem' }} />
                  <h3 style={{ fontSize: '1.3rem', fontWeight: '900', color: '#1B4D2E', margin: '0 0 0.4rem' }}>
                    No Active Harvest Cycle
                  </h3>
                  <p style={{ fontSize: '0.88rem', color: '#718096', maxWidth: '440px', margin: '0 auto 1.5rem' }}>
                    Start a new harvest cycle to record daily yields day by day. When finished harvesting, click Complete Harvest to compute final totals.
                  </p>
                  <button
                    onClick={() => setShowStartCycleModal(true)}
                    style={{
                      backgroundColor: '#43A047', color: '#FFFFFF', border: 'none',
                      padding: '0.75rem 1.5rem', borderRadius: '12px', fontWeight: '900',
                      fontSize: '0.9rem', cursor: 'pointer', boxShadow: '0 4px 12px rgba(67, 160, 71, 0.3)'
                    }}
                  >
                    + Start New Harvest
                  </button>
                </div>
              )}

              {/* SECTION B: HARVEST HISTORY (COMPLETED HARVEST CYCLES) */}
              <div style={{
                backgroundColor: '#FFFFFF', borderRadius: '20px', padding: '1.5rem',
                border: '1px solid #E5EBE5', boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
              }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: '900', color: '#1B4D2E', margin: '0 0 1rem' }}>
                  Harvest History (Completed Harvests)
                </h3>

                {harvestHistory.length === 0 ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: '#718096', fontSize: '0.85rem' }}>
                    No completed harvest cycles yet. Past completed harvests will appear here.
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
                    {harvestHistory.map(cycle => (
                      <div key={cycle.id} style={{ backgroundColor: '#F8FAF8', borderRadius: '14px', padding: '1.25rem', border: '1px solid #E5EBE5' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <div style={{ fontSize: '1.05rem', fontWeight: '900', color: '#1A202C' }}>{cycle.name}</div>
                            <div style={{ fontSize: '0.78rem', color: '#718096', fontWeight: '600', margin: '0.2rem 0' }}>
                              {cycle.start_date} – {cycle.expected_end_date}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#4A5568', fontWeight: '700' }}>
                              Estate: {cycle.plantation_name} | {cycle.variety}
                            </div>
                          </div>
                          <span style={{ backgroundColor: '#E8F5E9', color: '#2E7D32', padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.72rem', fontWeight: '800' }}>
                            ✓ Completed
                          </span>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', marginTop: '0.85rem', paddingTop: '0.85rem', borderTop: '1px solid #E5EBE5', fontSize: '0.8rem', flexWrap: 'wrap' }}>
                          <div>
                            <span style={{ color: '#718096' }}>Total Fresh: </span>
                            <strong style={{ color: '#2E7D32' }}>{cycle.summary?.total_fresh_harvest_kg || 0} kg</strong>
                          </div>
                          <div>
                            <span style={{ color: '#718096' }}>Full Dry KG: </span>
                            <strong style={{ color: (cycle.summary?.full_dry_quantity_kg != null || cycle.full_dry_quantity != null) ? '#10B981' : '#DC2626' }}>
                              {cycle.summary?.full_dry_quantity_kg != null 
                                ? `${cycle.summary.full_dry_quantity_kg} KG` 
                                : (cycle.full_dry_quantity != null ? `${cycle.full_dry_quantity} KG` : 'Not Added')}
                            </strong>
                          </div>
                          <div>
                            <span style={{ color: '#718096' }}>Days: </span>
                            <strong>{cycle.summary?.total_harvest_days || 0}</strong>
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.85rem' }}>
                          <button
                            onClick={() => handleOpenAddDryKgModal(cycle)}
                            style={{
                              flex: 1, backgroundColor: '#E8F5E9', color: '#2E7D32',
                              border: '1px solid #A5D6A7', padding: '0.45rem', borderRadius: '8px', fontWeight: '800',
                              fontSize: '0.78rem', cursor: 'pointer'
                            }}
                          >
                            {(cycle.summary?.full_dry_quantity_kg != null || cycle.full_dry_quantity != null) ? '[ Update Dry KG ]' : '[ Add Dry KG ]'}
                          </button>

                          <button
                            onClick={() => handleViewCycleSummary(cycle.id)}
                            style={{
                              flex: 1, backgroundColor: '#FFFFFF', color: '#1B4D2E',
                              border: '1px solid #C8E6C9', padding: '0.45rem', borderRadius: '8px', fontWeight: '800',
                              fontSize: '0.78rem', cursor: 'pointer'
                            }}
                          >
                            [ View Summary ]
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
          {/* TAB SUB-VIEWS (PLANTATION, RESOURCES, INVENTORY, FINANCE, PROFILE) */}
          {/* ========================================================================= */}
          {activeTab === 'plantation' && (
            <div style={{ backgroundColor: '#FFFFFF', borderRadius: '20px', padding: '1.5rem', border: '1px solid #E5EBE5' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: '900', color: '#1B4D2E', margin: 0 }}>My Cardamom Plantations</h2>
                <button onClick={() => setShowAddPlantationModal(true)} style={{ backgroundColor: '#43A047', color: '#FFF', border: 'none', padding: '0.5rem 1rem', borderRadius: '10px', fontWeight: '800', cursor: 'pointer' }}>
                  + Add Plantation
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
                {plantations.map(p => (
                  <div key={p.id} style={{ backgroundColor: '#F8FAF8', borderRadius: '16px', padding: '1.25rem', border: '1px solid #E5EBE5' }}>
                    <div style={{ fontSize: '1.1rem', fontWeight: '900', color: '#1A202C' }}>{p.name}</div>
                    <div style={{ fontSize: '0.85rem', color: '#718096', margin: '0.2rem 0 0.75rem' }}>📍 {p.location}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: '800', color: '#2E7D32', backgroundColor: '#E8F5E9', padding: '0.4rem 0.75rem', borderRadius: '8px', flexWrap: 'wrap', gap: '0.4rem' }}>
                      <span>Area: {p.area_acres} Acres</span>
                      {p.number_of_plants != null && p.number_of_plants > 0 ? <span>Plants: {p.number_of_plants}</span> : null}
                      <span>Variety: {p.variety}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'fertilizer' && (
            <div style={{ backgroundColor: '#FFFFFF', borderRadius: '20px', padding: '1.5rem', border: '1px solid #E5EBE5' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: '900', color: '#1B4D2E', margin: 0 }}>Fertilizer & Pesticide Logs</h2>
                <button onClick={() => { setAgrochemicalForm(p => ({ ...p, usage_type: 'FERTILIZER' })); setShowAddAgrochemicalModal(true); }} style={{ backgroundColor: '#43A047', color: '#FFF', border: 'none', padding: '0.5rem 1rem', borderRadius: '10px', fontWeight: '800', cursor: 'pointer' }}>
                  + Record Usage
                </button>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ backgroundColor: '#F8FAF8', borderBottom: '1px solid #E5EBE5' }}>
                    <th style={{ padding: '0.75rem' }}>Date Applied</th>
                    <th style={{ padding: '0.75rem' }}>Next Date to Apply</th>
                    <th style={{ padding: '0.75rem' }}>Plantation</th>
                    <th style={{ padding: '0.75rem' }}>Product Name</th>
                    <th style={{ padding: '0.75rem' }}>Quantity</th>
                    <th style={{ padding: '0.75rem' }}>Cost</th>
                    <th style={{ padding: '0.75rem' }}>Purpose</th>
                  </tr>
                </thead>
                <tbody>
                  {agrochemicals.map(a => (
                    <tr key={a.id} style={{ borderBottom: '1px solid #F4F7F4' }}>
                      <td style={{ padding: '0.75rem', fontWeight: '800' }}>{a.application_date}</td>
                      <td style={{ padding: '0.75rem', color: '#0284C7', fontWeight: '700' }}>{a.next_application_date || '-'}</td>
                      <td style={{ padding: '0.75rem' }}>{a.plantation_name}</td>
                      <td style={{ padding: '0.75rem', fontWeight: '800', color: '#2E7D32' }}>{a.name}</td>
                      <td style={{ padding: '0.75rem' }}>{a.quantity} {a.unit}</td>
                      <td style={{ padding: '0.75rem', fontWeight: '800', color: '#1B4D2E' }}>{a.cost ? `₹${a.cost}` : '-'}</td>
                      <td style={{ padding: '0.75rem', color: '#718096' }}>{a.purpose || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'irrigation' && (
            <div style={{ backgroundColor: '#FFFFFF', borderRadius: '20px', padding: '1.5rem', border: '1px solid #E5EBE5' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: '900', color: '#1B4D2E', margin: 0 }}>Irrigation Schedules</h2>
                <button onClick={() => setShowAddIrrigationModal(true)} style={{ backgroundColor: '#0284C7', color: '#FFF', border: 'none', padding: '0.5rem 1rem', borderRadius: '10px', fontWeight: '800', cursor: 'pointer' }}>
                  + Add Irrigation
                </button>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ backgroundColor: '#F8FAF8', borderBottom: '1px solid #E5EBE5' }}>
                    <th style={{ padding: '0.75rem' }}>Date</th>
                    <th style={{ padding: '0.75rem' }}>Plantation</th>
                    <th style={{ padding: '0.75rem' }}>Method</th>
                    <th style={{ padding: '0.75rem' }}>Duration</th>
                    <th style={{ padding: '0.75rem' }}>Water Volume</th>
                  </tr>
                </thead>
                <tbody>
                  {irrigations.map(i => (
                    <tr key={i.id} style={{ borderBottom: '1px solid #F4F7F4' }}>
                      <td style={{ padding: '0.75rem', fontWeight: '800' }}>{i.irrigation_date}</td>
                      <td style={{ padding: '0.75rem' }}>{i.plantation_name}</td>
                      <td style={{ padding: '0.75rem' }}>{i.method}</td>
                      <td style={{ padding: '0.75rem' }}>{i.duration_hours} hrs</td>
                      <td style={{ padding: '0.75rem', color: '#0284C7', fontWeight: '800' }}>{i.water_volume_liters} L</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'inventory' && (
            <div style={{ backgroundColor: '#FFFFFF', borderRadius: '20px', padding: '1.5rem', border: '1px solid #E5EBE5' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: '900', color: '#1B4D2E', margin: 0 }}>My Inventory Stock</h2>
                <button onClick={() => setShowAddInventoryModal(true)} style={{ backgroundColor: '#43A047', color: '#FFF', border: 'none', padding: '0.5rem 1rem', borderRadius: '10px', fontWeight: '800', cursor: 'pointer' }}>
                  + Update Inventory
                </button>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ backgroundColor: '#F8FAF8', borderBottom: '1px solid #E5EBE5' }}>
                    <th style={{ padding: '0.75rem' }}>Batch Code</th>
                    <th style={{ padding: '0.75rem' }}>Variety</th>
                    <th style={{ padding: '0.75rem' }}>Grade</th>
                    <th style={{ padding: '0.75rem' }}>Quantity</th>
                    <th style={{ padding: '0.75rem' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {inventory.map(inv => (
                    <tr key={inv.id} style={{ borderBottom: '1px solid #F4F7F4' }}>
                      <td style={{ padding: '0.75rem', fontWeight: '800', color: '#1B4D2E' }}>{inv.batch_code}</td>
                      <td style={{ padding: '0.75rem' }}>{inv.variety}</td>
                      <td style={{ padding: '0.75rem' }}>{inv.grade}</td>
                      <td style={{ padding: '0.75rem', fontWeight: '900', color: '#2E7D32' }}>{inv.quantity_kg} {inv.unit}</td>
                      <td style={{ padding: '0.75rem' }}>
                        <span style={{ backgroundColor: '#E8F5E9', color: '#2E7D32', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: '800', fontSize: '0.75rem' }}>
                          {inv.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'purchase_requests' && (
            <div style={{ backgroundColor: '#FFFFFF', borderRadius: '20px', padding: '1.5rem', border: '1px solid #E5EBE5' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: '900', color: '#1B4D2E', margin: 0 }}>Trader Purchase Requests</h2>
                  <p style={{ fontSize: '0.85rem', color: '#718096', margin: '0.2rem 0 0' }}>Review purchase requests sent by Traders for your cardamom stock.</p>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {['', 'PENDING', 'PAYMENT_PENDING', 'PAID', 'READY_FOR_PICKUP', 'COMPLETED', 'REJECTED', 'CANCELLED'].map(st => (
                    <button
                      key={st}
                      onClick={() => setPrStatusFilter(st)}
                      style={{
                        padding: '0.35rem 0.75rem', borderRadius: '999px', fontSize: '0.78rem', fontWeight: '800',
                        border: '1px solid #C8E6C9', cursor: 'pointer',
                        backgroundColor: prStatusFilter === st ? '#E8F5E9' : '#FFFFFF',
                        color: prStatusFilter === st ? '#2E7D32' : '#718096'
                      }}
                    >
                      {st ? st.replace('_', ' ') : 'ALL REQUESTS'}
                    </button>
                  ))}
                </div>
              </div>

              {purchaseRequests.filter(r => !prStatusFilter || r.status === prStatusFilter).length === 0 ? (
                <div style={{ padding: '3rem', textAlign: 'center', color: '#718096', fontSize: '0.9rem' }}>
                  No trader purchase requests found. Incoming requests from Traders will appear here.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {purchaseRequests
                    .filter(r => !prStatusFilter || r.status === prStatusFilter)
                    .map(pr => (
                      <div
                        key={pr.id}
                        style={{
                          backgroundColor: '#FFFFFF',
                          borderRadius: '12px',
                          border: '1px solid #E5EBE5',
                          padding: '1rem 1.25rem',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          flexWrap: 'wrap',
                          gap: '1rem'
                        }}
                      >
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', flex: '1 1 320px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', fontSize: '0.9rem' }}>
                            <span style={{ fontWeight: '900', color: '#1B4D2E' }}>#PR-{pr.id}</span>
                            <span style={{ color: '#CBD5E1' }}>|</span>
                            <span style={{ fontSize: '0.88rem', color: '#2D3748' }}>Trader: <strong>{pr.trader_name}</strong></span>
                            <span style={{ color: '#CBD5E1' }}>|</span>
                            <span style={{ fontSize: '0.88rem', color: '#1B4D2E', fontWeight: '800' }}>{pr.variety}</span>
                            <span style={{ fontSize: '0.8rem', color: '#718096' }}>({pr.grade || '8mm Bold'})</span>
                            <span style={{ color: '#CBD5E1' }}>|</span>
                            <span style={{ fontWeight: '800', color: '#2D3748' }}>{pr.requested_quantity_kg} KG</span>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', flexWrap: 'wrap', fontSize: '0.85rem' }}>
                            <span style={{ fontWeight: '900', color: '#1B4D2E', fontSize: '1.05rem' }}>
                              ₹{parseFloat(pr.total_amount).toLocaleString('en-IN')}
                            </span>
                            <span style={{ color: '#CBD5E1' }}>|</span>
                            <span style={{
                              backgroundColor: pr.status === 'COMPLETED' ? '#E8F5E9' : pr.status === 'PAID' || pr.status === 'READY_FOR_PICKUP' ? '#E3F2FD' : pr.status === 'REJECTED' || pr.status === 'CANCELLED' ? '#FFEBEE' : '#FEF3C7',
                              color: pr.status === 'COMPLETED' ? '#2E7D32' : pr.status === 'PAID' || pr.status === 'READY_FOR_PICKUP' ? '#1565C0' : pr.status === 'REJECTED' || pr.status === 'CANCELLED' ? '#C62828' : '#D97706',
                              padding: '0.2rem 0.65rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: '800'
                            }}>
                              {pr.status}
                            </span>
                            <span style={{ color: '#CBD5E1' }}>|</span>
                            <span style={{ color: '#718096', fontSize: '0.82rem' }}>
                              📅 {pr.request_date || (pr.created_at ? pr.created_at.split('T')[0] : '30-09-2026')}
                            </span>
                          </div>
                        </div>

                        <div>
                          <button
                            onClick={() => handleOpenFarmerPRDetailsModal(pr)}
                            style={{
                              backgroundColor: '#1B4D2E',
                              color: '#FFFFFF',
                              border: 'none',
                              padding: '0.55rem 1.1rem',
                              borderRadius: '8px',
                              fontWeight: '800',
                              fontSize: '0.82rem',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.35rem'
                            }}
                          >
                            <Eye size={15} /> View Details
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'records' && (
            <div style={{ backgroundColor: '#FFFFFF', borderRadius: '20px', padding: '1.5rem', border: '1px solid #E5EBE5' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: '900', color: '#1B4D2E', margin: 0 }}>Farmer Sales & Financial Transactions</h2>
                  <p style={{ fontSize: '0.85rem', color: '#718096', margin: '0.2rem 0 0' }}>Log of completed cardamom sales and payment transactions.</p>
                </div>

                <div style={{ display: 'flex', backgroundColor: '#F4F7F4', padding: '3px', borderRadius: '10px' }}>
                  <button
                    onClick={() => setRecordsSubTab('sales')}
                    style={{
                      padding: '0.4rem 1rem', borderRadius: '8px', border: 'none',
                      backgroundColor: recordsSubTab === 'sales' ? '#43A047' : 'transparent',
                      color: recordsSubTab === 'sales' ? '#FFFFFF' : '#718096',
                      fontWeight: '800', fontSize: '0.82rem', cursor: 'pointer'
                    }}
                  >
                    Sales History ({sales.length})
                  </button>
                  <button
                    onClick={() => setRecordsSubTab('transactions')}
                    style={{
                      padding: '0.4rem 1rem', borderRadius: '8px', border: 'none',
                      backgroundColor: recordsSubTab === 'transactions' ? '#43A047' : 'transparent',
                      color: recordsSubTab === 'transactions' ? '#FFFFFF' : '#718096',
                      fontWeight: '800', fontSize: '0.82rem', cursor: 'pointer'
                    }}
                  >
                    Transactions ({transactions.length})
                  </button>
                </div>
              </div>

              {recordsSubTab === 'sales' && (
                sales.length === 0 ? (
                  <div style={{ padding: '3rem', textAlign: 'center', color: '#718096', fontSize: '0.9rem' }}>
                    No completed sales records yet. Completed sales will appear here automatically.
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#F8FAF8', borderBottom: '1px solid #E5EBE5', color: '#4A5568' }}>
                          <th style={{ padding: '0.75rem' }}>Sale ID</th>
                          <th style={{ padding: '0.75rem' }}>Buyer (Trader)</th>
                          <th style={{ padding: '0.75rem' }}>Plantation</th>
                          <th style={{ padding: '0.75rem' }}>Variety</th>
                          <th style={{ padding: '0.75rem' }}>Grade</th>
                          <th style={{ padding: '0.75rem' }}>Quantity Sold</th>
                          <th style={{ padding: '0.75rem' }}>Price / KG</th>
                          <th style={{ padding: '0.75rem' }}>Total Sale Amount</th>
                          <th style={{ padding: '0.75rem' }}>Sale Date</th>
                          <th style={{ padding: '0.75rem' }}>Transaction Code</th>
                          <th style={{ padding: '0.75rem' }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sales.map(s => (
                          <tr key={s.id} style={{ borderBottom: '1px solid #F4F7F4' }}>
                            <td style={{ padding: '0.75rem', fontWeight: '800', color: '#1B4D2E' }}>#SALE-{s.id}</td>
                            <td style={{ padding: '0.75rem', fontWeight: '800' }}>{s.buyer_name}</td>
                            <td style={{ padding: '0.75rem' }}>{s.plantation_name || 'Cardamom Estate'}</td>
                            <td style={{ padding: '0.75rem' }}>{s.cardamom_variety}</td>
                            <td style={{ padding: '0.75rem' }}>{s.grade || '8mm Bold'}</td>
                            <td style={{ padding: '0.75rem', fontWeight: '900', color: '#2E7D32' }}>{s.quantity_kg} kg</td>
                            <td style={{ padding: '0.75rem' }}>{s.price_per_kg ? `₹${parseFloat(s.price_per_kg).toLocaleString('en-IN')}` : '-'}</td>
                            <td style={{ padding: '0.75rem', fontWeight: '900', color: '#1B4D2E' }}>₹{parseFloat(s.total_amount).toLocaleString('en-IN')}</td>
                            <td style={{ padding: '0.75rem', color: '#718096' }}>{s.sale_date}</td>
                            <td style={{ padding: '0.75rem', fontWeight: '700', color: '#0284C7' }}>{s.transaction_code || '-'}</td>
                            <td style={{ padding: '0.75rem' }}>
                              <span style={{ backgroundColor: '#E8F5E9', color: '#2E7D32', padding: '0.2rem 0.55rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: '800' }}>
                                {s.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              )}

              {recordsSubTab === 'transactions' && (
                transactions.length === 0 ? (
                  <div style={{ padding: '3rem', textAlign: 'center', color: '#718096', fontSize: '0.9rem' }}>
                    No payment transactions recorded yet.
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#F8FAF8', borderBottom: '1px solid #E5EBE5', color: '#4A5568' }}>
                          <th style={{ padding: '0.75rem' }}>Tx Code</th>
                          <th style={{ padding: '0.75rem' }}>Sender (Buyer)</th>
                          <th style={{ padding: '0.75rem' }}>Receiver (Farmer)</th>
                          <th style={{ padding: '0.75rem' }}>Amount</th>
                          <th style={{ padding: '0.75rem' }}>Payment Method</th>
                          <th style={{ padding: '0.75rem' }}>Date</th>
                          <th style={{ padding: '0.75rem' }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {transactions.map(tx => (
                          <tr key={tx.id} style={{ borderBottom: '1px solid #F4F7F4' }}>
                            <td style={{ padding: '0.75rem', fontWeight: '800', color: '#0284C7' }}>{tx.transaction_code}</td>
                            <td style={{ padding: '0.75rem' }}>{tx.sender_name}</td>
                            <td style={{ padding: '0.75rem', fontWeight: '800' }}>{tx.receiver_name}</td>
                            <td style={{ padding: '0.75rem', fontWeight: '900', color: '#2E7D32' }}>₹{parseFloat(tx.amount).toLocaleString('en-IN')}</td>
                            <td style={{ padding: '0.75rem', color: '#718096' }}>{tx.payment_method}</td>
                            <td style={{ padding: '0.75rem', color: '#718096' }}>{tx.created_at ? tx.created_at.split('T')[0] : '2026-09-30'}</td>
                            <td style={{ padding: '0.75rem' }}>
                              <span style={{ backgroundColor: '#E8F5E9', color: '#2E7D32', padding: '0.2rem 0.55rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: '800' }}>
                                {tx.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              )}
            </div>
          )}

          {activeTab === 'reports' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {/* Header & Date Filter Bar */}
              <div style={{ backgroundColor: '#FFFFFF', borderRadius: '20px', padding: '1.5rem', border: '1px solid #E5EBE5', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.3rem', fontWeight: '900', color: '#1B4D2E', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <BarChart3 size={24} color="#2E7D32" /> Reports & Analytics
                  </h2>
                  <p style={{ fontSize: '0.85rem', color: '#718096', margin: '0.2rem 0 0' }}>
                    Real-time performance analytics calculated strictly from your actual farm records.
                  </p>
                </div>

                {/* Date Filter Controls */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: '800', color: '#4A5568', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Filter size={14} /> Date Filter:
                  </div>
                  {[
                    { id: 'all', label: 'All Time' },
                    { id: 'today', label: 'Today' },
                    { id: 'week', label: 'This Week' },
                    { id: 'month', label: 'This Month' },
                    { id: 'year', label: 'This Year' },
                    { id: 'custom', label: 'Custom Range' }
                  ].map(p => (
                    <button
                      key={p.id}
                      onClick={() => setReportsPeriod(p.id)}
                      style={{
                        padding: '0.35rem 0.75rem', borderRadius: '999px', fontSize: '0.78rem', fontWeight: '800',
                        border: reportsPeriod === p.id ? '1px solid #2E7D32' : '1px solid #E2E8F0', cursor: 'pointer',
                        backgroundColor: reportsPeriod === p.id ? '#E8F5E9' : '#FFFFFF',
                        color: reportsPeriod === p.id ? '#2E7D32' : '#718096'
                      }}
                    >
                      {p.label}
                    </button>
                  ))}

                  {reportsPeriod === 'custom' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginLeft: '0.5rem' }}>
                      <input
                        type="date"
                        value={reportsStartDate}
                        onChange={e => setReportsStartDate(e.target.value)}
                        style={{ padding: '0.3rem 0.5rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.78rem' }}
                      />
                      <span style={{ fontSize: '0.75rem', color: '#718096' }}>to</span>
                      <input
                        type="date"
                        value={reportsEndDate}
                        onChange={e => setReportsEndDate(e.target.value)}
                        style={{ padding: '0.3rem 0.5rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.78rem' }}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* 7 REPORT CARDS GRID */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
                
                {/* 1. Harvest Report Card */}
                <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E5EBE5', padding: '1.25rem', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#E8F5E9', color: '#2E7D32', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Wheat size={20} />
                        </div>
                        <h3 style={{ fontSize: '1.05rem', fontWeight: '900', color: '#1B4D2E', margin: 0 }}>Harvest Report</h3>
                      </div>
                      <span style={{ fontSize: '0.72rem', backgroundColor: '#F1F5F9', color: '#64748B', padding: '0.15rem 0.5rem', borderRadius: '999px', fontWeight: '700' }}>
                        {reportsData?.harvest_report?.total_harvest_days || 0} Harvest Days
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem', backgroundColor: '#F8FAF8', padding: '0.75rem', borderRadius: '10px', border: '1px solid #F1F5F9' }}>
                      <div>
                        <div style={{ fontSize: '0.72rem', color: '#718096', fontWeight: '700' }}>Total Fresh</div>
                        <div style={{ fontSize: '1.15rem', fontWeight: '900', color: '#2E7D32' }}>{reportsData?.harvest_report?.total_fresh_kg || 0} KG</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.72rem', color: '#718096', fontWeight: '700' }}>Total Cured Dry</div>
                        <div style={{ fontSize: '1.15rem', fontWeight: '900', color: '#D97706' }}>{reportsData?.harvest_report?.total_dry_kg || 0} KG</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.72rem', color: '#718096', fontWeight: '700' }}>Avg Fresh / Day</div>
                        <div style={{ fontSize: '0.9rem', fontWeight: '800', color: '#2D3748' }}>{reportsData?.harvest_report?.avg_fresh_per_day || 0} KG</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.72rem', color: '#718096', fontWeight: '700' }}>Completed Cycles</div>
                        <div style={{ fontSize: '0.9rem', fontWeight: '800', color: '#1B4D2E' }}>{reportsData?.harvest_report?.completed_cycles_count || 0} Cycles</div>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveReportModal('harvest')}
                    style={{ backgroundColor: '#1B4D2E', color: '#FFFFFF', border: 'none', width: '100%', padding: '0.6rem', borderRadius: '10px', fontWeight: '800', fontSize: '0.82rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}
                  >
                    <Eye size={15} /> View Details
                  </button>
                </div>

                {/* 2. Inventory Report Card */}
                <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E5EBE5', padding: '1.25rem', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#E0F2FE', color: '#0284C7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Boxes size={20} />
                        </div>
                        <h3 style={{ fontSize: '1.05rem', fontWeight: '900', color: '#1B4D2E', margin: 0 }}>Inventory Report</h3>
                      </div>
                      <span style={{ fontSize: '0.72rem', backgroundColor: '#F1F5F9', color: '#64748B', padding: '0.15rem 0.5rem', borderRadius: '999px', fontWeight: '700' }}>
                        {reportsData?.inventory_report?.items_count || 0} Stock Batches
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem', backgroundColor: '#F8FAF8', padding: '0.75rem', borderRadius: '10px', border: '1px solid #F1F5F9' }}>
                      <div>
                        <div style={{ fontSize: '0.72rem', color: '#718096', fontWeight: '700' }}>Total Quantity</div>
                        <div style={{ fontSize: '1.15rem', fontWeight: '900', color: '#0284C7' }}>{reportsData?.inventory_report?.total_inventory_kg || 0} KG</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.72rem', color: '#718096', fontWeight: '700' }}>Available for Sale</div>
                        <div style={{ fontSize: '1.15rem', fontWeight: '900', color: '#2E7D32' }}>{reportsData?.inventory_report?.available_kg || 0} KG</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.72rem', color: '#718096', fontWeight: '700' }}>In-Stock</div>
                        <div style={{ fontSize: '0.9rem', fontWeight: '800', color: '#2D3748' }}>{reportsData?.inventory_report?.in_stock_kg || 0} KG</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.72rem', color: '#718096', fontWeight: '700' }}>Sold Quantity</div>
                        <div style={{ fontSize: '0.9rem', fontWeight: '800', color: '#64748B' }}>{reportsData?.inventory_report?.sold_kg || 0} KG</div>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveReportModal('inventory')}
                    style={{ backgroundColor: '#1B4D2E', color: '#FFFFFF', border: 'none', width: '100%', padding: '0.6rem', borderRadius: '10px', fontWeight: '800', fontSize: '0.82rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}
                  >
                    <Eye size={15} /> View Details
                  </button>
                </div>

                {/* 3. Sales Report Card */}
                <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E5EBE5', padding: '1.25rem', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <ShoppingBag size={20} />
                        </div>
                        <h3 style={{ fontSize: '1.05rem', fontWeight: '900', color: '#1B4D2E', margin: 0 }}>Sales Report</h3>
                      </div>
                      <span style={{ fontSize: '0.72rem', backgroundColor: '#F1F5F9', color: '#64748B', padding: '0.15rem 0.5rem', borderRadius: '999px', fontWeight: '700' }}>
                        {reportsData?.sales_report?.total_sales || 0} Sales Logs
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem', backgroundColor: '#F8FAF8', padding: '0.75rem', borderRadius: '10px', border: '1px solid #F1F5F9' }}>
                      <div>
                        <div style={{ fontSize: '0.72rem', color: '#718096', fontWeight: '700' }}>Total Revenue</div>
                        <div style={{ fontSize: '1.15rem', fontWeight: '900', color: '#2E7D32' }}>₹{parseFloat(reportsData?.sales_report?.total_sales_amount || 0).toLocaleString('en-IN')}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.72rem', color: '#718096', fontWeight: '700' }}>Total Sold (KG)</div>
                        <div style={{ fontSize: '1.15rem', fontWeight: '900', color: '#1B4D2E' }}>{reportsData?.sales_report?.total_quantity_sold_kg || 0} KG</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.72rem', color: '#718096', fontWeight: '700' }}>Avg Price / KG</div>
                        <div style={{ fontSize: '0.9rem', fontWeight: '800', color: '#2D3748' }}>₹{reportsData?.sales_report?.avg_selling_price_per_kg || 0}/KG</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.72rem', color: '#718096', fontWeight: '700' }}>Sales Count</div>
                        <div style={{ fontSize: '0.9rem', fontWeight: '800', color: '#2D3748' }}>{reportsData?.sales_report?.total_sales || 0} Sales</div>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveReportModal('sales')}
                    style={{ backgroundColor: '#1B4D2E', color: '#FFFFFF', border: 'none', width: '100%', padding: '0.6rem', borderRadius: '10px', fontWeight: '800', fontSize: '0.82rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}
                  >
                    <Eye size={15} /> View Details
                  </button>
                </div>

                {/* 4. Expense Report Card */}
                <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E5EBE5', padding: '1.25rem', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#FEE2E2', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Receipt size={20} />
                        </div>
                        <h3 style={{ fontSize: '1.05rem', fontWeight: '900', color: '#1B4D2E', margin: 0 }}>Expense Report</h3>
                      </div>
                      <span style={{ fontSize: '0.72rem', backgroundColor: '#F1F5F9', color: '#64748B', padding: '0.15rem 0.5rem', borderRadius: '999px', fontWeight: '700' }}>
                        {reportsData?.expense_report?.records?.length || 0} Expenses
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem', backgroundColor: '#F8FAF8', padding: '0.75rem', borderRadius: '10px', border: '1px solid #F1F5F9' }}>
                      <div>
                        <div style={{ fontSize: '0.72rem', color: '#718096', fontWeight: '700' }}>Total Expenses</div>
                        <div style={{ fontSize: '1.15rem', fontWeight: '900', color: '#DC2626' }}>₹{parseFloat(reportsData?.expense_report?.total_expenses || 0).toLocaleString('en-IN')}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.72rem', color: '#718096', fontWeight: '700' }}>Fertilizer Cost</div>
                        <div style={{ fontSize: '0.9rem', fontWeight: '800', color: '#2D3748' }}>₹{parseFloat(reportsData?.expense_report?.fertilizer_cost || 0).toLocaleString('en-IN')}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.72rem', color: '#718096', fontWeight: '700' }}>Pesticide Cost</div>
                        <div style={{ fontSize: '0.9rem', fontWeight: '800', color: '#2D3748' }}>₹{parseFloat(reportsData?.expense_report?.pesticide_cost || 0).toLocaleString('en-IN')}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.72rem', color: '#718096', fontWeight: '700' }}>Irrigation Cost</div>
                        <div style={{ fontSize: '0.9rem', fontWeight: '800', color: '#2D3748' }}>₹{parseFloat(reportsData?.expense_report?.irrigation_cost || 0).toLocaleString('en-IN')}</div>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveReportModal('expense')}
                    style={{ backgroundColor: '#1B4D2E', color: '#FFFFFF', border: 'none', width: '100%', padding: '0.6rem', borderRadius: '10px', fontWeight: '800', fontSize: '0.82rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}
                  >
                    <Eye size={15} /> View Details
                  </button>
                </div>

                {/* 5. Fertilizer & Pesticide Report Card */}
                <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E5EBE5', padding: '1.25rem', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#F3E8FF', color: '#9333EA', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <FlaskConical size={20} />
                        </div>
                        <h3 style={{ fontSize: '1.05rem', fontWeight: '900', color: '#1B4D2E', margin: 0 }}>Fertilizer & Pesticide</h3>
                      </div>
                      <span style={{ fontSize: '0.72rem', backgroundColor: '#F1F5F9', color: '#64748B', padding: '0.15rem 0.5rem', borderRadius: '999px', fontWeight: '700' }}>
                        {reportsData?.agrochemical_report?.total_applications || 0} Applications
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem', backgroundColor: '#F8FAF8', padding: '0.75rem', borderRadius: '10px', border: '1px solid #F1F5F9' }}>
                      <div>
                        <div style={{ fontSize: '0.72rem', color: '#718096', fontWeight: '700' }}>Fertilizer Qty</div>
                        <div style={{ fontSize: '1.15rem', fontWeight: '900', color: '#9333EA' }}>{reportsData?.agrochemical_report?.total_fertilizer_qty || 0} KG</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.72rem', color: '#718096', fontWeight: '700' }}>Fertilizer Cost</div>
                        <div style={{ fontSize: '1.15rem', fontWeight: '900', color: '#2D3748' }}>₹{parseFloat(reportsData?.agrochemical_report?.total_fertilizer_cost || 0).toLocaleString('en-IN')}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.72rem', color: '#718096', fontWeight: '700' }}>Pesticide Qty</div>
                        <div style={{ fontSize: '0.9rem', fontWeight: '800', color: '#2D3748' }}>{reportsData?.agrochemical_report?.total_pesticide_qty || 0}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.72rem', color: '#718096', fontWeight: '700' }}>Pesticide Cost</div>
                        <div style={{ fontSize: '0.9rem', fontWeight: '800', color: '#2D3748' }}>₹{parseFloat(reportsData?.agrochemical_report?.total_pesticide_cost || 0).toLocaleString('en-IN')}</div>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveReportModal('agrochemical')}
                    style={{ backgroundColor: '#1B4D2E', color: '#FFFFFF', border: 'none', width: '100%', padding: '0.6rem', borderRadius: '10px', fontWeight: '800', fontSize: '0.82rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}
                  >
                    <Eye size={15} /> View Details
                  </button>
                </div>

                {/* 6. Irrigation Report Card */}
                <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E5EBE5', padding: '1.25rem', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#E0F2FE', color: '#0284C7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Droplets size={20} />
                        </div>
                        <h3 style={{ fontSize: '1.05rem', fontWeight: '900', color: '#1B4D2E', margin: 0 }}>Irrigation Report</h3>
                      </div>
                      <span style={{ fontSize: '0.72rem', backgroundColor: '#F1F5F9', color: '#64748B', padding: '0.15rem 0.5rem', borderRadius: '999px', fontWeight: '700' }}>
                        {reportsData?.irrigation_report?.records_count || 0} Logs
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem', backgroundColor: '#F8FAF8', padding: '0.75rem', borderRadius: '10px', border: '1px solid #F1F5F9' }}>
                      <div>
                        <div style={{ fontSize: '0.72rem', color: '#718096', fontWeight: '700' }}>Water Volume</div>
                        <div style={{ fontSize: '1.15rem', fontWeight: '900', color: '#0284C7' }}>{reportsData?.irrigation_report?.total_water_liters || 0} L</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.72rem', color: '#718096', fontWeight: '700' }}>Duration</div>
                        <div style={{ fontSize: '1.15rem', fontWeight: '900', color: '#2D3748' }}>{reportsData?.irrigation_report?.total_duration_hours || 0} Hrs</div>
                      </div>
                      <div style={{ gridColumn: '1 / -1' }}>
                        <div style={{ fontSize: '0.72rem', color: '#718096', fontWeight: '700' }}>Last Irrigation Date</div>
                        <div style={{ fontSize: '0.9rem', fontWeight: '800', color: '#1B4D2E' }}>{reportsData?.irrigation_report?.last_irrigation_date || 'No logs yet'}</div>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveReportModal('irrigation')}
                    style={{ backgroundColor: '#1B4D2E', color: '#FFFFFF', border: 'none', width: '100%', padding: '0.6rem', borderRadius: '10px', fontWeight: '800', fontSize: '0.82rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}
                  >
                    <Eye size={15} /> View Details
                  </button>
                </div>

                {/* 7. Overall Summary Card */}
                <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E5EBE5', padding: '1.25rem', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#E8F5E9', color: '#2E7D32', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <BarChart3 size={20} />
                        </div>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: '900', color: '#1B4D2E', margin: 0 }}>Overall Farm Summary</h3>
                      </div>
                      <span style={{ fontSize: '0.75rem', backgroundColor: '#E8F5E9', color: '#2E7D32', padding: '0.2rem 0.65rem', borderRadius: '999px', fontWeight: '900' }}>
                        ESTATE OVERVIEW
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1rem', backgroundColor: '#F8FAF8', padding: '1rem', borderRadius: '12px', border: '1px solid #E5EBE5' }}>
                      <div>
                        <div style={{ fontSize: '0.72rem', color: '#718096', fontWeight: '700' }}>TOTAL PLANTATIONS</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: '900', color: '#1B4D2E' }}>{reportsData?.overall_summary?.total_plantations || 0} Estates</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.72rem', color: '#718096', fontWeight: '700' }}>TOTAL HARVEST</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: '900', color: '#2E7D32' }}>{reportsData?.overall_summary?.total_fresh_harvest_kg || 0} Fresh / {reportsData?.overall_summary?.total_dry_harvest_kg || 0} Dry KG</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.72rem', color: '#718096', fontWeight: '700' }}>TOTAL INVENTORY</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: '900', color: '#0284C7' }}>{reportsData?.overall_summary?.total_inventory_kg || 0} KG</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.72rem', color: '#718096', fontWeight: '700' }}>TOTAL SALES</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: '900', color: '#2E7D32' }}>₹{parseFloat(reportsData?.overall_summary?.total_sales_amount || 0).toLocaleString('en-IN')}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.72rem', color: '#718096', fontWeight: '700' }}>TOTAL EXPENSES</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: '900', color: '#DC2626' }}>₹{parseFloat(reportsData?.overall_summary?.total_expenses_amount || 0).toLocaleString('en-IN')}</div>
                      </div>
                      <div style={{ backgroundColor: '#E8F5E9', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #C8E6C9' }}>
                        <div style={{ fontSize: '0.72rem', color: '#1B4D2E', fontWeight: '900', textTransform: 'uppercase' }}>GROSS DIFFERENCE (Sales minus Expenses)</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: '900', color: (reportsData?.overall_summary?.gross_difference || 0) >= 0 ? '#2E7D32' : '#C62828' }}>
                          ₹{parseFloat(reportsData?.overall_summary?.gross_difference || 0).toLocaleString('en-IN')}
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveReportModal('overall')}
                    style={{ backgroundColor: '#1B4D2E', color: '#FFFFFF', border: 'none', width: '100%', padding: '0.65rem', borderRadius: '10px', fontWeight: '800', fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}
                  >
                    <Eye size={16} /> View Full Farm Breakdown
                  </button>
                </div>

              </div>
            </div>
          )}


          {activeTab === 'profile' && (
            <div style={{ backgroundColor: '#FFFFFF', borderRadius: '20px', padding: '2rem', border: '1px solid #E5EBE5', maxWidth: '600px' }}>
              <h2 style={{ fontSize: '1.3rem', fontWeight: '900', color: '#1B4D2E', marginBottom: '1rem' }}>Farmer Account Profile</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem' }}>
                <div><strong>Full Name:</strong> {user?.full_name || 'Ramesh K. Pillai'}</div>
                <div><strong>Email Address:</strong> {user?.email}</div>
                <div><strong>Phone Number:</strong> {user?.phone}</div>
                <div><strong>Role:</strong> {user?.role}</div>
                <div><strong>Status:</strong> <span style={{ color: '#2E7D32', fontWeight: '800' }}>{user?.status}</span></div>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* ========================================================================= */}
      {/* MODAL 1: STEP 1 — START NEW HARVEST CYCLE MODAL */}
      {/* ========================================================================= */}
      {showStartCycleModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.45)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF', borderRadius: '24px', width: '100%', maxWidth: '500px',
            padding: '2rem', boxShadow: '0 20px 40px rgba(0,0,0,0.15)', border: '1px solid #E5EBE5'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <h3 style={{ fontSize: '1.3rem', fontWeight: '900', color: '#1B4D2E', margin: 0 }}>
                  Start New Harvest Cycle
                </h3>
                <p style={{ fontSize: '0.8rem', color: '#718096', margin: '0.2rem 0 0' }}>
                  Define cycle dates, plantation, and cardamom variety
                </p>
              </div>
              <button onClick={() => setShowStartCycleModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            <form onSubmit={handleStartCycleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: '800', color: '#2D3748', display: 'block', marginBottom: '0.35rem' }}>
                  Harvest Name / Cycle Name *
                </label>
                <input
                  type="text" required placeholder="e.g. September Harvest 1"
                  value={cycleForm.name}
                  onChange={e => setCycleForm({ ...cycleForm, name: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '0.88rem' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: '800', color: '#2D3748', display: 'block', marginBottom: '0.35rem' }}>
                  Start Date *
                </label>
                <input
                  type="date" required
                  value={cycleForm.start_date}
                  onChange={e => setCycleForm({ ...cycleForm, start_date: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '0.88rem' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: '800', color: '#2D3748', display: 'block', marginBottom: '0.35rem' }}>
                  Expected / Planned End Date *
                </label>
                <input
                  type="date" required
                  value={cycleForm.expected_end_date}
                  onChange={e => setCycleForm({ ...cycleForm, expected_end_date: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '0.88rem' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: '800', color: '#2D3748', display: 'block', marginBottom: '0.35rem' }}>
                  Plantation *
                </label>
                <select
                  required
                  value={cycleForm.plantation_id}
                  onChange={e => setCycleForm({ ...cycleForm, plantation_id: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '0.88rem' }}
                >
                  <option value="">Select My Plantation...</option>
                  {plantations.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.location})</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: '800', color: '#2D3748', display: 'block', marginBottom: '0.35rem' }}>
                  Cardamom Variety *
                </label>
                <select
                  required
                  value={cycleForm.variety}
                  onChange={e => setCycleForm({ ...cycleForm, variety: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '0.88rem' }}
                >
                  <option value="">Select Variety...</option>
                  {varieties.map(v => (
                    <option key={v.id} value={v.name}>{v.name}</option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                style={{
                  backgroundColor: '#43A047', color: '#FFFFFF', border: 'none',
                  padding: '0.85rem', borderRadius: '12px', fontWeight: '900',
                  fontSize: '0.95rem', cursor: 'pointer', marginTop: '0.5rem',
                  boxShadow: '0 4px 12px rgba(67, 160, 71, 0.3)'
                }}
              >
                [ Start Harvest ]
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: COMPLETE HARVEST MODAL WITH FULL DRY KG INPUT */}
      {/* ========================================================================= */}
      {showCompleteConfirmModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.45)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
        }}>
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '24px', width: '100%', maxWidth: '440px', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#E8F5E9', color: '#2E7D32', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CheckCircle size={20} />
                </div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: '900', color: '#1B4D2E', margin: 0 }}>
                  Complete Harvest Cycle
                </h3>
              </div>
              <button onClick={() => setShowCompleteConfirmModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            <form onSubmit={handleCompleteHarvest}>
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: '800', color: '#2D3748', display: 'block', marginBottom: '0.4rem' }}>
                  Full Dry KG *
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="number" step="0.01" min="0.01" required
                    value={fullDryKg}
                    onChange={e => setFullDryKg(e.target.value)}
                    placeholder="e.g. 24.5"
                    style={{ flex: 1, padding: '0.75rem', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '0.95rem', fontWeight: '700' }}
                  />
                  <span style={{ fontWeight: '800', color: '#4A5568' }}>kg</span>
                </div>
                <p style={{ fontSize: '0.78rem', color: '#718096', margin: '0.4rem 0 0', lineHeight: '1.4' }}>
                  Enter the final fully dried/cured cardamom weight after completing the harvest.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '0.85rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowCompleteConfirmModal(false)}
                  style={{ backgroundColor: '#F4F7F4', color: '#4A5568', border: 'none', padding: '0.75rem 1.2rem', borderRadius: '10px', fontWeight: '800', cursor: 'pointer' }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  style={{ backgroundColor: '#2E7D32', color: '#FFFFFF', border: 'none', padding: '0.75rem 1.4rem', borderRadius: '10px', fontWeight: '900', cursor: 'pointer', boxShadow: '0 4px 12px rgba(46, 125, 50, 0.3)' }}
                >
                  [ Save & Complete Harvest ]
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD / UPDATE DRY KG FOR SPECIFIC COMPLETED HARVEST CYCLE */}
      {/* ========================================================================= */}
      {showAddDryKgModal && selectedCycleForDryKg && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.45)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
        }}>
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '24px', width: '100%', maxWidth: '440px', padding: '2rem', boxShadow: '0 20px 40px rgba(0,0,0,0.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#E8F5E9', color: '#2E7D32', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CheckCircle size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: '900', color: '#1B4D2E', margin: 0 }}>
                    {(selectedCycleForDryKg.summary?.full_dry_quantity_kg != null || selectedCycleForDryKg.full_dry_quantity != null) ? 'Update Dry KG' : 'Add Dry KG'}
                  </h3>
                </div>
              </div>
              <button onClick={() => setShowAddDryKgModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            <div style={{ backgroundColor: '#F8FAF8', borderRadius: '10px', padding: '0.75rem', marginBottom: '1.25rem', border: '1px solid #E5EBE5', fontSize: '0.85rem' }}>
              <span style={{ color: '#718096', fontWeight: '700' }}>Harvest Cycle:</span>{' '}
              <strong style={{ color: '#1B4D2E' }}>{selectedCycleForDryKg.name}</strong>
            </div>

            <form onSubmit={handleSaveDryKgSubmit}>
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: '800', color: '#2D3748', display: 'block', marginBottom: '0.4rem' }}>
                  Dry KG *
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="number" step="0.01" min="0" required
                    value={dryKgInput}
                    onChange={e => {
                      const val = e.target.value;
                      if (val === '' || parseFloat(val) >= 0) {
                        setDryKgInput(val);
                      }
                    }}
                    onKeyDown={e => {
                      if (e.key === '-' || e.key === 'e' || e.key === 'E' || e.key === '+') {
                        e.preventDefault();
                      }
                    }}
                    placeholder="Enter dry quantity"
                    style={{ flex: 1, padding: '0.75rem', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '0.95rem', fontWeight: '700' }}
                  />
                  <span style={{ fontWeight: '800', color: '#4A5568' }}>KG</span>
                </div>
                <p style={{ fontSize: '0.78rem', color: '#718096', margin: '0.4rem 0 0', lineHeight: '1.4' }}>
                  Enter the final fully dried/cured weight for this specific harvest cycle.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '0.85rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowAddDryKgModal(false)}
                  style={{ backgroundColor: '#F4F7F4', color: '#4A5568', border: 'none', padding: '0.75rem 1.2rem', borderRadius: '10px', fontWeight: '800', cursor: 'pointer' }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  style={{ backgroundColor: '#2E7D32', color: '#FFFFFF', border: 'none', padding: '0.75rem 1.4rem', borderRadius: '10px', fontWeight: '900', cursor: 'pointer', boxShadow: '0 4px 12px rgba(46, 125, 50, 0.3)' }}
                >
                  Save Dry KG
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: FINAL HARVEST SUMMARY MODAL */}
      {/* ========================================================================= */}
      {showSummaryModal && selectedCycleSummary && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.45)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF', borderRadius: '24px', width: '100%', maxWidth: '580px',
            maxHeight: '90vh', overflowY: 'auto', padding: '2rem', boxShadow: '0 20px 40px rgba(0,0,0,0.15)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <span style={{ backgroundColor: '#E8F5E9', color: '#2E7D32', fontSize: '0.75rem', fontWeight: '900', padding: '0.2rem 0.6rem', borderRadius: '999px', textTransform: 'uppercase' }}>
                  HARVEST COMPLETED ✓
                </span>
                <h3 style={{ fontSize: '1.4rem', fontWeight: '900', color: '#1B4D2E', margin: '0.3rem 0 0' }}>
                  {selectedCycleSummary.cycle.name}
                </h3>
                <div style={{ fontSize: '0.8rem', color: '#718096', fontWeight: '600' }}>
                  {selectedCycleSummary.cycle.start_date} – {selectedCycleSummary.cycle.expected_end_date} | Estate: {selectedCycleSummary.cycle.plantation_name} ({selectedCycleSummary.cycle.variety})
                </div>
              </div>
              <button onClick={() => setShowSummaryModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            <div style={{ backgroundColor: '#F8FAF8', borderRadius: '16px', padding: '1.25rem', border: '1px solid #E5EBE5', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: '900', color: '#1B4D2E', marginBottom: '1rem', borderBottom: '1px solid #E5EBE5', paddingBottom: '0.5rem' }}>
                FINAL HARVEST SUMMARY
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.85rem' }}>
                <div>
                  <div style={{ fontSize: '0.72rem', color: '#718096', fontWeight: '800' }}>Total Harvest Days</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: '900', color: '#1A202C' }}>{selectedCycleSummary.summary.total_harvest_days} Days</div>
                </div>

                <div>
                  <div style={{ fontSize: '0.72rem', color: '#718096', fontWeight: '800' }}>Total Fresh Harvest</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: '900', color: '#2E7D32' }}>{selectedCycleSummary.summary.total_fresh_harvest_kg} kg</div>
                </div>

                <div>
                  <div style={{ fontSize: '0.72rem', color: '#718096', fontWeight: '800' }}>Total Dried Harvest</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: '900', color: '#D97706' }}>{selectedCycleSummary.summary.total_dried_harvest_kg} kg</div>
                </div>

                <div>
                  <div style={{ fontSize: '0.72rem', color: '#1B4D2E', fontWeight: '900', textTransform: 'uppercase' }}>FULL DRY KG</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: '900', color: '#10B981' }}>
                    {selectedCycleSummary.summary.full_dry_quantity_kg != null 
                      ? `${selectedCycleSummary.summary.full_dry_quantity_kg} kg` 
                      : (selectedCycleSummary.cycle.full_dry_quantity != null ? `${selectedCycleSummary.cycle.full_dry_quantity} kg` : '-')}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.72rem', color: '#718096', fontWeight: '800' }}>Avg Fresh / Day</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: '900', color: '#0284C7' }}>{selectedCycleSummary.summary.avg_fresh_per_day_kg} kg</div>
                </div>

                <div>
                  <div style={{ fontSize: '0.72rem', color: '#718096', fontWeight: '800' }}>Highest Harvest</div>
                  <div style={{ fontSize: '1rem', fontWeight: '900', color: '#2E7D32' }}>
                    {selectedCycleSummary.summary.highest_harvest_day ? `${selectedCycleSummary.summary.highest_harvest_day.fresh_kg} kg (${selectedCycleSummary.summary.highest_harvest_day.date})` : '-'}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.72rem', color: '#718096', fontWeight: '800' }}>Lowest Harvest</div>
                  <div style={{ fontSize: '1rem', fontWeight: '900', color: '#718096' }}>
                    {selectedCycleSummary.summary.lowest_harvest_day ? `${selectedCycleSummary.summary.lowest_harvest_day.fresh_kg} kg (${selectedCycleSummary.summary.lowest_harvest_day.date})` : '-'}
                  </div>
                </div>
              </div>
            </div>

            {/* Daily Harvest Records */}
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: '900', color: '#1B4D2E', marginBottom: '0.75rem' }}>
                Daily Harvest Records
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#F8FAF8', borderBottom: '1px solid #E5EBE5', color: '#4A5568' }}>
                      <th style={{ padding: '0.6rem' }}>Date</th>
                      <th style={{ padding: '0.6rem' }}>Fresh Harvest</th>
                      <th style={{ padding: '0.6rem' }}>Dried Harvest</th>
                      <th style={{ padding: '0.6rem' }}>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedCycleSummary.summary.daily_records?.map(r => (
                      <tr key={r.id} style={{ borderBottom: '1px solid #F4F7F4' }}>
                        <td style={{ padding: '0.6rem', fontWeight: '800', color: '#1B4D2E' }}>{r.harvest_date}</td>
                        <td style={{ padding: '0.6rem', fontWeight: '900', color: '#2E7D32' }}>{r.fresh_quantity_kg} kg</td>
                        <td style={{ padding: '0.6rem', color: '#D97706', fontWeight: '700' }}>{r.dried_quantity_kg ? `${r.dried_quantity_kg} kg` : '-'}</td>
                        <td style={{ padding: '0.6rem', color: '#718096' }}>{r.notes || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <button
              onClick={() => setShowSummaryModal(false)}
              style={{
                width: '100%', marginTop: '1.5rem', backgroundColor: '#2E7D32', color: '#FFF',
                border: 'none', padding: '0.75rem', borderRadius: '10px', fontWeight: '900', cursor: 'pointer'
              }}
            >
              Close Summary
            </button>

          </div>
        </div>
      )}

      {/* EDIT / DELETE DAILY HARVEST MODALS */}
      {selectedHarvestForEdit && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '24px', width: '100%', maxWidth: '440px', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '900', color: '#1B4D2E' }}>Edit Daily Harvest</h3>
              <button onClick={() => setSelectedHarvestForEdit(null)} style={{ background: 'none', border: 'none' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleUpdateDailyRecord} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: '800' }}>Harvest Date</label>
                <input type="date" required value={selectedHarvestForEdit.harvest_date} onChange={e => setSelectedHarvestForEdit({ ...selectedHarvestForEdit, harvest_date: e.target.value })} style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #CBD5E1' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: '800' }}>Fresh Harvest (kg)</label>
                <input type="number" step="0.01" min="0.01" required value={selectedHarvestForEdit.fresh_quantity_kg} onChange={e => setSelectedHarvestForEdit({ ...selectedHarvestForEdit, fresh_quantity_kg: e.target.value })} style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #CBD5E1' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: '800' }}>Dried Harvest (kg)</label>
                <input type="number" step="0.01" min="0" value={selectedHarvestForEdit.dried_quantity_kg} onChange={e => setSelectedHarvestForEdit({ ...selectedHarvestForEdit, dried_quantity_kg: e.target.value })} style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #CBD5E1' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: '800' }}>Notes</label>
                <input type="text" value={selectedHarvestForEdit.notes || ''} onChange={e => setSelectedHarvestForEdit({ ...selectedHarvestForEdit, notes: e.target.value })} style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #CBD5E1' }} />
              </div>
              <button type="submit" style={{ backgroundColor: '#43A047', color: '#FFF', border: 'none', padding: '0.75rem', borderRadius: '10px', fontWeight: '900' }}>Save Changes</button>
            </form>
          </div>
        </div>
      )}

      {selectedHarvestForDelete && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '24px', width: '100%', maxWidth: '420px', padding: '2rem', textAlign: 'center' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '900', color: '#1B4D2E', margin: '0 0 0.5rem' }}>Confirm Deletion</h3>
            <p style={{ fontSize: '0.85rem', color: '#718096', marginBottom: '1.5rem' }}>
              Are you sure you want to delete daily record for {selectedHarvestForDelete.harvest_date}?
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button onClick={() => setSelectedHarvestForDelete(null)} style={{ backgroundColor: '#F4F7F4', border: 'none', padding: '0.65rem 1.25rem', borderRadius: '8px', fontWeight: '800' }}>Cancel</button>
              <button onClick={handleDeleteDailyRecord} style={{ backgroundColor: '#E53E3E', color: '#FFF', border: 'none', padding: '0.65rem 1.25rem', borderRadius: '8px', fontWeight: '800' }}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* OTHER DOMAIN MODALS */}
      {showAddPlantationModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '24px', width: '100%', maxWidth: '460px', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '900', color: '#1B4D2E' }}>Add Plantation</h3>
              <button onClick={() => setShowAddPlantationModal(false)} style={{ background: 'none', border: 'none' }}><X size={20} /></button>
            </div>
            <form onSubmit={handlePlantationSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: '800' }}>Plantation Name *</label>
                <input type="text" required placeholder="e.g. Green Valley Plantation" value={plantationForm.name} onChange={e => setPlantationForm({ ...plantationForm, name: e.target.value })} style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #CBD5E1' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: '800' }}>Location *</label>
                <input type="text" required placeholder="e.g. Kattappana, Idukki" value={plantationForm.location} onChange={e => setPlantationForm({ ...plantationForm, location: e.target.value })} style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #CBD5E1' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: '800' }}>Area (Acres) *</label>
                <input type="number" step="0.1" min="0.1" required placeholder="e.g. 5.5" value={plantationForm.area_acres} onChange={e => setPlantationForm({ ...plantationForm, area_acres: e.target.value })} style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #CBD5E1' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: '800' }}>Number of Plants *</label>
                <input
                  type="number"
                  step="1"
                  min="1"
                  required
                  placeholder="e.g. 500"
                  value={plantationForm.number_of_plants}
                  onKeyDown={e => {
                    if (e.key === '.' || e.key === 'e' || e.key === 'E' || e.key === '-') {
                      e.preventDefault();
                    }
                  }}
                  onChange={e => {
                    const val = e.target.value;
                    if (val === '' || (/^\d+$/.test(val) && parseInt(val, 10) >= 1)) {
                      setPlantationForm({ ...plantationForm, number_of_plants: val });
                    }
                  }}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #CBD5E1' }}
                />
              </div>
              <button type="submit" style={{ backgroundColor: '#43A047', color: '#FFF', border: 'none', padding: '0.75rem', borderRadius: '10px', fontWeight: '900' }}>Save Plantation</button>
            </form>
          </div>
        </div>
      )}

      {showAddVarietyModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '24px', width: '100%', maxWidth: '420px', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '900', color: '#1B4D2E' }}>Add Variety</h3>
              <button onClick={() => setShowAddVarietyModal(false)} style={{ background: 'none', border: 'none' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleVarietySubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: '800' }}>Variety Name *</label>
                <input type="text" required placeholder="e.g. Njallani Gold" value={varietyForm.name} onChange={e => setVarietyForm({ ...varietyForm, name: e.target.value })} style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #CBD5E1' }} />
              </div>
              <button type="submit" style={{ backgroundColor: '#43A047', color: '#FFF', border: 'none', padding: '0.75rem', borderRadius: '10px', fontWeight: '900' }}>Add Variety</button>
            </form>
          </div>
        </div>
      )}

      {showAddAgrochemicalModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '24px', width: '100%', maxWidth: '440px', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '900', color: '#1B4D2E' }}>Record Agrochemical Usage</h3>
              <button onClick={() => setShowAddAgrochemicalModal(false)} style={{ background: 'none', border: 'none' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleAgrochemicalSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: '800' }}>Plantation *</label>
                <select required value={agrochemicalForm.plantation_id} onChange={e => setAgrochemicalForm({ ...agrochemicalForm, plantation_id: e.target.value })} style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #CBD5E1' }}>
                  <option value="">Select Plantation...</option>
                  {plantations.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: '800' }}>Product Name *</label>
                <input type="text" required placeholder="e.g. NPK 19-19-19" value={agrochemicalForm.name} onChange={e => setAgrochemicalForm({ ...agrochemicalForm, name: e.target.value })} style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #CBD5E1' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: '800' }}>Quantity (KG) *</label>
                <input type="number" step="0.1" required placeholder="e.g. 25" value={agrochemicalForm.quantity} onChange={e => setAgrochemicalForm({ ...agrochemicalForm, quantity: e.target.value })} style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #CBD5E1' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: '800' }}>Date Applied *</label>
                <input
                  type="date"
                  required
                  value={agrochemicalForm.application_date}
                  onChange={e => setAgrochemicalForm({ ...agrochemicalForm, application_date: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #CBD5E1' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: '800' }}>Next Date to Apply</label>
                <input
                  type="date"
                  value={agrochemicalForm.next_application_date || ''}
                  onChange={e => setAgrochemicalForm({ ...agrochemicalForm, next_application_date: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #CBD5E1' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: '800' }}>Cost of Fertilizer (₹) *</label>
                <input
                  type="number"
                  step="any"
                  min="0.01"
                  required
                  placeholder="e.g. 1500"
                  value={agrochemicalForm.cost}
                  onKeyDown={e => {
                    if (e.key === '-' || e.key === 'e' || e.key === 'E') {
                      e.preventDefault();
                    }
                  }}
                  onChange={e => {
                    const val = e.target.value;
                    if (val === '' || parseFloat(val) >= 0) {
                      setAgrochemicalForm({ ...agrochemicalForm, cost: val });
                    }
                  }}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #CBD5E1' }}
                />
              </div>
              <button type="submit" style={{ backgroundColor: '#43A047', color: '#FFF', border: 'none', padding: '0.75rem', borderRadius: '10px', fontWeight: '900' }}>Save Record</button>
            </form>
          </div>
        </div>
      )}

      {showAddIrrigationModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '24px', width: '100%', maxWidth: '440px', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '900', color: '#1B4D2E' }}>Add Irrigation Log</h3>
              <button onClick={() => setShowAddIrrigationModal(false)} style={{ background: 'none', border: 'none' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleIrrigationSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: '800' }}>Plantation *</label>
                <select required value={irrigationForm.plantation_id} onChange={e => setIrrigationForm({ ...irrigationForm, plantation_id: e.target.value })} style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #CBD5E1' }}>
                  <option value="">Select Plantation...</option>
                  {plantations.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: '800' }}>Duration (Hours)</label>
                <input type="number" step="0.5" placeholder="e.g. 2.5" value={irrigationForm.duration_hours} onChange={e => setIrrigationForm({ ...irrigationForm, duration_hours: e.target.value })} style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #CBD5E1' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: '800' }}>Water Volume (Liters)</label>
                <input type="number" step="100" placeholder="e.g. 3000" value={irrigationForm.water_volume_liters} onChange={e => setIrrigationForm({ ...irrigationForm, water_volume_liters: e.target.value })} style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #CBD5E1' }} />
              </div>
              <button type="submit" style={{ backgroundColor: '#0284C7', color: '#FFF', border: 'none', padding: '0.75rem', borderRadius: '10px', fontWeight: '900' }}>Save Log</button>
            </form>
          </div>
        </div>
      )}

      {showAddInventoryModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '24px', width: '100%', maxWidth: '420px', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '900', color: '#1B4D2E' }}>Add Stock Item</h3>
              <button onClick={() => setShowAddInventoryModal(false)} style={{ background: 'none', border: 'none' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleInventorySubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: '800' }}>Variety *</label>
                <select
                  required
                  value={inventoryForm.variety}
                  onChange={e => setInventoryForm({ ...inventoryForm, variety: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #CBD5E1' }}
                >
                  <option value="">Select Variety...</option>
                  {(varieties.length > 0 ? varieties : [
                    { id: 'v1', name: 'Njallani Gold' },
                    { id: 'v2', name: 'Green Gold' },
                    { id: 'v3', name: 'Vanderperiyar' },
                    { id: 'v4', name: 'Palakudi' },
                    { id: 'v5', name: 'Panikulangara' },
                    { id: 'v6', name: 'Appangala' }
                  ]).map(v => (
                    <option key={v.id || v.name} value={v.name}>{v.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: '800' }}>Grading *</label>
                <select
                  required
                  value={inventoryForm.grade}
                  onChange={e => setInventoryForm({ ...inventoryForm, grade: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #CBD5E1' }}
                >
                  <option value="">Select Grade...</option>
                  <option value="8mm Super Bold">8mm Super Bold</option>
                  <option value="8mm Bold">8mm Bold</option>
                  <option value="7.5mm Bold">7.5mm Bold</option>
                  <option value="7mm Bold">7mm Bold</option>
                  <option value="Bulk (6mm)">Bulk (6mm)</option>
                  <option value="Ungraded">Ungraded</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: '800' }}>Quantity (KG) *</label>
                <input type="number" step="0.1" required placeholder="e.g. 45" value={inventoryForm.quantity_kg} onChange={e => setInventoryForm({ ...inventoryForm, quantity_kg: e.target.value })} style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #CBD5E1' }} />
              </div>
              <button type="submit" style={{ backgroundColor: '#43A047', color: '#FFF', border: 'none', padding: '0.75rem', borderRadius: '10px', fontWeight: '900' }}>Update Stock</button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: FARMER PURCHASE REQUEST VIEW DETAILS MODAL */}
      {/* ========================================================================= */}
      {showFarmerPRDetailsModal && selectedFarmerPR && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 120, padding: '1rem' }}>
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '20px', width: '100%', maxWidth: '640px', maxHeight: '90vh', overflowY: 'auto', padding: '1.75rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #E5EBE5', paddingBottom: '0.75rem' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '900', color: '#1B4D2E', margin: 0 }}>
                  Purchase Request Details (#PR-{selectedFarmerPR.id})
                </h3>
                <span style={{ fontSize: '0.8rem', color: '#718096' }}>Full transaction breakdown and status history</span>
              </div>
              <button onClick={() => setShowFarmerPRDetailsModal(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#718096' }}>
                <X size={22} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

              {/* 1. REQUEST INFORMATION */}
              <div style={{ backgroundColor: '#F8FAF8', borderRadius: '12px', padding: '1rem', border: '1px solid #E5EBE5' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: '900', color: '#2E7D32', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                  📋 REQUEST INFORMATION
                </div>
                <div style={{ fontSize: '0.85rem', color: '#2D3748', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.5rem' }}>
                  <div><strong>Request ID:</strong> #PR-{selectedFarmerPR.id}</div>
                  <div><strong>Request Date:</strong> {selectedFarmerPR.request_date || (selectedFarmerPR.created_at ? selectedFarmerPR.created_at.split('T')[0] : '30-09-2026')}</div>
                  <div>
                    <strong>Current Status:</strong>{' '}
                    <span style={{
                      backgroundColor: selectedFarmerPR.status === 'COMPLETED' ? '#E8F5E9' : selectedFarmerPR.status === 'PAID' || selectedFarmerPR.status === 'READY_FOR_PICKUP' ? '#E3F2FD' : selectedFarmerPR.status === 'REJECTED' || selectedFarmerPR.status === 'CANCELLED' ? '#FFEBEE' : '#FEF3C7',
                      color: selectedFarmerPR.status === 'COMPLETED' ? '#2E7D32' : selectedFarmerPR.status === 'PAID' || selectedFarmerPR.status === 'READY_FOR_PICKUP' ? '#1565C0' : selectedFarmerPR.status === 'REJECTED' || selectedFarmerPR.status === 'CANCELLED' ? '#C62828' : '#D97706',
                      padding: '0.15rem 0.5rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: '800'
                    }}>
                      {selectedFarmerPR.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* 2. TRADER DETAILS */}
              <div style={{ backgroundColor: '#F8FAF8', borderRadius: '12px', padding: '1rem', border: '1px solid #E5EBE5' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: '900', color: '#2E7D32', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                  👤 TRADER DETAILS
                </div>
                <div style={{ fontSize: '0.85rem', color: '#2D3748', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.5rem' }}>
                  <div><strong>Trader Name:</strong> {selectedFarmerPR.trader_name}</div>
                  <div><strong>Email:</strong> {selectedFarmerPR.trader_email || '-'}</div>
                  <div><strong>Phone:</strong> {selectedFarmerPR.trader_phone || '-'}</div>
                  <div><strong>Location:</strong> {selectedFarmerPR.trader_location || 'Kattappana, Idukki'}</div>
                </div>
              </div>

              {/* 3. PURCHASE DETAILS */}
              <div style={{ backgroundColor: '#F8FAF8', borderRadius: '12px', padding: '1rem', border: '1px solid #E5EBE5' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: '900', color: '#1B4D2E', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                  🛒 PURCHASE DETAILS
                </div>
                <div style={{ fontSize: '0.85rem', color: '#2D3748', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.5rem' }}>
                  <div><strong>Plantation:</strong> {selectedFarmerPR.plantation_name || 'Highland Cardamom Estate'}</div>
                  <div><strong>Variety:</strong> {selectedFarmerPR.variety}</div>
                  <div><strong>Grade:</strong> {selectedFarmerPR.grade || '8mm Bold'}</div>
                  <div><strong>Requested Quantity:</strong> {selectedFarmerPR.requested_quantity_kg} KG</div>
                  <div><strong>Price per KG:</strong> ₹{parseFloat(selectedFarmerPR.price_per_kg).toLocaleString('en-IN')}</div>
                  <div><strong>Total Amount:</strong> <span style={{ color: '#1B4D2E', fontWeight: '900' }}>₹{parseFloat(selectedFarmerPR.total_amount).toLocaleString('en-IN')}</span></div>
                  {selectedFarmerPR.notes ? <div style={{ gridColumn: '1 / -1' }}><strong>Trader Note:</strong> {selectedFarmerPR.notes}</div> : null}
                </div>
              </div>

              {/* 4. PAYMENT DETAILS */}
              <div style={{ backgroundColor: '#F8FAF8', borderRadius: '12px', padding: '1rem', border: '1px solid #E5EBE5' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: '900', color: '#2E7D32', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                  💳 PAYMENT DETAILS
                </div>
                <div style={{ fontSize: '0.85rem', color: '#2D3748', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.5rem' }}>
                  <div><strong>Payment Method:</strong> {selectedFarmerPR.payment_method === 'DIRECT' ? 'Direct Payment' : 'Pay Online'}</div>
                  <div><strong>Payment Status:</strong> <span style={{ fontWeight: '800', color: selectedFarmerPR.payment_status === 'PAID' ? '#2E7D32' : '#D97706' }}>{selectedFarmerPR.payment_status || 'PENDING'}</span></div>
                  {selectedFarmerPR.payment_reference && <div><strong>Reference:</strong> {selectedFarmerPR.payment_reference}</div>}
                  {selectedFarmerPR.paid_at && <div><strong>Payment Date:</strong> {selectedFarmerPR.paid_at.split('T')[0]}</div>}
                </div>
              </div>

              {/* 5. WORKFLOW STATUS TRACKER */}
              <div>
                <StatusTracker status={selectedFarmerPR.status} />
              </div>

              {/* 6. PICKUP / DELIVERY DETAILS */}
              <div style={{ backgroundColor: '#F8FAF8', borderRadius: '12px', padding: '1rem', border: '1px solid #E5EBE5' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: '900', color: '#2E7D32', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                  🚚 PICKUP / DELIVERY DETAILS
                </div>
                <div style={{ fontSize: '0.85rem', color: '#2D3748', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.5rem' }}>
                  <div><strong>Pickup Status:</strong> {selectedFarmerPR.pickup_status || 'PENDING'}</div>
                  {selectedFarmerPR.ready_for_pickup_at && <div><strong>Ready Date:</strong> {selectedFarmerPR.ready_for_pickup_at.split('T')[0]}</div>}
                  <div><strong>Handover Info:</strong> {selectedFarmerPR.handover_confirmed_by_farmer ? 'Handover Confirmed by Farmer' : 'Pending Handover'}</div>
                </div>
              </div>

              {/* 7. TRANSACTION DETAILS */}
              <div style={{ backgroundColor: '#F8FAF8', borderRadius: '12px', padding: '1rem', border: '1px solid #E5EBE5' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: '900', color: '#2E7D32', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                  🧾 TRANSACTION DETAILS
                </div>
                <div style={{ fontSize: '0.85rem', color: '#2D3748', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.5rem' }}>
                  <div><strong>Sale Transaction:</strong> {selectedFarmerPR.status === 'COMPLETED' ? 'Created & Logged' : 'Pending'}</div>
                  <div><strong>Purchase Transaction:</strong> {selectedFarmerPR.status === 'COMPLETED' ? 'Completed' : 'Pending'}</div>
                  {selectedFarmerPR.completion_date && <div><strong>Completion Date:</strong> {selectedFarmerPR.completion_date}</div>}
                </div>
              </div>

              {/* 8. VALID ACTION BUTTONS */}
              <div style={{ borderTop: '1px solid #E5EBE5', paddingTop: '1rem' }}>
                {selectedFarmerPR.status === 'PENDING' && (
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button
                      onClick={() => {
                        handleFarmerRespondPurchaseRequest(selectedFarmerPR.id, 'ACCEPT');
                        setShowFarmerPRDetailsModal(false);
                      }}
                      style={{ flex: 1, backgroundColor: '#2E7D32', color: '#FFFFFF', border: 'none', padding: '0.65rem', borderRadius: '10px', fontWeight: '900', cursor: 'pointer', fontSize: '0.85rem' }}
                    >
                      [ ACCEPT ]
                    </button>
                    <button
                      onClick={() => {
                        handleFarmerRespondPurchaseRequest(selectedFarmerPR.id, 'REJECT');
                        setShowFarmerPRDetailsModal(false);
                      }}
                      style={{ flex: 1, backgroundColor: '#FFEBEE', color: '#C62828', border: 'none', padding: '0.65rem', borderRadius: '10px', fontWeight: '900', cursor: 'pointer', fontSize: '0.85rem' }}
                    >
                      [ REJECT ]
                    </button>
                  </div>
                )}

                {(selectedFarmerPR.status === 'ACCEPTED' || selectedFarmerPR.status === 'PAYMENT_PENDING') && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {selectedFarmerPR.payment_method === 'DIRECT' ? (
                      <button
                        onClick={() => {
                          handleFarmerRespondPurchaseRequest(selectedFarmerPR.id, 'CONFIRM_DIRECT_PAYMENT');
                          setShowFarmerPRDetailsModal(false);
                        }}
                        style={{ backgroundColor: '#2E7D32', color: '#FFFFFF', border: 'none', padding: '0.65rem', borderRadius: '10px', fontWeight: '900', cursor: 'pointer', fontSize: '0.85rem' }}
                      >
                        🤝 Confirm Direct Payment Received
                      </button>
                    ) : (
                      <div style={{ textAlign: 'center', fontSize: '0.85rem', color: '#D97706', fontWeight: '800', padding: '0.6rem', backgroundColor: '#FEF3C7', borderRadius: '8px' }}>
                        💳 Waiting for Trader Online Payment...
                      </div>
                    )}
                  </div>
                )}

                {(selectedFarmerPR.status === 'PAID' || selectedFarmerPR.status === 'READY_FOR_PICKUP') && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ textAlign: 'center', fontSize: '0.82rem', color: '#2E7D32', fontWeight: '800', backgroundColor: '#E8F5E9', padding: '0.4rem', borderRadius: '6px' }}>
                      ✓ Payment Received — Stock Ready for Pickup
                    </div>
                    <button
                      onClick={() => {
                        handleFarmerRespondPurchaseRequest(selectedFarmerPR.id, 'CONFIRM_HANDOVER');
                        setShowFarmerPRDetailsModal(false);
                      }}
                      style={{ backgroundColor: '#1565C0', color: '#FFFFFF', border: 'none', padding: '0.65rem', borderRadius: '10px', fontWeight: '900', cursor: 'pointer', fontSize: '0.85rem' }}
                    >
                      📦 Confirm Stock Handover
                    </button>
                  </div>
                )}

                {selectedFarmerPR.status === 'COMPLETED' && (
                  <div style={{ textAlign: 'center', fontSize: '0.85rem', color: '#2E7D32', fontWeight: '800', padding: '0.6rem', backgroundColor: '#E8F5E9', borderRadius: '8px' }}>
                    ✓ Transaction Completed & Sale Recorded
                  </div>
                )}

                {(selectedFarmerPR.status === 'REJECTED' || selectedFarmerPR.status === 'CANCELLED') && (
                  <div style={{ textAlign: 'center', fontSize: '0.85rem', color: '#C62828', fontWeight: '800', padding: '0.6rem', backgroundColor: '#FFEBEE', borderRadius: '8px' }}>
                    {selectedFarmerPR.status === 'REJECTED' ? 'Request Rejected' : 'Request Cancelled'}
                  </div>
                )}
              </div>
            </div>

            {/* Close Button */}
            <div style={{ marginTop: '1.25rem', textAlign: 'right' }}>
              <button
                onClick={() => setShowFarmerPRDetailsModal(false)}
                className="btn btn-secondary"
                style={{ padding: '0.5rem 1.25rem', fontWeight: '800' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: FARMER REPORTS & ANALYTICS VIEW DETAILS MODAL */}
      {/* ========================================================================= */}
      {activeReportModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 130, padding: '1rem' }}>
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '24px', width: '100%', maxWidth: '850px', maxHeight: '90vh', overflowY: 'auto', padding: '2rem', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #E5EBE5', paddingBottom: '0.85rem' }}>
              <div>
                <h3 style={{ fontSize: '1.35rem', fontWeight: '900', color: '#1B4D2E', margin: 0, textTransform: 'uppercase', letterSpacing: '-0.01em' }}>
                  {activeReportModal === 'harvest' && '🌾 Harvest Detailed Report'}
                  {activeReportModal === 'inventory' && '📦 Inventory Detailed Report'}
                  {activeReportModal === 'sales' && '💰 Sales Detailed Report'}
                  {activeReportModal === 'expense' && '🧾 Expense Detailed Report'}
                  {activeReportModal === 'agrochemical' && '🧪 Fertilizer & Pesticide Usage Report'}
                  {activeReportModal === 'irrigation' && '💧 Irrigation Detailed Report'}
                  {activeReportModal === 'overall' && '📊 Overall Farm Summary Breakdown'}
                </h3>
                <span style={{ fontSize: '0.82rem', color: '#718096', fontWeight: '600' }}>
                  Calculated from logged-in farmer DB records ({reportsPeriod.toUpperCase()})
                </span>
              </div>
              <button onClick={() => setActiveReportModal(null)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#718096' }}>
                <X size={24} />
              </button>
            </div>

            {/* MODAL CONTENT BODY BY REPORT TYPE */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

              {/* 1. HARVEST REPORT MODAL */}
              {activeReportModal === 'harvest' && (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', backgroundColor: '#F8FAF8', padding: '1rem', borderRadius: '12px', border: '1px solid #E5EBE5' }}>
                    <div><div style={{ fontSize: '0.72rem', color: '#718096', fontWeight: '700' }}>TOTAL FRESH</div><div style={{ fontSize: '1.25rem', fontWeight: '900', color: '#2E7D32' }}>{reportsData?.harvest_report?.total_fresh_kg || 0} KG</div></div>
                    <div><div style={{ fontSize: '0.72rem', color: '#718096', fontWeight: '700' }}>TOTAL CURED DRY</div><div style={{ fontSize: '1.25rem', fontWeight: '900', color: '#D97706' }}>{reportsData?.harvest_report?.total_dry_kg || 0} KG</div></div>
                    <div><div style={{ fontSize: '0.72rem', color: '#718096', fontWeight: '700' }}>HARVEST DAYS</div><div style={{ fontSize: '1.25rem', fontWeight: '900', color: '#1A202C' }}>{reportsData?.harvest_report?.total_harvest_days || 0} Days</div></div>
                    <div><div style={{ fontSize: '0.72rem', color: '#718096', fontWeight: '700' }}>AVG FRESH / DAY</div><div style={{ fontSize: '1.25rem', fontWeight: '900', color: '#2D3748' }}>{reportsData?.harvest_report?.avg_fresh_per_day || 0} KG</div></div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div style={{ backgroundColor: '#E8F5E9', padding: '1rem', borderRadius: '12px', border: '1px solid #A5D6A7' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: '900', color: '#2E7D32', textTransform: 'uppercase' }}>⭐ HIGHEST HARVEST DAY</div>
                      {reportsData?.harvest_report?.highest_harvest_record ? (
                        <div style={{ fontSize: '0.88rem', color: '#1B4D2E', marginTop: '0.35rem' }}>
                          <strong>Date:</strong> {reportsData.harvest_report.highest_harvest_record.harvest_date}<br />
                          <strong>Fresh:</strong> {reportsData.harvest_report.highest_harvest_record.fresh_quantity_kg} KG | <strong>Dry:</strong> {reportsData.harvest_report.highest_harvest_record.dried_quantity_kg || 0} KG
                        </div>
                      ) : <div style={{ fontSize: '0.82rem', color: '#718096', marginTop: '0.35rem' }}>No data available yet</div>}
                    </div>

                    <div style={{ backgroundColor: '#FFFBEB', padding: '1rem', borderRadius: '12px', border: '1px solid #FDE68A' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: '900', color: '#D97706', textTransform: 'uppercase' }}>🔻 LOWEST HARVEST DAY</div>
                      {reportsData?.harvest_report?.lowest_harvest_record ? (
                        <div style={{ fontSize: '0.88rem', color: '#92400E', marginTop: '0.35rem' }}>
                          <strong>Date:</strong> {reportsData.harvest_report.lowest_harvest_record.harvest_date}<br />
                          <strong>Fresh:</strong> {reportsData.harvest_report.lowest_harvest_record.fresh_quantity_kg} KG | <strong>Dry:</strong> {reportsData.harvest_report.lowest_harvest_record.dried_quantity_kg || 0} KG
                        </div>
                      ) : <div style={{ fontSize: '0.82rem', color: '#718096', marginTop: '0.35rem' }}>No data available yet</div>}
                    </div>
                  </div>

                  <div style={{ backgroundColor: '#F8FAF8', borderRadius: '14px', padding: '1.25rem', border: '1px solid #E5EBE5' }}>
                    <div style={{ fontSize: '0.88rem', fontWeight: '900', color: '#1B4D2E', marginBottom: '0.75rem' }}>
                      ⚖️ HARVEST COMPARISON TOOL
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '1rem' }}>
                      <select
                        value={harvestCompareType}
                        onChange={e => {
                          setHarvestCompareType(e.target.value);
                          setHarvestCompareItemA('');
                          setHarvestCompareItemB('');
                        }}
                        style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.82rem', fontWeight: '800' }}
                      >
                        <option value="month">Compare Month vs Month</option>
                        <option value="cycle">Compare Cycle vs Cycle</option>
                        <option value="plantation">Compare Plantation vs Plantation</option>
                      </select>

                      <select
                        value={harvestCompareItemA}
                        onChange={e => setHarvestCompareItemA(e.target.value)}
                        style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.82rem' }}
                      >
                        <option value="">Select Item A...</option>
                        {harvestCompareType === 'month' && Array.from(new Set((reportsData?.harvest_report?.records || []).map(r => r.harvest_date?.substring(0, 7)))).map(m => <option key={m} value={m}>{m}</option>)}
                        {harvestCompareType === 'cycle' && Array.from(new Set((reportsData?.harvest_report?.records || []).map(r => r.harvest_cycle__name).filter(Boolean))).map(c => <option key={c} value={c}>{c}</option>)}
                        {harvestCompareType === 'plantation' && Array.from(new Set((reportsData?.harvest_report?.records || []).map(r => r.plantation__name).filter(Boolean))).map(p => <option key={p} value={p}>{p}</option>)}
                      </select>

                      <span style={{ fontWeight: '900', color: '#718096' }}>VS</span>

                      <select
                        value={harvestCompareItemB}
                        onChange={e => setHarvestCompareItemB(e.target.value)}
                        style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.82rem' }}
                      >
                        <option value="">Select Item B...</option>
                        {harvestCompareType === 'month' && Array.from(new Set((reportsData?.harvest_report?.records || []).map(r => r.harvest_date?.substring(0, 7)))).map(m => <option key={m} value={m}>{m}</option>)}
                        {harvestCompareType === 'cycle' && Array.from(new Set((reportsData?.harvest_report?.records || []).map(r => r.harvest_cycle__name).filter(Boolean))).map(c => <option key={c} value={c}>{c}</option>)}
                        {harvestCompareType === 'plantation' && Array.from(new Set((reportsData?.harvest_report?.records || []).map(r => r.plantation__name).filter(Boolean))).map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </div>

                    {harvestCompareItemA && harvestCompareItemB && (() => {
                      const records = reportsData?.harvest_report?.records || [];
                      const filterFn = (itemVal) => {
                        if (harvestCompareType === 'month') return records.filter(r => r.harvest_date?.startsWith(itemVal));
                        if (harvestCompareType === 'cycle') return records.filter(r => r.harvest_cycle__name === itemVal);
                        return records.filter(r => r.plantation__name === itemVal);
                      };
                      const setA = filterFn(harvestCompareItemA);
                      const setB = filterFn(harvestCompareItemB);
                      const freshA = setA.reduce((s, r) => s + parseFloat(r.fresh_quantity_kg || 0), 0);
                      const freshB = setB.reduce((s, r) => s + parseFloat(r.fresh_quantity_kg || 0), 0);
                      const freshDiff = freshB - freshA;

                      return (
                        <div style={{ backgroundColor: '#FFFFFF', padding: '1rem', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '0.75rem' }}>
                            <div><strong>{harvestCompareItemA}:</strong> {freshA.toFixed(1)} Fresh KG</div>
                            <div><strong>{harvestCompareItemB}:</strong> {freshB.toFixed(1)} Fresh KG</div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <span style={{ fontWeight: '900', color: '#1B4D2E' }}>Difference: {freshDiff >= 0 ? `+${freshDiff.toFixed(1)}` : freshDiff.toFixed(1)} KG</span>
                            <span style={{ backgroundColor: freshB >= freshA ? '#E8F5E9' : '#FEF3C7', color: freshB >= freshA ? '#2E7D32' : '#92400E', padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: '900' }}>
                              {freshB >= freshA ? `Higher Harvest: ${harvestCompareItemB}` : `Lower Harvest: ${harvestCompareItemB}`}
                            </span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  <div>
                    <div style={{ fontSize: '0.88rem', fontWeight: '900', color: '#1B4D2E', marginBottom: '0.5rem' }}>📈 FRESH HARVEST BY DATE</div>
                    {reportsData?.harvest_report?.records?.length === 0 ? (
                      <div style={{ padding: '2rem', textAlign: 'center', color: '#718096', backgroundColor: '#F8FAF8', borderRadius: '12px' }}>No harvest data available yet.</div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem', height: '140px', backgroundColor: '#F8FAF8', padding: '1rem', borderRadius: '12px', border: '1px solid #E5EBE5', overflowX: 'auto' }}>
                        {reportsData?.harvest_report?.records?.slice(0, 15).reverse().map((r, i) => {
                          const maxQty = Math.max(...reportsData.harvest_report.records.map(rec => parseFloat(rec.fresh_quantity_kg || 1)));
                          const heightPct = Math.max(15, (parseFloat(r.fresh_quantity_kg || 0) / maxQty) * 100);
                          return (
                            <div key={i} style={{ flex: 1, minWidth: '32px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
                              <span style={{ fontSize: '0.65rem', fontWeight: '800', color: '#2E7D32' }}>{r.fresh_quantity_kg}k</span>
                              <div style={{ width: '100%', height: `${heightPct}%`, backgroundColor: '#43A047', borderRadius: '4px 4px 0 0' }} />
                              <span style={{ fontSize: '0.62rem', color: '#718096', textTransform: 'uppercase' }}>{r.harvest_date?.substring(5)}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div>
                    <div style={{ fontSize: '0.88rem', fontWeight: '900', color: '#1B4D2E', marginBottom: '0.5rem' }}>Detailed Harvest Logs</div>
                    {reportsData?.harvest_report?.records?.length === 0 ? (
                      <div style={{ padding: '2rem', textAlign: 'center', color: '#718096' }}>No data available yet.</div>
                    ) : (
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'left' }}>
                          <thead>
                            <tr style={{ backgroundColor: '#F8FAF8', borderBottom: '1px solid #E5EBE5', color: '#4A5568' }}>
                              <th style={{ padding: '0.6rem' }}>Date</th>
                              <th style={{ padding: '0.6rem' }}>Cycle</th>
                              <th style={{ padding: '0.6rem' }}>Plantation</th>
                              <th style={{ padding: '0.6rem' }}>Variety</th>
                              <th style={{ padding: '0.6rem' }}>Fresh (KG)</th>
                              <th style={{ padding: '0.6rem' }}>Dry (KG)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {reportsData.harvest_report.records.map(r => (
                              <tr key={r.id} style={{ borderBottom: '1px solid #F4F7F4' }}>
                                <td style={{ padding: '0.6rem', fontWeight: '800' }}>{r.harvest_date}</td>
                                <td style={{ padding: '0.6rem' }}>{r.harvest_cycle__name || '-'}</td>
                                <td style={{ padding: '0.6rem' }}>{r.plantation__name || '-'}</td>
                                <td style={{ padding: '0.6rem' }}>{r.variety}</td>
                                <td style={{ padding: '0.6rem', fontWeight: '900', color: '#2E7D32' }}>{r.fresh_quantity_kg}</td>
                                <td style={{ padding: '0.6rem', fontWeight: '900', color: '#D97706' }}>{r.dried_quantity_kg || 0}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* 2. INVENTORY REPORT MODAL */}
              {activeReportModal === 'inventory' && (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', backgroundColor: '#F8FAF8', padding: '1rem', borderRadius: '12px', border: '1px solid #E5EBE5' }}>
                    <div><div style={{ fontSize: '0.72rem', color: '#718096', fontWeight: '700' }}>TOTAL QUANTITY</div><div style={{ fontSize: '1.25rem', fontWeight: '900', color: '#0284C7' }}>{reportsData?.inventory_report?.total_inventory_kg || 0} KG</div></div>
                    <div><div style={{ fontSize: '0.72rem', color: '#718096', fontWeight: '700' }}>AVAILABLE FOR SALE</div><div style={{ fontSize: '1.25rem', fontWeight: '900', color: '#2E7D32' }}>{reportsData?.inventory_report?.available_kg || 0} KG</div></div>
                    <div><div style={{ fontSize: '0.72rem', color: '#718096', fontWeight: '700' }}>IN-STOCK</div><div style={{ fontSize: '1.25rem', fontWeight: '900', color: '#1B4D2E' }}>{reportsData?.inventory_report?.in_stock_kg || 0} KG</div></div>
                    <div><div style={{ fontSize: '0.72rem', color: '#718096', fontWeight: '700' }}>SOLD QUANTITY</div><div style={{ fontSize: '1.25rem', fontWeight: '900', color: '#64748B' }}>{reportsData?.inventory_report?.sold_kg || 0} KG</div></div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div style={{ backgroundColor: '#F8FAF8', padding: '1rem', borderRadius: '12px', border: '1px solid #E5EBE5' }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: '900', color: '#1B4D2E', marginBottom: '0.5rem' }}>VARIETY-WISE BREAKDOWN</div>
                      {Object.keys(reportsData?.inventory_report?.variety_wise || {}).length === 0 ? <div style={{ fontSize: '0.82rem', color: '#718096' }}>No data available yet</div> : (
                        Object.entries(reportsData.inventory_report.variety_wise).map(([v, q]) => (
                          <div key={v} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', padding: '0.35rem 0', borderBottom: '1px solid #E2E8F0' }}>
                            <span>{v}</span><strong style={{ color: '#2E7D32' }}>{q} KG</strong>
                          </div>
                        ))
                      )}
                    </div>

                    <div style={{ backgroundColor: '#F8FAF8', padding: '1rem', borderRadius: '12px', border: '1px solid #E5EBE5' }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: '900', color: '#1B4D2E', marginBottom: '0.5rem' }}>GRADE-WISE BREAKDOWN</div>
                      {Object.keys(reportsData?.inventory_report?.grade_wise || {}).length === 0 ? <div style={{ fontSize: '0.82rem', color: '#718096' }}>No data available yet</div> : (
                        Object.entries(reportsData.inventory_report.grade_wise).map(([g, q]) => (
                          <div key={g} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', padding: '0.35rem 0', borderBottom: '1px solid #E2E8F0' }}>
                            <span>{g}</span><strong style={{ color: '#0284C7' }}>{q} KG</strong>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.88rem', fontWeight: '900', color: '#1B4D2E', marginBottom: '0.5rem' }}>Individual Inventory Batches</div>
                    {reportsData?.inventory_report?.records?.length === 0 ? (
                      <div style={{ padding: '2rem', textAlign: 'center', color: '#718096' }}>No data available yet.</div>
                    ) : (
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'left' }}>
                          <thead>
                            <tr style={{ backgroundColor: '#F8FAF8', borderBottom: '1px solid #E5EBE5', color: '#4A5568' }}>
                              <th style={{ padding: '0.6rem' }}>Batch Code</th>
                              <th style={{ padding: '0.6rem' }}>Variety</th>
                              <th style={{ padding: '0.6rem' }}>Grade</th>
                              <th style={{ padding: '0.6rem' }}>Quantity</th>
                              <th style={{ padding: '0.6rem' }}>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {reportsData.inventory_report.records.map(i => (
                              <tr key={i.id} style={{ borderBottom: '1px solid #F4F7F4' }}>
                                <td style={{ padding: '0.6rem', fontWeight: '800', color: '#1B4D2E' }}>{i.batch_code}</td>
                                <td style={{ padding: '0.6rem' }}>{i.variety}</td>
                                <td style={{ padding: '0.6rem' }}>{i.grade}</td>
                                <td style={{ padding: '0.6rem', fontWeight: '900', color: '#2E7D32' }}>{i.quantity_kg} {i.unit}</td>
                                <td style={{ padding: '0.6rem' }}>
                                  <span style={{ backgroundColor: '#E8F5E9', color: '#2E7D32', padding: '0.15rem 0.5rem', borderRadius: '4px', fontWeight: '800', fontSize: '0.75rem' }}>
                                    {i.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* 3. SALES REPORT MODAL */}
              {activeReportModal === 'sales' && (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', backgroundColor: '#F8FAF8', padding: '1rem', borderRadius: '12px', border: '1px solid #E5EBE5' }}>
                    <div><div style={{ fontSize: '0.72rem', color: '#718096', fontWeight: '700' }}>TOTAL REVENUE</div><div style={{ fontSize: '1.25rem', fontWeight: '900', color: '#2E7D32' }}>₹{parseFloat(reportsData?.sales_report?.total_sales_amount || 0).toLocaleString('en-IN')}</div></div>
                    <div><div style={{ fontSize: '0.72rem', color: '#718096', fontWeight: '700' }}>TOTAL SOLD</div><div style={{ fontSize: '1.25rem', fontWeight: '900', color: '#1B4D2E' }}>{reportsData?.sales_report?.total_quantity_sold_kg || 0} KG</div></div>
                    <div><div style={{ fontSize: '0.72rem', color: '#718096', fontWeight: '700' }}>SALES COUNT</div><div style={{ fontSize: '1.25rem', fontWeight: '900', color: '#1A202C' }}>{reportsData?.sales_report?.total_sales || 0} Sales</div></div>
                    <div><div style={{ fontSize: '0.72rem', color: '#718096', fontWeight: '700' }}>AVG PRICE / KG</div><div style={{ fontSize: '1.25rem', fontWeight: '900', color: '#D97706' }}>₹{reportsData?.sales_report?.avg_selling_price_per_kg || 0}/KG</div></div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div style={{ backgroundColor: '#E8F5E9', padding: '1rem', borderRadius: '12px', border: '1px solid #A5D6A7' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: '900', color: '#2E7D32', textTransform: 'uppercase' }}>💰 HIGHEST SALE</div>
                      {reportsData?.sales_report?.highest_sale ? (
                        <div style={{ fontSize: '0.88rem', color: '#1B4D2E', marginTop: '0.35rem' }}>
                          <strong>Amount:</strong> ₹{parseFloat(reportsData.sales_report.highest_sale.total_amount).toLocaleString('en-IN')}<br />
                          <strong>Trader:</strong> {reportsData.sales_report.highest_sale.buyer__full_name} ({reportsData.sales_report.highest_sale.quantity_kg} KG)
                        </div>
                      ) : <div style={{ fontSize: '0.82rem', color: '#718096', marginTop: '0.35rem' }}>No data available yet</div>}
                    </div>

                    <div style={{ backgroundColor: '#FFFBEB', padding: '1rem', borderRadius: '12px', border: '1px solid #FDE68A' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: '900', color: '#D97706', textTransform: 'uppercase' }}>🏷️ LOWEST SALE</div>
                      {reportsData?.sales_report?.lowest_sale ? (
                        <div style={{ fontSize: '0.88rem', color: '#92400E', marginTop: '0.35rem' }}>
                          <strong>Amount:</strong> ₹{parseFloat(reportsData.sales_report.lowest_sale.total_amount).toLocaleString('en-IN')}<br />
                          <strong>Trader:</strong> {reportsData.sales_report.lowest_sale.buyer__full_name} ({reportsData.sales_report.lowest_sale.quantity_kg} KG)
                        </div>
                      ) : <div style={{ fontSize: '0.82rem', color: '#718096', marginTop: '0.35rem' }}>No data available yet</div>}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.88rem', fontWeight: '900', color: '#1B4D2E', marginBottom: '0.5rem' }}>Detailed Sales Records</div>
                    {reportsData?.sales_report?.records?.length === 0 ? (
                      <div style={{ padding: '2rem', textAlign: 'center', color: '#718096' }}>No data available yet.</div>
                    ) : (
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'left' }}>
                          <thead>
                            <tr style={{ backgroundColor: '#F8FAF8', borderBottom: '1px solid #E5EBE5', color: '#4A5568' }}>
                              <th style={{ padding: '0.6rem' }}>Sale ID</th>
                              <th style={{ padding: '0.6rem' }}>Buyer (Trader)</th>
                              <th style={{ padding: '0.6rem' }}>Variety</th>
                              <th style={{ padding: '0.6rem' }}>Quantity</th>
                              <th style={{ padding: '0.6rem' }}>Price / KG</th>
                              <th style={{ padding: '0.6rem' }}>Total Amount</th>
                              <th style={{ padding: '0.6rem' }}>Date</th>
                            </tr>
                          </thead>
                          <tbody>
                            {reportsData.sales_report.records.map(s => (
                              <tr key={s.id} style={{ borderBottom: '1px solid #F4F7F4' }}>
                                <td style={{ padding: '0.6rem', fontWeight: '800', color: '#1B4D2E' }}>#SALE-{s.id}</td>
                                <td style={{ padding: '0.6rem', fontWeight: '800' }}>{s.buyer__full_name}</td>
                                <td style={{ padding: '0.6rem' }}>{s.cardamom_variety}</td>
                                <td style={{ padding: '0.6rem', fontWeight: '900', color: '#2E7D32' }}>{s.quantity_kg} kg</td>
                                <td style={{ padding: '0.6rem' }}>₹{parseFloat(s.price_per_kg || 0).toLocaleString('en-IN')}</td>
                                <td style={{ padding: '0.6rem', fontWeight: '900', color: '#1B4D2E' }}>₹{parseFloat(s.total_amount).toLocaleString('en-IN')}</td>
                                <td style={{ padding: '0.6rem', color: '#718096' }}>{s.sale_date}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* 4. EXPENSE REPORT MODAL */}
              {activeReportModal === 'expense' && (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', backgroundColor: '#F8FAF8', padding: '1rem', borderRadius: '12px', border: '1px solid #E5EBE5' }}>
                    <div><div style={{ fontSize: '0.72rem', color: '#718096', fontWeight: '700' }}>TOTAL EXPENSES</div><div style={{ fontSize: '1.25rem', fontWeight: '900', color: '#DC2626' }}>₹{parseFloat(reportsData?.expense_report?.total_expenses || 0).toLocaleString('en-IN')}</div></div>
                    <div><div style={{ fontSize: '0.72rem', color: '#718096', fontWeight: '700' }}>FERTILIZER COST</div><div style={{ fontSize: '1.25rem', fontWeight: '900', color: '#2D3748' }}>₹{parseFloat(reportsData?.expense_report?.fertilizer_cost || 0).toLocaleString('en-IN')}</div></div>
                    <div><div style={{ fontSize: '0.72rem', color: '#718096', fontWeight: '700' }}>PESTICIDE COST</div><div style={{ fontSize: '1.25rem', fontWeight: '900', color: '#2D3748' }}>₹{parseFloat(reportsData?.expense_report?.pesticide_cost || 0).toLocaleString('en-IN')}</div></div>
                    <div><div style={{ fontSize: '0.72rem', color: '#718096', fontWeight: '700' }}>OTHER EXPENSES</div><div style={{ fontSize: '1.25rem', fontWeight: '900', color: '#64748B' }}>₹{parseFloat(reportsData?.expense_report?.other_expenses || 0).toLocaleString('en-IN')}</div></div>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.88rem', fontWeight: '900', color: '#1B4D2E', marginBottom: '0.5rem' }}>Detailed Expense Table</div>
                    {reportsData?.expense_report?.records?.length === 0 ? (
                      <div style={{ padding: '2rem', textAlign: 'center', color: '#718096' }}>No data available yet.</div>
                    ) : (
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'left' }}>
                          <thead>
                            <tr style={{ backgroundColor: '#F8FAF8', borderBottom: '1px solid #E5EBE5', color: '#4A5568' }}>
                              <th style={{ padding: '0.6rem' }}>Date</th>
                              <th style={{ padding: '0.6rem' }}>Category</th>
                              <th style={{ padding: '0.6rem' }}>Description</th>
                              <th style={{ padding: '0.6rem' }}>Amount</th>
                            </tr>
                          </thead>
                          <tbody>
                            {reportsData.expense_report.records.map(e => (
                              <tr key={e.id} style={{ borderBottom: '1px solid #F4F7F4' }}>
                                <td style={{ padding: '0.6rem', fontWeight: '800' }}>{e.expense_date}</td>
                                <td style={{ padding: '0.6rem', fontWeight: '700', color: '#1B4D2E' }}>{e.category}</td>
                                <td style={{ padding: '0.6rem' }}>{e.description || '-'}</td>
                                <td style={{ padding: '0.6rem', fontWeight: '900', color: '#DC2626' }}>₹{parseFloat(e.amount).toLocaleString('en-IN')}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* 5. AGROCHEMICAL REPORT MODAL */}
              {activeReportModal === 'agrochemical' && (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', backgroundColor: '#F8FAF8', padding: '1rem', borderRadius: '12px', border: '1px solid #E5EBE5' }}>
                    <div><div style={{ fontSize: '0.72rem', color: '#718096', fontWeight: '700' }}>FERTILIZER QTY</div><div style={{ fontSize: '1.25rem', fontWeight: '900', color: '#9333EA' }}>{reportsData?.agrochemical_report?.total_fertilizer_qty || 0} KG</div></div>
                    <div><div style={{ fontSize: '0.72rem', color: '#718096', fontWeight: '700' }}>FERTILIZER COST</div><div style={{ fontSize: '1.25rem', fontWeight: '900', color: '#2D3748' }}>₹{parseFloat(reportsData?.agrochemical_report?.total_fertilizer_cost || 0).toLocaleString('en-IN')}</div></div>
                    <div><div style={{ fontSize: '0.72rem', color: '#718096', fontWeight: '700' }}>PESTICIDE COST</div><div style={{ fontSize: '1.25rem', fontWeight: '900', color: '#2D3748' }}>₹{parseFloat(reportsData?.agrochemical_report?.total_pesticide_cost || 0).toLocaleString('en-IN')}</div></div>
                    <div><div style={{ fontSize: '0.72rem', color: '#718096', fontWeight: '700' }}>APPLICATIONS</div><div style={{ fontSize: '1.25rem', fontWeight: '900', color: '#1A202C' }}>{reportsData?.agrochemical_report?.total_applications || 0}</div></div>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.88rem', fontWeight: '900', color: '#1B4D2E', marginBottom: '0.5rem' }}>Agrochemical Applications Log</div>
                    {reportsData?.agrochemical_report?.records?.length === 0 ? (
                      <div style={{ padding: '2rem', textAlign: 'center', color: '#718096' }}>No data available yet.</div>
                    ) : (
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'left' }}>
                          <thead>
                            <tr style={{ backgroundColor: '#F8FAF8', borderBottom: '1px solid #E5EBE5', color: '#4A5568' }}>
                              <th style={{ padding: '0.6rem' }}>Product Name</th>
                              <th style={{ padding: '0.6rem' }}>Type</th>
                              <th style={{ padding: '0.6rem' }}>Plantation</th>
                              <th style={{ padding: '0.6rem' }}>Quantity</th>
                              <th style={{ padding: '0.6rem' }}>Applied Date</th>
                              <th style={{ padding: '0.6rem' }}>Next Application</th>
                              <th style={{ padding: '0.6rem' }}>Cost</th>
                            </tr>
                          </thead>
                          <tbody>
                            {reportsData.agrochemical_report.records.map(a => (
                              <tr key={a.id} style={{ borderBottom: '1px solid #F4F7F4' }}>
                                <td style={{ padding: '0.6rem', fontWeight: '800', color: '#1B4D2E' }}>{a.name}</td>
                                <td style={{ padding: '0.6rem' }}>
                                  <span style={{ backgroundColor: a.usage_type === 'FERTILIZER' ? '#F3E8FF' : '#FEF3C7', color: a.usage_type === 'FERTILIZER' ? '#9333EA' : '#D97706', padding: '0.15rem 0.5rem', borderRadius: '4px', fontWeight: '800', fontSize: '0.72rem' }}>
                                    {a.usage_type}
                                  </span>
                                </td>
                                <td style={{ padding: '0.6rem' }}>{a.plantation__name || '-'}</td>
                                <td style={{ padding: '0.6rem', fontWeight: '800' }}>{a.quantity} {a.unit}</td>
                                <td style={{ padding: '0.6rem', color: '#718096' }}>{a.application_date}</td>
                                <td style={{ padding: '0.6rem', color: '#718096' }}>{a.next_application_date || '-'}</td>
                                <td style={{ padding: '0.6rem', fontWeight: '900', color: '#2E7D32' }}>₹{parseFloat(a.cost || 0).toLocaleString('en-IN')}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* 6. IRRIGATION REPORT MODAL */}
              {activeReportModal === 'irrigation' && (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', backgroundColor: '#F8FAF8', padding: '1rem', borderRadius: '12px', border: '1px solid #E5EBE5' }}>
                    <div><div style={{ fontSize: '0.72rem', color: '#718096', fontWeight: '700' }}>TOTAL WATER VOLUME</div><div style={{ fontSize: '1.25rem', fontWeight: '900', color: '#0284C7' }}>{reportsData?.irrigation_report?.total_water_liters || 0} Liters</div></div>
                    <div><div style={{ fontSize: '0.72rem', color: '#718096', fontWeight: '700' }}>TOTAL DURATION</div><div style={{ fontSize: '1.25rem', fontWeight: '900', color: '#1B4D2E' }}>{reportsData?.irrigation_report?.total_duration_hours || 0} Hours</div></div>
                    <div><div style={{ fontSize: '0.72rem', color: '#718096', fontWeight: '700' }}>TOTAL LOGS</div><div style={{ fontSize: '1.25rem', fontWeight: '900', color: '#1A202C' }}>{reportsData?.irrigation_report?.records_count || 0}</div></div>
                    <div><div style={{ fontSize: '0.72rem', color: '#718096', fontWeight: '700' }}>LAST IRRIGATION</div><div style={{ fontSize: '1rem', fontWeight: '800', color: '#2E7D32' }}>{reportsData?.irrigation_report?.last_irrigation_date || '-'}</div></div>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.88rem', fontWeight: '900', color: '#1B4D2E', marginBottom: '0.5rem' }}>Detailed Irrigation Records</div>
                    {reportsData?.irrigation_report?.records?.length === 0 ? (
                      <div style={{ padding: '2rem', textAlign: 'center', color: '#718096' }}>No data available yet.</div>
                    ) : (
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'left' }}>
                          <thead>
                            <tr style={{ backgroundColor: '#F8FAF8', borderBottom: '1px solid #E5EBE5', color: '#4A5568' }}>
                              <th style={{ padding: '0.6rem' }}>Date</th>
                              <th style={{ padding: '0.6rem' }}>Plantation</th>
                              <th style={{ padding: '0.6rem' }}>Method</th>
                              <th style={{ padding: '0.6rem' }}>Duration (Hrs)</th>
                              <th style={{ padding: '0.6rem' }}>Water Volume (L)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {reportsData.irrigation_report.records.map(i => (
                              <tr key={i.id} style={{ borderBottom: '1px solid #F4F7F4' }}>
                                <td style={{ padding: '0.6rem', fontWeight: '800' }}>{i.irrigation_date}</td>
                                <td style={{ padding: '0.6rem' }}>{i.plantation__name || '-'}</td>
                                <td style={{ padding: '0.6rem', color: '#0284C7', fontWeight: '800' }}>{i.method}</td>
                                <td style={{ padding: '0.6rem', fontWeight: '800' }}>{i.duration_hours} hrs</td>
                                <td style={{ padding: '0.6rem', fontWeight: '900', color: '#2E7D32' }}>{i.water_volume_liters} L</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* 7. OVERALL SUMMARY MODAL */}
              {activeReportModal === 'overall' && (
                <>
                  <div style={{ backgroundColor: '#E8F5E9', padding: '1.25rem', borderRadius: '16px', border: '1px solid #A5D6A7' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: '900', color: '#1B4D2E', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                      FINANCIAL PERFORMANCE SUMMARY
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginTop: '0.5rem' }}>
                      <div>
                        <span style={{ fontSize: '0.78rem', color: '#4A5568' }}>Total Cardamom Sales Revenue</span>
                        <div style={{ fontSize: '1.4rem', fontWeight: '900', color: '#2E7D32' }}>₹{parseFloat(reportsData?.overall_summary?.total_sales_amount || 0).toLocaleString('en-IN')}</div>
                      </div>
                      <span style={{ fontSize: '1.5rem', fontWeight: '900', color: '#718096' }}>-</span>
                      <div>
                        <span style={{ fontSize: '0.78rem', color: '#4A5568' }}>Total Plantation Expenses</span>
                        <div style={{ fontSize: '1.4rem', fontWeight: '900', color: '#DC2626' }}>₹{parseFloat(reportsData?.overall_summary?.total_expenses_amount || 0).toLocaleString('en-IN')}</div>
                      </div>
                      <span style={{ fontSize: '1.5rem', fontWeight: '900', color: '#718096' }}>=</span>
                      <div>
                        <span style={{ fontSize: '0.78rem', color: '#1B4D2E', fontWeight: '800' }}>Gross Difference (Sales minus Expenses)</span>
                        <div style={{ fontSize: '1.5rem', fontWeight: '900', color: (reportsData?.overall_summary?.gross_difference || 0) >= 0 ? '#2E7D32' : '#C62828' }}>
                          ₹{parseFloat(reportsData?.overall_summary?.gross_difference || 0).toLocaleString('en-IN')}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    <div style={{ backgroundColor: '#F8FAF8', padding: '1rem', borderRadius: '12px', border: '1px solid #E5EBE5' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: '800', color: '#718096' }}>TOTAL PLANTATIONS</div>
                      <div style={{ fontSize: '1.2rem', fontWeight: '900', color: '#1B4D2E', marginTop: '0.2rem' }}>{reportsData?.overall_summary?.total_plantations || 0} Registered Estates</div>
                    </div>

                    <div style={{ backgroundColor: '#F8FAF8', padding: '1rem', borderRadius: '12px', border: '1px solid #E5EBE5' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: '800', color: '#718096' }}>HARVEST OUTPUT</div>
                      <div style={{ fontSize: '1.1rem', fontWeight: '900', color: '#2E7D32', marginTop: '0.2rem' }}>{reportsData?.overall_summary?.total_fresh_harvest_kg || 0} Fresh / {reportsData?.overall_summary?.total_dry_harvest_kg || 0} Dry KG</div>
                    </div>

                    <div style={{ backgroundColor: '#F8FAF8', padding: '1rem', borderRadius: '12px', border: '1px solid #E5EBE5' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: '800', color: '#718096' }}>CURRENT INVENTORY</div>
                      <div style={{ fontSize: '1.2rem', fontWeight: '900', color: '#0284C7', marginTop: '0.2rem' }}>{reportsData?.overall_summary?.total_inventory_kg || 0} KG Stock</div>
                    </div>

                    <div style={{ backgroundColor: '#F8FAF8', padding: '1rem', borderRadius: '12px', border: '1px solid #E5EBE5' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: '800', color: '#718096' }}>TRANSACTIONS</div>
                      <div style={{ fontSize: '1.2rem', fontWeight: '900', color: '#1A202C', marginTop: '0.2rem' }}>{reportsData?.overall_summary?.total_transactions_count || 0} Financial Logs</div>
                    </div>
                  </div>
                </>
              )}

            </div>

            {/* Footer Close Button */}
            <div style={{ marginTop: '1.5rem', textAlign: 'right', borderTop: '1px solid #E5EBE5', paddingTop: '1rem' }}>
              <button
                onClick={() => setActiveReportModal(null)}
                className="btn btn-secondary"
                style={{ padding: '0.5rem 1.5rem', fontWeight: '800', cursor: 'pointer' }}
              >
                Close Report
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

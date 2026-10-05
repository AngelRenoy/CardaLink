const rawApiUrl = import.meta.env.VITE_API_URL || '/api';
const API_BASE_URL = rawApiUrl.replace(/\/+$/, '');

const request = async (endpoint, options = {}) => {
  const token = localStorage.getItem('cardalink_token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const formattedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const targetUrl = `${API_BASE_URL}${formattedEndpoint}`;

  try {
    const response = await fetch(targetUrl, {
      ...options,
      headers,
      credentials: 'include',
    });

    const data = await response.json().catch(() => ({
      success: false,
      message: 'Invalid JSON response from authentication server',
    }));

    if (!response.ok) {
      throw new Error(data.message || `Request failed with status ${response.status}`);
    }

    return data;
  } catch (error) {
    // Human-friendly handling for browser network errors (Failed to fetch)
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      console.error(`[CardaLink API Error] Network connection failed to: ${targetUrl}`, error);
      throw new Error(
        `Unable to connect to the authentication server at ${API_BASE_URL}. Please ensure the CardaLink backend is running.`
      );
    }
    throw error;
  }
};

export { API_BASE_URL };

export const registerApi = (userData) => {
  return request('/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData),
  });
};

export const loginApi = (credentials) => {
  return request('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });
};

export const googleAuthApi = (payload) => {
  return request('/auth/google', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
};

export const confirmGoogleRoleApi = (payload) => {
  return request('/auth/google/confirm-role', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
};

export const getMeApi = () => {
  return request('/auth/me', {
    method: 'GET',
  });
};

export const logoutApi = () => {
  return request('/auth/logout', {
    method: 'POST',
  });
};

export const fetchUsersApi = () => {
  return request('/admin/users', {
    method: 'GET',
  });
};

export const updateUserStatusApi = (userId, status) => {
  return request(`/admin/users/${userId}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  });
};

export const fetchAuditLogsApi = (limit = 100) => {
  return request(`/admin/audit-logs?limit=${limit}`, {
    method: 'GET',
  });
};

export const fetchAdminStatsApi = () => request('/admin/dashboard/stats');
export const fetchPendingApprovalsApi = () => request('/admin/pending-approvals');
export const fetchAdminPlantationsApi = () => request('/admin/plantations');
export const fetchAdminVarietiesApi = () => request('/admin/cardamom-varieties');
export const fetchAdminHarvestsApi = () => request('/admin/harvests');
export const fetchAdminInventoryApi = () => request('/admin/inventory');
export const fetchAdminAgrochemicalsApi = (type = '') => request(`/admin/agrochemicals${type ? `?type=${type}` : ''}`);
export const fetchAdminIrrigationApi = () => request('/admin/irrigation');
export const fetchAdminExpensesApi = () => request('/admin/expenses');
export const fetchAdminSalesApi = () => request('/admin/sales');
export const fetchAdminTransactionsApi = () => request('/admin/transactions');
export const fetchAdminExportOrdersApi = () => request('/admin/export-orders');
export const fetchAdminExportDocumentsApi = () => request('/admin/export-documents');
export const fetchAdminShipmentsApi = () => request('/admin/shipments');
export const fetchAdminNotificationsApi = () => request('/admin/notifications');
export const fetchAdminReportsApi = () => request('/admin/reports');

// Farmer API Endpoints
export const fetchFarmerDashboardStatsApi = () => request('/farmer/dashboard/stats');
export const fetchFarmerPlantationsApi = () => request('/farmer/plantations');
export const createFarmerPlantationApi = (data) => request('/farmer/plantations', { method: 'POST', body: JSON.stringify(data) });
export const fetchFarmerVarietiesApi = () => request('/farmer/varieties');
export const createFarmerVarietyApi = (data) => request('/farmer/varieties', { method: 'POST', body: JSON.stringify(data) });

export const fetchFarmerHarvestsApi = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return request(`/farmer/harvests${query ? `?${query}` : ''}`);
};
export const createFarmerHarvestApi = (data) => request('/farmer/harvests', { method: 'POST', body: JSON.stringify(data) });
export const getFarmerHarvestApi = (id) => request(`/farmer/harvests/${id}`);
export const updateFarmerHarvestApi = (id, data) => request(`/farmer/harvests/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteFarmerHarvestApi = (id) => request(`/farmer/harvests/${id}`, { method: 'DELETE' });

export const fetchFarmerHarvestSummaryApi = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return request(`/farmer/harvests/summary${query ? `?${query}` : ''}`);
};

export const fetchFarmerAgrochemicalsApi = (type = '') => request(`/farmer/agrochemicals${type ? `?type=${type}` : ''}`);
export const createFarmerAgrochemicalApi = (data) => request('/farmer/agrochemicals', { method: 'POST', body: JSON.stringify(data) });

export const fetchFarmerIrrigationApi = () => request('/farmer/irrigation');
export const createFarmerIrrigationApi = (data) => request('/farmer/irrigation', { method: 'POST', body: JSON.stringify(data) });

export const fetchFarmerInventoryApi = () => request('/farmer/inventory');
export const createFarmerInventoryApi = (data) => request('/farmer/inventory', { method: 'POST', body: JSON.stringify(data) });

export const fetchFarmerExpensesApi = () => request('/farmer/expenses');
export const createFarmerExpenseApi = (data) => request('/farmer/expenses', { method: 'POST', body: JSON.stringify(data) });

export const fetchFarmerSalesApi = () => request('/farmer/sales');
export const fetchFarmerTransactionsApi = () => request('/farmer/transactions');

// Harvest Cycle API Endpoints
export const fetchActiveHarvestCycleApi = () => request('/farmer/harvest-cycles/active');
export const startHarvestCycleApi = (data) => request('/farmer/harvest-cycles/start', { method: 'POST', body: JSON.stringify(data) });
export const addDailyHarvestApi = (cycleId, data) => request(`/farmer/harvest-cycles/${cycleId}/daily`, { method: 'POST', body: JSON.stringify(data) });
export const completeHarvestCycleApi = (cycleId, data) => request(`/farmer/harvest-cycles/${cycleId}/complete`, { method: 'POST', body: JSON.stringify(data || {}) });
export const fetchHarvestHistoryApi = () => request('/farmer/harvest-cycles/history');
export const fetchCycleSummaryDetailApi = (cycleId) => request(`/farmer/harvest-cycles/${cycleId}/summary`);
export const updateCycleDryKgApi = (cycleId, fullDryQuantity) => request(`/farmer/harvest-cycles/${cycleId}/dry-kg`, { method: 'POST', body: JSON.stringify({ full_dry_quantity: fullDryQuantity }) });

// Trader API Endpoints
export const fetchTraderStatsApi = () => request('/trader/dashboard/stats');
export const fetchTraderMarketplaceApi = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return request(`/trader/marketplace${query ? `?${query}` : ''}`);
};
export const fetchTraderMarketplaceDetailApi = (id) => request(`/trader/marketplace/${id}`);
export const createTraderPurchaseRequestApi = (data) => request('/trader/purchase-requests/create', { method: 'POST', body: JSON.stringify(data) });
export const fetchTraderPurchaseRequestsApi = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return request(`/trader/purchase-requests${query ? `?${query}` : ''}`);
};
export const actionPurchaseRequestApi = (requestId, action, payload = {}) => request(`/trader/purchase-requests/${requestId}/action`, { method: 'POST', body: JSON.stringify({ action, ...payload }) });
export const fetchTraderPurchaseHistoryApi = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return request(`/trader/purchase-history${query ? `?${query}` : ''}`);
};
export const fetchTraderInventoryApi = () => request('/trader/inventory');
export const createTraderInventoryApi = (data) => request('/trader/inventory', { method: 'POST', body: JSON.stringify(data) });
export const fetchTraderSalesApi = () => request('/trader/sales');
export const createTraderSaleApi = (data) => request('/trader/sales', { method: 'POST', body: JSON.stringify(data) });
export const fetchTraderTransactionsApi = () => request('/trader/transactions');
export const fetchTraderExportSuppliesApi = () => request('/trader/export-supply');
export const createTraderExportSupplyApi = (data) => request('/trader/export-supply', { method: 'POST', body: JSON.stringify(data) });
export const fetchTraderReportsApi = () => request('/trader/reports');

// Farmer Response to Trader Bids
export const fetchFarmerPurchaseRequestsApi = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return request(`/farmer/purchase-requests${query ? `?${query}` : ''}`);
};
export const respondFarmerPurchaseRequestApi = (requestId, action, payload = {}) => request(`/farmer/purchase-requests/${requestId}/action`, { method: 'POST', body: JSON.stringify({ action, ...payload }) });
export const fetchFarmerReportsApi = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return request(`/farmer/reports${query ? `?${query}` : ''}`);
};

// Exporter API Endpoints
export const fetchTraderExportersApi = () => request('/trader/exporters');
export const fetchExporterDashboardStatsApi = () => request('/exporter/dashboard/stats');
export const fetchExporterExportSuppliesApi = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return request(`/exporter/export-supplies${query ? `?${query}` : ''}`);
};
export const fetchExporterExportSupplyDetailApi = (id) => request(`/exporter/export-supplies/${id}`);
export const actionExporterExportSupplyApi = (requestId, action, payload = {}) => request(`/exporter/export-supplies/${requestId}/action`, { method: 'POST', body: JSON.stringify({ action, ...payload }) });
export const fetchExporterTradersApi = () => request('/exporter/traders');
export const fetchExporterInventoryApi = () => request('/exporter/inventory');
export const createExporterInventoryApi = (data) => request('/exporter/inventory', { method: 'POST', body: JSON.stringify(data) });
export const fetchExporterBuyersApi = () => request('/exporter/buyers');
export const createExporterBuyerApi = (data) => request('/exporter/buyers', { method: 'POST', body: JSON.stringify(data) });
export const fetchExporterBuyerDetailApi = (id) => request(`/exporter/buyers/${id}`);
export const fetchExporterOrdersApi = () => request('/exporter/orders');
export const createExporterOrderApi = (data) => request('/exporter/orders', { method: 'POST', body: JSON.stringify(data) });
export const fetchExporterOrderDetailApi = (id) => request(`/exporter/orders/${id}`);
export const updateExporterOrderStatusApi = (id, status) => request(`/exporter/orders/${id}/status`, { method: 'POST', body: JSON.stringify({ status }) });
export const updateExporterOrderPaymentApi = (id, payload) => request(`/exporter/orders/${id}/payment`, { method: 'POST', body: JSON.stringify(payload) });
export const createExporterOrderQualityApi = (id, data) => request(`/exporter/orders/${id}/quality`, { method: 'POST', body: JSON.stringify(data) });
export const createExporterOrderPackagingApi = (id, data) => request(`/exporter/orders/${id}/packaging`, { method: 'POST', body: JSON.stringify(data) });
export const createExporterOrderDocumentApi = (id, data) => request(`/exporter/orders/${id}/documents`, { method: 'POST', body: JSON.stringify(data) });
export const fetchExporterShipmentsApi = () => request('/exporter/shipments');
export const createExporterShipmentApi = (data) => request('/exporter/shipments', { method: 'POST', body: JSON.stringify(data) });
export const updateExporterShipmentStatusApi = (id, status) => request(`/exporter/shipments/${id}/status`, { method: 'POST', body: JSON.stringify({ status }) });
export const fetchExporterTransactionsApi = () => request('/exporter/transactions');
export const fetchExporterReportsApi = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return request(`/exporter/reports${query ? `?${query}` : ''}`);
};
export const fetchExporterNotificationsApi = () => request('/exporter/notifications');
export const updateExporterProfileApi = (data) => request('/exporter/profile', { method: 'PUT', body: JSON.stringify(data) });







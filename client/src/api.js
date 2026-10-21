const BASE_URL = '/api';

export async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  };

  const res = await fetch(url, config);
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || data.message || 'Request failed');
  }
  return data;
}

function toQueryString(params = {}) {
  const clean = {};
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '' && value !== 'undefined' && value !== 'null') {
      clean[key] = value;
    }
  }
  const qs = new URLSearchParams(clean).toString();
  return qs ? `?${qs}` : '';
}

export const api = {
  // Analytics
  getAnalytics: (params = {}) => {
    return request(`/analytics${toQueryString(params)}`);
  },

  // Stores & Departments
  getStores: () => request('/stores'),
  getDepartments: () => request('/departments'),
  createDepartment: (data) => request('/departments', { method: 'POST', body: JSON.stringify(data) }),
  deleteDepartment: (id) => request(`/departments/${id}`, { method: 'DELETE' }),

  // Customers
  getCustomers: (params = {}) => {
    return request(`/customers${toQueryString(params)}`);
  },
  getCustomerById: (id) => request(`/customers/${id}`),
  createCustomer: (data) => request('/customers', { method: 'POST', body: JSON.stringify(data) }),
  updateCustomer: (id, data) => request(`/customers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  adjustPoints: (id, data) => request(`/customers/${id}/points`, { method: 'POST', body: JSON.stringify(data) }),
  customerPortalLookup: (identifier) => request(`/public/customer-portal?identifier=${encodeURIComponent(identifier)}`),

  // Dues & Credit Management (বাকি খাতা)
  getDues: (params = {}) => request(`/dues${toQueryString(params)}`),
  collectDue: (data) => request('/dues/collect', { method: 'POST', body: JSON.stringify(data) }),
  getCustomerDues: (id) => request(`/customers/${id}/dues`),

  // Products & Inventory
  getProducts: (params = {}) => {
    return request(`/products${toQueryString(params)}`);
  },
  getProductById: (id) => request(`/products/${id}`),
  createProduct: (data) => request('/products', { method: 'POST', body: JSON.stringify(data) }),
  updateProduct: (id, data) => request(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteProduct: (id) => request(`/products/${id}`, { method: 'DELETE' }),
  updateStock: (id, data) => request(`/products/${id}/stock`, { method: 'PATCH', body: JSON.stringify(data) }),

  // POS & Orders
  checkout: (data) => request('/pos/checkout', { method: 'POST', body: JSON.stringify(data) }),
  getOrders: (params = {}) => {
    return request(`/orders${toQueryString(params)}`);
  },
  getOrderById: (id) => request(`/orders/${id}`),
  updateOrder: (id, data) => request(`/orders/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteOrder: (id) => request(`/orders/${id}`, { method: 'DELETE' }),

  // Coupons
  getCoupons: () => request('/coupons'),
  createCoupon: (data) => request('/coupons', { method: 'POST', body: JSON.stringify(data) }),
  validateCoupon: (data) => request('/coupons/validate', { method: 'POST', body: JSON.stringify(data) }),

  // Marketing Campaigns
  getCampaigns: () => request('/campaigns'),
  getCampaignSegments: () => request('/campaigns/segments'),
  createCampaign: (data) => request('/campaigns', { method: 'POST', body: JSON.stringify(data) }),
  sendCampaign: (id) => request(`/campaigns/${id}/send`, { method: 'POST' }),
  deleteCampaign: (id) => request(`/campaigns/${id}`, { method: 'DELETE' }),

  // Support Tickets
  getTickets: (params = {}) => {
    return request(`/tickets${toQueryString(params)}`);
  },
  createTicket: (data) => request('/tickets', { method: 'POST', body: JSON.stringify(data) }),
  updateTicket: (id, data) => request(`/tickets/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  // Expenses & Operating Costs
  getExpenses: (params = {}) => {
    return request(`/expenses${toQueryString(params)}`);
  },
  createExpense: (data) => request('/expenses', { method: 'POST', body: JSON.stringify(data) }),
  deleteExpense: (id) => request(`/expenses/${id}`, { method: 'DELETE' }),

  // Maintenance
  resetData: () => request('/reset-data', { method: 'POST' }),
  cleanData: () => request('/clean-data', { method: 'POST' }),

  // Auth / PIN
  verifyPin: (pin) => request('/auth/verify-pin', { method: 'POST', body: JSON.stringify({ pin }) }),
  changePin: (oldPin, newPin) => request('/auth/change-pin', { method: 'POST', body: JSON.stringify({ oldPin, newPin }) })
};

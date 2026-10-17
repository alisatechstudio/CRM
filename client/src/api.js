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

export const api = {
  // Analytics
  getAnalytics: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/analytics${qs ? `?${qs}` : ''}`);
  },

  // Stores & Departments
  getStores: () => request('/stores'),
  getDepartments: () => request('/departments'),

  // Customers
  getCustomers: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/customers${qs ? `?${qs}` : ''}`);
  },
  getCustomerById: (id) => request(`/customers/${id}`),
  createCustomer: (data) => request('/customers', { method: 'POST', body: JSON.stringify(data) }),
  updateCustomer: (id, data) => request(`/customers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  adjustPoints: (id, data) => request(`/customers/${id}/points`, { method: 'POST', body: JSON.stringify(data) }),

  // Products & Inventory
  getProducts: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/products${qs ? `?${qs}` : ''}`);
  },
  getProductById: (id) => request(`/products/${id}`),
  createProduct: (data) => request('/products', { method: 'POST', body: JSON.stringify(data) }),
  updateProduct: (id, data) => request(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteProduct: (id) => request(`/products/${id}`, { method: 'DELETE' }),
  updateStock: (id, data) => request(`/products/${id}/stock`, { method: 'PATCH', body: JSON.stringify(data) }),

  // POS & Orders
  checkout: (data) => request('/pos/checkout', { method: 'POST', body: JSON.stringify(data) }),
  getOrders: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/orders${qs ? `?${qs}` : ''}`);
  },
  getOrderById: (id) => request(`/orders/${id}`),

  // Coupons
  getCoupons: () => request('/coupons'),
  createCoupon: (data) => request('/coupons', { method: 'POST', body: JSON.stringify(data) }),
  validateCoupon: (data) => request('/coupons/validate', { method: 'POST', body: JSON.stringify(data) }),

  // Marketing Campaigns
  getCampaigns: () => request('/campaigns'),
  createCampaign: (data) => request('/campaigns', { method: 'POST', body: JSON.stringify(data) }),
  sendCampaign: (id) => request(`/campaigns/${id}/send`, { method: 'POST' }),

  // Support Tickets
  getTickets: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/tickets${qs ? `?${qs}` : ''}`);
  },
  createTicket: (data) => request('/tickets', { method: 'POST', body: JSON.stringify(data) }),
  updateTicket: (id, data) => request(`/tickets/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  // Maintenance
  resetData: () => request('/reset-data', { method: 'POST' }),
  cleanData: () => request('/clean-data', { method: 'POST' }),

  // Auth / PIN
  verifyPin: (pin) => request('/auth/verify-pin', { method: 'POST', body: JSON.stringify({ pin }) }),
  changePin: (oldPin, newPin) => request('/auth/change-pin', { method: 'POST', body: JSON.stringify({ oldPin, newPin }) })
};

const API_BASE = 'http://localhost:8080/api';

export function getAuthToken() {
  return localStorage.getItem('techpulse_token');
}

export function setAuthSession(authData) {
  if (authData?.token) {
    localStorage.setItem('techpulse_token', authData.token);
    localStorage.setItem('techpulse_user', JSON.stringify({
      id: authData.id,
      username: authData.username,
      email: authData.email,
      fullName: authData.fullName,
      role: authData.role
    }));
  }
}

export function clearAuthSession() {
  localStorage.removeItem('techpulse_token');
  localStorage.removeItem('techpulse_user');
}

export function getStoredUser() {
  try {
    const raw = localStorage.getItem('techpulse_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
  };

  try {
    const res = await fetch(url, config);
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || `Lỗi yêu cầu: ${res.status}`);
    }
    return data;
  } catch (err) {
    console.error(`API Error [${endpoint}]:`, err);
    throw err;
  }
}

export const api = {
  // Auth
  login: (credentials) => request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  register: (userData) => request('/auth/register', { method: 'POST', body: JSON.stringify(userData) }),
  getMe: () => request('/auth/me'),

  // File Upload
  uploadImage: async (file) => {
    const url = `${API_BASE}/upload`;
    const formData = new FormData();
    formData.append('file', file);

    const headers = {};
    const token = getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Lỗi khi tải ảnh lên');
    }
    return data;
  },

  // Categories
  getCategories: () => request('/categories'),
  createCategory: (cat) => request('/categories', { method: 'POST', body: JSON.stringify(cat) }),
  deleteCategory: (id) => request(`/categories/${id}`, { method: 'DELETE' }),

  // Products
  getProducts: (params = {}) => {
    const query = new URLSearchParams();
    if (params.categoryId) query.append('categoryId', params.categoryId);
    if (params.keyword) query.append('keyword', params.keyword);
    if (params.minPrice) query.append('minPrice', params.minPrice);
    if (params.maxPrice) query.append('maxPrice', params.maxPrice);
    if (params.sortBy) query.append('sortBy', params.sortBy);
    if (params.page !== undefined) query.append('page', params.page);
    if (params.size !== undefined) query.append('size', params.size);

    const qs = query.toString();
    return request(`/products${qs ? `?${qs}` : ''}`);
  },
  getFeaturedProducts: () => request('/products/featured'),
  getProductById: (id) => request(`/products/${id}`),
  createProduct: (product) => request('/products', { method: 'POST', body: JSON.stringify(product) }),
  updateProduct: (id, product) => request(`/products/${id}`, { method: 'PUT', body: JSON.stringify(product) }),
  deleteProduct: (id) => request(`/products/${id}`, { method: 'DELETE' }),

  // Orders
  getOrders: () => request('/orders'),
  getOrderById: (id) => request(`/orders/${id}`),
  createOrder: (order) => request('/orders', { method: 'POST', body: JSON.stringify(order) }),
  updateOrderStatus: (id, status) => request(`/orders/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status })
  }),

  // Dashboard Stats
  getStats: () => request('/dashboard/stats'),

  // Payment & Webhook
  checkPaymentStatus: (orderId) => request(`/payment/order-status/${orderId}`),
  simulateTransfer: (orderId) => request(`/payment/simulate-transfer/${orderId}`, { method: 'POST' }),
  getWebhookInfo: () => request('/payment/webhook-info'),

  // Reviews & Ratings
  getProductReviews: (productId) => request(`/products/${productId}/reviews`),
  createProductReview: (productId, reviewData) => request(`/products/${productId}/reviews`, {
    method: 'POST',
    body: JSON.stringify(reviewData)
  }),
};

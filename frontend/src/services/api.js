import { logoutFirebase } from '../lib/firebase';

const API_BASE = '/api';

let inMemoryToken = (() => {
  try {
    return localStorage.getItem('techpulse_token') || null;
  } catch {
    return null;
  }
})();

let inMemoryUser = (() => {
  try {
    const raw = localStorage.getItem('techpulse_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
})();

export function getAuthToken() {
  return inMemoryToken;
}

export function setAuthToken(token) {
  inMemoryToken = token || null;
  try {
    if (inMemoryToken) {
      localStorage.setItem('techpulse_token', inMemoryToken);
    } else {
      localStorage.removeItem('techpulse_token');
    }
  } catch {}
}

export function setAuthSession(authData) {
  if (authData?.token) {
    setAuthToken(authData.token);
  }
  if (authData?.username || authData?.email) {
    inMemoryUser = {
      id: authData.id,
      uid: authData.uid || '',
      username: authData.username,
      email: authData.email,
      fullName: authData.fullName,
      phone: authData.phone || '',
      address: authData.address || '',
      role: authData.role,
    };
    try {
      localStorage.setItem('techpulse_user', JSON.stringify(inMemoryUser));
    } catch {}
  }
}

export function clearAuthSession() {
  inMemoryToken = null;
  inMemoryUser = null;
  try {
    localStorage.removeItem('techpulse_token');
    localStorage.removeItem('techpulse_user');
  } catch {}
  logoutFirebase();
}

export function getStoredUser() {
  return inMemoryUser;
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
  // Auth & Profile
  login: (credentials) => request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  register: (userData) => request('/auth/register', { method: 'POST', body: JSON.stringify(userData) }),
  syncFirebaseUser: (idToken) => {
    setAuthToken(idToken);
    return request('/auth/firebase-sync', { method: 'POST' });
  },
  getMe: () => request('/auth/me'),
  updateProfile: (profileData) => request('/auth/profile', { method: 'PUT', body: JSON.stringify(profileData) }),
  changePassword: (passwordData) => request('/auth/password', { method: 'PUT', body: JSON.stringify(passwordData) }),

  // Admin Users Management
  getUsers: () => request('/users'),
  updateUserRole: (id, role) => request(`/users/${id}/role`, { method: 'PATCH', body: JSON.stringify({ role }) }),
  deleteUser: (id) => request(`/users/${id}`, { method: 'DELETE' }),

  // Wishlist (PostgreSQL sync)
  getWishlist: () => request('/wishlist'),
  toggleWishlist: (productId) => request('/wishlist/toggle', { method: 'POST', body: JSON.stringify({ productId }) }),

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
  updateCategory: (id, cat) => request(`/categories/${id}`, { method: 'PUT', body: JSON.stringify(cat) }),
  deleteCategory: (id) => request(`/categories/${id}`, { method: 'DELETE' }),

  // Coupons / Vouchers
  getActiveCoupons: () => request('/coupons/active'),
  validateCoupon: (code, orderAmount) => request('/coupons/validate', {
    method: 'POST',
    body: JSON.stringify({ code, orderAmount }),
  }),
  getAllCoupons: () => request('/coupons'),
  createCoupon: (coupon) => request('/coupons', { method: 'POST', body: JSON.stringify(coupon) }),
  updateCoupon: (id, coupon) => request(`/coupons/${id}`, { method: 'PUT', body: JSON.stringify(coupon) }),
  deleteCoupon: (id) => request(`/coupons/${id}`, { method: 'DELETE' }),

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
  updateProductStock: (id, payload) => request(`/products/${id}/stock`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  }),

  // Orders
  getOrders: () => request('/orders'),
  getMyOrders: () => request('/orders/my-orders'),
  getRecentOrderCodes: () => request('/orders/recent-codes'),
  lookupOrders: (code, phone) => {
    const query = new URLSearchParams();
    if (code) query.append('code', code);
    if (phone) query.append('phone', phone);
    return request(`/orders/lookup?${query.toString()}`);
  },
  getOrderById: (id) => request(`/orders/${id}`),
  createOrder: (order) => request('/orders', { method: 'POST', body: JSON.stringify(order) }),
  cancelOrder: (id, verification = {}) => request(`/orders/${id}/cancel`, {
    method: 'POST',
    body: JSON.stringify(verification),
  }),
  updateOrderStatus: (id, status) => request(`/orders/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status })
  }),

  // Dashboard Stats & Audit Logs
  getStats: () => request('/dashboard/stats'),
  getAdminAuditLogs: (category = 'ALL') =>
    request(`/admin/audit-logs${category && category !== 'ALL' ? `?category=${category}` : ''}`),

  // Payment & Webhook
  checkPaymentStatus: (orderId) => request(`/payment/order-status/${orderId}`),
  simulateTransfer: (orderId) => request(`/payment/simulate-transfer/${orderId}`, { method: 'POST' }),
  getWebhookInfo: () => request('/payment/webhook-info'),

  // Reviews & Ratings (Customer + Admin Moderation)
  getProductReviews: (productId) => request(`/products/${productId}/reviews`),
  createProductReview: (productId, reviewData) => request(`/products/${productId}/reviews`, {
    method: 'POST',
    body: JSON.stringify(reviewData)
  }),
  getAllReviewsAdmin: () => request('/reviews'),
  moderateReview: (id, payload) => request(`/reviews/${id}/moderate`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  }),
  deleteReview: (id) => request(`/reviews/${id}`, { method: 'DELETE' }),

  // AI Consultant Chat
  sendChatMessage: (payload) => request('/ai/chat', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
};




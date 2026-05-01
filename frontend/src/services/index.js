import api from './api'

// Auth
export const authService = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/password', data),
  logout: () => api.post('/auth/logout'),
}

// APIs
export const apiService = {
  getAll: () => api.get('/apis'),
  getOne: (id) => api.get(`/apis/${id}`),
  create: (data) => api.post('/apis', data),
  update: (id, data) => api.put(`/apis/${id}`, data),
  delete: (id) => api.delete(`/apis/${id}`),
}

// API Keys
export const keyService = {
  getAll: () => api.get('/keys'),
  getByApi: (apiId) => api.get(`/keys/api/${apiId}`),
  generate: (data) => api.post('/keys', data),
  revoke: (id) => api.put(`/keys/${id}/revoke`),
  rotate: (id) => api.put(`/keys/${id}/rotate`),
  delete: (id) => api.delete(`/keys/${id}`),
}

// Usage
export const usageService = {
  getLogs: (params) => api.get('/usage', { params }),
  getSummary: (params) => api.get('/usage/summary', { params }),
  getRealtime: () => api.get('/usage/realtime'),
}

// Billing
export const billingService = {
  getHistory: () => api.get('/billing'),
  getCurrent: () => api.get('/billing/current'),
  getInvoice: (id) => api.get(`/billing/${id}`),
  upgradePlan: (plan) => api.post('/billing/upgrade', { plan }),
}

// Analytics
export const analyticsService = {
  getOverview: (params) => api.get('/analytics/overview', { params }),
  getRequests: (params) => api.get('/analytics/requests', { params }),
  getTopApis: () => api.get('/analytics/top-apis'),
  getLatency: () => api.get('/analytics/latency'),
}

// Admin
export const adminService = {
  getStats: () => api.get('/admin/stats'),
  getUsers: (params) => api.get('/admin/users', { params }),
  getPlatformUsage: () => api.get('/admin/usage'),
  toggleUserStatus: (id) => api.put(`/admin/users/${id}/status`),
  getAuditLogs: (params) => api.get('/admin/audit', { params }),
}

// Webhooks
export const webhookService = {
  getAll: () => api.get('/webhooks'),
  create: (data) => api.post('/webhooks', data),
  update: (id, data) => api.put(`/webhooks/${id}`, data),
  delete: (id) => api.delete(`/webhooks/${id}`),
  test: (id) => api.post(`/webhooks/${id}/test`),
}

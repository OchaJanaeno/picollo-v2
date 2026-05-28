import api from './api'
export const outletService = {
  getAll: (params) => api.get('/admin/outlets', { params }),
  getById: (id) => api.get(`/admin/outlets/${id}`),
  create: (data) => api.post('/admin/outlets', data),
  update: (id, data) => api.put(`/admin/outlets/${id}`, data),
  toggleStatus: (id) => api.patch(`/admin/outlets/${id}/toggle-status`),
  regenerateToken: (id) => api.post(`/admin/outlets/${id}/regenerate-token`),
}
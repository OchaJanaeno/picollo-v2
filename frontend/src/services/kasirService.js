import api from './api'
export const kasirService = {
  getAll: (params) => api.get('/admin/cashiers', { params }),
  getById: (id) => api.get(`/admin/cashiers/${id}`),
  create: (data) => api.post('/admin/cashiers', data),
  update: (id, data) => api.put(`/admin/cashiers/${id}`, data),
  toggleStatus: (id) => api.patch(`/admin/cashiers/${id}/toggle-status`),
  getActivity: (id) => api.get(`/admin/cashiers/${id}/activity`),
}
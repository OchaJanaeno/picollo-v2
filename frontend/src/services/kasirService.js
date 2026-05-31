import api from '../api'

export const kasirService = {
  getAll: () => api.get('/kasir'),
  getById: (id) => api.get(`/kasir/${id}`),
  create: (data) => api.post('/kasir', data),
  update: (id, data) => api.put(`/kasir/${id}`, data),
  delete: (id) => api.delete(`/kasir/${id}`)
}
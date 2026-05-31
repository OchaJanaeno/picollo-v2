import api from './api'
export const kasirService = {
  getAll:      (params) => api.get('/kasir', { params }),
  getById:     (id)     => api.get(`/kasir/${id}`),
  create:      (data)   => api.post('/kasir', data),
  update:      (id, data) => api.put(`/kasir/${id}`, data),
  toggleStatus:(id, status) => api.put(`/kasir/${id}`, { is_active: status === 'aktif' }),
  getActivity: (id)     => api.get(`/transactions?user_id=${id}&per_page=10`),
}
import api from './api'
export const transaksiService = {
  getAll: (params) => api.get('/admin/transactions', { params }),
  getById: (id) => api.get(`/admin/transactions/${id}`),
  create: (data) => api.post('/kasir/transactions', data),
  getProduk: () => api.get('/kasir/products'),
}
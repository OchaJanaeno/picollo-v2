import api from './api'
export const transaksiService = {
  getAll:    (params) => api.get('/transactions', { params }),
  getById:   (id)     => api.get(`/transactions/${id}`),
  create:    (data)   => api.post('/transactions', data),
  getProduk: ()       => api.get('/products'),
}
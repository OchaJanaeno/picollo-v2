import api from './api'
export const rekapService = {
  getHarian: () => api.get('/kasir/daily-recap'),
  kirimKeAdmin: (data) => api.post('/kasir/daily-recap/send', data),
  updateTransaksi: (id, data) => api.put(`/kasir/transactions/${id}`, data),
  hapusTransaksi: (id) => api.delete(`/kasir/transactions/${id}`),
}
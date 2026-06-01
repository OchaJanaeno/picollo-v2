import api from './api'
export const produkService = {
  getAll: (params) => api.get('/admin/products', { params }),
  create: (data) => api.post('/admin/products', data),
  update: (id, data) => {
    if (data instanceof FormData) {
      return api.post(`/admin/products/${id}?_method=PUT`, data)
    }
    return api.put(`/admin/products/${id}`, data)
  },
  delete: (id) => api.delete(`/admin/products/${id}`),
}
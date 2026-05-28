import api from './api'
export const logKoreksiService = {
  getAll: (params) => api.get('/admin/correction-logs', { params }),
  getById: (id) => api.get(`/admin/correction-logs/${id}`),
}
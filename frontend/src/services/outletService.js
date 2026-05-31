import api from './api'
export const outletService = {
  getAll:        (params) => api.get('/outlets', { params }),
  getById:       (id)     => api.get(`/outlets/${id}`),
  create:        (data)   => api.post('/outlets', data),
  update:        (id, data) => api.put(`/outlets/${id}`, data),
  toggleStatus:  (id, newStatus) => api.put(`/outlets/${id}`, { status: newStatus }),
}
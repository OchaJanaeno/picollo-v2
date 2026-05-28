import api from './api'

export const dashboardService = {
  getAdminStats:  () => api.get('/admin/dashboard'),
  getKasirStats:  () => api.get('/kasir/dashboard'),
  getAuditorStats: () => api.get('/auditor/dashboard'),
}
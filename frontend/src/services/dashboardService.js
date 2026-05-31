import api from './api'
export const dashboardService = {
  getAdminStats:   () => api.get('/dashboard/admin'),
  // Kasir & Auditor dashboard belum ada route di backend
  // Sementara pakai endpoint yang ada:
  getKasirStats:   () => api.get('/transactions?per_page=5'),
  getAuditorStats: () => api.get('/transactions?per_page=5'),
}
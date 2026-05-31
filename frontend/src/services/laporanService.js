import api from './api'
export const laporanService = {
  getKeuangan: (params) => api.get('/reports', { params }),
  exportPdf:   (params) => api.get('/reports/export-pdf', { params, responseType: 'blob' }),
}
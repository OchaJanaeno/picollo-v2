import api from './api'
export const laporanService = {
  getKeuangan: (params) => api.get('/admin/reports/financial', { params }),
  exportPdf: (params) => api.get('/admin/reports/export/pdf', { params, responseType: 'blob' }),
  exportExcel: (params) => api.get('/admin/reports/export/excel', { params, responseType: 'blob' }),
}
import api from './api'
export const verifikasiService = {
  verifyHash: (hash) => api.post('/verify', { hash }),
  getHistory: (params) => api.get('/admin/verifications', { params }),
}
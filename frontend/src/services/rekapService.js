import api from './api'
export const rekapService = {
  getHarian:    ()     => api.get('/daily-recaps'),
  kirimKeAdmin: (data) => api.post('/daily-recaps', data),
}
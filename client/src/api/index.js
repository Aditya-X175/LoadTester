import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

// Request interceptor: attach JWT bearer token if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('ltp_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
}, (error) => Promise.reject(error))

// Response interceptor: handle 401s
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // If we got a 401 and it's not the login or register request itself
      const url = error.config?.url || ''
      if (!url.includes('/auth/login') && !url.includes('/auth/register')) {
        localStorage.removeItem('ltp_token')
        localStorage.removeItem('ltp_user')
        if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
          window.location.href = '/login'
        }
      }
    }
    return Promise.reject(error)
  }
)

// Auth API
export const authApi = {
  login: (credentials) => api.post('/auth/login', credentials).then(r => r.data),
  register: (userData) => api.post('/auth/register', userData).then(r => r.data),
  getMe: () => api.get('/auth/me').then(r => r.data),
}

// Sessions API
export const sessionsApi = {
  getAll: (params = {}) => api.get('/sessions', { params }).then(r => r.data),
  getById: (id) => api.get(`/sessions/${id}`).then(r => r.data),
  create: (data) => api.post('/sessions', data).then(r => r.data),
  update: (id, data) => api.put(`/sessions/${id}`, data).then(r => r.data),
  delete: (id) => api.delete(`/sessions/${id}`).then(r => r.data),
  getSummary: (id) => api.get(`/sessions/${id}/summary`).then(r => r.data),
}

// Metrics API
export const metricsApi = {
  getBySession: (sessionId) => api.get(`/sessions/${sessionId}/metrics`).then(r => r.data),
  add: (sessionId, data) => api.post(`/sessions/${sessionId}/metrics`, data).then(r => r.data),
  delete: (sessionId, metricId) => api.delete(`/sessions/${sessionId}/metrics/${metricId}`).then(r => r.data),
}

// Import API
export const importApi = {
  importFile: (sessionId, file) => {
    const form = new FormData()
    form.append('file', file)
    form.append('sessionId', sessionId)
    return api.post('/import', form, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data)
  },
  importJson: (sessionId, metrics) =>
    api.post('/import', { sessionId, metrics }).then(r => r.data),
}

// Health API
export const healthApi = {
  check: () => api.get('/health').then(r => r.data),
}

export default api

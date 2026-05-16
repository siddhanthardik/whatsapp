import axios from 'axios'
import { toast } from 'react-hot-toast'
import useAuthStore from '../store/authStore'

const BASE = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({
  baseURL: BASE,
  timeout: 15000,
})

// Request interceptor: attach Bearer token from Zustand store
api.interceptors.request.use(
  (cfg) => {
    try {
      const token = useAuthStore.getState().token
      if (token) {
        cfg.headers = { ...(cfg.headers || {}), Authorization: `Bearer ${token}` }
      }
    } catch (e) {
      // ignore
    }
    return cfg
  },
  (err) => Promise.reject(err)
)

// Response interceptor: redirect on 401, toast on 403
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err?.response?.status
    if (status === 401) {
      try {
        useAuthStore.getState().clearAuth()
      } catch (e) { }
      // client-side redirect to login
      window.location.href = '/login'
      return Promise.reject(err)
    }
    if (status === 403) {
      toast.error('You do not have permission to do this')
      return Promise.reject(err)
    }
    return Promise.reject(err)
  }
)

/* Named API exports for backend routes */

export const authAPI = {
  login: (payload) => api.post('/auth/login', payload),
  register: (payload) => api.post('/auth/register', payload),
  logout: (refreshToken) => api.post('/auth/logout', { refreshToken }),
  refreshToken: (refreshToken) => api.post('/auth/refresh-token', { refreshToken }),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => api.post('/auth/reset-password', { token, password }),
  verify2fa: (payload) => api.post('/auth/verify-2fa', payload),
}

export const contactGroupsAPI = {
  list: () => api.get('/contact-groups'),
  create: (data) => api.post('/contact-groups', data),
  update: (id, data) => api.put(`/contact-groups/${id}`, data),
  delete: (id) => api.delete(`/contact-groups/${id}`)
}

export const contactsAPI = {
  list: (params) => api.get('/contacts', { params }),
  get: (id) => api.get(`/contacts/${id}`),
  create: (payload) => api.post('/contacts', payload),
  update: (id, payload) => api.put(`/contacts/${id}`, payload),
  delete: (id) => api.delete(`/contacts/${id}`),
  import: (file) => {
    const fd = new FormData()
    fd.append('file', file)
    return api.post('/contacts/import', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
  },

  // supports optional mapping object, groupIds and tags
  importWithMapping: (file, mapping, groupIds = [], tags = []) => {
    const fd = new FormData()
    fd.append('file', file)
    if (mapping && typeof mapping === 'object') {
      fd.append('mapping', JSON.stringify(mapping))
    }
    if (groupIds && groupIds.length > 0) {
      fd.append('groupIds', JSON.stringify(groupIds))
    }
    if (tags && tags.length > 0) {
      fd.append('tags', JSON.stringify(tags))
    }
    return api.post('/contacts/import', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
  },
  export: (params) => api.get('/contacts/export', { params, responseType: 'blob' }),
}

export const templatesAPI = {
  list: (params) => api.get('/templates', { params }),
  get: (id) => api.get(`/templates/${id}`),
  create: (payload) => api.post('/templates', payload),
  update: (id, payload) => api.put(`/templates/${id}`, payload),
  delete: (id) => api.delete(`/templates/${id}`),
  submit: (id) => api.post(`/templates/${id}/submit`),
}

export const campaignsAPI = {
  list: (params) => api.get('/campaigns', { params }),
  get: (id) => api.get(`/campaigns/${id}`),
  create: (payload) => api.post('/campaigns', payload),
  update: (id, payload) => api.put(`/campaigns/${id}`, payload),
  delete: (id) => api.delete(`/campaigns/${id}`),
  launch: (id) => api.post(`/campaigns/${id}/launch`),
  pause: (id) => api.post(`/campaigns/${id}/pause`),
  resume: (id) => api.post(`/campaigns/${id}/resume`),
  cancel: (id) => api.post(`/campaigns/${id}/cancel`),
}

export const analyticsAPI = {
  dashboard: (params) => api.get('/analytics/dashboard', { params }),
  campaign: (id, params) => api.get(`/analytics/campaigns/${id}`, { params }),
  trends: (params) => api.get('/analytics/trends', { params }),
  topTemplates: (params) => api.get('/analytics/top-templates', { params }),
  heatmap: (params) => api.get('/analytics/heatmap', { params }),
  audienceGrowth: (params) => api.get('/analytics/audience-growth', { params }),
}

export const reportsAPI = {
  delivery: (params) => api.get('/reports/delivery', { params }),
  optOut: (params) => api.get('/reports/opt-outs', { params }),
  exportCSV: (params) => api.get('/reports/export/csv', { params, responseType: 'blob' }),
  exportPDF: (params) => api.get('/reports/export/pdf', { params, responseType: 'blob' }),
}

export const optAPI = {
  optInList: (params) => api.get('/opt/in', { params }),
  optOutList: (params) => api.get('/opt/out', { params }),
  manualOptOut: (contactId, reason) => api.post(`/opt/manual/out`, { contactId, reason }),
  manualOptIn: (contactId) => api.post(`/opt/manual/in`, { contactId }),
}

export const usersAPI = {
  list: (params) => api.get('/users', { params }),
  get: (id) => api.get(`/users/${id}`),
  create: (payload) => api.post('/users', payload),
  update: (id, payload) => api.put(`/users/${id}`, payload),
  delete: (id) => api.delete(`/users/${id}`),
}

export const organizationsAPI = {
  get: (params) => api.get('/organization', { params }),
  update: (payload) => api.put('/organization', payload),
  getMe: (params) => api.get('/organizations/me', { params }),
  patchMe: (payload) => api.patch('/organizations/me', payload),
}

export default api

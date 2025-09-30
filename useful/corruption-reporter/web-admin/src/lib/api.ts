import axios, { type AxiosResponse } from 'axios'
import { useAuthStore } from '@/stores/auth-store'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:9000/api'

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const refreshToken = useAuthStore.getState().refreshToken
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refresh_token: refreshToken,
          })

          const { access_token } = response.data
          useAuthStore.getState().updateToken(access_token)

          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${access_token}`
          return api(originalRequest)
        }
      } catch (refreshError) {
        // Refresh failed, logout user
        useAuthStore.getState().logout()
        window.location.href = '/login'
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

// Auth API
export const authApi = {
  login: (credentials: { email: string; password: string }) =>
    api.post('/auth/login', credentials),

  logout: (refreshToken?: string) =>
    api.post('/auth/logout', { refresh_token: refreshToken }),

  me: () => api.get('/auth/me'),

  changePassword: (data: { current_password: string; new_password: string }) =>
    api.post('/auth/change-password', data),
}

// Reports API
export const reportsApi = {
  getReports: (params?: any) => api.get('/reports', { params }),

  getReport: (id: number) => api.get(`/reports/${id}`),

  createReport: (data: any) => api.post('/reports', data),

  updateReportStatus: (id: number, data: { status: string; notes?: string }) =>
    api.put(`/reports/${id}/status`, data),

  assignReport: (id: number, investigatorId: number) =>
    api.put(`/reports/${id}/assign`, { investigator_id: investigatorId }),

  getReportComments: (id: number) => api.get(`/reports/${id}/comments`),

  addReportComment: (id: number, comment: string, isInternal = true) =>
    api.post(`/reports/${id}/comments`, { comment, is_internal: isInternal }),

  getReportHistory: (id: number) => api.get(`/reports/${id}/history`),

  exportReports: (format: 'csv' | 'pdf', params?: any) =>
    api.get(`/reports/export/${format}`, { params, responseType: 'blob' }),

  getPublicStories: (params?: any) => api.get('/trust/stories', { params }),
}

// Users API
export const usersApi = {
  getUsers: (params?: any) => api.get('/admin/users', { params }),

  getUser: (id: number) => api.get(`/admin/users/${id}`),

  createUser: (data: any) => api.post('/admin/users', data),

  updateUser: (id: number, data: any) => api.put(`/admin/users/${id}`, data),

  deleteUser: (id: number) => api.delete(`/admin/users/${id}`),
}

// Institutions API
export const institutionsApi = {
  getInstitutions: (params?: any) => api.get('/admin/institutions', { params }),

  getInstitution: (id: number) => api.get(`/admin/institutions/${id}`),

  createInstitution: (data: any) => api.post('/admin/institutions', data),

  updateInstitution: (id: number, data: any) => api.put(`/admin/institutions/${id}`, data),

  deleteInstitution: (id: number) => api.delete(`/admin/institutions/${id}`),

  getPublicInstitutions: () => api.get('/institutions/public'),
}

// Categories API
export const categoriesApi = {
  getCategories: () => api.get('/categories'),

  createCategory: (data: any) => api.post('/admin/categories', data),

  updateCategory: (id: number, data: any) => api.put(`/admin/categories/${id}`, data),

  deleteCategory: (id: number) => api.delete(`/admin/categories/${id}`),
}

// Analytics API
export const analyticsApi = {
  getDashboard: (params?: any) => api.get('/admin/analytics/dashboard', { params }),

  getReportAnalytics: (params?: any) => api.get('/admin/analytics/reports', { params }),

  getTrends: (params?: any) => api.get('/admin/analytics/trends', { params }),

  exportAnalytics: (params?: any) =>
    api.get('/admin/analytics/export', { params, responseType: 'blob' }),

  getPublicStats: () => api.get('/trust/stats'),
}

// Audit API
export const auditApi = {
  getAuditLogs: (params?: any) => api.get('/admin/audit-logs', { params }),
}

// Notifications API
export const notificationsApi = {
  getNotifications: (params?: any) => api.get('/notifications', { params }),

  markAsRead: (id: number) => api.put(`/notifications/${id}/read`),

  registerPushToken: (data: { token: string; device_id: string; platform: string }) =>
    api.post('/notifications/register-token', data),
}

// System API
export const systemApi = {
  getHealth: () => api.get('/health'),

  getSettings: () => api.get('/admin/settings'),

  updateSettings: (data: any) => api.put('/admin/settings', data),
}

export type ApiResponse<T = any> = AxiosResponse<{
  data?: T
  message?: string
  error?: string
  meta?: {
    current_page: number
    total_pages: number
    total_count: number
    per_page: number
  }
}>

export type PaginatedResponse<T = any> = {
  data: T[]
  meta: {
    current_page: number
    total_pages: number
    total_count: number
    per_page: number
  }
}
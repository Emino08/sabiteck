import axios, { AxiosResponse } from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token')
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
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// API Types
export interface ApiResponse<T = any> {
  success: boolean
  data: T
  error?: {
    message: string
    status: number
  }
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  per_page: number
  total_pages: number
  has_next: boolean
  has_prev: boolean
}

export interface User {
  id: number
  name: string
  email: string
  role: 'super_admin' | 'institution_admin' | 'staff' | 'readonly'
  institution_id?: number
  institution_name?: string
  permissions: string[]
  mfa_enabled: boolean
}

export interface Institution {
  id: number
  name: string
  accreditation_id?: string
  domain_email?: string
  contact_name?: string
  contact_email?: string
  address?: string
  logo_path?: string
  is_verified: boolean
  is_active: boolean
  created_at: string
}

export interface Credential {
  id: number
  institution_id: number
  student_name: string
  student_id?: string
  program_name?: string
  program_type?: 'certificate' | 'diploma' | 'degree' | 'postgraduate'
  award_grade?: string
  graduation_date?: string
  certificate_code: string
  verification_slug: string
  status: 'valid' | 'revoked' | 'pending' | 'draft'
  record_type: 'certificate' | 'transcript' | 'dissertation' | 'project'
  public_summary?: string
  created_at: string
  updated_at?: string
  institution_name?: string
}

export interface VerificationResult {
  certificate_code: string
  verification_slug: string
  student_name: string
  program_name?: string
  program_type?: string
  award_grade?: string
  graduation_date?: string
  record_type: string
  public_summary?: string
  institution: {
    name: string
    logo?: string
    verified: boolean
    domain?: string
  }
  status: string
  issued_date: string
  qr_code_url: string
  verification_url: string
  trust_score: number
}

export interface AuditLog {
  id: number
  action: string
  entity_type: string
  timestamp: string
  actor_name?: string
  metadata?: Record<string, any>
}

// Auth API
export const authApi = {
  login: (email: string, password: string, mfaCode?: string) =>
    api.post<ApiResponse<{ token: string; user: User }>>('/auth/login', {
      email,
      password,
      mfa_code: mfaCode,
    }),

  logout: () => api.post<ApiResponse>('/auth/logout'),

  refresh: () => api.post<ApiResponse<{ token: string }>>('/auth/refresh'),

  forgotPassword: (email: string) =>
    api.post<ApiResponse>('/auth/forgot-password', { email }),

  resetPassword: (token: string, password: string) =>
    api.post<ApiResponse>('/auth/reset-password', { token, password }),

  enableMFA: (code: string) =>
    api.post<ApiResponse<{ backup_codes: string[] }>>('/auth/enable-mfa', { code }),

  disableMFA: (password: string) =>
    api.post<ApiResponse>('/auth/disable-mfa', { password }),
}

// Verification API
export const verificationApi = {
  verify: (code: string) =>
    api.get<ApiResponse<VerificationResult>>(`/verify/${code}`),

  requestDetailed: (data: {
    code: string
    email: string
    name?: string
    organization?: string
    reason: string
  }) => api.post<ApiResponse>('/verify/request', data),

  getDetailed: (token: string) =>
    api.get<ApiResponse<VerificationResult>>(`/verify/detailed/${token}`),

  getStats: () => api.get<ApiResponse>('/verify/stats'),
}

// Institution API
export const institutionApi = {
  list: (page = 1, search?: string) =>
    api.get<ApiResponse<PaginatedResponse<Institution>>>('/institutions', {
      params: { page, search },
    }),

  get: (id: number) => api.get<ApiResponse<Institution>>(`/institutions/${id}`),

  create: (data: Partial<Institution>) =>
    api.post<ApiResponse<Institution>>('/institutions', data),

  update: (id: number, data: Partial<Institution>) =>
    api.put<ApiResponse<Institution>>(`/institutions/${id}`, data),

  delete: (id: number) => api.delete<ApiResponse>(`/institutions/${id}`),

  verify: (id: number) => api.post<ApiResponse>(`/institutions/${id}/verify`),
}

// Credential API
export const credentialApi = {
  list: (page = 1, filters?: Record<string, any>) =>
    api.get<ApiResponse<PaginatedResponse<Credential>>>('/credentials', {
      params: { page, ...filters },
    }),

  get: (id: number) => api.get<ApiResponse<Credential>>(`/credentials/${id}`),

  create: (data: Partial<Credential>) =>
    api.post<ApiResponse<Credential>>('/credentials', data),

  update: (id: number, data: Partial<Credential>) =>
    api.put<ApiResponse<Credential>>(`/credentials/${id}`, data),

  delete: (id: number) => api.delete<ApiResponse>(`/credentials/${id}`),

  approve: (id: number) => api.post<ApiResponse>(`/credentials/${id}/approve`),

  revoke: (id: number, reason: string) =>
    api.post<ApiResponse>(`/credentials/${id}/revoke`, { reason }),

  bulkImport: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post<ApiResponse>('/credentials/bulk-import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  export: (filters?: Record<string, any>) =>
    api.get('/credentials/export', {
      params: filters,
      responseType: 'blob',
    }),
}

// User API
export const userApi = {
  list: (page = 1, filters?: Record<string, any>) =>
    api.get<ApiResponse<PaginatedResponse<User>>>('/users', {
      params: { page, ...filters },
    }),

  get: (id: number) => api.get<ApiResponse<User>>(`/users/${id}`),

  create: (data: Partial<User>) => api.post<ApiResponse<User>>('/users', data),

  update: (id: number, data: Partial<User>) =>
    api.put<ApiResponse<User>>(`/users/${id}`, data),

  delete: (id: number) => api.delete<ApiResponse>(`/users/${id}`),

  invite: (data: { email: string; role: string; institution_id?: number }) =>
    api.post<ApiResponse>('/users/invite', data),

  resetPassword: (id: number) =>
    api.post<ApiResponse>(`/users/${id}/reset-password`),
}

// Audit API
export const auditApi = {
  getLogs: (page = 1, filters?: Record<string, any>) =>
    api.get<ApiResponse<PaginatedResponse<AuditLog>>>('/audit/logs', {
      params: { page, ...filters },
    }),

  getCredentialTrail: (id: number) =>
    api.get<ApiResponse<AuditLog[]>>(`/audit/credentials/${id}/trail`),

  getUserActivity: (id: number, days = 30) =>
    api.get<ApiResponse<AuditLog[]>>(`/audit/users/${id}/activity`, {
      params: { days },
    }),

  getInstitutionActivity: (id: number, days = 30) =>
    api.get<ApiResponse<AuditLog[]>>(`/audit/institutions/${id}/activity`, {
      params: { days },
    }),
}
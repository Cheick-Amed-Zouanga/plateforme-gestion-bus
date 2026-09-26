import axios, { AxiosInstance, AxiosError } from 'axios'
import { useAuthStore } from '@/stores/auth'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

class APIClient {
  private client: AxiosInstance
  private refreshing = false
  private failedQueue: Array<{
    onSuccess: (token: string) => void
    onFailure: (error: AxiosError) => void
  }> = []

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config

        if (error.response?.status === 401 && !originalRequest._retry) {
          if (this.refreshing) {
            return new Promise((resolve, reject) => {
              this.failedQueue.push({
                onSuccess: (token: string) => {
                  originalRequest.headers['Authorization'] = `Bearer ${token}`
                  resolve(this.client(originalRequest))
                },
                onFailure: (err) => reject(err),
              })
            })
          }

          originalRequest._retry = true
          this.refreshing = true

          try {
            const refreshToken = localStorage.getItem('refresh_token')
            if (!refreshToken) {
              throw new Error('No refresh token')
            }

            const response = await axios.post(
              `${API_URL}/auth/refresh/`,
              { refresh: refreshToken }
            )

            const { access } = response.data
            localStorage.setItem('access_token', access)

            originalRequest.headers['Authorization'] = `Bearer ${access}`
            this.failedQueue.forEach(({ onSuccess }) => onSuccess(access))
            this.failedQueue = []

            return this.client(originalRequest)
          } catch (err) {
            this.failedQueue.forEach(({ onFailure }) => onFailure(err as AxiosError))
            this.failedQueue = []

            // Logout user
            localStorage.removeItem('access_token')
            localStorage.removeItem('refresh_token')
            localStorage.removeItem('user')
            window.location.href = '/login'

            return Promise.reject(err)
          } finally {
            this.refreshing = false
          }
        }

        return Promise.reject(error)
      }
    )

    // Request interceptor
    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem('access_token')
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`
      }
      return config
    })
  }

  // Auth endpoints
  login(email: string, password: string) {
    return this.client.post('/auth/login/', { email, password })
  }

  logout() {
    return this.client.post('/auth/logout/')
  }

  refreshToken(refreshToken: string) {
    return this.client.post('/auth/refresh/', { refresh: refreshToken })
  }

  getCurrentUser() {
    return this.client.get('/auth/me/')
  }

  // Users endpoints
  getUsers(page = 1, search = '', filters = {}) {
    return this.client.get('/users/', {
      params: { page, search, ...filters },
    })
  }

  getUserById(id: string) {
    return this.client.get(`/users/${id}/`)
  }

  createUser(data: any) {
    return this.client.post('/users/', data)
  }

  updateUser(id: string, data: any) {
    return this.client.patch(`/users/${id}/`, data)
  }

  deleteUser(id: string) {
    return this.client.delete(`/users/${id}/`)
  }

  changePassword(id: string, password: string) {
    return this.client.post(`/users/${id}/change_password/`, { password })
  }

  // Roles endpoints
  getRoles(page = 1, search = '', filters = {}) {
    return this.client.get('/roles/', {
      params: { page, search, ...filters },
    })
  }

  getRoleById(id: string) {
    return this.client.get(`/roles/${id}/`)
  }

  createRole(data: any) {
    return this.client.post('/roles/', data)
  }

  updateRole(id: string, data: any) {
    return this.client.patch(`/roles/${id}/`, data)
  }

  deleteRole(id: string) {
    return this.client.delete(`/roles/${id}/`)
  }

  // Permissions endpoints
  getPermissions(filters = {}) {
    return this.client.get('/permissions/', { params: filters })
  }

  getPermissionsByResource(resource: string) {
    return this.client.get('/permissions/by_resource/', {
      params: { resource },
    })
  }

  // Gares endpoints
  getGares(page = 1, search = '', filters = {}) {
    return this.client.get('/gares/', {
      params: { page, search, ...filters },
    })
  }

  getGareById(id: string) {
    return this.client.get(`/gares/${id}/`)
  }

  createGare(data: any) {
    return this.client.post('/gares/', data)
  }

  updateGare(id: string, data: any) {
    return this.client.patch(`/gares/${id}/`, data)
  }

  deleteGare(id: string) {
    return this.client.delete(`/gares/${id}/`)
  }

  // Companies endpoints
  getCurrentCompany() {
    return this.client.get('/companies/me/')
  }

  getCompanyGares() {
    return this.client.get('/companies/me/gares/')
  }

  // Audit logs endpoints
  getAuditLogs(page = 1, filters = {}) {
    return this.client.get('/audit-logs/', {
      params: { page, ...filters },
    })
  }

  getAuditLogsByUser(userId: string) {
    return this.client.get('/audit-logs/by_user/', {
      params: { user_id: userId },
    })
  }

  getAuditLogsByAction(action: string) {
    return this.client.get('/audit-logs/by_action/', {
      params: { action },
    })
  }

  getAuditLogsByResource(resourceType: string) {
    return this.client.get('/audit-logs/by_resource/', {
      params: { resource_type: resourceType },
    })
  }
}

export const apiClient = new APIClient()

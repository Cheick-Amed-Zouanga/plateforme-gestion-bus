import { useState, useCallback, useEffect } from 'react'
import { apiClient } from '@/services/api'

interface User {
  id: string
  email: string
  username: string
  first_name: string
  last_name: string
  company: string
  company_name?: string
  permissions: string[]
  roles: any[]
  is_staff: boolean
}

interface Company {
  id: string
  name: string
  email: string
  slug: string
  subscription: string
}

interface AuthResponse {
  access: string
  refresh: string
  user: User
  company: Company
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [company, setCompany] = useState<Company | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Initialiser depuis le localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem('user')
    const storedCompany = localStorage.getItem('company')
    const token = localStorage.getItem('access_token')

    if (storedUser && storedCompany && token) {
      try {
        setUser(JSON.parse(storedUser))
        setCompany(JSON.parse(storedCompany))
        setIsAuthenticated(true)
      } catch (err) {
        console.error('Failed to parse stored auth data', err)
        localStorage.clear()
      }
    }
  }, [])

  // Login
  const login = useCallback(async (email: string, password: string) => {
    setLoading(true)
    setError(null)
    try {
      const response = await apiClient.login(email, password)
      const data = response.data as AuthResponse

      // Stocker les tokens et infos user
      localStorage.setItem('access_token', data.access)
      localStorage.setItem('refresh_token', data.refresh)
      localStorage.setItem('user', JSON.stringify(data.user))
      localStorage.setItem('company', JSON.stringify(data.company))

      setUser(data.user)
      setCompany(data.company)
      setIsAuthenticated(true)

      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to login'
      setError(message)
      setIsAuthenticated(false)
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  // Logout
  const logout = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      // Appeler le endpoint logout
      await apiClient.logout()
    } catch (err) {
      // Même si la requête échoue, on logout localement
      console.error('Logout error:', err)
    } finally {
      // Nettoyer le localStorage
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('user')
      localStorage.removeItem('company')

      setUser(null)
      setCompany(null)
      setIsAuthenticated(false)
      setLoading(false)
    }
  }, [])

  // Get current user
  const getCurrentUser = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await apiClient.getCurrentUser()
      const data = response.data

      const currentUser = data.user
      const currentCompany = data.company

      localStorage.setItem('user', JSON.stringify(currentUser))
      localStorage.setItem('company', JSON.stringify(currentCompany))

      setUser(currentUser)
      setCompany(currentCompany)
      setIsAuthenticated(true)

      return { user: currentUser, company: currentCompany, permissions: data.permissions }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch current user'
      setError(message)
      setIsAuthenticated(false)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  // Check permission
  const hasPermission = useCallback(
    (permission: string) => {
      if (!user) return false
      return user.permissions?.includes(permission) || false
    },
    [user]
  )

  // Check any permission
  const hasAnyPermission = useCallback(
    (permissions: string[]) => {
      if (!user) return false
      return permissions.some(p => user.permissions?.includes(p))
    },
    [user]
  )

  return {
    user,
    company,
    loading,
    error,
    isAuthenticated,
    login,
    logout,
    getCurrentUser,
    hasPermission,
    hasAnyPermission,
  }
}

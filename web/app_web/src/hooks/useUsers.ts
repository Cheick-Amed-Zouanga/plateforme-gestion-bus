import { useState, useCallback } from 'react'
import { apiClient } from '@/services/api'

interface User {
  id: string
  email: string
  username: string
  first_name: string
  last_name: string
  company: string
  company_name?: string
  gare?: string
  gare_name?: string
  roles: any[]
  is_active: boolean
  is_staff: boolean
  created_at: string
  updated_at: string
}

interface UsersResponse {
  count: number
  next: string | null
  previous: string | null
  results: User[]
}

export function useUsers() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState({
    count: 0,
    page: 1,
    pageSize: 20,
  })

  // Récupérer les users
  const fetchUsers = useCallback(
    async (page = 1, search = '', filters = {}) => {
      setLoading(true)
      setError(null)
      try {
        const response = await apiClient.getUsers(page, search, filters)
        const data = response.data as UsersResponse
        setUsers(data.results)
        setPagination({
          count: data.count,
          page,
          pageSize: data.results.length,
        })
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to fetch users'
        setError(message)
      } finally {
        setLoading(false)
      }
    },
    []
  )

  // Récupérer un user par ID
  const fetchUserById = useCallback(async (id: string) => {
    setLoading(true)
    setError(null)
    try {
      const response = await apiClient.getUserById(id)
      return response.data as User
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch user'
      setError(message)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  // Créer un user
  const createUser = useCallback(
    async (userData: Partial<User> & { password: string }) => {
      setLoading(true)
      setError(null)
      try {
        const response = await apiClient.createUser(userData)
        const newUser = response.data as User
        setUsers([...users, newUser])
        return newUser
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create user'
        setError(message)
        return null
      } finally {
        setLoading(false)
      }
    },
    [users]
  )

  // Mettre à jour un user
  const updateUser = useCallback(
    async (id: string, userData: Partial<User>) => {
      setLoading(true)
      setError(null)
      try {
        const response = await apiClient.updateUser(id, userData)
        const updatedUser = response.data as User
        setUsers(users.map(u => (u.id === id ? updatedUser : u)))
        return updatedUser
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update user'
        setError(message)
        return null
      } finally {
        setLoading(false)
      }
    },
    [users]
  )

  // Supprimer un user
  const deleteUser = useCallback(
    async (id: string) => {
      setLoading(true)
      setError(null)
      try {
        await apiClient.deleteUser(id)
        setUsers(users.filter(u => u.id !== id))
        return true
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to delete user'
        setError(message)
        return false
      } finally {
        setLoading(false)
      }
    },
    [users]
  )

  // Changer le password
  const changePassword = useCallback(async (id: string, password: string) => {
    setLoading(true)
    setError(null)
    try {
      await apiClient.changePassword(id, password)
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to change password'
      setError(message)
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    users,
    loading,
    error,
    pagination,
    fetchUsers,
    fetchUserById,
    createUser,
    updateUser,
    deleteUser,
    changePassword,
  }
}

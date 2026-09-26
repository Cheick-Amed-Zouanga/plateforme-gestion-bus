import { useState, useCallback } from 'react'
import { apiClient } from '@/services/api'

interface Permission {
  id: string
  name: string
  resource: string
  action: string
  description: string
}

interface Role {
  id: string
  name: string
  description: string
  company: string
  company_name?: string
  permissions: Permission[]
  is_active: boolean
  created_at: string
  updated_at: string
}

interface RolesResponse {
  count: number
  next: string | null
  previous: string | null
  results: Role[]
}

export function useRoles() {
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState({
    count: 0,
    page: 1,
    pageSize: 20,
  })

  // Récupérer les roles
  const fetchRoles = useCallback(
    async (page = 1, search = '', filters = {}) => {
      setLoading(true)
      setError(null)
      try {
        const response = await apiClient.getRoles(page, search, filters)
        const data = response.data as RolesResponse
        setRoles(data.results)
        setPagination({
          count: data.count,
          page,
          pageSize: data.results.length,
        })
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to fetch roles'
        setError(message)
      } finally {
        setLoading(false)
      }
    },
    []
  )

  // Récupérer un role par ID
  const fetchRoleById = useCallback(async (id: string) => {
    setLoading(true)
    setError(null)
    try {
      const response = await apiClient.getRoleById(id)
      return response.data as Role
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch role'
      setError(message)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  // Créer un role
  const createRole = useCallback(
    async (roleData: Partial<Role>) => {
      setLoading(true)
      setError(null)
      try {
        const response = await apiClient.createRole(roleData)
        const newRole = response.data as Role
        setRoles([...roles, newRole])
        return newRole
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create role'
        setError(message)
        return null
      } finally {
        setLoading(false)
      }
    },
    [roles]
  )

  // Mettre à jour un role (incluant permissions)
  const updateRole = useCallback(
    async (id: string, roleData: Partial<Role>) => {
      setLoading(true)
      setError(null)
      try {
        const response = await apiClient.updateRole(id, roleData)
        const updatedRole = response.data as Role
        setRoles(roles.map(r => (r.id === id ? updatedRole : r)))
        return updatedRole
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update role'
        setError(message)
        return null
      } finally {
        setLoading(false)
      }
    },
    [roles]
  )

  // Supprimer un role
  const deleteRole = useCallback(
    async (id: string) => {
      setLoading(true)
      setError(null)
      try {
        await apiClient.deleteRole(id)
        setRoles(roles.filter(r => r.id !== id))
        return true
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to delete role'
        setError(message)
        return false
      } finally {
        setLoading(false)
      }
    },
    [roles]
  )

  return {
    roles,
    loading,
    error,
    pagination,
    fetchRoles,
    fetchRoleById,
    createRole,
    updateRole,
    deleteRole,
  }
}

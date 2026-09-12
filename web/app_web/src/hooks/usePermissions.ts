import { useState, useCallback } from 'react'
import { apiClient } from '@/services/api'

interface Permission {
  id: string
  name: string
  resource: string
  action: string
  description: string
  created_at: string
}

interface PermissionsResponse {
  count: number
  next: string | null
  previous: string | null
  results: Permission[]
}

export function usePermissions() {
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [groupedPermissions, setGroupedPermissions] = useState<
    Record<string, Permission[]>
  >({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Récupérer toutes les permissions
  const fetchPermissions = useCallback(async (filters = {}) => {
    setLoading(true)
    setError(null)
    try {
      const response = await apiClient.getPermissions(filters)
      const data = response.data as PermissionsResponse
      setPermissions(data.results)
      return data.results
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch permissions'
      setError(message)
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  // Récupérer les permissions groupées par ressource
  const fetchPermissionsByResource = useCallback(
    async (resource: string) => {
      setLoading(true)
      setError(null)
      try {
        const response = await apiClient.getPermissionsByResource(resource)
        const data = response.data as Record<string, Permission[]>
        setGroupedPermissions(data)
        return data
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to fetch permissions'
        setError(message)
        return {}
      } finally {
        setLoading(false)
      }
    },
    []
  )

  // Récupérer toutes les permissions groupées
  const fetchAllGroupedPermissions = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await apiClient.getPermissions({})
      const data = response.data as PermissionsResponse
      const perms = data.results

      // Grouper par ressource
      const grouped = perms.reduce(
        (acc, perm) => {
          if (!acc[perm.resource]) {
            acc[perm.resource] = []
          }
          acc[perm.resource].push(perm)
          return acc
        },
        {} as Record<string, Permission[]>
      )

      setGroupedPermissions(grouped)
      setPermissions(perms)
      return grouped
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch permissions'
      setError(message)
      return {}
    } finally {
      setLoading(false)
    }
  }, [])

  // Obtenir les ressources uniques
  const getResources = useCallback(() => {
    return Array.from(new Set(permissions.map(p => p.resource)))
  }, [permissions])

  return {
    permissions,
    groupedPermissions,
    loading,
    error,
    fetchPermissions,
    fetchPermissionsByResource,
    fetchAllGroupedPermissions,
    getResources,
  }
}

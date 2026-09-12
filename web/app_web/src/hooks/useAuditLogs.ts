import { useState, useCallback } from 'react'
import { apiClient } from '@/services/api'

interface AuditLog {
  id: string
  action: 'create' | 'update' | 'delete' | 'login' | 'logout' | 'permission_change' | 'role_change'
  resource_type: string
  resource_id: string
  resource_name: string
  user: string
  user_email?: string
  company: string
  company_name?: string
  old_values?: Record<string, any>
  new_values?: Record<string, any>
  description?: string
  ip_address?: string
  created_at: string
}

interface AuditLogsResponse {
  count: number
  next: string | null
  previous: string | null
  results: AuditLog[]
}

export function useAuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState({
    count: 0,
    page: 1,
    pageSize: 20,
  })

  // Récupérer les audit logs
  const fetchLogs = useCallback(
    async (page = 1, filters = {}) => {
      setLoading(true)
      setError(null)
      try {
        const response = await apiClient.getAuditLogs(page, filters)
        const data = response.data as AuditLogsResponse
        setLogs(data.results)
        setPagination({
          count: data.count,
          page,
          pageSize: data.results.length,
        })
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to fetch logs'
        setError(message)
      } finally {
        setLoading(false)
      }
    },
    []
  )

  // Récupérer les logs par utilisateur
  const fetchLogsByUser = useCallback(async (userId: string) => {
    setLoading(true)
    setError(null)
    try {
      const response = await apiClient.getAuditLogsByUser(userId)
      const data = response.data as AuditLog[]
      setLogs(data)
      return data
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch logs'
      setError(message)
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  // Récupérer les logs par action
  const fetchLogsByAction = useCallback(async (action: string) => {
    setLoading(true)
    setError(null)
    try {
      const response = await apiClient.getAuditLogsByAction(action)
      const data = response.data as AuditLog[]
      setLogs(data)
      return data
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch logs'
      setError(message)
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  // Récupérer les logs par ressource
  const fetchLogsByResource = useCallback(async (resourceType: string) => {
    setLoading(true)
    setError(null)
    try {
      const response = await apiClient.getAuditLogsByResource(resourceType)
      const data = response.data as AuditLog[]
      setLogs(data)
      return data
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch logs'
      setError(message)
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    logs,
    loading,
    error,
    pagination,
    fetchLogs,
    fetchLogsByUser,
    fetchLogsByAction,
    fetchLogsByResource,
  }
}

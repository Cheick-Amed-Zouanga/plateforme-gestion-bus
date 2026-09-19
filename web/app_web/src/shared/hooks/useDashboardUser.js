import { useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

/**
 * Infos utilisateur courant (IAM) + permissions + déconnexion.
 */
export function useDashboardUser() {
  const navigate = useNavigate()

  const { user, isSuperAdmin, permissions } = useMemo(() => {
    let user = {}
    let isSuperAdmin = false
    let permissions = []
    try {
      user = JSON.parse(localStorage.getItem('user') || '{}')
      isSuperAdmin = JSON.parse(localStorage.getItem('is_super_admin') || 'false')
      const stored = JSON.parse(localStorage.getItem('permissions') || 'null')
      if (Array.isArray(stored) && stored.length) {
        permissions = stored
      } else if (Array.isArray(user.permissions)) {
        permissions = user.permissions.map(p => (typeof p === 'string' ? p : p?.name)).filter(Boolean)
      }
    } catch {
      // localStorage corrompu
    }
    return { user, isSuperAdmin, permissions }
  }, [])

  const hasPermission = useCallback((name) => {
    if (isSuperAdmin) return true
    return permissions.includes(name)
  }, [isSuperAdmin, permissions])

  const hasAnyPermission = useCallback((...names) => {
    if (isSuperAdmin) return true
    return names.some(n => permissions.includes(n))
  }, [isSuperAdmin, permissions])

  const handleLogout = useCallback(() => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user')
    localStorage.removeItem('username')
    localStorage.removeItem('company')
    localStorage.removeItem('is_super_admin')
    localStorage.removeItem('permissions')
    navigate('/login', { replace: true })
  }, [navigate])

  return {
    user,
    isSuperAdmin,
    permissions,
    hasPermission,
    hasAnyPermission,
    userRole: isSuperAdmin ? 'super_admin' : 'admin',
    userEmail: user.email || 'admin@company.com',
    handleLogout,
  }
}

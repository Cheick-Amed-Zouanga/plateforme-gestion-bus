import { useNavigate } from 'react-router-dom'

/**
 * Infos utilisateur courant (nouveau système IAM) + déconnexion,
 * partagées par toutes les pages du dashboard Super Admin / compagnie.
 */
export function useDashboardUser() {
  const navigate = useNavigate()

  let user = {}
  let isSuperAdmin = false
  try {
    user = JSON.parse(localStorage.getItem('user') || '{}')
    isSuperAdmin = JSON.parse(localStorage.getItem('is_super_admin') || 'false')
  } catch {
    // localStorage corrompu, valeurs par défaut
  }

  const handleLogout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user')
    localStorage.removeItem('username')
    localStorage.removeItem('company')
    localStorage.removeItem('is_super_admin')
    navigate('/login', { replace: true })
  }

  return {
    user,
    isSuperAdmin,
    userRole: isSuperAdmin ? 'super_admin' : 'admin',
    userEmail: user.email || 'admin@company.com',
    handleLogout,
  }
}

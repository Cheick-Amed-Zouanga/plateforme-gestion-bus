import { useNavigate } from "react-router-dom"
import { Dashboard } from "@/features/admin/pages/Dashboard"

export default function DashboardHome() {
  const navigate = useNavigate()

  let user = {}
  let isSuperAdmin = false
  try {
    user = JSON.parse(localStorage.getItem("user") || "{}")
    isSuperAdmin = JSON.parse(localStorage.getItem("is_super_admin") || "false")
  } catch {
    // localStorage corrompu, on garde les valeurs par défaut
  }

  const handleLogout = () => {
    localStorage.removeItem("access_token")
    localStorage.removeItem("refresh_token")
    localStorage.removeItem("user")
    localStorage.removeItem("username")
    localStorage.removeItem("company")
    localStorage.removeItem("is_super_admin")
    localStorage.removeItem("permissions")
    navigate("/login", { replace: true })
  }

  return (
    <Dashboard
      userRole={isSuperAdmin ? "super_admin" : "admin"}
      userEmail={user.email || "admin@company.com"}
      onLogout={handleLogout}
    />
  )
}

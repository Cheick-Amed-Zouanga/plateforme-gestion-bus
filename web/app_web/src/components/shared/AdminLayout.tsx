import React, { useState } from 'react'
import { Sidebar } from './Sidebar'
import type { SidebarProps } from './Sidebar'
import { TopBar } from './TopBar'
import type { TopBarProps } from './TopBar'
import { useDashboardUser } from '@/shared/hooks/useDashboardUser'

export interface AdminLayoutProps extends SidebarProps, Omit<TopBarProps, 'onToggleSidebar'> {
  children?: React.ReactNode
}

export function AdminLayout({
  children,
  userRole: userRoleProp,
  userPermissions: userPermissionsProp,
  onLogout: onLogoutProp,
  userEmail: userEmailProp,
  selectedGare,
  gares,
  onGareChange,
  notifications,
}: AdminLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const dash = useDashboardUser()

  const userRole = userRoleProp ?? dash.userRole
  const userPermissions = userPermissionsProp ?? dash.permissions
  const onLogout = onLogoutProp ?? dash.handleLogout
  const userEmail = userEmailProp ?? dash.userEmail
  const userLabel =
    userRole === 'super_admin'
      ? 'Super Admin'
      : (() => {
          try {
            const u = JSON.parse(localStorage.getItem('user') || '{}')
            const roleName = u?.roles?.[0]?.name
            if (roleName) return roleName
          } catch { /* ignore */ }
          return 'Manager'
        })()

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar
        userRole={userRole}
        userPermissions={userPermissions}
        onLogout={onLogout}
        isCollapsed={sidebarCollapsed}
      />

      <TopBar
        userEmail={userEmail}
        userLabel={userLabel}
        selectedGare={selectedGare}
        gares={gares}
        onGareChange={onGareChange}
        onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
        notifications={notifications}
        sidebarCollapsed={sidebarCollapsed}
      />

      <main
        className={`transition-all duration-300 ${
          sidebarCollapsed ? 'ml-20' : 'ml-64'
        } mt-16 p-6`}
      >
        {children}
      </main>
    </div>
  )
}

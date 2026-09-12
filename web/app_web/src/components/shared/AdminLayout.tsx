import React, { useState } from 'react'
import { Sidebar, SidebarProps } from './Sidebar'
import { TopBar, TopBarProps } from './TopBar'

export interface AdminLayoutProps extends SidebarProps, Omit<TopBarProps, 'onToggleSidebar'> {
  children?: React.ReactNode
}

export function AdminLayout({
  children,
  userRole,
  userPermissions,
  onLogout,
  userEmail,
  selectedGare,
  gares,
  onGareChange,
  notifications,
}: AdminLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sidebar */}
      <Sidebar
        userRole={userRole}
        userPermissions={userPermissions}
        onLogout={onLogout}
        isCollapsed={sidebarCollapsed}
      />

      {/* TopBar */}
      <TopBar
        userEmail={userEmail}
        selectedGare={selectedGare}
        gares={gares}
        onGareChange={onGareChange}
        onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
        notifications={notifications}
      />

      {/* Main Content */}
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

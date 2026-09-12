import React, { useMemo } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  LayoutDashboard,
  Users,
  DollarSign,
  Bus,
  Route,
  Settings,
  Shield,
  LogOut,
  FileText,
  Headphones,
  ChevronDown,
} from 'lucide-react'

export interface MenuItem {
  id: string
  label: string
  icon: React.ReactNode
  href: string
  badge?: string
  children?: MenuItem[]
}

export interface SidebarProps {
  userRole?: string
  userPermissions?: string[]
  onLogout?: () => void
  isCollapsed?: boolean
}

export function Sidebar({
  userRole = 'admin',
  userPermissions = [],
  onLogout,
  isCollapsed = false,
}: SidebarProps) {
  const location = useLocation()
  const [expandedItems, setExpandedItems] = React.useState<string[]>([])

  const menuItems: MenuItem[] = useMemo(() => {
    const allItems: MenuItem[] = [
      {
        id: 'dashboard',
        label: 'Dashboard',
        icon: <LayoutDashboard className="w-5 h-5" />,
        href: '/admin/dashboard',
      },
      {
        id: 'transport',
        label: 'Transport',
        icon: <Bus className="w-5 h-5" />,
        href: '#',
        children: [
          {
            id: 'bus',
            label: 'Bus',
            icon: <Bus className="w-4 h-4" />,
            href: '/admin/transport/bus',
          },
          {
            id: 'routes',
            label: 'Routes',
            icon: <Route className="w-4 h-4" />,
            href: '/admin/transport/routes',
          },
          {
            id: 'tickets',
            label: 'Billets',
            icon: <FileText className="w-4 h-4" />,
            href: '/admin/transport/tickets',
          },
        ],
      },
      {
        id: 'rh',
        label: 'Ressources Humaines',
        icon: <Users className="w-5 h-5" />,
        href: '#',
        children: [
          {
            id: 'employees',
            label: 'Employés',
            icon: <Users className="w-4 h-4" />,
            href: '/admin/rh/employees',
          },
          {
            id: 'teams',
            label: 'Équipes',
            icon: <Users className="w-4 h-4" />,
            href: '/admin/rh/teams',
          },
        ],
      },
      {
        id: 'finances',
        label: 'Finances',
        icon: <DollarSign className="w-5 h-5" />,
        href: '#',
        children: [
          {
            id: 'payments',
            label: 'Paiements',
            icon: <DollarSign className="w-4 h-4" />,
            href: '/admin/finances/payments',
          },
          {
            id: 'reports',
            label: 'Rapports',
            icon: <FileText className="w-4 h-4" />,
            href: '/admin/finances/reports',
          },
        ],
      },
      {
        id: 'support',
        label: 'Support Client',
        icon: <Headphones className="w-5 h-5" />,
        href: '/admin/support/tickets',
      },
      {
        id: 'iam',
        label: 'Gestion IAM',
        icon: <Shield className="w-5 h-5" />,
        href: '#',
        children: [
          {
            id: 'users',
            label: 'Utilisateurs',
            icon: <Users className="w-4 h-4" />,
            href: '/admin/iam/users',
          },
          {
            id: 'roles',
            label: 'Rôles',
            icon: <Shield className="w-4 h-4" />,
            href: '/admin/iam/roles',
          },
          {
            id: 'permissions',
            label: 'Permissions',
            icon: <Shield className="w-4 h-4" />,
            href: '/admin/iam/permissions',
          },
          {
            id: 'audit-logs',
            label: 'Audit Log',
            icon: <FileText className="w-4 h-4" />,
            href: '/admin/iam/audit-logs',
          },
        ],
      },
      {
        id: 'settings',
        label: 'Paramètres',
        icon: <Settings className="w-5 h-5" />,
        href: '/admin/settings/company',
      },
    ]

    // Filtrer selon les permissions
    return allItems.filter(item => {
      // Si c'est un admin, afficher tout
      if (userRole === 'admin' || userRole === 'super_admin') return true

      // Filtrer basé sur les permissions
      // TODO: Implémenter la logique de filtrage basée sur permissions
      return true
    })
  }, [userRole, userPermissions])

  const toggleExpanded = (id: string) => {
    setExpandedItems(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    )
  }

  const renderMenuItem = (item: MenuItem, depth: number = 0) => {
    const isActive = location.pathname === item.href || location.pathname.startsWith(item.href + '/')
    const isExpanded = expandedItems.includes(item.id)
    const hasChildren = item.children && item.children.length > 0

    return (
      <React.Fragment key={item.id}>
        <div
          className={cn(
            'flex items-center gap-2 px-4 py-2 mb-1 rounded-lg transition-colors',
            depth > 0 && 'ml-4',
            isActive ? 'bg-slate-100 text-slate-900' : 'text-slate-700 hover:bg-slate-50'
          )}
        >
          {hasChildren ? (
            <button
              onClick={() => toggleExpanded(item.id)}
              className="flex items-center gap-2 flex-1 text-left"
            >
              {item.icon}
              {!isCollapsed && <span className="flex-1">{item.label}</span>}
              {!isCollapsed && (
                <ChevronDown
                  className={cn(
                    'w-4 h-4 transition-transform',
                    isExpanded && 'rotate-180'
                  )}
                />
              )}
            </button>
          ) : (
            <Link
              to={item.href}
              className="flex items-center gap-2 flex-1 text-left"
            >
              {item.icon}
              {!isCollapsed && <span className="flex-1">{item.label}</span>}
              {item.badge && !isCollapsed && (
                <span className="bg-slate-200 text-slate-900 text-xs px-2 py-1 rounded">
                  {item.badge}
                </span>
              )}
            </Link>
          )}
        </div>

        {hasChildren && isExpanded && !isCollapsed && (
          <div className="space-y-1">
            {item.children?.map(child => renderMenuItem(child, depth + 1))}
          </div>
        )}
      </React.Fragment>
    )
  }

  return (
    <div
      className={cn(
        'fixed left-0 top-0 h-screen bg-white border-r border-slate-200 flex flex-col transition-all duration-300',
        isCollapsed ? 'w-20' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="p-6 border-b border-slate-200">
        {isCollapsed ? (
          <div className="w-8 h-8 bg-slate-900 rounded text-white flex items-center justify-center font-bold">
            BM
          </div>
        ) : (
          <h1 className="text-xl font-bold text-slate-900">Bus Manager</h1>
        )}
      </div>

      {/* Menu Items */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {menuItems.map(item => renderMenuItem(item))}
      </nav>

      {/* Bottom Actions */}
      <div className="p-4 border-t border-slate-200 space-y-2">
        {onLogout && (
          <Button
            variant="ghost"
            className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={onLogout}
          >
            <LogOut className="w-5 h-5" />
            {!isCollapsed && <span className="ml-2">Déconnexion</span>}
          </Button>
        )}
      </div>
    </div>
  )
}

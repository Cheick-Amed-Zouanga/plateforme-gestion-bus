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
  MapPin,
  Tag,
} from 'lucide-react'

export interface MenuItem {
  id: string
  label: string
  icon: React.ReactNode
  href: string
  badge?: string
  /** Au moins une de ces permissions IAM est requise (Super Admin = tout). */
  perms?: string[]
  children?: MenuItem[]
}

export interface SidebarProps {
  userRole?: string
  userPermissions?: string[]
  onLogout?: () => void
  isCollapsed?: boolean
}

function canSee(item: MenuItem, isSuperAdmin: boolean, permissions: string[]): boolean {
  if (isSuperAdmin) return true
  if (!item.perms || item.perms.length === 0) return true
  return item.perms.some(p => permissions.includes(p))
}

function filterMenu(items: MenuItem[], isSuperAdmin: boolean, permissions: string[]): MenuItem[] {
  return items
    .map(item => {
      if (item.children?.length) {
        const children = filterMenu(item.children, isSuperAdmin, permissions)
        if (children.length === 0) return null
        return { ...item, children }
      }
      return canSee(item, isSuperAdmin, permissions) ? item : null
    })
    .filter(Boolean) as MenuItem[]
}

export function Sidebar({
  userRole = 'admin',
  userPermissions = [],
  onLogout,
  isCollapsed = false,
}: SidebarProps) {
  const location = useLocation()
  const [expandedItems, setExpandedItems] = React.useState<string[]>([
    'transport',
    'rh',
    'finances',
    'iam',
    'settings',
  ])
  const isSuperAdmin = userRole === 'super_admin'

  // Ouvre automatiquement la section du menu correspondant à l'URL
  React.useEffect(() => {
    const path = location.pathname
    const open: string[] = []
    if (path.startsWith('/dashboard/transport')) open.push('transport')
    if (path.startsWith('/dashboard/rh')) open.push('rh')
    if (path.startsWith('/dashboard/finances')) open.push('finances')
    if (path.startsWith('/dashboard/iam')) open.push('iam')
    if (path.startsWith('/dashboard/settings')) open.push('settings')
    if (open.length) {
      setExpandedItems(prev => Array.from(new Set([...prev, ...open])))
    }
  }, [location.pathname])

  const menuItems: MenuItem[] = useMemo(() => {
    const allItems: MenuItem[] = [
      {
        id: 'dashboard',
        label: 'Dashboard',
        icon: <LayoutDashboard className="w-5 h-5 text-indigo-600" />,
        href: '/dashboard',
        perms: ['dashboard.read'],
      },
      {
        id: 'transport',
        label: 'Transport',
        icon: <Bus className="w-5 h-5 text-blue-600" />,
        href: '#',
        children: [
          {
            id: 'bus',
            label: 'Bus',
            icon: <Bus className="w-4 h-4" />,
            href: '/dashboard/transport/bus',
            perms: ['bus.read'],
          },
          {
            id: 'lignes',
            label: 'Lignes',
            icon: <Route className="w-4 h-4" />,
            href: '/dashboard/transport/lignes',
            perms: ['ligne.read'],
          },
          {
            id: 'trajets',
            label: 'Horaires / Trajets',
            icon: <MapPin className="w-4 h-4" />,
            href: '/dashboard/transport/trajets',
            perms: ['trajet.read'],
          },
          {
            id: 'tarifs',
            label: 'Tarifs',
            icon: <Tag className="w-4 h-4" />,
            href: '/dashboard/transport/tarifs',
            perms: ['tarif.read'],
          },
          {
            id: 'tickets',
            label: 'Billets',
            icon: <FileText className="w-4 h-4" />,
            href: '/dashboard/transport/tickets',
            perms: ['billet.read'],
          },
        ],
      },
      {
        id: 'rh',
        label: 'Ressources Humaines',
        icon: <Users className="w-5 h-5 text-emerald-600" />,
        href: '#',
        children: [
          {
            id: 'employees',
            label: 'Employés',
            icon: <Users className="w-4 h-4" />,
            href: '/dashboard/rh/employees',
            perms: ['employe.read'],
          },
          {
            id: 'teams',
            label: 'Équipes',
            icon: <Users className="w-4 h-4" />,
            href: '/dashboard/rh/teams',
            perms: ['employe.read'],
          },
        ],
      },
      {
        id: 'finances',
        label: 'Finances',
        icon: <DollarSign className="w-5 h-5 text-amber-600" />,
        href: '#',
        children: [
          {
            id: 'payments',
            label: 'Paiements',
            icon: <DollarSign className="w-4 h-4" />,
            href: '/dashboard/finances/payments',
            perms: ['paiement.read'],
          },
          {
            id: 'reports',
            label: 'Rapports',
            icon: <FileText className="w-4 h-4" />,
            href: '/dashboard/finances/reports',
            perms: ['rapport.read', 'paiement.read'],
          },
        ],
      },
          {
            id: 'support',
            label: 'Support Client',
            icon: <Headphones className="w-5 h-5 text-pink-600" />,
            href: '/dashboard/support/tickets',
            perms: ['sav.read'],
          },
      {
        id: 'iam',
        label: 'Gestion IAM',
        icon: <Shield className="w-5 h-5 text-purple-600" />,
        href: '#',
        children: [
          {
            id: 'users',
            label: 'Utilisateurs',
            icon: <Users className="w-4 h-4" />,
            href: '/dashboard/iam/users',
            perms: ['iam.read'],
          },
          {
            id: 'roles',
            label: 'Rôles',
            icon: <Shield className="w-4 h-4" />,
            href: '/dashboard/iam/roles',
            perms: ['role.read'],
          },
          {
            id: 'permissions',
            label: 'Permissions',
            icon: <Shield className="w-4 h-4" />,
            href: '/dashboard/iam/permissions',
            perms: ['role.read'],
          },
          {
            id: 'audit-logs',
            label: 'Audit Log',
            icon: <FileText className="w-4 h-4" />,
            href: '/dashboard/iam/audit-logs',
            perms: ['audit.read', 'iam.read'],
          },
        ],
      },
      {
        id: 'settings',
        label: 'Paramètres',
        icon: <Settings className="w-5 h-5 text-gray-500" />,
        href: '#',
        children: [
          {
            id: 'company',
            label: 'Compagnies',
            icon: <Settings className="w-4 h-4" />,
            href: '/dashboard/settings/company',
            perms: ['company.create', 'company.read'],
          },
          {
            id: 'gares',
            label: 'Gares',
            icon: <MapPin className="w-4 h-4" />,
            href: '/dashboard/settings/gares',
            perms: ['gare.read'],
          },
        ],
      },
    ]

    return filterMenu(allItems, isSuperAdmin, userPermissions)
  }, [isSuperAdmin, userPermissions])

  const toggleExpanded = (id: string) => {
    setExpandedItems(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    )
  }

  const renderMenuItem = (item: MenuItem, depth: number = 0) => {
    const isActive =
      item.href !== '#' &&
      (item.href === '/dashboard'
        ? location.pathname === '/dashboard'
        : location.pathname === item.href || location.pathname.startsWith(item.href + '/'))
    const isExpanded = expandedItems.includes(item.id)
    const hasChildren = item.children && item.children.length > 0
    const childActive = item.children?.some(
      c => location.pathname === c.href || location.pathname.startsWith(c.href + '/')
    )

    return (
      <React.Fragment key={item.id}>
        <div
          className={cn(
            'flex items-center gap-2 px-4 py-2 mb-1 rounded-lg transition-colors',
            depth > 0 && 'ml-4',
            isActive || childActive ? 'bg-slate-100 text-slate-900' : 'text-slate-700 hover:bg-slate-50'
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
      <div className="p-6 border-b border-slate-200">
        {isCollapsed ? (
          <div className="w-8 h-8 bg-slate-900 rounded text-white flex items-center justify-center font-bold">
            BM
          </div>
        ) : (
          <h1 className="text-xl font-bold text-slate-900">Bus Manager</h1>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {menuItems.map(item => renderMenuItem(item))}
      </nav>

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

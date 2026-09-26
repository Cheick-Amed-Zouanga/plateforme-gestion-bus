import React, { useState } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Bell,
  Settings,
  User,
  ChevronDown,
  Menu,
} from 'lucide-react'

export interface TopBarProps {
  userEmail?: string
  userLabel?: string
  selectedGare?: string
  gares?: Array<{ id: string; name: string; city: string }>
  onGareChange?: (gareId: string) => void
  onToggleSidebar?: () => void
  notifications?: number
  sidebarCollapsed?: boolean
}

export function TopBar({
  userEmail = 'user@company.com',
  userLabel = 'Utilisateur',
  selectedGare,
  gares = [],
  onGareChange,
  onToggleSidebar,
  notifications = 0,
  sidebarCollapsed = false,
}: TopBarProps) {
  const [showGareMenu, setShowGareMenu] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)

  const currentGare = gares.find(g => g.id === selectedGare)

  return (
    <div
      className={cn(
        'fixed top-0 right-0 h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 z-40 transition-all duration-300',
        sidebarCollapsed ? 'left-20' : 'left-64'
      )}
    >
      {/* Left: Menu Toggle + Gare Selector */}
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 hover:bg-slate-100 rounded-lg"
        >
          <Menu className="w-5 h-5" />
        </button>

        {gares.length > 0 && (
          <div className="relative">
            <button
              onClick={() => setShowGareMenu(!showGareMenu)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
            >
              <div className="flex-1 text-left">
                <div className="text-sm font-medium text-slate-900">
                  {currentGare?.name || 'Sélectionner une gare'}
                </div>
                {currentGare && (
                  <div className="text-xs text-slate-500">{currentGare.city}</div>
                )}
              </div>
              <ChevronDown className="w-4 h-4 text-slate-500" />
            </button>

            {showGareMenu && (
              <div className="absolute top-full left-0 mt-2 w-56 bg-white border border-slate-200 rounded-lg shadow-lg z-50">
                <div className="p-2 space-y-1">
                  {gares.map(gare => (
                    <button
                      key={gare.id}
                      onClick={() => {
                        onGareChange?.(gare.id)
                        setShowGareMenu(false)
                      }}
                      className={cn(
                        'w-full text-left px-3 py-2 rounded-lg transition-colors',
                        selectedGare === gare.id
                          ? 'bg-slate-900 text-white'
                          : 'hover:bg-slate-100'
                      )}
                    >
                      <div className="font-medium text-sm">{gare.name}</div>
                      <div className="text-xs text-slate-500">{gare.city}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-3">
        {/* Notifications */}
        <button className="relative p-2 hover:bg-slate-100 rounded-lg transition-colors">
          <Bell className="w-5 h-5 text-slate-700" />
          {notifications > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
              {notifications > 9 ? '9+' : notifications}
            </span>
          )}
        </button>

        {/* Settings */}
        <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
          <Settings className="w-5 h-5 text-slate-700" />
        </button>

        {/* User Menu */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <div className="w-8 h-8 bg-slate-900 text-white rounded-full flex items-center justify-center text-sm font-semibold">
              {userEmail.charAt(0).toUpperCase()}
            </div>
              <div className="text-left hidden sm:block">
              <div className="text-sm font-medium text-slate-900">
                {userEmail.split('@')[0]}
              </div>
              <div className="text-xs text-slate-500">{userLabel}</div>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-500" />
          </button>

          {showUserMenu && (
            <div className="absolute top-full right-0 mt-2 w-48 bg-white border border-slate-200 rounded-lg shadow-lg z-50">
              <div className="p-4 border-b border-slate-200">
                <div className="text-sm font-medium text-slate-900">{userEmail}</div>
                <div className="text-xs text-slate-500">{userLabel}</div>
              </div>
              <div className="p-2 space-y-1">
                <button className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors text-sm text-slate-700">
                  <User className="w-4 h-4" />
                  Mon profil
                </button>
                <button className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors text-sm text-slate-700">
                  <Settings className="w-4 h-4" />
                  Préférences
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

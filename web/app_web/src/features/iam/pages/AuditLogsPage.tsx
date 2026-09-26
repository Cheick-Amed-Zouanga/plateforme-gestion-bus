import React, { useEffect, useState } from 'react'
import { AdminLayout } from '@/components/shared/AdminLayout'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAuditLogs } from '@/hooks/useAuditLogs'
import { useAuth } from '@/hooks/useAuth'
import { Calendar, LogOut, User } from 'lucide-react'

export function AuditLogsPage() {
  const { logs, loading, pagination, fetchLogs } = useAuditLogs()
  const { user: currentUser } = useAuth()
  const [filters, setFilters] = useState({
    action: '',
    resource_type: '',
    today: false,
    last_7_days: false,
  })
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    fetchLogs(currentPage, filters)
  }, [filters, currentPage])

  const getActionBadgeVariant = (action: string) => {
    switch (action) {
      case 'create':
        return 'success'
      case 'update':
      case 'permission_change':
      case 'role_change':
        return 'warning'
      case 'delete':
        return 'destructive'
      case 'login':
        return 'info'
      default:
        return 'default'
    }
  }

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      create: 'Créé',
      update: 'Modifié',
      delete: 'Supprimé',
      login: 'Connexion',
      logout: 'Déconnexion',
      permission_change: 'Permission modifiée',
      role_change: 'Rôle modifié',
    }
    return labels[action] || action
  }

  const getActionIcon = (action: string) => {
    if (action === 'login') return '✓'
    if (action === 'logout') return '✗'
    if (action === 'delete') return '🗑️'
    if (action === 'create') return '✚'
    return '●'
  }

  return (
    <AdminLayout userRole={currentUser?.roles?.[0]?.name || 'admin'} userEmail={currentUser?.email}>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Journal d'Audit</h1>
          <p className="text-slate-600 mt-2">
            Suivi complet de toutes les actions effectuées dans le système
          </p>
        </div>

        {/* Filters */}
        <Card className="p-6">
          <h3 className="font-semibold text-slate-900 mb-4">Filtres</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Action
              </label>
              <select
                value={filters.action}
                onChange={e => {
                  setFilters({ ...filters, action: e.target.value })
                  setCurrentPage(1)
                }}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-950"
              >
                <option value="">Toutes les actions</option>
                <option value="create">Créé</option>
                <option value="update">Modifié</option>
                <option value="delete">Supprimé</option>
                <option value="login">Connexion</option>
                <option value="logout">Déconnexion</option>
                <option value="permission_change">Permission modifiée</option>
                <option value="role_change">Rôle modifié</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Ressource
              </label>
              <select
                value={filters.resource_type}
                onChange={e => {
                  setFilters({ ...filters, resource_type: e.target.value })
                  setCurrentPage(1)
                }}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-950"
              >
                <option value="">Toutes les ressources</option>
                <option value="User">Utilisateur</option>
                <option value="Role">Rôle</option>
                <option value="Permission">Permission</option>
                <option value="Gare">Gare</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Période
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.today}
                    onChange={e => {
                      setFilters({
                        ...filters,
                        today: e.target.checked,
                        last_7_days: false,
                      })
                      setCurrentPage(1)
                    }}
                    className="w-4 h-4"
                  />
                  <span className="ml-2 text-sm text-slate-700">Aujourd'hui</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.last_7_days}
                    onChange={e => {
                      setFilters({
                        ...filters,
                        last_7_days: e.target.checked,
                        today: false,
                      })
                      setCurrentPage(1)
                    }}
                    className="w-4 h-4"
                  />
                  <span className="ml-2 text-sm text-slate-700">7 derniers jours</span>
                </label>
              </div>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => {
                  setFilters({ action: '', resource_type: '', today: false, last_7_days: false })
                  setCurrentPage(1)
                }}
                className="w-full px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-lg transition-colors text-sm font-medium"
              >
                Réinitialiser
              </button>
            </div>
          </div>
        </Card>

        {/* Logs Timeline */}
        <div>
          <h3 className="font-semibold text-slate-900 mb-4">Activité Récente</h3>

          {loading ? (
            <Card className="p-8 text-center">
              <div className="text-slate-500">Chargement...</div>
            </Card>
          ) : logs.length === 0 ? (
            <Card className="p-8 text-center">
              <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">Aucun journal d'audit trouvé</p>
            </Card>
          ) : (
            <div className="space-y-4">
              {logs.map((log, idx) => (
                <Card
                  key={log.id}
                  className="p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex gap-4">
                    {/* Timeline dot */}
                    <div className="flex flex-col items-center">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-600">
                        {getActionIcon(log.action)}
                      </div>
                      {idx < logs.length - 1 && (
                        <div className="w-0.5 h-12 bg-slate-200 mt-2" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 pt-1">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-900">
                              {log.resource_name || log.resource_id}
                            </span>
                            <Badge variant={getActionBadgeVariant(log.action)}>
                              {getActionLabel(log.action)}
                            </Badge>
                            <Badge variant="outline">{log.resource_type}</Badge>
                          </div>
                          {log.description && (
                            <p className="text-sm text-slate-600 mt-1">
                              {log.description}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {log.user_email || log.user}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(log.created_at).toLocaleString('fr-FR')}
                        </span>
                        {log.ip_address && (
                          <span>IP: {log.ip_address}</span>
                        )}
                      </div>

                      {/* Details */}
                      {(log.old_values || log.new_values) && (
                        <details className="mt-3 text-xs">
                          <summary className="cursor-pointer text-slate-600 hover:text-slate-900">
                            Détails des modifications
                          </summary>
                          <div className="mt-2 p-3 bg-slate-50 rounded border border-slate-200 font-mono text-xs">
                            {log.old_values && (
                              <div>
                                <div className="font-semibold text-slate-700">Avant:</div>
                                <pre className="whitespace-pre-wrap break-words text-slate-600">
                                  {JSON.stringify(log.old_values, null, 2)}
                                </pre>
                              </div>
                            )}
                            {log.new_values && (
                              <div className="mt-2">
                                <div className="font-semibold text-slate-700">Après:</div>
                                <pre className="whitespace-pre-wrap break-words text-slate-600">
                                  {JSON.stringify(log.new_values, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        </details>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination.count > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600">
              Total: {pagination.count} entrées
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50"
              >
                Précédent
              </button>
              <span className="px-3 py-2 text-sm text-slate-600">
                Page {currentPage} / {Math.ceil(pagination.count / pagination.pageSize)}
              </span>
              <button
                onClick={() =>
                  setCurrentPage(
                    Math.min(Math.ceil(pagination.count / pagination.pageSize), currentPage + 1)
                  )
                }
                disabled={currentPage >= Math.ceil(pagination.count / pagination.pageSize)}
                className="px-3 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50"
              >
                Suivant
              </button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}

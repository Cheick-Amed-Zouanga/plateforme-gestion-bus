import React, { useEffect, useState } from 'react'
import { AdminLayout } from '@/components/shared/AdminLayout'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { usePermissions } from '@/hooks/usePermissions'
import { useAuth } from '@/hooks/useAuth'
import { Shield } from 'lucide-react'

export function PermissionsPage() {
  const { groupedPermissions, loading, fetchAllGroupedPermissions } = usePermissions()
  const { user: currentUser } = useAuth()
  const [selectedResource, setSelectedResource] = useState<string | null>(null)

  useEffect(() => {
    fetchAllGroupedPermissions()
  }, [])

  const resources = Object.keys(groupedPermissions).sort()

  const getActionBadgeVariant = (action: string) => {
    switch (action) {
      case 'create':
        return 'success'
      case 'read':
        return 'info'
      case 'update':
        return 'warning'
      case 'delete':
        return 'destructive'
      default:
        return 'default'
    }
  }

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      create: 'Créer',
      read: 'Lire',
      update: 'Modifier',
      delete: 'Supprimer',
    }
    return labels[action] || action
  }

  return (
    <AdminLayout userRole={currentUser?.roles?.[0]?.name || 'admin'} userEmail={currentUser?.email}>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Gestion des Permissions</h1>
          <p className="text-slate-600 mt-2">
            Vue d'ensemble de toutes les permissions disponibles dans le système
          </p>
        </div>

        {/* Info Card */}
        <Card className="p-6 bg-blue-50 border-blue-200">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-blue-900">À propos des permissions</h3>
              <p className="text-sm text-blue-800 mt-1">
                Les permissions contrôlent les actions que les utilisateurs peuvent effectuer.
                Elles sont organisées par ressource et action (Créer, Lire, Modifier, Supprimer).
                Les rôles regroupent les permissions pour simplifier la gestion des accès.
              </p>
            </div>
          </div>
        </Card>

        {/* Resources Overview */}
        <div>
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Ressources</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {resources.map(resource => (
              <button
                key={resource}
                onClick={() => setSelectedResource(selectedResource === resource ? null : resource)}
                className={`p-4 rounded-lg border-2 transition-colors text-center ${
                  selectedResource === resource
                    ? 'border-slate-900 bg-slate-50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="font-semibold text-slate-900 capitalize">{resource}</div>
                <div className="text-xs text-slate-500 mt-1">
                  {groupedPermissions[resource]?.length || 0} permission(s)
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Permissions Detail */}
        {selectedResource ? (
          <div>
            <h2 className="text-lg font-semibold text-slate-900 mb-4 capitalize">
              Permissions - {selectedResource}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {groupedPermissions[selectedResource]?.map(permission => (
                <Card key={permission.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="font-semibold text-slate-900">{permission.name}</div>
                      {permission.description && (
                        <div className="text-sm text-slate-600 mt-2">
                          {permission.description}
                        </div>
                      )}
                    </div>
                    <Badge variant={getActionBadgeVariant(permission.action)}>
                      {getActionLabel(permission.action)}
                    </Badge>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          <Card className="p-12 text-center">
            <Shield className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 text-lg">
              Sélectionnez une ressource pour voir ses permissions
            </p>
          </Card>
        )}

        {/* All Permissions Table */}
        <div>
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Toutes les Permissions</h2>
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="text-left px-6 py-3 font-semibold text-slate-900">Permission</th>
                    <th className="text-left px-6 py-3 font-semibold text-slate-900">Ressource</th>
                    <th className="text-center px-6 py-3 font-semibold text-slate-900">Action</th>
                    <th className="text-left px-6 py-3 font-semibold text-slate-900">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="text-center px-6 py-8 text-slate-500">
                        Chargement...
                      </td>
                    </tr>
                  ) : (
                    Object.entries(groupedPermissions).flatMap(([resource, perms]) =>
                      perms.map((perm, idx) => (
                        <tr
                          key={perm.id}
                          className={`border-b border-slate-200 ${
                            idx % 2 === 0 ? 'bg-slate-50' : 'bg-white'
                          } hover:bg-slate-100 transition-colors`}
                        >
                          <td className="px-6 py-4 font-medium text-slate-900">
                            {perm.name}
                          </td>
                          <td className="px-6 py-4 text-slate-600 capitalize">{resource}</td>
                          <td className="px-6 py-4 text-center">
                            <Badge variant={getActionBadgeVariant(perm.action)}>
                              {getActionLabel(perm.action)}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 text-slate-600">{perm.description}</td>
                        </tr>
                      ))
                    )
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </AdminLayout>
  )
}

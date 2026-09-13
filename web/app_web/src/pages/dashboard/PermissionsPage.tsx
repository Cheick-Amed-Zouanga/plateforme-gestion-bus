import { useEffect, useState } from 'react'
import { AdminLayout } from '@/components/shared/AdminLayout'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useDashboardUser } from '@/shared/hooks/useDashboardUser'
import apiFetch from '@/shared/services/api'

interface Permission { id: string; name: string; resource: string; action: string; description: string }

export default function PermissionsPage() {
  const { userRole, userEmail, handleLogout } = useDashboardUser()
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    apiFetch('/iam/permissions/')
      .then(data => setPermissions(Array.isArray(data) ? data : data.results || []))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const grouped = permissions.reduce<Record<string, Permission[]>>((acc, p) => {
    (acc[p.resource] ||= []).push(p)
    return acc
  }, {})

  const actionVariant: Record<string, 'success' | 'info' | 'warning' | 'destructive'> = {
    create: 'success', read: 'info', update: 'warning', delete: 'destructive',
  }

  return (
    <AdminLayout userRole={userRole} userEmail={userEmail} onLogout={handleLogout}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Permissions</h1>
          <p className="mt-1 text-sm text-slate-600">
            Liste complète des permissions disponibles sur la plateforme, groupées par ressource.
            Elles sont assemblées en rôles dans la page « Rôles ».
          </p>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        {loading ? (
          <Card className="p-8 text-center text-slate-500">Chargement…</Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {Object.entries(grouped).map(([resource, perms]) => (
              <Card key={resource} className="p-5">
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">{resource}</h3>
                <div className="space-y-2">
                  {perms.map(p => (
                    <div key={p.id} className="flex items-center justify-between gap-2">
                      <span className="text-sm text-slate-700">{p.description || p.name}</span>
                      <Badge variant={actionVariant[p.action] || 'default'}>{p.action}</Badge>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}

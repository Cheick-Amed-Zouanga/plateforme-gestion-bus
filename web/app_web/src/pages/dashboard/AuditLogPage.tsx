import { useEffect, useState } from 'react'
import { AdminLayout } from '@/components/shared/AdminLayout'
import { DataTable } from '@/components/shared/DataTable'
import type { Column } from '@/components/shared/DataTable'
import { Badge } from '@/components/ui/badge'
import { useDashboardUser } from '@/shared/hooks/useDashboardUser'
import apiFetch from '@/shared/services/api'

interface AuditEntry {
  id: string
  user_email: string | null
  company_name: string | null
  action: string
  resource_type: string
  resource_name: string
  description: string
  created_at: string
}

const ACTION_VARIANT: Record<string, 'success' | 'info' | 'warning' | 'destructive' | 'default'> = {
  create: 'success', update: 'warning', delete: 'destructive',
  login: 'info', logout: 'default', permission_change: 'warning', role_change: 'warning',
}

export default function AuditLogPage() {
  const { userRole, userEmail, handleLogout } = useDashboardUser()
  const [logs, setLogs] = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    apiFetch('/iam/audit-logs/')
      .then(data => setLogs(Array.isArray(data) ? data : data.results || []))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const columns: Column<AuditEntry>[] = [
    {
      key: 'created_at', label: 'Date', sortable: true,
      render: v => new Date(v).toLocaleString('fr-FR'),
    },
    { key: 'user_email', label: 'Utilisateur', render: v => v || <span className="text-slate-400">Système</span> },
    { key: 'company_name', label: 'Compagnie', render: v => v || <span className="text-slate-400">Plateforme</span> },
    { key: 'action', label: 'Action', render: v => <Badge variant={ACTION_VARIANT[v] || 'default'}>{v}</Badge> },
    { key: 'resource_type', label: 'Ressource' },
    { key: 'resource_name', label: 'Nom' },
    { key: 'description', label: 'Détail' },
  ]

  return (
    <AdminLayout userRole={userRole} userEmail={userEmail} onLogout={handleLogout}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Audit Log</h1>
          <p className="mt-1 text-sm text-slate-600">Historique des actions effectuées sur la plateforme.</p>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        <DataTable
          columns={columns}
          data={logs}
          loading={loading}
          emptyMessage="Aucune activité enregistrée pour le moment."
          pageSize={20}
        />
      </div>
    </AdminLayout>
  )
}

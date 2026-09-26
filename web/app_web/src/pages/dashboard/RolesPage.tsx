import { useEffect, useState, useCallback } from 'react'
import { AdminLayout } from '@/components/shared/AdminLayout'
import { DataTable } from '@/components/shared/DataTable'
import type { Column } from '@/components/shared/DataTable'
import { SimpleModal } from '@/components/shared/SimpleModal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useDashboardUser } from '@/shared/hooks/useDashboardUser'
import apiFetch from '@/shared/services/api'

interface Permission { id: string; name: string; resource: string; description: string }
interface RoleRow {
  id: string
  name: string
  description: string
  company: string | null
  company_name: string | null
  permissions: Permission[]
  is_active: boolean
}

const EMPTY_FORM = { name: '', description: '', permission_ids: [] as string[] }

export default function RolesPage() {
  const { userRole, userEmail, isSuperAdmin, handleLogout } = useDashboardUser()
  const [roles, setRoles] = useState<RoleRow[]>([])
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<RoleRow | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const charger = useCallback(() => {
    setLoading(true)
    Promise.all([apiFetch('/iam/roles/'), apiFetch('/iam/permissions/')])
      .then(([r, p]) => {
        setRoles(Array.isArray(r) ? r : r.results || [])
        setPermissions(Array.isArray(p) ? p : p.results || [])
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { charger() }, [charger])

  const permsByResource = permissions.reduce<Record<string, Permission[]>>((acc, p) => {
    (acc[p.resource] ||= []).push(p)
    return acc
  }, {})

  function ouvrirCreation() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setFormError(null)
    setModalOpen(true)
  }

  function ouvrirEdition(r: RoleRow) {
    setEditing(r)
    setForm({ name: r.name, description: r.description, permission_ids: r.permissions.map(p => p.id) })
    setFormError(null)
    setModalOpen(true)
  }

  async function enregistrer(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setFormError(null)
    try {
      if (editing) {
        await apiFetch(`/iam/roles/${editing.id}/`, { method: 'PATCH', body: JSON.stringify(form) })
      } else {
        await apiFetch('/iam/roles/', { method: 'POST', body: JSON.stringify(form) })
      }
      setModalOpen(false)
      charger()
    } catch (err: any) {
      setFormError(err.message || "Erreur lors de l'enregistrement.")
    } finally {
      setSaving(false)
    }
  }

  async function supprimer(r: RoleRow) {
    if (!window.confirm(`Supprimer le rôle « ${r.name} » ?`)) return
    try {
      await apiFetch(`/iam/roles/${r.id}/`, { method: 'DELETE' })
      setRoles(prev => prev.filter(x => x.id !== r.id))
    } catch (e: any) {
      setError(e.message)
    }
  }

  function togglePermission(id: string) {
    setForm(f => ({
      ...f,
      permission_ids: f.permission_ids.includes(id)
        ? f.permission_ids.filter(x => x !== id)
        : [...f.permission_ids, id],
    }))
  }

  const columns: Column<RoleRow>[] = [
    { key: 'name', label: 'Rôle', sortable: true },
    {
      key: 'company_name', label: 'Portée',
      render: v => v ? <Badge variant="secondary">{v}</Badge> : <Badge variant="info">Global (plateforme)</Badge>,
    },
    { key: 'description', label: 'Description' },
    {
      key: 'permissions', label: 'Permissions',
      render: (v: Permission[]) => <span className="text-slate-600">{v.length} permission(s)</span>,
    },
  ]

  return (
    <AdminLayout userRole={userRole} userEmail={userEmail} onLogout={handleLogout}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Rôles</h1>
          <p className="mt-1 text-sm text-slate-600">
            {isSuperAdmin
              ? 'Rôles globaux (plateforme) et rôles spécifiques à chaque compagnie.'
              : "Rôles de votre compagnie, plus les rôles globaux de la plateforme."}
          </p>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        <DataTable
          columns={columns}
          data={roles}
          loading={loading}
          onAdd={ouvrirCreation}
          onEdit={ouvrirEdition}
          onDelete={supprimer}
          emptyMessage="Aucun rôle pour le moment."
        />
      </div>

      <SimpleModal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Modifier le rôle' : 'Nouveau rôle'} wide>
        <form onSubmit={enregistrer} className="space-y-4">
          {formError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{formError}</div>
          )}
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Nom du rôle</label>
            <Input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Description</label>
            <Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Permissions</label>
            <div className="max-h-72 space-y-3 overflow-y-auto rounded-md border border-slate-200 p-3">
              {Object.entries(permsByResource).map(([resource, perms]) => (
                <div key={resource}>
                  <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">{resource}</div>
                  <div className="flex flex-wrap gap-2">
                    {perms.map(p => (
                      <button
                        type="button"
                        key={p.id}
                        onClick={() => togglePermission(p.id)}
                        title={p.description}
                        className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                          form.permission_ids.includes(p.id)
                            ? 'border-slate-900 bg-slate-900 text-white'
                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {p.name}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Annuler</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Enregistrement…' : 'Enregistrer'}</Button>
          </div>
        </form>
      </SimpleModal>
    </AdminLayout>
  )
}

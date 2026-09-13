import { useEffect, useState, useCallback } from 'react'
import { AdminLayout } from '@/components/shared/AdminLayout'
import { DataTable, Column } from '@/components/shared/DataTable'
import { SimpleModal } from '@/components/shared/SimpleModal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useDashboardUser } from '@/shared/hooks/useDashboardUser'
import apiFetch from '@/shared/services/api'

interface Role { id: string; name: string; company: string | null }
interface UserRow {
  id: string
  email: string
  username: string
  first_name: string
  last_name: string
  company: string | null
  company_name: string | null
  roles: Role[]
  is_active: boolean
  is_staff: boolean
}
interface Company { id: string; name: string }

const EMPTY_FORM = {
  email: '', username: '', first_name: '', last_name: '', password: '',
  company: '', role_ids: [] as string[], is_staff: false,
}

export default function UsersPage() {
  const { userRole, userEmail, isSuperAdmin, handleLogout } = useDashboardUser()
  const [users, setUsers] = useState<UserRow[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<UserRow | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const charger = useCallback(() => {
    setLoading(true)
    Promise.all([
      apiFetch('/iam/users/'),
      apiFetch('/iam/roles/'),
      apiFetch('/iam/companies/'),
    ])
      .then(([u, r, c]) => {
        setUsers(Array.isArray(u) ? u : u.results || [])
        setRoles(Array.isArray(r) ? r : r.results || [])
        setCompanies(Array.isArray(c) ? c : c.results || [])
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { charger() }, [charger])

  function ouvrirCreation() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setFormError(null)
    setModalOpen(true)
  }

  function ouvrirEdition(u: UserRow) {
    setEditing(u)
    setForm({
      email: u.email, username: u.username, first_name: u.first_name, last_name: u.last_name,
      password: '', company: u.company || '', role_ids: u.roles.map(r => r.id), is_staff: u.is_staff,
    })
    setFormError(null)
    setModalOpen(true)
  }

  async function enregistrer(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setFormError(null)
    try {
      const payload: Record<string, unknown> = { ...form }
      if (!payload.password) delete payload.password
      if (!isSuperAdmin) delete payload.company // forcé côté serveur pour les non-super-admin

      if (editing) {
        await apiFetch(`/iam/users/${editing.id}/`, { method: 'PATCH', body: JSON.stringify(payload) })
      } else {
        await apiFetch('/iam/users/', { method: 'POST', body: JSON.stringify(payload) })
      }
      setModalOpen(false)
      charger()
    } catch (err: any) {
      setFormError(err.message || "Erreur lors de l'enregistrement.")
    } finally {
      setSaving(false)
    }
  }

  async function supprimer(u: UserRow) {
    if (!window.confirm(`Supprimer l'utilisateur ${u.email} ?`)) return
    try {
      await apiFetch(`/iam/users/${u.id}/`, { method: 'DELETE' })
      setUsers(prev => prev.filter(x => x.id !== u.id))
    } catch (e: any) {
      setError(e.message)
    }
  }

  function toggleRole(roleId: string) {
    setForm(f => ({
      ...f,
      role_ids: f.role_ids.includes(roleId)
        ? f.role_ids.filter(id => id !== roleId)
        : [...f.role_ids, roleId],
    }))
  }

  const columns: Column<UserRow>[] = [
    {
      key: 'email', label: 'Utilisateur', sortable: true,
      render: (_v, row) => (
        <div>
          <div className="font-medium">{row.first_name} {row.last_name}</div>
          <div className="text-xs text-slate-500">{row.email}</div>
        </div>
      ),
    },
    { key: 'company_name', label: 'Compagnie', sortable: true, render: v => v || <span className="text-slate-400">Plateforme</span> },
    {
      key: 'roles', label: 'Rôles',
      render: (v: Role[]) => (
        <div className="flex flex-wrap gap-1">
          {v.length ? v.map(r => <Badge key={r.id} variant="secondary">{r.name}</Badge>) : <span className="text-slate-400">—</span>}
        </div>
      ),
    },
    {
      key: 'is_active', label: 'Statut',
      render: v => <Badge variant={v ? 'success' : 'destructive'}>{v ? 'Actif' : 'Inactif'}</Badge>,
    },
  ]

  return (
    <AdminLayout userRole={userRole} userEmail={userEmail} onLogout={handleLogout}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Utilisateurs</h1>
          <p className="mt-1 text-sm text-slate-600">
            {isSuperAdmin
              ? 'Tous les utilisateurs, toutes compagnies confondues.'
              : 'Les utilisateurs de votre compagnie.'}
          </p>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        <DataTable
          columns={columns}
          data={users}
          loading={loading}
          onAdd={ouvrirCreation}
          onEdit={ouvrirEdition}
          onDelete={supprimer}
          emptyMessage="Aucun utilisateur pour le moment."
        />
      </div>

      <SimpleModal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Modifier l'utilisateur" : 'Nouvel utilisateur'} wide>
        <form onSubmit={enregistrer} className="space-y-4">
          {formError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{formError}</div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Prénom</label>
              <Input required value={form.first_name} onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Nom</label>
              <Input required value={form.last_name} onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
              <Input type="email" required value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Nom d'utilisateur</label>
              <Input required value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Mot de passe {editing && <span className="text-slate-400">(laisser vide pour ne pas changer)</span>}
            </label>
            <Input type="password" required={!editing} value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
          </div>

          {isSuperAdmin && (
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Compagnie</label>
              <select
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-950"
                value={form.company}
                onChange={e => setForm(f => ({ ...f, company: e.target.value }))}
              >
                <option value="">— Aucune (Super Admin) —</option>
                {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Rôles</label>
            <div className="flex flex-wrap gap-2 rounded-md border border-slate-200 p-3">
              {roles.map(r => (
                <button
                  type="button"
                  key={r.id}
                  onClick={() => toggleRole(r.id)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                    form.role_ids.includes(r.id)
                      ? 'border-slate-900 bg-slate-900 text-white'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {r.name}
                </button>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={form.is_staff} onChange={e => setForm(f => ({ ...f, is_staff: e.target.checked }))} />
            Administrateur de la compagnie (accès complet à son tenant)
          </label>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Annuler</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Enregistrement…' : 'Enregistrer'}</Button>
          </div>
        </form>
      </SimpleModal>
    </AdminLayout>
  )
}

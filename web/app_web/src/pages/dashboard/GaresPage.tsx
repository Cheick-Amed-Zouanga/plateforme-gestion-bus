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

interface Gare {
  id: string
  company: string
  company_name?: string
  name: string
  city: string
  address: string
  phone: string
  email: string
  manager_name: string
  coordinates: string
  is_active: boolean
}

interface CompanyOption {
  id: string
  name: string
}

const EMPTY_FORM = {
  name: '',
  city: '',
  address: '',
  phone: '',
  email: '',
  manager_name: '',
  company: '',
  is_active: true,
}

export default function GaresPage() {
  const { userRole, userEmail, handleLogout, isSuperAdmin, hasPermission } = useDashboardUser()
  const canCreate = isSuperAdmin || hasPermission('gare.create')
  const canUpdate = isSuperAdmin || hasPermission('gare.update')
  const canDelete = isSuperAdmin || hasPermission('gare.delete')
  const [gares, setGares] = useState<Gare[]>([])
  const [companies, setCompanies] = useState<CompanyOption[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Gare | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const charger = useCallback(() => {
    setLoading(true)
    setError(null)
    apiFetch('/iam/gares/')
      .then(data => setGares(Array.isArray(data) ? data : data.results || []))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { charger() }, [charger])

  useEffect(() => {
    if (!isSuperAdmin) return
    apiFetch('/iam/companies/')
      .then(data => {
        const list = Array.isArray(data) ? data : data.results || []
        setCompanies(list.map((c: CompanyOption) => ({ id: c.id, name: c.name })))
      })
      .catch(() => {})
  }, [isSuperAdmin])

  function ouvrirCreation() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setFormError(null)
    setModalOpen(true)
  }

  function ouvrirEdition(g: Gare) {
    setEditing(g)
    setForm({
      name: g.name,
      city: g.city,
      address: g.address || '',
      phone: g.phone || '',
      email: g.email || '',
      manager_name: g.manager_name || '',
      company: g.company || '',
      is_active: g.is_active,
    })
    setFormError(null)
    setModalOpen(true)
  }

  async function enregistrer(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setFormError(null)

    const payload: Record<string, unknown> = {
      name: form.name.trim(),
      city: form.city.trim(),
      address: form.address.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      manager_name: form.manager_name.trim(),
      is_active: form.is_active,
    }

    if (isSuperAdmin) {
      if (!form.company) {
        setFormError('Sélectionnez une compagnie (tenant).')
        setSaving(false)
        return
      }
      payload.company = form.company
    }

    try {
      if (editing) {
        await apiFetch(`/iam/gares/${editing.id}/`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        })
      } else {
        await apiFetch('/iam/gares/', {
          method: 'POST',
          body: JSON.stringify(payload),
        })
      }
      setModalOpen(false)
      charger()
    } catch (err: any) {
      setFormError(err.message || 'Erreur lors de l\'enregistrement.')
    } finally {
      setSaving(false)
    }
  }

  async function supprimer(g: Gare) {
    if (!window.confirm(`Supprimer la gare « ${g.name} » ?`)) return
    try {
      await apiFetch(`/iam/gares/${g.id}/`, { method: 'DELETE' })
      setGares(prev => prev.filter(x => x.id !== g.id))
    } catch (e: any) {
      setError(e.message)
    }
  }

  const columns: Column<Gare>[] = [
    ...(isSuperAdmin
      ? [{
          key: 'company_name' as keyof Gare,
          label: 'Compagnie',
          sortable: true,
          render: (v: string) => v || '—',
        }]
      : []),
    { key: 'name', label: 'Gare', sortable: true },
    { key: 'city', label: 'Ville', sortable: true },
    { key: 'address', label: 'Adresse' },
    { key: 'phone', label: 'Téléphone' },
    { key: 'manager_name', label: 'Responsable' },
    {
      key: 'is_active',
      label: 'Statut',
      render: (v) => (
        <Badge variant={v ? 'success' : 'destructive'}>
          {v ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
  ]

  return (
    <AdminLayout userRole={userRole} userEmail={userEmail} onLogout={handleLogout}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Gares</h1>
          <p className="mt-1 text-sm text-slate-600">
            Points de vente de la compagnie. Isolés par tenant.
          </p>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="text-sm text-slate-600">Total gares</div>
            <div className="mt-1 text-2xl font-bold text-slate-900">{gares.length}</div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="text-sm text-slate-600">Actives</div>
            <div className="mt-1 text-2xl font-bold text-slate-900">
              {gares.filter(g => g.is_active).length}
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="text-sm text-slate-600">Villes</div>
            <div className="mt-1 text-2xl font-bold text-slate-900">
              {new Set(gares.map(g => g.city)).size}
            </div>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={gares}
          loading={loading}
          onAdd={canCreate ? ouvrirCreation : undefined}
          onEdit={canUpdate ? ouvrirEdition : undefined}
          onDelete={canDelete ? supprimer : undefined}
          emptyMessage="Aucune gare pour le moment. Créez le premier point de vente."
        />
      </div>

      <SimpleModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Modifier la gare' : 'Nouvelle gare'}
        wide
      >
        <form onSubmit={enregistrer} className="space-y-4">
          {formError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {formError}
            </div>
          )}

          {isSuperAdmin && (
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Compagnie</label>
              <select
                required
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-950"
                value={form.company}
                onChange={e => setForm(f => ({ ...f, company: e.target.value }))}
                disabled={!!editing}
              >
                <option value="">Sélectionner…</option>
                {companies.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Nom</label>
              <Input
                required
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Dakar Central"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Ville</label>
              <Input
                required
                value={form.city}
                onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                placeholder="Dakar"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Adresse</label>
            <Input
              required
              value={form.address}
              onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Téléphone</label>
              <Input
                value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
              <Input
                type="email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Responsable</label>
            <Input
              value={form.manager_name}
              onChange={e => setForm(f => ({ ...f, manager_name: e.target.value }))}
            />
          </div>

          {editing && (
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))}
              />
              Gare active
            </label>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Enregistrement…' : 'Enregistrer'}
            </Button>
          </div>
        </form>
      </SimpleModal>
    </AdminLayout>
  )
}

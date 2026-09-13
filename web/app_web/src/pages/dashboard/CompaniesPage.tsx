import { useEffect, useState, useCallback } from 'react'
import { AdminLayout } from '@/components/shared/AdminLayout'
import { DataTable, Column } from '@/components/shared/DataTable'
import { SimpleModal } from '@/components/shared/SimpleModal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useDashboardUser } from '@/shared/hooks/useDashboardUser'
import apiFetch from '@/shared/services/api'

interface Company {
  id: string
  name: string
  email: string
  phone: string
  address: string
  slug: string
  subscription: 'free' | 'pro' | 'enterprise'
  is_active: boolean
}

const EMPTY_FORM = { name: '', email: '', phone: '', address: '', slug: '', subscription: 'free' }

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export default function CompaniesPage() {
  const { userRole, userEmail, handleLogout } = useDashboardUser()
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Company | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const charger = useCallback(() => {
    setLoading(true)
    apiFetch('/iam/companies/')
      .then(data => setCompanies(Array.isArray(data) ? data : data.results || []))
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

  function ouvrirEdition(c: Company) {
    setEditing(c)
    setForm({
      name: c.name, email: c.email, phone: c.phone || '',
      address: c.address || '', slug: c.slug, subscription: c.subscription,
    })
    setFormError(null)
    setModalOpen(true)
  }

  async function enregistrer(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setFormError(null)
    try {
      if (editing) {
        await apiFetch(`/iam/companies/${editing.id}/`, {
          method: 'PATCH',
          body: JSON.stringify(form),
        })
      } else {
        await apiFetch('/iam/companies/', {
          method: 'POST',
          body: JSON.stringify(form),
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

  async function supprimer(c: Company) {
    if (!window.confirm(`Supprimer la compagnie « ${c.name} » ? Cette action est irréversible.`)) return
    try {
      await apiFetch(`/iam/companies/${c.id}/`, { method: 'DELETE' })
      setCompanies(prev => prev.filter(x => x.id !== c.id))
    } catch (e: any) {
      setError(e.message)
    }
  }

  const columns: Column<Company>[] = [
    { key: 'name', label: 'Compagnie', sortable: true },
    { key: 'email', label: 'Email', sortable: true },
    { key: 'phone', label: 'Téléphone' },
    {
      key: 'subscription', label: 'Abonnement', sortable: true,
      render: (v) => (
        <Badge variant={v === 'enterprise' ? 'default' : v === 'pro' ? 'info' : 'secondary'}>
          {v}
        </Badge>
      ),
    },
    {
      key: 'is_active', label: 'Statut',
      render: (v) => <Badge variant={v ? 'success' : 'destructive'}>{v ? 'Active' : 'Inactive'}</Badge>,
    },
  ]

  return (
    <AdminLayout userRole={userRole} userEmail={userEmail} onLogout={handleLogout}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Compagnies</h1>
          <p className="mt-1 text-sm text-slate-600">
            Gérez les compagnies de transport (tenants) de la plateforme.
          </p>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <DataTable
          columns={columns}
          data={companies}
          loading={loading}
          onAdd={ouvrirCreation}
          onEdit={ouvrirEdition}
          onDelete={supprimer}
          emptyMessage="Aucune compagnie pour le moment."
        />
      </div>

      <SimpleModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Modifier la compagnie' : 'Nouvelle compagnie'}
      >
        <form onSubmit={enregistrer} className="space-y-4">
          {formError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {formError}
            </div>
          )}
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Nom</label>
            <Input
              required
              value={form.name}
              onChange={e => setForm(f => ({
                ...f, name: e.target.value,
                slug: editing ? f.slug : slugify(e.target.value),
              }))}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Identifiant (slug)</label>
            <Input required value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
            <Input type="email" required value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Téléphone</label>
            <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Adresse</label>
            <Input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Abonnement</label>
            <select
              className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-950"
              value={form.subscription}
              onChange={e => setForm(f => ({ ...f, subscription: e.target.value }))}
            >
              <option value="free">Free</option>
              <option value="pro">Pro</option>
              <option value="enterprise">Enterprise</option>
            </select>
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

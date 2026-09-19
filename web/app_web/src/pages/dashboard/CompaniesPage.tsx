import { useEffect, useState, useCallback, useRef } from 'react'
import { AdminLayout } from '@/components/shared/AdminLayout'
import { DataTable } from '@/components/shared/DataTable'
import type { Column } from '@/components/shared/DataTable'
import { SimpleModal } from '@/components/shared/SimpleModal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { useDashboardUser } from '@/shared/hooks/useDashboardUser'
import apiFetch from '@/shared/services/api'

interface Company {
  id: string
  name: string
  email: string
  phone: string
  address: string
  slug: string
  logo?: string | null
  logo_url?: string | null
  subscription: 'free' | 'pro' | 'enterprise'
  is_active: boolean
}

const EMPTY_FORM = {
  name: '',
  email: '',
  phone: '',
  address: '',
  slug: '',
  subscription: 'free' as Company['subscription'],
  is_active: true,
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
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
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const charger = useCallback(() => {
    setLoading(true)
    apiFetch('/iam/companies/')
      .then(data => setCompanies(Array.isArray(data) ? data : data.results || []))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { charger() }, [charger])

  useEffect(() => {
    return () => {
      if (logoPreview?.startsWith('blob:')) URL.revokeObjectURL(logoPreview)
    }
  }, [logoPreview])

  function resetLogo() {
    if (logoPreview?.startsWith('blob:')) URL.revokeObjectURL(logoPreview)
    setLogoFile(null)
    setLogoPreview(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  function ouvrirCreation() {
    setEditing(null)
    setForm(EMPTY_FORM)
    resetLogo()
    setFormError(null)
    setModalOpen(true)
  }

  function ouvrirEdition(c: Company) {
    setEditing(c)
    setForm({
      name: c.name,
      email: c.email,
      phone: c.phone || '',
      address: c.address || '',
      slug: c.slug,
      subscription: c.subscription,
      is_active: c.is_active,
    })
    setLogoFile(null)
    setLogoPreview(c.logo_url || null)
    setFormError(null)
    setModalOpen(true)
  }

  function onLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setFormError('Le fichier doit être une image (PNG, JPG, WebP…).')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      setFormError('Image trop lourde (max 2 Mo).')
      return
    }
    if (logoPreview?.startsWith('blob:')) URL.revokeObjectURL(logoPreview)
    setLogoFile(file)
    setLogoPreview(URL.createObjectURL(file))
    setFormError(null)
  }

  async function enregistrer(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setFormError(null)
    try {
      const fd = new FormData()
      fd.append('name', form.name)
      fd.append('email', form.email)
      fd.append('phone', form.phone)
      fd.append('address', form.address)
      fd.append('slug', form.slug)
      fd.append('subscription', form.subscription)
      fd.append('is_active', form.is_active ? 'true' : 'false')
      if (logoFile) fd.append('logo', logoFile)

      if (editing) {
        await apiFetch(`/iam/companies/${editing.id}/`, {
          method: 'PATCH',
          body: fd,
        })
      } else {
        await apiFetch('/iam/companies/', {
          method: 'POST',
          body: fd,
        })
      }
      setModalOpen(false)
      resetLogo()
      charger()
    } catch (err: any) {
      setFormError(err.message || "Erreur lors de l'enregistrement.")
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
    {
      key: 'name',
      label: 'Compagnie',
      sortable: true,
      render: (v, row) => (
        <div className="flex items-center gap-3">
          {row.logo_url ? (
            <img
              src={row.logo_url}
              alt=""
              className="h-9 w-9 rounded-md object-cover border border-slate-200"
            />
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-slate-100 text-xs font-semibold text-slate-500">
              {(v || '?').toString().slice(0, 2).toUpperCase()}
            </div>
          )}
          <span className="font-medium">{v}</span>
        </div>
      ),
    },
    { key: 'email', label: 'Email', sortable: true },
    { key: 'phone', label: 'Téléphone' },
    {
      key: 'subscription',
      label: 'Abonnement',
      sortable: true,
      render: (v) => (
        <Badge variant={v === 'enterprise' ? 'default' : v === 'pro' ? 'info' : 'secondary'}>
          {v}
        </Badge>
      ),
    },
    {
      key: 'is_active',
      label: 'Statut',
      render: (v) => (
        <Badge variant={v ? 'success' : 'destructive'}>{v ? 'Active' : 'Inactive'}</Badge>
      ),
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
            <Label className="mb-2 block">Logo / image</Label>
            <div className="flex items-center gap-4">
              {logoPreview ? (
                <img
                  src={logoPreview}
                  alt="Aperçu logo"
                  className="h-16 w-16 rounded-lg border border-slate-200 object-cover"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 text-xs text-slate-400">
                  Aucune
                </div>
              )}
              <div className="space-y-2">
                <Input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  onChange={onLogoChange}
                  className="max-w-xs"
                />
                <p className="text-xs text-slate-500">PNG, JPG ou WebP — max 2 Mo</p>
              </div>
            </div>
          </div>

          <div>
            <Label className="mb-1 block">Nom</Label>
            <Input
              required
              value={form.name}
              onChange={e => setForm(f => ({
                ...f,
                name: e.target.value,
                slug: editing ? f.slug : slugify(e.target.value),
              }))}
            />
          </div>
          <div>
            <Label className="mb-1 block">Identifiant (slug)</Label>
            <Input
              required
              value={form.slug}
              onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
            />
          </div>
          <div>
            <Label className="mb-1 block">Email</Label>
            <Input
              type="email"
              required
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            />
          </div>
          <div>
            <Label className="mb-1 block">Téléphone</Label>
            <Input
              value={form.phone}
              onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
            />
          </div>
          <div>
            <Label className="mb-1 block">Adresse</Label>
            <Input
              value={form.address}
              onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
            />
          </div>
          <div>
            <Label className="mb-1 block">Abonnement</Label>
            <select
              className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-950"
              value={form.subscription}
              onChange={e => setForm(f => ({ ...f, subscription: e.target.value as Company['subscription'] }))}
            >
              <option value="free">Free</option>
              <option value="pro">Pro</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))}
              className="h-4 w-4 rounded border-slate-300"
            />
            Compagnie active
          </label>
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

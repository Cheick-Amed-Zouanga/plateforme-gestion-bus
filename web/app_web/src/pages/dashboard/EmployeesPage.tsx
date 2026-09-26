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

interface Employe {
  id: number
  username: string
  first_name: string
  last_name: string
  email: string
  role: string
  role_display?: string
  telephone: string
  actif: boolean
}

const ROLE_LABELS: Record<string, string> = {
  RECEPTIONNISTE: 'Réceptionniste',
  CONTROLEUR: 'Contrôleur',
}

const EMPTY_FORM = {
  role: 'RECEPTIONNISTE',
  prenom: '',
  nom: '',
  email: '',
  tel: '',
  username: '',
  password: '',
  confirmationPassword: '',
}

export default function EmployeesPage() {
  const { userRole, userEmail, handleLogout, isSuperAdmin, hasPermission } = useDashboardUser()
  const canCreate = !isSuperAdmin && hasPermission('employe.create')
  const canUpdate = !isSuperAdmin && hasPermission('employe.update')
  const canDelete = !isSuperAdmin && (hasPermission('employe.delete') || hasPermission('employe.update'))
  const [employes, setEmployes] = useState<Employe[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Employe | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [showPwd, setShowPwd] = useState(false)

  const charger = useCallback(() => {
    setLoading(true)
    setError(null)
    apiFetch('/accounts/employes/')
      .then(data => setEmployes(Array.isArray(data) ? data : data.results || []))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { charger() }, [charger])

  function ouvrirCreation() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setFormError(null)
    setShowPwd(false)
    setModalOpen(true)
  }

  function ouvrirEdition(e: Employe) {
    setEditing(e)
    setForm({
      ...EMPTY_FORM,
      role: e.role,
      prenom: e.first_name || '',
      nom: e.last_name || '',
      email: e.email || '',
      tel: e.telephone || '',
      username: e.username,
    })
    setFormError(null)
    setModalOpen(true)
  }

  async function enregistrer(ev: React.FormEvent) {
    ev.preventDefault()
    setSaving(true)
    setFormError(null)

    try {
      if (editing) {
        await apiFetch(`/accounts/employes/${editing.id}/modifier/`, {
          method: 'PATCH',
          body: JSON.stringify({
            prenom: form.prenom.trim(),
            nom: form.nom.trim(),
            email: form.email.trim(),
            tel: form.tel.trim(),
          }),
        })
      } else {
        if (form.password.length < 7) {
          setFormError('Le mot de passe doit contenir au moins 7 caractères.')
          setSaving(false)
          return
        }
        if (!/[A-Z]/.test(form.password)) {
          setFormError('Le mot de passe doit contenir au moins une majuscule.')
          setSaving(false)
          return
        }
        if (!/[!@#$%^&*(),.?":{}|<>]/.test(form.password)) {
          setFormError('Le mot de passe doit contenir au moins un caractère spécial.')
          setSaving(false)
          return
        }
        if (form.password !== form.confirmationPassword) {
          setFormError('Les mots de passe ne correspondent pas.')
          setSaving(false)
          return
        }
        await apiFetch('/accounts/employes/creer/', {
          method: 'POST',
          body: JSON.stringify({
            role: form.role,
            prenom: form.prenom.trim(),
            nom: form.nom.trim(),
            email: form.email.trim(),
            tel: form.tel.trim(),
            username: form.username.trim(),
            password: form.password,
            confirmationPassword: form.confirmationPassword,
          }),
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

  async function desactiver(e: Employe) {
    if (!e.actif) return
    if (!window.confirm(`Désactiver ${e.first_name} ${e.last_name} (${ROLE_LABELS[e.role] || e.role}) ?`)) return
    try {
      await apiFetch(`/accounts/employes/${e.id}/desactiver/`, { method: 'POST' })
      charger()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const actifs = employes.filter(e => e.actif)

  const columns: Column<Employe>[] = [
    {
      key: 'last_name',
      label: 'Nom',
      sortable: true,
      render: (_, row) => `${row.first_name} ${row.last_name}`.trim() || row.username,
    },
    { key: 'username', label: 'Identifiant', sortable: true },
    { key: 'email', label: 'Email' },
    { key: 'telephone', label: 'Téléphone' },
    {
      key: 'role',
      label: 'Rôle',
      render: (v, row) => (
        <Badge variant={v === 'CONTROLEUR' ? 'default' : 'secondary'}>
          {row.role_display || ROLE_LABELS[v] || v}
        </Badge>
      ),
    },
    {
      key: 'actif',
      label: 'Statut',
      render: v => (
        <Badge variant={v ? 'success' : 'destructive'}>
          {v ? 'Actif' : 'Inactif'}
        </Badge>
      ),
    },
  ]

  return (
    <AdminLayout userRole={userRole} userEmail={userEmail} onLogout={handleLogout}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Employés</h1>
          <p className="mt-1 text-sm text-slate-600">
            Réceptionnistes et contrôleurs de votre compagnie (isolés par tenant).
          </p>
        </div>

        {isSuperAdmin && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Connectez-vous avec un Manager / Admin de compagnie pour gérer les employés.
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="text-sm text-slate-600">Total</div>
            <div className="mt-1 text-2xl font-bold text-slate-900">{employes.length}</div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="text-sm text-slate-600">Actifs</div>
            <div className="mt-1 text-2xl font-bold text-slate-900">{actifs.length}</div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="text-sm text-slate-600">Réceptionnistes</div>
            <div className="mt-1 text-2xl font-bold text-slate-900">
              {actifs.filter(e => e.role === 'RECEPTIONNISTE').length}
            </div>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={employes}
          loading={loading}
          onAdd={canCreate ? ouvrirCreation : undefined}
          onEdit={canUpdate ? (e) => { if (e.actif) ouvrirEdition(e) } : undefined}
          onDelete={canDelete ? (e) => { if (e.actif) desactiver(e) } : undefined}
          emptyMessage="Aucun employé. Inscrivez un réceptionniste ou un contrôleur."
        />
      </div>

      <SimpleModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Modifier l\'employé' : 'Nouvel employé'}
        wide
      >
        <form onSubmit={enregistrer} className="space-y-4">
          {formError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {formError}
            </div>
          )}

          {!editing && (
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Rôle</label>
              <select
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                value={form.role}
                onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
              >
                <option value="RECEPTIONNISTE">Réceptionniste</option>
                <option value="CONTROLEUR">Contrôleur</option>
              </select>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Prénom</label>
              <Input
                required
                value={form.prenom}
                onChange={e => setForm(f => ({ ...f, prenom: e.target.value }))}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Nom</label>
              <Input
                required
                value={form.nom}
                onChange={e => setForm(f => ({ ...f, nom: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
              <Input
                required
                type="email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Téléphone</label>
              <Input
                value={form.tel}
                onChange={e => setForm(f => ({ ...f, tel: e.target.value }))}
              />
            </div>
          </div>

          {!editing && (
            <>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Identifiant</label>
                <Input
                  required
                  value={form.username}
                  onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                  autoComplete="off"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Mot de passe</label>
                  <Input
                    required
                    type={showPwd ? 'text' : 'password'}
                    value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    autoComplete="new-password"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Confirmation</label>
                  <Input
                    required
                    type={showPwd ? 'text' : 'password'}
                    value={form.confirmationPassword}
                    onChange={e => setForm(f => ({ ...f, confirmationPassword: e.target.value }))}
                    autoComplete="new-password"
                  />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <input type="checkbox" checked={showPwd} onChange={e => setShowPwd(e.target.checked)} />
                Afficher les mots de passe
              </label>
              <p className="text-xs text-slate-500">
                Min. 7 caractères, 1 majuscule, 1 caractère spécial.
              </p>
            </>
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

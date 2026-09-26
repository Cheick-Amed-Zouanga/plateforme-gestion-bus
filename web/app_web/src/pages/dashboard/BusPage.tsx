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

interface Bus {
  id: number
  immatriculation: string
  type_bus: 'STANDARD' | 'VIP'
  type_bus_display: string
  capacite: number
  sieges_count: number
  actif: boolean
}

const EMPTY_FORM = {
  immatriculation: '',
  type_bus: 'STANDARD' as 'STANDARD' | 'VIP',
  capacite: '',
}

export default function BusPage() {
  const { userRole, userEmail, handleLogout, isSuperAdmin, hasPermission } = useDashboardUser()
  const canCreate = !isSuperAdmin && hasPermission('bus.create')
  const canUpdate = !isSuperAdmin && hasPermission('bus.update')
  const canDelete = !isSuperAdmin && (hasPermission('bus.delete') || hasPermission('bus.update'))
  const [busList, setBusList] = useState<Bus[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Bus | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const charger = useCallback(() => {
    setLoading(true)
    setError(null)
    apiFetch('/transport/bus/')
      .then(data => setBusList(Array.isArray(data) ? data : data.results || []))
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

  function ouvrirEdition(b: Bus) {
    setEditing(b)
    setForm({
      immatriculation: b.immatriculation,
      type_bus: b.type_bus,
      capacite: String(b.capacite),
    })
    setFormError(null)
    setModalOpen(true)
  }

  async function enregistrer(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setFormError(null)

    const capacite = Number(form.capacite)
    if (!form.immatriculation.trim()) {
      setFormError("L'immatriculation est obligatoire.")
      setSaving(false)
      return
    }
    if (!capacite || capacite < 1) {
      setFormError('La capacité doit être au moins 1.')
      setSaving(false)
      return
    }

    const payload = {
      immatriculation: form.immatriculation.trim().toUpperCase(),
      type_bus: form.type_bus,
      capacite,
    }

    try {
      if (editing) {
        await apiFetch(`/transport/bus/${editing.id}/`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        })
      } else {
        await apiFetch('/transport/bus/', {
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

  async function desactiver(b: Bus) {
    if (!window.confirm(`Désactiver le bus ${b.immatriculation} ?`)) return
    try {
      await apiFetch(`/transport/bus/${b.id}/`, { method: 'DELETE' })
      charger()
    } catch (e: any) {
      setError(e.message)
    }
  }

  const actifs = busList.filter(b => b.actif)
  const placesTotal = actifs.reduce((s, b) => s + (b.sieges_count || b.capacite || 0), 0)

  const columns: Column<Bus>[] = [
    {
      key: 'immatriculation',
      label: 'Immatriculation',
      sortable: true,
      render: (v) => <span className="font-mono text-sm font-medium">{v}</span>,
    },
    {
      key: 'type_bus',
      label: 'Type',
      sortable: true,
      render: (_, row) => (
        <Badge variant={row.type_bus === 'VIP' ? 'default' : 'secondary'}>
          {row.type_bus_display || row.type_bus}
        </Badge>
      ),
    },
    {
      key: 'capacite',
      label: 'Capacité',
      sortable: true,
      render: (v, row) => (
        <span>
          {v} places
          {row.sieges_count != null && row.sieges_count !== v && (
            <span className="ml-1 text-xs text-slate-500">({row.sieges_count} sièges)</span>
          )}
        </span>
      ),
    },
    {
      key: 'sieges_count',
      label: 'Sièges',
      render: (v) => v ?? '—',
    },
    {
      key: 'actif',
      label: 'Statut',
      render: (v) => (
        <Badge variant={v ? 'success' : 'destructive'}>
          {v ? 'Actif' : 'Inactif'}
        </Badge>
      ),
    },
  ]

  if (isSuperAdmin) {
    // Super Admin plateforme n'a pas de company → message clair
  }

  return (
    <AdminLayout userRole={userRole} userEmail={userEmail} onLogout={handleLogout}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Bus</h1>
          <p className="mt-1 text-sm text-slate-600">
            Flotte de la compagnie. La capacité crée automatiquement les sièges.
          </p>
        </div>

        {isSuperAdmin && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Connectez-vous avec un compte Manager / Admin de compagnie pour gérer les bus d’un tenant.
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="text-sm text-slate-600">Bus enregistrés</div>
            <div className="mt-1 text-2xl font-bold text-slate-900">{busList.length}</div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="text-sm text-slate-600">Actifs</div>
            <div className="mt-1 text-2xl font-bold text-slate-900">{actifs.length}</div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="text-sm text-slate-600">Places (sièges)</div>
            <div className="mt-1 text-2xl font-bold text-slate-900">{placesTotal}</div>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={busList}
          loading={loading}
          onAdd={canCreate ? ouvrirCreation : undefined}
          onEdit={canUpdate ? ouvrirEdition : undefined}
          onDelete={canDelete ? (b) => { if (b.actif) desactiver(b) } : undefined}
          emptyMessage="Aucun bus. Ajoutez le premier véhicule de la flotte."
        />
      </div>

      <SimpleModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Modifier le bus' : 'Nouveau bus'}
      >
        <form onSubmit={enregistrer} className="space-y-4">
          {formError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {formError}
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Immatriculation</label>
            <Input
              required
              value={form.immatriculation}
              onChange={e => setForm(f => ({ ...f, immatriculation: e.target.value }))}
              placeholder="BF-1234-A"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Type</label>
            <select
              className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-950"
              value={form.type_bus}
              onChange={e => setForm(f => ({
                ...f,
                type_bus: e.target.value as 'STANDARD' | 'VIP',
              }))}
            >
              <option value="STANDARD">Standard</option>
              <option value="VIP">VIP</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Capacité (nombre de places)
            </label>
            <Input
              required
              type="number"
              min={1}
              max={200}
              value={form.capacite}
              onChange={e => setForm(f => ({ ...f, capacite: e.target.value }))}
              placeholder="45"
            />
            {Number(form.capacite) > 0 && (
              <p className="mt-1.5 text-xs text-emerald-600">
                {editing
                  ? `${form.capacite} sièges seront synchronisés.`
                  : `${form.capacite} sièges seront créés automatiquement.`}
              </p>
            )}
          </div>

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

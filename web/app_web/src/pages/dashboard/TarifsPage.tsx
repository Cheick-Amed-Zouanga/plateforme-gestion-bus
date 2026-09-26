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

interface Tarif {
  id: number
  ligne: number
  ligne_display: string
  arret_depart: number
  arret_depart_ville: string
  arret_arrivee: number
  arret_arrivee_ville: string
  type_bus: 'STANDARD' | 'VIP'
  type_bus_display: string
  prix: number
  devise: string
}

interface LigneOpt {
  id: number
  code: string
  nom: string
  active: boolean
  depart?: string
  arrivee?: string
}

interface ArretOpt {
  id: number
  ordre: number
  ville: string
}

export default function TarifsPage() {
  const { userRole, userEmail, handleLogout, isSuperAdmin, hasPermission } = useDashboardUser()
  const canCreate = !isSuperAdmin && hasPermission('tarif.create')
  const canUpdate = !isSuperAdmin && hasPermission('tarif.update')
  const canDelete = !isSuperAdmin && hasPermission('tarif.delete')
  const [tarifs, setTarifs] = useState<Tarif[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Tarif | null>(null)
  const [lignes, setLignes] = useState<LigneOpt[]>([])
  const [arrets, setArrets] = useState<ArretOpt[]>([])
  const [loadingArrets, setLoadingArrets] = useState(false)
  const [form, setForm] = useState({
    ligne: '',
    arret_depart: '',
    arret_arrivee: '',
    type_bus: 'STANDARD' as 'STANDARD' | 'VIP',
    prix: '',
    devise: 'XOF',
  })
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const charger = useCallback(() => {
    setLoading(true)
    setError(null)
    Promise.all([
      apiFetch('/transport/tarifs/'),
      apiFetch('/transport/lignes/'),
    ])
      .then(([t, l]) => {
        setTarifs(Array.isArray(t) ? t : t.results || [])
        setLignes((Array.isArray(l) ? l : l.results || []).filter((x: LigneOpt) => x.active !== false))
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { charger() }, [charger])

  function ouvrirCreation() {
    setEditing(null)
    setForm({
      ligne: '',
      arret_depart: '',
      arret_arrivee: '',
      type_bus: 'STANDARD',
      prix: '',
      devise: 'XOF',
    })
    setArrets([])
    setFormError(null)
    setModalOpen(true)
    if (lignes.length === 0) {
      apiFetch('/transport/lignes/')
        .then(l => setLignes((Array.isArray(l) ? l : l.results || []).filter((x: LigneOpt) => x.active !== false)))
        .catch(e => setFormError(e.message))
    }
  }

  function ouvrirEdition(t: Tarif) {
    setEditing(t)
    setForm({
      ligne: String(t.ligne),
      arret_depart: String(t.arret_depart),
      arret_arrivee: String(t.arret_arrivee),
      type_bus: t.type_bus,
      prix: String(t.prix),
      devise: t.devise || 'XOF',
    })
    setFormError(null)
    setModalOpen(true)
  }

  async function chargerArrets(ligneId: string) {
    setArrets([])
    if (!ligneId) return
    setLoadingArrets(true)
    try {
      const detail = await apiFetch(`/transport/lignes/${ligneId}/`)
      setArrets(detail.arrets || [])
    } catch (e: any) {
      setFormError(e.message)
    } finally {
      setLoadingArrets(false)
    }
  }

  async function handleLigneChange(ligneId: string) {
    setForm(f => ({ ...f, ligne: ligneId, arret_depart: '', arret_arrivee: '' }))
    setFormError(null)
    await chargerArrets(ligneId)
  }

  const arretsArrivee = form.arret_depart
    ? arrets.filter(a => {
        const dep = arrets.find(x => String(x.id) === form.arret_depart)
        return dep ? a.ordre > dep.ordre : false
      })
    : []

  async function enregistrer(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setFormError(null)

    const prix = Number(form.prix)
    if (editing) {
      if (Number.isNaN(prix) || prix < 0) {
        setFormError('Prix invalide.')
        setSaving(false)
        return
      }
      try {
        await apiFetch(`/transport/tarifs/${editing.id}/`, {
          method: 'PATCH',
          body: JSON.stringify({ prix, devise: form.devise || 'XOF' }),
        })
        setModalOpen(false)
        charger()
      } catch (err: any) {
        setFormError(err.message)
      } finally {
        setSaving(false)
      }
      return
    }

    if (!form.ligne || !form.arret_depart || !form.arret_arrivee) {
      setFormError('Ligne et segment (départ → arrivée) sont obligatoires.')
      setSaving(false)
      return
    }
    if (Number.isNaN(prix) || prix < 0) {
      setFormError('Le prix est obligatoire et doit être ≥ 0.')
      setSaving(false)
      return
    }

    try {
      await apiFetch('/transport/tarifs/', {
        method: 'POST',
        body: JSON.stringify({
          ligne: Number(form.ligne),
          arret_depart: Number(form.arret_depart),
          arret_arrivee: Number(form.arret_arrivee),
          type_bus: form.type_bus,
          prix,
          devise: form.devise || 'XOF',
        }),
      })
      setModalOpen(false)
      charger()
    } catch (err: any) {
      setFormError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function supprimer(t: Tarif) {
    const label = `${t.arret_depart_ville} → ${t.arret_arrivee_ville} / ${t.type_bus_display}`
    if (!window.confirm(`Supprimer le tarif ${label} ?`)) return
    try {
      await apiFetch(`/transport/tarifs/${t.id}/`, { method: 'DELETE' })
      setTarifs(prev => prev.filter(x => x.id !== t.id))
    } catch (e: any) {
      setError(e.message)
    }
  }

  const columns: Column<Tarif>[] = [
    { key: 'ligne_display', label: 'Ligne', sortable: true },
    {
      key: 'arret_depart_ville',
      label: 'Segment',
      render: (_, row) => (
        <span className="text-sm font-medium">
          {row.arret_depart_ville} → {row.arret_arrivee_ville}
        </span>
      ),
    },
    {
      key: 'type_bus',
      label: 'Type',
      render: (_, row) => (
        <Badge variant={row.type_bus === 'VIP' ? 'default' : 'secondary'}>
          {row.type_bus_display || row.type_bus}
        </Badge>
      ),
    },
    {
      key: 'prix',
      label: 'Prix',
      sortable: true,
      render: (v, row) => (
        <span className="font-semibold tabular-nums">
          {Number(v).toLocaleString('fr-FR')} {row.devise}
        </span>
      ),
    },
  ]

  return (
    <AdminLayout userRole={userRole} userEmail={userEmail} onLogout={handleLogout}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tarifs</h1>
          <p className="mt-1 text-sm text-slate-600">
            Prix par segment de ligne et type de bus (Standard / VIP).
          </p>
        </div>

        {isSuperAdmin && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Connectez-vous avec un Manager / Admin de compagnie pour gérer les tarifs.
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="text-sm text-slate-600">Tarifs définis</div>
            <div className="mt-1 text-2xl font-bold text-slate-900">{tarifs.length}</div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="text-sm text-slate-600">Standard</div>
            <div className="mt-1 text-2xl font-bold text-slate-900">
              {tarifs.filter(t => t.type_bus === 'STANDARD').length}
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="text-sm text-slate-600">VIP</div>
            <div className="mt-1 text-2xl font-bold text-slate-900">
              {tarifs.filter(t => t.type_bus === 'VIP').length}
            </div>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={tarifs}
          loading={loading}
          onAdd={canCreate ? ouvrirCreation : undefined}
          onEdit={canUpdate ? ouvrirEdition : undefined}
          onDelete={canDelete ? supprimer : undefined}
          emptyMessage="Aucun tarif. Définissez le prix d’un segment."
        />
      </div>

      <SimpleModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Modifier le tarif' : 'Nouveau tarif'}
        wide
      >
        <form onSubmit={enregistrer} className="space-y-4">
          {formError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {formError}
            </div>
          )}

          {!editing && (
            <>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Ligne</label>
                <select
                  required
                  className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                  value={form.ligne}
                  onChange={e => handleLigneChange(e.target.value)}
                >
                  <option value="">
                    {lignes.length === 0 ? 'Chargement des lignes…' : '— Sélectionner —'}
                  </option>
                  {lignes.map(l => (
                    <option key={l.id} value={l.id}>
                      {l.code} — {l.nom}
                      {l.depart && l.arrivee ? ` (${l.depart} → ${l.arrivee})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {loadingArrets && (
                <p className="text-sm text-slate-500">Chargement des arrêts…</p>
              )}

              {arrets.length > 0 && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">Départ</label>
                    <select
                      required
                      className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                      value={form.arret_depart}
                      onChange={e => setForm(f => ({
                        ...f,
                        arret_depart: e.target.value,
                        arret_arrivee: '',
                      }))}
                    >
                      <option value="">— Ville départ —</option>
                      {arrets.slice(0, -1).map(a => (
                        <option key={a.id} value={a.id}>{a.ordre}. {a.ville}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">Arrivée</label>
                    <select
                      required
                      disabled={!form.arret_depart}
                      className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm disabled:opacity-50"
                      value={form.arret_arrivee}
                      onChange={e => setForm(f => ({ ...f, arret_arrivee: e.target.value }))}
                    >
                      <option value="">— Ville arrivée —</option>
                      {arretsArrivee.map(a => (
                        <option key={a.id} value={a.id}>{a.ordre}. {a.ville}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Type de bus</label>
                <select
                  className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
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
            </>
          )}

          {editing && (
            <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
              {editing.ligne_display} · {editing.arret_depart_ville} → {editing.arret_arrivee_ville} ·{' '}
              {editing.type_bus_display}
            </p>
          )}

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-slate-700">Prix</label>
              <Input
                required
                type="number"
                min={0}
                value={form.prix}
                onChange={e => setForm(f => ({ ...f, prix: e.target.value }))}
                placeholder="5000"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Devise</label>
              <Input
                value={form.devise}
                onChange={e => setForm(f => ({ ...f, devise: e.target.value }))}
              />
            </div>
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

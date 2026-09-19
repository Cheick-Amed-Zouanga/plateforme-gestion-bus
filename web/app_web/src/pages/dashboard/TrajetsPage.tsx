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
import BusSeatPlan from '@/shared/components/BusSeatPlan'

interface Trajet {
  id: number
  ligne: number
  ligne_display: string
  bus: number
  bus_display: string
  type_bus: string
  depart_prevu: string
  arrivee_prevue: string | null
  statut: string
  statut_display: string
  horaire?: number | null
}

interface Horaire {
  id: number
  ligne: number
  ligne_display: string
  heure_depart: string
  jours_list: number[]
  jours_labels: string[]
  type_bus: string
  type_bus_display: string
  bus_defaut: number | null
  bus_defaut_display: string | null
  actif: boolean
  duree_estimee_min: number | null
  date_debut?: string | null
  date_fin?: string | null
}

interface LigneOpt {
  id: number
  code: string
  nom: string
  active: boolean
  depart?: string
  arrivee?: string
}

interface BusOpt {
  id: number
  immatriculation: string
  type_bus: string
  type_bus_display: string
  capacite: number
  actif: boolean
}

interface SeatPlanItem {
  id: number
  numero: number
  etat: string
  passager?: string | null
  segment?: string
}

const STATUTS = [
  { val: 'PLANIFIE', label: 'Planifié', variant: 'info' as const },
  { val: 'EN_COURS', label: 'En cours', variant: 'warning' as const },
  { val: 'TERMINE', label: 'Terminé', variant: 'success' as const },
  { val: 'ANNULE', label: 'Annulé', variant: 'destructive' as const },
]

const JOURS = [
  { val: 0, label: 'Lun' },
  { val: 1, label: 'Mar' },
  { val: 2, label: 'Mer' },
  { val: 3, label: 'Jeu' },
  { val: 4, label: 'Ven' },
  { val: 5, label: 'Sam' },
  { val: 6, label: 'Dim' },
]

function fmt(dt: string | null) {
  if (!dt) return '—'
  return new Date(dt).toLocaleString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function fmtHeure(t: string | null) {
  if (!t) return '—'
  return String(t).slice(0, 5)
}

const emptyHoraireForm = {
  ligne: '',
  heure_depart: '08:00',
  jours: [0, 1, 2, 3, 4, 5, 6] as number[],
  type_bus: 'STANDARD',
  bus_defaut: '',
  duree_estimee_min: '',
  date_debut: '',
  date_fin: '',
  actif: true,
}

function formFromHoraire(h: Horaire): typeof emptyHoraireForm {
  return {
    ligne: String(h.ligne),
    heure_depart: fmtHeure(h.heure_depart),
    jours: Array.isArray(h.jours_list) && h.jours_list.length ? [...h.jours_list] : [0, 1, 2, 3, 4, 5, 6],
    type_bus: h.type_bus || 'STANDARD',
    bus_defaut: h.bus_defaut ? String(h.bus_defaut) : '',
    duree_estimee_min: h.duree_estimee_min != null ? String(h.duree_estimee_min) : '',
    date_debut: h.date_debut || '',
    date_fin: h.date_fin || '',
    actif: h.actif !== false,
  }
}

export default function TrajetsPage() {
  const { userRole, userEmail, handleLogout, isSuperAdmin, hasPermission } = useDashboardUser()
  const canViewPlan = isSuperAdmin || hasPermission('billet.read')
  const canCreate = !isSuperAdmin && hasPermission('trajet.create')
  const canUpdate = !isSuperAdmin && hasPermission('trajet.update')
  const canDelete = !isSuperAdmin && hasPermission('trajet.delete')

  const [onglet, setOnglet] = useState<'horaires' | 'trajets'>('horaires')
  const [trajets, setTrajets] = useState<Trajet[]>([])
  const [horaires, setHoraires] = useState<Horaire[]>([])
  const [lignes, setLignes] = useState<LigneOpt[]>([])
  const [busList, setBusList] = useState<BusOpt[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filtre, setFiltre] = useState('TOUS')

  const [modalOpen, setModalOpen] = useState(false)
  const [editHoraire, setEditHoraire] = useState<Horaire | null>(null)
  const [form, setForm] = useState(emptyHoraireForm)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const [planTrajet, setPlanTrajet] = useState<Trajet | null>(null)
  const [plan, setPlan] = useState<SeatPlanItem[]>([])
  const [planStats, setPlanStats] = useState<Record<string, number> | null>(null)
  const [loadingPlan, setLoadingPlan] = useState(false)
  const [planError, setPlanError] = useState<string | null>(null)

  const charger = useCallback(() => {
    setLoading(true)
    setError(null)
    Promise.all([
      apiFetch('/transport/horaires/'),
      apiFetch('/transport/trajets/'),
      apiFetch('/transport/lignes/'),
      apiFetch('/transport/bus/'),
    ])
      .then(([h, t, l, b]) => {
        setHoraires(Array.isArray(h) ? h : h.results || [])
        setTrajets(Array.isArray(t) ? t : t.results || [])
        setLignes((Array.isArray(l) ? l : l.results || []).filter((x: LigneOpt) => x.active !== false))
        setBusList((Array.isArray(b) ? b : b.results || []).filter((x: BusOpt) => x.actif !== false))
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { charger() }, [charger])

  function ouvrirCreation() {
    setEditHoraire(null)
    setForm(emptyHoraireForm)
    setFormError(null)
    setModalOpen(true)
  }

  function ouvrirEdition(h: Horaire) {
    setEditHoraire(h)
    setForm(formFromHoraire(h))
    setFormError(null)
    setModalOpen(true)
  }

  async function ouvrirPlan(t: Trajet) {
    setPlanTrajet(t)
    setPlan([])
    setPlanStats(null)
    setPlanError(null)
    setLoadingPlan(true)
    try {
      const data = await apiFetch(`/billets/trajets/${t.id}/plan/`)
      setPlan(data.plan ?? [])
      setPlanStats(data.stats ?? null)
    } catch (e: any) {
      setPlanError(e.message)
    } finally {
      setLoadingPlan(false)
    }
  }

  async function enregistrer(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setFormError(null)
    if (!form.ligne || !form.heure_depart || !form.jours.length) {
      setFormError('Ligne, heure et au moins un jour sont obligatoires.')
      setSaving(false)
      return
    }
    try {
      const body: Record<string, unknown> = {
        ligne: Number(form.ligne),
        heure_depart: form.heure_depart.length === 5 ? `${form.heure_depart}:00` : form.heure_depart,
        jours: form.jours,
        type_bus: form.type_bus,
        actif: !!form.actif,
        bus_defaut: form.bus_defaut ? Number(form.bus_defaut) : null,
        duree_estimee_min: form.duree_estimee_min ? Number(form.duree_estimee_min) : null,
        date_debut: form.date_debut || null,
        date_fin: form.date_fin || null,
      }
      if (editHoraire) {
        await apiFetch(`/transport/horaires/${editHoraire.id}/`, {
          method: 'PATCH',
          body: JSON.stringify(body),
        })
      } else {
        await apiFetch('/transport/horaires/', {
          method: 'POST',
          body: JSON.stringify(body),
        })
      }
      setModalOpen(false)
      setEditHoraire(null)
      setOnglet('horaires')
      charger()
    } catch (err: any) {
      setFormError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function genererHoraire(h: Horaire) {
    try {
      const res = await apiFetch(`/transport/horaires/${h.id}/generer/`, {
        method: 'POST',
        body: JSON.stringify({}),
      })
      alert(res.message || 'Prochains départs prêts.')
      charger()
    } catch (e: any) {
      setError(e.message)
    }
  }

  async function toggleActif(h: Horaire) {
    try {
      await apiFetch(`/transport/horaires/${h.id}/`, {
        method: 'PATCH',
        body: JSON.stringify({ actif: !h.actif }),
      })
      charger()
    } catch (e: any) {
      setError(e.message)
    }
  }

  async function supprimerHoraire(h: Horaire) {
    if (!window.confirm(`Supprimer l'horaire ${h.ligne_display} ${fmtHeure(h.heure_depart)} ?`)) return
    try {
      await apiFetch(`/transport/horaires/${h.id}/`, { method: 'DELETE' })
      charger()
    } catch (e: any) {
      setError(e.message)
    }
  }

  async function changerStatut(t: Trajet, statut: string) {
    try {
      await apiFetch(`/transport/trajets/${t.id}/`, {
        method: 'PATCH',
        body: JSON.stringify({ statut }),
      })
      charger()
    } catch (e: any) {
      setError(e.message)
    }
  }

  async function supprimer(t: Trajet) {
    if (!window.confirm(`Supprimer ce trajet (${t.ligne_display}) ?`)) return
    try {
      await apiFetch(`/transport/trajets/${t.id}/`, { method: 'DELETE' })
      charger()
    } catch (e: any) {
      setError(e.message)
    }
  }

  const filtres = filtre === 'TOUS' ? trajets : trajets.filter(t => t.statut === filtre)
  const busFiltres = busList.filter(b => b.type_bus === form.type_bus)

  const columnsHoraires: Column<Horaire>[] = [
    { key: 'ligne_display', label: 'Ligne', sortable: true },
    {
      key: 'heure_depart',
      label: 'Heure',
      render: v => <strong>{fmtHeure(v)}</strong>,
    },
    {
      key: 'jours_labels',
      label: 'Jours',
      render: v => (Array.isArray(v) ? v.join(', ') : '—'),
    },
    { key: 'type_bus_display', label: 'Type' },
    {
      key: 'bus_defaut_display',
      label: 'Bus défaut',
      render: v => v || 'Auto',
    },
    {
      key: 'actif',
      label: 'Statut',
      render: (v, row) => (
        <Badge variant={v ? 'success' : 'destructive'}>{v ? 'Actif' : 'Inactif'}</Badge>
      ),
    },
    {
      key: 'id',
      label: 'Actions',
      render: (_v, row) => (
        <div className="flex flex-wrap gap-2">
          {canUpdate && (
            <Button type="button" variant="outline" size="sm" onClick={() => ouvrirEdition(row)}>
              Modifier
            </Button>
          )}
          {canCreate && (
            <Button type="button" variant="outline" size="sm" onClick={() => genererHoraire(row)}>
              Préparer départs
            </Button>
          )}
          {canUpdate && (
            <Button type="button" variant="outline" size="sm" onClick={() => toggleActif(row)}>
              {row.actif ? 'Désactiver' : 'Activer'}
            </Button>
          )}
          {canDelete && (
            <Button type="button" variant="destructive" size="sm" onClick={() => supprimerHoraire(row)}>
              Supprimer
            </Button>
          )}
        </div>
      ),
    },
  ]

  const columns: Column<Trajet>[] = [
    { key: 'ligne_display', label: 'Ligne', sortable: true },
    {
      key: 'bus_display',
      label: 'Bus',
      render: (v, row) => (
        <span className="font-mono text-sm">{v} <span className="text-slate-500">({row.type_bus})</span></span>
      ),
    },
    {
      key: 'depart_prevu',
      label: 'Départ',
      sortable: true,
      render: v => fmt(v),
    },
    {
      key: 'arrivee_prevue',
      label: 'Arrivée',
      render: v => fmt(v),
    },
    {
      key: 'statut',
      label: 'Statut',
      render: (v, row) => {
        const meta = STATUTS.find(s => s.val === v)
        return (
          <div className="flex items-center gap-2">
            <Badge variant={meta?.variant || 'secondary'}>
              {row.statut_display || meta?.label || v}
            </Badge>
            {!isSuperAdmin && canUpdate && v !== 'TERMINE' && (
              <select
                className="rounded border border-slate-200 px-1 py-0.5 text-xs"
                value={v}
                onChange={e => changerStatut(row, e.target.value)}
              >
                {STATUTS.map(s => (
                  <option key={s.val} value={s.val}>{s.label}</option>
                ))}
              </select>
            )}
          </div>
        )
      },
    },
    ...(canViewPlan
      ? [{
          key: 'id' as keyof Trajet,
          label: 'Places',
          render: (_: unknown, row: Trajet) => (
            <Button type="button" variant="outline" size="sm" onClick={() => ouvrirPlan(row)}>
              Plan du bus
            </Button>
          ),
        }]
      : []),
  ]

  return (
    <AdminLayout userRole={userRole} userEmail={userEmail} onLogout={handleLogout}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Horaires & trajets</h1>
          <p className="mt-1 text-sm text-slate-600">
            Un horaire (ex. 08:00 tous les jours) s&apos;applique directement sur la ligne.
            Heure locale Burkina Faso (Ouagadougou).
          </p>
        </div>

        {isSuperAdmin && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Connectez-vous avec un Manager / Admin de compagnie pour gérer les horaires.
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant={onglet === 'horaires' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setOnglet('horaires')}
          >
            Horaires ({horaires.length})
          </Button>
          <Button
            type="button"
            variant={onglet === 'trajets' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setOnglet('trajets')}
          >
            Trajets générés ({trajets.length})
          </Button>
        </div>

        {onglet === 'trajets' && (
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant={filtre === 'TOUS' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFiltre('TOUS')}
            >
              Tous ({trajets.length})
            </Button>
            {STATUTS.map(s => {
              const n = trajets.filter(t => t.statut === s.val).length
              return (
                <Button
                  key={s.val}
                  type="button"
                  variant={filtre === s.val ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFiltre(s.val)}
                >
                  {s.label} ({n})
                </Button>
              )
            })}
          </div>
        )}

        {onglet === 'horaires' ? (
          <DataTable
            columns={columnsHoraires}
            data={horaires}
            loading={loading}
            onAdd={canCreate ? ouvrirCreation : undefined}
            emptyMessage="Aucun horaire. Créez le premier horaire récurrent."
          />
        ) : (
          <DataTable
            columns={columns}
            data={filtres}
            loading={loading}
            onAdd={canCreate ? ouvrirCreation : undefined}
            onDelete={canDelete ? supprimer : undefined}
            emptyMessage="Aucun trajet. Créez un horaire pour générer des départs."
          />
        )}
      </div>

      <SimpleModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditHoraire(null) }}
        title={editHoraire ? "Modifier l'horaire" : 'Nouvel horaire récurrent'}
      >
        <form onSubmit={enregistrer} className="space-y-4">
          {formError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {formError}
            </div>
          )}
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Ligne</label>
            <select
              required
              className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
              value={form.ligne}
              onChange={e => setForm(f => ({ ...f, ligne: e.target.value }))}
            >
              <option value="">— Sélectionner —</option>
              {lignes.map(l => (
                <option key={l.id} value={l.id}>
                  {l.code} — {l.nom}
                  {l.depart && l.arrivee ? ` (${l.depart} → ${l.arrivee})` : ''}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Heure de départ</label>
            <Input
              required
              type="time"
              value={form.heure_depart}
              onChange={e => setForm(f => ({ ...f, heure_depart: e.target.value }))}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Jours</label>
            <div className="flex flex-wrap gap-2">
              {JOURS.map(j => {
                const active = form.jours.includes(j.val)
                return (
                  <button
                    key={j.val}
                    type="button"
                    className={`rounded-md border px-2 py-1 text-xs font-semibold ${
                      active
                        ? 'border-blue-500 bg-blue-50 text-blue-800'
                        : 'border-slate-200 bg-white text-slate-600'
                    }`}
                    onClick={() =>
                      setForm(f => ({
                        ...f,
                        jours: active
                          ? f.jours.filter(x => x !== j.val)
                          : [...f.jours, j.val].sort(),
                      }))
                    }
                  >
                    {j.label}
                  </button>
                )
              })}
              <button
                type="button"
                className="rounded-md bg-emerald-500 px-2 py-1 text-xs font-semibold text-white"
                onClick={() => setForm(f => ({ ...f, jours: [0, 1, 2, 3, 4, 5, 6] }))}
              >
                Tous
              </button>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Type de bus</label>
            <select
              className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
              value={form.type_bus}
              onChange={e => setForm(f => ({ ...f, type_bus: e.target.value, bus_defaut: '' }))}
            >
              <option value="STANDARD">Standard</option>
              <option value="VIP">VIP</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Bus par défaut (optionnel)</label>
            <select
              className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
              value={form.bus_defaut}
              onChange={e => setForm(f => ({ ...f, bus_defaut: e.target.value }))}
            >
              <option value="">— Auto —</option>
              {busFiltres.map(b => (
                <option key={b.id} value={b.id}>
                  {b.immatriculation} — {b.type_bus_display} ({b.capacite} places)
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Durée estimée min (optionnel)</label>
            <Input
              type="number"
              min={1}
              value={form.duree_estimee_min}
              onChange={e => setForm(f => ({ ...f, duree_estimee_min: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Valide à partir du</label>
              <Input
                type="date"
                value={form.date_debut}
                onChange={e => setForm(f => ({ ...f, date_debut: e.target.value }))}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Valide jusqu&apos;au</label>
              <Input
                type="date"
                value={form.date_fin}
                onChange={e => setForm(f => ({ ...f, date_fin: e.target.value }))}
              />
            </div>
          </div>
          {editHoraire && (
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                checked={!!form.actif}
                onChange={e => setForm(f => ({ ...f, actif: e.target.checked }))}
              />
              Horaire actif
            </label>
          )}
          <p className="text-xs text-slate-500">
            Ex. : 08:00 tous les jours sur cette ligne (heure Burkina). Les départs apparaissent à la recherche / vente.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => { setModalOpen(false); setEditHoraire(null) }}>
              Annuler
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Enregistrement…' : editHoraire ? 'Enregistrer' : "Créer l'horaire"}
            </Button>
          </div>
        </form>
      </SimpleModal>

      <SimpleModal
        open={!!planTrajet}
        wide
        onClose={() => setPlanTrajet(null)}
        title={
          planTrajet
            ? `Plan du bus — ${planTrajet.bus_display} · ${planTrajet.ligne_display}`
            : 'Plan du bus'
        }
      >
        {planTrajet && (
          <p className="mb-4 text-center text-sm text-slate-600">
            Départ {fmt(planTrajet.depart_prevu)}
          </p>
        )}
        {loadingPlan && (
          <p className="text-center text-sm text-slate-500">Chargement du plan…</p>
        )}
        {planError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {planError}
          </div>
        )}
        {!loadingPlan && !planError && (
          <BusSeatPlan plan={plan} stats={planStats} selectableOnlyLibre={false} />
        )}
      </SimpleModal>
    </AdminLayout>
  )
}

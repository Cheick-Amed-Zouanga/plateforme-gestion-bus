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

const VILLES = [
  // Sénégal
  'Dakar', 'Thiès', 'Saint-Louis', 'Kaolack', 'Ziguinchor',
  'Tambacounda', 'Mbour', 'Rufisque', 'Diourbel', 'Louga',
  'Kolda', 'Fatick', 'Matam', 'Kédougou', 'Sédhiou',
  // Burkina Faso (lignes historiques / multi-pays)
  'Ouagadougou', 'Bobo-Dioulasso', 'Koudougou', 'Banfora', 'Ouahigouya',
  "Fada N'Gourma", 'Dédougou', 'Kaya', 'Tenkodogo', 'Gaoua',
  'Ziniaré', 'Kongoussi', 'Réo', 'Houndé', 'Diébougou',
  'Léo', 'Manga', 'Toma', 'Nouna', 'Tougan', 'Pô', 'Bogandé', 'Gayéri',
  'Sebba', 'Titao',
].sort()

interface Ligne {
  id: number
  nom: string
  code: string
  active: boolean
  date_creation: string
  nb_arrets: number
  depart: string | null
  arrivee: string | null
}

interface ArretPotentiel {
  ville: string
  latitude: number
  longitude: number
  distance_depuis_depart_km?: number
  duree_depuis_depart_min?: number
}

export default function LignesPage() {
  const { userRole, userEmail, handleLogout, isSuperAdmin, hasPermission } = useDashboardUser()
  const canCreate = !isSuperAdmin && hasPermission('ligne.create')
  const canDelete = !isSuperAdmin && (hasPermission('ligne.delete') || hasPermission('ligne.update'))
  const [lignes, setLignes] = useState<Ligne[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [modalOpen, setModalOpen] = useState(false)
  const [step, setStep] = useState<1 | 2>(1)
  const [form, setForm] = useState({
    nom: '',
    description: '',
    ville_depart: '',
    ville_arrivee: '',
  })
  const [arretsPotentiels, setArretsPotentiels] = useState<ArretPotentiel[]>([])
  const [selected, setSelected] = useState<Record<string, boolean>>({})
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const charger = useCallback(() => {
    setLoading(true)
    setError(null)
    apiFetch('/transport/lignes/')
      .then(data => setLignes(Array.isArray(data) ? data : data.results || []))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { charger() }, [charger])

  function ouvrirCreation() {
    setStep(1)
    setForm({ nom: '', description: '', ville_depart: '', ville_arrivee: '' })
    setArretsPotentiels([])
    setSelected({})
    setFormError(null)
    setModalOpen(true)
  }

  async function chercherArrets(e: React.FormEvent) {
    e.preventDefault()
    setFormError(null)
    if (!form.nom.trim() || !form.ville_depart || !form.ville_arrivee) {
      setFormError('Nom, départ et arrivée sont obligatoires.')
      return
    }
    if (form.ville_depart === form.ville_arrivee) {
      setFormError('Départ et arrivée doivent être différents.')
      return
    }
    setSaving(true)
    try {
      const data = await apiFetch('/transport/lignes/arrets-potentiels/', {
        method: 'POST',
        body: JSON.stringify({
          ville_depart: form.ville_depart,
          ville_arrivee: form.ville_arrivee,
        }),
      })
      const list: ArretPotentiel[] = data.arrets_potentiels || []
      setArretsPotentiels(list)
      const sel: Record<string, boolean> = {}
      list.forEach(a => { sel[a.ville] = false })
      setSelected(sel)
      setStep(2)
    } catch (err: any) {
      setFormError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function creerLigne() {
    setSaving(true)
    setFormError(null)
    try {
      const arrets = arretsPotentiels
        .filter(a => selected[a.ville])
        .map(a => ({
          ville: a.ville,
          duree_montee_passagers: 5,
          duree_descente_passagers: 5,
          duree_pause: 0,
        }))
      await apiFetch('/transport/lignes/', {
        method: 'POST',
        body: JSON.stringify({
          nom: form.nom.trim(),
          description: form.description.trim(),
          ville_depart: form.ville_depart,
          ville_arrivee: form.ville_arrivee,
          arrets,
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

  async function desactiver(l: Ligne) {
    if (!window.confirm(`Désactiver la ligne « ${l.nom} » ?`)) return
    try {
      await apiFetch(`/transport/lignes/${l.id}/desactiver/`, { method: 'POST' })
      charger()
    } catch (e: any) {
      setError(e.message)
    }
  }

  const columns: Column<Ligne>[] = [
    {
      key: 'code',
      label: 'Code',
      sortable: true,
      render: v => <span className="font-mono text-sm">{v}</span>,
    },
    { key: 'nom', label: 'Nom', sortable: true },
    {
      key: 'depart',
      label: 'Itinéraire',
      render: (_, row) => (
        <span className="text-sm">
          {row.depart || '—'} → {row.arrivee || '—'}
        </span>
      ),
    },
    { key: 'nb_arrets', label: 'Arrêts' },
    {
      key: 'active',
      label: 'Statut',
      render: v => (
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
          <h1 className="text-2xl font-bold text-slate-900">Lignes</h1>
          <p className="mt-1 text-sm text-slate-600">
            Itinéraires de la compagnie (départ → arrêts → arrivée).
          </p>
        </div>

        {isSuperAdmin && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Connectez-vous avec un Manager / Admin de compagnie pour gérer les lignes.
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="text-sm text-slate-600">Total lignes</div>
            <div className="mt-1 text-2xl font-bold text-slate-900">{lignes.length}</div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="text-sm text-slate-600">Actives</div>
            <div className="mt-1 text-2xl font-bold text-slate-900">
              {lignes.filter(l => l.active).length}
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="text-sm text-slate-600">Arrêts intermédiaires</div>
            <div className="mt-1 text-2xl font-bold text-slate-900">
              {lignes.reduce((s, l) => s + (l.nb_arrets || 0), 0)}
            </div>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={lignes}
          loading={loading}
          onAdd={canCreate ? ouvrirCreation : undefined}
          onDelete={canDelete ? (l) => { if (l.active) desactiver(l) } : undefined}
          emptyMessage="Aucune ligne. Créez le premier itinéraire."
        />
      </div>

      <SimpleModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={step === 1 ? 'Nouvelle ligne — étape 1' : 'Nouvelle ligne — arrêts'}
        wide
      >
        {formError && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {formError}
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={chercherArrets} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Nom</label>
              <Input
                required
                value={form.nom}
                onChange={e => setForm(f => ({ ...f, nom: e.target.value }))}
                placeholder="Ouaga–Bobo Express"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Description</label>
              <Input
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Départ</label>
                <select
                  required
                  className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                  value={form.ville_depart}
                  onChange={e => setForm(f => ({ ...f, ville_depart: e.target.value }))}
                >
                  <option value="">— Sélectionner —</option>
                  {VILLES.filter(v => v !== form.ville_arrivee).map(v => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Arrivée</label>
                <select
                  required
                  className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                  value={form.ville_arrivee}
                  onChange={e => setForm(f => ({ ...f, ville_arrivee: e.target.value }))}
                >
                  <option value="">— Sélectionner —</option>
                  {VILLES.filter(v => v !== form.ville_depart).map(v => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Annuler</Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Recherche…' : 'Continuer →'}
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              {form.ville_depart} → {form.ville_arrivee}. Cochez les arrêts intermédiaires (optionnel).
            </p>
            <div className="max-h-64 space-y-2 overflow-y-auto rounded-lg border border-slate-200 p-3">
              {arretsPotentiels.length === 0 && (
                <p className="text-sm text-slate-500">Aucun arrêt intermédiaire suggéré — vous pouvez créer directement.</p>
              )}
              {arretsPotentiels.map(a => (
                <label key={a.ville} className="flex items-center gap-3 text-sm">
                  <input
                    type="checkbox"
                    checked={!!selected[a.ville]}
                    onChange={() => setSelected(s => ({ ...s, [a.ville]: !s[a.ville] }))}
                  />
                  <span className="font-medium">{a.ville}</span>
                  {a.distance_depuis_depart_km != null && (
                    <span className="text-slate-500">{a.distance_depuis_depart_km} km</span>
                  )}
                </label>
              ))}
            </div>
            <div className="flex justify-between gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setStep(1)}>← Retour</Button>
              <Button type="button" disabled={saving} onClick={creerLigne}>
                {saving ? 'Création…' : 'Créer la ligne'}
              </Button>
            </div>
          </div>
        )}
      </SimpleModal>
    </AdminLayout>
  )
}

import { useEffect, useState, useCallback } from 'react'
import { AdminLayout } from '@/components/shared/AdminLayout'
import { DataTable } from '@/components/shared/DataTable'
import type { Column } from '@/components/shared/DataTable'
import { Badge } from '@/components/ui/badge'
import { useDashboardUser } from '@/shared/hooks/useDashboardUser'
import apiFetch from '@/shared/services/api'

interface BilletRow {
  id: number
  numero_billet: string
  passager: string
  ligne_display: string
  bus_display: string
  siege_numero: string
  arret_depart_ville: string
  arret_arrivee_ville: string
  prix: string | number
  devise: string
  statut_billet: string
  statut_billet_display: string
  statut_paiement: string
  statut_paiement_display: string
  source_display: string
  emis_le: string
}

function badgeVariant(statut: string): 'default' | 'secondary' | 'destructive' | 'success' | 'warning' {
  if (statut === 'VALIDE' || statut === 'PAYE') return 'success'
  if (statut === 'ANNULE' || statut === 'REMBOURSE') return 'destructive'
  if (statut === 'UTILISE') return 'secondary'
  if (statut === 'EN_ATTENTE') return 'warning'
  return 'default'
}

export default function TicketsPage() {
  const { userRole, userEmail, handleLogout, isSuperAdmin } = useDashboardUser()
  const [billets, setBillets] = useState<BilletRow[]>([])
  const [total, setTotal] = useState(0)
  const [recettes, setRecettes] = useState(0)
  const [jours, setJours] = useState(90)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  let hasCompany = false
  try {
    const c = JSON.parse(localStorage.getItem('company') || 'null')
    hasCompany = Boolean(c?.id)
  } catch {
    hasCompany = false
  }

  const charger = useCallback(() => {
    setLoading(true)
    setError(null)
    apiFetch(`/billets/historique/?jours=${jours}`)
      .then(data => {
        setBillets(data.billets || [])
        setTotal(data.total_billets || 0)
        setRecettes(Number(data.total_recettes) || 0)
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [jours])

  useEffect(() => { charger() }, [charger])

  const columns: Column<BilletRow>[] = [
    {
      key: 'numero_billet',
      label: 'N° billet',
      render: (v) => <span className="font-mono text-sm">{v}</span>,
    },
    { key: 'passager', label: 'Passager' },
    {
      key: 'ligne_display',
      label: 'Trajet',
      render: (_, row) => (
        <span className="text-sm">
          {row.ligne_display}
          <span className="text-slate-500 block text-xs">
            {row.arret_depart_ville} → {row.arret_arrivee_ville}
          </span>
        </span>
      ),
    },
    {
      key: 'siege_numero',
      label: 'Siège',
      render: (v) => v || '—',
    },
    {
      key: 'prix',
      label: 'Prix',
      render: (v, row) => `${v} ${row.devise || 'XOF'}`,
    },
    {
      key: 'statut_billet',
      label: 'Billet',
      render: (_, row) => (
        <Badge variant={badgeVariant(row.statut_billet)}>
          {row.statut_billet_display || row.statut_billet}
        </Badge>
      ),
    },
    {
      key: 'statut_paiement',
      label: 'Paiement',
      render: (_, row) => (
        <Badge variant={badgeVariant(row.statut_paiement)}>
          {row.statut_paiement_display || row.statut_paiement}
        </Badge>
      ),
    },
    {
      key: 'emis_le',
      label: 'Émis le',
      render: (v) => (v ? new Date(v).toLocaleString('fr-FR') : '—'),
    },
  ]

  return (
    <AdminLayout userRole={userRole} userEmail={userEmail} onLogout={handleLogout}>
      <div className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Billets</h1>
            <p className="text-slate-600 text-sm mt-1">
              Historique des ventes — {total} billet{total !== 1 ? 's' : ''} ·{' '}
              {recettes.toLocaleString('fr-FR')} XOF (payés)
            </p>
          </div>
          <label className="text-sm text-slate-600">
            Période
            <select
              className="ml-2 border border-slate-200 rounded-md px-3 py-2 bg-white"
              value={jours}
              onChange={e => setJours(Number(e.target.value))}
            >
              <option value={30}>30 jours</option>
              <option value={90}>90 jours</option>
              <option value={180}>180 jours</option>
              <option value={365}>1 an</option>
            </select>
          </label>
        </div>

        {isSuperAdmin && !hasCompany && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Connectez-vous en Manager d’une compagnie pour voir les billets du tenant.
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        )}

        <DataTable
          columns={columns}
          data={billets}
          loading={loading}
          emptyMessage="Aucun billet sur cette période."
        />
      </div>
    </AdminLayout>
  )
}

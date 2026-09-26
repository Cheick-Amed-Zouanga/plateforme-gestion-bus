import { useEffect, useState, useCallback, useMemo } from 'react'
import { AdminLayout } from '@/components/shared/AdminLayout'
import { DataTable } from '@/components/shared/DataTable'
import type { Column } from '@/components/shared/DataTable'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useDashboardUser } from '@/shared/hooks/useDashboardUser'
import apiFetch from '@/shared/services/api'

interface PaiementRow {
  id: number
  numero_billet: string
  passager: string
  ligne_display: string
  prix: number
  devise: string
  statut_paiement: string
  statut_paiement_display: string
  mode_paiement: string
  mode_paiement_display: string
  source: string
  source_display: string
  emis_le: string
}

function badgePaiement(s: string) {
  if (s === 'PAYE') return 'success' as const
  if (s === 'REMBOURSE') return 'destructive' as const
  if (s === 'EN_ATTENTE') return 'warning' as const
  return 'secondary' as const
}

export default function PaymentsPage() {
  const { userRole, userEmail, handleLogout, isSuperAdmin, hasPermission } = useDashboardUser()
  const canSee = isSuperAdmin || hasPermission('paiement.read') || hasPermission('billet.read')

  const [rows, setRows] = useState<PaiementRow[]>([])
  const [jours, setJours] = useState(90)
  const [filtreStatut, setFiltreStatut] = useState('TOUS')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const charger = useCallback(() => {
    if (!canSee) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    apiFetch(`/billets/historique/?jours=${jours}`)
      .then(data => setRows(data.billets || []))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [jours, canSee])

  useEffect(() => { charger() }, [charger])

  const filtres = useMemo(() => {
    if (filtreStatut === 'TOUS') return rows
    return rows.filter(r => r.statut_paiement === filtreStatut)
  }, [rows, filtreStatut])

  const kpis = useMemo(() => {
    const payes = rows.filter(r => r.statut_paiement === 'PAYE')
    const attente = rows.filter(r => r.statut_paiement === 'EN_ATTENTE')
    const remb = rows.filter(r => r.statut_paiement === 'REMBOURSE')
    const sum = (list: PaiementRow[]) => list.reduce((a, r) => a + Number(r.prix || 0), 0)
    return {
      recettes: sum(payes),
      enAttente: sum(attente),
      rembourses: sum(remb),
      nPayes: payes.length,
      nAttente: attente.length,
    }
  }, [rows])

  const columns: Column<PaiementRow>[] = [
    { key: 'numero_billet', label: 'N° billet', render: v => <span className="font-mono text-sm">{v}</span> },
    { key: 'passager', label: 'Passager' },
    { key: 'ligne_display', label: 'Ligne' },
    {
      key: 'prix',
      label: 'Montant',
      render: (v, row) => `${Number(v).toLocaleString('fr-FR')} ${row.devise || 'XOF'}`,
    },
    {
      key: 'mode_paiement',
      label: 'Mode',
      render: (_, row) => row.mode_paiement_display || row.mode_paiement || '—',
    },
    {
      key: 'source',
      label: 'Source',
      render: (_, row) => row.source_display || row.source || '—',
    },
    {
      key: 'statut_paiement',
      label: 'Statut',
      render: (_, row) => (
        <Badge variant={badgePaiement(row.statut_paiement)}>
          {row.statut_paiement_display || row.statut_paiement}
        </Badge>
      ),
    },
    {
      key: 'emis_le',
      label: 'Date',
      render: v => (v ? new Date(v).toLocaleString('fr-FR') : '—'),
    },
  ]

  return (
    <AdminLayout userRole={userRole} userEmail={userEmail} onLogout={handleLogout}>
      <div className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Paiements</h1>
            <p className="mt-1 text-sm text-slate-600">
              Encaissements liés aux billets (espèces, Orange Money, Moov…).
            </p>
          </div>
          <label className="text-sm text-slate-600">
            Période
            <select
              className="ml-2 rounded-md border border-slate-200 bg-white px-3 py-2"
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

        {isSuperAdmin && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Connectez-vous en Manager / Comptable d’une compagnie pour voir les paiements du tenant.
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Recettes (payé)</p>
            <p className="mt-1 text-2xl font-semibold text-emerald-700">
              {kpis.recettes.toLocaleString('fr-FR')} XOF
            </p>
            <p className="text-xs text-slate-500">{kpis.nPayes} paiement(s)</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">En attente</p>
            <p className="mt-1 text-2xl font-semibold text-amber-700">
              {kpis.enAttente.toLocaleString('fr-FR')} XOF
            </p>
            <p className="text-xs text-slate-500">{kpis.nAttente} en attente</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Remboursés</p>
            <p className="mt-1 text-2xl font-semibold text-red-700">
              {kpis.rembourses.toLocaleString('fr-FR')} XOF
            </p>
          </Card>
        </div>

        <div className="flex flex-wrap gap-2">
          {['TOUS', 'PAYE', 'EN_ATTENTE', 'REMBOURSE'].map(s => (
            <Button
              key={s}
              type="button"
              size="sm"
              variant={filtreStatut === s ? 'default' : 'outline'}
              onClick={() => setFiltreStatut(s)}
            >
              {s === 'TOUS' ? 'Tous' : s === 'PAYE' ? 'Payés' : s === 'EN_ATTENTE' ? 'En attente' : 'Remboursés'}
            </Button>
          ))}
        </div>

        <DataTable
          columns={columns}
          data={filtres}
          loading={loading}
          emptyMessage="Aucun paiement sur cette période."
        />
      </div>
    </AdminLayout>
  )
}

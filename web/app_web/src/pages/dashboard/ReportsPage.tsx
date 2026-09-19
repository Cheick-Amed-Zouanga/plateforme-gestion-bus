import { useEffect, useState, useCallback, useMemo } from 'react'
import { AdminLayout } from '@/components/shared/AdminLayout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useDashboardUser } from '@/shared/hooks/useDashboardUser'
import apiFetch from '@/shared/services/api'

interface BilletFin {
  id: number
  prix: number
  statut_paiement: string
  mode_paiement: string
  mode_paiement_display?: string
  source: string
  source_display?: string
  emis_le: string
}

function groupSum(rows: BilletFin[], key: keyof BilletFin) {
  const map = new Map<string, { label: string; total: number; count: number }>()
  for (const r of rows) {
    if (r.statut_paiement !== 'PAYE') continue
    const raw = String(r[key] || '—')
    const labelKey = key === 'mode_paiement'
      ? (r.mode_paiement_display || raw)
      : key === 'source'
        ? (r.source_display || raw)
        : raw
    const prev = map.get(raw) || { label: labelKey, total: 0, count: 0 }
    prev.total += Number(r.prix || 0)
    prev.count += 1
    map.set(raw, prev)
  }
  return [...map.values()].sort((a, b) => b.total - a.total)
}

function byDay(rows: BilletFin[]) {
  const map = new Map<string, number>()
  for (const r of rows) {
    if (r.statut_paiement !== 'PAYE' || !r.emis_le) continue
    const day = new Date(r.emis_le).toLocaleDateString('fr-FR')
    map.set(day, (map.get(day) || 0) + Number(r.prix || 0))
  }
  return [...map.entries()].map(([day, total]) => ({ day, total })).slice(0, 14)
}

export default function ReportsPage() {
  const { userRole, userEmail, handleLogout, isSuperAdmin, hasPermission } = useDashboardUser()
  const canSee = isSuperAdmin || hasPermission('rapport.read') || hasPermission('paiement.read')

  const [rows, setRows] = useState<BilletFin[]>([])
  const [jours, setJours] = useState(90)
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

  const totalPaye = useMemo(
    () => rows.filter(r => r.statut_paiement === 'PAYE').reduce((a, r) => a + Number(r.prix || 0), 0),
    [rows]
  )
  const byMode = useMemo(() => groupSum(rows, 'mode_paiement'), [rows])
  const bySource = useMemo(() => groupSum(rows, 'source'), [rows])
  const joursRecents = useMemo(() => byDay(rows), [rows])
  const maxDay = Math.max(1, ...joursRecents.map(d => d.total))

  return (
    <AdminLayout userRole={userRole} userEmail={userEmail} onLogout={handleLogout}>
      <div className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Rapports financiers</h1>
            <p className="mt-1 text-sm text-slate-600">
              Synthèse des recettes par mode de paiement et canal de vente.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <select
              className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
              value={jours}
              onChange={e => setJours(Number(e.target.value))}
            >
              <option value={30}>30 jours</option>
              <option value={90}>90 jours</option>
              <option value={180}>180 jours</option>
              <option value={365}>1 an</option>
            </select>
            <Button type="button" variant="outline" size="sm" onClick={charger} disabled={loading}>
              Actualiser
            </Button>
          </div>
        </div>

        {isSuperAdmin && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Connectez-vous en Comptable / Manager pour voir les rapports du tenant.
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        <Card className="p-6">
          <p className="text-sm text-slate-500">Total encaissé (payé)</p>
          <p className="mt-1 text-3xl font-semibold text-slate-900">
            {loading ? '…' : `${totalPaye.toLocaleString('fr-FR')} XOF`}
          </p>
          <p className="mt-1 text-xs text-slate-500">Sur {jours} jours · {rows.length} billet(s)</p>
        </Card>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="p-5">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
              Par mode de paiement
            </h2>
            {byMode.length === 0 ? (
              <p className="text-sm text-slate-500">Aucune donnée.</p>
            ) : (
              <ul className="space-y-3">
                {byMode.map(m => (
                  <li key={m.label} className="flex items-center justify-between text-sm">
                    <span className="text-slate-700">{m.label} <span className="text-slate-400">({m.count})</span></span>
                    <span className="font-medium">{m.total.toLocaleString('fr-FR')} XOF</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card className="p-5">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
              Par source
            </h2>
            {bySource.length === 0 ? (
              <p className="text-sm text-slate-500">Aucune donnée.</p>
            ) : (
              <ul className="space-y-3">
                {bySource.map(m => (
                  <li key={m.label} className="flex items-center justify-between text-sm">
                    <span className="text-slate-700">{m.label} <span className="text-slate-400">({m.count})</span></span>
                    <span className="font-medium">{m.total.toLocaleString('fr-FR')} XOF</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <Card className="p-5">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Recettes par jour (aperçu)
          </h2>
          {joursRecents.length === 0 ? (
            <p className="text-sm text-slate-500">Aucune donnée.</p>
          ) : (
            <div className="space-y-2">
              {joursRecents.map(d => (
                <div key={d.day} className="flex items-center gap-3 text-sm">
                  <span className="w-24 shrink-0 text-slate-500">{d.day}</span>
                  <div className="h-2 flex-1 rounded-full bg-slate-100">
                    <div
                      className="h-2 rounded-full bg-emerald-600"
                      style={{ width: `${Math.max(4, (d.total / maxDay) * 100)}%` }}
                    />
                  </div>
                  <span className="w-28 shrink-0 text-right font-medium">
                    {d.total.toLocaleString('fr-FR')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </AdminLayout>
  )
}

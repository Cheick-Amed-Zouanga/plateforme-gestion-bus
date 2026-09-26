import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AdminLayout } from '@/components/shared/AdminLayout'
import { StatCard } from '@/components/shared/StatCard'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Users,
  Bus,
  DollarSign,
  Ticket,
  MapPin,
  Activity,
  Building2,
} from 'lucide-react'
import apiFetch from '@/shared/services/api'
import { useDashboardUser } from '@/shared/hooks/useDashboardUser'

interface DashboardStats {
  companies: number
  buses: number
  lignes: number
  trajetsActifs: number
  billets: number
  recettes: number
  employes: number
}

interface DashboardProps {
  userRole?: string
  userEmail?: string
  onLogout?: () => void
}

function asList(data: unknown): unknown[] {
  if (Array.isArray(data)) return data
  if (data && typeof data === 'object' && Array.isArray((data as { results?: unknown[] }).results)) {
    return (data as { results: unknown[] }).results
  }
  return []
}

export function Dashboard({ userRole = 'admin', userEmail = 'admin@company.com', onLogout }: DashboardProps) {
  const navigate = useNavigate()
  const { isSuperAdmin, permissions } = useDashboardUser()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const permsKey = permissions.join('|')

  useEffect(() => {
    let cancelled = false
    const can = (name: string) => isSuperAdmin || permissions.includes(name)

    async function charger() {
      setLoading(true)
      setError(null)
      try {
        const tasks: Promise<unknown>[] = []
        const keys: string[] = []

        if (can('company.read')) {
          keys.push('companies')
          tasks.push(apiFetch('/iam/companies/').catch(() => []))
        }
        if (can('bus.read')) {
          keys.push('buses')
          tasks.push(apiFetch('/transport/bus/').catch(() => []))
        }
        if (can('ligne.read')) {
          keys.push('lignes')
          tasks.push(apiFetch('/transport/lignes/').catch(() => []))
        }
        if (can('trajet.read')) {
          keys.push('trajets')
          tasks.push(apiFetch('/transport/trajets/').catch(() => []))
        }
        if (can('billet.read') || can('paiement.read')) {
          keys.push('billets')
          tasks.push(
            apiFetch('/billets/historique/?jours=90').catch(() => ({
              billets: [],
              total_recettes: 0,
              total_billets: 0,
            }))
          )
        }
        if (can('employe.read') || can('iam.read')) {
          keys.push('users')
          tasks.push(apiFetch('/iam/users/').catch(() => []))
        }

        const results = await Promise.all(tasks)
        if (cancelled) return

        const map: Record<string, unknown> = {}
        keys.forEach((k, i) => { map[k] = results[i] })

        const trajets = asList(map.trajets)
        const trajetsActifs = trajets.filter((t: any) =>
          t?.statut === 'PLANIFIE' || t?.statut === 'EN_COURS'
        ).length

        const hist = (map.billets || {}) as {
          billets?: unknown[]
          total_recettes?: number
          total_billets?: number
        }

        setStats({
          companies: asList(map.companies).length,
          buses: asList(map.buses).filter((b: any) => b?.actif !== false).length,
          lignes: asList(map.lignes).filter((l: any) => l?.active !== false).length,
          trajetsActifs,
          billets: hist.total_billets ?? asList(hist.billets).length,
          recettes: Number(hist.total_recettes) || 0,
          employes: asList(map.users).length,
        })
      } catch (e: any) {
        if (!cancelled) {
          setError(e.message || 'Erreur de chargement')
          setStats({
            companies: 0, buses: 0, lignes: 0, trajetsActifs: 0,
            billets: 0, recettes: 0, employes: 0,
          })
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    charger()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- permsKey stabilise permissions
  }, [isSuperAdmin, permsKey])

  const can = (name: string) => isSuperAdmin || permissions.includes(name)

  if (loading || !stats) {
    return (
      <AdminLayout userRole={userRole} userEmail={userEmail} onLogout={onLogout}>
        <div className="flex h-96 items-center justify-center">
          <div className="text-slate-500">Chargement du dashboard…</div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout userRole={userRole} userEmail={userEmail} onLogout={onLogout}>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
          <p className="mt-2 text-slate-600">
            {isSuperAdmin
              ? 'Vue plateforme — compagnies et tenants'
              : 'Vue opérationnelle de votre compagnie'}
          </p>
        </div>

        {error && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Certaines données n’ont pas pu être chargées : {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {(isSuperAdmin || can('company.read')) && (
            <StatCard
              title="Compagnies"
              value={stats.companies}
              icon={<Building2 />}
              color="blue"
            />
          )}
          {can('bus.read') && (
            <StatCard title="Bus actifs" value={stats.buses} icon={<Bus />} color="blue" />
          )}
          {can('ligne.read') && (
            <StatCard title="Lignes" value={stats.lignes} icon={<MapPin />} color="green" />
          )}
          {can('trajet.read') && (
            <StatCard title="Trajets actifs" value={stats.trajetsActifs} icon={<Activity />} color="purple" />
          )}
          {(can('paiement.read') || can('billet.read') || can('rapport.read')) && (
            <StatCard
              title="Recettes (90 j)"
              value={`${(stats.recettes / 1000).toFixed(0)}k`}
              icon={<DollarSign />}
              description={`${stats.recettes.toLocaleString('fr-FR')} XOF`}
              color="orange"
            />
          )}
          {can('billet.read') && (
            <StatCard title="Billets (90 j)" value={stats.billets} icon={<Ticket />} color="blue" />
          )}
          {(can('employe.read') || can('iam.read')) && (
            <StatCard title="Utilisateurs" value={stats.employes} icon={<Users />} color="green" />
          )}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card className="p-6">
            <h3 className="mb-4 text-lg font-semibold text-slate-900">Actions rapides</h3>
            <div className="grid gap-2 sm:grid-cols-2">
              {(isSuperAdmin || can('company.create') || can('company.read')) && (
                <Button variant="outline" className="justify-start" onClick={() => navigate('/dashboard/settings/company')}>
                  {isSuperAdmin ? 'Gérer les compagnies' : 'Ma compagnie'}
                </Button>
              )}
              {(can('trajet.create') || can('trajet.read')) && (
                <Button variant="outline" className="justify-start" onClick={() => navigate('/dashboard/transport/trajets')}>
                  Trajets
                </Button>
              )}
              {(can('bus.create') || can('bus.read')) && (
                <Button variant="outline" className="justify-start" onClick={() => navigate('/dashboard/transport/bus')}>
                  Bus
                </Button>
              )}
              {can('billet.read') && (
                <Button variant="outline" className="justify-start" onClick={() => navigate('/dashboard/transport/tickets')}>
                  Billets
                </Button>
              )}
              {can('iam.read') && (
                <Button variant="outline" className="justify-start" onClick={() => navigate('/dashboard/iam/users')}>
                  Utilisateurs IAM
                </Button>
              )}
              {(can('rapport.read') || can('paiement.read')) && (
                <Button variant="outline" className="justify-start" onClick={() => navigate('/dashboard/finances/reports')}>
                  Rapports
                </Button>
              )}
              {can('sav.read') && (
                <Button variant="outline" className="justify-start" onClick={() => navigate('/dashboard/support/tickets')}>
                  Support SAV
                </Button>
              )}
            </div>
          </Card>

          {(isSuperAdmin || can('gare.read') || can('gare.create') || can('company.create')) && (
            <Card className="p-6">
              <h3 className="mb-2 text-lg font-semibold text-slate-900">Raccourcis métier</h3>
              <p className="mb-4 text-sm text-slate-600">
                Flux recommandé : Compagnie → Gares → Bus → Lignes → Trajets → Tarifs → Employés.
              </p>
              <Button onClick={() => navigate(isSuperAdmin ? '/dashboard/settings/company' : '/dashboard/settings/gares')}>
                {isSuperAdmin ? 'Créer / gérer une compagnie' : 'Configurer les gares'}
              </Button>
            </Card>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}

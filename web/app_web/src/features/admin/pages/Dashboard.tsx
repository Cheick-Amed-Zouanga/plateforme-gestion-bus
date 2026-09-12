import React, { useEffect, useState } from 'react'
import { AdminLayout } from '@/components/shared/AdminLayout'
import { StatCard } from '@/components/shared/StatCard'
import { Card } from '@/components/ui/card'
import {
  Users,
  Bus,
  DollarSign,
  Ticket,
  TrendingUp,
  Calendar,
  MapPin,
  Activity,
} from 'lucide-react'

interface DashboardStats {
  totalBuses: number
  totalRoutes: number
  activeTrips: number
  totalRevenue: number
  totalTickets: number
  totalUsers: number
  busUtilization: number
  onTimePercentage: number
}

interface DashboardProps {
  userRole?: string
  userEmail?: string
}

export function Dashboard({ userRole = 'admin', userEmail = 'admin@company.com' }: DashboardProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simuler le chargement des données
    setTimeout(() => {
      setStats({
        totalBuses: 45,
        totalRoutes: 12,
        activeTrips: 23,
        totalRevenue: 1250000,
        totalTickets: 3847,
        totalUsers: 156,
        busUtilization: 78,
        onTimePercentage: 94,
      })
      setLoading(false)
    }, 1000)
  }, [])

  if (loading || !stats) {
    return (
      <AdminLayout userRole={userRole} userEmail={userEmail}>
        <div className="flex items-center justify-center h-96">
          <div className="text-slate-500">Chargement du dashboard...</div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout userRole={userRole} userEmail={userEmail}>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-600 mt-2">
            Bienvenue sur votre tableau de bord d'administration
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Bus Actifs"
            value={stats.totalBuses}
            icon={<Bus />}
            trend={12}
            trendLabel="vs mois dernier"
            color="blue"
          />
          <StatCard
            title="Trajets"
            value={stats.totalRoutes}
            icon={<MapPin />}
            description="12 routes actives"
            color="green"
          />
          <StatCard
            title="Trajets en cours"
            value={stats.activeTrips}
            icon={<Activity />}
            trend={8}
            color="purple"
          />
          <StatCard
            title="Revenu Total"
            value={`${(stats.totalRevenue / 1000000).toFixed(1)}M`}
            icon={<DollarSign />}
            trend={24}
            trendLabel="vs mois dernier"
            color="orange"
          />
        </div>

        {/* Second Row Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Billets Vendus"
            value={stats.totalTickets}
            icon={<Ticket />}
            trend={15}
            color="blue"
          />
          <StatCard
            title="Utilisateurs"
            value={stats.totalUsers}
            icon={<Users />}
            trend={5}
            color="green"
          />
          <StatCard
            title="Utilisation Bus"
            value={`${stats.busUtilization}%`}
            icon={<TrendingUp />}
            trend={3}
            color="purple"
          />
          <StatCard
            title="Ponctualité"
            value={`${stats.onTimePercentage}%`}
            icon={<Calendar />}
            trend={-2}
            color="orange"
          />
        </div>

        {/* Charts and Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Revenue Chart Placeholder */}
          <Card className="lg:col-span-2 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              Revenus (30 derniers jours)
            </h3>
            <div className="h-64 flex items-center justify-center bg-slate-50 rounded">
              <div className="text-slate-500">Graphique de revenus</div>
            </div>
          </Card>

          {/* Quick Actions */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              Actions Rapides
            </h3>
            <div className="space-y-3">
              <button className="w-full text-left px-4 py-3 rounded-lg hover:bg-slate-100 transition-colors text-sm font-medium text-slate-700">
                Créer un trajet
              </button>
              <button className="w-full text-left px-4 py-3 rounded-lg hover:bg-slate-100 transition-colors text-sm font-medium text-slate-700">
                Ajouter un bus
              </button>
              <button className="w-full text-left px-4 py-3 rounded-lg hover:bg-slate-100 transition-colors text-sm font-medium text-slate-700">
                Gérer les utilisateurs
              </button>
              <button className="w-full text-left px-4 py-3 rounded-lg hover:bg-slate-100 transition-colors text-sm font-medium text-slate-700">
                Voir les rapports
              </button>
            </div>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">
            Activité Récente
          </h3>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div
                key={i}
                className="flex items-start gap-4 p-3 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <div className="w-2 h-2 bg-slate-900 rounded-full mt-1.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900">
                    Activité #{i}
                  </p>
                  <p className="text-xs text-slate-500">Il y a {i} minute(s)</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </AdminLayout>
  )
}

import React, { useState } from 'react'
import { AdminLayout } from '@/components/shared/AdminLayout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatCard } from '@/components/shared/StatCard'
import { useAuth } from '@/hooks/useAuth'
import { BarChart3, TrendingUp, Download } from 'lucide-react'

const mockReports = [
  { id: '1', nom: 'Revenu Mensuel Sept 2024', type: 'revenue', periode: 'Sept 2024', total: 4500000, date: '2024-09-30' },
  { id: '2', nom: 'Dépenses Maintenance Août', type: 'expenses', periode: 'Août 2024', total: 850000, date: '2024-08-31' },
  { id: '3', nom: 'Bilan Trimestriel Q3', type: 'quarterly', periode: 'Q3 2024', total: 12500000, date: '2024-09-30' },
]

export function ReportsPage() {
  const { user: currentUser } = useAuth()
  const [reports] = useState(mockReports)
  const [dateRange, setDateRange] = useState({ from: '2024-01-01', to: '2024-09-30' })

  return (
    <AdminLayout userRole={currentUser?.roles?.[0]?.name || 'admin'} userEmail={currentUser?.email}>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Rapports Financiers</h1>
          <p className="text-slate-600 mt-2">Analyse et rapports de performance financière</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard title="Revenu Total" value="12.5M XOF" icon={<TrendingUp />} trend={18} color="green" />
          <StatCard title="Dépenses" value="3.2M XOF" icon={<BarChart3 />} trend={-8} color="orange" />
          <StatCard title="Profit Net" value="9.3M XOF" icon={<TrendingUp />} trend={25} color="blue" />
        </div>

        <Card className="p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Sélection Période</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Du</label>
              <input type="date" value={dateRange.from} onChange={e => setDateRange({...dateRange, from: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Au</label>
              <input type="date" value={dateRange.to} onChange={e => setDateRange({...dateRange, to: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-lg" />
            </div>
            <div className="flex items-end">
              <Button className="w-full">Générer Rapport</Button>
            </div>
          </div>
        </Card>

        <div>
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Rapports Récents</h3>
          <div className="space-y-3">
            {reports.map(report => (
              <Card key={report.id} className="p-4 flex items-center justify-between hover:shadow-md transition">
                <div>
                  <h4 className="font-semibold text-slate-900">{report.nom}</h4>
                  <p className="text-sm text-slate-600">{report.periode} • {(report.total / 1000000).toFixed(1)}M XOF</p>
                </div>
                <Button size="sm" className="flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  Télécharger
                </Button>
              </Card>
            ))}
          </div>
        </div>

        <Card className="p-6 bg-blue-50 border-blue-200">
          <h3 className="font-semibold text-blue-900">Rapports Disponibles</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div className="p-3 bg-white rounded border border-blue-200">
              <div className="font-semibold text-slate-900">Revenu Mensuel</div>
              <div className="text-xs text-slate-600">Généré automatiquement</div>
            </div>
            <div className="p-3 bg-white rounded border border-blue-200">
              <div className="font-semibold text-slate-900">Bilan Trimestriel</div>
              <div className="text-xs text-slate-600">Synthèse complète</div>
            </div>
            <div className="p-3 bg-white rounded border border-blue-200">
              <div className="font-semibold text-slate-900">Analyse Dépenses</div>
              <div className="text-xs text-slate-600">Par catégorie</div>
            </div>
          </div>
        </Card>
      </div>
    </AdminLayout>
  )
}

import React, { useState } from 'react'
import { AdminLayout } from '@/components/shared/AdminLayout'
import { DataTable, Column } from '@/components/shared/DataTable'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/hooks/useAuth'
import { Ticket, TrendingUp } from 'lucide-react'

const mockTickets = [
  { id: '1', numero: 'TKT-2024-001', passager: 'Hamidou Diallo', route: 'Dakar → Thiès', bus: 'BUS-001', siege: 'A12', prix: 3500, statut: 'valide', date_voyage: '2024-09-15', created_at: '2024-09-01' },
  { id: '2', numero: 'TKT-2024-002', passager: 'Fatou Ba', route: 'Dakar → Kaolack', bus: 'BUS-002', siege: 'B05', prix: 8500, statut: 'valide', date_voyage: '2024-09-16', created_at: '2024-09-02' },
  { id: '3', numero: 'TKT-2024-003', passager: 'Moussa Ndiaye', route: 'Dakar → Saint-Louis', bus: 'BUS-001', siege: 'C18', prix: 10000, statut: 'annule', date_voyage: '2024-09-10', created_at: '2024-09-01' },
]

export function TransportTicketsPage() {
  const { user: currentUser } = useAuth()
  const [tickets] = useState(mockTickets)

  const stats = {
    total: tickets.length,
    valides: tickets.filter(t => t.statut === 'valide').length,
    revenue: tickets.filter(t => t.statut === 'valide').reduce((sum, t) => sum + t.prix, 0),
  }

  const columns: Column<any>[] = [
    { key: 'numero', label: 'N° Ticket', sortable: true },
    { key: 'passager', label: 'Passager', sortable: true },
    { key: 'route', label: 'Route' },
    { key: 'bus', label: 'Bus' },
    { key: 'siege', label: 'Siège' },
    { key: 'prix', label: 'Prix', render: (p: number) => `${p} XOF` },
    { key: 'statut', label: 'Statut', render: (s: string) => <Badge variant={s === 'valide' ? 'success' : 'destructive'}>{s}</Badge> },
    { key: 'date_voyage', label: 'Voyage', render: (d: string) => new Date(d).toLocaleDateString('fr-FR') },
  ]

  return (
    <AdminLayout userRole={currentUser?.roles?.[0]?.name || 'admin'} userEmail={currentUser?.email}>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Gestion des Billets</h1>
          <p className="text-slate-600 mt-2">Suivi de tous les billets émis</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <Ticket className="w-8 h-8 text-blue-600" />
              <div>
                <div className="text-sm text-slate-600">Total Billets</div>
                <div className="text-2xl font-bold text-slate-900">{stats.total}</div>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-green-600" />
              <div>
                <div className="text-sm text-slate-600">Billets Valides</div>
                <div className="text-2xl font-bold text-slate-900">{stats.valides}</div>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <Badge className="w-8 h-8 text-orange-600" />
              <div>
                <div className="text-sm text-slate-600">Revenu</div>
                <div className="text-2xl font-bold text-slate-900">{(stats.revenue / 1000).toFixed(0)}k XOF</div>
              </div>
            </div>
          </Card>
        </div>

        <DataTable
          columns={columns}
          data={tickets}
          keyField="id"
          searchable={true}
          searchFields={['numero', 'passager', 'route']}
          loading={false}
          pagination={true}
          pageSize={10}
          striped={true}
        />
      </div>
    </AdminLayout>
  )
}

import React, { useState } from 'react'
import { AdminLayout } from '@/components/shared/AdminLayout'
import { DataTable } from '@/components/shared/DataTable'
import type { Column } from '@/components/shared/DataTable'
import { Card } from '@/components/ui/card'
import { StatCard } from '@/components/shared/StatCard'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/hooks/useAuth'
import { DollarSign, CreditCard, CheckCircle, Clock } from 'lucide-react'

const mockPayments = [
  {
    id: '1',
    reference: 'PAY-20240901-001',
    montant: 250000,
    devise: 'XOF',
    methode: 'Orange Money',
    statut: 'payé',
    date_paiement: '2024-09-01T10:30:00',
    client: 'Hamidou Diallo',
    description: 'Billet Dakar -> Thiès',
  },
  {
    id: '2',
    reference: 'PAY-20240901-002',
    montant: 180000,
    devise: 'XOF',
    methode: 'Moov Money',
    statut: 'en_attente',
    date_paiement: '2024-09-01T14:15:00',
    client: 'Fatou Ba',
    description: 'Billet Dakar -> Kaolack',
  },
  {
    id: '3',
    reference: 'PAY-20240831-005',
    montant: 320000,
    devise: 'XOF',
    methode: 'Espèces',
    statut: 'payé',
    date_paiement: '2024-08-31T09:45:00',
    client: 'Moussa Ndiaye',
    description: 'Billet Dakar -> Saint-Louis',
  },
]

export function PaymentsPage() {
  const { user: currentUser } = useAuth()
  const [payments] = useState(mockPayments)

  const stats = {
    totalRevenue: payments.filter(p => p.statut === 'payé').reduce((sum, p) => sum + p.montant, 0),
    totalPayments: payments.length,
    paidCount: payments.filter(p => p.statut === 'payé').length,
    pendingCount: payments.filter(p => p.statut === 'en_attente').length,
  }

  const columns: Column<any>[] = [
    {
      key: 'reference',
      label: 'Référence',
      sortable: true,
    },
    {
      key: 'client',
      label: 'Client',
    },
    {
      key: 'montant',
      label: 'Montant',
      render: (montant: number) => `${(montant / 1000).toFixed(1)} k XOF`,
    },
    {
      key: 'methode',
      label: 'Méthode',
      render: (methode: string) => (
        <Badge variant="outline">{methode}</Badge>
      ),
    },
    {
      key: 'statut',
      label: 'Statut',
      render: (statut: string) => (
        <Badge variant={statut === 'payé' ? 'success' : 'warning'}>
          {statut === 'payé' ? '✓ Payé' : '⏳ En attente'}
        </Badge>
      ),
    },
    {
      key: 'date_paiement',
      label: 'Date',
      render: (date: string) => new Date(date).toLocaleDateString('fr-FR'),
    },
  ]

  return (
    <AdminLayout userRole={currentUser?.roles?.[0]?.name || 'admin'} userEmail={currentUser?.email}>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Gestion des Paiements</h1>
          <p className="text-slate-600 mt-2">Suivi des transactions et revenus</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatCard
            title="Revenu Total"
            value={`${(stats.totalRevenue / 1000000).toFixed(1)}M XOF`}
            icon={<DollarSign />}
            trend={18}
            color="green"
          />
          <StatCard
            title="Paiements"
            value={stats.totalPayments}
            icon={<CreditCard />}
            description="Total transactions"
            color="blue"
          />
          <StatCard
            title="Payés"
            value={stats.paidCount}
            icon={<CheckCircle />}
            trend={12}
            color="green"
          />
          <StatCard
            title="En Attente"
            value={stats.pendingCount}
            icon={<Clock />}
            trend={-5}
            color="orange"
          />
        </div>

        <DataTable
          columns={columns}
          data={payments}
          keyField="id"
          searchable={true}
          searchFields={['reference', 'client', 'methode']}
          loading={false}
          pagination={true}
          pageSize={10}
          striped={true}
        />
      </div>
    </AdminLayout>
  )
}

import React, { useState } from 'react'
import { AdminLayout } from '@/components/shared/AdminLayout'
import { DataTable } from '@/components/shared/DataTable'
import type { Column } from '@/components/shared/DataTable'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import { Headphones, AlertCircle, Clock } from 'lucide-react'

const mockTickets = [
  {
    id: '1',
    numero: 'TKT-2024-001',
    client: 'Hamidou Diallo',
    email: 'hamidou@email.com',
    sujet: 'Remboursement billet',
    description: 'Demande de remboursement suite à annulation de trajet',
    priorite: 'haute',
    statut: 'ouvert',
    date_creation: '2024-09-01T10:30:00',
  },
  {
    id: '2',
    numero: 'TKT-2024-002',
    client: 'Fatou Ba',
    email: 'fatou@email.com',
    sujet: 'Problème de réservation',
    description: 'QR code non reçu par SMS',
    priorite: 'moyenne',
    statut: 'en_cours',
    date_creation: '2024-09-01T14:15:00',
  },
  {
    id: '3',
    numero: 'TKT-2024-003',
    client: 'Moussa Ndiaye',
    email: 'moussa@email.com',
    sujet: 'Réclamation bagages',
    description: 'Bagages endommagés lors du transport',
    priorite: 'haute',
    statut: 'resolu',
    date_creation: '2024-08-31T09:45:00',
  },
]

export function SupportTicketsPage() {
  const { user: currentUser } = useAuth()
  const [tickets, setTickets] = useState(mockTickets)
  const [showModal, setShowModal] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState<any>(null)
  const [formData, setFormData] = useState({
    statut: '',
    note: '',
    sujet: '',
    client: '',
    email: '',
    priorite: '',
    description: '',
  })

  const handleEdit = (ticket: any) => {
    setSelectedTicket(ticket)
    setFormData({ statut: ticket.statut, note: '' })
    setShowModal(true)
  }

  const handleDelete = (ticket: any) => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer le ticket ${ticket.numero}?`)) {
      setTickets(tickets.filter(t => t.id !== ticket.id))
    }
  }

  const handleSave = () => {
    if (selectedTicket) {
      setTickets(
        tickets.map(t =>
          t.id === selectedTicket.id
            ? { ...t, statut: formData.statut }
            : t
        )
      )
    } else {
      const newTicket = {
        id: String(Math.random()),
        numero: `TKT-2024-${String(tickets.length + 1).padStart(3, '0')}`,
        sujet: formData.sujet || '',
        client: formData.client || '',
        email: formData.email || '',
        priorite: formData.priorite || 'moyenne',
        statut: 'ouvert',
        date_creation: new Date().toISOString(),
        description: formData.description || '',
      }
      setTickets([...tickets, newTicket])
    }
    setShowModal(false)
    setFormData({ statut: '', note: '', sujet: '', client: '', email: '', priorite: '', description: '' })
  }

  const handleAdd = () => {
    setSelectedTicket(null)
    setFormData({ statut: 'ouvert', note: '', sujet: '', client: '', email: '', priorite: 'moyenne', description: '' })
    setShowModal(true)
  }

  const getPrioriteColor = (priorite: string) => {
    switch (priorite) {
      case 'haute':
        return 'destructive'
      case 'moyenne':
        return 'warning'
      default:
        return 'default'
    }
  }

  const getStatutColor = (statut: string) => {
    switch (statut) {
      case 'ouvert':
        return 'info'
      case 'en_cours':
        return 'warning'
      case 'resolu':
        return 'success'
      default:
        return 'default'
    }
  }

  const columns: Column<any>[] = [
    {
      key: 'numero',
      label: 'Numéro',
      sortable: true,
    },
    {
      key: 'client',
      label: 'Client',
    },
    {
      key: 'sujet',
      label: 'Sujet',
      sortable: true,
    },
    {
      key: 'priorite',
      label: 'Priorité',
      render: (priorite: string) => (
        <Badge variant={getPrioriteColor(priorite)}>
          {priorite === 'haute' ? '🔴' : priorite === 'moyenne' ? '🟡' : '🟢'} {priorite}
        </Badge>
      ),
    },
    {
      key: 'statut',
      label: 'Statut',
      render: (statut: string) => (
        <Badge variant={getStatutColor(statut)}>
          {statut === 'ouvert' ? 'Ouvert' : statut === 'en_cours' ? 'En cours' : 'Résolu'}
        </Badge>
      ),
    },
    {
      key: 'date_creation',
      label: 'Créé le',
      render: (date: string) => new Date(date).toLocaleDateString('fr-FR'),
    },
  ]

  const stats = {
    total: tickets.length,
    ouverts: tickets.filter(t => t.statut === 'ouvert').length,
    enCours: tickets.filter(t => t.statut === 'en_cours').length,
    resolus: tickets.filter(t => t.statut === 'resolu').length,
  }

  return (
    <AdminLayout userRole={currentUser?.roles?.[0]?.name || 'admin'} userEmail={currentUser?.email}>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Support Client</h1>
          <p className="text-slate-600 mt-2">Gestion des tickets d'assistance</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="text-sm text-slate-600">Total Tickets</div>
            <div className="text-2xl font-bold text-slate-900">{stats.total}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-slate-600">Ouverts</div>
            <div className="text-2xl font-bold text-blue-600">{stats.ouverts}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-slate-600">En Cours</div>
            <div className="text-2xl font-bold text-orange-600">{stats.enCours}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-slate-600">Résolus</div>
            <div className="text-2xl font-bold text-green-600">{stats.resolus}</div>
          </Card>
        </div>

        <DataTable
          columns={columns}
          data={tickets}
          keyField="id"
          onEdit={handleEdit}
          onDelete={handleDelete}
          onAdd={handleAdd}
          searchable={true}
          searchFields={['numero', 'client', 'sujet']}
          loading={false}
          pagination={true}
          pageSize={10}
        />

        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-2xl">
              <div className="p-6">
                <h2 className="text-2xl font-bold text-slate-900 mb-6">
                  {selectedTicket ? `Ticket ${selectedTicket?.numero}` : 'Créer un nouveau ticket'}
                </h2>

                {selectedTicket ? (
                  <>
                    <div className="space-y-4 mb-6 pb-6 border-b border-slate-200">
                      <div>
                        <div className="text-sm text-slate-600">Client</div>
                        <div className="font-semibold text-slate-900">{selectedTicket?.client}</div>
                      </div>
                      <div>
                        <div className="text-sm text-slate-600">Sujet</div>
                        <div className="font-semibold text-slate-900">{selectedTicket?.sujet}</div>
                      </div>
                      <div>
                        <div className="text-sm text-slate-600">Description</div>
                        <div className="text-slate-700">{selectedTicket?.description}</div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Statut
                        </label>
                        <select
                          value={formData.statut}
                          onChange={e => setFormData({ ...formData, statut: e.target.value })}
                          className="w-full px-4 py-2 border border-slate-200 rounded-lg"
                        >
                          <option value="ouvert">Ouvert</option>
                          <option value="en_cours">En cours</option>
                          <option value="resolu">Résolu</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Note interne
                        </label>
                        <textarea
                          value={formData.note}
                          onChange={e => setFormData({ ...formData, note: e.target.value })}
                          rows={4}
                          className="w-full px-4 py-2 border border-slate-200 rounded-lg"
                          placeholder="Ajouter une note..."
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="space-y-4">
                    <input
                      type="text"
                      placeholder="Sujet du ticket"
                      value={formData.sujet || ''}
                      onChange={e => setFormData({ ...formData, sujet: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg"
                    />
                    <input
                      type="text"
                      placeholder="Nom du client"
                      value={formData.client || ''}
                      onChange={e => setFormData({ ...formData, client: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg"
                    />
                    <input
                      type="email"
                      placeholder="Email du client"
                      value={formData.email || ''}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg"
                    />
                    <select
                      value={formData.priorite || ''}
                      onChange={e => setFormData({ ...formData, priorite: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg"
                    >
                      <option value="">Sélectionner priorité</option>
                      <option value="basse">Basse</option>
                      <option value="moyenne">Moyenne</option>
                      <option value="haute">Haute</option>
                    </select>
                    <textarea
                      placeholder="Description du ticket"
                      value={formData.description || ''}
                      onChange={e => setFormData({ ...formData, description: e.target.value })}
                      rows={4}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg"
                    />
                  </div>
                )}

                <div className="flex gap-3 mt-6">
                  <Button variant="outline" onClick={() => setShowModal(false)} className="flex-1">
                    Annuler
                  </Button>
                  <Button onClick={handleSave} className="flex-1">
                    {selectedTicket ? 'Mettre à jour' : 'Créer'}
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}

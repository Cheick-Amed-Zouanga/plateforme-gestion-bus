import React, { useState } from 'react'
import { AdminLayout } from '@/components/shared/AdminLayout'
import { DataTable } from '@/components/shared/DataTable'
import type { Column } from '@/components/shared/DataTable'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/hooks/useAuth'
import { Users } from 'lucide-react'

const mockTeams = [
  { id: '1', nom: 'Équipe Dakar', gare: 'Dakar Central', responsable: 'Amar Sall', membres: 8, type: 'Chauffeurs', statut: 'active', created_at: '2024-01-15' },
  { id: '2', nom: 'Équipe Thiès', gare: 'Thiès', responsable: 'Ndeye Fall', membres: 5, type: 'Mixte', statut: 'active', created_at: '2024-02-01' },
  { id: '3', nom: 'Équipe Maintenance', gare: 'Dakar Central', responsable: 'Issa Diop', membres: 4, type: 'Mécaniciens', statut: 'active', created_at: '2024-01-20' },
]

export function TeamsPage() {
  const { user: currentUser } = useAuth()
  const [teams, setTeams] = useState(mockTeams)
  const [showModal, setShowModal] = useState(false)
  const [selectedTeam, setSelectedTeam] = useState<any>(null)
  const [formData, setFormData] = useState({ nom: '', gare: '', responsable: '', type: '' })

  const handleEdit = (team: any) => {
    setSelectedTeam(team)
    setFormData({ nom: team.nom, gare: team.gare, responsable: team.responsable, type: team.type })
    setShowModal(true)
  }

  const handleDelete = (team: any) => {
    if (confirm(`Supprimer ${team.nom}?`)) {
      setTeams(teams.filter(t => t.id !== team.id))
      alert('Équipe supprimée')
    }
  }

  const handleSave = () => {
    if (!formData.nom || !formData.responsable) { alert('Champs obligatoires manquants'); return }
    if (selectedTeam) {
      setTeams(teams.map(t => t.id === selectedTeam.id ? { ...t, ...formData } : t))
    } else {
      setTeams([...teams, { id: String(Math.random()), ...formData, membres: 0, statut: 'active', created_at: new Date().toISOString().split('T')[0] }])
    }
    setShowModal(false)
  }

  const columns: Column<any>[] = [
    { key: 'nom', label: 'Nom', sortable: true },
    { key: 'gare', label: 'Gare' },
    { key: 'responsable', label: 'Responsable' },
    { key: 'type', label: 'Type', render: (t: string) => <Badge>{t}</Badge> },
    { key: 'membres', label: 'Membres' },
  ]

  return (
    <AdminLayout userRole={currentUser?.roles?.[0]?.name || 'admin'} userEmail={currentUser?.email}>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Gestion des Équipes</h1>
          <p className="text-slate-600 mt-2">Organisez les équipes par fonction</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4"><div className="text-sm text-slate-600">Total Équipes</div><div className="text-2xl font-bold text-slate-900">{teams.length}</div></Card>
          <Card className="p-4"><div className="text-sm text-slate-600">Total Membres</div><div className="text-2xl font-bold text-slate-900">{teams.reduce((s, t) => s + t.membres, 0)}</div></Card>
          <Card className="p-4"><div className="text-sm text-slate-600">Moyenne/Équipe</div><div className="text-2xl font-bold text-slate-900">{Math.round(teams.reduce((s, t) => s + t.membres, 0) / teams.length)}</div></Card>
        </div>

        <DataTable columns={columns} data={teams} keyField="id" onEdit={handleEdit} onDelete={handleDelete} onAdd={() => { setSelectedTeam(null); setFormData({ nom: '', gare: '', responsable: '', type: '' }); setShowModal(true) }} searchable pagination />

        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-2xl"><div className="p-6">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">{selectedTeam ? 'Modifier' : 'Créer'} une équipe</h2>
              <div className="space-y-4">
                <input placeholder="Nom" value={formData.nom} onChange={e => setFormData({...formData, nom: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-lg" />
                <input placeholder="Gare" value={formData.gare} onChange={e => setFormData({...formData, gare: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-lg" />
                <input placeholder="Responsable" value={formData.responsable} onChange={e => setFormData({...formData, responsable: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-lg" />
                <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-lg">
                  <option>Type</option>
                  <option>Chauffeurs</option>
                  <option>Mécaniciens</option>
                  <option>Mixte</option>
                </select>
              </div>
              <div className="flex gap-3 mt-6">
                <Button variant="outline" onClick={() => setShowModal(false)} className="flex-1">Annuler</Button>
                <Button onClick={handleSave} className="flex-1">{selectedTeam ? 'Mettre à jour' : 'Créer'}</Button>
              </div>
            </div></Card>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}

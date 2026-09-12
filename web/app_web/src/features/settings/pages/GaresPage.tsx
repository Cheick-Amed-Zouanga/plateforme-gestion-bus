import React, { useState } from 'react'
import { AdminLayout } from '@/components/shared/AdminLayout'
import { DataTable, Column } from '@/components/shared/DataTable'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import { MapPin, Users } from 'lucide-react'

const mockGares = [
  { id: '1', nom: 'Dakar Central', ville: 'Dakar', adresse: '123 Rue de l\'Indépendance', telephone: '+221 33 123 4567', responsable: 'Amar Sall', employes: 12, statut: 'active' },
  { id: '2', nom: 'Thiès', ville: 'Thiès', adresse: '456 Avenue Ould Daddah', telephone: '+221 77 987 6543', responsable: 'Ndeye Fall', employes: 8, statut: 'active' },
  { id: '3', nom: 'Saint-Louis', ville: 'Saint-Louis', adresse: '789 Rue de Belfort', telephone: '+221 76 555 6789', responsable: 'Moussa Ndiaye', employes: 6, statut: 'active' },
]

export function GaresPage() {
  const { user: currentUser } = useAuth()
  const [gares, setGares] = useState(mockGares)
  const [showModal, setShowModal] = useState(false)
  const [selectedGare, setSelectedGare] = useState<any>(null)
  const [formData, setFormData] = useState({ nom: '', ville: '', adresse: '', telephone: '', responsable: '' })

  const handleEdit = (gare: any) => {
    setSelectedGare(gare)
    setFormData({ nom: gare.nom, ville: gare.ville, adresse: gare.adresse, telephone: gare.telephone, responsable: gare.responsable })
    setShowModal(true)
  }

  const handleDelete = (gare: any) => {
    if (confirm(`Supprimer ${gare.nom}?`)) {
      setGares(gares.filter(g => g.id !== gare.id))
      alert('Gare supprimée')
    }
  }

  const handleSave = () => {
    if (!formData.nom || !formData.ville) { alert('Champs obligatoires'); return }
    if (selectedGare) {
      setGares(gares.map(g => g.id === selectedGare.id ? { ...g, ...formData } : g))
    } else {
      setGares([...gares, { id: String(Math.random()), ...formData, employes: 0, statut: 'active' }])
    }
    setShowModal(false)
  }

  const columns: Column<any>[] = [
    { key: 'nom', label: 'Nom', sortable: true },
    { key: 'ville', label: 'Ville', sortable: true },
    { key: 'adresse', label: 'Adresse' },
    { key: 'telephone', label: 'Téléphone' },
    { key: 'responsable', label: 'Responsable' },
    { key: 'employes', label: 'Employés' },
  ]

  return (
    <AdminLayout userRole={currentUser?.roles?.[0]?.name || 'admin'} userEmail={currentUser?.email}>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Gestion des Gares</h1>
          <p className="text-slate-600 mt-2">Gérez vos points de vente</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4"><div className="text-sm text-slate-600">Total Gares</div><div className="text-2xl font-bold text-slate-900">{gares.length}</div></Card>
          <Card className="p-4"><div className="text-sm text-slate-600">Total Employés</div><div className="text-2xl font-bold text-slate-900">{gares.reduce((s, g) => s + g.employes, 0)}</div></Card>
          <Card className="p-4"><div className="text-sm text-slate-600">Moyenne/Gare</div><div className="text-2xl font-bold text-slate-900">{Math.round(gares.reduce((s, g) => s + g.employes, 0) / gares.length)}</div></Card>
        </div>

        <DataTable columns={columns} data={gares} keyField="id" onEdit={handleEdit} onDelete={handleDelete} onAdd={() => { setSelectedGare(null); setFormData({ nom: '', ville: '', adresse: '', telephone: '', responsable: '' }); setShowModal(true) }} searchable pagination />

        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-2xl"><div className="p-6">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">{selectedGare ? 'Modifier' : 'Ajouter'} une gare</h2>
              <div className="space-y-4">
                <input placeholder="Nom" value={formData.nom} onChange={e => setFormData({...formData, nom: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-lg" />
                <input placeholder="Ville" value={formData.ville} onChange={e => setFormData({...formData, ville: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-lg" />
                <input placeholder="Adresse" value={formData.adresse} onChange={e => setFormData({...formData, adresse: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-lg" />
                <input placeholder="Téléphone" value={formData.telephone} onChange={e => setFormData({...formData, telephone: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-lg" />
                <input placeholder="Responsable" value={formData.responsable} onChange={e => setFormData({...formData, responsable: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-lg" />
              </div>
              <div className="flex gap-3 mt-6">
                <Button variant="outline" onClick={() => setShowModal(false)} className="flex-1">Annuler</Button>
                <Button onClick={handleSave} className="flex-1">{selectedGare ? 'Mettre à jour' : 'Ajouter'}</Button>
              </div>
            </div></Card>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}

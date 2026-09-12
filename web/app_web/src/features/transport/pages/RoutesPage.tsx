import React, { useState } from 'react'
import { AdminLayout } from '@/components/shared/AdminLayout'
import { DataTable, Column } from '@/components/shared/DataTable'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/hooks/useAuth'
import { MapPin, Clock, DollarSign, Users } from 'lucide-react'

const mockRoutes = [
  {
    id: '1',
    code: 'RT-001',
    depart: 'Dakar',
    arrivee: 'Thiès',
    distance: 65,
    duree_estimee: '1h30',
    tarif_base: 3500,
    frequence: 'Chaque heure',
    bus_assignes: 3,
    statut: 'active',
    created_at: '2024-01-15',
  },
  {
    id: '2',
    code: 'RT-002',
    depart: 'Dakar',
    arrivee: 'Kaolack',
    distance: 195,
    duree_estimee: '4h',
    tarif_base: 8500,
    frequence: 'Deux fois par jour',
    bus_assignes: 2,
    statut: 'active',
    created_at: '2024-01-20',
  },
  {
    id: '3',
    code: 'RT-003',
    depart: 'Dakar',
    arrivee: 'Saint-Louis',
    distance: 260,
    duree_estimee: '5h30',
    tarif_base: 10000,
    frequence: 'Une fois par jour',
    bus_assignes: 1,
    statut: 'active',
    created_at: '2024-02-01',
  },
]

export function RoutesPage() {
  const { user: currentUser } = useAuth()
  const [routes, setRoutes] = useState(mockRoutes)
  const [showModal, setShowModal] = useState(false)
  const [selectedRoute, setSelectedRoute] = useState<any>(null)
  const [formData, setFormData] = useState({
    code: '',
    depart: '',
    arrivee: '',
    distance: '',
    duree_estimee: '',
    tarif_base: '',
  })

  const handleEdit = (route: any) => {
    setSelectedRoute(route)
    setFormData({
      code: route.code,
      depart: route.depart,
      arrivee: route.arrivee,
      distance: route.distance,
      duree_estimee: route.duree_estimee,
      tarif_base: route.tarif_base,
    })
    setShowModal(true)
  }

  const handleDelete = (route: any) => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer la route ${route.code}?`)) {
      setRoutes(routes.filter(r => r.id !== route.id))
      alert('Route supprimée avec succès')
    }
  }

  const handleSave = () => {
    if (!formData.code || !formData.depart || !formData.arrivee) {
      alert('Veuillez remplir les champs obligatoires')
      return
    }

    if (selectedRoute) {
      setRoutes(routes.map(r => r.id === selectedRoute.id ? { ...r, ...formData } : r))
      alert('Route mise à jour')
    } else {
      const newRoute = {
        id: String(Math.max(...routes.map(r => parseInt(r.id))) + 1),
        ...formData,
        distance: parseInt(formData.distance),
        tarif_base: parseInt(formData.tarif_base),
        frequence: 'À définir',
        bus_assignes: 0,
        statut: 'active',
        created_at: new Date().toISOString().split('T')[0],
      }
      setRoutes([...routes, newRoute as any])
      alert('Route créée')
    }
    setShowModal(false)
  }

  const columns: Column<any>[] = [
    { key: 'code', label: 'Code', sortable: true },
    { key: 'depart', label: 'Départ', sortable: true },
    { key: 'arrivee', label: 'Arrivée', sortable: true },
    { key: 'distance', label: 'Distance', render: (d: number) => `${d} km` },
    { key: 'duree_estimee', label: 'Durée' },
    { key: 'tarif_base', label: 'Tarif', render: (t: number) => `${t} XOF` },
    { key: 'bus_assignes', label: 'Bus', render: (b: number) => `${b} bus` },
    { key: 'statut', label: 'Statut', render: (s: string) => <Badge variant="success">{s}</Badge> },
  ]

  return (
    <AdminLayout userRole={currentUser?.roles?.[0]?.name || 'admin'} userEmail={currentUser?.email}>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Gestion des Routes</h1>
          <p className="text-slate-600 mt-2">Gérez les trajets et itinéraires</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <MapPin className="w-8 h-8 text-blue-600" />
              <div>
                <div className="text-sm text-slate-600">Total Routes</div>
                <div className="text-2xl font-bold text-slate-900">{routes.length}</div>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="w-8 h-8 text-orange-600" />
              <div>
                <div className="text-sm text-slate-600">Distance Totale</div>
                <div className="text-2xl font-bold text-slate-900">{routes.reduce((sum, r) => sum + r.distance, 0)} km</div>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <DollarSign className="w-8 h-8 text-green-600" />
              <div>
                <div className="text-sm text-slate-600">Tarif Moyen</div>
                <div className="text-2xl font-bold text-slate-900">{Math.round(routes.reduce((sum, r) => sum + r.tarif_base, 0) / routes.length)} XOF</div>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-purple-600" />
              <div>
                <div className="text-sm text-slate-600">Bus Assignés</div>
                <div className="text-2xl font-bold text-slate-900">{routes.reduce((sum, r) => sum + r.bus_assignes, 0)}</div>
              </div>
            </div>
          </Card>
        </div>

        <DataTable
          columns={columns}
          data={routes}
          keyField="id"
          onEdit={handleEdit}
          onDelete={handleDelete}
          onAdd={() => {
            setSelectedRoute(null)
            setFormData({ code: '', depart: '', arrivee: '', distance: '', duree_estimee: '', tarif_base: '' })
            setShowModal(true)
          }}
          searchable={true}
          searchFields={['code', 'depart', 'arrivee']}
          loading={false}
          pagination={true}
          pageSize={10}
        />

        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-2xl">
              <div className="p-6">
                <h2 className="text-2xl font-bold text-slate-900 mb-6">
                  {selectedRoute ? 'Modifier la route' : 'Créer une nouvelle route'}
                </h2>

                <div className="space-y-4">
                  <input type="text" placeholder="Code Route" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-lg" />
                  <div className="grid grid-cols-2 gap-4">
                    <input type="text" placeholder="Départ" value={formData.depart} onChange={e => setFormData({...formData, depart: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-lg" />
                    <input type="text" placeholder="Arrivée" value={formData.arrivee} onChange={e => setFormData({...formData, arrivee: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-lg" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <input type="number" placeholder="Distance (km)" value={formData.distance} onChange={e => setFormData({...formData, distance: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-lg" />
                    <input type="text" placeholder="Durée estimée" value={formData.duree_estimee} onChange={e => setFormData({...formData, duree_estimee: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-lg" />
                  </div>
                  <input type="number" placeholder="Tarif de base (XOF)" value={formData.tarif_base} onChange={e => setFormData({...formData, tarif_base: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-lg" />
                </div>

                <div className="flex gap-3 mt-6">
                  <Button variant="outline" onClick={() => setShowModal(false)} className="flex-1">Annuler</Button>
                  <Button onClick={handleSave} className="flex-1">{selectedRoute ? 'Mettre à jour' : 'Créer'}</Button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}

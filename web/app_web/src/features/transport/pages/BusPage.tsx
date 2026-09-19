import React, { useEffect, useState } from 'react'
import { AdminLayout } from '@/components/shared/AdminLayout'
import { DataTable } from '@/components/shared/DataTable'
import type { Column } from '@/components/shared/DataTable'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/hooks/useAuth'
import { Bus, MapPin, Users, AlertCircle } from 'lucide-react'

// Mock data pour demo
const mockBuses = [
  {
    id: '1',
    numero: 'BUS-001',
    marque: 'Volvo',
    modele: 'B11R',
    capacite: 50,
    sieges_disponibles: 12,
    immatriculation: 'SN-001-AA',
    annee_fabrication: 2022,
    etat: 'active',
    kilometre: 45230,
    date_revision: '2024-09-01',
    created_at: '2024-01-15',
  },
  {
    id: '2',
    numero: 'BUS-002',
    marque: 'Scania',
    modele: 'K440',
    capacite: 48,
    sieges_disponibles: 5,
    immatriculation: 'SN-002-AA',
    annee_fabrication: 2021,
    etat: 'active',
    kilometre: 78450,
    date_revision: '2024-08-15',
    created_at: '2024-01-20',
  },
  {
    id: '3',
    numero: 'BUS-003',
    marque: 'Mercedes',
    modele: 'O500',
    capacite: 52,
    sieges_disponibles: 0,
    immatriculation: 'SN-003-AA',
    annee_fabrication: 2020,
    etat: 'maintenance',
    kilometre: 125680,
    date_revision: '2024-07-20',
    created_at: '2024-02-01',
  },
]

export function BusPage() {
  const { user: currentUser } = useAuth()
  const [buses, setBuses] = useState(mockBuses)
  const [showModal, setShowModal] = useState(false)
  const [selectedBus, setSelectedBus] = useState<any>(null)
  const [formData, setFormData] = useState({
    numero: '',
    marque: '',
    modele: '',
    capacite: '',
    immatriculation: '',
    annee_fabrication: '',
  })

  const handleEdit = (bus: any) => {
    setSelectedBus(bus)
    setFormData({
      numero: bus.numero,
      marque: bus.marque,
      modele: bus.modele,
      capacite: bus.capacite,
      immatriculation: bus.immatriculation,
      annee_fabrication: bus.annee_fabrication,
    })
    setShowModal(true)
  }

  const handleDelete = (bus: any) => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer le bus ${bus.numero}?`)) {
      setBuses(buses.filter(b => b.id !== bus.id))
      alert('Bus supprimé avec succès')
    }
  }

  const handleSave = () => {
    if (!formData.numero || !formData.marque) {
      alert('Veuillez remplir les champs obligatoires')
      return
    }

    if (selectedBus) {
      setBuses(
        buses.map(b =>
          b.id === selectedBus.id
            ? { ...b, ...formData }
            : b
        )
      )
      alert('Bus mis à jour avec succès')
    } else {
      const newBus = {
        id: String(Math.max(...buses.map(b => parseInt(b.id))) + 1),
        ...formData,
        capacite: parseInt(formData.capacite),
        sieges_disponibles: parseInt(formData.capacite),
        etat: 'active',
        kilometre: 0,
        date_revision: new Date().toISOString().split('T')[0],
        created_at: new Date().toISOString().split('T')[0],
      }
      setBuses([...buses, newBus as any])
      alert('Bus créé avec succès')
    }
    setShowModal(false)
  }

  const columns: Column<any>[] = [
    {
      key: 'numero',
      label: 'N° Bus',
      sortable: true,
    },
    {
      key: 'marque',
      label: 'Marque',
      sortable: true,
    },
    {
      key: 'modele',
      label: 'Modèle',
    },
    {
      key: 'immatriculation',
      label: 'Immatriculation',
    },
    {
      key: 'capacite',
      label: 'Capacité',
      render: (capacite: number) => <span>{capacite} places</span>,
    },
    {
      key: 'sieges_disponibles',
      label: 'Disponible',
      render: (disponible: number, row: any) => (
        <Badge variant={disponible > 0 ? 'success' : 'destructive'}>
          {disponible} / {row.capacite}
        </Badge>
      ),
    },
    {
      key: 'etat',
      label: 'État',
      badge: true,
      badgeVariant: 'success',
      render: (etat: string) => (
        <Badge variant={etat === 'active' ? 'success' : 'warning'}>
          {etat === 'active' ? 'Actif' : 'Maintenance'}
        </Badge>
      ),
    },
    {
      key: 'kilometre',
      label: 'Kilométrage',
      render: (km: number) => `${km.toLocaleString('fr-FR')} km`,
    },
  ]

  const stats = {
    total: buses.length,
    actifs: buses.filter(b => b.etat === 'active').length,
    maintenance: buses.filter(b => b.etat === 'maintenance').length,
    placeDisponible: buses.reduce((sum, b) => sum + b.sieges_disponibles, 0),
  }

  return (
    <AdminLayout userRole={currentUser?.roles?.[0]?.name || 'admin'} userEmail={currentUser?.email}>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Gestion des Bus</h1>
          <p className="text-slate-600 mt-2">
            Gérez la flotte de bus de votre compagnie
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <Bus className="w-8 h-8 text-blue-600" />
              <div>
                <div className="text-sm text-slate-600">Total Bus</div>
                <div className="text-2xl font-bold text-slate-900">{stats.total}</div>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-8 h-8 text-green-600" />
              <div>
                <div className="text-sm text-slate-600">Bus Actifs</div>
                <div className="text-2xl font-bold text-slate-900">{stats.actifs}</div>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <MapPin className="w-8 h-8 text-orange-600" />
              <div>
                <div className="text-sm text-slate-600">Maintenance</div>
                <div className="text-2xl font-bold text-slate-900">{stats.maintenance}</div>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-purple-600" />
              <div>
                <div className="text-sm text-slate-600">Places Libres</div>
                <div className="text-2xl font-bold text-slate-900">{stats.placeDisponible}</div>
              </div>
            </div>
          </Card>
        </div>

        {/* Info Card */}
        <Card className="p-6 bg-blue-50 border-blue-200">
          <div className="flex items-start gap-3">
            <Bus className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-blue-900">Gestion de Flotte</h3>
              <p className="text-sm text-blue-800 mt-1">
                Suivez l'état de votre flotte, les révisions, et la disponibilité des bus.
              </p>
            </div>
          </div>
        </Card>

        {/* DataTable */}
        <DataTable
          columns={columns}
          data={buses}
          keyField="id"
          onEdit={handleEdit}
          onDelete={handleDelete}
          onAdd={() => {
            setSelectedBus(null)
            setFormData({
              numero: '',
              marque: '',
              modele: '',
              capacite: '',
              immatriculation: '',
              annee_fabrication: '',
            })
            setShowModal(true)
          }}
          searchable={true}
          searchFields={['numero', 'marque', 'modele', 'immatriculation']}
          loading={false}
          emptyMessage="Aucun bus trouvé"
          striped={true}
          hover={true}
          pagination={true}
          pageSize={10}
        />

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-2xl">
              <div className="p-6">
                <h2 className="text-2xl font-bold text-slate-900 mb-6">
                  {selectedBus ? 'Modifier le bus' : 'Ajouter un bus'}
                </h2>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        N° Bus *
                      </label>
                      <input
                        type="text"
                        value={formData.numero}
                        onChange={e => setFormData({ ...formData, numero: e.target.value })}
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-950"
                        placeholder="BUS-001"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Immatriculation *
                      </label>
                      <input
                        type="text"
                        value={formData.immatriculation}
                        onChange={e => setFormData({ ...formData, immatriculation: e.target.value })}
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-950"
                        placeholder="SN-001-AA"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Marque *
                      </label>
                      <input
                        type="text"
                        value={formData.marque}
                        onChange={e => setFormData({ ...formData, marque: e.target.value })}
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-950"
                        placeholder="Volvo"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Modèle *
                      </label>
                      <input
                        type="text"
                        value={formData.modele}
                        onChange={e => setFormData({ ...formData, modele: e.target.value })}
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-950"
                        placeholder="B11R"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Capacité (places) *
                      </label>
                      <input
                        type="number"
                        value={formData.capacite}
                        onChange={e => setFormData({ ...formData, capacite: e.target.value })}
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-950"
                        placeholder="50"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Année Fabrication
                      </label>
                      <input
                        type="number"
                        value={formData.annee_fabrication}
                        onChange={e => setFormData({ ...formData, annee_fabrication: e.target.value })}
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-950"
                        placeholder="2022"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <Button
                    variant="outline"
                    onClick={() => setShowModal(false)}
                    className="flex-1"
                  >
                    Annuler
                  </Button>
                  <Button onClick={handleSave} className="flex-1">
                    {selectedBus ? 'Mettre à jour' : 'Créer'}
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

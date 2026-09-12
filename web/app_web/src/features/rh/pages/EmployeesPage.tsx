import React, { useState } from 'react'
import { AdminLayout } from '@/components/shared/AdminLayout'
import { DataTable, Column } from '@/components/shared/DataTable'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/hooks/useAuth'
import { Users, Mail, Phone, MapPin } from 'lucide-react'

const mockEmployees = [
  {
    id: '1',
    nom_complet: 'Jean Dupont',
    email: 'jean.dupont@company.com',
    telephone: '+221 78 123 4567',
    poste: 'Chauffeur',
    gare: 'Dakar Central',
    date_embauche: '2022-03-15',
    etat: 'actif',
    created_at: '2022-03-15',
  },
  {
    id: '2',
    nom_complet: 'Marie Sow',
    email: 'marie.sow@company.com',
    telephone: '+221 77 987 6543',
    poste: 'Contrôleur',
    gare: 'Thiès',
    date_embauche: '2023-01-20',
    etat: 'actif',
    created_at: '2023-01-20',
  },
  {
    id: '3',
    nom_complet: 'Amadou Ba',
    email: 'amadou.ba@company.com',
    telephone: '+221 76 555 6789',
    poste: 'Chauffeur',
    gare: 'Dakar Central',
    date_embauche: '2021-11-10',
    etat: 'actif',
    created_at: '2021-11-10',
  },
]

export function EmployeesPage() {
  const { user: currentUser } = useAuth()
  const [employees, setEmployees] = useState(mockEmployees)
  const [showModal, setShowModal] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null)
  const [formData, setFormData] = useState({
    nom_complet: '',
    email: '',
    telephone: '',
    poste: '',
    gare: '',
  })

  const handleEdit = (employee: any) => {
    setSelectedEmployee(employee)
    setFormData({
      nom_complet: employee.nom_complet,
      email: employee.email,
      telephone: employee.telephone,
      poste: employee.poste,
      gare: employee.gare,
    })
    setShowModal(true)
  }

  const handleDelete = (employee: any) => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer ${employee.nom_complet}?`)) {
      setEmployees(employees.filter(e => e.id !== employee.id))
    }
  }

  const handleSave = () => {
    if (!formData.nom_complet || !formData.email || !formData.poste) {
      alert('Veuillez remplir tous les champs obligatoires')
      return
    }
    if (selectedEmployee) {
      setEmployees(
        employees.map(e =>
          e.id === selectedEmployee.id ? { ...e, ...formData } : e
        )
      )
    } else {
      setEmployees([
        ...employees,
        {
          id: String(Math.random()),
          ...formData,
          date_embauche: new Date().toISOString().split('T')[0],
          etat: 'actif',
          created_at: new Date().toISOString().split('T')[0],
        },
      ])
    }
    setShowModal(false)
    setFormData({ nom_complet: '', email: '', telephone: '', poste: '', gare: '' })
  }

  const handleAdd = () => {
    setSelectedEmployee(null)
    setFormData({ nom_complet: '', email: '', telephone: '', poste: '', gare: '' })
    setShowModal(true)
  }

  const columns: Column<any>[] = [
    {
      key: 'nom_complet',
      label: 'Nom Complet',
      sortable: true,
    },
    {
      key: 'email',
      label: 'Email',
    },
    {
      key: 'telephone',
      label: 'Téléphone',
    },
    {
      key: 'poste',
      label: 'Poste',
      badge: true,
    },
    {
      key: 'gare',
      label: 'Gare',
    },
    {
      key: 'date_embauche',
      label: 'Embauche',
      render: (date: string) => new Date(date).toLocaleDateString('fr-FR'),
    },
    {
      key: 'etat',
      label: 'Statut',
      render: (etat: string) => (
        <Badge variant={etat === 'actif' ? 'success' : 'destructive'}>
          {etat === 'actif' ? 'Actif' : 'Inactif'}
        </Badge>
      ),
    },
  ]

  const stats = {
    total: employees.length,
    actifs: employees.filter(e => e.etat === 'actif').length,
    chauffeurs: employees.filter(e => e.poste === 'Chauffeur').length,
  }

  return (
    <AdminLayout userRole={currentUser?.roles?.[0]?.name || 'admin'} userEmail={currentUser?.email}>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Gestion des Employés</h1>
          <p className="text-slate-600 mt-2">Gérez les employés de votre compagnie</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-blue-600" />
              <div>
                <div className="text-sm text-slate-600">Total Employés</div>
                <div className="text-2xl font-bold text-slate-900">{stats.total}</div>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <Mail className="w-8 h-8 text-green-600" />
              <div>
                <div className="text-sm text-slate-600">Actifs</div>
                <div className="text-2xl font-bold text-green-600">{stats.actifs}</div>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <Phone className="w-8 h-8 text-blue-600" />
              <div>
                <div className="text-sm text-slate-600">Chauffeurs</div>
                <div className="text-2xl font-bold text-blue-600">{stats.chauffeurs}</div>
              </div>
            </div>
          </Card>
        </div>

        <DataTable
          columns={columns}
          data={employees}
          keyField="id"
          onEdit={handleEdit}
          onDelete={handleDelete}
          onAdd={handleAdd}
          searchable={true}
          searchFields={['nom_complet', 'email', 'poste']}
          loading={false}
          pagination={true}
          pageSize={10}
        />

        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-2xl">
              <div className="p-6">
                <h2 className="text-2xl font-bold text-slate-900 mb-6">
                  {selectedEmployee ? 'Modifier' : 'Ajouter'} un employé
                </h2>

                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="Nom Complet"
                    value={formData.nom_complet}
                    onChange={e => setFormData({ ...formData, nom_complet: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg"
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg"
                  />
                  <input
                    type="tel"
                    placeholder="Téléphone"
                    value={formData.telephone}
                    onChange={e => setFormData({ ...formData, telephone: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg"
                  />
                  <select
                    value={formData.poste}
                    onChange={e => setFormData({ ...formData, poste: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg"
                  >
                    <option value="">Sélectionner un poste</option>
                    <option value="Chauffeur">Chauffeur</option>
                    <option value="Contrôleur">Contrôleur</option>
                    <option value="Mécanicien">Mécanicien</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Gare"
                    value={formData.gare}
                    onChange={e => setFormData({ ...formData, gare: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg"
                  />
                </div>

                <div className="flex gap-3 mt-6">
                  <Button variant="outline" onClick={() => setShowModal(false)} className="flex-1">
                    Annuler
                  </Button>
                  <Button onClick={handleSave} className="flex-1">
                    {selectedEmployee ? 'Mettre à jour' : 'Ajouter'}
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

import React, { useEffect, useState } from 'react'
import { AdminLayout } from '@/components/shared/AdminLayout'
import { DataTable } from '@/components/shared/DataTable'
import type { Column } from '@/components/shared/DataTable'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Edit, Trash2 } from 'lucide-react'

interface Permission {
  id: string
  name: string
  resource: string
  action: string
}

interface Role {
  id: string
  name: string
  description: string
  permissions: Permission[]
  is_active: boolean
  created_at: string
}

interface RolesPageProps {
  userRole?: string
  userEmail?: string
}

export function RolesPage({
  userRole = 'admin',
  userEmail = 'admin@company.com',
}: RolesPageProps) {
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    // Simuler le chargement des rôles
    setTimeout(() => {
      setRoles([
        {
          id: '1',
          name: 'Administrateur',
          description: 'Accès complet à la plateforme',
          permissions: [
            { id: '1', name: 'bus.create', resource: 'bus', action: 'create' },
            { id: '2', name: 'bus.read', resource: 'bus', action: 'read' },
            { id: '3', name: 'bus.update', resource: 'bus', action: 'update' },
            { id: '4', name: 'bus.delete', resource: 'bus', action: 'delete' },
            { id: '5', name: 'iam.read', resource: 'iam', action: 'read' },
            { id: '6', name: 'iam.update', resource: 'iam', action: 'update' },
          ],
          is_active: true,
          created_at: '2024-01-15',
        },
        {
          id: '2',
          name: 'Manager',
          description: 'Gestion des trajets et employés',
          permissions: [
            { id: '1', name: 'bus.read', resource: 'bus', action: 'read' },
            { id: '2', name: 'bus.update', resource: 'bus', action: 'update' },
            { id: '7', name: 'trajet.create', resource: 'trajet', action: 'create' },
            { id: '8', name: 'trajet.read', resource: 'trajet', action: 'read' },
            { id: '9', name: 'employe.read', resource: 'employe', action: 'read' },
          ],
          is_active: true,
          created_at: '2024-01-20',
        },
        {
          id: '3',
          name: 'Contrôleur',
          description: 'Validation des billets à bord',
          permissions: [
            { id: '2', name: 'bus.read', resource: 'bus', action: 'read' },
            { id: '10', name: 'billet.read', resource: 'billet', action: 'read' },
            { id: '11', name: 'billet.update', resource: 'billet', action: 'update' },
          ],
          is_active: true,
          created_at: '2024-02-01',
        },
        {
          id: '4',
          name: 'Réceptionniste',
          description: 'Vente de billets',
          permissions: [
            { id: '12', name: 'billet.create', resource: 'billet', action: 'create' },
            { id: '10', name: 'billet.read', resource: 'billet', action: 'read' },
            { id: '13', name: 'paiement.read', resource: 'paiement', action: 'read' },
          ],
          is_active: true,
          created_at: '2024-02-05',
        },
      ])
      setLoading(false)
    }, 1000)
  }, [])

  const columns: Column<Role>[] = [
    {
      key: 'name',
      label: 'Nom du rôle',
      sortable: true,
    },
    {
      key: 'description',
      label: 'Description',
    },
    {
      key: 'permissions',
      label: 'Permissions',
      render: (permissions: Permission[]) => (
        <span className="text-sm text-slate-600">
          {permissions.length} permission{permissions.length > 1 ? 's' : ''}
        </span>
      ),
    },
    {
      key: 'is_active',
      label: 'Statut',
      badge: true,
      badgeVariant: 'success',
      render: (isActive: boolean) => (
        <span className={isActive ? 'text-green-600' : 'text-red-600'}>
          {isActive ? 'Actif' : 'Inactif'}
        </span>
      ),
    },
    {
      key: 'created_at',
      label: 'Créé le',
      render: (date: string) => new Date(date).toLocaleDateString('fr-FR'),
    },
  ]

  const handleEdit = (role: Role) => {
    setSelectedRole(role)
    setShowModal(true)
  }

  const handleDelete = (role: Role) => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer le rôle "${role.name}"?`)) {
      setRoles(roles.filter(r => r.id !== role.id))
    }
  }

  const handleAdd = () => {
    setSelectedRole(null)
    setShowModal(true)
  }

  return (
    <AdminLayout userRole={userRole} userEmail={userEmail}>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Gestion des Rôles</h1>
          <p className="text-slate-600 mt-2">
            Créez et gérez les rôles avec leurs permissions associées
          </p>
        </div>

        {/* Description card */}
        <Card className="p-6 bg-blue-50 border-blue-200">
          <h3 className="font-semibold text-blue-900 mb-2">
            À propos des rôles
          </h3>
          <p className="text-sm text-blue-800">
            Un rôle est un ensemble de permissions qui définit ce qu'un utilisateur
            peut faire dans la plateforme. Vous pouvez créer des rôles personnalisés
            en sélectionnant les permissions nécessaires.
          </p>
        </Card>

        {/* Data Table */}
        <DataTable
          columns={columns}
          data={roles}
          keyField="id"
          onEdit={handleEdit}
          onDelete={handleDelete}
          onAdd={handleAdd}
          searchable={true}
          searchFields={['name', 'description']}
          loading={loading}
          emptyMessage="Aucun rôle trouvé"
          striped={true}
          hover={true}
          pagination={true}
          pageSize={10}
        />

        {/* Modal for editing roles */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-2xl max-h-96 overflow-auto">
              <div className="p-6">
                <h2 className="text-2xl font-bold text-slate-900 mb-4">
                  {selectedRole ? 'Modifier le rôle' : 'Créer un nouveau rôle'}
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Nom du rôle
                    </label>
                    <input
                      type="text"
                      defaultValue={selectedRole?.name || ''}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-950"
                      placeholder="Ex: Gestionnaire de gare"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Description
                    </label>
                    <textarea
                      defaultValue={selectedRole?.description || ''}
                      rows={3}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-950"
                      placeholder="Décrivez le but de ce rôle..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Permissions
                    </label>
                    <div className="border border-slate-200 rounded-lg p-4 bg-slate-50 max-h-64 overflow-y-auto">
                      <div className="space-y-3">
                        {selectedRole?.permissions.map(perm => (
                          <div
                            key={perm.id}
                            className="flex items-center gap-3 p-2 bg-white rounded border border-slate-200"
                          >
                            <input
                              type="checkbox"
                              defaultChecked={true}
                              className="w-4 h-4"
                            />
                            <div>
                              <p className="text-sm font-medium text-slate-900">
                                {perm.name}
                              </p>
                              <p className="text-xs text-slate-500">
                                {perm.resource}.{perm.action}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
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
                  <Button onClick={() => setShowModal(false)} className="flex-1">
                    {selectedRole ? 'Mettre à jour' : 'Créer'}
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

import React, { useEffect, useState } from 'react'
import { AdminLayout } from '@/components/shared/AdminLayout'
import { DataTable } from '@/components/shared/DataTable'
import type { Column } from '@/components/shared/DataTable'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useUsers } from '@/hooks/useUsers'
import { useRoles } from '@/hooks/useRoles'
import { useAuth } from '@/hooks/useAuth'
import { Mail, Lock, Shield } from 'lucide-react'

export function UsersPage() {
  const { users, loading, fetchUsers, createUser, updateUser, deleteUser } = useUsers()
  const { roles, fetchRoles } = useRoles()
  const { user: currentUser } = useAuth()
  const [showModal, setShowModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    first_name: '',
    last_name: '',
    roles: [] as string[],
  })

  useEffect(() => {
    fetchUsers()
    fetchRoles()
  }, [])

  const handleOpenCreateModal = () => {
    setSelectedUser(null)
    setFormData({
      email: '',
      username: '',
      password: '',
      first_name: '',
      last_name: '',
      roles: [],
    })
    setShowModal(true)
  }

  const handleOpenEditModal = (user: any) => {
    setSelectedUser(user)
    setFormData({
      email: user.email,
      username: user.username,
      password: '',
      first_name: user.first_name,
      last_name: user.last_name,
      roles: user.roles.map((r: any) => r.id),
    })
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!formData.email || !formData.username) {
      alert('Veuillez remplir les champs obligatoires')
      return
    }

    if (selectedUser) {
      // Update
      const updateData: any = {
        email: formData.email,
        username: formData.username,
        first_name: formData.first_name,
        last_name: formData.last_name,
        role_ids: formData.roles,
      }
      if (formData.password) {
        updateData.password = formData.password
      }
      const result = await updateUser(selectedUser.id, updateData)
      if (result) {
        setShowModal(false)
        alert('Utilisateur mis à jour avec succès')
      }
    } else {
      // Create
      if (!formData.password) {
        alert('Le mot de passe est obligatoire pour créer un nouvel utilisateur')
        return
      }
      const result = await createUser({
        email: formData.email,
        username: formData.username,
        password: formData.password,
        first_name: formData.first_name,
        last_name: formData.last_name,
        role_ids: formData.roles,
      })
      if (result) {
        setShowModal(false)
        alert('Utilisateur créé avec succès')
      }
    }
  }

  const handleDelete = (user: any) => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer ${user.email}?`)) {
      deleteUser(user.id).then(success => {
        if (success) {
          alert('Utilisateur supprimé avec succès')
        }
      })
    }
  }

  const columns: Column<any>[] = [
    {
      key: 'email',
      label: 'Email',
      sortable: true,
    },
    {
      key: 'username',
      label: 'Nom d\'utilisateur',
      sortable: true,
    },
    {
      key: 'first_name',
      label: 'Prénom',
    },
    {
      key: 'last_name',
      label: 'Nom',
    },
    {
      key: 'roles',
      label: 'Rôles',
      render: (roles: any[]) => (
        <div className="flex flex-wrap gap-1">
          {roles.slice(0, 2).map((role) => (
            <span key={role.id} className="text-xs bg-slate-100 px-2 py-1 rounded">
              {role.name}
            </span>
          ))}
          {roles.length > 2 && (
            <span className="text-xs bg-slate-100 px-2 py-1 rounded">
              +{roles.length - 2}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'is_active',
      label: 'Statut',
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

  return (
    <AdminLayout userRole={currentUser?.roles?.[0]?.name || 'admin'} userEmail={currentUser?.email}>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Gestion des Utilisateurs</h1>
          <p className="text-slate-600 mt-2">
            Créez, modifiez et gérez les utilisateurs de votre compagnie
          </p>
        </div>

        {/* Info Card */}
        <Card className="p-6 bg-blue-50 border-blue-200">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-blue-900">À propos des utilisateurs</h3>
              <p className="text-sm text-blue-800 mt-1">
                Chaque utilisateur est associé à des rôles qui définissent ses permissions.
                Vous pouvez assigner plusieurs rôles à un utilisateur pour un contrôle granulaire des accès.
              </p>
            </div>
          </div>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4">
            <div className="text-sm text-slate-600">Total Utilisateurs</div>
            <div className="text-2xl font-bold text-slate-900 mt-1">{users.length}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-slate-600">Utilisateurs Actifs</div>
            <div className="text-2xl font-bold text-green-600 mt-1">
              {users.filter(u => u.is_active).length}
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-slate-600">Utilisateurs Inactifs</div>
            <div className="text-2xl font-bold text-red-600 mt-1">
              {users.filter(u => !u.is_active).length}
            </div>
          </Card>
        </div>

        {/* DataTable */}
        <DataTable
          columns={columns}
          data={users}
          keyField="id"
          onEdit={handleOpenEditModal}
          onDelete={handleDelete}
          onAdd={handleOpenCreateModal}
          searchable={true}
          searchFields={['email', 'username', 'first_name', 'last_name']}
          loading={loading}
          emptyMessage="Aucun utilisateur trouvé"
          striped={true}
          hover={true}
          pagination={true}
          pageSize={10}
        />

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-2xl max-h-96 overflow-auto">
              <div className="p-6">
                <h2 className="text-2xl font-bold text-slate-900 mb-6">
                  {selectedUser ? 'Modifier l\'utilisateur' : 'Créer un nouvel utilisateur'}
                </h2>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Email *
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                        <input
                          type="email"
                          value={formData.email}
                          onChange={e => setFormData({ ...formData, email: e.target.value })}
                          className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-950"
                          placeholder="user@company.com"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Nom d\'utilisateur *
                      </label>
                      <input
                        type="text"
                        value={formData.username}
                        onChange={e => setFormData({ ...formData, username: e.target.value })}
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-950"
                        placeholder="username"
                      />
                    </div>
                  </div>

                  {!selectedUser && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Mot de passe *
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                        <input
                          type="password"
                          value={formData.password}
                          onChange={e => setFormData({ ...formData, password: e.target.value })}
                          className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-950"
                          placeholder="••••••••"
                        />
                      </div>
                    </div>
                  )}

                  {selectedUser && formData.password && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Nouveau mot de passe (laisser vide pour ne pas changer)
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                        <input
                          type="password"
                          value={formData.password}
                          onChange={e => setFormData({ ...formData, password: e.target.value })}
                          className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-950"
                          placeholder="••••••••"
                        />
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Prénom
                      </label>
                      <input
                        type="text"
                        value={formData.first_name}
                        onChange={e => setFormData({ ...formData, first_name: e.target.value })}
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-950"
                        placeholder="Jean"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Nom
                      </label>
                      <input
                        type="text"
                        value={formData.last_name}
                        onChange={e => setFormData({ ...formData, last_name: e.target.value })}
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-950"
                        placeholder="Dupont"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Rôles
                    </label>
                    <div className="border border-slate-200 rounded-lg p-3 bg-slate-50 max-h-48 overflow-y-auto">
                      {roles.map(role => (
                        <div key={role.id} className="flex items-center mb-2">
                          <input
                            type="checkbox"
                            id={`role-${role.id}`}
                            checked={formData.roles.includes(role.id)}
                            onChange={e => {
                              if (e.target.checked) {
                                setFormData({
                                  ...formData,
                                  roles: [...formData.roles, role.id],
                                })
                              } else {
                                setFormData({
                                  ...formData,
                                  roles: formData.roles.filter(r => r !== role.id),
                                })
                              }
                            }}
                            className="w-4 h-4"
                          />
                          <label htmlFor={`role-${role.id}`} className="ml-2 text-sm text-slate-700">
                            {role.name}
                          </label>
                        </div>
                      ))}
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
                    {selectedUser ? 'Mettre à jour' : 'Créer'}
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

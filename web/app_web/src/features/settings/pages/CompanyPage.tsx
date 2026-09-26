import React, { useState } from 'react'
import { AdminLayout } from '@/components/shared/AdminLayout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import { Building2, Mail, Phone, MapPin } from 'lucide-react'

export function CompanyPage() {
  const { user: currentUser, company } = useAuth()
  const [formData, setFormData] = useState({
    nom: company?.name || 'Ma Compagnie',
    email: company?.email || 'contact@company.com',
    telephone: '+221 33 XXXX XXXX',
    adresse: '123 Rue de l\'Indépendance, Dakar',
    ville: 'Dakar',
    codePostal: '18000',
    abonnement: 'Pro',
  })
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <AdminLayout userRole={currentUser?.roles?.[0]?.name || 'admin'} userEmail={currentUser?.email}>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Paramètres Compagnie</h1>
          <p className="text-slate-600 mt-2">Gérez les informations de votre compagnie</p>
        </div>

        {saved && (
          <Card className="p-4 bg-green-50 border-green-200">
            <p className="text-green-900">✓ Paramètres sauvegardés avec succès</p>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="p-6 lg:col-span-1">
            <div className="flex flex-col items-center">
              <div className="w-24 h-24 bg-slate-200 rounded-full flex items-center justify-center mb-4">
                <Building2 className="w-12 h-12 text-slate-400" />
              </div>
              <p className="text-center font-semibold text-slate-900">{formData.nom}</p>
              <p className="text-sm text-slate-600 text-center">Abonnement: {formData.abonnement}</p>
              <Button className="w-full mt-4">Changer le logo</Button>
            </div>
          </Card>

          <Card className="p-6 lg:col-span-2 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Nom Compagnie</label>
              <input type="text" value={formData.nom} onChange={e => setFormData({...formData, nom: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-lg" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                <div className="flex gap-2">
                  <Mail className="w-5 h-5 text-slate-400 mt-2.5" />
                  <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="flex-1 px-4 py-2 border border-slate-200 rounded-lg" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Téléphone</label>
                <div className="flex gap-2">
                  <Phone className="w-5 h-5 text-slate-400 mt-2.5" />
                  <input type="tel" value={formData.telephone} onChange={e => setFormData({...formData, telephone: e.target.value})} className="flex-1 px-4 py-2 border border-slate-200 rounded-lg" />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Adresse</label>
              <div className="flex gap-2">
                <MapPin className="w-5 h-5 text-slate-400 mt-2.5" />
                <input type="text" value={formData.adresse} onChange={e => setFormData({...formData, adresse: e.target.value})} className="flex-1 px-4 py-2 border border-slate-200 rounded-lg" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input placeholder="Ville" value={formData.ville} onChange={e => setFormData({...formData, ville: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-lg" />
              <input placeholder="Code Postal" value={formData.codePostal} onChange={e => setFormData({...formData, codePostal: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-lg" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Abonnement</label>
              <select value={formData.abonnement} onChange={e => setFormData({...formData, abonnement: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-lg">
                <option>Free</option>
                <option>Pro</option>
                <option>Enterprise</option>
              </select>
            </div>

            <Button onClick={handleSave} className="w-full">Enregistrer les modifications</Button>
          </Card>
        </div>

        <Card className="p-6 bg-yellow-50 border-yellow-200">
          <h3 className="font-semibold text-yellow-900 mb-2">Zone Dangereuse</h3>
          <p className="text-sm text-yellow-800 mb-4">Attention: ces actions ne peuvent pas être annulées</p>
          <Button variant="destructive" className="w-full">Supprimer cette compagnie</Button>
        </Card>
      </div>
    </AdminLayout>
  )
}

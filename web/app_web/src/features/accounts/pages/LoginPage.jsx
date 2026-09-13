import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Mail, Lock, Loader2, AlertCircle, Bus } from 'lucide-react'

export default function LoginPage() {
  const navigate = useNavigate()
  const [credentials, setCredentials] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleLogin = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const response = await fetch('http://localhost:8000/api/iam/auth/login/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: credentials.email,
          password: credentials.password,
        }),
      })

      if (!response.ok) {
        throw new Error('Email ou mot de passe incorrect')
      }

      const data = await response.json()
      localStorage.setItem('access_token', data.access)
      localStorage.setItem('refresh_token', data.refresh)
      localStorage.setItem('user', JSON.stringify(data.user))
      localStorage.setItem('username', data.user?.username || data.user?.email || '')
      localStorage.setItem('company', JSON.stringify(data.company))
      localStorage.setItem('is_super_admin', JSON.stringify(data.is_super_admin))

      // Redirection selon le rôle (legacy pages /chef, /sav, /controleur, ...
      // restent en place ; le Super Admin Central atterrit sur le nouveau dashboard)
      const ROUTE_BY_ROLE = {
        CHEF_COMPAGNIE: '/chef',
        SAV: '/sav',
        CONTROLEUR: '/controleur',
        COMPTABLE: '/comptable',
        RECEPTIONNISTE: '/receptionniste',
      }

      if (data.is_super_admin) {
        navigate('/dashboard')
      } else {
        navigate(ROUTE_BY_ROLE[data.role] || '/dashboard')
      }
    } catch (err) {
      setError(err.message || 'Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo & Header */}
        <div className="text-center mb-8">
          <div className="inline-block bg-gradient-to-br from-blue-600 to-blue-700 p-3 rounded-lg mb-4 shadow-lg">
            <Bus className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Transport Manager</h1>
          <p className="text-slate-400">Plateforme multi-tenant</p>
        </div>

        {/* Login Card */}
        <Card className="bg-white shadow-2xl border-0">
          <div className="p-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Connexion</h2>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-4">
              {/* Email Input */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                  <Input
                    type="email"
                    placeholder="admin@dakar-transport.com"
                    value={credentials.email}
                    onChange={(e) =>
                      setCredentials({ ...credentials, email: e.target.value })
                    }
                    className="pl-10 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Mot de passe
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={credentials.password}
                    onChange={(e) =>
                      setCredentials({ ...credentials, password: e.target.value })
                    }
                    className="pl-10 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white py-2.5 rounded-lg font-medium transition flex items-center justify-center gap-2 mt-6"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {loading ? 'Connexion...' : 'Se connecter'}
              </Button>
            </form>

            {/* Demo Credentials */}
            <div className="mt-8 pt-6 border-t border-slate-200">
              <p className="text-sm font-semibold text-slate-900 mb-3">Identifiants de test:</p>
              <div className="space-y-2">
                <div className="p-3 bg-blue-50 rounded border border-blue-200 text-xs">
                  <p className="font-medium">👑 Super Admin</p>
                  <p className="text-slate-600">superadmin@platform.com / superadmin@2024</p>
                </div>
                <div className="p-3 bg-green-50 rounded border border-green-200 text-xs">
                  <p className="font-medium">🏢 Dakar Transport</p>
                  <p className="text-slate-600">admin@dakar-transport.com / admin@2024</p>
                </div>
                <div className="p-3 bg-purple-50 rounded border border-purple-200 text-xs">
                  <p className="font-medium">🏢 Senegal Express</p>
                  <p className="text-slate-600">admin@senegal-express.com / admin@2024</p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Footer */}
        <p className="text-center text-slate-400 text-xs mt-6">
          © 2024 Transport Manager. Tous droits réservés.
        </p>
      </div>
    </div>
  )
}

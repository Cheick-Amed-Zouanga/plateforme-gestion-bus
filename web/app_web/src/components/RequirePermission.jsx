import { Link } from 'react-router-dom'
import { ShieldOff } from 'lucide-react'
import { AdminLayout } from '@/components/shared/AdminLayout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useDashboardUser } from '@/shared/hooks/useDashboardUser'

/**
 * Garde de permissions IAM.
 * Super Admin = accès total. Sinon, au moins une permission de `anyOf` est requise.
 */
function RequirePermission({ anyOf = [], children }) {
  const { isSuperAdmin, hasAnyPermission, userRole, userEmail, handleLogout } = useDashboardUser()

  if (isSuperAdmin || !anyOf.length || hasAnyPermission(...anyOf)) {
    return children
  }

  return (
    <AdminLayout userRole={userRole} userEmail={userEmail} onLogout={handleLogout}>
      <Card className="flex flex-col items-center justify-center gap-4 p-16 text-center">
        <ShieldOff className="h-10 w-10 text-slate-400" />
        <h2 className="text-lg font-semibold text-slate-900">Accès refusé</h2>
        <p className="max-w-md text-sm text-slate-500">
          Vous n&apos;avez pas la permission nécessaire pour ouvrir cette page.
          Contactez un administrateur si vous pensez qu&apos;il s&apos;agit d&apos;une erreur.
        </p>
        <Button asChild variant="outline">
          <Link to="/dashboard">Retour au dashboard</Link>
        </Button>
      </Card>
    </AdminLayout>
  )
}

export default RequirePermission

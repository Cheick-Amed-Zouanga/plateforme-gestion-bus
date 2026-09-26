import { AdminLayout } from '@/components/shared/AdminLayout'
import { Card } from '@/components/ui/card'
import { Construction } from 'lucide-react'
import { useDashboardUser } from '@/shared/hooks/useDashboardUser'

export default function ComingSoonPage({ title = 'Bientôt disponible' }) {
  const { userRole, userEmail, handleLogout } = useDashboardUser()

  return (
    <AdminLayout userRole={userRole} userEmail={userEmail} onLogout={handleLogout}>
      <Card className="flex flex-col items-center justify-center gap-3 p-16 text-center">
        <Construction className="h-10 w-10 text-slate-400" />
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        <p className="max-w-sm text-sm text-slate-500">
          Cette section est en cours de construction. Elle sera disponible dans une prochaine étape.
        </p>
      </Card>
    </AdminLayout>
  )
}

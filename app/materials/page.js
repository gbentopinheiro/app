import { redirect } from 'next/navigation'
import MaterialsClient from './MaterialsClient'
import { canAccessMaterialsManagement } from '../../lib/auth.js'
import { getServerSession } from '../../lib/server-session.js'

export default async function MaterialsPage() {
  const session = await getServerSession()

  if (!session) {
    redirect('/login')
  }

  if (!canAccessMaterialsManagement(session.role)) {
    redirect('/')
  }

  return <MaterialsClient />
}

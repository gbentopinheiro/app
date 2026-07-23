import { redirect } from 'next/navigation'
import MaterialsClient from './MaterialsClient'
import { hasPermission } from '../../lib/permissions.js'
import { getServerSession } from '../../lib/server-session.js'

export default async function MaterialsPage() {
  const session = await getServerSession()

  if (!session) {
    redirect('/login')
  }

  if (!hasPermission(session, 'materials.read')) {
    redirect('/')
  }

  return <MaterialsClient />
}

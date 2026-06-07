import { WorksPageView } from '../../page'

export default async function ClientWorksPage({ params }) {
  const { id } = await params

  return <WorksPageView forcedClientId={id} dedicatedClientView />
}

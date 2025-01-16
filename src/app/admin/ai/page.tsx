import { getSession } from '@auth0/nextjs-auth0'
import { redirect } from 'next/navigation'
import AdminToolsClient from './AdminToolsClient'

export default async function Page({ 
  params, 
  searchParams 
}: {
  params: { id: string }
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const session = await getSession()
  
  if (!session) {
    redirect('/api/auth/login')
  }

  return <AdminToolsClient params={params} searchParams={searchParams} />
}
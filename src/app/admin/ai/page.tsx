import { getSession } from '@auth0/nextjs-auth0'
import { redirect } from 'next/navigation'
import AdminToolsClient from './AdminToolsClient'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Admin - AI Tools',
}

interface PageContext {
  params: Promise<{ id: string }>
  searchParams: { [key: string]: string | string[] | undefined }
}

export default async function Page(context: PageContext) {
  const session = await getSession()
  if (!session) {
    redirect('/api/auth/login')
  }

  const params = await context.params
  return <AdminToolsClient params={params} searchParams={context.searchParams} />
}
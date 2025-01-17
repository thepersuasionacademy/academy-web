// page.tsx
import { getSession } from '@auth0/nextjs-auth0'
import { redirect } from 'next/navigation'
import AdminToolsClient from '../admin/ai/AdminToolsClient'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'AI Engine',
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
  return (
    <AdminToolsClient 
      params={params} 
      searchParams={context.searchParams} 
      hideCreationControls={true} 
    />
  )
}
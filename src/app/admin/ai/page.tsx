// src/app/admin/ai/page.tsx
import { getSession } from '@auth0/nextjs-auth0'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
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
  const headersList = await headers();
  const host = headersList.get('host');
  
  // Check for development conditions
  const isDevelopmentServer = 
    process.env.NODE_ENV === 'development' || 
    host === 'cautious-space-barnacle-69grq676rx4gf5vjv-3000.app.github.dev';

  // Only check auth if we're not in development
  if (!isDevelopmentServer) {
    const session = await getSession()
    if (!session) {
      redirect('/api/auth/login')
    }
  }

  const params = await context.params
  return <AdminToolsClient params={params} searchParams={context.searchParams} />
}
// src/app/admin/ai/page.tsx
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
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
    const supabase = createServerComponentClient({ cookies })
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      redirect('/auth/login')
    }
  }

  const params = await context.params
  return <AdminToolsClient params={params} searchParams={context.searchParams} />
}
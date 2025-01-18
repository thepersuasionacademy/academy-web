// page.tsx
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


  const params = await context.params
  return (
    <AdminToolsClient 
      params={params} 
      searchParams={context.searchParams} 
      hideCreationControls={true} 
    />
  )
}
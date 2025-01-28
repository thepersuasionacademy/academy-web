// page.tsx
import { redirect } from 'next/navigation'
import UserDashboardClient from './UserDashboardClient'
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
    <div className="bg-[var(--background)]">
      <UserDashboardClient 
        hideCreationControls={true} 
      />
    </div>
  )
}
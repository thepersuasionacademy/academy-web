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
    <div className="min-h-screen bg-[var(--background)]">
      <UserDashboardClient 
        hideCreationControls={true} 
      />
    </div>
  )
}

// Add this to your global CSS
// .bg-grid-pattern {
//   background-size: 40px 40px;
//   background-image: 
//     linear-gradient(to right, var(--border-color) 1px, transparent 1px),
//     linear-gradient(to bottom, var(--border-color) 1px, transparent 1px);
// }
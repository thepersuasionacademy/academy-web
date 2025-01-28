// src/app/ai/tools/[toolId]/page.tsx
import { notFound } from 'next/navigation'
import { AIToolFrame } from '@/app/content/components/dashboard/AIToolFrame'

interface ToolPageProps {
  params: { 
    toolId: string 
  }
}

export default function ToolPage({ params }: ToolPageProps) {
  const isDev = process.env.NODE_ENV === 'development'
  const toolId = params.toolId
  
  if (!toolId) {
    return notFound()
  }

  // Preserve existing functionality for slug-based URLs
  const isSlugUrl = !toolId.includes('#') // Assuming SK contains '#' and slugs don't

  return (
    <div className="h-screen w-full">
      <AIToolFrame 
        toolId={toolId}
        bypassAuth={isDev && !isSlugUrl} // Only bypass auth for SK-based URLs in dev
        {...(isSlugUrl && { isSlugUrl: true })} // Pass flag for slug-based routing
      />
    </div>
  )
}
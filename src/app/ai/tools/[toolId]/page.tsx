// src/app/ai/tools/[toolId]/page.tsx
import { notFound } from 'next/navigation'
import ToolPageClient from './ToolPageClient'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { slugify } from '@/lib/utils/slugify'
import type { AITool } from '@/lib/supabase/ai'

interface ToolPageProps {
  params: { 
    toolId: string 
  }
}

export default async function ToolPage({ params }: ToolPageProps) {
  const slug = params.toolId
  
  if (!slug) {
    console.error('No slug provided')
    return notFound()
  }

  try {
    const supabase = createServerComponentClient({ cookies })
    
    // Try to get the tool by slug using our Postgres function
    const { data: tools, error } = await supabase
      .rpc('get_tool_by_slug', { slug })

    if (error) {
      console.error('Error fetching tool:', error)
      return notFound()
    }

    if (!tools || tools.length === 0) {
      // If no direct match found, try fetching all tools
      const { data: allTools, error: listError } = await supabase
        .rpc('list_tools')

      if (listError) {
        console.error('Error fetching all tools:', listError)
        return notFound()
      }

      console.log('Available tools:', allTools?.map((t: AITool) => ({ 
        id: t.id, 
        title: t.title,
        slugified: slugify(t.title || '')
      })))

      return notFound()
    }

    const tool = tools[0]

    return (
      <div className="h-screen w-full">
        <ToolPageClient toolId={tool.id} />
      </div>
    )
  } catch (error) {
    console.error('Unexpected error in ToolPage:', error)
    return notFound()
  }
}
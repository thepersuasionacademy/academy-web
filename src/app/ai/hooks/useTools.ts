//src/app/ai/hooks/useTools.ts
import { useState, useEffect, useMemo } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { type AITool, type AICollection, type AISuite } from '@/lib/supabase/ai'

export function useTools(selectedCategory: string | null, selectedSuite: string | null) {
  const [tools, setTools] = useState<AITool[]>([])
  const [isLoadingTools, setIsLoadingTools] = useState(false)
  const [error, setError] = useState('')
  const supabase = useMemo(() => createClientComponentClient(), [])

  const fetchTools = async () => {
    if (!selectedCategory || !selectedSuite) {
      setTools([])
      return
    }

    try {
      console.log('useTools: Starting fetch for category:', selectedCategory, 'and suite:', selectedSuite)
      setIsLoadingTools(true)
      setError('')

      // First get the collection ID
      const { data: collections, error: collectionError } = await supabase.rpc('list_collections')
      
      if (collectionError) {
        console.error('useTools: Error fetching collections:', collectionError)
        throw collectionError
      }

      const collection = collections.find((c: AICollection) => c.title === selectedCategory)
      if (!collection) {
        console.error('useTools: Collection not found for category:', selectedCategory)
        throw new Error('Collection not found')
      }

      // Then get the suite ID
      const { data: suites, error: suitesError } = await supabase.rpc('get_suites_by_collection', {
        collection_id: collection.id
      })
      
      if (suitesError) {
        console.error('useTools: Error fetching suites:', suitesError)
        throw suitesError
      }

      const suite = suites.find((s: AISuite) => s.title === selectedSuite)
      if (!suite) {
        console.error('useTools: Suite not found for name:', selectedSuite)
        throw new Error('Suite not found')
      }

      // Finally get the tools
      const { data: tools, error: toolsError } = await supabase.rpc('get_tools_by_suite', {
        suite_id: suite.id
      })
      
      if (toolsError) {
        console.error('useTools: Error fetching tools:', toolsError)
        throw toolsError
      }

      console.log('useTools: Fetched tools:', tools)
      setTools(tools || [])
    } catch (error) {
      console.error('useTools: Error in hook:', error)
      setError(error instanceof Error ? error.message : 'Failed to load tools')
      setTools([])
    } finally {
      setIsLoadingTools(false)
    }
  }

  useEffect(() => {
    fetchTools()
  }, [selectedCategory, selectedSuite, supabase])

  return { tools, isLoadingTools, error, setTools, refreshTools: fetchTools }
}
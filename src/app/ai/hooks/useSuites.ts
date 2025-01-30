//src/app/ai/hooks/useSuites.ts
import { useState, useEffect, useMemo } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { type AISuite, type AICollection } from '@/lib/supabase/ai'

export function useSuites(selectedCategory: string | null) {
  const [suites, setSuites] = useState<AISuite[]>([])
  const [isLoadingSuites, setIsLoadingSuites] = useState(false)
  const [error, setError] = useState('')
  const supabase = useMemo(() => createClientComponentClient(), [])

  useEffect(() => {
    if (!selectedCategory) {
      setSuites([])
      return
    }

    const fetchSuites = async () => {
      try {
        console.log('useSuites: Starting fetch for category:', selectedCategory)
        setIsLoadingSuites(true)
        setError('')

        const { data: collections, error: collectionError } = await supabase.rpc('list_collections')
        
        if (collectionError) {
          console.error('useSuites: Error fetching collections:', collectionError)
          throw collectionError
        }

        const collection = collections.find((c: AICollection) => c.title === selectedCategory)
        if (!collection) {
          console.error('useSuites: Collection not found for category:', selectedCategory)
          throw new Error('Collection not found')
        }

        const { data: suites, error: suitesError } = await supabase.rpc('get_suites_by_collection', {
          collection_id: collection.id
        })
        
        if (suitesError) {
          console.error('useSuites: Error fetching suites:', suitesError)
          throw suitesError
        }

        console.log('useSuites: Fetched suites:', suites)
        setSuites(suites || [])
      } catch (error) {
        console.error('useSuites: Error in hook:', error)
        setError('Failed to load suites')
      } finally {
        setIsLoadingSuites(false)
      }
    }

    fetchSuites()
  }, [selectedCategory, supabase])

  return { suites, isLoadingSuites, error, setSuites }
}

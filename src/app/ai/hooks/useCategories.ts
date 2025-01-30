//src/app/ai/hooks/useCategories.ts
import { useState, useEffect, useMemo } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { type AICollection } from '@/lib/supabase/ai'

export function useCategories() {
  const [categories, setCategories] = useState<AICollection[]>([])
  const [isLoadingCategories, setIsLoadingCategories] = useState(false)
  const [error, setError] = useState('')
  const supabase = useMemo(() => createClientComponentClient(), [])

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        console.log('useCategories: Starting fetch...')
        setIsLoadingCategories(true)
        setError('')

        // Try direct Supabase call first
        const { data: collections, error: supabaseError } = await supabase.rpc('list_collections')
        
        if (supabaseError) {
          console.error('useCategories: Supabase error:', supabaseError)
          throw supabaseError
        }

        console.log('useCategories: Raw Supabase response:', collections)

        if (Array.isArray(collections)) {
          setCategories(collections)
        } else {
          console.error('useCategories: Unexpected data format:', collections)
          throw new Error('Unexpected data format from server')
        }
      } catch (error) {
        console.error('useCategories: Error in hook:', error)
        setError('Failed to load categories')
      } finally {
        setIsLoadingCategories(false)
      }
    }

    fetchCategories()
  }, [supabase])

  return { categories, isLoadingCategories, error, setCategories }
}
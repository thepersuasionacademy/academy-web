//src/app/ai/hooks/useSuites.ts
import { useState, useEffect } from 'react'
import { type Suite } from '@/app/ai/components/dashboard/types'

export function useSuites(selectedCategory: string | null) {
  const [suites, setSuites] = useState<Suite[]>([])
  const [isLoadingSuites, setIsLoadingSuites] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!selectedCategory) {
      setSuites([])
      return
    }

    const fetchSuites = async () => {
      try {
        setIsLoadingSuites(true)
        const response = await fetch('/api/ai/categories/suites', {
          headers: {
            'x-selected-category': selectedCategory
          }
        })
        
        if (!response.ok) {
          const errorText = await response.text()
          throw new Error('Failed to fetch suites')
        }
        
        const data = await response.json()
        if (Array.isArray(data.suites)) {
          setSuites(data.suites)
        }
      } catch (error) {
        console.error('Error fetching suites:', error)
        setError('Failed to load suites')
      } finally {
        setIsLoadingSuites(false)
      }
    }

    fetchSuites()
  }, [selectedCategory])

  return { suites, isLoadingSuites, error, setSuites }
}

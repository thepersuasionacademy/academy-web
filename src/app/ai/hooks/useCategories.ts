//src/app/ai/hooks/useCategories.ts
import { useState, useEffect } from 'react'
import { type Category } from '@/app/ai/components/dashboard/types'

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoadingCategories, setIsLoadingCategories] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setIsLoadingCategories(true)
        const response = await fetch('/api/ai/categories')
        if (!response.ok) throw new Error('Failed to fetch categories')
        const data = await response.json()
        if (Array.isArray(data.categories)) {
          setCategories(data.categories)
        }
      } catch (error) {
        console.error('Error fetching categories:', error)
        setError('Failed to load categories')
      } finally {
        setIsLoadingCategories(false)
      }
    }

    fetchCategories()
  }, [])

  return { categories, isLoadingCategories, error, setCategories }
}
'use client'

import { Plus } from 'lucide-react'
import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { AICollection } from '@/lib/supabase/ai'
import { useRouter } from 'next/navigation'

interface CategorySidebarProps {
  categories: AICollection[]
  selectedCategory: string | null
  onSelectCategory: (category: string) => void
  isLoadingCategories: boolean
  categoryInput: string
  setCategoryInput: (value: string) => void
  hideCreationControls?: boolean
}

export default function CategorySidebar({
  categories,
  selectedCategory,
  onSelectCategory,
  isLoadingCategories,
  categoryInput,
  setCategoryInput,
  hideCreationControls = false
}: CategorySidebarProps) {
  const [isCreatingCategory, setIsCreatingCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [localCategories, setLocalCategories] = useState<AICollection[]>(categories)
  const supabase = createClientComponentClient()
  const router = useRouter()

  useEffect(() => {
    setLocalCategories(categories)
  }, [categories])

  const refreshCategories = async () => {
    try {
      const { data: collections, error } = await supabase.rpc('list_collections')
      if (error) throw error
      
      setLocalCategories(collections)
      return collections
    } catch (err) {
      console.error('Error refreshing categories:', err)
      throw err
    }
  }

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')

    try {
      const { data: category, error } = await supabase.rpc('create_collection', {
        title: newCategoryName
      })

      if (error) throw error

      await refreshCategories()
      
      setNewCategoryName('')
      setIsCreatingCategory(false)
      
      onSelectCategory(category.title)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create category')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function signInWithGoogle() {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        console.error('Google OAuth error:', error);
        router.push(`/auth/login?error=${encodeURIComponent(error.message)}`);
      }
    } catch (err) {
      console.error('Unexpected error during Google sign-in:', err);
      router.push(`/auth/login?error=${encodeURIComponent('Unexpected error occurred')}`);
    }
  }

  return (
    <div className="w-64 border-r border-[var(--border-color)] p-4">
      <h2 className="text-[var(--foreground)] font-bold text-lg mb-4">Categories</h2>
      
      <div className="mb-4 space-y-2">
        {!hideCreationControls && (
          <>
            {!isCreatingCategory ? (
              <button
                onClick={() => setIsCreatingCategory(true)}
                className="w-full flex items-center justify-center px-4 py-2 bg-[var(--hover-bg)] hover:bg-[var(--hover-bg)] rounded-lg text-[var(--text-secondary)] transition-colors duration-200 gap-2"
              >
                <Plus className="h-4 w-4" />
                New Category
              </button>
            ) : (
              <form onSubmit={handleCreateCategory} className="space-y-2">
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Category name"
                  className="w-full px-4 py-2 bg-[var(--hover-bg)] rounded-lg text-[var(--foreground)] border border-[var(--border-color)] focus:outline-none focus:border-[var(--accent)]"
                  disabled={isSubmitting}
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={isSubmitting || !newCategoryName.trim()}
                    className="flex-1 px-4 py-2 bg-[var(--accent)] hover:bg-[var(--accent)] disabled:opacity-50 rounded-lg text-white transition-colors duration-200 text-sm"
                  >
                    {isSubmitting ? 'Creating...' : 'Create'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreatingCategory(false)
                      setNewCategoryName('')
                      setError('')
                    }}
                    className="flex-1 px-4 py-2 bg-[var(--hover-bg)] hover:bg-[var(--hover-bg)] rounded-lg text-[var(--text-secondary)] transition-colors duration-200 text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </>
        )}

        {error && (
          <div className="text-sm text-red-400">
            {error}
          </div>
        )}
      </div>
      
      {isLoadingCategories ? (
        <div className="text-[var(--text-secondary)] p-2">Loading categories...</div>
      ) : (
        localCategories.map((category) => (
          <div
            key={category.id}
            className={`mb-2 p-2 rounded-lg cursor-pointer transition-colors duration-200 ${
              selectedCategory === category.title 
                ? 'bg-[var(--accent)] text-white' 
                : 'text-[var(--text-secondary)] hover:bg-[var(--hover-bg)]'
            }`}
            onClick={() => onSelectCategory(category.title || '')}
          >
            {category.title}
          </div>
        ))
      )}
    </div>
  )
}
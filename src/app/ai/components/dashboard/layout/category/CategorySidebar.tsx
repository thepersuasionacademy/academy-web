'use client'

import { Plus } from 'lucide-react'
import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { AICollection } from '@/lib/supabase/ai'
import { useRouter } from 'next/navigation'
import { cn } from "@/lib/utils"

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
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${location.origin}/api/auth-callback`,
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
  }

  return (
    <div className="w-64 border-r border-[var(--border-color)] p-6 bg-[var(--background)]">
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-[var(--foreground)]">Categories</h2>
        
        {!hideCreationControls && (
          <div className="space-y-4">
            {!isCreatingCategory ? (
              <button
                onClick={() => setIsCreatingCategory(true)}
                className={cn(
                  "w-full flex items-center justify-center px-4 py-3",
                  "bg-[var(--accent)] text-white",
                  "rounded-xl hover:opacity-90",
                  "transition-all duration-200 gap-2",
                  "font-semibold"
                )}
              >
                <Plus className="h-5 w-5" />
                New Category
              </button>
            ) : (
              <form onSubmit={handleCreateCategory} className="space-y-3">
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Category name"
                  className={cn(
                    "w-full bg-transparent text-lg py-3 px-4",
                    "border border-[var(--border-color)]",
                    "focus:border-[var(--accent)]",
                    "text-[var(--foreground)]",
                    "rounded-xl",
                    "focus:outline-none transition-colors"
                  )}
                  disabled={isSubmitting}
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={isSubmitting || !newCategoryName.trim()}
                    className={cn(
                      "flex-1 px-4 py-2",
                      "bg-[var(--accent)] text-white",
                      "rounded-xl",
                      "hover:opacity-90 disabled:opacity-50",
                      "transition-all duration-200",
                      "font-semibold"
                    )}
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
                    className={cn(
                      "flex-1 px-4 py-2",
                      "border border-[var(--border-color)]",
                      "text-[var(--text-secondary)]",
                      "rounded-xl",
                      "hover:border-[var(--accent)] hover:text-[var(--foreground)]",
                      "transition-all duration-200",
                      "font-semibold"
                    )}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {error && (
          <div className="text-sm text-red-400">
            {error}
          </div>
        )}

        {isLoadingCategories ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-12 bg-[var(--hover-bg)] rounded-xl animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {localCategories.map((category) => (
              <button
                key={category.id}
                onClick={() => onSelectCategory(category.title || '')}
                className={cn(
                  "w-full text-left px-6 py-3 rounded-xl",
                  "transition-all duration-200",
                  "font-semibold",
                  "border",
                  selectedCategory === category.title
                    ? "bg-[var(--accent)] text-white border-[var(--accent)]"
                    : "text-[var(--text-secondary)] hover:text-[var(--foreground)] hover:bg-[var(--hover-bg)] hover:border-[var(--accent)] border-transparent"
                )}
              >
                {category.title}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
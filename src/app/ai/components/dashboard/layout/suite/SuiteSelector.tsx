'use client'

import { Plus } from 'lucide-react'
import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { AISuite } from '@/lib/supabase/ai'
import { cn } from "@/lib/utils"

interface SuiteSelectorProps {
  suites: AISuite[]
  selectedSuite: string | null
  onSelectSuite: (suite: string) => void
  isLoadingSuites: boolean
  selectedCategory: string
  hideCreationControls?: boolean
}

export default function SuiteSelector({
  suites,
  selectedSuite,
  onSelectSuite,
  isLoadingSuites,
  selectedCategory,
  hideCreationControls = false
}: SuiteSelectorProps) {
  const [isCreatingSuite, setIsCreatingSuite] = useState(false)
  const [newSuiteName, setNewSuiteName] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [localSuites, setLocalSuites] = useState<AISuite[]>(suites)
  const supabase = createClientComponentClient()

  useEffect(() => {
    setLocalSuites(suites)
  }, [suites])

  const refreshSuites = async () => {
    try {
      // First get the collection ID from the title
      const { data: collections, error: collectionError } = await supabase
        .from('ai.collections')
        .select('id')
        .eq('title', selectedCategory)
        .single()

      if (collectionError) throw collectionError
      if (!collections) throw new Error('Collection not found')

      const { data: suites, error } = await supabase
        .rpc('get_suites_by_collection', { collection_id: collections.id })
      
      if (error) throw error
      
      setLocalSuites(suites)
      return suites
    } catch (err) {
      console.error('Error refreshing suites:', err)
      throw err
    }
  }

  const handleCreateSuite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCategory) return

    setIsSubmitting(true)
    setError('')

    try {
      // First get the collection ID from the title
      const { data: collections, error: collectionError } = await supabase
        .from('ai.collections')
        .select('id')
        .eq('title', selectedCategory)
        .single()

      if (collectionError) throw collectionError
      if (!collections) throw new Error('Collection not found')

      const { data: suite, error } = await supabase.rpc('create_suite', {
        collection_id: collections.id,
        title: newSuiteName
      })

      if (error) throw error
      
      await refreshSuites()
      
      setNewSuiteName('')
      setIsCreatingSuite(false)
      
      onSelectSuite(suite.title)
    } catch (err) {
      console.error('Error in suite creation:', err)
      setError(err instanceof Error ? err.message : 'Failed to create suite')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="border-b border-[var(--border-color)] bg-[var(--background)]">
      <div className="p-6">
        <div className="space-y-6">
          {/* Header and Suites */}
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold text-[var(--foreground)]">Suites</h2>
            
            <div className="flex items-center gap-2">
              {isLoadingSuites ? (
                <div className="flex gap-2">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="w-32 h-10 bg-[var(--hover-bg)] rounded-xl animate-pulse"
                    />
                  ))}
                </div>
              ) : (
                localSuites.map((suite) => (
                  <button
                    key={suite.id}
                    onClick={() => onSelectSuite(suite.title || '')}
                    className={cn(
                      "px-6 py-2 rounded-xl",
                      "transition-all duration-200",
                      "font-semibold",
                      "border",
                      selectedSuite === suite.title
                        ? "bg-[var(--accent)] text-white border-[var(--accent)]"
                        : "text-[var(--text-secondary)] hover:text-[var(--foreground)] hover:bg-[var(--hover-bg)] hover:border-[var(--accent)] border-transparent"
                    )}
                  >
                    {suite.title}
                  </button>
                ))
              )}
            </div>

            {!hideCreationControls && !isCreatingSuite && (
              <button
                onClick={() => setIsCreatingSuite(true)}
                className={cn(
                  "flex items-center gap-2 px-6 py-2",
                  "bg-[var(--accent)] text-white",
                  "rounded-xl hover:opacity-90",
                  "transition-all duration-200",
                  "font-semibold",
                  "ml-auto"
                )}
              >
                <Plus className="w-5 h-5" />
                New Suite
              </button>
            )}
          </div>

          {/* Suite Creation Form */}
          {isCreatingSuite && (
            <form onSubmit={handleCreateSuite} className="flex gap-2">
              <input
                type="text"
                value={newSuiteName}
                onChange={(e) => setNewSuiteName(e.target.value)}
                placeholder="Enter suite name..."
                className={cn(
                  "flex-1 bg-transparent text-lg py-2 px-4",
                  "border border-[var(--border-color)]",
                  "focus:border-[var(--accent)]",
                  "text-[var(--foreground)]",
                  "rounded-xl",
                  "focus:outline-none transition-colors"
                )}
                disabled={isSubmitting}
                autoFocus
              />
              <button
                type="submit"
                disabled={isSubmitting || !newSuiteName.trim()}
                className={cn(
                  "px-6 py-2",
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
                  setIsCreatingSuite(false)
                  setNewSuiteName('')
                  setError('')
                }}
                className={cn(
                  "px-6 py-2",
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
            </form>
          )}

          {error && (
            <div className="text-sm text-red-400">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
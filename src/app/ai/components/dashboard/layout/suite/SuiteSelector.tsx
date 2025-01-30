'use client'

import { Plus } from 'lucide-react'
import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { AISuite } from '@/lib/supabase/ai'

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

  if (isLoadingSuites) {
    return (
      <div className="p-4 border-b border-[var(--border-color)]">
        <div className="text-[var(--text-secondary)]">Loading suites...</div>
      </div>
    )
  }

  return (
    <div className="p-4 border-b border-[var(--border-color)]">
      <div className="flex gap-2 flex-wrap items-center">
        <h2 className="text-[var(--foreground)] font-bold text-lg">Suites</h2>
        
        {localSuites.map((suite) => (
          <button
            key={suite.id}
            className={`px-4 py-2 rounded-full transition-colors duration-200 ${
              selectedSuite === suite.title
                ? 'bg-[var(--accent)] text-white'
                : 'text-[var(--text-secondary)] hover:bg-[var(--hover-bg)]'
            }`}
            onClick={() => onSelectSuite(suite.title || '')}
          >
            {suite.title}
          </button>
        ))}
        
        {!hideCreationControls && (
          <>
            {isCreatingSuite ? (
              <form onSubmit={handleCreateSuite} className="flex items-center gap-2">
                <input
                  type="text"
                  value={newSuiteName}
                  onChange={(e) => setNewSuiteName(e.target.value)}
                  placeholder="Suite name"
                  className="px-4 py-2 rounded-full bg-[var(--hover-bg)] text-[var(--foreground)] border border-[var(--border-color)] focus:outline-none focus:border-[var(--accent)]"
                  disabled={isSubmitting}
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={isSubmitting || !newSuiteName.trim()}
                  className="px-4 py-2 bg-[var(--accent)] hover:bg-[var(--accent)] disabled:opacity-50 rounded-full text-white transition-colors duration-200"
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
                  className="px-4 py-2 hover:bg-[var(--hover-bg)] rounded-full text-[var(--text-secondary)] transition-colors duration-200"
                >
                  Cancel
                </button>
              </form>
            ) : (
              <button
                onClick={() => setIsCreatingSuite(true)}
                className="flex items-center px-4 py-2 hover:bg-[var(--hover-bg)] rounded-full text-[var(--text-secondary)] transition-colors duration-200"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Suite
              </button>
            )}
          </>
        )}
      </div>
      
      {error && (
        <div className="mt-2 text-red-400 text-sm">
          {error}
        </div>
      )}
    </div>
  )
}
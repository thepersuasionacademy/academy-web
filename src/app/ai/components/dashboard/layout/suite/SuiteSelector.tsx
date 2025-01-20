'use client'

import { Plus } from 'lucide-react'
import { useState, useEffect } from 'react'

type Suite = {
  id: string
  name: string
}

interface SuiteSelectorProps {
  suites: Suite[]
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
  const [localSuites, setLocalSuites] = useState<Suite[]>(suites)

  useEffect(() => {
    setLocalSuites(suites)
  }, [suites])

  const refreshSuites = async () => {
    try {
      const response = await fetch('/api/ai/categories/suites', {
        headers: {
          'x-selected-category': selectedCategory
        }
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch suites')
      }
      
      const data = await response.json()
      setLocalSuites(data.suites)
      return data.suites
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
      const response = await fetch('/api/ai/categories/suites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-selected-category': selectedCategory
        },
        body: JSON.stringify({ name: newSuiteName })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create suite')
      }

      const data = await response.json()
      
      const updatedSuites = await refreshSuites()
      
      setNewSuiteName('')
      setIsCreatingSuite(false)
      
      onSelectSuite(data.suite.name)
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
              selectedSuite === suite.name
                ? 'bg-[var(--accent)] text-white'
                : 'text-[var(--text-secondary)] hover:bg-[var(--hover-bg)]'
            }`}
            onClick={() => onSelectSuite(suite.name)}
          >
            {suite.name}
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
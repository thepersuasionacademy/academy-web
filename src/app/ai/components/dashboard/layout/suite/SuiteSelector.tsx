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
    console.log('Refreshing suites for category:', selectedCategory)
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
      console.log('Fetched suites:', data.suites)
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
      console.log('Creating suite:', newSuiteName)
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
      console.log('Suite created:', data)
      
      const updatedSuites = await refreshSuites()
      console.log('Updated suites:', updatedSuites)
      
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
      <div className="p-4 border-b border-gray-700">
        <div className="text-gray-400">Loading suites...</div>
      </div>
    )
  }

  return (
    <div className="p-4 border-b border-gray-700">
      <div className="flex gap-2 flex-wrap items-center">
        {localSuites.map((suite) => (
          <button
            key={suite.id}
            className={`px-4 py-2 rounded-full transition-colors duration-200 ${
              selectedSuite === suite.name
                ? 'bg-[#9d042b] text-white'
                : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50'
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
                  className="px-4 py-2 rounded-full bg-gray-800/50 text-white border border-gray-700 focus:outline-none focus:border-[#9d042b]"
                  disabled={isSubmitting}
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={isSubmitting || !newSuiteName.trim()}
                  className="px-4 py-2 bg-[#9d042b] hover:bg-[#8a0326] disabled:bg-[#6d021f] rounded-full text-white transition-colors duration-200"
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
                  className="px-4 py-2 bg-gray-800/50 hover:bg-gray-700/50 rounded-full text-gray-300 transition-colors duration-200"
                >
                  Cancel
                </button>
              </form>
            ) : (
              <button
                onClick={() => setIsCreatingSuite(true)}
                className="flex items-center px-4 py-2 bg-gray-800/50 hover:bg-gray-700/50 rounded-full text-gray-300 transition-colors duration-200"
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
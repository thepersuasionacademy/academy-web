'use client'

import { Plus, Search } from 'lucide-react'
import { useState, useEffect } from 'react'

type Category = {
  id: string
  name: string
}

interface CategorySidebarProps {
  categories: Category[]
  selectedCategory: string | null
  onSelectCategory: (category: string) => void
  isLoadingCategories: boolean
  categoryInput: string
  setCategoryInput: (value: string) => void
}

export default function CategorySidebar({
  categories,
  selectedCategory,
  onSelectCategory,
  isLoadingCategories,
  categoryInput,
  setCategoryInput
}: CategorySidebarProps) {
  const [isCreatingCategory, setIsCreatingCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [localCategories, setLocalCategories] = useState<Category[]>(categories)

  useEffect(() => {
    setLocalCategories(categories)
  }, [categories])

  const refreshCategories = async () => {
    try {
      const response = await fetch('/api/ai/categories')
      if (!response.ok) throw new Error('Failed to fetch categories')
      const data = await response.json()
      if (Array.isArray(data.categories)) {
        setLocalCategories(data.categories)
        return data.categories
      }
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
      const response = await fetch('/api/ai/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: newCategoryName })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create category')
      }

      const data = await response.json()
      
      // Refresh the categories list
      await refreshCategories()
      
      // Clear form and close it
      setNewCategoryName('')
      setIsCreatingCategory(false)
      
      // Select the newly created category
      onSelectCategory(data.category.name)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create category')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="w-64 border-r border-gray-700 p-4">
      <div className="mb-4 space-y-2">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={categoryInput}
            onChange={(e) => setCategoryInput(e.target.value)}
            placeholder="Search categories..."
            className="w-full pl-8 pr-4 py-2 bg-gray-800/50 rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#9d042b]"
          />
        </div>

        {!isCreatingCategory ? (
          <button
            onClick={() => setIsCreatingCategory(true)}
            className="w-full flex items-center justify-center px-4 py-2 bg-gray-800/50 hover:bg-gray-700/50 rounded-lg text-gray-300 transition-colors duration-200 gap-2"
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
              className="w-full px-4 py-2 bg-gray-800/50 rounded-lg text-white border border-gray-700 focus:outline-none focus:border-[#9d042b]"
              disabled={isSubmitting}
              autoFocus
            />
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={isSubmitting || !newCategoryName.trim()}
                className="flex-1 px-4 py-2 bg-[#9d042b] hover:bg-[#8a0326] disabled:bg-[#6d021f] rounded-lg text-white transition-colors duration-200 text-sm"
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
                className="flex-1 px-4 py-2 bg-gray-800/50 hover:bg-gray-700/50 rounded-lg text-gray-300 transition-colors duration-200 text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {error && (
          <div className="text-sm text-red-400">
            {error}
          </div>
        )}
      </div>
      
      {isLoadingCategories ? (
        <div className="text-gray-400 p-2">Loading categories...</div>
      ) : (
        localCategories.map((category) => (
          <div
            key={category.id}
            className={`mb-2 p-2 rounded-lg cursor-pointer transition-colors duration-200 ${
              selectedCategory === category.name 
                ? 'bg-[#9d042b] text-white' 
                : 'text-gray-300 hover:bg-gray-800/50'
            }`}
            onClick={() => onSelectCategory(category.name)}
          >
            {category.name}
          </div>
        ))
      )}
    </div>
  )
}
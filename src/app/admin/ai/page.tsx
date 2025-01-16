'use client'

import { useEffect, useState } from 'react'
import CategorySidebar from '@/app/admin/ai/components/CategorySidebar'
import SuiteSelector from '@/app/admin/ai/components/SuiteSelector'
import ToolCreationForm from '@/app/admin/ai/components/ToolCreationForm'
import ToolList from '@/app/admin/ai/components/ToolList'
import ToolEditor from '@/app/admin/ai/components/ToolEditor'

type Category = {
  id: string
  name: string
}

type Suite = {
  id: string
  name: string
}

type Tool = {
  id: string
  name: string
  description: string
  creditCost: number
  promptTemplate: string
  inputField1: string
  inputField1Description: string
}

type SuccessState = {
  name: string
  category: string
  suite: string
  inputField1: string
  inputField1Description: string
  inputField2?: string
  inputField2Description?: string
  inputField3?: string
  inputField3Description?: string
}

export default function CreateToolPage() {
  // State Management
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState<SuccessState | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [suites, setSuites] = useState<Suite[]>([])
  const [tools, setTools] = useState<Tool[]>([])
  const [isLoadingTools, setIsLoadingTools] = useState(false)
  
  // View Management
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedSuite, setSelectedSuite] = useState<string | null>(null)
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null)
  const [isCreatingTool, setIsCreatingTool] = useState(false)
  
  // Search and Loading States
  const [categoryInput, setCategoryInput] = useState('')
  const [suiteInput, setSuiteInput] = useState('')
  const [isLoadingCategories, setIsLoadingCategories] = useState(false)
  const [isLoadingSuites, setIsLoadingSuites] = useState(false)

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

  useEffect(() => {
    if (!selectedCategory) {
      console.log('No category selected, clearing suites')
      setSuites([])
      return
    }
  
    const fetchSuites = async () => {
      console.log('Fetching suites for selected category:', selectedCategory)
      try {
        setIsLoadingSuites(true)
        const response = await fetch('/api/ai/categories/suites', {
          headers: {
            'x-selected-category': selectedCategory
          }
        })
        
        if (!response.ok) {
          const errorText = await response.text()
          console.error('Error response:', errorText)
          throw new Error('Failed to fetch suites')
        }
        
        const data = await response.json()
        console.log('Raw suites data:', data)
        
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

  useEffect(() => {
    if (!selectedCategory || !selectedSuite) {
      setTools([])
      return
    }

    const fetchTools = async () => {
      try {
        setIsLoadingTools(true)
        const response = await fetch('/api/ai/categories/suites/tools', {
          headers: {
            'x-selected-category': selectedCategory,
            'x-selected-suite': selectedSuite
          }
        })
        
        if (!response.ok) {
          throw new Error('Failed to fetch tools')
        }
        
        const data = await response.json()
        if (Array.isArray(data.tools)) {
          setTools(data.tools)
        }
      } catch (error) {
        console.error('Error fetching tools:', error)
        setError('Failed to load tools')
      } finally {
        setIsLoadingTools(false)
      }
    }

    fetchTools()
  }, [selectedCategory, selectedSuite])

  const handleToolUpdate = async (formData: FormData) => {
    setLoading(true)
    setError('')

    try {
      const updatedToolData = {
        name: formData.get('name'),
        description: formData.get('description'),
        promptTemplate: formData.get('promptTemplate'),
        creditCost: Number(formData.get('creditCost')),
        inputField1: formData.get('inputField1'),
        inputField1Description: formData.get('inputField1Description')
      }

      const response = await fetch(`/api/tools/${selectedTool?.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedToolData)
      })

      if (!response.ok) {
        throw new Error('Failed to update tool')
      }

      // Refresh tools list
      const newToolsResponse = await fetch('/api/ai/categories/suites/tools', {
        headers: {
          'x-selected-category': selectedCategory!,
          'x-selected-suite': selectedSuite!
        }
      })
      const data = await newToolsResponse.json()
      if (Array.isArray(data.tools)) {
        setTools(data.tools)
      }

      setSelectedTool(null)
    } catch (err) {
      const error = err as Error
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (formData: FormData) => {
    setLoading(true)
    setError('')
    setSuccess(null)
  
    try {
      // Create or get category
      let categoryId: string
      const existingCategory = categories.find(c => c.name === categoryInput)
  
      if (existingCategory) {
        categoryId = existingCategory.id
      } else {
        const categoryResponse = await fetch('/api/ai/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: categoryInput })
        })
  
        if (!categoryResponse.ok) {
          throw new Error(`Failed to create category: ${await categoryResponse.text()}`)
        }
        const categoryData = await categoryResponse.json()
        categoryId = categoryData.category.id
      }
  
      // Create or get suite
      let suiteId: string
      const existingSuite = suites.find(s => s.name === suiteInput)
  
      if (existingSuite) {
        suiteId = existingSuite.id
      } else {
        const suiteResponse = await fetch(`/api/categories/${categoryId}/suites`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: suiteInput })
        })
  
        if (!suiteResponse.ok) {
          throw new Error(`Failed to create suite: ${await suiteResponse.text()}`)
        }
        const suiteData = await suiteResponse.json()
        suiteId = suiteData.suite.id
      }
  
      const toolData = {
        categoryName: categoryInput,
        suiteName: suiteInput,
        name: formData.get('name'),
        description: formData.get('description'),
        promptTemplate: formData.get('promptTemplate'),
        creditCost: Number(formData.get('creditCost')),
        inputField1: formData.get('inputField1'),
        inputField1Description: formData.get('inputField1Description') || ''
      }
  
      const toolResponse = await fetch('/api/tools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(toolData)
      })
  
      if (!toolResponse.ok) {
        const text = await toolResponse.text()
        try {
          const json = JSON.parse(text)
          throw new Error(json.details || json.error || text)
        } catch {
          throw new Error(text)
        }
      }
  
      // Refresh the tools list
      const refreshResponse = await fetch('/api/ai/categories/suites/tools', {
        headers: {
          'x-selected-category': selectedCategory!,
          'x-selected-suite': selectedSuite!
        }
      })
      
      if (!refreshResponse.ok) {
        throw new Error('Failed to refresh tools list')
      }
      
      const refreshData = await refreshResponse.json()
      if (Array.isArray(refreshData.tools)) {
        setTools(refreshData.tools)
      }
  
      setSuccess({
        name: toolData.name as string,
        category: categoryInput,
        suite: suiteInput,
        inputField1: formData.get('inputField1') as string,
        inputField1Description: formData.get('inputField1Description') as string
      })
  
      setIsCreatingTool(false)
    } catch (err) {
      const error = err as Error
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-b from-gray-900 via-gray-900 to-black">
      <CategorySidebar
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={name => {
          setSelectedCategory(name)
          setCategoryInput(name)
        }}
        isLoadingCategories={isLoadingCategories}
        categoryInput={categoryInput}
        setCategoryInput={setCategoryInput}
      />

      <div className="flex-1 flex flex-col min-h-screen">
        <SuiteSelector
          suites={suites}
          selectedSuite={selectedSuite}
          onSelectSuite={name => {
            setSelectedSuite(name)
            setSuiteInput(name)
          }}
          isLoadingSuites={isLoadingSuites}
          selectedCategory={selectedCategory!}
        />

        {!isCreatingTool && !selectedTool && (
          <ToolList 
            tools={tools}
            isLoading={isLoadingTools}
            onSelectTool={setSelectedTool}
            onCreateNew={() => setIsCreatingTool(true)}
          />
        )}

        {selectedTool && selectedCategory && selectedSuite && (
          <div className="flex-1">
            <ToolEditor
              tool={selectedTool}
              selectedCategory={selectedCategory}
              selectedSuite={selectedSuite}
              onClose={async () => {
                try {
                  setIsLoadingTools(true)
                  const response = await fetch('/api/ai/categories/suites/tools', {
                    headers: {
                      'x-selected-category': selectedCategory,
                      'x-selected-suite': selectedSuite
                    }
                  })
                  
                  if (!response.ok) {
                    throw new Error('Failed to fetch tools')
                  }
                  
                  const data = await response.json()
                  if (Array.isArray(data.tools)) {
                    setTools(data.tools)
                  }
                } catch (error) {
                  console.error('Error refreshing tools:', error)
                  setError('Failed to refresh tools list')
                } finally {
                  setIsLoadingTools(false)
                  setSelectedTool(null)
                }
              }}
              error={error}
            />
          </div>
        )}

        {isCreatingTool && (
          <div className="flex-1">
            <ToolCreationForm
              onClose={() => setIsCreatingTool(false)}
              onSubmit={handleSubmit}
              categoryInput={categoryInput}
              suiteInput={suiteInput}
              loading={loading}
              error={error}
            />
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="fixed bottom-4 right-4 bg-green-900/50 border border-green-800/50 rounded-lg p-4 text-green-200">
            <h3 className="font-semibold mb-2">Tool Successfully Created!</h3>
            <ul className="list-disc list-inside space-y-1">
              <li>Name: {success.name}</li>
              <li>Category: {success.category}</li>
              <li>Suite: {success.suite}</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
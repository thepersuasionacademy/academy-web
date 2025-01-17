'use client'

import { useState } from 'react'
import { useCategories } from '@/app/ai/hooks/useCategories'
import { useTools } from '@/app/ai/hooks/useTools'
import { useSuites } from '@/app/ai/hooks/useSuites'
import { ToolContainer } from '@/app/ai/components/dashboard/layout/tool/ToolContainer'
import CategorySidebar from '@/app/ai/components/dashboard/layout/category/CategorySidebar'
import SuiteSelector from '@/app/ai/components/dashboard/layout/suite/SuiteSelector'
import { type Tool, type SuccessState } from '@/app/ai/components/dashboard/types'

type PageParams = {
  id: string;
}

interface AdminToolsClientProps {
  params: PageParams;
  searchParams: { [key: string]: string | string[] | undefined };
  hideCreationControls?: boolean;
}

export default function AdminToolsClient({ 
  params, 
  searchParams,
  hideCreationControls = false 
}: AdminToolsClientProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState<SuccessState | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedSuite, setSelectedSuite] = useState<string | null>(null)
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null)
  const [categoryInput, setCategoryInput] = useState('')
  const [suiteInput, setSuiteInput] = useState('')

  const { categories, isLoadingCategories } = useCategories()
  const { suites, isLoadingSuites } = useSuites(selectedCategory)
  const { tools, isLoadingTools, refreshTools } = useTools(selectedCategory, selectedSuite)

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
  
      const response = await fetch(`/api/tools/${selectedTool?.name}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedToolData)
      })
  
      if (!response.ok) {
        throw new Error('Failed to update tool')
      }
  
      await refreshTools()
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
  
      await refreshTools()
      setSuccess({
        name: toolData.name as string,
        category: categoryInput,
        suite: suiteInput,
        inputField1: formData.get('inputField1') as string,
        inputField1Description: formData.get('inputField1Description') as string
      })
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
        onSelectCategory={(name: string) => {
          setSelectedCategory(name)
          setCategoryInput(name)
        }}
        isLoadingCategories={isLoadingCategories}
        categoryInput={categoryInput}
        setCategoryInput={setCategoryInput}
        hideCreationControls={hideCreationControls}
      />

      <div className="flex-1 flex flex-col min-h-screen">
        <SuiteSelector
          suites={suites}
          selectedSuite={selectedSuite}
          onSelectSuite={(name: string) => {
            setSelectedSuite(name)
            setSuiteInput(name)
          }}
          isLoadingSuites={isLoadingSuites}
          selectedCategory={selectedCategory!}
          hideCreationControls={hideCreationControls}
        />

        <ToolContainer
          selectedTool={selectedTool}
          onToolUpdate={handleToolUpdate}
          onSubmit={handleSubmit}
          setSelectedTool={setSelectedTool}
          selectedCategory={selectedCategory!}
          selectedSuite={selectedSuite!}
          error={error}
          loading={loading}
          success={success}
          tools={tools}
          isLoadingTools={isLoadingTools}
          hideCreationControls={hideCreationControls}
        />
      </div>
    </div>
  )
}
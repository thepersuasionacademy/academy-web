//src/app/ai/hooks/useTools.ts
import { useState, useEffect } from 'react'
import { type Tool } from '@/app/ai/components/dashboard/types'

export function useTools(selectedCategory: string | null, selectedSuite: string | null) {
  const [tools, setTools] = useState<Tool[]>([])
  const [isLoadingTools, setIsLoadingTools] = useState(false)
  const [error, setError] = useState('')

  const fetchTools = async () => {
    if (!selectedCategory || !selectedSuite) {
      setTools([])
      return
    }

    try {
      setIsLoadingTools(true)
      const response = await fetch('/api/ai/categories/suites/tools', {
        headers: {
          'x-selected-category': selectedCategory,
          'x-selected-suite': selectedSuite,
          'x-tool-id': 'TOOL#'
        }
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        try {
          const errorData = JSON.parse(errorText)
          throw new Error(errorData.error || 'Failed to fetch tools')
        } catch {
          throw new Error('Failed to fetch tools')
        }
      }
      
      const data = await response.json()
      if (Array.isArray(data.tools)) {
        const toolRecords = data.tools.map((tool: any) => ({
          name: tool.name,
          SK: tool.SK,
          description: tool.description,
          creditCost: tool.creditCost,
          promptTemplate: tool.promptTemplate,
          inputField1: tool.inputField1,
          inputField1Description: tool.inputField1Description
        }))
        setTools(toolRecords)
      }
    } catch (error) {
      console.error('Error fetching tools:', error)
      setError(error instanceof Error ? error.message : 'Failed to load tools')
      setTools([])
    } finally {
      setIsLoadingTools(false)
    }
  }

  useEffect(() => {
    fetchTools()
  }, [selectedCategory, selectedSuite])

  return { tools, isLoadingTools, error, setTools, refreshTools: fetchTools }
}
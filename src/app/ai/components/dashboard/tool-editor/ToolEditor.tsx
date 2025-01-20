'use client'

import { useState } from 'react'
import { useTheme } from '@/app/context/ThemeContext'

type Tool = {
  name: string
  description: string
  creditCost: number
  promptTemplate: string
  inputField1: string
  inputField1Description: string
  SK: string
}

interface ToolEditorProps {
  tool: Tool
  onClose: () => void
  error?: string
  selectedCategory: string
  selectedSuite: string
}

export default function ToolEditor({ 
  tool, 
  onClose,
  error: propError,
  selectedCategory,
  selectedSuite 
}: ToolEditorProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const { theme } = useTheme()

  const inputStyles = `w-full px-4 py-3 
    ${theme === 'dark' 
      ? 'bg-gray-900/50 border-gray-700/50 text-gray-100 placeholder:text-gray-500' 
      : 'bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400'
    } 
    border rounded-lg 
    focus:outline-none focus:border-[var(--accent)] focus:border-2 
    transition-colors duration-200`

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    const formData = new FormData(e.currentTarget)
    const toolId = tool.SK.split('TOOL#')[1]

    const toolData = {
      name: formData.get('name'),
      description: formData.get('description'),
      creditCost: Number(formData.get('creditCost')),
      inputField1: formData.get('inputField1'),
      inputField1Description: formData.get('inputField1Description'),
      promptTemplate: formData.get('promptTemplate')
    }

    try {
      const response = await fetch('/api/ai/categories/suites/tools', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'x-selected-category': selectedCategory,
          'x-selected-suite': selectedSuite,
          'x-tool-id': toolId
        },
        body: JSON.stringify(toolData)
      })

      const responseText = await response.text()
      let responseData
      try {
        responseData = JSON.parse(responseText)
      } catch (parseError) {
        throw new Error('Server returned invalid response')
      }

      if (!response.ok) {
        throw new Error(responseData.error || 'Failed to update tool')
      }

      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={`min-h-screen bg-[var(--background)] p-6`}>
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-[var(--foreground)]">Edit Tool</h1>
          <p className="text-lg text-[var(--text-secondary)]">Modify existing tool settings</p>
        </div>

        <div className="bg-[var(--card-bg)] backdrop-blur-xl border border-[var(--border-color)] rounded-xl p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-[var(--text-secondary)]">Tool Name</label>
                <input
                  type="text"
                  name="name"
                  defaultValue={tool.name}
                  required
                  className={inputStyles}
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-[var(--text-secondary)]">Description</label>
                <textarea
                  name="description"
                  defaultValue={tool.description}
                  required
                  className={`${inputStyles} min-h-24 resize-none`}
                />
              </div>

              <div className="space-y-4">
                <label className="block text-sm font-medium text-[var(--text-secondary)]">Input Fields</label>
                
                <div className="relative bg-[var(--card-bg)] p-4 rounded-lg border border-[var(--border-color)]">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Field Name</label>
                      <input
                        type="text"
                        name="inputField1"
                        defaultValue={tool.inputField1}
                        className={inputStyles}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Field Description</label>
                      <input
                        type="text"
                        name="inputField1Description"
                        defaultValue={tool.inputField1Description}
                        className={inputStyles}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-[var(--text-secondary)]">Prompt Template</label>
                <textarea
                  name="promptTemplate"
                  defaultValue={tool.promptTemplate}
                  required
                  className={`${inputStyles} min-h-32 resize-none font-mono`}
                />
                <p className="text-sm text-[var(--text-secondary)]">Use {`{fieldName}`} to reference input fields in your template</p>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-[var(--text-secondary)]">Credit Cost</label>
                <input
                  type="number"
                  name="creditCost"
                  defaultValue={tool.creditCost}
                  min="1"
                  required
                  className={inputStyles}
                />
              </div>
            </div>

            {(error || propError) && (
              <div className={`${theme === 'dark' ? 'bg-red-900/50 border-red-800/50 text-red-200' : 'bg-red-100 border-red-200 text-red-800'} border rounded-lg p-4`}>
                {error || propError}
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 bg-[var(--hover-bg)] text-[var(--foreground)] rounded-lg transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-6 py-3 bg-[var(--accent)] hover:bg-[var(--accent)]/90 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors duration-200"
              >
                {isLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
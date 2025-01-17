'use client'

import { useState } from 'react'

type Tool = {
  name: string
  description: string
  creditCost: number
  promptTemplate: string
  inputField1: string
  inputField1Description: string
  SK: string  // Added to access the full sort key
}

interface ToolEditorProps {
  tool: Tool
  onClose: () => void
  error?: string
  selectedCategory: string
  selectedSuite: string
}

const inputStyles = "w-full px-4 py-3 bg-gray-900/50 border border-gray-700/50 rounded-lg text-gray-100 placeholder:text-gray-500 focus:outline-none focus:border-[#9d042b] focus:border-2 transition-colors duration-200"

export default function ToolEditor({ 
  tool, 
  onClose,
  error: propError,
  selectedCategory,
  selectedSuite 
}: ToolEditorProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    const formData = new FormData(e.currentTarget)
    const toolId = tool.SK.split('TOOL#')[1] // Extract tool ID from SK

    const toolData = {
      name: formData.get('name'),
      description: formData.get('description'),
      creditCost: Number(formData.get('creditCost')),
      inputField1: formData.get('inputField1'),
      inputField1Description: formData.get('inputField1Description'),
      promptTemplate: formData.get('promptTemplate')
    }

    try {
      console.log('Making update request with:', {
        category: selectedCategory,
        suite: selectedSuite,
        toolId: toolId,
        data: toolData
      })

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
      console.log('Server response:', responseText)

      let responseData
      try {
        responseData = JSON.parse(responseText)
      } catch (parseError) {
        console.error('Failed to parse response:', responseText)
        throw new Error('Server returned invalid response')
      }

      if (!response.ok) {
        throw new Error(responseData.error || 'Failed to update tool')
      }

      onClose()
    } catch (err) {
      console.error('Error updating tool:', err)
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-900 to-black p-6">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-white">Edit Tool</h1>
          <p className="text-lg text-gray-400">Modify existing tool settings</p>
        </div>

        <div className="bg-gray-800/30 backdrop-blur-xl border border-gray-700/50 rounded-xl p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-200">Tool Name</label>
                <input
                  type="text"
                  name="name"
                  defaultValue={tool.name}
                  required
                  className={inputStyles}
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-200">Description</label>
                <textarea
                  name="description"
                  defaultValue={tool.description}
                  required
                  className={`${inputStyles} min-h-24 resize-none`}
                />
              </div>

              <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-200">Input Fields</label>
                
                <div className="relative bg-gray-800/30 p-4 rounded-lg border border-gray-700/50">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Field Name</label>
                      <input
                        type="text"
                        name="inputField1"
                        defaultValue={tool.inputField1}
                        className={inputStyles}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Field Description</label>
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
                <label className="block text-sm font-medium text-gray-200">Prompt Template</label>
                <textarea
                  name="promptTemplate"
                  defaultValue={tool.promptTemplate}
                  required
                  className={`${inputStyles} min-h-32 resize-none font-mono`}
                />
                <p className="text-sm text-gray-400">Use {`{fieldName}`} to reference input fields in your template</p>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-200">Credit Cost</label>
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
              <div className="bg-red-900/50 border border-red-800/50 rounded-lg p-4 text-red-200">
                {error || propError}
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 bg-gray-800/50 hover:bg-gray-700/50 text-white rounded-lg transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-6 py-3 bg-[#9d042b] hover:bg-[#8a0326] disabled:bg-[#6d021f] disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors duration-200"
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
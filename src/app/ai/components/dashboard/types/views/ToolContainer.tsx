import { useState } from 'react'
import { type Tool, type SuccessState } from '@/app/ai/components/dashboard/types'
import ToolList from '@/app/ai/components/dashboard/ToolList'
import { ToolForm } from '@/app/ai/components/dashboard/ToolForm'

type ToolContainerProps = {
  selectedTool: Tool | null
  onToolUpdate: (formData: FormData) => Promise<void>
  onSubmit: (formData: FormData) => Promise<void>
  setSelectedTool: (tool: Tool | null) => void
  selectedCategory: string
  selectedSuite: string
  error: string
  loading: boolean
  success: SuccessState | null
  tools: Tool[]
  isLoadingTools: boolean
}

export function ToolContainer({
  selectedTool,
  onToolUpdate,
  onSubmit,
  setSelectedTool,
  selectedCategory,
  selectedSuite,
  error,
  loading,
  success,
  tools,
  isLoadingTools
}: ToolContainerProps) {
  const [isPanelOpen, setIsPanelOpen] = useState(false)

  const handleClose = () => {
    setIsPanelOpen(false)
    setSelectedTool(null)
  }

  const handleToolSelect = (tool: Tool) => {
    setSelectedTool(tool)
    setIsPanelOpen(true)
  }

  const handleCreateNew = () => {
    setSelectedTool(null)
    setIsPanelOpen(true)
  }

  return (
    <div className="relative">
      <ToolList 
        tools={tools}
        isLoading={isLoadingTools}
        onSelectTool={handleToolSelect}
        onCreateNew={handleCreateNew}
      />

      {/* Fixed positioning for the panel */}
      <div 
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity z-40 ${
          isPanelOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={handleClose}
      />

      <div 
        className={`fixed right-0 top-0 h-full w-full max-w-2xl bg-gray-900 shadow-xl transition-transform duration-300 ease-in-out transform z-50 ${
          isPanelOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="h-full overflow-y-auto p-6">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold text-white">
                {selectedTool ? 'Edit AI Tool' : 'Create New AI Tool'}
              </h1>
              <p className="text-lg text-gray-400">
                {selectedTool ? 'Modify your existing AI tool' : 'Add a new tool to your AI suite'}
              </p>
            </div>
          </div>

          <ToolForm
            onSubmit={selectedTool ? onToolUpdate : onSubmit}
            categoryInput={selectedCategory}
            suiteInput={selectedSuite}
            loading={loading}
            error={error}
            initialData={selectedTool || undefined}
          />
        </div>
      </div>

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
  )
}
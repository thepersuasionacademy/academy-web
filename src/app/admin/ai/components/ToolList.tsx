'use client'

import { Plus } from 'lucide-react'

type Tool = {
  id: string
  name: string
  description: string
  creditCost: number
  promptTemplate: string
  inputField1: string
  inputField1Description: string
}

interface ToolListProps {
  tools: Tool[]
  isLoading: boolean
  onSelectTool: (tool: Tool) => void
  onCreateNew: () => void
}

export default function ToolList({ 
  tools, 
  isLoading, 
  onSelectTool,
  onCreateNew 
}: ToolListProps) {
  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-gray-400">Loading tools...</div>
      </div>
    )
  }

  if (!tools.length) {
    return (
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <button
            onClick={onCreateNew}
            className="bg-gray-800/30 rounded-lg p-4 border border-gray-700/50 hover:border-[#9d042b] transition-all duration-200 flex flex-col items-center justify-center text-center group"
          >
            <div className="bg-[#9d042b]/10 p-3 rounded-full mb-3 group-hover:bg-[#9d042b]/20 transition-colors duration-200">
              <Plus className="h-6 w-6 text-[#9d042b]" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-1">Create New Tool</h3>
            <p className="text-gray-400 text-sm">Add a new tool to this suite</p>
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <button
          onClick={onCreateNew}
          className="bg-gray-800/30 rounded-lg p-4 border border-gray-700/50 hover:border-[#9d042b] transition-all duration-200 flex flex-col items-center justify-center text-center group"
        >
          <div className="bg-[#9d042b]/10 p-3 rounded-full mb-3 group-hover:bg-[#9d042b]/20 transition-colors duration-200">
            <Plus className="h-6 w-6 text-[#9d042b]" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-1">Create New Tool</h3>
          <p className="text-gray-400 text-sm">Add a new tool to this suite</p>
        </button>

        {tools.map((tool) => (
          <div 
            key={tool.id}
            onClick={() => onSelectTool(tool)}
            className="bg-gray-800/30 rounded-lg p-4 border border-gray-700/50 hover:border-gray-600 transition-colors cursor-pointer"
          >
            <h3 className="text-lg font-semibold text-white mb-2">{tool.name}</h3>
            <p className="text-gray-300 text-sm mb-3 line-clamp-2">{tool.description}</p>
            <div className="text-gray-400 text-sm">
              Credits: {tool.creditCost}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
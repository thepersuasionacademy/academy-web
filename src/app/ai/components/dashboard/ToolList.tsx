'use client'

import { Plus } from 'lucide-react'

type Tool = {
  name: string
  SK: string
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

export default function ToolList({ tools, isLoading, onSelectTool, onCreateNew }: ToolListProps) {
  // Loading state
  if (isLoading) {
    return (
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-gray-800/30 rounded-lg p-4 border border-gray-700/50 animate-pulse">
            <div className="h-6 w-3/4 bg-gray-700/50 rounded mb-2" />
            <div className="h-4 w-full bg-gray-700/50 rounded mb-2" />
            <div className="h-4 w-1/2 bg-gray-700/50 rounded" />
          </div>
        ))}
      </div>
    )
  }

  // Empty or normal state
  return (
    <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* Create New Button */}
      <button
        onClick={onCreateNew}
        className="bg-gray-800/30 rounded-lg p-4 border border-gray-700/50 hover:border-red-900 transition-all duration-200 flex flex-col items-center justify-center text-center group"
      >
        <div className="bg-red-900/10 p-3 rounded-full mb-3 group-hover:bg-red-900/20 transition-colors duration-200">
          <Plus className="h-6 w-6 text-red-500" />
        </div>
        <h3 className="text-lg font-semibold text-white mb-1">Create New Tool</h3>
        <p className="text-gray-400 text-sm">Add a new tool to this suite</p>
      </button>

      {/* Tool Cards */}
      {tools?.map(tool => (
        <button 
          key={tool.SK}
          onClick={() => onSelectTool(tool)}
          className="bg-gray-800/30 rounded-lg p-4 border border-gray-700/50 hover:border-gray-600 transition-colors text-left w-full"
        >
          <h3 className="text-lg font-semibold text-white mb-2">{tool.name}</h3>
          <p className="text-gray-300 text-sm mb-3 line-clamp-2">{tool.description}</p>
          <div className="text-gray-400 text-sm">Credits: {tool.creditCost}</div>
        </button>
      ))}
    </div>
  )
}
'use client'

import { Plus } from 'lucide-react'
import { cn } from "@/lib/utils"

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
  hideCreationControls?: boolean
}

const cardBaseClasses = cn(
  "relative rounded-2xl p-6",
  "border border-[var(--border-color)] hover:border-[var(--accent)]",
  "transition-all duration-200",
  "bg-[var(--card-bg)]",
  "shadow-lg",
  "hover:shadow-[0_0_10px_rgba(var(--accent),0.3)]"
);

export default function ToolList({ 
  tools, 
  isLoading, 
  onSelectTool, 
  onCreateNew,
  hideCreationControls = false 
}: ToolListProps) {
  if (isLoading) {
    return (
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
          <div key={i} className={cn(
            "relative rounded-2xl p-4 animate-pulse",
            "bg-[var(--card-bg)]",
            "border border-[var(--border-color)]",
            "shadow-lg"
          )}>
            <div className="h-6 w-3/4 bg-[var(--hover-bg)] rounded mb-2" />
            <div className="h-4 w-full bg-[var(--hover-bg)] rounded mb-2" />
            <div className="h-4 w-1/2 bg-[var(--hover-bg)] rounded" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* Create New Button */}
      {!hideCreationControls && (
        <button
          onClick={onCreateNew}
          className={cn(
            cardBaseClasses,
            "flex flex-col items-center justify-center text-center group"
          )}
        >
          <div className="bg-[var(--accent)]/10 p-3 rounded-full mb-3 group-hover:bg-[var(--accent)]/20 transition-colors duration-200">
            <Plus className="h-6 w-6 text-[var(--accent)]" />
          </div>
          <h3 className="text-lg font-bold text-[var(--foreground)] mb-1">Create New Tool</h3>
          <p className="text-[var(--text-secondary)] text-sm">Add a new tool to this suite</p>
        </button>
      )}

      {/* Tool Cards */}
      {tools?.map(tool => (
        <button 
          key={tool.SK}
          onClick={() => onSelectTool(tool)}
          className={cardBaseClasses}
        >
          <h3 className="text-xl font-bold text-[var(--foreground)] mb-2">{tool.name}</h3>
          <p className="text-[var(--text-secondary)] text-sm mb-3 line-clamp-2">{tool.description}</p>
          <div className="text-[var(--text-secondary)] text-sm">Credits: {tool.creditCost}</div>
        </button>
      ))}
    </div>
  )
}
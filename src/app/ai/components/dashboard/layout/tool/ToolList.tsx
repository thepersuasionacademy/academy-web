'use client'

import { Plus, Link, Copy, CheckCircle } from 'lucide-react'
import { cn } from "@/lib/utils"
import { usePathname } from 'next/navigation'
import { useState } from 'react'

type Tool = {
  name: string
  SK: string
  description: string
  creditCost: number
  promptTemplate: string
  inputField1: string
  inputField1Description: string
}

interface ToolCardProps {
  tool: Tool
  onSelect: (tool: Tool) => void
  isAdmin: boolean
  onDuplicate?: (tool: Tool) => Promise<void>
}

export function ToolCard({ 
  tool, 
  onSelect, 
  isAdmin = false,
  onDuplicate 
}: ToolCardProps) {
  const [showCopied, setShowCopied] = useState(false)
  const [showAlert, setShowAlert] = useState(false)
  const [alertMessage, setAlertMessage] = useState('')
  const [isDuplicating, setIsDuplicating] = useState(false)

  const generateToolLink = (name: string) => {
    const formattedName = name.toLowerCase().replace(/\s+/g, '-')
    return `https://app.thepersuasionacademy.com/ai/tools/${formattedName}`
  }

  const handleCopyLink = (e: React.MouseEvent) => {
    e.stopPropagation()
    const link = generateToolLink(tool.name)
    navigator.clipboard.writeText(link).then(() => {
      setAlertMessage('Link copied!')
      setShowCopied(true)
      setShowAlert(true)
      setTimeout(() => {
        setShowCopied(false)
        setShowAlert(false)
      }, 1000)
    })
  }

  const handleDuplicate = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onDuplicate && !isDuplicating) {
      console.log('Duplicate clicked for tool:', tool.name)
      setIsDuplicating(true)
      try {
        await onDuplicate(tool)
        setAlertMessage('Tool duplicated!')
        setShowAlert(true)
        setTimeout(() => setShowAlert(false), 1000)
      } catch (error) {
        console.error('Duplication error:', error)
        setAlertMessage('Failed to duplicate')
        setShowAlert(true)
        setTimeout(() => setShowAlert(false), 1000)
      } finally {
        setIsDuplicating(false)
      }
    }
  }

  return (
    <div 
      onClick={() => {
        console.log('ToolCard clicked:', tool)
        onSelect(tool)
      }}
      className={cn(
        "relative rounded-2xl p-6",
        "border border-[var(--border-color)] hover:border-[var(--accent)]",
        "transition-all duration-200",
        "bg-[var(--card-bg)]",
        "shadow-lg",
        "hover:shadow-[0_0_10px_rgba(var(--accent),0.3)]",
        "flex flex-col min-h-[200px] cursor-pointer",
        "text-left relative"
      )}
    >
      <div>
        <h3 className="text-2xl font-bold text-[var(--foreground)] mb-3">{tool.name}</h3>
        <p className="text-lg text-[var(--text-secondary)] mb-4 line-clamp-2">{tool.description}</p>
      </div>

      <div className="text-lg text-[var(--text-secondary)] mt-auto">
        Credits: {tool.creditCost}
      </div>

      {/* Admin Controls */}
      {isAdmin && (
        <div className="absolute bottom-6 right-6 flex gap-2">
          <div
            onClick={handleDuplicate}
            className={cn(
              "flex items-center gap-2 p-2",
              "text-[var(--text-secondary)] hover:text-[var(--foreground)]",
              "transition-colors rounded-md hover:bg-[var(--accent)]/10",
              "cursor-pointer",
              isDuplicating && "opacity-50 cursor-not-allowed"
            )}
            title="Duplicate tool"
          >
            <Copy className="w-5 h-5" />
          </div>
          
          <div
            onClick={handleCopyLink}
            className={cn(
              "flex items-center gap-2 p-2",
              "text-[var(--text-secondary)] hover:text-[var(--foreground)]",
              "transition-colors rounded-md hover:bg-[var(--accent)]/10",
              "cursor-pointer"
            )}
            title="Copy tool link"
          >
            {showCopied ? (
              <CheckCircle className="w-5 h-5 text-[var(--success)]" />
            ) : (
              <Link className="w-5 h-5" />
            )}
          </div>
          
          {showAlert && (
            <div className="absolute bottom-full right-0 mb-2 z-10">
              <div className={cn(
                "bg-[var(--card-bg)]",
                "border border-[var(--border-color)]",
                "text-[var(--foreground)]",
                "px-4 py-2 rounded-md shadow-sm text-base whitespace-nowrap"
              )}>
                {alertMessage}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function ToolList({ 
  tools, 
  isLoading, 
  onSelectTool, 
  onCreateNew,
  onDuplicate,
  hideCreationControls = false 
}: {
  tools: Tool[]
  isLoading: boolean
  onSelectTool: (tool: Tool) => void
  onCreateNew: () => void
  onDuplicate?: (tool: Tool) => Promise<void>
  hideCreationControls?: boolean
}) {
  const pathname = usePathname()
  const isAdminRoute = pathname?.includes('/admin')

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
            <div className="h-8 w-3/4 bg-[var(--hover-bg)] rounded mb-3" />
            <div className="h-6 w-full bg-[var(--hover-bg)] rounded mb-3" />
            <div className="h-6 w-1/2 bg-[var(--hover-bg)] rounded" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* Create New Button */}
      {!hideCreationControls && (
        <div
          onClick={onCreateNew}
          className={cn(
            "relative rounded-2xl p-6",
            "border border-[var(--border-color)] hover:border-[var(--accent)]",
            "transition-all duration-200",
            "bg-[var(--card-bg)]",
            "shadow-lg",
            "hover:shadow-[0_0_10px_rgba(var(--accent),0.3)]",
            "flex flex-col items-center justify-center text-center group min-h-[200px]",
            "cursor-pointer"
          )}
        >
          <div className="bg-[var(--accent)]/10 p-3 rounded-full mb-3 group-hover:bg-[var(--accent)]/20 transition-colors duration-200">
            <Plus className="h-8 w-8 text-[var(--accent)]" />
          </div>
          <h3 className="text-2xl font-bold text-[var(--foreground)] mb-2">Create New Tool</h3>
          <p className="text-lg text-[var(--text-secondary)]">Add a new tool to this suite</p>
        </div>
      )}

      {/* Tool Cards */}
      {tools?.map(tool => (
        <ToolCard
          key={tool.SK}
          tool={tool}
          onSelect={onSelectTool}
          isAdmin={isAdminRoute}
          onDuplicate={onDuplicate}
        />
      ))}
    </div>
  )
}

export default ToolList
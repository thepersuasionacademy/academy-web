'use client'

import { Plus, Link, Copy, CheckCircle } from 'lucide-react'
import { cn } from "@/lib/utils"
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import type { AITool } from '@/lib/supabase/ai'

interface ToolCardProps {
  tool: AITool
  onSelect: (tool: AITool) => void
  isAdmin: boolean
  onDuplicate?: (tool: AITool) => Promise<void>
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
    const link = generateToolLink(tool.title || '')
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
      console.log('Duplicate clicked for tool:', tool.title)
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
      onClick={() => onSelect(tool)}
      className={cn(
        "group relative rounded-2xl p-6",
        "border border-[var(--border-color)]",
        "transition-all duration-300",
        "bg-[var(--card-bg)]",
        "hover:scale-[1.02] hover:shadow-lg",
        "hover:border-[var(--accent)]",
        "cursor-pointer",
        "flex flex-col min-h-[220px]"
      )}
    >
      <div className="space-y-4">
        <h3 className="text-2xl font-bold text-[var(--foreground)] group-hover:text-[var(--accent)] transition-colors">
          {tool.title}
        </h3>
        <p className="text-lg text-[var(--text-secondary)] line-clamp-2 group-hover:text-[var(--foreground)] transition-colors">
          {tool.description}
        </p>
      </div>

      <div className="mt-auto pt-4 flex items-center justify-between">
        <div className="flex-1" /> {/* Spacer */}
        
        {/* Credits */}
        <div className="text-xl font-semibold text-[var(--foreground)]">
          {tool.credits_cost} Credits
        </div>

        {/* Admin Controls */}
        {isAdmin && (
          <div className="absolute top-6 right-6 flex gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleDuplicate(e)
              }}
              className={cn(
                "p-2 rounded-xl",
                "text-[var(--text-secondary)]",
                "hover:text-[var(--accent)] hover:bg-[var(--accent)]/10",
                "transition-all duration-200",
                isDuplicating && "opacity-50 cursor-not-allowed"
              )}
              title="Duplicate tool"
              disabled={isDuplicating}
            >
              <Copy className="w-5 h-5" />
            </button>
            
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleCopyLink(e)
              }}
              className={cn(
                "p-2 rounded-xl",
                "text-[var(--text-secondary)]",
                "hover:text-[var(--accent)] hover:bg-[var(--accent)]/10",
                "transition-all duration-200"
              )}
              title="Copy tool link"
            >
              {showCopied ? (
                <CheckCircle className="w-5 h-5 text-[var(--success)]" />
              ) : (
                <Link className="w-5 h-5" />
              )}
            </button>
          </div>
        )}
      </div>

      {/* Alert Toast */}
      {showAlert && (
        <div className="absolute bottom-full right-0 mb-2 z-10">
          <div className={cn(
            "px-4 py-2 rounded-xl",
            "bg-[var(--card-bg)]",
            "border border-[var(--accent)]",
            "text-[var(--foreground)]",
            "shadow-lg shadow-[var(--accent)]/10",
            "animate-in slide-in-from-bottom-2"
          )}>
            {alertMessage}
          </div>
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
  tools: AITool[]
  isLoading: boolean
  onSelectTool: (tool: AITool) => void
  onCreateNew: () => void
  onDuplicate?: (tool: AITool) => Promise<void>
  hideCreationControls?: boolean
}) {
  const pathname = usePathname()
  const isAdminRoute = pathname?.includes('/admin')

  if (isLoading) {
    return (
      <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map(i => (
          <div key={i} className={cn(
            "rounded-2xl p-6",
            "border border-[var(--border-color)]",
            "bg-[var(--card-bg)]",
            "animate-pulse",
            "min-h-[220px]"
          )}>
            <div className="space-y-4">
              <div className="h-8 w-3/4 bg-[var(--hover-bg)] rounded-lg" />
              <div className="h-20 w-full bg-[var(--hover-bg)] rounded-lg" />
            </div>
            <div className="mt-auto pt-4">
              <div className="h-8 w-24 bg-[var(--hover-bg)] rounded-full" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Create New Button */}
      {!hideCreationControls && (
        <button
          onClick={onCreateNew}
          className={cn(
            "group relative rounded-2xl p-6",
            "border border-dashed border-[var(--border-color)]",
            "transition-all duration-300",
            "bg-[var(--card-bg)]",
            "hover:scale-[1.02] hover:shadow-lg",
            "hover:border-[var(--accent)]",
            "flex flex-col items-center justify-center text-center",
            "min-h-[220px]",
            "cursor-pointer"
          )}
        >
          <div className={cn(
            "p-4 rounded-full",
            "bg-[var(--accent)]/10",
            "group-hover:bg-[var(--accent)]/20",
            "transition-all duration-300"
          )}>
            <Plus className="h-8 w-8 text-[var(--accent)]" />
          </div>
          <h3 className="text-2xl font-bold text-[var(--foreground)] mt-4 mb-2 group-hover:text-[var(--accent)] transition-colors">
            Create New Tool
          </h3>
          <p className="text-lg text-[var(--text-secondary)] group-hover:text-[var(--foreground)] transition-colors">
            Add a new tool to this suite
          </p>
        </button>
      )}

      {/* Tool Cards */}
      {tools?.map(tool => (
        <ToolCard
          key={tool.id}
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
// DuplicateTool.tsx
'use client'

import { Copy, CheckCircle } from 'lucide-react'
import { useState } from 'react'
import { cn } from "@/lib/utils"
import { type Tool } from '@/app/ai/components/dashboard/types'

interface DuplicateToolProps {
  tool: Tool
  selectedCategory: string
  selectedSuite: string
  onDuplicate: () => Promise<void>
  disabled?: boolean
  className?: string
}

export default function DuplicateTool({
  tool,
  selectedCategory,
  selectedSuite,
  onDuplicate,
  disabled = false,
  className
}: DuplicateToolProps) {
  const [isDuplicating, setIsDuplicating] = useState(false)
  const [showAlert, setShowAlert] = useState(false)
  const [alertMessage, setAlertMessage] = useState('')

  const handleDuplicate = async (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent triggering parent click handlers
    
    if (disabled || isDuplicating) return
    
    if (!selectedCategory || !selectedSuite) {
      setAlertMessage('Category and Suite must be selected')
      setShowAlert(true)
      setTimeout(() => setShowAlert(false), 3000)
      return
    }

    setIsDuplicating(true)
    
    try {
      // Create the duplicate tool data
      const toolData = {
        categoryName: selectedCategory,
        suiteName: selectedSuite,
        name: `${tool.name} - Copy`,
        description: tool.description,
        promptTemplate: tool.promptTemplate,
        creditCost: tool.creditCost,
        inputField1: tool.inputField1,
        inputField1Description: tool.inputField1Description || '',
        ...(tool.inputField2 && {
          inputField2: tool.inputField2,
          inputField2Description: tool.inputField2Description
        }),
        ...(tool.inputField3 && {
          inputField3: tool.inputField3,
          inputField3Description: tool.inputField3Description
        })
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

      await onDuplicate()
      setAlertMessage('Tool duplicated successfully!')
    } catch (err) {
      const error = err as Error
      console.error('Duplication error:', error)
      setAlertMessage(error.message || 'Failed to duplicate tool')
    } finally {
      setShowAlert(true)
      setTimeout(() => setShowAlert(false), 3000)
      setIsDuplicating(false)
    }
  }

  return (
    <div className="relative">
      <button
        onClick={handleDuplicate}
        disabled={disabled || isDuplicating}
        className={cn(
          "flex items-center gap-2 p-2",
          "text-[var(--text-secondary)] hover:text-[var(--foreground)]",
          "transition-colors rounded-md hover:bg-[var(--accent)]/10",
          (disabled || isDuplicating) && "opacity-50 cursor-not-allowed",
          className
        )}
        title="Duplicate tool"
      >
        {isDuplicating ? (
          <CheckCircle className="w-5 h-5 text-[var(--success)]" />
        ) : (
          <Copy className="w-5 h-5" />
        )}
      </button>
      
      {showAlert && (
        <div className="absolute bottom-full right-0 mb-2 z-10">
          <div className={cn(
            "bg-[var(--card-bg)]",
            "border border-[var(--border-color)]",
            "text-[var(--foreground)]",
            "px-4 py-2 rounded-md shadow-sm",
            "text-base whitespace-nowrap"
          )}>
            {alertMessage}
          </div>
        </div>
      )}
    </div>
  )
}
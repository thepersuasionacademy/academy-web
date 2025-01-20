'use client'

import React, { useState } from 'react'
import { Link, CheckCircle, Copy } from 'lucide-react'
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

interface AdminToolCardProps {
  tool: Tool
  onSelect: (tool: Tool) => void
  onDuplicate?: (tool: Tool) => Promise<void>
  selectedCategory?: string
  selectedSuite?: string
}

const cardBaseClasses = cn(
  "relative rounded-2xl p-6",
  "border border-[var(--border-color)] hover:border-[var(--accent)]",
  "transition-all duration-200",
  "bg-[var(--card-bg)]",
  "shadow-lg",
  "hover:shadow-[0_0_10px_rgba(var(--accent),0.3)]"
)

const AdminToolCard = ({ 
  tool, 
  onSelect, 
  onDuplicate,
  selectedCategory,
  selectedSuite 
}: AdminToolCardProps) => {
  const [showCopied, setShowCopied] = useState(false)
  const [showAlert, setShowAlert] = useState(false)
  const [alertMessage, setAlertMessage] = useState('')
  const [isDuplicating, setIsDuplicating] = useState(false)

  const generateToolLink = (name: string) => {
    const formattedName = name.toLowerCase().replace(/\s+/g, '-')
    return `https://app.thepersuasionacademy.com/${formattedName}`
  }

  const handleCopyLink = (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent card selection when clicking the link button
    const link = generateToolLink(tool.name)
    navigator.clipboard.writeText(link).then(() => {
      setAlertMessage('Link copied!')
      setShowCopied(true)
      setShowAlert(true)
      setTimeout(() => setShowCopied(false), 2000)
      setTimeout(() => setShowAlert(false), 3000)
    })
  }

  const handleDuplicate = async (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent card selection when clicking duplicate
    if (!onDuplicate || isDuplicating) return

    if (!selectedCategory || !selectedSuite) {
      setAlertMessage('Category and Suite must be selected')
      setShowAlert(true)
      setTimeout(() => setShowAlert(false), 3000)
      return
    }

    setIsDuplicating(true)
    try {
      await onDuplicate(tool)
      setAlertMessage('Tool duplicated!')
    } catch (error) {
      console.error('Duplication error:', error)
      setAlertMessage('Failed to duplicate tool')
    } finally {
      setShowAlert(true)
      setTimeout(() => setShowAlert(false), 3000)
      setIsDuplicating(false)
    }
  }

  return (
    <button 
      onClick={() => onSelect(tool)}
      className={cardBaseClasses}
    >
      <div className="flex justify-between items-start">
        <h3 className="text-xl font-bold text-[var(--foreground)] mb-2">{tool.name}</h3>
        <div className="relative flex gap-2">
          <button
            onClick={handleDuplicate}
            disabled={isDuplicating}
            className={cn(
              "flex items-center gap-2 p-2",
              "text-[var(--text-secondary)] hover:text-[var(--foreground)]",
              "transition-colors rounded-md hover:bg-[var(--accent)]/10",
              isDuplicating && "opacity-50 cursor-not-allowed"
            )}
            title="Duplicate tool"
          >
            {isDuplicating ? (
              <CheckCircle className="w-5 h-5 text-[var(--success)]" />
            ) : (
              <Copy className="w-5 h-5" />
            )}
          </button>

          <button
            onClick={handleCopyLink}
            className={cn(
              "flex items-center gap-2 p-2",
              "text-[var(--text-secondary)] hover:text-[var(--foreground)]",
              "transition-colors rounded-md hover:bg-[var(--accent)]/10"
            )}
            title="Copy tool link"
          >
            {showCopied ? (
              <CheckCircle className="w-5 h-5 text-[var(--success)]" />
            ) : (
              <Link className="w-5 h-5" />
            )}
          </button>
          
          {showAlert && (
            <div className="absolute bottom-full right-0 mb-2 z-10">
              <div className={cn(
                "bg-[var(--success)]/10 border border-[var(--success)]/20",
                "text-[var(--success)] px-4 py-2 rounded-md shadow-sm text-sm whitespace-nowrap"
              )}>
                {alertMessage}
              </div>
            </div>
          )}
        </div>
      </div>
      <p className="text-[var(--text-secondary)] text-sm mb-3 line-clamp-2">{tool.description}</p>
      <div className="text-[var(--text-secondary)] text-sm">Credits: {tool.creditCost}</div>
    </button>
  )
}

export default AdminToolCard
'use client'

import { type AITool } from '@/lib/supabase/ai'
import ToolPageClient from '@/app/ai/tools/[toolId]/ToolPageClient'
import { useEffect, useCallback } from 'react'

interface AIToolModalProps {
  tool: AITool;
  isOpen: boolean;
  onClose: () => void;
}

export function AIToolModal({ tool, isOpen, onClose }: AIToolModalProps) {
  const lockScroll = useCallback(() => {
    document.body.style.overflow = 'hidden'
    document.body.style.height = '100vh'
    document.body.style.position = 'fixed'
    document.body.style.width = '100%'
  }, [])

  const unlockScroll = useCallback(() => {
    document.body.style.overflow = ''
    document.body.style.height = ''
    document.body.style.position = ''
    document.body.style.width = ''
  }, [])

  useEffect(() => {
    if (isOpen) {
      lockScroll()
      return unlockScroll
    }
  }, [isOpen, lockScroll, unlockScroll])

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="absolute inset-4 md:inset-y-4 md:left-[15%] md:right-[15%] flex flex-col bg-[var(--card-bg)] rounded-xl shadow-xl border border-[var(--border-color)] overflow-hidden">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 hover:bg-[var(--hover-bg)] rounded-lg transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="flex-1 overflow-auto bg-[var(--background)]">
          <ToolPageClient toolId={tool.id} />
        </div>
      </div>
    </div>
  )
} 
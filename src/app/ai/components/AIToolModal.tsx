'use client'

import { type Tool } from '@/app/ai/components/dashboard/types'
import ToolPageClient from '@/app/ai/tools/[toolId]/ToolPageClient'

interface AIToolModalProps {
  tool: Tool;
  isOpen: boolean;
  onClose: () => void;
}

export function AIToolModal({ tool, isOpen, onClose }: AIToolModalProps) {
  if (!isOpen) return null;

  // Extract the ID part after the # from the SK
  const toolId = tool.SK.split('#')[3]; // Get the last part after TOOL#

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
        onClick={onClose}
      />

      <div className="fixed inset-y-4 left-[15%] right-[15%] z-50 bg-[var(--card-bg)] rounded-xl shadow-xl border border-[var(--border-color)] flex flex-col">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 hover:bg-[var(--hover-bg)] rounded-lg transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="flex-1">
          <ToolPageClient toolId={toolId} />
        </div>
      </div>
    </>
  )
} 
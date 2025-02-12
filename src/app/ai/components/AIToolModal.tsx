'use client'

import { type AITool } from '@/lib/supabase/ai'
import ToolPageClient from '@/app/ai/tools/[toolId]/ToolPageClient'
import { useEffect, useCallback, useState } from 'react'
import { isSuperAdmin } from '@/lib/supabase/ai'
import { cn } from "@/lib/utils"
import { Eye, Pencil } from 'lucide-react'

interface AIToolModalProps {
  tool: AITool;
  isOpen: boolean;
  onClose: () => void;
  initialEditMode?: boolean;
}

export function AIToolModal({ tool, isOpen, onClose, initialEditMode = false }: AIToolModalProps) {
  const [isEditMode, setIsEditMode] = useState(initialEditMode);
  const [isSuperAdminUser, setIsSuperAdminUser] = useState(false);

  useEffect(() => {
    const checkSuperAdmin = async () => {
      const isAdmin = await isSuperAdmin();
      setIsSuperAdminUser(isAdmin);
    };
    checkSuperAdmin();
  }, []);

  useEffect(() => {
    setIsEditMode(initialEditMode);
  }, [initialEditMode]);

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
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 hover:bg-[var(--hover-bg)] rounded-lg transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Super Admin Banner */}
        {isSuperAdminUser && (
          <div className="relative border-b border-[var(--border-color)] bg-[var(--accent)]/5 px-6 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[var(--accent)]">
                <span className="text-sm font-medium">Super Admin Mode</span>
                <div className="h-4 w-px bg-[var(--accent)]/20" />
                <span className="text-sm text-[var(--accent)]/60">
                  {tool.status}
                </span>
              </div>

              {/* Edit/Preview Toggle */}
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                <div className="flex items-center gap-2 bg-[var(--card-bg)] rounded-lg p-1 border border-[var(--border-color)]">
                  <button
                    onClick={() => setIsEditMode(false)}
                    className={cn(
                      "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                      !isEditMode
                        ? "bg-[var(--accent)] text-white"
                        : "text-[var(--text-secondary)] hover:text-[var(--foreground)]"
                    )}
                  >
                    <Eye className="w-4 h-4" />
                    Preview
                  </button>
                  <button
                    onClick={() => setIsEditMode(true)}
                    className={cn(
                      "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                      isEditMode
                        ? "bg-[var(--accent)] text-white"
                        : "text-[var(--text-secondary)] hover:text-[var(--foreground)]"
                    )}
                  >
                    <Pencil className="w-4 h-4" />
                    Edit
                  </button>
                </div>
              </div>

              <div className="w-[100px]" /> {/* Spacer to balance the layout */}
            </div>
          </div>
        )}

        <div className="flex-1 overflow-auto bg-[var(--background)]">
          <ToolPageClient toolId={tool.id} isEditMode={isEditMode} />
        </div>
      </div>
    </div>
  )
} 
'use client'

import React from 'react'
import { cn } from "@/lib/utils"
import { AlertTriangle } from 'lucide-react'

interface DeleteConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  toolName: string
  isDeleting: boolean
}

export function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  toolName,
  isDeleting
}: DeleteConfirmationModalProps) {
  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div 
        className={cn(
          "fixed inset-0 bg-[var(--background)]/50 backdrop-blur-sm",
          "transition-opacity z-50"
        )}
        onClick={onClose}
      />

      {/* Modal */}
      <div className={cn(
        "fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2",
        "w-full max-w-md p-6",
        "bg-[var(--card-bg)] rounded-xl shadow-xl",
        "border border-[var(--border-color)]",
        "z-50"
      )}>
        <div className="flex flex-col items-center text-center">
          <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          
          <h3 className="text-xl font-semibold text-[var(--foreground)] mb-2">
            Delete Tool
          </h3>
          
          <p className="text-[var(--text-secondary)] mb-6">
            Are you sure you want to delete &quot;{toolName}&quot;? This action cannot be undone.
          </p>

          <div className="flex gap-3 w-full">
            <button
              onClick={onClose}
              disabled={isDeleting}
              className={cn(
                "flex-1 px-4 py-2 rounded-lg",
                "bg-[var(--hover-bg)] text-[var(--foreground)]",
                "hover:bg-[var(--hover-bg)]/80",
                "transition-colors duration-200",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              Cancel
            </button>
            
            <button
              onClick={onConfirm}
              disabled={isDeleting}
              className={cn(
                "flex-1 px-4 py-2 rounded-lg",
                "bg-red-600 text-white",
                "hover:bg-red-700",
                "transition-colors duration-200",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
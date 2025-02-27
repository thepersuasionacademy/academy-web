'use client'

import { ArrowRight, Loader2, Save } from 'lucide-react'
import { cn } from "@/lib/utils"
import { BundleHeaderProps } from './types'

export function BundleHeader({ 
  bundleName, 
  setBundleName, 
  bundleDescription, 
  setBundleDescription, 
  handleSaveBundle, 
  isSaving, 
  onClose 
}: BundleHeaderProps) {
  return (
    <div className="mb-8">
      <div className="flex flex-col">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
            <span>Access Control</span>
            <ArrowRight className="w-4 h-4" />
            <span>Bundles</span>
          </div>
          
          {/* Save Button */}
          <button
            onClick={handleSaveBundle}
            disabled={isSaving}
            className={cn(
              "px-4 py-2 rounded-lg text-base font-medium",
              "border transition-colors flex items-center gap-2",
              isSaving
                ? "bg-[var(--hover-bg)]/50 text-[var(--text-secondary)] cursor-not-allowed"
                : "bg-[var(--accent)] text-white hover:opacity-90"
            )}
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Bundle</span>
              </>
            )}
          </button>
        </div>
        <div className="h-px bg-[var(--border-color)] w-full mb-4" />
      </div>
      
      {/* Bundle Name Input */}
      <input
        type="text"
        value={bundleName}
        onChange={(e) => setBundleName(e.target.value)}
        placeholder="Enter bundle name..."
        className="w-full bg-transparent text-4xl font-semibold mb-3 px-0 border-none focus:outline-none text-[var(--foreground)] placeholder-[var(--text-secondary)]/50"
      />

      {/* Bundle Description Input */}
      <textarea
        value={bundleDescription}
        onChange={(e) => setBundleDescription(e.target.value)}
        placeholder="Enter bundle description..."
        className="w-full bg-transparent text-lg text-[var(--text-secondary)] px-0 border-none focus:outline-none resize-none placeholder-[var(--text-secondary)]/50"
        rows={1}
      />
    </div>
  )
} 
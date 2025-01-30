'use client'

import { useState, useEffect } from 'react'
import type { Tool, SuccessState } from '@/app/ai/components/dashboard/types'
import ToolList from '@/app/ai/components/dashboard/layout/tool/ToolList'
import { ToolForm } from '@/app/ai/components/dashboard/tool-editor/ToolForm'
import { cn } from "@/lib/utils"
import { usePathname, useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

interface ToolContainerProps {
  selectedTool: Tool | null
  onToolUpdate: (formData: FormData) => Promise<void>
  onSubmit: (formData: FormData) => Promise<void>
  onDelete?: () => Promise<void>
  onDuplicate?: (tool: Tool) => Promise<void>
  setSelectedTool: (tool: Tool | null) => void
  selectedCategory: string
  selectedSuite: string
  error: string
  loading: boolean
  success: SuccessState | null
  tools: Tool[]
  isLoadingTools: boolean
  hideCreationControls?: boolean
}

export function ToolContainer({
  selectedTool,
  onToolUpdate,
  onSubmit,
  onDelete,
  onDuplicate,
  setSelectedTool,
  selectedCategory,
  selectedSuite,
  error,
  loading,
  success,
  tools,
  isLoadingTools,
  hideCreationControls = false
}: ToolContainerProps) {
  const [isPanelOpen, setIsPanelOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const isAdminRoute = pathname?.includes('/admin')
  const supabase = createClientComponentClient()

  const handleClose = () => {
    setIsPanelOpen(false)
    setSelectedTool(null)
  }

  const handleToolSelect = (tool: Tool) => {
    console.log('ToolContainer handleToolSelect called with tool:', tool)
    // Always call setSelectedTool with the tool
    setSelectedTool(tool)
    
    // Only open the panel if we're in admin route
    if (isAdminRoute) {
      console.log('Admin route detected, opening panel')
      setIsPanelOpen(true)
    } else {
      console.log('Non-admin route, just passing tool up')
    }
  }

  const handleCreateNew = () => {
    setSelectedTool(null)
    setIsPanelOpen(true)
  }

  const handleDuplicate = async (tool: Tool) => {
    if (onDuplicate) {
      await onDuplicate(tool)
    } else {
      try {
        const { data: newTool, error } = await supabase.rpc('duplicate_tool', {
          tool_id: tool.id
        })
        
        if (error) throw error
        
        // Refresh the tools list
        const { data: tools, error: refreshError } = await supabase.rpc('get_tools_by_suite', {
          suite_id: tool.suite_id
        })
        
        if (refreshError) throw refreshError
        
        // Update the tools list
        setSelectedTool(newTool)
      } catch (err) {
        console.error('Error duplicating tool:', err)
        throw err
      }
    }
  }

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        console.error('Session check error:', error);
        router.push('/auth/login');
      } else if (!user) {
        console.log('No user session, redirecting to login');
        router.push('/auth/login');
      }
    };

    // Only run check if not already on login page
    if (!window.location.pathname.includes('/auth/login')) {
      checkUser();
    }
  }, [router]);

  return (
    <div className="relative">
      <ToolList 
        tools={tools}
        isLoading={isLoadingTools}
        onSelectTool={handleToolSelect}
        onCreateNew={handleCreateNew}
        onDuplicate={handleDuplicate}
        hideCreationControls={hideCreationControls}
      />

      {/* Only show editor panel in admin routes */}
      {isAdminRoute && (!hideCreationControls || selectedTool) && (
        <>
          {/* Backdrop */}
          <div 
            className={cn(
              "fixed inset-0 bg-[var(--background)]/50 backdrop-blur-sm transition-opacity z-40",
              isPanelOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
            )}
            onClick={handleClose}
          />

          {/* Sliding Panel */}
          <div 
            className={cn(
              "fixed right-0 top-0 h-full w-full max-w-2xl",
              "bg-[var(--card-bg)] shadow-lg",
              "transition-transform duration-300 ease-in-out transform z-50",
              "border-l border-[var(--border-color)]",
              isPanelOpen ? 'translate-x-0' : 'translate-x-full'
            )}
          >
            <div className="h-full overflow-y-auto p-6">
              {/* Panel Header */}
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h1 className="text-4xl font-bold text-[var(--foreground)]">
                    {selectedTool ? 'Edit AI Tool' : 'Create New AI Tool'}
                  </h1>
                  <p className="text-lg text-[var(--text-secondary)]">
                    {selectedTool ? 'Modify your existing AI tool' : 'Add a new tool to your AI suite'}
                  </p>
                </div>
                
                {/* Close Button */}
                <button
                  onClick={handleClose}
                  className={cn(
                    "p-2 rounded-lg",
                    "text-[var(--text-secondary)] hover:text-[var(--foreground)]",
                    "hover:bg-[var(--accent)]/10",
                    "transition-colors"
                  )}
                >
                  <svg 
                    className="w-6 h-6" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M6 18L18 6M6 6l12 12" 
                    />
                  </svg>
                </button>
              </div>

              {/* Tool Form */}
              <ToolForm
                onSubmit={selectedTool ? onToolUpdate : onSubmit}
                onDelete={selectedTool ? onDelete : undefined}
                categoryInput={selectedCategory}
                suiteInput={selectedSuite}
                loading={loading}
                error={error}
                initialData={selectedTool || undefined}
              />
            </div>
          </div>
        </>
      )}

      {/* Success Toast */}
      {success && (
        <div className={cn(
          "fixed bottom-4 right-4",
          "bg-[var(--card-bg)] border border-[var(--accent)]/50 rounded-2xl p-4",
          "text-[var(--foreground)] shadow-[0_0_10px_rgba(var(--accent),0.3)]",
          "animate-in slide-in-from-bottom-2"
        )}>
          <h3 className="font-semibold mb-2">Tool Successfully Created!</h3>
          <ul className="list-disc list-inside space-y-1 text-[var(--text-secondary)]">
            <li>Name: {success.name}</li>
            <li>Category: {success.category}</li>
            <li>Suite: {success.suite}</li>
            {success.inputField1 && (
              <li>Input Field: {success.inputField1}</li>
            )}
          </ul>
        </div>
      )}
    </div>
  )
}
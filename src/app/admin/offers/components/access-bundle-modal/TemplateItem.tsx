'use client'

import { Bot, ChevronDown, FileText } from 'lucide-react'
import { cn } from "@/lib/utils"
import { TemplateItemProps } from './types'

export function TemplateItem({ 
  template, 
  isExpanded, 
  onExpand, 
  onDelete,
  renderTemplateTitle
}: TemplateItemProps) {
  return (
    <div className="space-y-3">
      <div
        onClick={() => onExpand(template)}
        className={cn(
          "group relative rounded-xl p-6",
          "border border-[var(--border-color)]",
          "transition-all duration-300",
          "bg-[#fafafa] hover:bg-white dark:bg-[var(--card-bg)]",
          "hover:border-[var(--accent)]",
          "cursor-pointer",
          isExpanded && "border-[var(--accent)]"
        )}
      >
        {/* Add Delete Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(template);
          }}
          className="absolute top-2 right-2 w-6 h-6 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
          aria-label="Delete template"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {template.type === 'content' ? (
              <FileText className="w-5 h-5 text-[var(--text-secondary)]" />
            ) : (
              <Bot className="w-5 h-5 text-[var(--text-secondary)]" />
            )}
            <div>
              <h4 className="text-lg font-semibold text-[var(--foreground)]">
                {renderTemplateTitle(template)}
              </h4>
              {template.description && (
                <p className="text-sm text-[var(--text-secondary)] line-clamp-2 group-hover:text-[var(--foreground)] transition-colors">
                  {template.description}
                </p>
              )}
            </div>
          </div>
          <div className={cn(
            "w-5 h-5 rounded-full border border-[var(--text-secondary)] flex items-center justify-center text-[var(--text-secondary)]",
            "transition-colors",
            "group-hover:border-[var(--accent)] group-hover:text-[var(--accent)]",
            isExpanded && "border-[var(--accent)] text-[var(--accent)] rotate-180"
          )}>
            <ChevronDown className="w-4 h-4" />
          </div>
        </div>
      </div>
    </div>
  )
} 
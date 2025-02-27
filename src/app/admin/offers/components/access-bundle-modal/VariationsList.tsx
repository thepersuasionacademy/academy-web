'use client'

import { Plus } from 'lucide-react'
import { cn } from "@/lib/utils"
import { VariationsListProps } from './types'

export function VariationsList({
  variations,
  selectedVariationId,
  isAddingVariation,
  newVariationName,
  setNewVariationName,
  handleAddVariation,
  handleVariationClick,
  handleVariationDoubleClick,
  editingVariationId,
  editingName,
  setEditingName,
  handleEditSave,
  handleKeyPress,
  removeVariation
}: VariationsListProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center">
        <button
          onClick={handleAddVariation}
          className={cn(
            "p-1 rounded-lg transition-colors",
            isAddingVariation
              ? "bg-[var(--accent)] text-white hover:bg-[var(--accent)]/90"
              : "hover:bg-[var(--hover-bg)] text-[var(--text-secondary)]"
          )}
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {variations.map((variation) => (
          <div
            key={variation.id}
            className="group relative inline-flex"
            onClick={() => handleVariationClick(variation)}
            onDoubleClick={() => handleVariationDoubleClick(variation)}
          >
            <div className={cn(
              "px-4 py-2 rounded-lg text-base font-medium cursor-pointer",
              "border bg-[var(--card-bg)]",
              "transition-all duration-200",
              selectedVariationId === variation.id
                ? "border-[var(--accent)] shadow-[0_0_0_1px_var(--accent)]"
                : "border-[var(--text-secondary)] hover:border-[var(--accent)]",
              "text-[var(--text-secondary)]"
            )}>
              {editingVariationId === variation.id ? (
                <div
                  contentEditable
                  suppressContentEditableWarning
                  onInput={(e) => setEditingName(e.currentTarget.textContent || '')}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleEditSave(variation.id);
                    } else if (e.key === 'Escape') {
                      setEditingName('');
                      handleEditSave(variation.id);
                    }
                  }}
                  onBlur={() => handleEditSave(variation.id)}
                  onClick={(e) => e.stopPropagation()}
                  className="inline focus:outline-none whitespace-nowrap"
                >
                  {variation.name}
                </div>
              ) : (
                variation.name
              )}
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                removeVariation(variation.id);
              }}
              className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs"
            >
              ×
            </button>
          </div>
        ))}

        {isAddingVariation && (
          <input
            type="text"
            value={newVariationName}
            onChange={(e) => setNewVariationName(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Enter variation name..."
            autoFocus
            className={cn(
              "px-4 py-2 rounded-lg text-base font-medium",
              "border border-[var(--accent)] bg-[var(--card-bg)]",
              "text-[var(--text-secondary)]",
              "focus:outline-none",
              "placeholder-[var(--text-secondary)]/50"
            )}
          />
        )}
      </div>
    </div>
  )
} 
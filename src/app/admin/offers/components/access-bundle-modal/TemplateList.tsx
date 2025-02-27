'use client'

import { Plus, Loader2, FileText, Clock, Package } from 'lucide-react'
import { BundleAccessSelector } from '../bundle-selector'
import { TemplateItem } from './TemplateItem'
import { TemplateContent } from './TemplateContent'
import { cn } from "@/lib/utils"
import { TemplateListProps } from './types'
import { getMergedTemplates } from './utils'

export function TemplateList({
  selectedVariationId,
  selectedVariationTemplates,
  isLoadingTemplates,
  showAddAccess,
  setShowAddAccess,
  bundleId,
  handleAddAccess,
  expandedTemplateId,
  handleTemplateExpand,
  editingTemplateId,
  handleAITemplateUpdate,
  handleDeleteTemplate
}: TemplateListProps) {
  // Function to render template title based on template type
  const renderTemplateTitle = (template: any) => {
    // Determine the icon based on template type
    const TemplateIcon = template.type === 'content' ? FileText : Package;
    
    // Check if the template has any type of drip settings
    const hasDripSettings = 
      (template.dripSettings && Object.keys(template.dripSettings).length > 0) ||
      template.collectionDripSettings ||
      template.suiteDripSettings;
    
    // Get the drip level name
    let dripLevelName = '';
    if (template.collectionDripSettings) {
      dripLevelName = 'Collection';
    } else if (template.suiteDripSettings) {
      dripLevelName = 'Suite';
    } else if (template.dripSettings && Object.keys(template.dripSettings).length > 0) {
      dripLevelName = 'Tool';
    }
    
    return (
      <div className="flex items-center gap-3 py-1">
        <TemplateIcon className="w-4 h-4 text-[var(--text-secondary)]" />
        <div className="flex flex-col">
          <span className="font-medium">{template.name}</span>
          <span className="text-xs text-[var(--text-secondary)]">
            {template.type === 'content' 
              ? template.contentName 
              : template.suiteName || template.categoryName}
            {template.toolIds?.length ? ` (${template.toolIds.length} tools)` : ''}
          </span>
        </div>
        {hasDripSettings && (
          <div className="ml-auto flex items-center gap-1 text-xs text-[var(--text-secondary)]">
            <Clock className="h-3 w-3" />
            <span>{dripLevelName} Drip Enabled</span>
          </div>
        )}
      </div>
    );
  };

  if (!selectedVariationId) {
    return null;
  }

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-[var(--foreground)]">Templates</h3>
        <button
          onClick={() => setShowAddAccess(true)}
          className="px-3 py-1.5 rounded-lg text-sm font-medium bg-[var(--accent)] text-white hover:opacity-90 transition-opacity flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Template</span>
        </button>
      </div>

      {showAddAccess ? (
        <BundleAccessSelector
          bundleId={bundleId}
          onSave={handleAddAccess}
          onCancel={() => setShowAddAccess(false)}
        />
      ) : null}

      {/* Divider after Add Template button */}
      {(!showAddAccess && selectedVariationTemplates.length > 0) && (
        <div className="h-px bg-[var(--border-color)] w-full my-6" />
      )}

      {/* Content Templates List */}
      <div className="space-y-4">
        {isLoadingTemplates ? (
          <div className="flex items-center justify-center p-4">
            <div className="flex items-center gap-2 text-[var(--text-secondary)]">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Loading templates...</span>
            </div>
          </div>
        ) : selectedVariationTemplates.length === 0 ? (
          <div className="text-center p-4 text-[var(--text-secondary)]">
            <p>No templates added to this variation yet.</p>
            <p className="text-sm mt-1">Click &quot;Add Template&quot; to get started.</p>
          </div>
        ) : (
          getMergedTemplates(selectedVariationTemplates).map((template) => (
            <div key={template.id}>
              <TemplateItem
                template={template}
                isExpanded={expandedTemplateId === template.id}
                onExpand={handleTemplateExpand}
                onDelete={handleDeleteTemplate}
                renderTemplateTitle={renderTemplateTitle}
              />
              
              {/* Expanded Content */}
              {expandedTemplateId === template.id && (
                <div className={cn(
                  "p-6",
                  "border-t border-[var(--border-color)]"
                )}>
                  <TemplateContent
                    template={template}
                    bundleId={bundleId}
                    editingTemplateId={editingTemplateId}
                    handleAITemplateUpdate={handleAITemplateUpdate}
                    setEditingTemplateId={(id) => console.log(id)} // This will be replaced in the main component
                    setExpandedTemplateId={(id) => console.log(id)} // This will be replaced in the main component
                  />
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
} 
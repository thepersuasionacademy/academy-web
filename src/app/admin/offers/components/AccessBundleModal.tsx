'use client'

import { useEffect, useCallback, useState } from 'react'
import { cn } from "@/lib/utils"
import { ArrowRight, Plus, Package, FileText, ChevronDown } from 'lucide-react'
import { AccessStructureView } from '@/app/profile/components/content/access-structure/AccessStructureView'
import { BundleAccessSelector } from './BundleAccessSelector'

interface Template {
  id: string;
  type: 'content' | 'ai';
  name: string;
  description?: string;
  contentName?: string;
}

interface Variation {
  id: string;
  name: string;
  templates?: Template[];
}

interface AccessBundleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AccessBundleModal({ isOpen, onClose }: AccessBundleModalProps) {
  const [bundleName, setBundleName] = useState('');
  const [bundleDescription, setBundleDescription] = useState('');
  const [variations, setVariations] = useState<Variation[]>([]);
  const [isAddingVariation, setIsAddingVariation] = useState(false);
  const [newVariationName, setNewVariationName] = useState('');
  const [selectedVariationId, setSelectedVariationId] = useState<string | null>(null);
  const [editingVariationId, setEditingVariationId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [showAddAccess, setShowAddAccess] = useState(false);
  const [selectedVariationTemplates, setSelectedVariationTemplates] = useState<Template[]>([]);
  const [expandedTemplateId, setExpandedTemplateId] = useState<string | null>(null);

  // Mock templates for demonstration
  const mockTemplates: Template[] = [
    {
      id: '1',
      type: 'content',
      name: 'Basic Access',
      description: 'Access to fundamental patterns and concepts',
      contentName: 'Power Patterns'
    },
    {
      id: '2',
      type: 'content',
      name: 'Full Access',
      description: 'Complete access to leadership materials',
      contentName: 'Leadership Course'
    }
  ];

  useEffect(() => {
    // In a real implementation, this would fetch templates for the selected variation
    if (selectedVariationId) {
      setSelectedVariationTemplates(mockTemplates);
    } else {
      setSelectedVariationTemplates([]);
    }
  }, [selectedVariationId]);

  const handleAddAccess = (type: 'ai' | 'content' | null, id: string) => {
    // Here you would handle adding the selected access to the variation
    console.log('Adding access:', { type, id });
    setShowAddAccess(false);
  };

  const handleAddVariation = () => {
    if (!isAddingVariation) {
      setIsAddingVariation(true);
      return;
    }

    if (newVariationName.trim()) {
      const newVariation = {
        id: crypto.randomUUID(),
        name: newVariationName.trim()
      };
      setVariations(prev => [...prev, newVariation]);
      setNewVariationName('');
      setIsAddingVariation(false);
      setSelectedVariationId(newVariation.id);
    }
  };

  const handleVariationClick = (variation: Variation) => {
    setSelectedVariationId(variation.id);
  };

  const handleVariationDoubleClick = (variation: Variation) => {
    setEditingVariationId(variation.id);
    setEditingName(variation.name);
  };

  const handleEditSave = (id: string) => {
    if (editingName.trim()) {
      setVariations(prev => prev.map(v => 
        v.id === id ? { ...v, name: editingName.trim() } : v
      ));
    }
    setEditingVariationId(null);
    setEditingName('');
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleAddVariation();
    } else if (e.key === 'Escape') {
      setIsAddingVariation(false);
      setNewVariationName('');
    }
  };

  const removeVariation = (id: string) => {
    setVariations(prev => prev.filter(v => v.id !== id));
    if (selectedVariationId === id) {
      setSelectedVariationId(null);
    }
  };

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

        <div className="flex-1 overflow-auto bg-[var(--background)] p-8">
          <div className="max-w-3xl mx-auto">
            {/* Title Section */}
            <div className="mb-8">
              <div className="flex flex-col">
                <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)] mb-2">
                  <span>Access Control</span>
                  <ArrowRight className="w-4 h-4" />
                  <span>Bundles</span>
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

            {/* Divider */}
            <div className="h-px bg-[var(--border-color)] w-full mb-4" />

            {/* Variations Section */}
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
                      "px-3 py-1.5 rounded-lg text-sm font-medium cursor-pointer",
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
                              setEditingVariationId(null);
                              setEditingName('');
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
                      "px-3 py-1.5 rounded-lg text-sm font-medium",
                      "border border-[var(--accent)] bg-[var(--card-bg)]",
                      "text-[var(--text-secondary)]",
                      "focus:outline-none",
                      "placeholder-[var(--text-secondary)]/50"
                    )}
                  />
                )}
              </div>

              {/* Selected Variation Content */}
              {selectedVariationId && (
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
                      onSubmit={handleAddAccess}
                      onCancel={() => setShowAddAccess(false)}
                    />
                  ) : null}

                  {/* Content Templates List */}
                  <div className="space-y-4">
                    {selectedVariationTemplates.map((template) => (
                      <div key={template.id} className="space-y-3">
                        <div
                          onClick={() => setExpandedTemplateId(
                            expandedTemplateId === template.id ? null : template.id
                          )}
                          className={cn(
                            "group relative rounded-xl p-6",
                            "border border-[var(--border-color)]",
                            "transition-all duration-300",
                            "bg-[#fafafa] hover:bg-white dark:bg-[var(--card-bg)]",
                            "hover:border-[var(--accent)]",
                            "cursor-pointer",
                            expandedTemplateId === template.id && "border-[var(--accent)]"
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {template.type === 'content' ? (
                                <FileText className="w-5 h-5 text-[var(--text-secondary)]" />
                              ) : (
                                <Package className="w-5 h-5 text-[var(--text-secondary)]" />
                              )}
                              <div>
                                <h4 className="text-lg font-semibold text-[var(--foreground)]">{template.contentName} → {template.name}</h4>
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
                              expandedTemplateId === template.id && "border-[var(--accent)] text-[var(--accent)] rotate-180"
                            )}>
                              <ChevronDown className="w-4 h-4" />
                            </div>
                          </div>
                        </div>

                        {/* Expanded Access Structure View */}
                        {expandedTemplateId === template.id && (
                          <div className={cn(
                            "rounded-xl p-6",
                            "border border-[var(--border-color)]",
                            "bg-[#fafafa] dark:bg-[var(--card-bg)]"
                          )}>
                            <AccessStructureView
                              selectedType="content"
                              selectedId={template.id}
                              isAdmin={true}
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 
'use client'

import { useEffect, useCallback, useState, useRef } from 'react'
import { cn } from "@/lib/utils"
import { ArrowRight, Plus, Package, FileText, ChevronDown, Loader2, Bot, Save } from 'lucide-react'
import { AccessStructureView } from '@/app/profile/components/content/access-structure/AccessStructureView'
import { BundleAccessSelector } from './BundleAccessSelector'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { TemplateMixedAccessView } from '@/app/admin/offers/components/TemplateMixedAccessView'
import { toast } from 'sonner'

interface Template {
  id: string;
  type: 'content' | 'ai';
  name: string;
  description?: string;
  contentName?: string;
  contentId?: string;
  templateData?: any;
  isLoadingTemplateData?: boolean;
  // AI specific properties
  categoryId?: string;
  categoryName?: string;
  suiteId?: string;
  suiteName?: string;
  toolName?: string;
  // Support for multiple tools
  toolIds?: string[];
  toolNames?: string[];
  // For merged templates
  originalTemplates?: Template[];
}

interface Variation {
  id: string;
  name: string;
  templates?: Template[];
}

interface AccessBundleModalProps {
  isOpen: boolean;
  onClose: () => void;
  bundle?: {
    id: string;
    name: string;
    description: string;
    variations: {
      id: string;
      name: string;
      variation_name?: string;
      templates?: any[];
      description?: string;
    }[];
    createdAt?: string;
    updatedAt?: string;
    createdBy?: string;
  };
}

export function AccessBundleModal({ isOpen, onClose, bundle }: AccessBundleModalProps) {
  const [bundleName, setBundleName] = useState(bundle?.name || '');
  const [bundleDescription, setBundleDescription] = useState(bundle?.description || '');
  const [variations, setVariations] = useState<Variation[]>([]);
  const [isAddingVariation, setIsAddingVariation] = useState(false);
  const [newVariationName, setNewVariationName] = useState('');
  const [selectedVariationId, setSelectedVariationId] = useState<string | null>(null);
  const [editingVariationId, setEditingVariationId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [showAddAccess, setShowAddAccess] = useState(false);
  const [selectedVariationTemplates, setSelectedVariationTemplates] = useState<Template[]>([]);
  const [expandedTemplateId, setExpandedTemplateId] = useState<string | null>(null);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [bundleId, setBundleId] = useState<string | null>(bundle?.id || null);
  const supabase = createClientComponentClient();

  // Initialize state from bundle prop when provided
  useEffect(() => {
    if (bundle) {
      console.log('Initializing modal with bundle data:', bundle);
      setBundleName(bundle.name || '');
      setBundleDescription(bundle.description || '');
      setBundleId(bundle.id);
      
      // Transform variations data if needed
      const transformedVariations = bundle.variations.map(variation => ({
        id: variation.id,
        name: variation.name || variation.variation_name || '',
        templates: variation.templates || [],
      }));
      
      setVariations(transformedVariations);
      
      // Set the first variation as selected by default if available
      if (transformedVariations.length > 0) {
        setSelectedVariationId(transformedVariations[0].id);
      }
    } else {
      // Clear bundleId if no bundle is provided
      setBundleId(null);
    }
  }, [bundle]);

  useEffect(() => {
    // Fetch templates for the selected variation
    const fetchTemplatesForVariation = async () => {
      if (!selectedVariationId || !bundleId) {
        setSelectedVariationTemplates([]);
        return;
      }

      setIsLoadingTemplates(true);
      try {
        console.log(`Fetching details for bundle ${bundleId} and variation ${selectedVariationId}`);
        
        // Call the RPC function to get detailed template information
        const { data, error } = await supabase.rpc('get_access_bundle_variation_details', {
          p_bundle_id: bundleId,
          p_variation_id: selectedVariationId
        });
        
        if (error) {
          console.error('Error fetching variation details:', error);
          throw error;
        }
        
        console.log('Variation details response:', data);
        
        if (data?.success && Array.isArray(data?.templates)) {
          console.log(`Found ${data.templates.length} templates for variation ${selectedVariationId}`);
          
          // Transform the templates from the API to match our component's expected format
          const transformedTemplates = data.templates.map((template: any) => {
            // Common template properties
            const baseTemplate: Template = {
              id: template.id,
              type: template.type,
              name: template.name,
              description: template.description,
            };
            
            // Add content-specific properties
            if (template.type === 'content') {
              return {
                ...baseTemplate,
                contentId: template.contentId,
                contentName: template.contentName,
              };
            }
            
            // Add AI-specific properties
            if (template.type === 'ai') {
              return {
                ...baseTemplate,
                categoryId: template.categoryId,
                categoryName: template.categoryName,
                suiteId: template.suiteId,
                suiteName: template.suiteName,
                toolIds: template.toolIds,
                toolNames: template.toolNames,
              };
            }
            
            return baseTemplate;
          });
          
          setSelectedVariationTemplates(transformedTemplates);
        } else {
          // If no templates data or error, set empty array
          console.log('No templates found or invalid data format');
          setSelectedVariationTemplates([]);
        }
      } catch (err) {
        console.error('Failed to load templates:', err);
        setSelectedVariationTemplates([]);
      } finally {
        setIsLoadingTemplates(false);
      }
    };

    fetchTemplatesForVariation();
  }, [selectedVariationId, bundleId, supabase]);

  // Helper function to merge AI templates by suite
  const getMergedTemplates = (templates: Template[]): Template[] => {
    if (!templates || templates.length === 0) return [];
    
    // First, separate AI and non-AI templates
    const aiTemplates = templates.filter(t => t.type === 'ai');
    const nonAiTemplates = templates.filter(t => t.type !== 'ai');
    
    // Group AI templates by suite ID
    const templatesBySuite: Record<string, Template[]> = {};
    
    aiTemplates.forEach(template => {
      if (template.suiteId) {
        const key = `${template.categoryId}-${template.suiteId}`;
        if (!templatesBySuite[key]) {
          templatesBySuite[key] = [];
        }
        templatesBySuite[key].push(template);
      } else {
        // For templates without a suite (like category-level templates), treat individually
        const key = `${template.categoryId}-individual-${template.id}`;
        templatesBySuite[key] = [template];
      }
    });
    
    // Create merged templates for suites with multiple tools
    const mergedAiTemplates: Template[] = [];
    
    Object.keys(templatesBySuite).forEach(key => {
      const suiteTemplates = templatesBySuite[key];
      
      if (suiteTemplates.length === 1) {
        // Only one template for this suite, no merging needed
        mergedAiTemplates.push(suiteTemplates[0]);
      } else if (suiteTemplates.length > 1) {
        // Multiple templates for this suite, merge them
        const first = suiteTemplates[0];
        const toolIds = suiteTemplates.map(t => t.toolIds || []).flat().filter(Boolean);
        const toolNames = suiteTemplates.map(t => t.toolNames || []).flat().filter(Boolean);
        
        // Create a merged template
        const mergedTemplate: Template = {
          id: `merged-${first.suiteId}`,
          type: 'ai',
          name: first.suiteName || 'AI Suite',
          description: `${toolNames.length} tools from ${first.suiteName}`,
          categoryId: first.categoryId,
          categoryName: first.categoryName,
          suiteId: first.suiteId,
          suiteName: first.suiteName,
          // Include all tool IDs and names
          toolIds: toolIds,
          toolNames: toolNames,
          // Store original templates for reference when expanded
          originalTemplates: suiteTemplates
        };
        
        mergedAiTemplates.push(mergedTemplate);
      }
    });
    
    // Combine merged AI templates with non-AI templates
    return [...mergedAiTemplates, ...nonAiTemplates];
  };

  const handleAddAccess = (type: 'ai' | 'content' | null, id: string, templateInfo?: any) => {
    console.log('Adding access:', { type, id, templateInfo });
    
    if (!selectedVariationId || !type || !id) return;
    
    // Create a new template with the provided information
    const newTemplate: Template = {
      id,
      type,
      name: type === 'content' 
        ? templateInfo?.templateName || 'New Template'
        : templateInfo?.toolName || 'New AI Tool',
      contentName: type === 'content' 
        ? templateInfo?.contentName 
        : null,
      description: templateInfo?.description || '',
      contentId: type === 'content' ? templateInfo?.contentId || '' : null,
      
      // AI specific properties
      categoryId: type === 'ai' ? templateInfo?.categoryId : null,
      categoryName: type === 'ai' ? templateInfo?.categoryName : null,
      suiteId: type === 'ai' ? templateInfo?.suiteId : null,
      suiteName: type === 'ai' ? templateInfo?.suiteName : null,
      toolName: type === 'ai' ? templateInfo?.toolName : null,
      // Store multiple tools data if available
      toolIds: type === 'ai' ? templateInfo?.toolIds : null,
      toolNames: type === 'ai' ? templateInfo?.toolNames : null,
    };
    
    // Add the template to selectedVariationTemplates (used for UI rendering)
    setSelectedVariationTemplates(prev => [...prev, newTemplate]);
    
    // Also add the template to the selected variation in the variations state
    setVariations(prev => prev.map(variation => {
      if (variation.id === selectedVariationId) {
        return {
          ...variation,
          templates: [...(variation.templates || []), newTemplate]
        };
      }
      return variation;
    }));
    
    setShowAddAccess(false);
    toast.success("Template added successfully");
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

  const handleTemplateExpand = async (template: Template) => {
    if (expandedTemplateId === template.id) {
      setExpandedTemplateId(null);
      setEditingTemplateId(null);
      return;
    }
    
    setExpandedTemplateId(template.id);
    
    // If it's an AI template, automatically set it to edit mode
    if (template.type === 'ai') {
      setEditingTemplateId(template.id);
    } else {
      setEditingTemplateId(null);
    }
    
    // Only fetch data for content templates, no data fetching needed for AI templates
    if (template.type !== 'content' || template.templateData || !template.contentId) {
      return;
    }
    
    setVariations(prev => prev.map(variation => {
      if (variation.id === selectedVariationId) {
        return {
          ...variation,
          templates: variation.templates?.map(t => 
            t.id === template.id ? { ...t, isLoadingTemplateData: true } : t
          )
        };
      }
      return variation;
    }));
    
    try {
      const { data, error } = await supabase.rpc('get_mixed_template_structure', {
        p_content_id: template.contentId,
        p_template_id: template.id
      });
      
      if (error) {
        console.error('Error fetching template data:', error);
        throw error;
      }
      
      setVariations(prev => prev.map(variation => {
        if (variation.id === selectedVariationId) {
          return {
            ...variation,
            templates: variation.templates?.map(t => 
              t.id === template.id ? { 
                ...t, 
                templateData: data,
                isLoadingTemplateData: false 
              } : t
            )
          };
        }
        return variation;
      }));
    } catch (err) {
      console.error('Failed to load template data:', err);
      
      setVariations(prev => prev.map(variation => {
        if (variation.id === selectedVariationId) {
          return {
            ...variation,
            templates: variation.templates?.map(t => 
              t.id === template.id ? { ...t, isLoadingTemplateData: false } : t
            )
          };
        }
        return variation;
      }));
    }
  };

  // Function to render template title based on template type
  const renderTemplateTitle = (template: Template) => {
    if (template.type === 'content') {
      return `${template.contentName} → ${template.name}`;
    } else if (template.type === 'ai') {
      // Create hierarchical path based on how deep the selection was
      if (template.toolIds && template.toolIds.length > 0) {
        if (template.toolIds.length === 1) {
          return `${template.categoryName} → ${template.suiteName} → ${template.toolNames?.[0] || template.toolName}`;
        } else {
          return `${template.categoryName} → ${template.suiteName} → ${template.toolIds.length} Tools`;
        }
      } else if (template.toolName) {
        return `${template.categoryName} → ${template.suiteName} → ${template.toolName}`;
      } else if (template.suiteName) {
        return `${template.categoryName} → ${template.suiteName}`;
      } else {
        return `${template.categoryName}`;
      }
    }
    return template.name;
  };

  // Function to handle editing a template
  const handleEditTemplate = (template: Template) => {
    setEditingTemplateId(template.id);
  };
  
  // Function to handle updates when an AI template is edited
  const handleAITemplateUpdate = (type: 'ai' | 'content' | null, id: string, templateInfo?: any) => {
    if (!selectedVariationId || !type || !id || type !== 'ai') return;
    
    // Check if this is a merged template being updated
    const editingTemplate = selectedVariationTemplates.find(t => t.id === editingTemplateId);
    const isMergedTemplate = editingTemplate?.id.startsWith('merged-');
    
    if (isMergedTemplate && editingTemplate?.originalTemplates) {
      // This is a merged template update
      // We need to update all the original templates or remove them based on the new selection
      
      console.log('Updating merged template with info:', templateInfo);
      
      // If we still have tools selected, update them
      if (templateInfo.toolIds && templateInfo.toolIds.length > 0) {
        // Get the original variation templates excluding the ones from this merged group
        const updatedVariationTemplates = selectedVariationTemplates.filter(
          t => t.id !== editingTemplateId && !editingTemplate.originalTemplates?.some(ot => ot.id === t.id)
        );
        
        // Create new templates based on the selected tools
        const newToolTemplates = templateInfo.toolIds.map((toolId: string, index: number) => ({
          id: toolId, // Use tool ID as template ID
          type: 'ai',
          name: templateInfo.toolNames?.[index] || 'AI Tool',
          categoryId: templateInfo.categoryId,
          categoryName: templateInfo.categoryName,
          suiteId: templateInfo.suiteId,
          suiteName: templateInfo.suiteName,
          toolIds: [toolId],
          toolNames: [templateInfo.toolNames?.[index]]
        }));
        
        // Update the variation templates
        setSelectedVariationTemplates([...updatedVariationTemplates, ...newToolTemplates]);
        
        // Also update the variations state to persist these changes
        setVariations(prev => prev.map(variation => {
          if (variation.id === selectedVariationId) {
            return {
              ...variation,
              templates: [...updatedVariationTemplates, ...newToolTemplates]
            };
          }
          return variation;
        }));
      } else {
        // If no tools are selected, remove all the original templates
        const updatedVariationTemplates = selectedVariationTemplates.filter(
          t => t.id !== editingTemplateId && !editingTemplate.originalTemplates?.some(ot => ot.id === t.id)
        );
        
        setSelectedVariationTemplates(updatedVariationTemplates);
        
        setVariations(prev => prev.map(variation => {
          if (variation.id === selectedVariationId) {
            return {
              ...variation,
              templates: updatedVariationTemplates
            };
          }
          return variation;
        }));
      }
    } else {
      // Regular template update
      // Update the template with the new information
      setVariations(prev => prev.map(variation => {
        if (variation.id === selectedVariationId) {
          return {
            ...variation,
            templates: variation.templates?.map(template => 
              template.id === editingTemplateId ? {
                ...template,
                id, // This might be the same as editingTemplateId
                categoryId: templateInfo?.categoryId,
                categoryName: templateInfo?.categoryName,
                suiteId: templateInfo?.suiteId,
                suiteName: templateInfo?.suiteName,
                toolName: templateInfo?.toolName,
                toolIds: templateInfo?.toolIds,
                toolNames: templateInfo?.toolNames,
              } : template
            )
          };
        }
        return variation;
      }));
    }
    
    // Close the editing mode
    setEditingTemplateId(null);
  };

  // Function to render the appropriate template content
  const renderTemplateContent = (template: Template) => {
    if (template.isLoadingTemplateData) {
      return (
        <div className="flex items-center justify-center p-4">
          <div className="flex items-center gap-2 text-[var(--text-secondary)]">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Loading template structure...</span>
          </div>
        </div>
      );
    }

    // For AI templates, always show the BundleAccessSelector
    if (template.type === 'ai') {
      return (
        <BundleAccessSelector
          onSubmit={handleAITemplateUpdate}
          onCancel={() => {
            setEditingTemplateId(null);
            setExpandedTemplateId(null);
          }}
          initialSelection={{
            type: 'ai',
            categoryId: template.categoryId,
            categoryName: template.categoryName,
            suiteId: template.suiteId,
            suiteName: template.suiteName,
            toolIds: template.toolIds,
            toolNames: template.toolNames
          }}
        />
      );
    }

    if (template.type === 'content') {
      return (
        <TemplateMixedAccessView
          templateId={template.id}
          contentId={template.contentId || ''}
          templateData={template.templateData}
        />
      );
    }

    return (
      <div className="text-center text-[var(--text-secondary)]">
        No preview available for this template type.
      </div>
    );
  };

  // Function to handle saving the entire bundle
  const handleSaveBundle = async () => {
    if (!bundleName.trim()) {
      toast.error("Please enter a bundle name");
      return;
    }

    if (variations.length === 0) {
      toast.error("Please add at least one variation");
      return;
    }

    setIsSaving(true);
    
    try {
      // Prepare the bundle data structure for saving
      const bundleData = {
        id: bundleId,
        name: bundleName.trim(),
        description: bundleDescription.trim(),
        variations: variations.map(variation => {
          // For the selected variation, use the selectedVariationTemplates which has the most up-to-date state
          if (variation.id === selectedVariationId) {
            return {
              id: variation.id,
              name: variation.name,
              templates: selectedVariationTemplates // Use the most current state
            };
          }
          // For other variations, use their existing templates
          return {
            id: variation.id,
            name: variation.name,
            templates: variation.templates || []
          };
        })
      };
      
      console.log('Saving bundle data:', bundleData);
      
      // Call the RPC to save the bundle
      const { data, error } = await supabase.rpc('save_access_bundle', {
        p_bundle: bundleData
      });
      
      if (error) {
        console.error('Error saving bundle:', error);
        toast.error("Failed to save bundle");
        throw error;
      }
      
      console.log('Bundle saved successfully:', data);
      toast.success("Bundle saved successfully");
      
      // Update local state with the returned data
      if (data) {
        setBundleId(data.id);
        // Update other state as needed based on the response
      }
    } catch (err) {
      console.error('Failed to save bundle:', err);
      toast.error("An error occurred while saving");
    } finally {
      setIsSaving(false);
    }
  };

  // Function to handle deleting a template from the variation
  const handleDeleteTemplate = (template: Template) => {
    if (!selectedVariationId) return;
    
    try {
      // If this is a merged template, we need to delete all the original templates
      const templatesToDelete = template.originalTemplates || [template];
      
      // Get the IDs of templates to delete
      const templateIds = templatesToDelete.map(t => t.id);
      
      // If the template was expanded, collapse it
      if (expandedTemplateId === template.id) {
        setExpandedTemplateId(null);
        setEditingTemplateId(null);
      }
      
      // Update the local state to remove the deleted template(s)
      setSelectedVariationTemplates(prev => 
        prev.filter(t => !templateIds.includes(t.id))
      );
      
      // Also update the variations state
      setVariations(prev => prev.map(variation => {
        if (variation.id === selectedVariationId) {
          return {
            ...variation,
            templates: variation.templates?.filter(t => !templateIds.includes(t.id))
          };
        }
        return variation;
      }));
      
      toast.success("Template removed");
    } catch (err) {
      console.error('Failed to delete template:', err);
      toast.error("Failed to remove template");
    }
  };

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
                      "px-4 py-2 rounded-lg text-base font-medium",
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
                        <div key={template.id} className="space-y-3">
                          <div
                            onClick={() => handleTemplateExpand(template)}
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
                            {/* Add Delete Button */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteTemplate(template);
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
                                expandedTemplateId === template.id && "border-[var(--accent)] text-[var(--accent)] rotate-180"
                              )}>
                                <ChevronDown className="w-4 h-4" />
                              </div>
                            </div>
                          </div>

                          {/* Expanded Access Structure View */}
                          {expandedTemplateId === template.id && (
                            <div className={cn(
                              "p-6",
                              "border-t border-[var(--border-color)]"
                            )}>
                              {renderTemplateContent(template)}
                            </div>
                          )}
                        </div>
                      ))
                    )}
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
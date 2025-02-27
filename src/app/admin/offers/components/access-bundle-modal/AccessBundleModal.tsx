'use client'

import { useEffect, useCallback, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { toast } from 'sonner'
import { BundleHeader } from './BundleHeader'
import { VariationsList } from './VariationsList'
import { TemplateList } from './TemplateList'
import { AccessBundleModalProps, Template, Variation } from './types'
import { extractDripSettings, prepareTemplatesForSaving } from './utils'

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
  
  const supabase = createClientComponentClient<any>();

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
              access_overrides: template.access_overrides
            };
            
            // Extract drip settings
            if (template.access_overrides?.media) {
              const extractedSettings = extractDripSettings(template);
              if (extractedSettings?.toolDripSettings) {
                baseTemplate.dripSettings = extractedSettings.toolDripSettings;
              }
              if (extractedSettings?.collectionDripSettings) {
                baseTemplate.collectionDripSettings = extractedSettings.collectionDripSettings;
              }
              if (extractedSettings?.suiteDripSettings) {
                baseTemplate.suiteDripSettings = extractedSettings.suiteDripSettings;
              }
            }
            
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

  const handleAddAccess = (data: any) => {
    console.log('Adding access:', data);
    
    if (!selectedVariationId || !data.type || !data.bundleId) return;
    
    // Create a new template with the provided information
    const newTemplate: Template = {
      id: crypto.randomUUID(),
      type: data.type,
      name: data.type === 'content' 
        ? data.templateName || 'New Template'
        : data.categoryName || 'New AI Access',
      contentName: data.type === 'content' 
        ? data.contentName 
        : null,
      description: '',
      contentId: data.type === 'content' ? data.contentId || '' : null,
      
      // AI specific properties
      categoryId: data.type === 'ai' ? data.categoryId : null,
      categoryName: data.type === 'ai' ? data.categoryName : null,
      suiteId: data.type === 'ai' ? data.suiteId : null,
      suiteName: data.type === 'ai' ? data.suiteName : null,
      toolIds: data.type === 'ai' ? data.toolIds : null,
      
      // Drip settings
      ...(data.dripSettings?.collectionDrip && { collectionDripSettings: data.dripSettings.collectionDrip }),
      ...(data.dripSettings?.suiteDrip && { suiteDripSettings: data.dripSettings.suiteDrip }),
      ...(data.dripSettings?.toolDrip && { dripSettings: data.dripSettings.toolDrip })
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
  
  // Function to handle updates when an AI template is edited
  const handleAITemplateUpdate = (data: any) => {
    if (!data.type || !data.bundleId) return;
    
    console.log('Updating AI template with info:', data);
    
    // If there's an existing template being edited, update it
    if (editingTemplateId) {
      setSelectedVariationTemplates(currentTemplates => 
        currentTemplates.map(t => 
          t.id === editingTemplateId ? {
            ...t,
            categoryId: data.categoryId,
            categoryName: data.categoryName,
            suiteId: data.suiteId,
            suiteName: data.suiteName,
            toolIds: data.toolIds || [],
            // Include drip settings if present
            ...(data.dripSettings?.collectionDrip && { collectionDripSettings: data.dripSettings.collectionDrip }),
            ...(data.dripSettings?.suiteDrip && { suiteDripSettings: data.dripSettings.suiteDrip }),
            ...(data.dripSettings?.toolDrip && { dripSettings: data.dripSettings.toolDrip })
          } : t
        )
      );
      
      // Also update the template in the variations state
      setVariations(prev => prev.map(variation => {
        if (variation.id === selectedVariationId) {
          return {
            ...variation,
            templates: variation.templates?.map(t => 
              t.id === editingTemplateId ? {
                ...t,
                categoryId: data.categoryId,
                categoryName: data.categoryName,
                suiteId: data.suiteId,
                suiteName: data.suiteName,
                toolIds: data.toolIds || [],
                // Include drip settings if present
                ...(data.dripSettings?.collectionDrip && { collectionDripSettings: data.dripSettings.collectionDrip }),
                ...(data.dripSettings?.suiteDrip && { suiteDripSettings: data.dripSettings.suiteDrip }),
                ...(data.dripSettings?.toolDrip && { dripSettings: data.dripSettings.toolDrip })
              } : t
            )
          };
        }
        return variation;
      }));
      
      setEditingTemplateId(null);
      setExpandedTemplateId(null);
      toast.success("Template updated successfully");
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
              templates: prepareTemplatesForSaving(selectedVariationTemplates)
            };
          }
          // For other variations, use their existing templates
          return {
            id: variation.id,
            name: variation.name,
            templates: variation.templates ? prepareTemplatesForSaving(variation.templates) : []
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
      }
    } catch (err) {
      console.error('Failed to save bundle:', err);
      toast.error("An error occurred while saving");
    } finally {
      setIsSaving(false);
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
            <BundleHeader 
              bundleName={bundleName}
              setBundleName={setBundleName}
              bundleDescription={bundleDescription}
              setBundleDescription={setBundleDescription}
              handleSaveBundle={handleSaveBundle}
              isSaving={isSaving}
              onClose={onClose}
            />

            {/* Divider */}
            <div className="h-px bg-[var(--border-color)] w-full mb-4" />

            {/* Variations Section */}
            <VariationsList 
              variations={variations}
              selectedVariationId={selectedVariationId}
              isAddingVariation={isAddingVariation}
              newVariationName={newVariationName}
              setNewVariationName={setNewVariationName}
              handleAddVariation={handleAddVariation}
              handleVariationClick={handleVariationClick}
              handleVariationDoubleClick={handleVariationDoubleClick}
              editingVariationId={editingVariationId}
              editingName={editingName}
              setEditingName={setEditingName}
              handleEditSave={handleEditSave}
              handleKeyPress={handleKeyPress}
              removeVariation={removeVariation}
            />

            {/* Templates Section */}
            <TemplateList 
              selectedVariationId={selectedVariationId}
              selectedVariationTemplates={selectedVariationTemplates}
              isLoadingTemplates={isLoadingTemplates}
              showAddAccess={showAddAccess}
              setShowAddAccess={setShowAddAccess}
              bundleId={bundleId}
              handleAddAccess={handleAddAccess}
              expandedTemplateId={expandedTemplateId}
              handleTemplateExpand={handleTemplateExpand}
              editingTemplateId={editingTemplateId}
              handleAITemplateUpdate={handleAITemplateUpdate}
              handleDeleteTemplate={handleDeleteTemplate}
            />
          </div>
        </div>
      </div>
    </div>
  )
} 
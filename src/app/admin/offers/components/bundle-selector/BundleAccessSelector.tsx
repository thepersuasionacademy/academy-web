import { useState } from 'react';
import { Package, FileText } from 'lucide-react';
import { cn } from "@/lib/utils";
import { AccessType, ContentItem, ContentTemplate } from './types';
import { AccessTypeSelector } from './AccessTypeSelector';
import { ContentSelector } from './ContentSelector';
import { AISelector } from './AISelector';

interface BundleAccessSelectorProps {
  bundleId: string | null;
  onSave: (data: any) => void;
  onCancel: () => void;
  initialData?: {
    type?: AccessType;
    categoryId?: string;
    categoryName?: string;
    suiteId?: string;
    suiteName?: string;
    toolIds?: string[];
    contentId?: string;
    contentName?: string;
    templateId?: string;
    templateName?: string;
    collectionDripSettings?: { value: number; unit: 'days' | 'weeks' | 'months' };
    suiteDripSettings?: { value: number; unit: 'days' | 'weeks' | 'months' };
    toolDripSettings?: Record<string, { value: number; unit: 'days' | 'weeks' | 'months' }>;
  };
}

export function BundleAccessSelector({ bundleId, onSave, onCancel, initialData }: BundleAccessSelectorProps) {
  // Access type state
  const [accessType, setAccessType] = useState<AccessType>(initialData?.type || null);
  
  // AI selection state
  const [aiSelectionComplete, setAiSelectionComplete] = useState(false);
  const [aiSelectionData, setAiSelectionData] = useState<any>(null);
  
  // Content selection state
  const [contentSelectionComplete, setContentSelectionComplete] = useState(false);
  const [contentSelectionData, setContentSelectionData] = useState<{
    contentId?: string;
    contentName?: string;
    templateId?: string;
    templateName?: string;
  }>(initialData ? {
    contentId: initialData.contentId,
    contentName: initialData.contentName,
    templateId: initialData.templateId,
    templateName: initialData.templateName
  } : {});

  // Handle access type selection
  const handleAccessTypeSelect = (type: AccessType) => {
    setAccessType(type);
    
    // Reset selection data when type changes
    if (type !== 'ai') {
      setAiSelectionComplete(false);
      setAiSelectionData(null);
    }
    
    if (type !== 'content') {
      setContentSelectionComplete(false);
      setContentSelectionData({});
    }
  };

  // Handle AI selection completion
  const handleAISelectionComplete = (data: any) => {
    setAiSelectionData(data);
    setAiSelectionComplete(true);
    
    // Save the bundle access
    const saveData = {
      bundleId,
      type: 'ai',
      ...data
    };
    
    onSave(saveData);
  };

  // Handle content selection completion
  const handleContentSelectionComplete = (data: any) => {
    setContentSelectionData(data);
    setContentSelectionComplete(true);
    
    // Save the bundle access
    const saveData = {
      bundleId,
      type: 'content',
      ...data
    };
    
    onSave(saveData);
  };

  return (
    <div className="w-full max-w-4xl mx-auto py-6 space-y-8">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Select Bundle Access</h2>
        <p className="text-[var(--text-secondary)]">
          Choose the type of access to grant with this bundle
        </p>
      </div>
      
      {/* Access Type Selection */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Access Type</h3>
        <AccessTypeSelector 
          selectedType={accessType}
          onTypeSelect={handleAccessTypeSelect}
        />
      </div>
      
      {/* Content for AI Selection */}
      {accessType === 'ai' && !aiSelectionComplete && (
        <div className="space-y-4 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <Package className="w-5 h-5 text-[var(--accent)]" />
            <h3 className="text-lg font-medium">AI Access</h3>
          </div>
          
          <AISelector 
            onComplete={handleAISelectionComplete}
            initialData={initialData}
          />
        </div>
      )}
      
      {/* Content for Content Selection */}
      {accessType === 'content' && !contentSelectionComplete && (
        <div className="space-y-4 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-[var(--accent)]" />
            <h3 className="text-lg font-medium">Content Access</h3>
          </div>
          
          <ContentSelector 
            onItemSelect={(item: ContentItem) => {
              setContentSelectionData(prev => ({
                ...prev,
                contentId: item.id,
                contentName: item.title || 'Unnamed Content'
              }));
            }}
            onTemplateSelect={(template: ContentTemplate) => {
              const data = {
                contentId: contentSelectionData?.contentId,
                contentName: contentSelectionData?.contentName,
                templateId: template.id,
                templateName: template.template || 'Default Template'
              };
              handleContentSelectionComplete(data);
            }}
            selectedItem={contentSelectionData?.contentId}
            selectedTemplate={contentSelectionData?.templateId}
          />
        </div>
      )}
      
      {/* Bottom Actions */}
      <div className="flex justify-end gap-3 pt-4">
        <button 
          onClick={onCancel}
          className="px-4 py-2 rounded-lg border border-[var(--border-color)] hover:bg-[var(--hover-bg)] transition-colors"
        >
          Cancel
        </button>
        
        {/* Only show back button if a selection is in progress */}
        {(accessType === 'ai' && !aiSelectionComplete) || (accessType === 'content' && !contentSelectionComplete) ? (
          <button 
            onClick={() => setAccessType(null)}
            className="px-4 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--hover-bg)] hover:bg-[var(--hover-bg)]/80 transition-colors"
          >
            Back to Type Selection
          </button>
        ) : null}
      </div>
    </div>
  );
} 
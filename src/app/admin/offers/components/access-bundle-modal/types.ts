export interface Template {
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
  // Drip settings
  access_overrides?: {
    media?: Record<string, {
      delay?: {
        unit: string;
        value: number;
      };
      status: string;
    }>;
  };
  // Simplified drip settings structure for BundleAccessSelector
  dripSettings?: Record<string, {
    unit: 'days' | 'weeks' | 'months';
    value: number;
  }>;
  // Collection and Suite level drip settings
  collectionDripSettings?: {
    unit: 'days' | 'weeks' | 'months';
    value: number;
  };
  suiteDripSettings?: {
    unit: 'days' | 'weeks' | 'months';
    value: number;
  };
}

export interface Variation {
  id: string;
  name: string;
  templates?: Template[];
}

export interface AccessBundleModalProps {
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

export interface BundleHeaderProps {
  bundleName: string;
  setBundleName: (name: string) => void;
  bundleDescription: string;
  setBundleDescription: (description: string) => void;
  handleSaveBundle: () => void;
  isSaving: boolean;
  onClose: () => void;
}

export interface VariationsListProps {
  variations: Variation[];
  selectedVariationId: string | null;
  isAddingVariation: boolean;
  newVariationName: string;
  setNewVariationName: (name: string) => void;
  handleAddVariation: () => void;
  handleVariationClick: (variation: Variation) => void;
  handleVariationDoubleClick: (variation: Variation) => void;
  editingVariationId: string | null;
  editingName: string;
  setEditingName: (name: string) => void;
  handleEditSave: (id: string) => void;
  handleKeyPress: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  removeVariation: (id: string) => void;
}

export interface TemplateListProps {
  selectedVariationId: string | null;
  selectedVariationTemplates: Template[];
  isLoadingTemplates: boolean;
  showAddAccess: boolean;
  setShowAddAccess: (show: boolean) => void;
  bundleId: string | null;
  handleAddAccess: (data: any) => void;
  expandedTemplateId: string | null;
  handleTemplateExpand: (template: Template) => void;
  editingTemplateId: string | null;
  handleAITemplateUpdate: (data: any) => void;
  handleDeleteTemplate: (template: Template) => void;
}

export interface TemplateItemProps {
  template: Template;
  isExpanded: boolean;
  onExpand: (template: Template) => void;
  onDelete: (template: Template) => void;
  renderTemplateTitle: (template: Template) => React.ReactNode;
}

export interface TemplateContentProps {
  template: Template;
  bundleId: string | null;
  editingTemplateId: string | null;
  handleAITemplateUpdate: (data: any) => void;
  setEditingTemplateId: (id: string | null) => void;
  setExpandedTemplateId: (id: string | null) => void;
} 
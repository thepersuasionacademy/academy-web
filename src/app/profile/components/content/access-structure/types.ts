export interface StructureNode {
  id: string;
  name: string;
  type: 'collection' | 'content' | 'module' | 'media' | 'bundle';
  children?: StructureNode[];
  accessDelay?: {
    value: number;
    unit: 'days' | 'weeks' | 'months';
  };
  hasAccess: boolean;
  order: number;
  mediaType?: string;
  isHidden?: boolean;
}

export type AccessMethod = 'instant' | 'drip';

export interface AccessStructureViewProps {
  selectedType: 'bundle' | 'collection' | 'content';
  selectedId: string;
  targetUserId?: string;
  onAccessGranted?: () => void;
  onRefreshContentHistory?: () => void;
  isAdmin?: boolean;
  isSuperAdmin?: boolean;
}

export interface TimeUnitDropdownProps {
  value: 'days' | 'weeks' | 'months';
  onChange: (value: 'days' | 'weeks' | 'months') => void;
  inputValue?: number;
  disabled?: boolean;
}

export interface TransformedNode {
  id: string;
  type: string;
  hasAccess: boolean;
  accessDelay?: {
    value: number;
    unit: 'days' | 'weeks' | 'months';
  };
  mediaType?: string;
  children: TransformedNode[];
}

export interface AccessNode {
  id: string;
  name: string;
  type: 'content' | 'module' | 'media';
  has_access: boolean;
  order?: number;
  access_delay?: {
    value: number;
    unit: string;
  };
  children?: AccessNode[];
  mediaType?: string;
  debug_info?: {
    access_starts_at: string | null;
    access_overrides: Record<string, any>;
  };
} 
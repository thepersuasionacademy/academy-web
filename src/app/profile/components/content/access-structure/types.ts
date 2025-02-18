export interface StructureNode {
  id: string;
  name: string;
  type: 'collection' | 'content' | 'module' | 'media' | 'bundle';
  children?: StructureNode[];
  accessDelay?: {
    value: number;
    unit: 'days' | 'weeks' | 'months';
  };
  hasAccess?: boolean;
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
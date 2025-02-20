import { Eye, EyeOff, Plus, X, Lock } from 'lucide-react';
import { cn } from "@/lib/utils";
import { TimeUnitDropdown } from './TimeUnitDropdown';
import { StructureNode, AccessMethod } from './types';
import { useRef, useEffect, useState } from 'react';

interface AccessControlsProps {
  node: StructureNode;
  isEditMode: boolean;
  accessMethod: AccessMethod;
  structure: StructureNode | null;
  onUpdateNodeAccessDelay: (nodeId: string, value: number, unit: 'days' | 'weeks' | 'months') => void;
  onRemoveDrip: (node: StructureNode) => void;
  onToggleAccess: () => void;
}

interface AccessOverride {
  status: 'locked' | 'pending';
  delay?: {
    value: number;
    unit: 'days' | 'weeks' | 'months';
  };
}

interface AccessOverrides {
  modules?: Record<string, AccessOverride>;
  media?: Record<string, AccessOverride>;
}

export function AccessControls({ 
  node, 
  isEditMode, 
  accessMethod, 
  structure,
  onUpdateNodeAccessDelay,
  onRemoveDrip,
  onToggleAccess
}: AccessControlsProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const shouldFocusRef = useRef(false);
  const [inputValue, setInputValue] = useState(node.accessDelay?.value?.toString() || '');

  useEffect(() => {
    if (shouldFocusRef.current && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
      shouldFocusRef.current = false;
    }
  }, [node.accessDelay]);

  useEffect(() => {
    setInputValue(node.accessDelay?.value?.toString() || '');
  }, [node.accessDelay?.value]);

  if (!isEditMode || (node.type === 'media' && node.mediaType)) {
    return null;
  }

  // For content level, show nothing - no controls at all
  if (node.type === 'content') {
    return null;
  }

  // Base controls for toggling access (only for modules and media)
  const baseControls = (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onToggleAccess();
      }}
      className={cn(
        "p-1 hover:bg-[var(--muted)] rounded-full transition-colors",
        node.hasAccess === false && "bg-red-500/10"
      )}
      title={node.hasAccess === false ? "Enable access" : "Disable access"}
    >
      {node.hasAccess === false ? (
        <EyeOff className="w-4 h-4 text-red-500" />
      ) : (
        <Eye className="w-4 h-4 text-[var(--muted-foreground)] hover:text-[var(--foreground)]" />
      )}
    </button>
  );

  const findParentWithDrip = (targetNode: StructureNode, tree: StructureNode | null): boolean => {
    if (!tree || !tree.children) return false;

    for (const child of tree.children) {
      if (child.id === targetNode.id) {
        return child.type === 'module' || child.type === 'media' ? false : true;
      }
      if (child.children) {
        const found = findParentWithDrip(targetNode, child);
        if (found) return true;
      }
    }
    return false;
  };

  const findParentModule = (targetNode: StructureNode, tree: StructureNode | null): StructureNode | null => {
    if (!tree || !tree.children) return null;

    for (const child of tree.children) {
      if (child.type === 'module') {
        if (child.children?.some(mediaGroup => mediaGroup.id === targetNode.id)) {
          return child;
        }
      }
      const found = findParentModule(targetNode, child);
      if (found) return found;
    }
    return null;
  };

  const hasAncestorWithDrip = findParentWithDrip(node, structure);
  const hasDripSettings = node.accessDelay !== undefined;
  const parentModule = node.type === 'media' && node.children ? findParentModule(node, structure) : null;
  const hasParentModuleWithDrip = parentModule?.accessDelay !== undefined;

  if (node.type === 'media' && node.children && hasParentModuleWithDrip) {
    return (
      <div className="flex items-center gap-2 ml-auto">
        <Lock className="w-4 h-4 text-[var(--muted-foreground)]/40" />
      </div>
    );
  }

  if (hasAncestorWithDrip && node.type !== 'module') {
    return (
      <div className="flex items-center gap-2 ml-auto">
        <Lock className="w-4 h-4 text-[var(--muted-foreground)]/40" />
      </div>
    );
  }

  const handleAddDrip = (e: React.MouseEvent) => {
    e.stopPropagation();
    shouldFocusRef.current = true;
    // Just set the delay unit without a value
    onUpdateNodeAccessDelay(node.id, undefined as any, 'days');
    setInputValue('');
  };

  if (accessMethod === 'drip' && hasDripSettings) {
    return (
      <div className="flex items-center gap-2 ml-auto" onClick={(e) => e.stopPropagation()}>
        <input
          ref={inputRef}
          type="number"
          value={inputValue}
          onChange={(e) => {
            const value = e.target.value;
            setInputValue(value);
            
            // Only update the node if we have a valid number
            const numValue = parseInt(value);
            if (!isNaN(numValue)) {
              onUpdateNodeAccessDelay(
                node.id, 
                numValue,
                node.accessDelay?.unit || 'days'
              );
            }
          }}
          onBlur={(e) => {
            const value = e.target.value;
            const numValue = parseInt(value);
            
            // On blur, enforce min/max values
            if (isNaN(numValue) || numValue < 1) {
              onUpdateNodeAccessDelay(node.id, 1, node.accessDelay?.unit || 'days');
            } else if (numValue > 99) {
              onUpdateNodeAccessDelay(node.id, 99, node.accessDelay?.unit || 'days');
            }
          }}
          onFocus={(e) => e.target.select()}
          className={cn(
            "w-8 text-base text-right bg-transparent focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
            inputValue === '' || isNaN(parseInt(inputValue)) ? "text-red-500" : "text-[var(--foreground)]"
          )}
        />
        <TimeUnitDropdown
          value={node.accessDelay?.unit || 'days'}
          onChange={(unit) => {
            const numValue = parseInt(inputValue);
            onUpdateNodeAccessDelay(
              node.id, 
              isNaN(numValue) ? 1 : numValue,
              unit
            );
          }}
          inputValue={parseInt(inputValue) || 0}
        />
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemoveDrip(node);
          }}
          className="p-1 hover:bg-[var(--muted)] rounded-full transition-colors"
        >
          <X className="w-4 h-4 text-[var(--muted-foreground)] hover:text-[var(--foreground)]" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 ml-auto">
      {accessMethod === 'drip' && (
        <button
          onClick={handleAddDrip}
          className="p-1 hover:bg-[var(--muted)] rounded-full transition-colors"
        >
          <Plus className="w-4 h-4 text-[var(--muted-foreground)] hover:text-[var(--foreground)]" />
        </button>
      )}
      {baseControls}
    </div>
  );
} 
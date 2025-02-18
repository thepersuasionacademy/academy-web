import { Eye, EyeOff, Plus, X, Lock } from 'lucide-react';
import { cn } from "@/lib/utils";
import { TimeUnitDropdown } from './TimeUnitDropdown';
import { StructureNode, AccessMethod } from './types';

interface AccessControlsProps {
  node: StructureNode;
  isEditMode: boolean;
  accessMethod: AccessMethod;
  structure: StructureNode | null;
  onUpdateNodeAccessDelay: (nodeId: string, value: number, unit: 'days' | 'weeks' | 'months') => void;
  onRemoveDrip: (node: StructureNode) => void;
  onToggleAccess: () => void;
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
  if (!isEditMode || (node.type === 'media' && node.mediaType)) {
    return null;
  }

  // Content level nodes should show access controls
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

  // For content level, only show base controls
  if (node.type === 'content') {
    return (
      <div className="flex items-center gap-2 ml-auto">
        {baseControls}
      </div>
    );
  }

  const findParentWithDrip = (targetNode: StructureNode, tree: StructureNode | null): boolean => {
    if (!tree) return false;

    const findParentRecursive = (parent: StructureNode, targetId: string): boolean => {
      if (parent.id === targetId) return false;
      
      if (parent.children) {
        for (const child of parent.children) {
          if (child.id === targetId) {
            return parent.accessDelay !== undefined;
          }
          if (findParentRecursive(child, targetId)) {
            return true;
          }
        }
      }
      return false;
    };

    return findParentRecursive(tree, targetNode.id);
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

  const handleAddDrip = () => {
    onUpdateNodeAccessDelay(node.id, 0, 'days');
  };

  if (accessMethod === 'drip' && hasDripSettings) {
    return (
      <div className="flex items-center gap-2 ml-auto">
        <input
          type="number"
          min="1"
          max="99"
          value={node.accessDelay?.value || ''}
          onChange={(e) => {
            const value = e.target.value;
            onUpdateNodeAccessDelay(
              node.id, 
              value === '' ? 0 : Math.max(0, Math.min(99, parseInt(value) || 0)), 
              node.accessDelay?.unit || 'days'
            );
          }}
          className="w-8 text-base text-right bg-transparent text-[var(--foreground)] focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
        <TimeUnitDropdown
          value={node.accessDelay?.unit || 'days'}
          onChange={(unit) => onUpdateNodeAccessDelay(node.id, node.accessDelay?.value || 0, unit)}
          inputValue={node.accessDelay?.value || 0}
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
          onClick={(e) => {
            e.stopPropagation();
            handleAddDrip();
          }}
          className="p-1 hover:bg-[var(--muted)] rounded-full transition-colors"
        >
          <Plus className="w-4 h-4 text-[var(--muted-foreground)] hover:text-[var(--foreground)]" />
        </button>
      )}
      {baseControls}
    </div>
  );
} 
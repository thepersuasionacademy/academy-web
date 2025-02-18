import { ChevronDown } from 'lucide-react';
import { cn } from "@/lib/utils";
import { StructureNode as StructureNodeType, AccessMethod } from './types';
import { NodeTypeIcon } from './NodeTypeIcon';
import { AccessControls } from './AccessControls';

interface StructureNodeProps {
  node: StructureNodeType;
  level: number;
  hasAncestorWithNoAccess: boolean;
  isEditMode: boolean;
  accessMethod: AccessMethod;
  structure: StructureNodeType | null;
  isNewAccess: boolean;
  loadingNodes: Set<string>;
  expandedNodes: Set<string>;
  selectedNode: string | null;
  onNodeClick: (node: StructureNodeType) => void;
  onNodeSelect: (nodeId: string | null) => void;
  onToggleExpansion: (nodeId: string) => void;
  onUpdateNodeAccessDelay: (nodeId: string, value: number, unit: 'days' | 'weeks' | 'months') => void;
  onRemoveDrip: (node: StructureNodeType) => void;
  onToggleAccess: (node: StructureNodeType) => void;
}

export function StructureNode({
  node,
  level,
  hasAncestorWithNoAccess,
  isEditMode,
  accessMethod,
  structure,
  isNewAccess,
  loadingNodes,
  expandedNodes,
  selectedNode,
  onNodeClick,
  onNodeSelect,
  onToggleExpansion,
  onUpdateNodeAccessDelay,
  onRemoveDrip,
  onToggleAccess
}: StructureNodeProps) {
  // For new access, show everything in edit mode
  if (isNewAccess) {
    hasAncestorWithNoAccess = false;
  } 
  // For existing access, apply normal visibility rules
  else if (!isEditMode && (node.isHidden || node.hasAccess === false || hasAncestorWithNoAccess)) {
    return null;
  }

  const isLoading = loadingNodes?.has(node.id);
  const isSelected = selectedNode === node.id;
  const hasNoAccess = !isNewAccess && (hasAncestorWithNoAccess || node.hasAccess === false);
  const isExpanded = expandedNodes.has(node.id);
  const hasChildren = node.children && node.children.length > 0;
  const isMediaGroup = node.type === 'media' && hasChildren;

  const getAccessStatusColor = (node: StructureNodeType, isNodeInEditMode: boolean = false) => {
    // First check for no access
    if (node.hasAccess === false) return 'bg-red-500';

    // Check for drip delay
    const hasNodeOrDescendantsWithDelay = (checkNode: StructureNodeType): boolean => {
      const delayValue = checkNode.accessDelay?.value;
      if (delayValue !== undefined && delayValue > 0) {
        return true;
      }
      
      if (checkNode.children) {
        return checkNode.children.some(child => hasNodeOrDescendantsWithDelay(child));
      }
      
      return false;
    };

    const hasDelay = hasNodeOrDescendantsWithDelay(node);
    
    // If in drip mode and has delay, show as blue (pending)
    if (accessMethod === 'drip' && hasDelay) {
      return 'bg-blue-500';
    }

    // Otherwise show as having access
    return 'bg-green-500';
  };

  return (
    <div className={cn(
      "relative",
      level > 0 && "ml-8 pl-4"
    )}>
      {level > 0 && (
        <div className="absolute left-0 top-0 bottom-0 w-px bg-[var(--border-color)]" />
      )}

      <div
        onClick={() => {
          if (isMediaGroup) {
            onToggleExpansion(node.id);
          } else {
            onNodeClick(node);
            onNodeSelect(isSelected ? null : node.id);
          }
        }}
        className={cn(
          "group relative flex items-center py-3 px-4 border border-[var(--border-color)] rounded-lg",
          "bg-[var(--background)] transition-colors",
          level === 0 && "shadow-sm mb-4",
          hasNoAccess && "dark:bg-[var(--muted)]/30 bg-[var(--muted)]",
          isMediaGroup && "cursor-pointer hover:bg-[var(--muted)]/50"
        )}
      >
        {level > 0 && (
          <div className="absolute left-0 top-1/2 w-4 h-px -translate-y-px bg-[var(--border-color)] -translate-x-4" />
        )}
        
        {hasNoAccess && (
          <div className="absolute inset-0 rounded-lg pointer-events-none dark:bg-black/30 bg-gray-100/50" />
        )}

        <div className={cn(
          "absolute left-0 top-0 bottom-0 w-1 rounded-l-lg",
          getAccessStatusColor(node, isEditMode)
        )} />
        
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {isMediaGroup && (
            <ChevronDown className={cn(
              "w-4 h-4 text-[var(--muted-foreground)] transition-transform",
              !isExpanded && "-rotate-90"
            )} />
          )}
          {node.type === 'media' && (
            <div className="shrink-0">
              <NodeTypeIcon mediaType={node.mediaType} hasNoAccess={hasNoAccess} />
            </div>
          )}
          <div className="flex flex-col">
            <span className={cn(
              "transition-colors truncate",
              level === 0 
                ? "text-2xl font-semibold" 
                : "text-lg",
              "text-[var(--foreground)]",
              hasNoAccess && "dark:text-[var(--muted-foreground)]/70 text-[var(--muted-foreground)]"
            )}>{node.name}</span>
            {accessMethod === 'drip' && node.accessDelay && node.accessDelay.value > 0 && (
              <span className="text-sm text-blue-500">
                Available in {node.accessDelay.value} {node.accessDelay.unit}
              </span>
            )}
          </div>
          <AccessControls
            node={node}
            isEditMode={isEditMode}
            accessMethod={accessMethod}
            structure={structure}
            onUpdateNodeAccessDelay={onUpdateNodeAccessDelay}
            onRemoveDrip={onRemoveDrip}
            onToggleAccess={() => onToggleAccess(node)}
          />
        </div>
      </div>

      {hasChildren && (!isMediaGroup || isExpanded) && (
        <div className={cn(
          "relative",
          level === 0 ? "mt-4" : "mt-3"
        )}>
          {node.children
            ?.sort((a: StructureNodeType, b: StructureNodeType) => a.order - b.order)
            .filter(child => isNewAccess || isEditMode || (!child.isHidden && child.hasAccess !== false))
            .map((child, index) => (
              <div key={child.id} className={cn(
                "relative",
                index > 0 && "mt-3"
              )}>
                <StructureNode
                  node={child}
                  level={level + 1}
                  hasAncestorWithNoAccess={hasNoAccess}
                  isEditMode={isEditMode}
                  accessMethod={accessMethod}
                  structure={structure}
                  isNewAccess={isNewAccess}
                  loadingNodes={loadingNodes}
                  expandedNodes={expandedNodes}
                  selectedNode={selectedNode}
                  onNodeClick={onNodeClick}
                  onNodeSelect={onNodeSelect}
                  onToggleExpansion={onToggleExpansion}
                  onUpdateNodeAccessDelay={onUpdateNodeAccessDelay}
                  onRemoveDrip={onRemoveDrip}
                  onToggleAccess={onToggleAccess}
                />
              </div>
            ))}
        </div>
      )}
    </div>
  );
} 
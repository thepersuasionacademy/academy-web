import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Loader2, AlertCircle, Clock, Pencil, ChevronDown } from 'lucide-react';
import { cn } from "@/lib/utils";
import { AccessNode } from './types';
import { NodeTypeIcon } from './NodeTypeIcon';
import { AccessStructureEditor } from './AccessStructureEditor';

interface AccessStructureViewProps {
  selectedType: 'bundle' | 'collection' | 'content';
  selectedId: string;
  targetUserId?: string;
  isAdmin?: boolean;
  isSuperAdmin?: boolean;
}

export function AccessStructureView({ 
  selectedType, 
  selectedId, 
  targetUserId,
  isAdmin = false,
  isSuperAdmin = false
}: AccessStructureViewProps) {
  const [structure, setStructure] = useState<AccessNode | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [isEditMode, setIsEditMode] = useState(false);
  const supabase = createClientComponentClient();

  useEffect(() => {
    async function fetchStructure() {
      try {
        setIsLoading(true);
        setError(null);

        const { data, error } = await supabase
          .rpc('get_content_access_structure', {
            p_content_id: selectedId,
            p_user_id: targetUserId
          });

        if (error) throw error;

        setStructure(data);
      } catch (err) {
        console.error('Error fetching access structure:', err);
        setError('Failed to load access structure');
      } finally {
        setIsLoading(false);
      }
    }

    if (selectedId && selectedType === 'content') {
      fetchStructure();
    }
  }, [selectedId, selectedType, targetUserId, supabase]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="flex items-center gap-2 text-[var(--text-secondary)]">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px] gap-4">
        <AlertCircle className="w-8 h-8 text-[var(--text-secondary)]" />
        <div className="text-center text-[var(--text-secondary)]">
          <p className="font-medium mb-2">{error}</p>
          <p className="text-sm">Please try again later.</p>
        </div>
      </div>
    );
  }

  if (!structure) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px] gap-4">
        <AlertCircle className="w-8 h-8 text-[var(--text-secondary)]" />
        <div className="text-center text-[var(--text-secondary)]">
          <p className="font-medium mb-2">No access structure available</p>
          <p className="text-sm">This content has no access structure defined.</p>
        </div>
      </div>
    );
  }

  const renderNode = (node: AccessNode, level: number = 0) => {
    const getAccessStatusColor = () => {
      // Content level uses foreground color
      if (node.type === 'content') return 'bg-[var(--foreground)]';

      // Check for drip delay first - this indicates a pending state
      if (node.access_delay?.value) return 'bg-blue-500';

      // Then check for explicit locked status
      if (!node.has_access) return 'bg-red-500';

      // Otherwise show as having access
      return 'bg-green-500';
    };

    const isMediaGroup = node.type === 'media' && node.children && node.children.length > 0;
    const isExpanded = expandedNodes.has(node.id);

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
              setExpandedNodes(prev => {
                const newSet = new Set(prev);
                if (newSet.has(node.id)) {
                  newSet.delete(node.id);
                } else {
                  newSet.add(node.id);
                }
                return newSet;
              });
            }
          }}
          className={cn(
            "group relative flex items-center py-3 px-4 rounded-lg",
            "bg-[var(--background)] transition-colors",
            level > 0 && "border border-[var(--border-color)]",
            level === 0 && "mb-4",
            !node.has_access && "dark:bg-[var(--muted)]/30 bg-[var(--muted)]",
            isMediaGroup && "cursor-pointer hover:bg-[var(--muted)]/50"
          )}
        >
          {level > 0 && (
            <div className="absolute left-0 top-1/2 w-4 h-px -translate-y-px bg-[var(--border-color)] -translate-x-4" />
          )}

          <div className={cn(
            "absolute left-0 top-0 bottom-0 w-1 rounded-l-lg",
            getAccessStatusColor()
          )} />

          <div className="flex items-center gap-3 flex-1 min-w-0">
            {node.type === 'media' && (
              <div className="shrink-0">
                <NodeTypeIcon mediaType={node.mediaType} hasNoAccess={!node.has_access} />
              </div>
            )}
            <div className="flex flex-col flex-1 min-w-0">
              <div className="flex items-center justify-between gap-4">
                <span className={cn(
                  "transition-colors truncate",
                  level === 0 ? "text-2xl font-semibold" : "text-lg",
                  "text-[var(--foreground)]",
                  !node.has_access && "dark:text-[var(--muted-foreground)]/70 text-[var(--muted-foreground)]"
                )}>{node.name}</span>
              </div>
              {node.access_delay?.value && (
                <div className="flex items-center gap-1 text-sm text-blue-500">
                  <Clock className="w-3 h-3" />
                  <span>Available in {node.access_delay.value} {node.access_delay.unit}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {node.children && node.children.length > 0 && (!isMediaGroup || isExpanded) && (
          <div className={cn(
            "relative",
            level === 0 ? "mt-4" : "mt-3"
          )}>
            {node.children
              .sort((a, b) => (a.order || 0) - (b.order || 0))
              .map((child, index) => (
                <div key={child.id} className={cn(
                  "relative",
                  index > 0 && "mt-3"
                )}>
                  {renderNode(child, level + 1)}
                </div>
              ))}
          </div>
        )}
      </div>
    );
  };

  if (isEditMode) {
    return (
      <AccessStructureEditor
        selectedType={selectedType}
        selectedId={selectedId}
        targetUserId={targetUserId}
        isAdmin={isAdmin}
        isSuperAdmin={isSuperAdmin}
        isNewAccess={false}
        onCancel={() => setIsEditMode(false)}
        initialStructure={structure}
      />
    );
  }

  return (
    <div className="p-8 rounded-xl border border-[var(--border-color)] bg-[var(--background)]">
      {(isAdmin || isSuperAdmin) && (
        <div className="flex justify-between items-center mb-8">
          <div /> {/* Empty div for flex spacing */}
          <button
            onClick={() => setIsEditMode(true)}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-lg transition-colors",
              "bg-[var(--accent)] text-white hover:opacity-90"
            )}
          >
            Edit
          </button>
        </div>
      )}
      <div className="relative">
        {renderNode(structure)}
      </div>
    </div>
  );
} 
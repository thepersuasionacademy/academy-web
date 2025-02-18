import { useState, useEffect, useRef } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Loader2, AlertCircle, Zap, Clock, ChevronDown, Check, Plus, Lock, Eye, EyeOff, X, Film, Book, Wrench, FileText, HelpCircle } from 'lucide-react';
import { cn } from "@/lib/utils";

interface StructureNode {
  id: string;
  name: string;
  type: 'collection' | 'content' | 'module' | 'media';
  children?: StructureNode[];
  accessDelay?: {
    value: number;
    unit: 'days' | 'weeks' | 'months';
  };
  hasAccess?: boolean;
  order: number;
  mediaType?: string;
}

interface AccessStructureViewProps {
  selectedType: 'collection' | 'content';
  selectedId: string;
}

type AccessMethod = 'instant' | 'drip';

interface TimeUnitDropdownProps {
  value: 'days' | 'weeks' | 'months';
  onChange: (value: 'days' | 'weeks' | 'months') => void;
  inputValue?: number;
}

function TimeUnitDropdown({ value, onChange, disabled, inputValue }: TimeUnitDropdownProps & { disabled?: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getSingularForm = (unit: string) => {
    return unit.endsWith('s') ? unit.slice(0, -1) : unit;
  };

  const options = [
    { value: 'days', label: 'days' },
    { value: 'weeks', label: 'weeks' },
    { value: 'months', label: 'months' }
  ];

  const displayValue = inputValue === 1 ? getSingularForm(value) : value;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-1 text-base transition-colors",
          disabled 
            ? "text-[var(--muted-foreground)]/40 cursor-not-allowed" 
            : "text-[var(--foreground)]"
        )}
      >
        <span>{displayValue}</span>
        <ChevronDown className={cn(
          "h-3 w-3",
          disabled 
            ? "opacity-40"
            : "text-[var(--muted-foreground)]"
        )} />
      </button>
      
      {!disabled && isOpen && (
        <div className="absolute right-0 z-10 mt-1 min-w-[100px] py-1 bg-[var(--background)] border border-[var(--border-color)] rounded-md shadow-lg">
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                onChange(option.value as 'days' | 'weeks' | 'months');
                setIsOpen(false);
              }}
              className="flex items-center gap-2 w-full px-3 py-1.5 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
            >
              <span className="w-4">
                {option.value === value && (
                  <Check className="h-3 w-3 text-[var(--accent)]" />
                )}
              </span>
              {inputValue === 1 ? getSingularForm(option.label) : option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function AccessStructureView({ selectedType, selectedId }: AccessStructureViewProps) {
  const [structure, setStructure] = useState<StructureNode | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accessMethod, setAccessMethod] = useState<AccessMethod>('instant');
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const supabase = createClientComponentClient();
  const [loadingNodes, setLoadingNodes] = useState<Set<string>>(new Set());
  const structureRef = useRef<HTMLDivElement>(null);

  // Add click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (structureRef.current && !structureRef.current.contains(event.target as Node)) {
        setSelectedNode(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNodeDetails = async (nodeId: string, nodeType: StructureNode['type']) => {
    try {
      if (nodeType === 'content') {
        const { data: streamingContent, error } = await supabase
          .rpc('get_streaming_content', {
            p_content_id: nodeId
          });

        if (error) throw error;

        // Transform streaming content data into StructureNode format
        const contentNode: StructureNode = {
          id: streamingContent.content.id,
          name: streamingContent.content.title,
          type: 'content',
          order: 0,
          children: streamingContent.modules?.map((module: any, index: number) => ({
            id: module.id,
            name: module.title,
            type: 'module' as const,
            order: module.order || index,
            children: module.media?.map((media: any, mediaIndex: number) => {
              const mediaItems = [];
              
              // Add video if exists
              if (media.video_id) {
                mediaItems.push({
                  id: `${media.id}-video`,
                  name: media.video_name || 'Video',
                  type: 'media' as const,
                  order: 0,
                  mediaType: 'video'
                });
              }

              // Add text content if exists
              if (media.content_text) {
                mediaItems.push({
                  id: `${media.id}-text`,
                  name: media.text_title || 'Text Content',
                  type: 'media' as const,
                  order: 1,
                  mediaType: 'text'
                });
              }

              // Add tool if exists
              if (media.tool) {
                mediaItems.push({
                  id: `${media.id}-tool`,
                  name: media.tool.title || 'AI Tool',
                  type: 'media' as const,
                  order: 2,
                  mediaType: 'tool'
                });
              }

              // Add PDF if exists
              if (media.pdf_url) {
                mediaItems.push({
                  id: `${media.id}-pdf`,
                  name: media.pdf_title || 'PDF',
                  type: 'media' as const,
                  order: 3,
                  mediaType: 'pdf'
                });
              }

              // Add quiz if exists
              if (media.quiz_data) {
                mediaItems.push({
                  id: `${media.id}-quiz`,
                  name: media.quiz_title || 'Quiz',
                  type: 'media' as const,
                  order: 4,
                  mediaType: 'quiz'
                });
              }

              return {
                id: media.id,
                name: media.title,
                type: 'media' as const,
                order: mediaIndex,
                children: mediaItems
              };
            })
          }))
        };

        return contentNode;
      } else if (nodeType === 'collection') {
        // First get the collection details
        const { data: collection, error: collectionError } = await supabase
          .from('collections')
          .select('id, name')
          .eq('id', nodeId)
          .single();

        if (collectionError) throw collectionError;

        // Then get all content for this collection
        const { data: content, error: contentError } = await supabase
          .from('content')
          .select('id, title')
          .eq('collection_id', nodeId)
          .order('title');

        if (contentError) throw contentError;

        // Get streaming content for each content item
        const contentNodes = await Promise.all(content.map(async (item, index) => {
          const { data: streamingContent, error: streamingError } = await supabase
            .rpc('get_streaming_content', {
              p_content_id: item.id
            });

          if (streamingError) {
            console.error('Error fetching streaming content:', streamingError);
            return {
              id: item.id,
              name: item.title,
              type: 'content' as const,
              order: index,
              children: []
            } as StructureNode;
          }

          // Use streaming content data
          return {
            id: streamingContent.content.id,
            name: streamingContent.content.title,
            type: 'content' as const,
            order: index,
            children: streamingContent.modules?.map((module: any, moduleIndex: number) => ({
              id: module.id,
              name: module.title,
              type: 'module' as const,
              order: module.order || moduleIndex,
              children: module.media?.map((media: any, mediaIndex: number) => {
                const mediaItems = [];
                
                // Add video if exists
                if (media.video_id) {
                  mediaItems.push({
                    id: `${media.id}-video`,
                    name: media.video_name || 'Video',
                    type: 'media' as const,
                    order: 0,
                    mediaType: 'video'
                  });
                }

                // Add text content if exists
                if (media.content_text) {
                  mediaItems.push({
                    id: `${media.id}-text`,
                    name: media.text_title || 'Text Content',
                    type: 'media' as const,
                    order: 1,
                    mediaType: 'text'
                  });
                }

                // Add tool if exists
                if (media.tool) {
                  mediaItems.push({
                    id: `${media.id}-tool`,
                    name: media.tool.title || 'AI Tool',
                    type: 'media' as const,
                    order: 2,
                    mediaType: 'tool'
                  });
                }

                // Add PDF if exists
                if (media.pdf_url) {
                  mediaItems.push({
                    id: `${media.id}-pdf`,
                    name: media.pdf_title || 'PDF',
                    type: 'media' as const,
                    order: 3,
                    mediaType: 'pdf'
                  });
                }

                // Add quiz if exists
                if (media.quiz_data) {
                  mediaItems.push({
                    id: `${media.id}-quiz`,
                    name: media.quiz_title || 'Quiz',
                    type: 'media' as const,
                    order: 4,
                    mediaType: 'quiz'
                  });
                }

                return {
                  id: media.id,
                  name: media.title,
                  type: 'media' as const,
                  order: mediaIndex,
                  children: mediaItems
                };
              })
            }))
          } as StructureNode;
        }));

        const collectionNode: StructureNode = {
          id: collection.id,
          name: collection.name,
          type: 'collection',
          order: 0,
          children: contentNodes
        };

        return collectionNode;
      }
      return null;
    } catch (error) {
      console.error('Error fetching node details:', error);
      setError(error instanceof Error ? error.message : 'Failed to load structure');
      return null;
    }
  };

  useEffect(() => {
    async function fetchStructure() {
      setIsLoading(true);
      setError(null);
      try {
        if (!selectedId) {
          setIsLoading(false);
          return;
        }

        const rootNode = await fetchNodeDetails(selectedId, selectedType);
        if (rootNode) {
          setStructure(rootNode);
        }
      } catch (error) {
        console.error('Error fetching structure:', error);
        setError('Failed to load content structure');
      } finally {
        setIsLoading(false);
      }
    }

    fetchStructure();
  }, [selectedId, selectedType]);

  const handleNodeClick = async (node: StructureNode) => {
    if (!node.children) {
      setLoadingNodes(prev => new Set(prev).add(node.id));
      await fetchNodeDetails(node.id, node.type);
      setLoadingNodes(prev => {
        const newSet = new Set(prev);
        newSet.delete(node.id);
        return newSet;
      });
    }
  };

  const getNodeEmoji = (type: StructureNode['type']) => {
    switch (type) {
      case 'collection':
        return '📚';
      case 'content':
        return '📖';
      case 'module':
        return '📑';
      case 'media':
        return '🎬';
      default:
        return '📄';
    }
  };

  const handleGrantAccess = async () => {
    try {
      if (!structure) return;

      // Get the authenticated user's ID
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error('No authenticated user found');

      // Get all nodes with their access delays
      const getNodesWithDelays = (node: StructureNode): { id: string; type: string; delay?: { value: number; unit: string } }[] => {
        // Skip media items with suffixes (like -video, -text, etc.)
        if (node.type === 'media' && node.id.includes('-')) {
          return [];
        }

        const nodes: { id: string; type: string; delay?: { value: number; unit: string } }[] = [{
          id: node.id,
          type: node.type,
          delay: node.accessDelay
        }];
        
        if (node.children) {
          node.children.forEach(child => {
            nodes.push(...getNodesWithDelays(child));
          });
        }
        
        return nodes;
      };

      const nodesWithDelays = getNodesWithDelays(structure);
      
      // Group nodes by their access delay
      const nodesByDelay: { [key: string]: string[] } = {};
      nodesWithDelays.forEach(node => {
        const delayKey = node.delay 
          ? `${node.delay.value}-${node.delay.unit}`
          : 'instant';
        
        if (!nodesByDelay[delayKey]) {
          nodesByDelay[delayKey] = [];
        }
        nodesByDelay[delayKey].push(node.id);
      });

      // Grant access for each group of nodes
      for (const [delayKey, contentIds] of Object.entries(nodesByDelay)) {
        let accessStartsAt = new Date().toISOString(); // Default to now for instant access
        
        // Calculate access_starts_at if there's a delay
        if (delayKey !== 'instant') {
          const [value, unit] = delayKey.split('-');
          const now = new Date();
          
          switch (unit) {
            case 'days':
              now.setDate(now.getDate() + parseInt(value));
              break;
            case 'weeks':
              now.setDate(now.getDate() + (parseInt(value) * 7));
              break;
            case 'months':
              now.setMonth(now.getMonth() + parseInt(value));
              break;
          }
          
          accessStartsAt = now.toISOString();
        }

        const { error } = await supabase.rpc('grant_bulk_access', {
          p_content_ids: contentIds,
          p_access_starts_at: accessStartsAt, // This will never be null now
          p_metadata: JSON.stringify({
            granted_through: selectedType,
            granted_from: selectedId
          }),
          p_user_id: user.id,
          p_granted_by: user.id
        });

        if (error) throw error;
      }

      // Refresh the structure
      const updatedNode = await fetchNodeDetails(selectedId, selectedType);
      if (updatedNode) {
        setStructure(updatedNode);
      }

    } catch (error) {
      console.error('Error granting access:', error);
    }
  };

  const updateNodeAccessDelay = (nodeId: string, value: number, unit: 'days' | 'weeks' | 'months') => {
    setStructure(prevStructure => {
      if (!prevStructure) return null;

      const updateNode = (node: StructureNode): StructureNode => {
        if (node.id === nodeId) {
          return {
            ...node,
            accessDelay: { value, unit }
          };
        }
        if (node.children) {
          return {
            ...node,
            children: node.children.map(child => updateNode(child))
          };
        }
        return node;
      };

      return updateNode(prevStructure);
    });
  };

  const renderAccessControls = (node: StructureNode) => {
    const findParentWithDrip = (targetNode: StructureNode, tree: StructureNode | null): boolean => {
      if (!tree) return false;

      // Helper function to check if a node is a descendant of another node
      const isDescendant = (parent: StructureNode, child: StructureNode): boolean => {
        if (!parent.children) return false;
        
        // Check each child at this level
        for (const node of parent.children) {
          // If this is our target node and parent has drip or no access, return true
          if (node.id === child.id) {
            return parent.accessDelay !== undefined || parent.hasAccess === false;
          }
          
          // If this node has drip/no access and our target is somewhere in its children, return true
          if (node.accessDelay !== undefined || node.hasAccess === false) {
            const hasTargetInChildren = findNodeInChildren(node, child.id);
            if (hasTargetInChildren) return true;
          }
          
          // Recursively check this node's children
          if (isDescendant(node, child)) {
            return true;
          }
        }
        
        return false;
      };

      // Helper function to find a node by ID in the children tree
      const findNodeInChildren = (parent: StructureNode, targetId: string): boolean => {
        if (!parent.children) return false;
        
        for (const child of parent.children) {
          if (child.id === targetId) return true;
          if (findNodeInChildren(child, targetId)) return true;
        }
        
        return false;
      };

      // Start checking from the root
      return isDescendant(tree, targetNode);
    };

    const hasAncestorWithDrip = findParentWithDrip(node, structure);
    const hasDripSettings = node.accessDelay !== undefined;

    const handleAddDrip = () => {
      updateNodeAccessDelay(node.id, 0, 'days');
    };

    const handleRemoveDrip = () => {
      setStructure(prevStructure => {
        if (!prevStructure) return null;

        const updateNode = (currNode: StructureNode): StructureNode => {
          if (currNode.id === node.id) {
            const { accessDelay, ...nodeWithoutDelay } = currNode;
            return nodeWithoutDelay;
          }
          if (currNode.children) {
            return {
              ...currNode,
              children: currNode.children.map(child => updateNode(child))
            };
          }
          return currNode;
        };

        return updateNode(prevStructure);
      });
    };

    const handleToggleAccess = () => {
      setStructure(prevStructure => {
        if (!prevStructure) return null;

        const updateNode = (currNode: StructureNode): StructureNode => {
          if (currNode.id === node.id) {
            return {
              ...currNode,
              hasAccess: currNode.hasAccess === false ? undefined : false
            };
          }
          if (currNode.children) {
            return {
              ...currNode,
              children: currNode.children.map(child => updateNode(child))
            };
          }
          return currNode;
        };

        return updateNode(prevStructure);
      });
    };

    // Base controls that are always shown (eye icon)
    const baseControls = (
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleToggleAccess();
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

    // If any ancestor has drip or no access, show lock icon
    if (hasAncestorWithDrip) {
      return (
        <div className="flex items-center gap-2 ml-auto">
          <Lock className="w-4 h-4 text-[var(--muted-foreground)]/40" />
        </div>
      );
    }

    // If in drip mode and has drip settings, show only drip controls
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
              updateNodeAccessDelay(node.id, value === '' ? 0 : Math.max(0, Math.min(99, parseInt(value) || 0)), node.accessDelay?.unit || 'days');
            }}
            className="w-8 text-base text-right bg-transparent text-[var(--foreground)] focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <TimeUnitDropdown
            value={node.accessDelay?.unit || 'days'}
            onChange={(unit) => updateNodeAccessDelay(node.id, node.accessDelay?.value || 0, unit)}
            inputValue={node.accessDelay?.value || 0}
          />
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleRemoveDrip();
            }}
            className="p-1 hover:bg-[var(--muted)] rounded-full transition-colors"
          >
            <X className="w-4 h-4 text-[var(--muted-foreground)] hover:text-[var(--foreground)]" />
          </button>
        </div>
      );
    }

    // For all other cases (instant mode or drip mode without drip settings), show base controls
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
  };

  const getMediaTypeIcon = (mediaType?: string, hasNoAccess?: boolean) => {
    const iconClasses = cn(
      "w-5 h-5",
      hasNoAccess 
        ? "dark:text-[var(--muted-foreground)]/70 text-[var(--muted-foreground)]"
        : "text-[var(--muted-foreground)]"
    );
    switch (mediaType) {
      case 'video':
        return <Film className={iconClasses} />;
      case 'text':
        return <Book className={iconClasses} />;
      case 'tool':
        return <Wrench className={iconClasses} />;
      case 'pdf':
        return <FileText className={iconClasses} />;
      case 'quiz':
        return <HelpCircle className={iconClasses} />;
      default:
        return null;
    }
  };

  const renderNode = (node: StructureNode, level: number = 0, hasAncestorWithNoAccess: boolean = false) => {
    const isLoading = loadingNodes?.has(node.id);
    const isSelected = selectedNode === node.id;
    const hasNoAccess = hasAncestorWithNoAccess || node.hasAccess === false;
    
    return (
      <div key={node.id} className={cn(
        "relative",
        level > 0 && "ml-8 pl-4"
      )}>
        {level > 0 && (
          <div className="absolute left-0 top-0 bottom-0 w-px bg-[var(--border-color)]" />
        )}

        <div
          onClick={() => {
            handleNodeClick(node);
            setSelectedNode(isSelected ? null : node.id);
          }}
          className={cn(
            "group relative flex items-center py-3 px-4 border border-[var(--border-color)] rounded-lg",
            "bg-[var(--background)] transition-colors",
            level === 0 && "shadow-sm mb-4",
            hasNoAccess && "dark:bg-[var(--muted)]/30 bg-[var(--muted)]"
          )}
        >
          {level > 0 && (
            <div className="absolute left-0 top-1/2 w-4 h-px -translate-y-px bg-[var(--border-color)] -translate-x-4" />
          )}
          
          {/* Add overlay for no access */}
          {hasNoAccess && (
            <div className="absolute inset-0 rounded-lg pointer-events-none dark:bg-black/30 bg-gray-100/50" />
          )}
          
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {level === 0 && (
              <div className="w-1 h-6 bg-[var(--accent)] rounded-full shrink-0" />
            )}
            
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-[var(--text-secondary)]" />
            ) : (
              <>
                {node.type === 'media' && (
                  <div className="shrink-0">
                    {getMediaTypeIcon(node.mediaType, hasNoAccess)}
                  </div>
                )}
                <span className={cn(
                  "transition-colors truncate",
                  level === 0 
                    ? "text-2xl font-semibold" 
                    : "text-lg",
                  "text-[var(--foreground)]",
                  hasNoAccess && "dark:text-[var(--muted-foreground)]/70 text-[var(--muted-foreground)]"
                )}>{node.name}</span>
              </>
            )}
            {renderAccessControls(node)}
          </div>
        </div>

        {node.children && node.children.length > 0 && (
          <div className={cn(
            "relative",
            level === 0 ? "mt-4" : "mt-3"
          )}>
            {[...node.children]
              .sort((a: StructureNode, b: StructureNode) => a.order - b.order)
              .map((child, index) => (
                <div key={child.id} className={cn(
                  "relative",
                  index > 0 && "mt-3"
                )}>
                  {renderNode(child, level + 1, hasNoAccess)}
                </div>
              ))}
          </div>
        )}
      </div>
    );
  };

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
          <p className="font-medium mb-2">No structure available</p>
          <p className="text-sm">The selected item has no content structure.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 rounded-xl border border-[var(--border-color)] bg-[var(--background)]">
      {/* Header with title and access controls */}
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-3xl font-medium text-[var(--foreground)]">Access Overview</h3>
        <div className="flex items-center gap-4">
          {/* Access Method Selection */}
          <div className="flex gap-2 bg-[var(--muted)]/50 p-1.5 rounded-lg">
            <button
              onClick={() => setAccessMethod('instant')}
              title="Instant Access"
              className={cn(
                "p-2.5 rounded-md transition-all",
                accessMethod === 'instant'
                  ? "bg-[var(--accent)] text-white shadow-sm"
                  : "hover:bg-[var(--muted)] text-[var(--muted-foreground)]"
              )}
            >
              <Zap className="w-6 h-6" />
            </button>
            <button
              onClick={() => setAccessMethod('drip')}
              title="Drip Access"
              className={cn(
                "p-2.5 rounded-md transition-all",
                accessMethod === 'drip'
                  ? "bg-[var(--accent)] text-white shadow-sm"
                  : "hover:bg-[var(--muted)] text-[var(--muted-foreground)]"
              )}
            >
              <Clock className="w-6 h-6" />
            </button>
          </div>

          {/* Save Button */}
          <button
            onClick={handleGrantAccess}
            className={cn(
              "px-8 py-2.5 rounded-lg text-lg font-medium",
              "bg-[var(--accent)] text-white",
              "hover:opacity-90 transition-opacity",
              "shadow-sm"
            )}
          >
            Save
          </button>
        </div>
      </div>

      {/* Content Structure Tree */}
      <div ref={structureRef} className="relative">
        {renderNode(structure, 0, false)}
      </div>
    </div>
  );
} 
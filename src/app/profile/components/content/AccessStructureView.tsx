import { useState, useEffect, useRef } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Loader2, AlertCircle, Zap, Clock, ChevronDown, Check, Plus, Lock, Eye, EyeOff, X, Youtube, FileText, Bot, HelpCircle, Type, ChevronRight } from 'lucide-react';
import { cn } from "@/lib/utils";
import { Toast } from "../common/Toast";

interface StructureNode {
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

interface AccessStructureViewProps {
  selectedType: 'bundle' | 'collection' | 'content';
  selectedId: string;
  targetUserId?: string;
  onAccessGranted?: () => void;
  onRefreshContentHistory?: () => void;
  isAdmin?: boolean;
  isSuperAdmin?: boolean;
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

interface TransformedNode {
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

export function AccessStructureView({ 
  selectedType, 
  selectedId, 
  targetUserId, 
  onAccessGranted, 
  onRefreshContentHistory,
  isAdmin,
  isSuperAdmin 
}: AccessStructureViewProps) {
  const [structure, setStructure] = useState<StructureNode | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accessMethod, setAccessMethod] = useState<AccessMethod>('instant');
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const supabase = createClientComponentClient();
  const [loadingNodes, setLoadingNodes] = useState<Set<string>>(new Set());
  const structureRef = useRef<HTMLDivElement>(null);
  const [toastMessage, setToastMessage] = useState<string>('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [showToast, setShowToast] = useState(false);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

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
        // First get the access structure
        const { data: accessStructure, error: accessError } = await supabase
          .rpc('get_content_access_structure', {
            p_user_id: targetUserId || (await supabase.auth.getUser()).data.user?.id,
            p_content_id: nodeId
          });

        if (accessError) throw accessError;

        // Then get the content details
        const { data: streamingContent, error: streamingError } = await supabase
          .rpc('get_streaming_content', {
            p_content_id: nodeId
          });

        if (streamingError) {
          console.error('Error fetching streaming content:', streamingError);
          return {
            id: nodeId,
            name: '',
            type: 'content' as const,
            order: 0,
            isHidden: false,
            children: []
          } as StructureNode;
        }

        // Merge the access structure with content details
        const contentNode: StructureNode = {
          id: streamingContent.content.id,
          name: streamingContent.content.title,
          type: 'content',
          order: 0,
          hasAccess: accessStructure?.hasAccess !== false,
          accessDelay: accessStructure?.accessDelay,
          isHidden: streamingContent.content.is_hidden,
          children: streamingContent.modules?.map((module: any, index: number) => {
            // Find module in access structure
            const moduleAccess = accessStructure?.children?.find((m: any) => m.id === module.id);
            
            return {
              id: module.id,
              name: module.title,
              type: 'module' as const,
              order: module.order || index,
              hasAccess: moduleAccess?.hasAccess !== false,
              accessDelay: moduleAccess?.accessDelay,
              isHidden: module.is_hidden,
              children: module.media?.map((media: any, mediaIndex: number) => {
                // Find media in access structure
                const mediaAccess = moduleAccess?.children?.find((m: any) => m.id === media.id);
                
                const mediaItems = [];
                
                // Add video if exists
                if (media.video_id) {
                  mediaItems.push({
                    id: `${media.id}-video`,
                    name: media.video_name || 'Video',
                    type: 'media' as const,
                    order: 0,
                    mediaType: 'video',
                    hasAccess: mediaAccess?.hasAccess !== false,
                    accessDelay: mediaAccess?.accessDelay,
                    isHidden: media.is_hidden
                  });
                }

                // Add text content if exists
                if (media.content_text) {
                  mediaItems.push({
                    id: `${media.id}-text`,
                    name: media.text_title || 'Text Content',
                    type: 'media' as const,
                    order: 1,
                    mediaType: 'text',
                    hasAccess: mediaAccess?.hasAccess !== false,
                    accessDelay: mediaAccess?.accessDelay,
                    isHidden: media.is_hidden
                  });
                }

                // Add tool if exists
                if (media.tool) {
                  mediaItems.push({
                    id: `${media.id}-tool`,
                    name: media.tool.title || 'AI Tool',
                    type: 'media' as const,
                    order: 2,
                    mediaType: 'tool',
                    hasAccess: mediaAccess?.hasAccess !== false,
                    accessDelay: mediaAccess?.accessDelay,
                    isHidden: media.is_hidden
                  });
                }

                // Add PDF if exists
                if (media.pdf_url) {
                  mediaItems.push({
                    id: `${media.id}-pdf`,
                    name: media.pdf_title || 'PDF',
                    type: 'media' as const,
                    order: 3,
                    mediaType: 'pdf',
                    hasAccess: mediaAccess?.hasAccess !== false,
                    accessDelay: mediaAccess?.accessDelay,
                    isHidden: media.is_hidden
                  });
                }

                // Add quiz if exists
                if (media.quiz_data) {
                  mediaItems.push({
                    id: `${media.id}-quiz`,
                    name: media.quiz_title || 'Quiz',
                    type: 'media' as const,
                    order: 4,
                    mediaType: 'quiz',
                    hasAccess: mediaAccess?.hasAccess !== false,
                    accessDelay: mediaAccess?.accessDelay,
                    isHidden: media.is_hidden
                  });
                }

                return {
                  id: media.id,
                  name: media.title,
                  type: 'media' as const,
                  order: mediaIndex,
                  hasAccess: mediaAccess?.hasAccess !== false,
                  accessDelay: mediaAccess?.accessDelay,
                  isHidden: media.is_hidden,
                  children: mediaItems
                };
              })
            };
          })
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
              isHidden: false,
              children: []
            } as StructureNode;
          }

          // Use streaming content data
          return {
            id: streamingContent.content.id,
            name: streamingContent.content.title,
            type: 'content' as const,
            order: index,
            isHidden: streamingContent.content.is_hidden,
            children: streamingContent.modules?.map((module: any, moduleIndex: number) => ({
              id: module.id,
              name: module.title,
              type: 'module' as const,
              order: module.order || moduleIndex,
              isHidden: module.is_hidden,
              children: module.media?.map((media: any, mediaIndex: number) => {
                const mediaItems = [];
                
                // Add video if exists
                if (media.video_id) {
                  mediaItems.push({
                    id: `${media.id}-video`,
                    name: media.video_name || 'Video',
                    type: 'media' as const,
                    order: 0,
                    mediaType: 'video',
                    isHidden: media.is_hidden
                  });
                }

                // Add text content if exists
                if (media.content_text) {
                  mediaItems.push({
                    id: `${media.id}-text`,
                    name: media.text_title || 'Text Content',
                    type: 'media' as const,
                    order: 1,
                    mediaType: 'text',
                    isHidden: media.is_hidden
                  });
                }

                // Add tool if exists
                if (media.tool) {
                  mediaItems.push({
                    id: `${media.id}-tool`,
                    name: media.tool.title || 'AI Tool',
                    type: 'media' as const,
                    order: 2,
                    mediaType: 'tool',
                    isHidden: media.is_hidden
                  });
                }

                // Add PDF if exists
                if (media.pdf_url) {
                  mediaItems.push({
                    id: `${media.id}-pdf`,
                    name: media.pdf_title || 'PDF',
                    type: 'media' as const,
                    order: 3,
                    mediaType: 'pdf',
                    isHidden: media.is_hidden
                  });
                }

                // Add quiz if exists
                if (media.quiz_data) {
                  mediaItems.push({
                    id: `${media.id}-quiz`,
                    name: media.quiz_title || 'Quiz',
                    type: 'media' as const,
                    order: 4,
                    mediaType: 'quiz',
                    isHidden: media.is_hidden
                  });
                }

                return {
                  id: media.id,
                  name: media.title,
                  type: 'media' as const,
                  order: mediaIndex,
                  isHidden: media.is_hidden,
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

  const getAccessStatusColor = (node: StructureNode, isNodeInEditMode: boolean = false) => {
    // First check for no access
    if (node.hasAccess === false) return 'bg-red-500';

    // In instant mode (not drip mode) and edit mode, everything is green except hidden items
    // But we don't modify any state, just the visual display
    if (isNodeInEditMode && accessMethod === 'instant') {
      return 'bg-green-500';
    }

    // Helper function to check if a node or any of its descendants have a delay
    const hasNodeOrDescendantsWithDelay = (checkNode: StructureNode): boolean => {
      // Only return true if there's an actual delay value greater than 0
      const delayValue = checkNode.accessDelay?.value;
      if (delayValue !== undefined && delayValue > 0) {
        return true;
      }
      
      // Check if any children have delays greater than 0
      if (checkNode.children) {
        return checkNode.children.some(child => hasNodeOrDescendantsWithDelay(child));
      }
      
      return false;
    };

    // Check for actual delays (value > 0)
    const hasDelay = hasNodeOrDescendantsWithDelay(node);
    
    // In drip mode, show blue for nodes with delays
    if (accessMethod === 'drip' && hasDelay) {
      return 'bg-blue-500';
    }

    return 'bg-green-500';
  };

  const getRemainingDays = (node: StructureNode) => {
    if (!node.accessDelay) return null;
    
    const value = node.accessDelay.value;
    const unit = node.accessDelay.unit;
    
    // Return the value directly since it's already calculated in days by the backend
    return value > 0 ? value : 0;
  };

  const handleGrantAccess = async () => {
    try {
      if (!structure) return;
      setIsLoading(true);

      // Get current user for granted_by
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error('No user found');

      // Get target user ID (either provided or current user)
      const effectiveUserId = targetUserId || user.id;

      // Transform nodes to include hasAccess flag
      const transformNode = (node: StructureNode): any => {
        const transformed = {
          id: node.id,
          type: node.type,
          hasAccess: node.hasAccess !== false,
          // Only include accessDelay if we're in drip mode
          ...(accessMethod === 'drip' && { accessDelay: node.accessDelay }),
          children: node.children?.map(transformNode) || []
        };
        return transformed;
      };

      const transformedNodes = [transformNode(structure)];

      // Debug log
      console.log('Sending structure to database:', JSON.stringify(transformedNodes, null, 2));

      // Call the RPC function
      const { data, error } = await supabase.rpc('grant_user_access', {
        p_user_id: effectiveUserId,
        p_content_structure: transformedNodes,
        p_granted_by: user.id
      });

      // Debug log
      if (data) {
        console.log('Response from database:', JSON.stringify(data, null, 2));
      }

      if (error) throw error;

      // Show success message
      setToastMessage('Access granted successfully');
      setToastType('success');
      setShowToast(true);

      // Refresh the content history view
      if (onRefreshContentHistory) {
        onRefreshContentHistory();
      }

    } catch (error) {
      console.error('Error granting access:', error);
      setToastMessage(error instanceof Error ? error.message : 'An unexpected error occurred');
      setToastType('error');
      setShowToast(true);
    } finally {
      setIsLoading(false);
    }
  };

  const updateNodeAccessDelay = (nodeId: string, value: number, unit: 'days' | 'weeks' | 'months') => {
    setStructure(prevStructure => {
      if (!prevStructure) return null;

      const updateNode = (node: StructureNode): StructureNode => {
        if (node.id === nodeId) {
          const newDelay = { value, unit };
          
          // For modules, apply delay to the module and all media groups and their children
          if (node.type === 'module') {
            return {
              ...node,
              accessDelay: newDelay,
              children: node.children?.map(mediaGroup => ({
                ...mediaGroup,
                accessDelay: newDelay,
                // Also update all media items within the media group
                children: mediaGroup.children?.map(mediaItem => ({
                  ...mediaItem,
                  accessDelay: newDelay
                }))
              }))
            };
          }
          
          // For media groups, apply delay to both group and all child items
          if (node.type === 'media' && node.children) {
            return {
              ...node,
              accessDelay: newDelay,
              children: node.children.map(child => ({
                ...child,
                accessDelay: newDelay
              }))
            };
          }

          return {
            ...node,
            accessDelay: newDelay
          };
        }

        return {
          ...node,
          children: node.children 
            ? node.children.map(child => updateNode(child))
            : undefined
        };
      };

      return updateNode(prevStructure);
    });
  };

  const hasMediaGroupWithDrip = (node: StructureNode): boolean => {
    if (!node.children) return false;
    
    return node.children.some(child => {
      // Check if this is a media group (media type with children)
      if (child.type === 'media' && child.children && child.children.length > 0) {
        return child.accessDelay !== undefined;
      }
      return false;
    });
  };

  const findParentModule = (node: StructureNode, tree: StructureNode | null): StructureNode | null => {
    if (!tree || !tree.children) return null;

    for (const child of tree.children) {
      if (child.type === 'module') {
        if (child.children?.some(mediaGroup => mediaGroup.id === node.id)) {
          return child;
        }
      }
      const found = findParentModule(node, child);
      if (found) return found;
    }
    return null;
  };

  const renderAccessControls = (node: StructureNode, level: number = 0) => {
    // If not in edit mode, this is a media item with mediaType, or this is the content level, don't show controls
    if (!isEditMode || (node.type === 'media' && node.mediaType) || node.type === 'content') {
      return null;
    }

    const findParentWithDrip = (targetNode: StructureNode, tree: StructureNode | null): boolean => {
      if (!tree) return false;

      const findParentRecursive = (parent: StructureNode, targetId: string): boolean => {
        // Don't consider the node itself as its own parent
        if (parent.id === targetId) return false;
        
        // Check direct children first
        if (parent.children) {
          for (const child of parent.children) {
            if (child.id === targetId) {
              // Only return true if the parent has a drip delay
              return parent.accessDelay !== undefined;
            }
            // Recursively check child's children
            if (findParentRecursive(child, targetId)) {
              return true;
            }
          }
        }
        return false;
      };

      return findParentRecursive(tree, targetNode.id);
    };

    const hasAncestorWithDrip = findParentWithDrip(node, structure);
    const hasDripSettings = node.accessDelay !== undefined;
    const hasChildMediaGroupWithDrip = node.type === 'module' && hasMediaGroupWithDrip(node);

    // For media groups, check if parent module has drip
    const parentModule = node.type === 'media' && node.children ? findParentModule(node, structure) : null;
    const hasParentModuleWithDrip = parentModule?.accessDelay !== undefined;

    // Only show lock icon for media groups when their parent module has drip
    if (node.type === 'media' && node.children && hasParentModuleWithDrip) {
      return (
        <div className="flex items-center gap-2 ml-auto">
          <Lock className="w-4 h-4 text-[var(--muted-foreground)]/40" />
        </div>
      );
    }

    // If any ancestor has drip, show lock icon (but not for modules themselves)
    if (hasAncestorWithDrip && node.type !== 'module') {
      return (
        <div className="flex items-center gap-2 ml-auto">
          <Lock className="w-4 h-4 text-[var(--muted-foreground)]/40" />
        </div>
      );
    }

    const handleAddDrip = () => {
      updateNodeAccessDelay(node.id, 0, 'days');
    };

    const handleRemoveDrip = (targetNode: StructureNode) => {
      setStructure(prevStructure => {
        if (!prevStructure) return null;

        const updateNode = (currNode: StructureNode): StructureNode => {
          if (currNode.id === targetNode.id) {
            const { accessDelay, ...nodeWithoutDelay } = currNode;
            
            // For modules, remove delay from both module and all media groups and their children
            if (currNode.type === 'module') {
              return {
                ...nodeWithoutDelay,
                children: currNode.children?.map(mediaGroup => {
                  const { accessDelay, ...mediaGroupWithoutDelay } = mediaGroup;
                  return {
                    ...mediaGroupWithoutDelay,
                    children: mediaGroup.children?.map(mediaItem => {
                      const { accessDelay, ...mediaItemWithoutDelay } = mediaItem;
                      return mediaItemWithoutDelay;
                    })
                  };
                })
              };
            }
            
            // For media groups, remove delay from both group and all child items
            if (currNode.type === 'media' && currNode.children) {
              return {
                ...nodeWithoutDelay,
                children: currNode.children.map(child => {
                  const { accessDelay, ...childWithoutDelay } = child;
                  return childWithoutDelay;
                })
              };
            }
            
            return nodeWithoutDelay;
          }
          
          return {
            ...currNode,
            children: currNode.children 
              ? currNode.children.map(child => updateNode(child))
              : undefined
          };
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
              handleRemoveDrip(node);
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
        return <Youtube className={iconClasses} />;
      case 'text':
        return <Type className={iconClasses} />;
      case 'tool':
        return <Bot className={iconClasses} />;
      case 'pdf':
        return <FileText className={iconClasses} />;
      case 'quiz':
        return <HelpCircle className={iconClasses} />;
      default:
        return null;
    }
  };

  const toggleNodeExpansion = (nodeId: string) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  };

  const getChildrenAccessStatus = (): { 
    hasPendingChildren: boolean; 
    nextAvailableChild: StructureNode | null; 
    earliestDate: number; 
  } => {
    if (!structure) return { hasPendingChildren: false, nextAvailableChild: null, earliestDate: 0 };
    
    let earliestDate = Infinity;
    let nextAvailableChild: StructureNode | null = null;
    let hasPendingChildren = false;

    const checkNode = (childNode: StructureNode) => {
      if (childNode.hasAccess === false) {
        hasPendingChildren = true;
        return;
      }

      if (childNode.accessDelay) {
        const days = calculateDaysFromDelay(childNode.accessDelay);
        if (days > 0 && days < earliestDate) {
          earliestDate = days;
          nextAvailableChild = childNode;
        }
        hasPendingChildren = true;
      }

      if (childNode.children) {
        childNode.children.forEach(checkNode);
      }
    };

    checkNode(structure);
    return { hasPendingChildren, nextAvailableChild, earliestDate: earliestDate === Infinity ? 0 : earliestDate };
  };

  const calculateDaysFromDelay = (delay: { value: number, unit: 'days' | 'weeks' | 'months' }) => {
    const now = new Date();
    const startDate = new Date(now);
    
    switch (delay.unit) {
      case 'days':
        startDate.setDate(startDate.getDate() + delay.value);
        break;
      case 'weeks':
        startDate.setDate(startDate.getDate() + (delay.value * 7));
        break;
      case 'months':
        startDate.setMonth(startDate.getMonth() + delay.value);
        break;
    }
    
    const diffTime = startDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const renderNode = (node: StructureNode, level: number = 0, hasAncestorWithNoAccess: boolean = false) => {
    // Skip hidden nodes and nodes with no access in view mode
    if (!isEditMode && (node.isHidden || node.hasAccess === false || hasAncestorWithNoAccess)) {
      return null;
    }

    const isLoading = loadingNodes?.has(node.id);
    const isSelected = selectedNode === node.id;
    const hasNoAccess = hasAncestorWithNoAccess || node.hasAccess === false;
    const isExpanded = expandedNodes.has(node.id);
    const hasChildren = node.children && node.children.length > 0;
    const isMediaGroup = node.type === 'media' && hasChildren;
    
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
            if (isMediaGroup) {
              toggleNodeExpansion(node.id);
            } else {
              handleNodeClick(node);
              setSelectedNode(isSelected ? null : node.id);
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
          
          {/* Add overlay for no access */}
          {hasNoAccess && (
            <div className="absolute inset-0 rounded-lg pointer-events-none dark:bg-black/30 bg-gray-100/50" />
          )}

          {/* Access status indicator */}
          <div className={cn(
            "absolute left-0 top-0 bottom-0 w-1 rounded-l-lg",
            getAccessStatusColor(node, isEditMode)
          )} />
          
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-[var(--text-secondary)]" />
            ) : (
              <>
                {isMediaGroup && (
                  <ChevronDown className={cn(
                    "w-4 h-4 text-[var(--muted-foreground)] transition-transform",
                    !isExpanded && "-rotate-90"
                  )} />
                )}
                {node.type === 'media' && (
                  <div className="shrink-0">
                    {getMediaTypeIcon(node.mediaType, hasNoAccess)}
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
                      Available in {calculateDaysFromDelay(node.accessDelay)} days
                    </span>
                  )}
                </div>
              </>
            )}
            {renderAccessControls(node, level)}
          </div>
        </div>

        {hasChildren && (!isMediaGroup || isExpanded) && (
          <div className={cn(
            "relative",
            level === 0 ? "mt-4" : "mt-3"
          )}>
            {node.children?.sort((a: StructureNode, b: StructureNode) => a.order - b.order)
              .filter(child => isEditMode || (!child.isHidden && child.hasAccess !== false))
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
      {/* Header with title and controls */}
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-3xl font-medium text-[var(--foreground)]">Access Overview</h3>
        <div className="flex items-center gap-4">
          {/* Edit Mode Toggle (only for admins and super admins) */}
          {(isAdmin || isSuperAdmin) && (
            <button
              onClick={() => setIsEditMode(!isEditMode)}
              className={cn(
                "p-2.5 rounded-lg transition-colors",
                isEditMode
                  ? "bg-[var(--muted)] text-[var(--foreground)]"
                  : "bg-[var(--accent)] text-white"
              )}
            >
              {isEditMode ? (
                <ChevronRight className="w-5 h-5" />
              ) : (
                "Edit Mode"
              )}
            </button>
          )}

          {/* Access Method Selection (only visible in edit mode) */}
          {isEditMode && (
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
          )}

          {/* Save Button (only visible in edit mode) */}
          {isEditMode && (
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
          )}
        </div>
      </div>

      {/* Content Structure Tree */}
      <div ref={structureRef} className="relative">
        {renderNode(structure, 0, false)}
      </div>

      {showToast && (
        <Toast
          message={toastMessage}
          type={toastType}
          onClose={() => setShowToast(false)}
        />
      )}
    </div>
  );
} 
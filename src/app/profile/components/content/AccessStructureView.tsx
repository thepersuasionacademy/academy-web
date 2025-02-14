import { useState, useEffect, useRef } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Loader2, AlertCircle, Zap, Clock, ChevronDown, Check, Plus, Lock, X, Film, Book, Wrench, FileText, HelpCircle } from 'lucide-react';
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
            ? "text-[var(--text-secondary)]/40 cursor-not-allowed" 
            : "text-[var(--foreground)]"
        )}
      >
        <span>{displayValue}</span>
        <ChevronDown className={cn(
          "h-3 w-3",
          disabled 
            ? "opacity-40"
            : "text-[var(--text-secondary)]"
        )} />
      </button>
      
      {!disabled && isOpen && (
        <div className="absolute right-0 z-10 mt-1 min-w-[100px] py-1 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-md shadow-lg">
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                onChange(option.value as 'days' | 'weeks' | 'months');
                setIsOpen(false);
              }}
              className="flex items-center gap-2 w-full px-3 py-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--foreground)] hover:bg-[var(--hover-bg)] transition-colors"
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

      // Get all nodes with their access delays
      const getNodesWithDelays = (node: StructureNode): { id: string; type: string; delay?: { value: number; unit: string } }[] => {
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
      
      // Grant access to each node
      for (const node of nodesWithDelays) {
        const accessDelay = node.delay ? {
          value: node.delay.value,
          unit: node.delay.unit
        } : undefined;

        const { error } = await supabase.rpc('grant_content_access', {
          p_content_id: node.id,
          p_content_type: node.type,
          p_access_delay: accessDelay
            ? JSON.stringify(accessDelay)
            : null
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
    // Don't show controls for media nodes or top-level collection nodes
    if (accessMethod !== 'drip' || 
        node.type === 'media' || 
        (node.type === 'collection' && !structure?.children?.some(child => child.id === node.id))) return null;

    const findParentNode = (nodeId: string, tree: StructureNode | null): StructureNode | null => {
      if (!tree) return null;
      
      if (tree.children?.some(child => child.id === nodeId)) {
        return tree;
      }
      
      for (const child of tree.children || []) {
        const parent = findParentNode(nodeId, child);
        if (parent) return parent;
      }
      
      return null;
    };

    const parentNode = findParentNode(node.id, structure);
    const parentHasDrip = parentNode?.accessDelay !== undefined;
    const hasDripSettings = node.accessDelay !== undefined;

    const handleAddDrip = () => {
      updateNodeAccessDelay(node.id, 0, 'days');
    };

    const handleRemoveDrip = () => {
      // Actually remove the accessDelay object completely
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

    // If parent has drip, show only lock icon
    if (parentHasDrip) {
      return (
        <div className="flex items-center gap-2 ml-auto">
          <Lock className="w-4 h-4 text-[var(--text-secondary)]/40" />
        </div>
      );
    }

    // If node has drip settings, show editable settings with delete option
    if (hasDripSettings) {
      return (
        <div className="flex items-center gap-2 ml-auto">
          <input
            type="number"
            min="1"
            max="99"
            value={node.accessDelay?.value || ''}
            onChange={(e) => {
              const value = e.target.value;
              // Just update the value, keeping the accessDelay object intact
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
            className="p-1 hover:bg-[var(--hover-bg)] rounded-full transition-colors"
          >
            <X className="w-4 h-4 text-[var(--text-secondary)] hover:text-[var(--foreground)]" />
          </button>
        </div>
      );
    }

    // Default state: show plus icon to add drip
    return (
      <div className="flex items-center gap-2 ml-auto">
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleAddDrip();
          }}
          className="p-1 hover:bg-[var(--hover-bg)] rounded-full transition-colors"
        >
          <Plus className="w-4 h-4 text-[var(--text-secondary)] hover:text-[var(--foreground)]" />
        </button>
      </div>
    );
  };

  const getMediaTypeIcon = (mediaType?: string) => {
    switch (mediaType) {
      case 'video':
        return <Film className="w-4 h-4 text-[var(--text-secondary)]" />;
      case 'text':
        return <Book className="w-4 h-4 text-[var(--text-secondary)]" />;
      case 'tool':
        return <Wrench className="w-4 h-4 text-[var(--text-secondary)]" />;
      case 'pdf':
        return <FileText className="w-4 h-4 text-[var(--text-secondary)]" />;
      case 'quiz':
        return <HelpCircle className="w-4 h-4 text-[var(--text-secondary)]" />;
      default:
        return null;
    }
  };

  const renderNode = (node: StructureNode, level: number = 0) => {
    const isLoading = loadingNodes?.has(node.id);
    const isSelected = selectedNode === node.id;
    
    return (
      <div key={node.id} className={cn(
        "transition-all duration-200",
        level > 0 && "pl-6"
      )}>
        {level > 0 && (
          <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-4 h-px bg-[var(--border-color)]" />
        )}
        {level > 0 && (
          <div className="absolute left-[-16px] top-0 bottom-0 w-px bg-[var(--border-color)]" />
        )}
        <div
          onClick={() => {
            handleNodeClick(node);
            setSelectedNode(isSelected ? null : node.id);
          }}
          className={cn(
            "group py-3 px-4 transition-all duration-200",
            "hover:bg-[var(--hover-bg)]/50",
            isSelected && "hover:bg-[var(--hover-bg)]/50",
            level === 0 && "bg-[var(--card-bg)] rounded-t-lg border border-[var(--border-color)]",
            level > 0 && "border-x border-b border-[var(--border-color)]",
            node.children?.length === 0 && "border-b border-[var(--border-color)]"
          )}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Node Type Indicator */}
              <div className={cn(
                "w-1 h-4 transition-colors",
                "bg-[var(--border-color)] group-hover:bg-[var(--accent)]"
              )} />
              
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin text-[var(--text-secondary)]" />
              ) : (
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "font-medium transition-colors",
                    level === 0 ? "text-3xl" : "text-xl",
                    "text-[var(--text-secondary)] group-hover:text-[var(--foreground)]"
                  )}>{node.name}</span>
                  {node.type === 'media' && getMediaTypeIcon(node.mediaType)}
                </div>
              )}
            </div>
            {renderAccessControls(node)}
          </div>
        </div>

        {node.children && node.children.length > 0 && (
          <div>
            {/* Sort children by order before rendering */}
            {[...node.children]
              .sort((a: StructureNode, b: StructureNode) => a.order - b.order)
              .map((child) => renderNode(child, level + 1))}
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
    <div className="p-8 rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)]">
      {/* Header with title and access controls */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-medium">Access Overview</h3>
        <div className="flex items-center gap-4">
          {/* Access Method Selection */}
          <div className="flex gap-2">
            <button
              onClick={() => setAccessMethod('instant')}
              title="Instant Access"
              className={cn(
                "p-2 rounded-full",
                "border transition-all",
                accessMethod === 'instant'
                  ? "border-[var(--accent)] bg-[var(--accent)] text-white"
                  : "border-[var(--border-color)] hover:border-[var(--accent)] text-[var(--text-secondary)]"
              )}
            >
              <Zap className="w-5 h-5" />
            </button>
            <button
              onClick={() => setAccessMethod('drip')}
              title="Drip Access"
              className={cn(
                "p-2 rounded-full",
                "border transition-all",
                accessMethod === 'drip'
                  ? "border-[var(--accent)] bg-[var(--accent)] text-white"
                  : "border-[var(--border-color)] hover:border-[var(--accent)] text-[var(--text-secondary)]"
              )}
            >
              <Clock className="w-5 h-5" />
            </button>
          </div>

          {/* Save Button */}
          <button
            onClick={handleGrantAccess}
            className="px-6 py-2 bg-[var(--accent)] text-white rounded-lg hover:opacity-90 transition-opacity"
          >
            Save
          </button>
        </div>
      </div>

      {/* Content Structure Tree */}
      <div ref={structureRef} className="space-y-1">
        {renderNode(structure)}
      </div>
    </div>
  );
} 
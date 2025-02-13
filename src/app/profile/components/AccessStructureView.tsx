import { useState, useEffect, useRef } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Loader2, AlertCircle, Zap, Clock, ChevronDown, Check } from 'lucide-react';
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
}

interface AccessStructureViewProps {
  selectedType: 'collection' | 'content';
  selectedId: string;
}

type AccessMethod = 'instant' | 'drip';

interface TimeUnitDropdownProps {
  value: 'days' | 'weeks' | 'months';
  onChange: (value: 'days' | 'weeks' | 'months') => void;
}

function TimeUnitDropdown({ value, onChange }: TimeUnitDropdownProps) {
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

  const options = [
    { value: 'days', label: 'days' },
    { value: 'weeks', label: 'weeks' },
    { value: 'months', label: 'months' }
  ];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 text-base text-[var(--text-secondary)] hover:text-[var(--foreground)] transition-colors"
      >
        <span>{value}</span>
        <ChevronDown className="h-3 w-3" />
      </button>
      
      {isOpen && (
        <div className="absolute right-0 z-10 mt-1 min-w-[100px] py-1 bg-[#1c1c1c] border border-[#2a2a2a] rounded-md shadow-lg">
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                onChange(option.value as 'days' | 'weeks' | 'months');
                setIsOpen(false);
              }}
              className="flex items-center gap-2 w-full px-3 py-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--foreground)] hover:bg-[#2a2a2a] transition-colors"
            >
              <span className="w-4">
                {option.value === value && (
                  <Check className="h-3 w-3 text-[var(--accent)]" />
                )}
              </span>
              {option.label}
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

  const fetchNodeDetails = async (nodeId: string, nodeType: StructureNode['type']) => {
    if (loadingNodes.has(nodeId)) return;
    
    try {
      if (nodeType === 'content') {
        console.log('Fetching modules for content:', nodeId);
        
        // Fetch modules for this content using get_content_cards
        const { data: moduleDetails, error: moduleError } = await supabase
          .rpc('get_content_cards', { 
            p_content_id: nodeId 
          });

        if (moduleError) throw moduleError;

        console.log('Module details:', moduleDetails);

        // Transform the data to match our structure
        setStructure(prevStructure => {
          if (!prevStructure) return null;

          const updateNode = (node: StructureNode): StructureNode => {
            if (node.id === nodeId) {
              return {
                ...node,
                children: moduleDetails?.map((module: any) => ({
                  id: module.id,
                  name: module.title,
                  type: 'module' as const
                }))
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
      }
    } catch (error) {
      console.error('Error fetching node details:', error);
      setError('Failed to load details');
    } finally {
      setLoadingNodes(prev => {
        const next = new Set(prev);
        next.delete(nodeId);
        return next;
      });
    }
  };

  const handleNodeClick = async (node: StructureNode) => {
    if (!node.children) {
      setLoadingNodes(prev => new Set(prev).add(node.id));
      await fetchNodeDetails(node.id, node.type);
    }
  };

  useEffect(() => {
    async function fetchStructure() {
      setIsLoading(true);
      setError(null);
      try {
        if (selectedType === 'collection') {
          console.log('Fetching collection structure for ID:', selectedId);
          
          // First get the collection details
          const { data: collections, error: collectionsError } = await supabase
            .rpc('get_content_collections');

          if (collectionsError) {
            console.error('Error fetching collections:', collectionsError);
            throw collectionsError;
          }

          const selectedCollection = collections.find((c: any) => c.id === selectedId);
          if (!selectedCollection) {
            throw new Error('Collection not found');
          }

          console.log('Collection data:', selectedCollection);

          // Then get all content for this collection
          const { data: content, error: contentError } = await supabase
            .rpc('get_content_by_collection', {
              p_collection_id: selectedId
            });

          if (contentError) {
            console.error('Error fetching content:', contentError);
            throw contentError;
          }

          console.log('Content data:', content);

          // Transform the content into our tree structure
          const contentNodes = await Promise.all((content || []).map(async (item: any) => {
            // Fetch modules for each content item
            const { data: moduleDetails, error: moduleError } = await supabase
              .rpc('get_content_cards', { 
                p_content_id: item.id 
              });

            if (moduleError) {
              console.error('Error fetching modules for content:', item.id, moduleError);
              return {
                id: item.id,
                name: item.title,
                type: 'content' as const,
                children: []
              };
            }

            return {
              id: item.id,
              name: item.title,
              type: 'content' as const,
              children: moduleDetails?.map((module: any) => ({
                id: module.id,
                name: module.title,
                type: 'module' as const
              }))
            };
          }));

          const structureData = {
            id: selectedCollection.id,
            name: selectedCollection.name,
            type: 'collection' as const,
            children: contentNodes
          };

          console.log('Final structure data:', structureData);
          setStructure(structureData);
        } else {
          // For content type, get the content directly
          const { data: content, error: contentError } = await supabase
            .rpc('get_content_by_collection', {
              p_collection_id: selectedId
            });

          if (contentError) {
            console.error('Error fetching content:', contentError);
            throw contentError;
          }

          const selectedContent = content.find((c: any) => c.id === selectedId);
          if (!selectedContent) {
            throw new Error('Content not found');
          }

          setStructure({
            id: selectedContent.id,
            name: selectedContent.title,
            type: 'content',
            children: selectedContent.modules?.map((module: any) => ({
              id: module.id,
              name: module.name,
              type: 'module' as const,
              children: module.media?.map((media: any) => ({
                id: media.id,
                name: media.title,
                type: 'media' as const
              }))
            }))
          });
        }
      } catch (error) {
        console.error('Error details:', error);
        if (error instanceof Error) {
          setError(error.message);
        } else if (typeof error === 'object' && error !== null) {
          setError(JSON.stringify(error));
        } else {
          setError('Failed to load content structure');
        }
      } finally {
        setIsLoading(false);
      }
    }

    fetchStructure();
  }, [selectedType, selectedId, supabase]);

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

      if (!structure) return;
      
      const accessNodes = getNodesWithDelays(structure);
      console.log('Granting access with method:', accessMethod);
      console.log('Access nodes:', accessNodes);
      
      // TODO: Call appropriate Supabase RPC here with the access nodes and their delays
    } catch (error) {
      console.error('Error granting access:', error);
      setError('Failed to grant access');
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

    const delay = node.accessDelay || { value: 0, unit: 'days' };

    return (
      <div className="flex items-center gap-2 ml-auto">
        <div className="flex items-center gap-1">
          <input
            type="number"
            min="0"
            max="99"
            value={delay.value === 0 ? '' : delay.value}
            onChange={(e) => updateNodeAccessDelay(node.id, Math.max(0, parseInt(e.target.value) || 0), delay.unit)}
            onBlur={(e) => {
              if (!e.target.value) {
                updateNodeAccessDelay(node.id, 0, delay.unit);
              }
            }}
            className="w-8 text-base text-right text-[var(--text-secondary)] focus:text-[var(--foreground)] focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none mr-1 bg-transparent"
            placeholder="0"
          />
          <TimeUnitDropdown
            value={delay.unit}
            onChange={(value) => updateNodeAccessDelay(node.id, delay.value, value)}
          />
        </div>
      </div>
    );
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
            isSelected && "bg-[var(--hover-bg)]",
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
                isSelected ? "bg-[var(--accent)]" : "bg-[var(--border-color)]"
              )} />
              
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin text-[var(--text-secondary)]" />
              ) : (
                <span className={cn(
                  "font-medium transition-colors",
                  level === 0 ? "text-xl" : "text-base",
                  "text-[var(--text-secondary)] group-hover:text-[var(--foreground)]"
                )}>{node.name}</span>
              )}
            </div>
            {renderAccessControls(node)}
          </div>
        </div>

        {node.children && node.children.length > 0 && (
          <div>
            {node.children.map((child) => renderNode(child, level + 1))}
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
      <div className="space-y-1">
        {renderNode(structure)}
      </div>
    </div>
  );
} 
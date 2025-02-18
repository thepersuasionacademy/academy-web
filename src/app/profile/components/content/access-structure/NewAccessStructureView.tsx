import { useState, useEffect, useRef } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Loader2, AlertCircle } from 'lucide-react';
import { cn } from "@/lib/utils";
import { Toast } from "../../common/Toast";
import { StructureNode as StructureNodeType, AccessStructureViewProps, AccessMethod } from './types';
import { StructureNode } from './StructureNode';
import { Header } from './Header';

type NewAccessStructureViewProps = Omit<AccessStructureViewProps, 'onAccessGranted'>;

export function NewAccessStructureView({ 
  selectedType, 
  selectedId, 
  targetUserId, 
  onRefreshContentHistory,
  isAdmin,
  isSuperAdmin 
}: NewAccessStructureViewProps) {
  const [structure, setStructure] = useState<StructureNodeType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accessMethod, setAccessMethod] = useState<AccessMethod>('instant');
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(true); // Always true for new access
  const supabase = createClientComponentClient();
  const [loadingNodes, setLoadingNodes] = useState<Set<string>>(new Set());
  const structureRef = useRef<HTMLDivElement>(null);
  const [toastMessage, setToastMessage] = useState<string>('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [showToast, setShowToast] = useState(false);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  // Function to calculate content level access based on children
  const calculateContentAccess = (node: StructureNodeType): boolean => {
    if (!node.children || node.children.length === 0) return true;
    
    // For content nodes, check all descendant nodes
    if (node.type === 'content') {
      return node.children.every(module => {
        // Check module access
        if (module.hasAccess === false) return false;
        
        // Check all media groups in the module
        return module.children?.every(mediaGroup => {
          if (mediaGroup.hasAccess === false) return false;
          
          // Check all media items in the group
          return mediaGroup.children?.every(mediaItem => mediaItem.hasAccess !== false) ?? true;
        }) ?? true;
      });
    }
    
    // For other node types, just check immediate children
    return node.children.every(child => child.hasAccess !== false);
  };

  const fetchNodeDetails = async (nodeId: string, nodeType: StructureNodeType['type']) => {
    try {
      if (nodeType === 'content') {
        const { data: streamingContent, error: streamingError } = await supabase
          .rpc('get_streaming_content', {
            p_content_id: nodeId
          });

        if (streamingError) {
          console.error('Error fetching streaming content:', streamingError);
          return null;
        }

        // Build the tree with all nodes having access by default
        const contentNode: StructureNodeType = {
          id: streamingContent.content.id,
          name: streamingContent.content.title,
          type: 'content',
          order: 0,
          isHidden: streamingContent.content.is_hidden,
          hasAccess: true, // Start with access
          children: streamingContent.modules?.map((module: any, index: number) => ({
            id: module.id,
            name: module.title,
            type: 'module' as const,
            order: module.order || index,
            isHidden: module.is_hidden,
            hasAccess: true, // Start with access
            children: module.media?.map((media: any, mediaIndex: number) => {
              const mediaItems = [];
              
              if (media.video_id) {
                mediaItems.push({
                  id: `${media.id}-video`,
                  name: media.video_name || 'Video',
                  type: 'media' as const,
                  order: 0,
                  mediaType: 'video',
                  hasAccess: true, // Start with access
                  isHidden: media.is_hidden
                });
              }

              if (media.content_text) {
                mediaItems.push({
                  id: `${media.id}-text`,
                  name: media.text_title || 'Text Content',
                  type: 'media' as const,
                  order: 1,
                  mediaType: 'text',
                  hasAccess: true, // Start with access
                  isHidden: media.is_hidden
                });
              }

              if (media.tool) {
                mediaItems.push({
                  id: `${media.id}-tool`,
                  name: media.tool.title || 'AI Tool',
                  type: 'media' as const,
                  order: 2,
                  mediaType: 'tool',
                  hasAccess: true, // Start with access
                  isHidden: media.is_hidden
                });
              }

              if (media.pdf_url) {
                mediaItems.push({
                  id: `${media.id}-pdf`,
                  name: media.pdf_title || 'PDF',
                  type: 'media' as const,
                  order: 3,
                  mediaType: 'pdf',
                  hasAccess: true, // Start with access
                  isHidden: media.is_hidden
                });
              }

              if (media.quiz_data) {
                mediaItems.push({
                  id: `${media.id}-quiz`,
                  name: media.quiz_title || 'Quiz',
                  type: 'media' as const,
                  order: 4,
                  mediaType: 'quiz',
                  hasAccess: true, // Start with access
                  isHidden: media.is_hidden
                });
              }

              return {
                id: media.id,
                name: media.title,
                type: 'media' as const,
                order: mediaIndex,
                hasAccess: true, // Start with access
                isHidden: media.is_hidden,
                children: mediaItems
              };
            })
          }))
        };

        // Let the content level access be calculated from its children
        contentNode.hasAccess = calculateContentAccess(contentNode);
        return contentNode;
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

  const handleNodeClick = async (node: StructureNodeType) => {
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

  const handleGrantAccess = async () => {
    try {
      if (!structure) return;
      setIsLoading(true);

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error('No user found');

      const effectiveUserId = targetUserId || user.id;

      const transformNode = (node: StructureNodeType): any => {
        const transformed = {
          id: node.id,
          type: node.type,
          hasAccess: node.hasAccess !== false,
          ...(accessMethod === 'drip' && { accessDelay: node.accessDelay }),
          children: node.children?.map(transformNode) || []
        };
        return transformed;
      };

      const transformedNodes = [transformNode(structure)];

      const { data, error } = await supabase.rpc('grant_user_access', {
        p_user_id: effectiveUserId,
        p_content_structure: transformedNodes,
        p_granted_by: user.id
      });

      if (error) throw error;

      setToastMessage('Access granted successfully');
      setToastType('success');
      setShowToast(true);

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

      const updateNode = (node: StructureNodeType): StructureNodeType => {
        if (node.id === nodeId) {
          const newDelay = { value, unit };
          
          if (node.type === 'module') {
            const updatedNode = {
              ...node,
              accessDelay: newDelay,
              children: node.children?.map(mediaGroup => ({
                ...mediaGroup,
                accessDelay: newDelay,
                children: mediaGroup.children?.map(mediaItem => ({
                  ...mediaItem,
                  accessDelay: newDelay
                }))
              }))
            };
            return updatedNode;
          }
          
          if (node.type === 'media' && node.children) {
            const updatedNode = {
              ...node,
              accessDelay: newDelay,
              children: node.children.map(child => ({
                ...child,
                accessDelay: newDelay
              }))
            };
            return updatedNode;
          }

          return {
            ...node,
            accessDelay: newDelay
          };
        }

        const updatedNode = {
          ...node,
          children: node.children 
            ? node.children.map(child => updateNode(child))
            : undefined
        };

        // Recalculate content level access after updating delays
        if (updatedNode.type === 'content') {
          updatedNode.hasAccess = calculateContentAccess(updatedNode);
        }

        return updatedNode;
      };

      const updatedStructure = updateNode(prevStructure);
      
      // Ensure content level access is always calculated from its children
      if (updatedStructure.type === 'content') {
        updatedStructure.hasAccess = calculateContentAccess(updatedStructure);
      }
      
      return updatedStructure;
    });
  };

  const handleRemoveDrip = (targetNode: StructureNodeType) => {
    setStructure(prevStructure => {
      if (!prevStructure) return null;

      const updateNode = (currNode: StructureNodeType): StructureNodeType => {
        if (currNode.id === targetNode.id) {
          const { accessDelay, ...nodeWithoutDelay } = currNode;
          
          if (currNode.type === 'module') {
            const updatedNode = {
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
            return updatedNode;
          }
          
          if (currNode.type === 'media' && currNode.children) {
            const updatedNode = {
              ...nodeWithoutDelay,
              children: currNode.children.map(child => {
                const { accessDelay, ...childWithoutDelay } = child;
                return childWithoutDelay;
              })
            };
            return updatedNode;
          }
          
          return nodeWithoutDelay;
        }
        
        const updatedNode = {
          ...currNode,
          children: currNode.children 
            ? currNode.children.map(child => updateNode(child))
            : undefined
        };

        // Recalculate content level access after removing delays
        if (currNode.type === 'content') {
          updatedNode.hasAccess = calculateContentAccess(updatedNode);
        }

        return updatedNode;
      };

      return updateNode(prevStructure);
    });
  };

  const handleToggleAccess = (targetNode: StructureNodeType) => {
    setStructure(prevStructure => {
      if (!prevStructure) return null;

      const updateNode = (currNode: StructureNodeType): StructureNodeType => {
        if (currNode.id === targetNode.id) {
          const newAccessValue = currNode.hasAccess === false ? true : false;
          const updatedNode = {
            ...currNode,
            hasAccess: newAccessValue
          };

          // If this is a module, update all its descendants
          if (currNode.type === 'module') {
            updatedNode.children = currNode.children?.map(mediaGroup => ({
              ...mediaGroup,
              hasAccess: newAccessValue,
              children: mediaGroup.children?.map(mediaItem => ({
                ...mediaItem,
                hasAccess: newAccessValue
              }))
            }));
          }
          
          // If this is a media group, update all its media items
          if (currNode.type === 'media' && currNode.children) {
            updatedNode.children = currNode.children.map(mediaItem => ({
              ...mediaItem,
              hasAccess: newAccessValue
            }));
          }

          return updatedNode;
        }

        const updatedNode = {
          ...currNode,
          children: currNode.children?.map(child => updateNode(child))
        };

        // Recalculate content level access after toggling child access
        if (updatedNode.type === 'content') {
          updatedNode.hasAccess = calculateContentAccess(updatedNode);
        }

        return updatedNode;
      };

      const updatedStructure = updateNode(prevStructure);
      
      // Ensure content level access is always calculated from its children
      if (updatedStructure.type === 'content') {
        updatedStructure.hasAccess = calculateContentAccess(updatedStructure);
      }
      
      return updatedStructure;
    });
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
      <Header
        isEditMode={isEditMode}
        accessMethod={accessMethod}
        onEditModeToggle={() => {}} // No-op since edit mode is always true
        onAccessMethodChange={setAccessMethod}
        onSave={handleGrantAccess}
        isAdmin={isAdmin || false}
        isSuperAdmin={isSuperAdmin || false}
        hasExistingAccess={false}
      />

      <div ref={structureRef} className="relative">
        <StructureNode
          node={structure}
          level={0}
          hasAncestorWithNoAccess={false}
          isEditMode={isEditMode}
          accessMethod={accessMethod}
          structure={structure}
          isNewAccess={true}
          loadingNodes={loadingNodes}
          expandedNodes={expandedNodes}
          selectedNode={selectedNode}
          onNodeClick={handleNodeClick}
          onNodeSelect={setSelectedNode}
          onToggleExpansion={(nodeId) => {
            setExpandedNodes(prev => {
              const newSet = new Set(prev);
              if (newSet.has(nodeId)) {
                newSet.delete(nodeId);
              } else {
                newSet.add(nodeId);
              }
              return newSet;
            });
          }}
          onUpdateNodeAccessDelay={updateNodeAccessDelay}
          onRemoveDrip={handleRemoveDrip}
          onToggleAccess={handleToggleAccess}
        />
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
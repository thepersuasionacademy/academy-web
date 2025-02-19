import { useState, useEffect, useRef } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Loader2, AlertCircle } from 'lucide-react';
import { cn } from "@/lib/utils";
import { Toast } from "../../common/Toast";
import { StructureNode as StructureNodeType, AccessStructureViewProps, AccessMethod } from './types';
import { StructureNode } from './StructureNode';
import { Header } from './Header';

export function AccessStructureView({ 
  selectedType, 
  selectedId, 
  targetUserId, 
  onAccessGranted, 
  onRefreshContentHistory,
  isAdmin,
  isSuperAdmin 
}: AccessStructureViewProps) {
  const [structure, setStructure] = useState<StructureNodeType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accessMethod, setAccessMethod] = useState<AccessMethod>('instant');
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState((isAdmin || isSuperAdmin) ? true : false);
  const supabase = createClientComponentClient();
  const [loadingNodes, setLoadingNodes] = useState<Set<string>>(new Set());
  const structureRef = useRef<HTMLDivElement>(null);
  const [toastMessage, setToastMessage] = useState<string>('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [showToast, setShowToast] = useState(false);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (structureRef.current && !structureRef.current.contains(event.target as Node)) {
        setSelectedNode(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNodeDetails = async (nodeId: string, nodeType: StructureNodeType['type']) => {
    try {
      if (nodeType === 'content') {
        const { data: accessStructure, error: accessError } = await supabase
          .rpc('get_content_access_structure', {
            p_user_id: targetUserId || (await supabase.auth.getUser()).data.user?.id,
            p_content_id: nodeId
          });

        if (accessError) throw accessError;

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
          } as StructureNodeType;
        }

        const isNewAccess = !accessStructure;

        const contentNode: StructureNodeType = {
          id: streamingContent.content.id,
          name: streamingContent.content.title,
          type: 'content',
          order: 0,
          ...(isNewAccess ? {} : { hasAccess: accessStructure?.hasAccess }),
          ...(accessStructure?.accessDelay ? { accessDelay: accessStructure.accessDelay } : {}),
          isHidden: streamingContent.content.is_hidden,
          children: streamingContent.modules?.map((module: any, index: number) => {
            const moduleAccess = accessStructure?.children?.find((m: any) => m.id === module.id);
            
            return {
              id: module.id,
              name: module.title,
              type: 'module' as const,
              order: module.order || index,
              hasAccess: isNewAccess ? true : moduleAccess?.hasAccess,
              ...(moduleAccess?.accessDelay ? { accessDelay: moduleAccess.accessDelay } : {}),
              isHidden: module.is_hidden,
              children: module.media?.map((media: any, mediaIndex: number) => {
                const mediaAccess = moduleAccess?.children?.find((m: any) => m.id === media.id);
                
                const mediaItems = [];
                
                if (media.video_id) {
                  mediaItems.push({
                    id: `${media.id}-video`,
                    name: media.video_name || 'Video',
                    type: 'media' as const,
                    order: 0,
                    mediaType: 'video',
                    hasAccess: isNewAccess ? true : mediaAccess?.hasAccess,
                    ...(mediaAccess?.accessDelay ? { accessDelay: mediaAccess.accessDelay } : {}),
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
                    hasAccess: isNewAccess ? true : mediaAccess?.hasAccess,
                    ...(mediaAccess?.accessDelay ? { accessDelay: mediaAccess.accessDelay } : {}),
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
                    hasAccess: isNewAccess ? true : mediaAccess?.hasAccess,
                    ...(mediaAccess?.accessDelay ? { accessDelay: mediaAccess.accessDelay } : {}),
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
                    hasAccess: isNewAccess ? true : mediaAccess?.hasAccess,
                    ...(mediaAccess?.accessDelay ? { accessDelay: mediaAccess.accessDelay } : {}),
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
                    hasAccess: isNewAccess ? true : mediaAccess?.hasAccess,
                    ...(mediaAccess?.accessDelay ? { accessDelay: mediaAccess.accessDelay } : {}),
                    isHidden: media.is_hidden
                  });
                }

                return {
                  id: media.id,
                  name: media.title,
                  type: 'media' as const,
                  order: mediaIndex,
                  hasAccess: isNewAccess ? true : mediaAccess?.hasAccess,
                  ...(mediaAccess?.accessDelay ? { accessDelay: mediaAccess.accessDelay } : {}),
                  isHidden: media.is_hidden,
                  children: mediaItems
                };
              })
            };
          })
        };

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

        const { data: accessStructure } = await supabase
          .rpc('get_content_access_structure', {
            p_user_id: targetUserId || (await supabase.auth.getUser()).data.user?.id,
            p_content_id: selectedId
          });

        // Reset edit mode based on access structure and admin status
        if (!accessStructure && (isAdmin || isSuperAdmin)) {
          setIsEditMode(true);
        } else {
          setIsEditMode(false);
        }
        
        // Reset access method based on drip settings
        if (accessStructure) {
          const hasDripSettings = (node: any): boolean => {
            if (node.accessDelay?.value > 0) return true;
            if (node.children) {
              return node.children.some((child: any) => hasDripSettings(child));
            }
            return false;
          };
          
          setAccessMethod(hasDripSettings(accessStructure) ? 'drip' : 'instant');
        } else {
          setAccessMethod('instant');
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

    // Reset states when selectedId changes
    setSelectedNode(null);
    setExpandedNodes(new Set());
    fetchStructure();
  }, [selectedId, selectedType, targetUserId, isAdmin, isSuperAdmin]);

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

      console.log('Sending structure to database:', JSON.stringify(transformedNodes, null, 2));

      const { data, error } = await supabase.rpc('grant_user_access', {
        p_user_id: effectiveUserId,
        p_content_structure: transformedNodes,
        p_granted_by: user.id
      });

      if (data) {
        console.log('Response from database:', JSON.stringify(data, null, 2));
      }

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
            return {
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
          }
          
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

  const handleRemoveDrip = (targetNode: StructureNodeType) => {
    setStructure(prevStructure => {
      if (!prevStructure) return null;

      const updateNode = (currNode: StructureNodeType): StructureNodeType => {
        if (currNode.id === targetNode.id) {
          const { accessDelay, ...nodeWithoutDelay } = currNode;
          
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

  const handleToggleAccess = (targetNode: StructureNodeType) => {
    setStructure(prevStructure => {
      if (!prevStructure) return null;

      const updateNode = (currNode: StructureNodeType): StructureNodeType => {
        if (currNode.id === targetNode.id) {
          if (currNode.type === 'content') {
            return {
              ...currNode,
              hasAccess: currNode.hasAccess === false ? true : false
            };
          }
          return {
            ...currNode,
            hasAccess: currNode.hasAccess === false ? true : false
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
        onEditModeToggle={() => setIsEditMode(!isEditMode)}
        onAccessMethodChange={setAccessMethod}
        onSave={handleGrantAccess}
        isAdmin={isAdmin || false}
        isSuperAdmin={isSuperAdmin || false}
        hasExistingAccess={structure?.hasAccess !== undefined}
      />

      <div ref={structureRef} className="relative">
        <StructureNode
          node={structure}
          level={0}
          hasAncestorWithNoAccess={false}
          isEditMode={isEditMode}
          accessMethod={accessMethod}
          structure={structure}
          isNewAccess={!structure?.hasAccess && structure?.type === 'content'}
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
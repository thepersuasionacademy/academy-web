import { useState, useEffect, useRef } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Loader2, AlertCircle, Pencil, ChevronDown } from 'lucide-react';
import { cn } from "@/lib/utils";
import { Toast } from "../../common/Toast";
import { StructureNode as StructureNodeType, AccessStructureViewProps, AccessMethod } from './types';
import { StructureNode } from './StructureNode';
import { Header } from './Header';
import { AccessStructureView } from './AccessStructureView';

interface AccessStructureEditorProps extends Omit<AccessStructureViewProps, 'onAccessGranted'> {
  isNewAccess?: boolean;
}

interface AccessOverride {
  status: 'locked' | 'pending';
  delay?: {
    value: number;
    unit: 'days' | 'weeks' | 'months';
  };
}

interface AccessOverrides {
  modules: Record<string, AccessOverride>;
  media: Record<string, AccessOverride>;
}

interface HeaderProps {
  isEditMode: boolean;
  accessMethod: AccessMethod;
  onEditModeToggle: () => void;
  onAccessMethodChange: (method: AccessMethod) => void;
  onSave: () => void;
  onPreview: () => void;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  hasExistingAccess: boolean;
  isNewAccess: boolean;
}

export function AccessStructureEditor({ 
  selectedType, 
  selectedId, 
  targetUserId, 
  onRefreshContentHistory,
  isAdmin = false,
  isSuperAdmin = false,
  isNewAccess = false
}: AccessStructureEditorProps) {
  const [structure, setStructure] = useState<StructureNodeType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accessMethod, setAccessMethod] = useState<AccessMethod>('instant');
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(isNewAccess || (isAdmin || isSuperAdmin));
  const supabase = createClientComponentClient();
  const [loadingNodes, setLoadingNodes] = useState<Set<string>>(new Set());
  const structureRef = useRef<HTMLDivElement>(null);
  const [toastMessage, setToastMessage] = useState<string>('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [showToast, setShowToast] = useState(false);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [showPreview, setShowPreview] = useState(false);

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
          return mediaGroup.children?.every(mediaItem => 
            mediaItem.hasAccess !== false
          ) ?? true;
        }) ?? true;
      });
    }
    
    // For other node types, check immediate children
    return node.children.every(child => child.hasAccess !== false);
  };

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
        // For existing access, fetch current access structure
        let accessStructure = null;
        if (!isNewAccess) {
          const { data, error: accessError } = await supabase
            .rpc('get_content_access_structure', {
              p_user_id: targetUserId || (await supabase.auth.getUser()).data.user?.id,
              p_content_id: nodeId
            });
          if (accessError) throw accessError;
          accessStructure = data;
        }

        const { data: streamingContent, error: streamingError } = await supabase
          .rpc('get_streaming_content', {
            p_content_id: nodeId
          });

        if (streamingError) {
          console.error('Error fetching streaming content:', streamingError);
          return null;
        }

        const contentNode: StructureNodeType = {
          id: streamingContent.content.id,
          name: streamingContent.content.title,
          type: 'content',
          order: 0,
          hasAccess: isNewAccess ? true : accessStructure?.hasAccess ?? true,
          ...(accessStructure?.accessDelay ? { accessDelay: accessStructure.accessDelay } : {}),
          isHidden: streamingContent.content.is_hidden ?? false,
          children: streamingContent.modules?.map((module: any, index: number) => {
            const moduleAccess = accessStructure?.children?.find((m: any) => m.id === module.id);
            
            return {
              id: module.id,
              name: module.title,
              type: 'module' as const,
              order: module.order || index,
              hasAccess: isNewAccess ? true : moduleAccess?.hasAccess ?? true,
              ...(moduleAccess?.accessDelay ? { accessDelay: moduleAccess.accessDelay } : {}),
              isHidden: module.is_hidden ?? false,
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
                    hasAccess: isNewAccess ? true : mediaAccess?.hasAccess ?? true,
                    ...(mediaAccess?.accessDelay ? { accessDelay: mediaAccess.accessDelay } : {}),
                    isHidden: media.is_hidden ?? false
                  });
                }

                if (media.content_text) {
                  mediaItems.push({
                    id: `${media.id}-text`,
                    name: media.text_title || 'Text Content',
                    type: 'media' as const,
                    order: 1,
                    mediaType: 'text',
                    hasAccess: isNewAccess ? true : mediaAccess?.hasAccess ?? true,
                    ...(mediaAccess?.accessDelay ? { accessDelay: mediaAccess.accessDelay } : {}),
                    isHidden: media.is_hidden ?? false
                  });
                }

                if (media.tool) {
                  mediaItems.push({
                    id: `${media.id}-tool`,
                    name: media.tool.title || 'AI Tool',
                    type: 'media' as const,
                    order: 2,
                    mediaType: 'tool',
                    hasAccess: isNewAccess ? true : mediaAccess?.hasAccess ?? true,
                    ...(mediaAccess?.accessDelay ? { accessDelay: mediaAccess.accessDelay } : {}),
                    isHidden: media.is_hidden ?? false
                  });
                }

                if (media.pdf_url) {
                  mediaItems.push({
                    id: `${media.id}-pdf`,
                    name: media.pdf_title || 'PDF',
                    type: 'media' as const,
                    order: 3,
                    mediaType: 'pdf',
                    hasAccess: isNewAccess ? true : mediaAccess?.hasAccess ?? true,
                    ...(mediaAccess?.accessDelay ? { accessDelay: mediaAccess.accessDelay } : {}),
                    isHidden: media.is_hidden ?? false
                  });
                }

                if (media.quiz_data) {
                  mediaItems.push({
                    id: `${media.id}-quiz`,
                    name: media.quiz_title || 'Quiz',
                    type: 'media' as const,
                    order: 4,
                    mediaType: 'quiz',
                    hasAccess: isNewAccess ? true : mediaAccess?.hasAccess ?? true,
                    ...(mediaAccess?.accessDelay ? { accessDelay: mediaAccess.accessDelay } : {}),
                    isHidden: media.is_hidden ?? false
                  });
                }

                return {
                  id: media.id,
                  name: media.title,
                  type: 'media' as const,
                  order: mediaIndex,
                  hasAccess: isNewAccess ? true : mediaAccess?.hasAccess ?? true,
                  ...(mediaAccess?.accessDelay ? { accessDelay: mediaAccess.accessDelay } : {}),
                  isHidden: media.is_hidden ?? false,
                  children: mediaItems
                };
              }) || []
            };
          }) || []
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

        // For existing access, check current access state
        if (!isNewAccess) {
          const { data: accessData } = await supabase
            .rpc('check_user_access', {
              p_user_id: targetUserId || (await supabase.auth.getUser()).data.user?.id,
              p_content_id: selectedId
            });

          // Reset edit mode based on access structure and admin status
          if (!accessData && (isAdmin || isSuperAdmin)) {
            setIsEditMode(true);
          } else {
            setIsEditMode(false);
          }
          
          // Reset access method based on overrides
          if (accessData?.access_overrides) {
            const hasDripSettings = (overrides: AccessOverrides): boolean => {
              if (!overrides) return false;
              
              // Check modules
              if (overrides.modules) {
                for (const [, value] of Object.entries(overrides.modules)) {
                  if (value.status === 'pending') return true;
                }
              }
              
              // Check media
              if (overrides.media) {
                for (const [, value] of Object.entries(overrides.media)) {
                  if (value.status === 'pending') return true;
                }
              }
              
              return false;
            };
            
            setAccessMethod(hasDripSettings(accessData.access_overrides) ? 'drip' : 'instant');
          } else {
            setAccessMethod('instant');
          }
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
  }, [selectedId, selectedType, targetUserId, isAdmin, isSuperAdmin, isNewAccess]);

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

      // Convert the structure to access_overrides format
      const buildOverrides = (node: StructureNodeType): AccessOverrides => {
        const overrides: AccessOverrides = {
          modules: {},
          media: {}
        };

        const processNode = (currNode: StructureNodeType) => {
          // Skip content level overrides - content is always accessible
          if (currNode.type === 'content') {
            if (currNode.children) {
              currNode.children.forEach(child => processNode(child));
            }
            return;
          }

          if (currNode.type === 'module' && currNode.hasAccess === false) {
            overrides.modules[currNode.id] = {
              status: 'locked'
            };
          } else if (currNode.type === 'module' && currNode.accessDelay) {
            overrides.modules[currNode.id] = {
              status: 'pending',
              delay: currNode.accessDelay
            };
          }

          if (currNode.type === 'media' && !currNode.mediaType) {
            if (currNode.hasAccess === false) {
              overrides.media[currNode.id] = {
                status: 'locked'
              };
            } else if (currNode.accessDelay) {
              overrides.media[currNode.id] = {
                status: 'pending',
                delay: currNode.accessDelay
              };
            }
          }

          if (currNode.children) {
            currNode.children.forEach(child => processNode(child));
          }
        };

        processNode(node);
        return overrides;
      };

      const access_overrides = buildOverrides(structure);

      // Calculate access_starts_at based on content level delay
      const access_starts_at = structure.accessDelay 
        ? new Date(Date.now() + (structure.accessDelay.value * 24 * 60 * 60 * 1000))
        : new Date();

      const { data, error } = await supabase.rpc('grant_user_access', {
        p_user_id: effectiveUserId,
        p_content_id: structure.id,
        p_granted_by: user.id,
        p_access_overrides: access_overrides,
        p_access_starts_at: access_starts_at.toISOString()
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
          // Prevent toggling access for content level
          if (currNode.type === 'content') {
            return currNode;
          }

          const newAccessValue = currNode.hasAccess === false ? true : false;
          const updatedNode = {
            ...currNode,
            hasAccess: newAccessValue
          };

          // If this is a module or media, update all its descendants
          if (currNode.type === 'module' || currNode.type === 'media') {
            updatedNode.children = currNode.children?.map(child => ({
              ...child,
              hasAccess: newAccessValue,
              children: child.children?.map(grandChild => ({
                ...grandChild,
                hasAccess: newAccessValue
              }))
            }));
          }

          return updatedNode;
        }

        if (currNode.children) {
          return {
            ...currNode,
            children: currNode.children.map(child => updateNode(child))
          };
        }

        return currNode;
      };

      const updatedStructure = updateNode(prevStructure);
      return updatedStructure;
    });
  };

  if (showPreview) {
    return (
      <div className="p-8 rounded-xl border border-[var(--border-color)] bg-[var(--background)]">
        {(isAdmin || isSuperAdmin) && (
          <div className="flex justify-center mb-4">
            <button
              onClick={() => setShowPreview(false)}
              className="flex items-center gap-1 text-sm font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
            >
              Edit
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        )}
        <div className="relative">
          <AccessStructureView
            selectedType={selectedType}
            selectedId={selectedId}
            targetUserId={targetUserId}
            isAdmin={false}
            isSuperAdmin={false}
          />
        </div>
      </div>
    );
  }

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
        onPreview={() => setShowPreview(true)}
        isAdmin={isAdmin}
        isSuperAdmin={isSuperAdmin}
        hasExistingAccess={Boolean(!isNewAccess && structure?.hasAccess)}
        isNewAccess={isNewAccess}
      />

      <div ref={structureRef} className="relative">
        <StructureNode
          node={structure}
          level={0}
          hasAncestorWithNoAccess={false}
          isEditMode={isEditMode}
          accessMethod={accessMethod}
          structure={structure}
          isNewAccess={Boolean(isNewAccess)}
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
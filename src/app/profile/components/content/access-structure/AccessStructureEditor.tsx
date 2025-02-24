import { useState, useEffect, useRef } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Loader2, AlertCircle, Pencil, ChevronDown } from 'lucide-react';
import { cn } from "@/lib/utils";
import { Toast } from "../../common/Toast";
import { StructureNode as StructureNodeType, AccessStructureViewProps, AccessMethod } from './types';
import { StructureNode } from './StructureNode';
import { Header } from './Header';
import { AccessStructureView } from './AccessStructureView';
import { SaveTemplateModal } from './SaveTemplateModal';
import { TemplateList } from './TemplateList';

interface AccessStructureEditorProps extends Omit<AccessStructureViewProps, 'onAccessGranted'> {
  isNewAccess?: boolean;
  initialStructure?: StructureNodeType;
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
  onSaveTemplate: () => void;
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
  isNewAccess = false,
  initialStructure
}: AccessStructureEditorProps) {
  const [structure, setStructure] = useState<StructureNodeType | null>(initialStructure || null);
  const [isLoading, setIsLoading] = useState(!initialStructure);
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
  const [showTemplateModal, setShowTemplateModal] = useState(false);

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
        // Get the full access structure including drip settings
        const { data: accessData, error: accessError } = await supabase
          .rpc('get_content_access_structure', {
            p_content_id: nodeId,
            p_user_id: targetUserId || (await supabase.auth.getUser()).data.user?.id
          });

        if (accessError) throw accessError;
        if (!accessData) return null;

        // Transform raw data into structure with drip settings
        const contentNode: StructureNodeType = {
          id: accessData.content.id,
          name: accessData.content.title,
          type: 'content',
          order: 0,
          hasAccess: true,
          children: accessData.modules?.map((module: any, index: number) => {
            const moduleOverride = accessData.user_access?.access_overrides?.modules?.[module.id];
            const moduleAccess = moduleOverride?.status !== 'locked';
            const moduleDelay = moduleOverride?.status === 'pending' ? moduleOverride.delay : undefined;
            
            return {
              id: module.id,
              name: module.title,
              type: 'module' as const,
              order: module.order || index,
              hasAccess: moduleAccess,
              ...(moduleDelay && { accessDelay: moduleDelay }),
              children: module.media?.map((media: any, mediaIndex: number) => {
                const mediaOverride = accessData.user_access?.access_overrides?.media?.[media.id];
                const mediaAccess = mediaOverride?.status !== 'locked';
                const mediaDelay = mediaOverride?.status === 'pending' ? mediaOverride.delay : undefined;

                return {
                  id: media.id,
                  name: media.title,
                  type: 'media' as const,
                  order: mediaIndex,
                  hasAccess: mediaAccess,
                  ...(mediaDelay && { accessDelay: mediaDelay }),
                  children: []
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
      if (initialStructure) {
        // For instant access mode, ensure all nodes are accessible
        if (accessMethod === 'instant') {
          const makeAllAccessible = (node: StructureNodeType): StructureNodeType => ({
            ...node,
            hasAccess: true,
            children: node.children?.map(makeAllAccessible) || []
          });
          setStructure(makeAllAccessible(initialStructure));
        } else {
          setStructure(initialStructure);
        }
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        if (!selectedId) {
          setIsLoading(false);
          return;
        }

        // For existing access in drip mode, check current access state
        if (!isNewAccess && accessMethod === 'drip') {
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
          }
        }

        // Get the content structure
        const { data: contentData, error: contentError } = await supabase
          .rpc('get_content_structure', {
            p_content_id: selectedId
          });

        if (contentError) throw contentError;
        if (!contentData) throw new Error('No content structure found');

        // Transform raw data into structure, setting all nodes as accessible for instant access
        const contentNode: StructureNodeType = {
          id: contentData.content.id,
          name: contentData.content.title,
          type: 'content',
          order: 0,
          hasAccess: true,
          children: contentData.modules?.map((module: any, index: number) => ({
            id: module.id,
            name: module.title,
            type: 'module' as const,
            order: module.order || index,
            hasAccess: true,
            children: module.media?.map((media: any, mediaIndex: number) => ({
              id: media.id,
              name: media.title,
              type: 'media' as const,
              order: mediaIndex,
              hasAccess: true,
              children: []
            })) || []
          })) || []
        };

        setStructure(contentNode);
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
  }, [selectedId, selectedType, targetUserId, isAdmin, isSuperAdmin, isNewAccess, initialStructure, accessMethod]);

  // Add effect to handle access method changes
  useEffect(() => {
    if (structure && accessMethod === 'instant') {
      // When switching to instant mode, make all nodes accessible
      const makeAllAccessible = (node: StructureNodeType): StructureNodeType => ({
        ...node,
        hasAccess: true,
        children: node.children?.map(makeAllAccessible) || []
      });
      setStructure(makeAllAccessible(structure));
    }
  }, [accessMethod]);

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

  const buildOverrides = (node: StructureNodeType): AccessOverrides => {
    const overrides: AccessOverrides = {
      modules: {},
      media: {}
    };

    const processNode = (currNode: StructureNodeType) => {
      // Handle module nodes
      if (currNode.type === 'module') {
        if (!currNode.hasAccess) {
          overrides.modules[currNode.id] = {
            status: 'locked'
          };
        } else if (currNode.accessDelay) {
          overrides.modules[currNode.id] = {
            status: 'pending',
            delay: currNode.accessDelay
          };
        }
      }
      // Handle media nodes
      else if (currNode.type === 'media') {
        if (!currNode.hasAccess) {
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

      currNode.children?.forEach(processNode);
    };

    processNode(node);
    return overrides;
  };

  const handleGrantAccess = async () => {
    try {
      const overrides = buildOverrides(structure!);
      const { data: user } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .rpc('grant_user_access', {
          p_user_id: targetUserId || user.user?.id,
          p_content_id: selectedId,
          p_granted_by: user.user?.id,
          p_access_overrides: overrides
        });

      if (error) throw error;

      setToastMessage('Access settings saved successfully');
      setToastType('success');
      setShowToast(true);
      
      if (onRefreshContentHistory) {
        onRefreshContentHistory();
      }
    } catch (err) {
      console.error('Error granting access:', err);
      setToastMessage('Failed to save access settings');
      setToastType('error');
      setShowToast(true);
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

  const handleSaveTemplate = async (templateName: string) => {
    try {
      // Build overrides from current structure state, exactly like regular save
      const overrides = buildOverrides(structure!);
      
      const { data, error } = await supabase
        .rpc('save_content_template', {
          p_name: templateName,
          p_content_id: selectedId,
          p_access_overrides: overrides
        });

      if (error) {
        console.error('Template save error:', error);
        throw error;
      }

      setToastMessage('Template saved successfully');
      setToastType('success');
      setShowToast(true);
      
      // Close the modal
      setShowTemplateModal(false);
    } catch (err) {
      console.error('Error saving template:', err);
      setToastMessage('Failed to save template');
      setToastType('error');
      setShowToast(true);
    }
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
    <>
      <div className="p-8 rounded-xl border border-[var(--border-color)] bg-[var(--background)]" ref={structureRef}>
        <Header
          isEditMode={isEditMode}
          accessMethod={accessMethod}
          onEditModeToggle={() => setIsEditMode(!isEditMode)}
          onAccessMethodChange={setAccessMethod}
          onSave={handleGrantAccess}
          onSaveTemplate={() => setShowTemplateModal(true)}
          onPreview={() => setShowPreview(true)}
          isAdmin={isAdmin}
          isSuperAdmin={isSuperAdmin}
          hasExistingAccess={false}
          isNewAccess={isNewAccess}
        />
        {accessMethod === 'drip' && (
          <TemplateList 
            contentId={selectedId}
            onTemplateSelect={(template) => {
              // Apply the template's access overrides to the current structure
              const makeStructureFromTemplate = (node: StructureNodeType): StructureNodeType => {
                const moduleOverride = template.access_overrides.modules?.[node.id];
                const mediaOverride = template.access_overrides.media?.[node.id];
                
                return {
                  ...node,
                  hasAccess: moduleOverride?.status !== 'locked' && mediaOverride?.status !== 'locked',
                  ...(moduleOverride?.status === 'pending' && { 
                    accessDelay: moduleOverride.delay 
                  }),
                  ...(mediaOverride?.status === 'pending' && { 
                    accessDelay: mediaOverride.delay 
                  }),
                  children: node.children?.map(makeStructureFromTemplate) || []
                };
              };
              
              setStructure(prevStructure => 
                prevStructure ? makeStructureFromTemplate(prevStructure) : null
              );
            }}
          />
        )}
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
      </div>

      <SaveTemplateModal
        isOpen={showTemplateModal}
        onClose={() => setShowTemplateModal(false)}
        onSave={handleSaveTemplate}
      />

      {showToast && (
        <Toast
          message={toastMessage}
          type={toastType}
          onClose={() => setShowToast(false)}
        />
      )}
    </>
  );
} 
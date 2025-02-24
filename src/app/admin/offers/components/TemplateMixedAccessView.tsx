/**
 * TemplateMixedAccessView Component
 * 
 * This component displays a view-only representation of content structure with template access overrides.
 * It shows the hierarchical structure of content, modules, and media items, with visual indicators for access status.
 * 
 * Usage:
 * <TemplateMixedAccessView templateId="uuid-of-template" contentId="uuid-of-content" />
 * 
 * Props:
 * - templateId: UUID of the template containing access overrides
 * - contentId: UUID of the content whose structure is being displayed
 * - className: Optional CSS classes to apply to the component
 * - templateData: Optional template data to process instead of fetching from the API
 * 
 * Requirements:
 * - Requires a 'get_mixed_template_structure' RPC function to be implemented in the Supabase database
 * - Falls back to using 'get_content_access_structure' if templateId is not provided
 */

'use client'

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Loader2, AlertCircle, Clock, ChevronDown } from 'lucide-react';
import { cn } from "@/lib/utils";
import { NodeTypeIcon } from '@/app/profile/components/content/access-structure/NodeTypeIcon';

interface TemplateMixedAccessViewProps {
  templateId: string;
  contentId: string;
  className?: string;
  templateData?: any;
}

interface AccessNode {
  id: string;
  name: string;
  type: 'content' | 'module' | 'media';
  has_access: boolean;
  order?: number;
  access_delay?: {
    value: number;
    unit: string;
  };
  children?: AccessNode[];
  debug_info?: {
    access_starts_at: string | null;
    access_overrides: Record<string, any>;
  };
}

interface RawModule {
  id: string;
  title: string;
  order: number;
  content_id: string;
}

interface RawMedia {
  id: string;
  title: string;
  order: number;
  module_id: string;
  content_id: string;
}

const formatReleaseDate = (accessStartsAt: string, delay: { value: number; unit: string }) => {
  const accessDate = new Date(accessStartsAt);
  
  // Add delay to access start date
  switch (delay.unit) {
    case 'days':
      accessDate.setDate(accessDate.getDate() + delay.value);
      break;
    case 'weeks':
      accessDate.setDate(accessDate.getDate() + (delay.value * 7));
      break;
    case 'months':
      accessDate.setMonth(accessDate.getMonth() + delay.value);
      break;
  }
  
  return accessDate.toLocaleDateString('en-US', { 
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
};

export function TemplateMixedAccessView({ 
  templateId,
  contentId,
  className,
  templateData
}: TemplateMixedAccessViewProps) {
  const [structure, setStructure] = useState<AccessNode | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const supabase = createClientComponentClient();

  // Process templateData if provided
  useEffect(() => {
    // If contentId is missing, show an error
    if (!contentId) {
      setError('Content ID is required');
      setIsLoading(false);
      return;
    }

    if (templateData) {
      try {
        processRawData(templateData);
        return; // Skip the API call
      } catch (err) {
        console.error('Error processing provided template data:', err);
        // Continue with the normal flow to fetch data
      }
    }

    fetchMixedStructure();
  }, [contentId, templateId, templateData]);

  // Extract the data processing logic into a separate function
  const processRawData = (rawData: any) => {
    try {
      // Validate the structure contains required properties
      if (!rawData?.content?.id || !rawData?.content?.title) {
        setError('Invalid data structure received');
        setIsLoading(false);
        return;
      }

      // Transform raw data into AccessNode structure
      const transformedStructure: AccessNode = {
        id: rawData.content.id,
        name: rawData.content.title,
        type: 'content',
        has_access: true,
        order: 0,
        debug_info: {
          access_starts_at: rawData.user_access?.access_starts_at || null,
          access_overrides: rawData.user_access?.access_overrides || {}
        },
        children: (rawData.modules || [])
          .sort((a: RawModule, b: RawModule) => (a.order || 0) - (b.order || 0))
          .map((module: RawModule) => {
            // Get all media items for this module
            const moduleMedia = (rawData.media || [])
              .filter((m: RawMedia) => m.module_id === module.id)
              .sort((a: RawMedia, b: RawMedia) => (a.order || 0) - (b.order || 0));

            return {
              id: module.id,
              name: module.title,
              type: 'module' as const,
              has_access: true, // Modules inherit from content
              order: module.order || 0,
              children: moduleMedia.map((media: RawMedia) => {
                // Check for media overrides
                const override = rawData.user_access?.access_overrides?.media?.[media.id];
                const isLocked = override?.status === 'locked';
                const isPending = override?.status === 'pending';

                return {
                  id: media.id,
                  name: media.title,
                  type: 'media' as const,
                  has_access: !isLocked && !isPending,
                  order: media.order || 0,
                  debug_info: {
                    access_starts_at: rawData.user_access?.access_starts_at || null,
                    access_overrides: override ? { [media.id]: override } : {}
                  },
                  ...(isPending && override?.delay ? {
                    access_delay: {
                      value: override.delay.value,
                      unit: override.delay.unit
                    }
                  } : {})
                };
              })
            };
          })
      };

      setStructure(transformedStructure);
      setIsLoading(false);
    } catch (err) {
      console.error('Error processing data:', err);
      setError('Failed to process access structure');
      setIsLoading(false);
    }
  };

  // Move the fetch logic to a separate function
  async function fetchMixedStructure() {
    try {
      setIsLoading(true);
      setError(null);

      let rawData;
      let rpcError = null;
      
      if (contentId && templateId) {
        // Use the new RPC when both contentId and templateId are provided
        const response = await supabase
          .rpc('get_mixed_template_structure', {
            p_content_id: contentId,
            p_template_id: templateId
          });
          
        if (response.error) rpcError = response.error;
        rawData = response.data;
      } else {
        // Use the existing RPC when only contentId is provided
        const response = await supabase
          .rpc('get_content_access_structure', {
            p_content_id: contentId
          });
          
        if (response.error) rpcError = response.error;
        rawData = response.data;
      }

      // Handle any RPC errors
      if (rpcError) throw rpcError;
      
      // Process the fetched data
      processRawData(rawData);
    } catch (err) {
      console.error('Error fetching mixed access structure:', err);
      setError('Failed to load access structure');
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[200px]">
        <div className="flex items-center gap-2 text-[var(--text-secondary)]">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[200px] gap-4">
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
      <div className="flex flex-col items-center justify-center h-full min-h-[200px] gap-4">
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
      if (!node.has_access && node.access_delay?.value) return 'bg-blue-500';

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
            "bg-transparent transition-colors",
            level > 0 && "border border-[var(--border-color)]",
            level === 0 && "mb-4",
            !node.has_access && "opacity-70",
            isMediaGroup && "cursor-pointer hover:bg-[var(--hover-bg)]"
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
                <NodeTypeIcon hasNoAccess={!node.has_access} />
              </div>
            )}
            <div className="flex flex-col flex-1 min-w-0">
              <div className="flex items-center justify-between gap-4">
                <span className={cn(
                  "transition-colors truncate",
                  level === 0 ? "text-2xl font-semibold" : "text-lg",
                  "text-[var(--foreground)]",
                  !node.has_access && "text-[var(--muted-foreground)]"
                )}>{node.name}</span>
              </div>
              {!node.has_access && node.access_delay?.value && node.debug_info?.access_starts_at && (
                <div className="flex items-center gap-1 text-sm text-[var(--muted-foreground)]">
                  <Clock className="w-3 h-3" />
                  <span>Available after {node.access_delay.value} {node.access_delay.unit}</span>
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

  return (
    <div className={cn(
      "border-0 bg-transparent",
      className
    )}>
      <div className="relative">
        {renderNode(structure)}
      </div>
    </div>
  );
} 
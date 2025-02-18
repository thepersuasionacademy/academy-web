import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown, Clock, Film, Book, FileText, Wrench, HelpCircle } from 'lucide-react';
import { cn } from "@/lib/utils";
import { AddAccessModal } from '../content/AddAccessModal';
import { AccessStructureView } from '../content/AccessStructureView';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface ContentGroup {
  content_id: string;
  content_title: string;
  collection_id: string | null;
  collection_name: string | null;
  granted_at: string;
  access_starts_at: string;
}

interface StructureNode {
  id: string;
  name: string;
  type: 'collection' | 'content' | 'module' | 'media';
  order: number;
  hasAccess?: boolean;
  accessDelay?: {
    value: number;
    unit: 'days' | 'weeks' | 'months';
  };
  children?: StructureNode[];
  mediaType?: string;
}

interface ContentModule {
  id: string;
  title: string;
  order: number;
  has_access: boolean;
  access_date?: string;
  media: ContentMedia[];
}

interface ContentMedia {
  id: string;
  title: string;
  order: number;
  has_access: boolean;
  access_date?: string;
}

interface ContentRecord {
  content_id: string;
  content_title: string;
  content_type: string;
  collection_name: string;
  granted_at: string;
  access_starts_at: string;
  modules: ContentModule[];
}

interface ContentTabProps {
  isAdmin: boolean;
  userId?: string;
}

export function ContentTab({ isAdmin, userId }: ContentTabProps) {
  const [contentGroups, setContentGroups] = useState<ContentGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<ContentGroup | null>(null);
  const [showAccessModal, setShowAccessModal] = useState(false);
  const [selectedAccessType, setSelectedAccessType] = useState<'collection' | 'content' | null>(null);
  const [selectedAccessId, setSelectedAccessId] = useState<string | null>(null);
  const [contentStructure, setContentStructure] = useState<StructureNode | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClientComponentClient();

  // Fetch content groups when component mounts
  useEffect(() => {
    async function fetchContentGroups() {
      if (!userId) return;

      try {
        const { data, error } = await supabase.rpc('get_user_content_groups', {
          p_user_id: userId
        });

        if (error) throw error;
        setContentGroups(data || []);
      } catch (error) {
        console.error('Error fetching content groups:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchContentGroups();
  }, [userId, supabase]);

  // Fetch content structure when a group is selected
  useEffect(() => {
    async function fetchContentStructure() {
      if (!userId || !selectedGroup) return;

      try {
        setIsLoading(true);
        const { data, error } = await supabase.rpc('get_user_content', {
          p_user_id: userId
        });

        if (error) throw error;

        // Find the selected content in the returned data
        const selectedContent = data?.find((item: ContentRecord) => item.content_id === selectedGroup.content_id);
        if (selectedContent) {
          // Transform the data to match the structure we need
          const transformedStructure: StructureNode = {
            id: selectedContent.content_id,
            name: selectedContent.content_title,
            type: 'content',
            order: 0,
            hasAccess: true,
            children: selectedContent.modules?.map((module: ContentModule) => ({
              id: module.id,
              name: module.title,
              type: 'module' as const,
              order: module.order,
              hasAccess: module.has_access,
              accessDelay: module.access_date ? {
                value: Math.ceil((new Date(module.access_date).getTime() - new Date(selectedContent.access_starts_at).getTime()) / (1000 * 60 * 60 * 24)),
                unit: 'days' as const
              } : undefined,
              children: module.media?.map((media: ContentMedia) => ({
                id: media.id,
                name: media.title,
                type: 'media' as const,
                order: media.order,
                hasAccess: media.has_access,
                accessDelay: media.access_date ? {
                  value: Math.ceil((new Date(media.access_date).getTime() - new Date(selectedContent.access_starts_at).getTime()) / (1000 * 60 * 60 * 24)),
                  unit: 'days' as const
                } : undefined,
                children: []
              }))
            }))
          };
          setContentStructure(transformedStructure);
        }
      } catch (error) {
        console.error('Error fetching content structure:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchContentStructure();
  }, [selectedGroup, userId, supabase]);

  // Helper function for date formatting
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getAccessStatusColor = (node: StructureNode) => {
    if (!node.hasAccess) return 'bg-red-500'; // No access
    
    const startDate = node.accessDelay ? new Date(node.accessDelay.value) : null;
    if (startDate && startDate > new Date()) {
      return 'bg-orange-500'; // Pending access
    }
    
    return 'bg-green-500'; // Has access
  };

  const getRemainingDays = (startDate: string) => {
    const start = new Date(startDate);
    const now = new Date();
    const diffTime = start.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  return (
    <div className="grid grid-cols-12 gap-8">
      {/* Left Column - Recent History */}
      <div className="col-span-5">
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-medium text-[var(--text-secondary)]">Recent History</h3>
            {isAdmin && (
              <button
                onClick={() => setShowAccessModal(true)}
                className="px-4 py-2 bg-[var(--accent)] text-white rounded-lg hover:opacity-90 transition-opacity"
              >
                Add Access
              </button>
            )}
          </div>

          {isAdmin && showAccessModal && (
            <AddAccessModal
              onSubmit={(type, id) => {
                if (type === 'collection' || type === 'content') {
                  setSelectedAccessType(type);
                  setSelectedAccessId(id);
                  setSelectedGroup(null); // Clear any selected group when adding new access
                }
                setShowAccessModal(false);
              }}
              onCancel={() => {
                setShowAccessModal(false);
                setSelectedAccessType(null);
                setSelectedAccessId(null);
              }}
            />
          )}

          {contentGroups.length > 0 ? (
            <div className="space-y-4">
              {contentGroups.map((group) => (
                <div
                  key={group.content_id}
                  onClick={() => setSelectedGroup(group)}
                  className={cn(
                    "p-4 rounded-lg",
                    "border border-[var(--border-color)]",
                    "cursor-pointer",
                    "transition-all",
                    selectedGroup?.content_id === group.content_id 
                      ? 'border-[var(--accent)] bg-[var(--accent)]/5' 
                      : 'hover:border-[var(--accent)]'
                  )}
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                      <span>{group.collection_name || 'Uncategorized'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full" />
                        <span className="text-lg text-[var(--foreground)]">{group.content_title}</span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-[var(--text-secondary)]" />
                    </div>
                    <div className="text-sm text-[var(--text-secondary)]">
                      Added {formatDate(group.granted_at)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-[var(--text-secondary)]">
              {isLoading ? 'Loading...' : 'No content access available'}
            </div>
          )}
        </div>
      </div>

      {/* Right Column - Details */}
      <div className="col-span-7">
        {selectedAccessType && selectedAccessId ? (
          <AccessStructureView
            selectedType={selectedAccessType}
            selectedId={selectedAccessId}
            targetUserId={userId}
            isAdmin={isAdmin}
            isSuperAdmin={isAdmin}
            onRefreshContentHistory={() => {
              // Refresh content groups
              if (userId) {
                supabase.rpc('get_user_content_groups', {
                  p_user_id: userId
                }).then(({ data }) => {
                  if (data) setContentGroups(data);
                });
                // Clear the selection states after successful refresh
                setSelectedAccessType(null);
                setSelectedAccessId(null);
              }
            }}
          />
        ) : selectedGroup ? (
          <div className="rounded-xl border border-[var(--border-color)] bg-[var(--background)] p-8">
            {isLoading ? (
              <div className="flex items-center justify-center h-full min-h-[400px]">
                <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-[var(--accent)] border-t-transparent" />
                  <span>Loading content structure...</span>
                </div>
              </div>
            ) : contentStructure ? (
              <AccessStructureView
                selectedType="content"
                selectedId={selectedGroup.content_id}
                targetUserId={userId}
                isAdmin={isAdmin}
                isSuperAdmin={isAdmin}
                onRefreshContentHistory={() => {
                  // Refresh content groups
                  if (userId) {
                    supabase.rpc('get_user_content_groups', {
                      p_user_id: userId
                    }).then(({ data }) => {
                      if (data) setContentGroups(data);
                    });
                  }
                }}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-[var(--text-secondary)] text-lg">
                <p>No content structure available</p>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-xl border border-[var(--border-color)] bg-[var(--background)] p-8">
            <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-[var(--text-secondary)] text-lg">
              <p>Select an item to view details</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 
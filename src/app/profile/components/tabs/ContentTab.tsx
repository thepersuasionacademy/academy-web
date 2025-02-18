import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown, CheckCircle, Clock, FolderTree, Film, Book, FileText, Wrench, HelpCircle, Lock } from 'lucide-react';
import { cn } from "@/lib/utils";
import { AddAccessModal } from '../content/AddAccessModal';
import { AccessStructureView } from '../content/AccessStructureView';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface AccessItem {
  id: string;
  title: string;
  order: number;
  has_access: boolean;
  access_date: string | null;
  module_id?: string;
  type?: 'video' | 'text' | 'tool' | 'pdf' | 'quiz';
}

interface AccessRecord {
  id: string;
  content_id: string;
  content_title: string | null;
  content_type: string | null;
  collection_name: string | null;
  status: string;
  granted_by: string;
  granted_at: string;
  access_starts_at: string;
  access_ends_at: string | null;
  modules: AccessItem[] | null;
  media: AccessItem[] | null;
}

interface ContentTabProps {
  isAdmin: boolean;
  userId?: string;
  contentItems: any[];
}

export function ContentTab({ isAdmin, userId, contentItems }: ContentTabProps) {
  const [accessRecords, setAccessRecords] = useState<AccessRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<AccessRecord | null>(null);
  const [showAccessModal, setShowAccessModal] = useState(false);
  const [selectedAccessType, setSelectedAccessType] = useState<'collection' | 'content' | null>(null);
  const [selectedAccessId, setSelectedAccessId] = useState<string | null>(null);
  const [streamingContent, setStreamingContent] = useState<any>(null);
  const supabase = createClientComponentClient();

  useEffect(() => {
    // Use the contentItems directly instead of fetching
    setAccessRecords(contentItems);
  }, [contentItems]);

  useEffect(() => {
    async function fetchStreamingContent() {
      if (selectedRecord?.content_id) {
        try {
          // Get streaming content
          const { data: streamingData, error: streamingError } = await supabase
            .rpc('get_streaming_content_by_suite_id', {
              p_suite_id: selectedRecord.content_id
            });

          if (streamingError) throw streamingError;

          // Get user access data
          const { data: accessData, error: accessError } = await supabase
            .rpc('get_user_content', {
              p_user_id: userId
            });

          if (accessError) throw accessError;

          // Find the matching access record
          const userAccess = accessData.find((item: any) => item.content_id === selectedRecord.content_id);

          if (userAccess && streamingData) {
            // Merge streaming content with access information
            const mergedContent = {
              ...streamingData,
              has_access: userAccess.has_access ?? false,
              modules: streamingData.modules.map((module: any) => {
                const moduleAccess = userAccess.modules?.find((m: any) => m.id === module.id);
                const hasModuleAccess = userAccess.has_access || (moduleAccess?.has_access ?? false);
                
                const mediaItems = (module.media || []).flatMap((media: any) => {
                  const mediaAccess = userAccess.media?.find((m: any) => m.id === media.id);
                  const items = [];

                  // Add video if exists
                  if (media.video_id) {
                    items.push({
                      id: `${media.id}-video`,
                      title: media.video_name || 'Video',
                      type: 'media' as const,
                      order: media.order * 10,
                      mediaType: 'video',
                      has_access: hasModuleAccess || mediaAccess?.has_access || false,
                      access_date: !hasModuleAccess ? mediaAccess?.access_date : null
                    });
                  }

                  // Add text content if exists
                  if (media.text_title) {
                    items.push({
                      id: `${media.id}-text`,
                      title: media.text_title,
                      type: 'media' as const,
                      order: media.order * 10 + 1,
                      mediaType: 'text',
                      has_access: hasModuleAccess || mediaAccess?.has_access || false,
                      access_date: !hasModuleAccess ? mediaAccess?.access_date : null
                    });
                  }

                  // Add tool if exists
                  if (media.tool) {
                    items.push({
                      id: `${media.id}-tool`,
                      title: media.tool.title || 'AI Tool',
                      type: 'media' as const,
                      order: media.order * 10 + 2,
                      mediaType: 'tool',
                      has_access: hasModuleAccess || mediaAccess?.has_access || false,
                      access_date: !hasModuleAccess ? mediaAccess?.access_date : null
                    });
                  }

                  // Add PDF if exists
                  if (media.pdf_url) {
                    items.push({
                      id: `${media.id}-pdf`,
                      title: media.pdf_title || 'PDF',
                      type: 'media' as const,
                      order: media.order * 10 + 3,
                      mediaType: 'pdf',
                      has_access: hasModuleAccess || mediaAccess?.has_access || false,
                      access_date: !hasModuleAccess ? mediaAccess?.access_date : null
                    });
                  }

                  // Add quiz if exists
                  if (media.quiz_data) {
                    items.push({
                      id: `${media.id}-quiz`,
                      title: media.quiz_title || 'Quiz',
                      type: 'media' as const,
                      order: media.order * 10 + 4,
                      mediaType: 'quiz',
                      has_access: hasModuleAccess || mediaAccess?.has_access || false,
                      access_date: !hasModuleAccess ? mediaAccess?.access_date : null
                    });
                  }

                  return items;
                });

                // Sort media items by order
                mediaItems.sort((a: { order: number }, b: { order: number }) => a.order - b.order);

                return {
                  ...module,
                  has_access: hasModuleAccess,
                  access_date: !userAccess.has_access ? moduleAccess?.access_date : null,
                  media: mediaItems
                };
              })
            };

            setStreamingContent(mergedContent);
          }
        } catch (error) {
          console.error('Error fetching streaming content:', error);
        }
      }
    }

    fetchStreamingContent();
  }, [selectedRecord, supabase, userId]);

  // Helper function to determine media type
  const getMediaType = (media: any): AccessItem['type'] => {
    if (media.video_id) return 'video';
    if (media.content_text) return 'text';
    if (media.tool_id) return 'tool';
    if (media.pdf_url) return 'pdf';
    if (media.quiz_data) return 'quiz';
    return undefined;
  };

  // Helper function for date formatting
  const formatAccessDate = (date: string | null) => {
    if (!date) return 'Not scheduled';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Add this component for rendering the content structure
  const ContentStructureView = ({ record }: { record: AccessRecord }) => {
    const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());

    const calculateAccessPercentage = (content: any) => {
      let totalItems = 0;
      let accessibleItems = 0;

      // Count modules
      content.modules?.forEach((module: any) => {
        totalItems++;
        if (module.has_access) accessibleItems++;

        // Count media items
        module.media?.forEach((media: any) => {
          totalItems++;
          if (media.has_access || module.has_access) accessibleItems++;
        });
      });

      return totalItems > 0 ? Math.round((accessibleItems / totalItems) * 100) : 0;
    };

    const toggleModule = (moduleId: string) => {
      setExpandedModules(prev => {
        const newSet = new Set(prev);
        if (newSet.has(moduleId)) {
          newSet.delete(moduleId);
        } else {
          newSet.add(moduleId);
        }
        return newSet;
      });
    };

    const getMediaTypeIcon = (mediaType?: string, hasAccess?: boolean) => {
      const iconClasses = cn(
        "w-5 h-5",
        hasAccess === false
          ? "text-[var(--muted-foreground)]/70"
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
          return <FileText className={iconClasses} />;
      }
    };

    if (!streamingContent) {
      return (
        <div className="flex items-center justify-center h-full min-h-[400px]">
          <div className="flex items-center gap-2 text-[var(--text-secondary)]">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-[var(--accent)] border-t-transparent" />
            <span>Loading content structure...</span>
          </div>
        </div>
      );
    }

    return (
      <div className="p-8 rounded-xl border border-[var(--border-color)] bg-[var(--background)]">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-3xl font-medium text-[var(--foreground)]">Access Overview</h3>
        </div>

        {/* Content Structure Tree */}
        <div className="relative">
          {/* Root Content Node */}
          <div className="relative">
            <div className="group relative flex items-center justify-between py-3 px-4 border border-[var(--border-color)] rounded-lg bg-[var(--background)] shadow-sm mb-4">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <span className="text-2xl font-semibold text-[var(--foreground)] truncate">
                  {streamingContent.content.title || 'Untitled Content'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {calculateAccessPercentage(streamingContent) < 100 && (
                  <span className="text-lg font-medium text-[var(--foreground)]">
                    {calculateAccessPercentage(streamingContent)}%
                  </span>
                )}
                <div className="relative w-8 h-8">
                  <svg className="w-8 h-8 transform -rotate-90">
                    <circle
                      className="text-[var(--border-color)]"
                      strokeWidth="2"
                      stroke="currentColor"
                      fill="transparent"
                      r="14"
                      cx="16"
                      cy="16"
                    />
                    <circle
                      className="text-green-500"
                      strokeWidth="2"
                      strokeDasharray={`${2 * Math.PI * 14}`}
                      strokeDashoffset={`${2 * Math.PI * 14 * (1 - calculateAccessPercentage(streamingContent) / 100)}`}
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="transparent"
                      r="14"
                      cx="16"
                      cy="16"
                    />
                  </svg>
                  {calculateAccessPercentage(streamingContent) === 100 && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="4 12 9 17 20 6" className="text-green-500" />
                      </svg>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modules */}
            {streamingContent.modules && streamingContent.modules.length > 0 && (
              <div className="ml-8">
                {streamingContent.modules
                  .sort((a: any, b: any) => a.order - b.order)
                  .map((module: any) => {
                    const isExpanded = expandedModules.has(module.id);

                    return (
                      <div key={module.id} className="relative">
                        <div className="absolute left-0 top-0 bottom-0 w-px bg-[var(--border-color)]" />
                        
                        <div
                          onClick={() => toggleModule(module.id)}
                          className={cn(
                            "group relative flex items-center py-3 px-4 border border-[var(--border-color)] rounded-lg",
                            "bg-[var(--background)] transition-colors mb-3",
                            !module.has_access && "dark:bg-[var(--muted)]/30 bg-[var(--muted)]",
                            "cursor-pointer"
                          )}
                        >
                          <div className="absolute left-0 top-1/2 w-4 h-px -translate-y-px bg-[var(--border-color)] -translate-x-4" />
                          <div className={cn(
                            "w-1 h-6 rounded-full shrink-0 mr-3",
                            module.has_access ? "bg-green-500" : "bg-[var(--accent)]/70"
                          )} />
                          
                          {!module.has_access && (
                            <div className="absolute inset-0 rounded-lg pointer-events-none dark:bg-black/30 bg-gray-100/50" />
                          )}

                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <span className={cn(
                              "text-lg truncate",
                              "text-[var(--foreground)]",
                              !module.has_access && "dark:text-[var(--muted-foreground)]/70 text-[var(--muted-foreground)]"
                            )}>
                              {module.title}
                            </span>
                            
                            <div className="flex items-center gap-2 ml-auto">
                              {!module.has_access && (
                                <div className="flex items-center gap-2">
                                  <Clock className="w-4 h-4 text-[var(--muted-foreground)]" />
                                  <span className="text-sm text-[var(--muted-foreground)]">
                                    {formatAccessDate(module.access_date)}
                                  </span>
                                </div>
                              )}
                              {module.media?.length > 0 && (
                                <button className="p-1 hover:bg-[var(--muted)] rounded transition-colors">
                                  {isExpanded ? (
                                    <ChevronDown className="w-4 h-4 text-[var(--text-secondary)]" />
                                  ) : (
                                    <ChevronRight className="w-4 h-4 text-[var(--text-secondary)]" />
                                  )}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Media Items */}
                        {isExpanded && module.media && module.media.length > 0 && (
                          <div className="ml-8">
                            {module.media.map((media: any) => (
                              <div key={media.id} className="relative">
                                <div className="absolute left-0 top-0 bottom-0 w-px bg-[var(--border-color)]" />
                                
                                <div className={cn(
                                  "group relative flex items-center py-3 px-4 border border-[var(--border-color)] rounded-lg",
                                  "bg-[var(--background)] transition-colors mb-3",
                                  !media.has_access && "dark:bg-[var(--muted)]/30 bg-[var(--muted)]"
                                )}>
                                  <div className="absolute left-0 top-1/2 w-4 h-px -translate-y-px bg-[var(--border-color)] -translate-x-4" />
                                  <div className={cn(
                                    "w-1 h-6 rounded-full shrink-0 mr-3",
                                    (media.has_access || module.has_access) ? "bg-green-500" : "bg-[var(--accent)]/50"
                                  )} />
                                  
                                  {!media.has_access && !module.has_access && (
                                    <div className="absolute inset-0 rounded-lg pointer-events-none dark:bg-black/30 bg-gray-100/50" />
                                  )}

                                  <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <div className="shrink-0">
                                      {getMediaTypeIcon(media.mediaType, !(media.has_access || module.has_access))}
                                    </div>
                                    <span className={cn(
                                      "text-lg truncate",
                                      "text-[var(--foreground)]",
                                      !(media.has_access || module.has_access) && "dark:text-[var(--muted-foreground)]/70 text-[var(--muted-foreground)]"
                                    )}>
                                      {media.title}
                                    </span>
                                    
                                    {!(media.has_access || module.has_access) && (
                                      <div className="flex items-center gap-2 ml-auto">
                                        <Clock className="w-4 h-4 text-[var(--muted-foreground)]" />
                                        <span className="text-sm text-[var(--muted-foreground)]">
                                          {formatAccessDate(media.access_date)}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </div>
      </div>
    );
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
                console.log('Selected:', { type, id });
                if (type === 'collection' || type === 'content') {
                  setSelectedAccessType(type);
                  setSelectedAccessId(id);
                }
              }}
              onCancel={() => {
                setShowAccessModal(false);
                setSelectedAccessType(null);
                setSelectedAccessId(null);
              }}
            />
          )}

          {accessRecords.length > 0 ? (
            <div className="space-y-4">
              {accessRecords.map((record) => (
                <div
                  key={record.id}
                  onClick={() => setSelectedRecord(record)}
                  className={cn(
                    "p-4 rounded-lg",
                    "border border-[var(--border-color)]",
                    "cursor-pointer",
                    "transition-all",
                    selectedRecord?.id === record.id 
                      ? 'border-[var(--accent)] bg-[var(--accent)]/5' 
                      : 'hover:border-[var(--accent)]'
                  )}
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                      <span>{record.collection_name || 'Uncategorized'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full" />
                        <span className="text-lg text-[var(--foreground)]">{record.content_title || 'Untitled Content'}</span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-[var(--text-secondary)]" />
                    </div>
                    <div className="text-sm text-[var(--text-secondary)]">
                      Added {new Date(record.granted_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-[var(--text-secondary)]">
              No content access available
            </div>
          )}
        </div>
      </div>

      {/* Right Column - Details */}
      <div className="col-span-7">
        {showAccessModal && selectedAccessType && selectedAccessId ? (
          <AccessStructureView
            selectedType={selectedAccessType}
            selectedId={selectedAccessId}
          />
        ) : selectedRecord ? (
          <ContentStructureView record={selectedRecord} />
        ) : (
          <div className="rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] p-8">
            <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-[var(--text-secondary)] text-lg">
              <p>Select an item to view details</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 
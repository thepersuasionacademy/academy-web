import React, { useState, useEffect } from 'react';
import { ChevronRight, CheckCircle, Clock, FolderTree, Film, Book } from 'lucide-react';
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
  const supabase = createClientComponentClient();

  useEffect(() => {
    // Use the contentItems directly instead of fetching
    setAccessRecords(contentItems);
  }, [contentItems]);

  // Helper function to get content title
  const getContentTitle = async (contentId: string) => {
    const { data, error } = await supabase
      .from('content')
      .select('title')
      .eq('id', contentId)
      .single();

    if (error) {
      console.error('Error fetching content title:', error);
      return 'Unknown Content';
    }

    return data.title;
  };

  // Add this helper function for date formatting
  const formatAccessDate = (date: string | null) => {
    if (!date) return 'Not scheduled';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Add this component for rendering access items
  const AccessItemList = ({ items, title }: { items: AccessItem[] | null; title: string }) => {
    if (!items || items.length === 0) return null;

    return (
      <div className="space-y-2">
        <h3 className="text-lg font-medium text-[var(--text-secondary)]">{title}</h3>
        <div className="space-y-1">
          {items.sort((a, b) => a.order - b.order).map((item) => (
            <div key={item.id} className="flex items-center justify-between py-2 border-b border-[var(--border-color)] last:border-0">
              <span className="text-[var(--foreground)]">{item.title}</span>
              <div className="flex items-center gap-3">
                <span className="text-sm text-[var(--text-secondary)]">
                  {formatAccessDate(item.access_date)}
                </span>
                {item.has_access ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <Clock className="w-5 h-5 text-[var(--text-secondary)]" />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Add this component for rendering the content structure
  const ContentStructureView = ({ record }: { record: AccessRecord }) => {
    return (
      <div className="space-y-1">
        {/* Content root */}
        <div className="py-3 px-4 bg-[var(--card-bg)] rounded-t-lg border border-[var(--border-color)]">
          <div className="flex items-center">
            <span className="text-3xl font-medium text-[var(--text-secondary)]">
              {record.content_title}
            </span>
          </div>
        </div>
        
        {/* Modules section */}
        {record.modules && record.modules.length > 0 && (
          <div>
            {record.modules.sort((a, b) => a.order - b.order).map((module) => (
              <div
                key={module.id}
                className="pl-6"
              >
                <div className="py-3 px-4 border-x border-b border-[var(--border-color)]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-1 h-4",
                        module.has_access ? "bg-green-500" : "bg-[var(--border-color)]"
                      )} />
                      <span className="text-xl font-medium text-[var(--text-secondary)]">
                        {module.title}
                      </span>
                    </div>
                    {!module.has_access && (
                      <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                        <Clock className="w-4 h-4" />
                        <span>{formatAccessDate(module.access_date)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Media section */}
        {record.media && record.media.length > 0 && (
          <div>
            {record.media.sort((a, b) => a.order - b.order).map((media) => {
              const parentModule = record.modules?.find(m => m.id === media.module_id);
              const hasAccess = parentModule?.has_access || media.has_access;
              
              return (
                <div
                  key={media.id}
                  className="pl-12"
                >
                  <div className="py-3 px-4 border-x border-b border-[var(--border-color)]">
                    <div className="flex items-center">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-1 h-4",
                          parentModule?.has_access || media.has_access ? "bg-green-500" : "bg-[var(--border-color)]"
                        )} />
                        <span className="text-xl font-medium text-[var(--text-secondary)]">
                          {media.title}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
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
          <div className="rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] p-8">
            <div className="space-y-6">
              <ContentStructureView record={selectedRecord} />
            </div>
          </div>
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
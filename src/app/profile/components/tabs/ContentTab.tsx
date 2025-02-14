import React, { useState, useEffect } from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from "@/lib/utils";
import { AddAccessModal } from '../content/AddAccessModal';
import { AccessStructureView } from '../content/AccessStructureView';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface AccessRecord {
  id: string;
  content_id: string;
  content_title: string | null;
  content_type: string | null;
  status: string;
  granted_by: string;
  granted_at: string;
  access_starts_at: string;
  access_ends_at: string | null;
}

interface ContentTabProps {
  isAdmin: boolean;
  userId?: string;
}

export function ContentTab({ isAdmin, userId }: ContentTabProps) {
  const [accessRecords, setAccessRecords] = useState<AccessRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<AccessRecord | null>(null);
  const [showAccessModal, setShowAccessModal] = useState(false);
  const [selectedAccessType, setSelectedAccessType] = useState<'collection' | 'content' | null>(null);
  const [selectedAccessId, setSelectedAccessId] = useState<string | null>(null);
  const supabase = createClientComponentClient();

  useEffect(() => {
    async function fetchAccessRecords() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const targetUserId = userId || session?.user?.id;

        if (!targetUserId) return;

        const { data, error } = await supabase
          .rpc('get_user_content', {
            p_user_id: targetUserId
          });

        if (error) {
          console.error('Error fetching access records:', error);
          return;
        }

        console.log('Access records:', data);
        setAccessRecords(data || []);
      } catch (error) {
        console.error('Error in fetchAccessRecords:', error);
      }
    }

    fetchAccessRecords();
  }, [supabase, userId]);

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
                      <span>{record.content_type || 'Unknown Type'}</span>
                      <ChevronRight className="w-3 h-3" />
                      <span>{record.status}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-lg text-[var(--foreground)]">{record.content_title || 'Untitled Content'}</span>
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
            <div className="space-y-4">
              <h2 className="text-2xl font-medium text-[var(--foreground)]">{selectedRecord.content_title || 'Untitled Content'}</h2>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-[var(--text-secondary)]">Type</span>
                  <span className="font-medium capitalize">{selectedRecord.content_type || 'Unknown Type'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-secondary)]">Status</span>
                  <span className="font-medium">{selectedRecord.status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-secondary)]">Granted</span>
                  <span className="font-medium">
                    {new Date(selectedRecord.granted_at).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-secondary)]">Access Start</span>
                  <span className="font-medium">
                    {new Date(selectedRecord.access_starts_at).toLocaleString()}
                  </span>
                </div>
                {selectedRecord.access_ends_at && (
                  <div className="flex justify-between">
                    <span className="text-[var(--text-secondary)]">Access End</span>
                    <span className="font-medium">
                      {new Date(selectedRecord.access_ends_at).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
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
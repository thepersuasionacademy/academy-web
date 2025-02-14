import React, { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from "@/lib/utils";
import { AddAccessModal } from '../content/AddAccessModal';
import { AccessStructureView } from '../content/AccessStructureView';

interface ContentTabProps {
  isAdmin: boolean;
  userId?: string;
}

export function ContentTab({ isAdmin, userId }: ContentTabProps) {
  const [showAccessModal, setShowAccessModal] = useState(false);
  const [selectedAccessType, setSelectedAccessType] = useState<'collection' | 'content' | null>(null);
  const [selectedAccessId, setSelectedAccessId] = useState<string | null>(null);

  return (
    <div className="grid grid-cols-12 gap-8">
      {/* Debug info */}
      {process.env.NODE_ENV === 'development' && (
        <div className="col-span-12 mb-4 p-2 bg-yellow-100 text-yellow-800 rounded">
          Debug info: isAdmin={String(isAdmin)}
        </div>
      )}
      
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

          <div className="text-center py-8 text-[var(--text-secondary)]">
            Select content to view details
          </div>
        </div>
      </div>

      {/* Right Column - Details */}
      <div className="col-span-7">
        {showAccessModal && selectedAccessType && selectedAccessId ? (
          <AccessStructureView
            selectedType={selectedAccessType}
            selectedId={selectedAccessId}
          />
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
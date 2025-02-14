import React, { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from "@/lib/utils";

interface ContentItem {
  id: string;
  title: string;
  description: string;
  created_at: string;
  access_level: string;
  parent_title: string;
  parent_type: string;
  content_type: string;
}

interface ContentTabProps {
  isAdmin: boolean;
  userId?: string;
  contentItems: ContentItem[];
}

export default function ContentTab({ isAdmin, userId, contentItems }: ContentTabProps) {
  const [showNewAccessModal, setShowNewAccessModal] = useState(false);
  const [selectedAccessType, setSelectedAccessType] = useState<string>('');
  const [selectedItem, setSelectedItem] = useState<ContentItem | null>(null);

  const handleAddAccess = () => {
    setShowNewAccessModal(true);
  };

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
                onClick={handleAddAccess}
                className="px-4 py-2 bg-[var(--accent)] text-white rounded-lg hover:opacity-90 transition-opacity"
              >
                Add Access
              </button>
            )}
          </div>

          {contentItems.length > 0 ? (
            <div className="space-y-4">
              {contentItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  className={cn(
                    "p-4 rounded-lg",
                    "border border-[var(--border-color)]",
                    "cursor-pointer",
                    "transition-all",
                    selectedItem?.id === item.id 
                      ? 'border-[var(--accent)] bg-[var(--accent)]/5' 
                      : 'hover:border-[var(--accent)]'
                  )}
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                      <span>{item.parent_title}</span>
                      <ChevronRight className="w-3 h-3" />
                      <span>{item.content_type}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-lg text-[var(--foreground)]">{item.title}</span>
                      <ChevronRight className="w-5 h-5 text-[var(--text-secondary)]" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-[var(--text-secondary)]">
              No content history available
            </div>
          )}
        </div>
      </div>

      {/* Right Column - Details */}
      <div className="col-span-7">
        {selectedItem ? (
          <div className="rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] p-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                <span>{selectedItem.parent_title}</span>
                <ChevronRight className="w-3 h-3" />
                <span>{selectedItem.content_type}</span>
              </div>
              <h2 className="text-2xl font-medium text-[var(--foreground)]">{selectedItem.title}</h2>
              {selectedItem.description && (
                <p className="text-[var(--text-secondary)]">{selectedItem.description}</p>
              )}
              <div className="text-sm text-[var(--text-secondary)]">
                Access Level: {selectedItem.access_level}
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

      {showNewAccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-96">
            <h2 className="text-lg font-semibold mb-4">Add New Access</h2>
            <select
              value={selectedAccessType}
              onChange={(e) => setSelectedAccessType(e.target.value)}
              className="w-full p-2 border rounded mb-4"
            >
              <option value="">Select access type...</option>
              <option value="read">Read</option>
              <option value="write">Write</option>
              <option value="admin">Admin</option>
            </select>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowNewAccessModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // Handle save access
                  setShowNewAccessModal(false);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 
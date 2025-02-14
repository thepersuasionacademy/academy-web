import React, { useState } from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { cn } from "@/lib/utils";
import { AICreditsDetail } from '../ai-credits/AICreditsDetail';
import type { AIItem } from '../types';

interface AICreditsTabProps {
  aiItems: AIItem[];
}

export function AICreditsTab({ aiItems }: AICreditsTabProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedItem, setSelectedItem] = useState<AIItem | null>(null);
  const [showCopied, setShowCopied] = useState(false);
  const itemsPerPage = 10;

  // Get current items for display
  const getCurrentItems = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return aiItems.slice(startIndex, endIndex);
  };

  // Get total pages
  const totalPages = Math.ceil(aiItems.length / itemsPerPage);

  // Generate page numbers to display
  const getPageNumbers = () => {
    const delta = 1; // Number of pages to show on each side of current page
    const pages = [];
    
    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 || // First page
        i === totalPages || // Last page
        (i >= currentPage - delta && i <= currentPage + delta) // Pages around current
      ) {
        pages.push(i);
      } else if (pages[pages.length - 1] !== '...') {
        pages.push('...');
      }
    }
    
    return pages;
  };

  const handleCopyResponse = (response: string) => {
    navigator.clipboard.writeText(response);
    setShowCopied(true);
    setTimeout(() => setShowCopied(false), 2000);
  };

  // Helper function to get item details
  const getItemDetails = (item: AIItem) => {
    return {
      category: item.collectionName || '',
      suite: item.suiteName || '',
      name: item.toolName
    };
  };

  // Format timestamp to readable date and time
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return {
      date: date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      time: date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      })
    };
  };

  return (
    <div className="grid grid-cols-12 gap-8">
      {/* Left Column - Recent History */}
      <div className="col-span-5">
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-medium text-[var(--text-secondary)]">Recent History</h3>
          </div>
          {aiItems.length > 0 ? (
            <div className="space-y-4">
              {getCurrentItems().map((item) => {
                const details = getItemDetails(item);
                return (
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
                        <span>{details.category}</span>
                        <ChevronRight className="w-3 h-3" />
                        <span>{details.suite}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-lg text-[var(--foreground)]">{details.name}</span>
                        <ChevronRight className="w-5 h-5 text-[var(--text-secondary)]" />
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-6">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className={cn(
                      "p-1 rounded-md transition-colors",
                      currentPage === 1 
                        ? "text-[var(--text-secondary)] cursor-not-allowed"
                        : "hover:bg-[var(--hover-bg)]"
                    )}
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  {getPageNumbers().map((page, index) => (
                    <button
                      key={index}
                      onClick={() => typeof page === 'number' && setCurrentPage(page)}
                      className={cn(
                        "w-8 h-8 rounded-md flex items-center justify-center transition-colors",
                        typeof page === 'number' && page === currentPage
                          ? "bg-[var(--accent)] text-white"
                          : page === '...'
                          ? "text-[var(--text-secondary)] cursor-default"
                          : "hover:bg-[var(--hover-bg)]"
                      )}
                    >
                      {page}
                    </button>
                  ))}

                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className={cn(
                      "p-1 rounded-md transition-colors",
                      currentPage === totalPages
                        ? "text-[var(--text-secondary)] cursor-not-allowed"
                        : "hover:bg-[var(--hover-bg)]"
                    )}
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-[var(--text-secondary)]">
              No AI credits history available
            </div>
          )}
        </div>
      </div>

      {/* Right Column - Details */}
      <div className="col-span-7">
        {selectedItem ? (
          <div className="space-y-6">
            <div className="rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] p-8">
              <AICreditsDetail 
                item={selectedItem}
                formatTimestamp={formatTimestamp}
                onCopy={handleCopyResponse}
                showCopied={showCopied}
              />
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
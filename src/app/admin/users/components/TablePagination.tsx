import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface TablePaginationProps {
  currentPage: number;
  totalPages: number;
  pageSize: 25 | 50 | 100;
  filteredUsers: any[];
  startIndex: number;
  handlePageChange: (page: number) => void;
  handlePageSizeChange: (size: 25 | 50 | 100) => void;
}

export const TablePagination: React.FC<TablePaginationProps> = ({
  currentPage,
  totalPages,
  pageSize,
  filteredUsers,
  startIndex,
  handlePageChange,
  handlePageSizeChange
}) => {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-center mt-4 gap-4">
      {totalPages > 1 ? (
        <div className="flex items-center gap-4 w-full justify-between">
          <div className="text-sm text-[var(--text-secondary)]">
            Showing {startIndex + 1}-{Math.min(startIndex + pageSize, filteredUsers.length)} of {filteredUsers.length} users
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`p-2 rounded-md ${
                  currentPage === 1
                    ? 'text-[var(--text-secondary)] cursor-not-allowed'
                    : 'text-[var(--foreground)] hover:bg-[var(--hover-bg)]'
                }`}
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                // Show pages around current page
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`w-8 h-8 rounded-md flex items-center justify-center ${
                      currentPage === pageNum
                        ? 'text-[var(--accent)] font-medium border-b-2 border-[var(--accent)]'
                        : 'text-[var(--foreground)] hover:bg-[var(--hover-bg)]'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`p-2 rounded-md ${
                  currentPage === totalPages
                    ? 'text-[var(--text-secondary)] cursor-not-allowed'
                    : 'text-[var(--foreground)] hover:bg-[var(--hover-bg)]'
                }`}
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex items-center gap-2 text-sm border-l border-[var(--border-color)] pl-4">
              <span className="text-[var(--text-secondary)]">Show:</span>
              {[25, 50, 100].map((size) => (
                <button
                  key={size}
                  onClick={() => handlePageSizeChange(size as 25 | 50 | 100)}
                  className={`px-3 py-1 rounded-md ${
                    pageSize === size
                      ? 'text-[var(--accent)] font-medium border-b-2 border-[var(--accent)]'
                      : 'text-[var(--foreground)] hover:bg-[var(--hover-bg)]'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex w-full justify-between items-center">
          <div className="text-sm text-[var(--text-secondary)]">
            Showing {filteredUsers.length} {filteredUsers.length === 1 ? 'user' : 'users'}
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <span className="text-[var(--text-secondary)]">Show:</span>
            {[25, 50, 100].map((size) => (
              <button
                key={size}
                onClick={() => handlePageSizeChange(size as 25 | 50 | 100)}
                className={`px-3 py-1 rounded-md ${
                  pageSize === size
                    ? 'text-[var(--accent)] font-medium border-b-2 border-[var(--accent)]'
                    : 'text-[var(--foreground)] hover:bg-[var(--hover-bg)]'
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}; 
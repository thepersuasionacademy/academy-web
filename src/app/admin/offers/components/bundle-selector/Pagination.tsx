import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from "@/lib/utils";
import { ITEMS_PER_PAGE } from './types';

interface PaginationProps {
  currentPage: number;
  totalItems: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ currentPage, totalItems, onPageChange }: PaginationProps) {
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  
  if (totalPages <= 1) return null;
  
  return (
    <div className="flex items-center justify-center mt-2 gap-1">
      <button
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className={cn(
          "p-1 rounded",
          currentPage === 1 ? "text-[var(--text-secondary)]/50 cursor-not-allowed" : "text-[var(--text-secondary)] hover:bg-[var(--hover-bg)]"
        )}
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      
      {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={cn(
            "w-6 h-6 rounded text-sm flex items-center justify-center",
            currentPage === page 
              ? "bg-[var(--accent)]/10 text-[var(--accent)] font-medium" 
              : "text-[var(--text-secondary)] hover:bg-[var(--hover-bg)]"
          )}
        >
          {page}
        </button>
      ))}
      
      <button
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        className={cn(
          "p-1 rounded",
          currentPage === totalPages ? "text-[var(--text-secondary)]/50 cursor-not-allowed" : "text-[var(--text-secondary)] hover:bg-[var(--hover-bg)]"
        )}
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
} 
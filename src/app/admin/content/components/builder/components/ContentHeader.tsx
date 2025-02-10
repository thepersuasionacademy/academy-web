import React from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Save } from 'lucide-react';
import { cn } from "@/lib/utils";
import { ContentStatus } from '@/types/content';

interface ContentHeaderProps {
  status: ContentStatus;
  onStatusChange: (status: ContentStatus) => void;
  onSave: () => void;
}

export default function ContentHeader({
  status,
  onStatusChange,
  onSave
}: ContentHeaderProps) {
  return (
    <div className="sticky top-0 z-10 border-b border-[var(--border-color)] bg-[var(--background)]/80 backdrop-blur-sm">
      <div className="flex items-center justify-between h-16 px-4">
        <div className="flex items-center gap-2">
          <Link 
            href="/admin/content"
            className="p-2 rounded-lg hover:bg-[var(--hover-bg)] transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-[var(--text-secondary)]" />
          </Link>
          <div className="flex items-center gap-2 text-[var(--text-secondary)]">
            <span>Admin</span>
            <ChevronRight className="w-4 h-4" />
            <span>Content</span>
            <ChevronRight className="w-4 h-4" />
            <span className="text-[var(--foreground)] font-medium">New Content</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center p-1 gap-1 rounded-lg border border-[var(--border-color)] bg-[var(--background)]">
            <button
              onClick={() => onStatusChange(ContentStatus.DRAFT)}
              className={cn(
                "px-3 py-1.5 rounded-md text-sm font-medium transition-colors text-[var(--foreground)]",
                status === ContentStatus.DRAFT
                  ? "border-2 border-[var(--accent)]"
                  : "hover:bg-[var(--hover-bg)] text-[var(--text-secondary)]"
              )}
            >
              Draft
            </button>
            <button
              onClick={() => onStatusChange(ContentStatus.PUBLISHED)}
              className={cn(
                "px-3 py-1.5 rounded-md text-sm font-medium transition-colors text-[var(--foreground)]",
                status === ContentStatus.PUBLISHED
                  ? "border-2 border-[var(--accent)]"
                  : "hover:bg-[var(--hover-bg)] text-[var(--text-secondary)]"
              )}
            >
              Published
            </button>
            <button
              onClick={() => onStatusChange(ContentStatus.ARCHIVED)}
              className={cn(
                "px-3 py-1.5 rounded-md text-sm font-medium transition-colors text-[var(--foreground)]",
                status === ContentStatus.ARCHIVED
                  ? "border-2 border-[var(--accent)]"
                  : "hover:bg-[var(--hover-bg)] text-[var(--text-secondary)]"
              )}
            >
              Archived
            </button>
          </div>
          <button
            onClick={(e) => {
              e.preventDefault();
              console.log('Save button clicked');
              onSave();
            }}
            type="button"
            className="px-4 py-2 rounded-lg bg-[var(--accent)] text-white hover:opacity-90 transition-opacity flex items-center gap-2 text-sm font-medium"
          >
            <Save className="w-4 h-4" />
            Save
          </button>
        </div>
      </div>
    </div>
  );
} 
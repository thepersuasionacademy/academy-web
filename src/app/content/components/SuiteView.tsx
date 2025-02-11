import React, { useEffect } from 'react';
import { Play, X, FileText, Video } from 'lucide-react';
import { cn } from "@/lib/utils";
import type { Module } from '@/lib/supabase/learning';
import Image from 'next/image';

interface MediaItem {
  id: string;
  title: string;
  order: number;
  video?: {
    id: string;
    video_id: string;
    title: string;
  };
  text?: {
    id: string;
    content_text: string;
    title: string;
  };
  ai?: {
    id: string;
    tool_id: string;
    title: string;
  };
}

interface MediaItemType {
  id: string;
  title: string;
  order: number;
  video?: {
    id: string;
    video_id: string;
    title: string;
  };
  text?: {
    id: string;
    content_text: string;
    title: string;
  };
  ai?: {
    id: string;
    tool_id: string;
    title: string;
  };
}

interface SuiteViewProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  modules: Module[];
  onPlay: (moduleId: string, mediaItem: MediaItem) => void;
  thumbnailUrl?: string;
  activeMediaItem?: MediaItemType | null;
}

export const SuiteView = ({
  isOpen,
  onClose,
  title,
  description,
  modules,
  onPlay,
  thumbnailUrl,
  activeMediaItem,
}: SuiteViewProps) => {
  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow;
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.height = '100%';
    }
    return () => {
      document.body.style.overflow = originalStyle;
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.height = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sortedModules = [...modules].sort((a, b) => (a.order || 0) - (b.order || 0));
  const hasMultipleModules = modules.length > 1;

  return (
    <div 
      className={cn(
        "fixed inset-y-0 right-0 z-50",
        "w-[400px]",
        "transform transition-transform duration-300 ease-out",
        "bg-[var(--card-bg)] text-[var(--foreground)] flex-shrink-0",
        "border-l border-[var(--border-color)]",
        isOpen ? "translate-x-0" : "translate-x-full"
      )}
    >
      <div className="relative h-full overflow-auto">
        {thumbnailUrl && (
          <div className="relative w-full h-fit">
            <Image
              src={thumbnailUrl}
              alt={title}
              width={400}
              height={0}
              className="w-full h-auto"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--card-bg)] to-transparent opacity-50" />
          </div>
        )}
        <div className={cn(
          "sticky top-0 bg-[var(--card-bg)]/80 backdrop-blur-sm",
          thumbnailUrl ? "p-6 -mt-16 relative z-10" : "p-6"
        )}>
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl md:text-2xl font-bold">{title}</h1>
            <button 
              onClick={onClose}
              className="p-2 rounded-full hover:bg-[var(--hover-bg)] transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <p className="text-base md:text-sm text-[var(--text-secondary)]">{description}</p>
        </div>

        <div className="px-6 pb-safe">
          {hasMultipleModules ? (
            // Show module list with titles when there are multiple modules
            sortedModules.map((module, index) => (
              <div key={module.id}>
                <button
                  onClick={() => module.media[0] && onPlay(module.id, module.media[0])}
                  className={cn(
                    "w-full flex items-center justify-between py-4 transition-colors duration-200 rounded-lg px-3",
                    "border-2 hover:bg-[var(--hover-bg)]",
                    activeMediaItem?.id === module.media[0]?.id ? "border-[var(--accent)]" : "border-transparent"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Video className="w-5 h-5 text-[var(--text-secondary)]" />
                    <span className="font-medium text-lg">{module.title || `Module ${index + 1}`}</span>
                  </div>
                  <Play className="w-5 h-5 text-[var(--text-secondary)]" />
                </button>
                {index < sortedModules.length - 1 && (
                  <div className="h-px bg-[var(--border-color)]" />
                )}
              </div>
            ))
          ) : (
            // Show media items directly when there's only one module
            sortedModules[0]?.media.map((mediaItem: MediaItem, index: number) => (
              <div key={mediaItem.id || index}>
                <button
                  onClick={() => onPlay(sortedModules[0].id, mediaItem)}
                  className={cn(
                    "w-full text-left py-4 transition-colors duration-200 rounded-lg px-3",
                    "border-2 hover:bg-[var(--hover-bg)]",
                    activeMediaItem?.id === mediaItem.id ? "border-[var(--accent)]" : "border-transparent"
                  )}
                >
                  <span className="font-medium text-lg">{mediaItem.title || `Item ${index + 1}`}</span>
                </button>
                {index < (sortedModules[0]?.media.length || 0) - 1 && (
                  <div className="h-px bg-[var(--border-color)]" />
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default SuiteView;
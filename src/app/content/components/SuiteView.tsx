import React, { useEffect } from 'react';
import { Play, X, FileText, Video, ChevronRight } from 'lucide-react';
import { cn } from "@/lib/utils";
import type { Module } from '@/lib/supabase/learning';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

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
    }
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, [isOpen]);

  const sortedModules = [...modules].sort((a, b) => (a.order || 0) - (b.order || 0));
  const hasMultipleModules = modules.length > 1;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ x: 400 }}
          animate={{ x: 0 }}
          exit={{ x: 400 }}
          transition={{ duration: 0.2 }}
          className={cn(
            "fixed inset-y-0 right-0 z-50 w-[400px]",
            "bg-[var(--background)] text-[var(--foreground)]",
            "border-l border-[var(--border-color)]",
            "shadow-[-8px_0_30px_-15px_rgba(0,0,0,0.3)]"
          )}
        >
          <div className="relative h-full overflow-auto">
            <button 
              onClick={onClose}
              className="absolute top-3 right-3 z-10 p-2 rounded-full bg-[var(--background)] hover:bg-[var(--hover-bg)] transition-all hover:scale-105 shadow-lg hover:shadow-xl"
            >
              <X className="w-6 h-6" />
            </button>
            {thumbnailUrl && (
              <div className="relative w-full h-fit shadow-[0_4px_20px_-5px_rgba(0,0,0,0.3)]">
                <Image
                  src={thumbnailUrl}
                  alt={title}
                  width={400}
                  height={0}
                  className="w-full h-auto"
                  priority
                />
              </div>
            )}
            <div className="pt-6 px-6">
              <div className="mb-1">
                <h1 className="text-3xl md:text-2xl font-bold">{title}</h1>
              </div>
              <p className="text-base md:text-sm text-[var(--text-secondary)]">{description}</p>
            </div>
            <div className="h-px bg-[var(--border-color)] mt-6 shadow-sm" />
            <div className="pb-safe">
              {hasMultipleModules ? (
                // Show module list with titles when there are multiple modules
                sortedModules.map((module, index) => (
                  <div key={module.id}>
                    <button
                      onClick={() => module.media[0] && onPlay(module.id, module.media[0])}
                      className={cn(
                        "w-full flex items-center justify-between py-4 transition-all duration-200 px-6",
                        "hover:bg-[var(--hover-bg)] hover:shadow-md hover:translate-y-[-1px]",
                        activeMediaItem?.id === module.media[0]?.id ? "bg-[var(--accent)] text-white hover:bg-[var(--accent)] shadow-md" : ""
                      )}
                    >
                      <div className="flex items-center gap-3">
                        {activeMediaItem?.id === module.media[0]?.id ? (
                          <ChevronRight className="w-5 h-5" />
                        ) : (
                          <Video className="w-5 h-5 text-[var(--text-secondary)]" />
                        )}
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
                        "w-full text-left py-4 transition-all duration-200 px-6",
                        "hover:bg-[var(--hover-bg)] hover:shadow-md hover:translate-y-[-1px]",
                        activeMediaItem?.id === mediaItem.id ? "bg-[var(--accent)] text-white hover:bg-[var(--accent)] shadow-md" : ""
                      )}
                    >
                      <div className="flex items-center gap-3">
                        {activeMediaItem?.id === mediaItem.id ? (
                          <ChevronRight className="w-5 h-5" />
                        ) : (
                          <Video className="w-5 h-5 text-[var(--text-secondary)]" />
                        )}
                        <span className="font-medium text-lg">{mediaItem.title || `Item ${index + 1}`}</span>
                      </div>
                    </button>
                    {index < (sortedModules[0]?.media.length || 0) - 1 && (
                      <div className="h-px bg-[var(--border-color)]" />
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SuiteView;
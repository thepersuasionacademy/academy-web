import React, { useEffect } from 'react';
import { Play, X, ChevronRight } from 'lucide-react';
import { cn } from "@/lib/utils";
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { NodeTypeIcon } from '@/app/profile/components/content/access-structure/NodeTypeIcon';
import { AccessStatus, hasEffectiveAccess } from './AccessStatus';
import { AccessDelayStatus } from './AccessDelayStatus';

interface MediaItem {
  id: string;
  title: string;
  order: number;
  hasAccess: boolean;
  accessDelay?: {
    value: number;
    unit: 'days' | 'weeks' | 'months';
  };
  mediaType?: string;
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

interface Module {
  id: string;
  title: string;
  order: number;
  hasAccess: boolean;
  accessDelay?: {
    value: number;
    unit: 'days' | 'weeks' | 'months';
  };
  media: MediaItem[];
}

interface SuiteViewProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  modules: Module[];
  accessStartsAt: string; // When the user was first granted access
  onPlay: (moduleId: string, mediaItem: MediaItem) => void;
  thumbnailUrl?: string;
  activeMediaItem?: MediaItem | null;
}

const calculateTimeRemaining = (delay: { value: number; unit: 'days' | 'weeks' | 'months' }) => {
  const now = new Date();
  const future = new Date();
  
  switch (delay.unit) {
    case 'days':
      future.setDate(future.getDate() + delay.value);
      break;
    case 'weeks':
      future.setDate(future.getDate() + (delay.value * 7));
      break;
    case 'months':
      future.setMonth(future.getMonth() + delay.value);
      break;
  }
  
  const diffTime = Math.abs(future.getTime() - now.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays > 30) {
    const months = Math.floor(diffDays / 30);
    return `${months} month${months > 1 ? 's' : ''}`;
  } else if (diffDays > 7) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks} week${weeks > 1 ? 's' : ''}`;
  }
  return `${diffDays} day${diffDays > 1 ? 's' : ''}`;
};

export const SuiteView = ({
  isOpen,
  onClose,
  title,
  description,
  modules,
  accessStartsAt,
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

  // Get library ID from environment variable
  const libraryId = process.env.NEXT_PUBLIC_BUNNY_LIBRARY_ID || '376351';
  const playerUrl = activeMediaItem?.video?.video_id ? 
    `https://iframe.mediadelivery.net/embed/${libraryId}/${activeMediaItem.video.video_id}?autoplay=false&preload=metadata&quality=1080p&enabledTransforms=hls` : 
    null;

  const renderContent = () => {
    const contentFrame = (children: React.ReactNode) => (
      <div className="relative flex-1 bg-[var(--background)]">
        {children}
      </div>
    );

    console.log('Current activeType:', activeMediaItem?.mediaType);
    console.log('Selected Media Item:', activeMediaItem);

    switch (activeMediaItem?.mediaType) {
      case 'video':
        if (playerUrl) {
          return contentFrame(
            <iframe 
              src={playerUrl}
              loading="lazy"
              className="absolute inset-0 w-full h-full"
              style={{ border: 'none' }}
              allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture; fullscreen;"
              allowFullScreen
              title={title}
            />
          );
        }
        break;
      default:
        return contentFrame(
          <div className="flex items-center justify-center h-full">
            {/* Placeholder for other media types */}
          </div>
        );
    }
  };

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
                      onClick={() => hasEffectiveAccess(module) && module.media[0] && onPlay(module.id, module.media[0])}
                      className={cn(
                        "relative w-full flex items-center justify-between py-4 transition-all duration-200 px-6",
                        hasEffectiveAccess(module) ? "hover:bg-[var(--hover-bg)] hover:shadow-md hover:translate-y-[-1px]" : "",
                        !hasEffectiveAccess(module) && module.accessDelay ? "dark:bg-black/40 bg-gray-200" : "dark:bg-[var(--muted)]/30 bg-[var(--muted)]",
                        activeMediaItem?.id === module.media[0]?.id ? "bg-[var(--hover-bg)] shadow-md" : ""
                      )}
                    >
                      <AccessStatus 
                        item={{
                          hasAccess: module.hasAccess,
                          accessStartsAt: accessStartsAt,
                          accessDelay: module.accessDelay
                        }}
                        showMessage={false}
                        className="absolute left-0 top-0 bottom-0" 
                      />
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="flex flex-col">
                          <span className={cn(
                            "font-medium text-lg truncate",
                            !hasEffectiveAccess(module) && "dark:text-[var(--muted-foreground)]/70 text-[var(--muted-foreground)]"
                          )}>{module.title || `Module ${index + 1}`}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {module.accessDelay && (
                          <AccessDelayStatus
                            accessStartsAt={accessStartsAt}
                            accessDelay={module.accessDelay}
                          />
                        )}
                        {hasEffectiveAccess(module) && activeMediaItem?.id !== module.media[0]?.id && (
                          <ChevronRight className="w-5 h-5 text-[var(--text-secondary)]" />
                        )}
                      </div>
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
                      onClick={() => hasEffectiveAccess(mediaItem) && onPlay(sortedModules[0].id, mediaItem)}
                      className={cn(
                        "relative w-full text-left py-4 transition-all duration-200 px-6",
                        hasEffectiveAccess(mediaItem) ? "hover:bg-[var(--hover-bg)] hover:shadow-md hover:translate-y-[-1px]" : "",
                        !hasEffectiveAccess(mediaItem) && mediaItem.accessDelay ? "dark:bg-black/40 bg-gray-200" : "dark:bg-[var(--muted)]/30 bg-[var(--muted)]",
                        activeMediaItem?.id === mediaItem.id ? "bg-[var(--hover-bg)] shadow-md" : ""
                      )}
                    >
                      <AccessStatus 
                        item={{
                          hasAccess: mediaItem.hasAccess,
                          accessStartsAt: accessStartsAt,
                          accessDelay: mediaItem.accessDelay
                        }}
                        showMessage={false}
                        className="absolute left-0 top-0 bottom-0" 
                      />
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="flex flex-col">
                          <span className={cn(
                            "font-medium text-lg truncate",
                            !hasEffectiveAccess(mediaItem) && "dark:text-[var(--muted-foreground)]/70 text-[var(--muted-foreground)]"
                          )}>{mediaItem.title || `Item ${index + 1}`}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {mediaItem.accessDelay && (
                          <AccessDelayStatus
                            accessStartsAt={accessStartsAt}
                            accessDelay={mediaItem.accessDelay}
                          />
                        )}
                        {hasEffectiveAccess(mediaItem) && activeMediaItem?.id !== mediaItem.id && (
                          <ChevronRight className="w-5 h-5 text-[var(--text-secondary)]" />
                        )}
                      </div>
                    </button>
                    {index < (sortedModules[0]?.media.length || 0) - 1 && (
                      <div className="h-px bg-[var(--border-color)]" />
                    )}
                  </div>
                ))
              )}
            </div>
            {renderContent()}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SuiteView;
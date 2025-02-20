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
  module_id: string;
  mediaType?: string;
}

interface Module {
  id: string;
  title: string;
  order: number;
  media: MediaItem[];
}

interface SuiteViewProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  modules: Module[];
  userAccess: {
    access_starts_at: string;
    access_overrides?: {
      media?: Record<string, {
        status: 'locked' | 'pending';
        delay?: {
          unit: 'days' | 'weeks' | 'months';
          value: number;
        };
      }>;
    };
  } | null;
  onPlay: (moduleId: string, mediaItem: MediaItem) => void;
  thumbnailUrl?: string;
  activeMediaItem?: MediaItem | null;
}

const calculateTimeRemaining = (accessStartsAt: string, delay: { value: number; unit: 'days' | 'weeks' | 'months' }) => {
  const now = new Date();
  const accessDate = new Date(accessStartsAt);
  
  // Add delay to access start date
  switch (delay.unit) {
    case 'days':
      accessDate.setDate(accessDate.getDate() + delay.value);
      break;
    case 'weeks':
      accessDate.setDate(accessDate.getDate() + (delay.value * 7));
      break;
    case 'months':
      accessDate.setMonth(accessDate.getMonth() + delay.value);
      break;
  }
  
  // Check if the access date is in the future
  if (now >= accessDate) {
    return 'Now';
  }
  
  // Calculate the time difference (without Math.abs since we want future dates only)
  const diffTime = accessDate.getTime() - now.getTime();
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
  userAccess,
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

  // Sort modules by order
  const sortedModules = [...modules].sort((a, b) => (a.order || 0) - (b.order || 0));
  const hasMultipleModules = modules.length > 1;

  // Helper to check media access
  const getMediaAccess = (mediaId: string) => {
    console.log('🔍 Checking access for media:', mediaId, {
      hasUserAccess: !!userAccess,
      accessStartsAt: userAccess?.access_starts_at,
      override: userAccess?.access_overrides?.media?.[mediaId]
    });

    // If there's no user access record, they have full access
    if (!userAccess) {
      console.log('✅ No user access record - full access granted');
      return { isAccessible: true };
    }

    // Check if this media has an override
    const override = userAccess.access_overrides?.media?.[mediaId];
    
    // If there's an override with any status, it means access is restricted
    if (override) {
      // If it's locked, no access
      if (override.status === 'locked') {
        console.log('🔒 Media is locked');
        return { isAccessible: false };
      }
      
      // If it's pending, calculate release date
      if (override.status === 'pending') {
        console.log('⏳ Media is pending');
        
        // If no delay specified, it's just pending indefinitely
        if (!override.delay) {
          return { 
            isAccessible: false,
            isPending: true
          };
        }

        const now = new Date();
        const accessStartDate = new Date(userAccess.access_starts_at);
        const releaseDate = new Date(accessStartDate);
        
        // Add delay to get release date
        switch (override.delay.unit) {
          case 'days':
            releaseDate.setDate(releaseDate.getDate() + override.delay.value);
            break;
          case 'weeks':
            releaseDate.setDate(releaseDate.getDate() + (override.delay.value * 7));
            break;
          case 'months':
            releaseDate.setMonth(releaseDate.getMonth() + override.delay.value);
            break;
        }

        console.log('⏰ Release date check:', {
          now: now.toISOString(),
          accessStartDate: accessStartDate.toISOString(),
          releaseDate: releaseDate.toISOString()
        });
        
        // If the release date has passed, they have access
        if (now >= releaseDate) {
          return { isAccessible: true };
        }
        
        // Otherwise they're still pending
        return {
          isAccessible: false,
          isPending: true,
          delay: override.delay,
          accessStartsAt: userAccess.access_starts_at,
          releaseDate: releaseDate.toISOString()
        };
      }
    }

    // No override means it's accessible
    console.log('✅ No override - media is accessible');
    return { isAccessible: true };
  };

  const formatReleaseDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ x: 400 }}
          animate={{ x: 0 }}
          exit={{ x: 400 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-y-0 right-0 z-50 w-[400px] bg-[var(--background)] text-[var(--foreground)] border-l border-[var(--border-color)] shadow-[-8px_0_30px_-15px_rgba(0,0,0,0.3)]"
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
                      onClick={() => {
                        // Find first accessible media item in module
                        const firstAccessibleMedia = module.media.find(m => getMediaAccess(m.id).isAccessible);
                        if (firstAccessibleMedia) {
                          onPlay(module.id, firstAccessibleMedia);
                        }
                      }}
                      className={cn(
                        "relative w-full flex items-start flex-col py-4 transition-all duration-200",
                        module.media.some(m => getMediaAccess(m.id).isAccessible) && "hover:bg-[var(--hover-bg)] hover:shadow-md hover:translate-y-[-1px]",
                        activeMediaItem && module.media.some(m => m.id === activeMediaItem.id) && "bg-[var(--hover-bg)]"
                      )}
                    >
                      {/* Access status indicator */}
                      <div className={cn(
                        "absolute inset-y-0 left-0 w-1",
                        module.media.some(m => getMediaAccess(m.id).isAccessible) && "bg-[var(--accent)]",
                        activeMediaItem && module.media.some(m => m.id === activeMediaItem.id) && "bg-[var(--accent)]"
                      )} />
                      
                      <div className="flex flex-col gap-1 px-6 w-full">
                        <div className="flex items-center justify-between gap-3 w-full">
                          <span className="font-medium text-lg truncate">
                            {module.title || `Module ${index + 1}`}
                          </span>
                          {module.media.some(m => getMediaAccess(m.id).isAccessible) && !module.media.some(m => m.id === activeMediaItem?.id) && (
                            <ChevronRight className="w-5 h-5 text-[var(--text-secondary)]" />
                          )}
                        </div>
                      </div>
                    </button>
                    {index < sortedModules.length - 1 && (
                      <div className="h-px bg-[var(--border-color)]" />
                    )}
                  </div>
                ))
              ) : (
                // Show media items directly when there's only one module
                sortedModules[0]?.media.map((mediaItem, index) => {
                  const access = getMediaAccess(mediaItem.id);
                  console.log('📝 Media item access:', {
                    title: mediaItem.title,
                    access
                  });
                  return (
                    <div key={mediaItem.id}>
                      <button
                        onClick={() => access.isAccessible && onPlay(sortedModules[0].id, mediaItem)}
                        className={cn(
                          "relative w-full text-left py-4 transition-all duration-200",
                          access.isAccessible && "hover:bg-[var(--hover-bg)] hover:shadow-md hover:translate-y-[-1px]",
                          !access.isAccessible && "bg-black/5",
                          activeMediaItem?.id === mediaItem.id && "bg-[var(--hover-bg)]"
                        )}
                      >
                        {/* Access status indicator - now spans full height and aligns to the left edge */}
                        <div className={cn(
                          "absolute inset-y-0 left-0 w-1",
                          access.isAccessible && "bg-[var(--accent)]",
                          activeMediaItem?.id === mediaItem.id && "bg-[var(--accent)]"
                        )} />
                        
                        <div className="flex flex-col gap-1 px-6">
                          <div className="flex items-center justify-between gap-3">
                            <span className={cn(
                              "font-medium text-lg truncate",
                              !access.isAccessible && "text-[var(--muted-foreground)]/70"
                            )}>
                              {mediaItem.title || `Item ${index + 1}`}
                            </span>
                            {access.isAccessible && activeMediaItem?.id !== mediaItem.id && (
                              <ChevronRight className="w-5 h-5 text-[var(--text-secondary)]" />
                            )}
                          </div>
                          
                          {/* Only show release date for THIS specific media item if it's pending */}
                          {!access.isAccessible && access.isPending && access.releaseDate && (
                            <div className="text-sm text-[var(--muted-foreground)]/70">
                              Available on {formatReleaseDate(access.releaseDate)}
                            </div>
                          )}
                        </div>
                      </button>
                      {index < (sortedModules[0]?.media.length || 0) - 1 && (
                        <div className="h-px bg-[var(--border-color)]" />
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SuiteView;
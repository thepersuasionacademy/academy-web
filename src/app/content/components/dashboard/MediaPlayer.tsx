'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, ChevronRight } from 'lucide-react';
import { cn } from "@/lib/utils";

interface MediaPlayerProps {
  title: string;
  description: string;
  isOpen: boolean;
  trackNumber: number;
  category?: string;
  suite?: string;
}

export const MediaPlayer = ({ 
  title, 
  description, 
  isOpen, 
  trackNumber,
  category,
  suite 
}: MediaPlayerProps) => {
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

  const libraryId = '369599';
  const videoId = '1e7bb7f1-5b1e-4b9b-b00e-49e1f83c5f19';
  const token = 'c86d59f1-6bd0-42e1-bf13-791c708199a7';
  const playerUrl = `https://iframe.mediadelivery.net/embed/${libraryId}/${videoId}?token=${token}&autoplay=false`;

  return (
    <div className={cn(
      "h-full flex flex-col z-50 flex-1 px-16",
      "bg-[var(--card-bg)]",
      "transform transition-transform duration-300 ease-out",
      isOpen ? "translate-x-0" : "-translate-x-full"
    )}>
      {/* Breadcrumb Navigation */}
      <div className="pt-6 pb-4 text-sm text-[var(--text-secondary)]">
        <div className="flex items-center gap-2">
          {category && (
            <>
              <span className="hover:text-[var(--foreground)] cursor-pointer">{category}</span>
              <ChevronRight className="w-4 h-4" />
            </>
          )}
          {suite && (
            <>
              <span className="hover:text-[var(--foreground)] cursor-pointer">{suite}</span>
              <ChevronRight className="w-4 h-4" />
            </>
          )}
          <span className="text-[var(--foreground)]">{`Track ${trackNumber}`}</span>
        </div>
      </div>

      {/* Video Player */}
      <div className="flex-1 relative bg-[var(--card-bg)]">
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--card-bg)]/20 to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--card-bg)]/20 to-transparent pointer-events-none" />
        <div className="h-full w-full flex items-center">
          <div className="aspect-video w-full relative shadow-[0_0_50px_-12px_rgba(0,0,0,0.8)] rounded-lg overflow-hidden">
            <iframe 
              src={playerUrl}
              loading="lazy"
              className="absolute inset-0 w-full h-full"
              style={{ border: 'none' }}
              allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
              allowFullScreen
            />
          </div>
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--card-bg)]/20 via-transparent to-[var(--card-bg)]/20 pointer-events-none" />
      </div>

      {/* Content Section */}
      <div className="shrink-0 relative">
        {/* Glassmorphic background effect */}
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--card-bg)]/5 to-transparent" />
        <div className="absolute inset-0 backdrop-blur-[2px]" />
        
        {/* Content with glass effect */}
        <div className="relative border-t border-[var(--border-color)]">
          <div className="max-w-[1280px]">
            {/* Title Section */}
            <div className="pt-8 pb-4">
              <div className="relative">
                {/* Subtle text shadow for depth */}
                <div className="absolute -inset-x-1 inset-y-0 bg-gradient-to-r from-[var(--card-bg)]/50 via-transparent to-[var(--card-bg)]/50 blur-sm" />
                <h1 className="text-4xl font-semibold text-[var(--foreground)]">{`Track ${trackNumber}`}</h1>
              </div>
            </div>
            
            {/* Description Section */}
            <div className="pb-8">
              <div 
                className={cn(
                  "text-xl whitespace-pre-wrap relative",
                  "before:absolute before:inset-0 before:bg-gradient-to-r before:from-[var(--card-bg)]/30 before:to-transparent before:pointer-events-none",
                  "text-[var(--foreground)]",
                  !isDescriptionExpanded && "line-clamp-2"
                )}
                ref={(el) => {
                  if (el) {
                    const isTextTruncated = el.scrollHeight > el.clientHeight;
                    if (!isTextTruncated && isDescriptionExpanded) {
                      setIsDescriptionExpanded(false);
                    }
                  }
                }}
              >
                {description}
              </div>

              {isDescriptionExpanded && (
                <button
                  onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                  className="mt-2 flex items-center gap-1 text-lg font-medium text-[var(--text-secondary)] hover:text-[var(--foreground)] transition-colors relative z-10"
                >
                  {isDescriptionExpanded ? (
                    <>
                      Show less <ChevronUp className="w-4 h-4" />
                    </>
                  ) : (
                    <>
                      Show more <ChevronDown className="w-4 h-4" />
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Interactive Pills */}
            <div className="flex justify-start gap-4 pt-2 pb-6">
              <button className="px-6 py-2 rounded-full bg-[var(--hover-bg)] text-base font-medium text-[var(--text-secondary)] hover:text-[var(--foreground)] hover:bg-[var(--hover-bg)]/80 transition-all hover:scale-105">
                AI Tool
              </button>
              <button className="px-6 py-2 rounded-full bg-[var(--hover-bg)] text-base font-medium text-[var(--text-secondary)] hover:text-[var(--foreground)] hover:bg-[var(--hover-bg)]/80 transition-all hover:scale-105">
                Quiz
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MediaPlayer;
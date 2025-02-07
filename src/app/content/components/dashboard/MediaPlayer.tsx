'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, ChevronRight } from 'lucide-react';
import { cn } from "@/lib/utils";

interface MediaPlayerProps {
  title: string;
  description: string;
  isOpen: boolean;
  category?: string;
  videoId?: string;
  courseName?: string;
}

export const MediaPlayer = ({
  title,
  description,
  isOpen,
  category,
  videoId,
  courseName,
}: MediaPlayerProps) => {
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'content' | 'ai-tool'>('content');

  if (!isOpen) return null;

  // Get library ID from environment variable
  const libraryId = process.env.NEXT_PUBLIC_BUNNY_LIBRARY_ID || '376351';
  const playerUrl = videoId ? 
    `https://iframe.mediadelivery.net/embed/376351/${videoId}?autoplay=false` : 
    null;

  console.log('Video Player URL:', playerUrl);
  console.log('Video ID:', videoId);
  console.log('Library ID:', libraryId);

  return (
    <div className={cn(
      "h-full flex flex-col z-50 flex-1",
      "bg-[var(--background)]",
      "transform transition-transform duration-300 ease-out",
      isOpen ? "translate-x-0" : "-translate-x-full"
    )}>
      {/* Top Navigation Bar */}
      <div className="flex justify-between items-center py-5 px-6 bg-[var(--background)]">
        {/* Breadcrumb Navigation */}
        <div className="text-sm text-[var(--text-secondary)]">
          <div className="flex items-center gap-2">
            {category && (
              <>
                <span className="text-[var(--text-secondary)]">{category}</span>
                <ChevronRight className="w-4 h-4" />
              </>
            )}
            {courseName && (
              <>
                <span className="text-[var(--text-secondary)]">{courseName}</span>
                <ChevronRight className="w-4 h-4" />
              </>
            )}
            <span className="text-[var(--foreground)]">{title}</span>
          </div>
        </div>

        {/* Toggle Buttons */}
        <div className="flex gap-2">
          <button 
            onClick={() => setActiveTab('content')}
            className={cn(
              "px-6 py-2 rounded-full text-base font-medium transition-all hover:scale-105",
              "hover:border-[var(--accent)]/50 hover:shadow-[0_0_15px_rgba(var(--accent-rgb),0.15)]",
              "border border-transparent",
              activeTab === 'content'
                ? "bg-[var(--accent)] text-white hover:bg-[var(--accent)]/90"
                : "bg-[var(--hover-bg)] text-[var(--text-secondary)] hover:text-[var(--foreground)] hover:bg-[var(--hover-bg)]/80"
            )}
          >
            Content
          </button>
          <button 
            onClick={() => setActiveTab('ai-tool')}
            className={cn(
              "px-6 py-2 rounded-full text-base font-medium transition-all hover:scale-105",
              "hover:border-[var(--accent)]/50 hover:shadow-[0_0_15px_rgba(var(--accent-rgb),0.15)]",
              "border border-transparent",
              activeTab === 'ai-tool'
                ? "bg-[var(--accent)] text-white hover:bg-[var(--accent)]/90"
                : "bg-[var(--hover-bg)] text-[var(--text-secondary)] hover:text-[var(--foreground)] hover:bg-[var(--hover-bg)]/80"
            )}
          >
            AI Tool
          </button>
        </div>
      </div>

      {/* Content Area (Video/AI Tool) */}
      <div className="relative flex-1 bg-black">
        {activeTab === 'ai-tool' ? (
          <iframe 
            src={`/ai/tools/buyer-psychology-modeling`}
            className="absolute inset-0 w-full h-full"
            style={{ border: 'none' }}
            allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
            allowFullScreen
          />
        ) : playerUrl ? (
          <iframe 
            src={playerUrl}
            loading="lazy"
            className="absolute inset-0 w-full h-full"
            style={{ border: 'none' }}
            allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            title={title}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-white">
            No video available
          </div>
        )}
      </div>

      {/* Description Section */}
      <div className="shrink-0 p-6 bg-[var(--background)] border-t border-[var(--border-color)]">
        <div className="max-w-[1280px]">
          <h1 className="text-2xl font-semibold mb-2">{title}</h1>
          <div 
            className={cn(
              "text-[var(--text-secondary)]",
              !isDescriptionExpanded && "line-clamp-2"
            )}
          >
            {description}
          </div>
          <button
            onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
            className="mt-2 flex items-center gap-1 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--foreground)] transition-colors"
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
        </div>
      </div>
    </div>
  );
};

export default MediaPlayer;
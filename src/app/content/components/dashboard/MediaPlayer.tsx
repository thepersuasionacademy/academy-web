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
  toolId?: string;
}

export const MediaPlayer = ({ 
  title, 
  description, 
  isOpen, 
  trackNumber,
  category,
  suite,
  toolId = "buyer-psychology-modeling"
}: MediaPlayerProps) => {
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'content' | 'ai-tool' | 'quiz'>('content');

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
      {/* Top Navigation Bar */}
      <div className="flex justify-between items-center mb-5 mt-5">
        {/* Breadcrumb Navigation */}
        <div className="text-sm text-[var(--text-secondary)]">
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
          <button 
            onClick={() => setActiveTab('quiz')}
            className={cn(
              "px-6 py-2 rounded-full text-base font-medium transition-all hover:scale-105",
              "hover:border-[var(--accent)]/50 hover:shadow-[0_0_15px_rgba(var(--accent-rgb),0.15)]",
              "border border-transparent",
              activeTab === 'quiz'
                ? "bg-[var(--accent)] text-white hover:bg-[var(--accent)]/90"
                : "bg-[var(--hover-bg)] text-[var(--text-secondary)] hover:text-[var(--foreground)] hover:bg-[var(--hover-bg)]/80"
            )}
          >
            Quiz
          </button>
        </div>
      </div>

      {/* Content Area (Video/AI Tool/Quiz) */}
      <div className="relative bg-[var(--card-bg)] pt-2 pb-5">
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--card-bg)]/20 to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--card-bg)]/20 to-transparent pointer-events-none" />
        <div className="w-full">
          <div className="aspect-video w-full relative shadow-[0_0_50px_-12px_rgba(0,0,0,0.8)] rounded-lg overflow-hidden">
            {activeTab === 'ai-tool' ? (
              <iframe 
                src={`/ai/tools/buyer-psychology-modeling`}
                className="absolute inset-0 w-full h-full"
                style={{ border: 'none' }}
                allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
                allowFullScreen
              />
            ) : activeTab === 'quiz' ? (
              <div className="absolute inset-0 flex items-center justify-center text-[var(--text-secondary)]">
                Quiz Coming Soon
              </div>
            ) : (
              <iframe 
                src={playerUrl}
                loading="lazy"
                className="absolute inset-0 w-full h-full"
                style={{ border: 'none', marginBottom: 0, paddingBottom: 0 }}
                allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
                allowFullScreen
              />
            )}
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
            <div className="pt-4 pb-2">
              <div className="relative">
                <div className="absolute -inset-x-1 inset-y-0 bg-gradient-to-r from-[var(--card-bg)]/50 via-transparent to-[var(--card-bg)]/50 blur-sm" />
                <h1 className="text-4xl font-semibold text-[var(--foreground)]">{`Track ${trackNumber}`}</h1>
              </div>
            </div>
            
            {/* Description Section */}
            <div className="pb-4 mt-2">
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
          </div>
        </div>
      </div>
    </div>
  );
}

export default MediaPlayer;
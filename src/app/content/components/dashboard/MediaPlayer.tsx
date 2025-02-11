'use client';

import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, ChevronRight, Plus, Minus } from 'lucide-react';
import { cn } from "@/lib/utils";
import { slugify } from "@/lib/utils/slugify";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MediaItem {
  id: string;
  title: string;
  order: number;
  video?: {
    id: string;
    video_id: string;
    title: string;
    order: number;
  };
  text?: {
    id: string;
    content_text: string;
    title: string;
    order: number;
  };
  ai?: {
    id: string;
    tool_id: string;
    title: string;
    order: number;
    tool?: {
      id: string;
      title: string;
      description: string;
      credits_cost: number;
      status: 'draft' | 'published' | 'archived' | 'maintenance';
    };
  };
  pdf?: {
    id: string;
    pdf_url: string;
    title: string;
    order: number;
  };
  quiz?: {
    id: string;
    quiz_data: any;
    title: string;
    order: number;
  };
}

interface MediaPlayerProps {
  title: string;
  description: string;
  isOpen: boolean;
  category?: string;
  videoId?: string;
  courseName?: string;
  mediaItems: MediaItem[];
  onMediaSelect: (item: { id: string; title: string; type: string }) => void;
  selectedMediaItem: MediaItem;
}

export const MediaPlayer = ({
  title,
  description,
  isOpen,
  category,
  videoId,
  courseName,
  mediaItems,
  onMediaSelect,
  selectedMediaItem,
}: MediaPlayerProps) => {
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [activeMediaItem, setActiveMediaItem] = useState<MediaItem | null>(null);
  const [activeType, setActiveType] = useState<string | null>(null);
  const [fontSize, setFontSize] = useState<number>(() => {
    const saved = localStorage.getItem('textLessonFontSize');
    return saved ? parseInt(saved) : 16;
  });
  const [isExpanded, setIsExpanded] = useState(false);

  // Save fontSize to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('textLessonFontSize', fontSize.toString());
  }, [fontSize]);

  // Simple click outside handler
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.font-size-control')) {
        setIsExpanded(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setActiveMediaItem(selectedMediaItem);
    // Only set the initial active type if there isn't one already
    if (!activeType) {
      if (selectedMediaItem.video) setActiveType('video');
      else if (selectedMediaItem.text) setActiveType('text');
      else if (selectedMediaItem.ai) setActiveType('ai');
      else if (selectedMediaItem.pdf) setActiveType('pdf');
      else if (selectedMediaItem.quiz) setActiveType('quiz');
    }
  }, [selectedMediaItem]);

  if (!isOpen) return null;

  // Get all available items for the selected media
  const getMediaItems = (mediaItem: MediaItem) => {
    const items: { id: string; title: string; type: string; order: number }[] = [];
    
    // Add each media type if it exists, using its own order value
    if (mediaItem.video) {
      items.push({
        id: mediaItem.video.id,
        title: mediaItem.video.title || 'Video',
        type: 'video',
        order: mediaItem.video.order
      });
    }
    
    if (mediaItem.ai) {
      items.push({
        id: mediaItem.ai.id,
        title: 'AI Tool',
        type: 'ai',
        order: mediaItem.ai.order
      });
    }
    
    if (mediaItem.pdf?.pdf_url) {
      items.push({
        id: mediaItem.pdf.id,
        title: mediaItem.pdf.title || 'PDF',
        type: 'pdf',
        order: mediaItem.pdf.order
      });
    }
    
    if (mediaItem.text) {
      items.push({
        id: mediaItem.text.id,
        title: mediaItem.text.title || 'Text',
        type: 'text',
        order: mediaItem.text.order
      });
    }
    
    if (mediaItem.quiz) {
      items.push({
        id: mediaItem.quiz.id,
        title: mediaItem.quiz.title || 'Quiz',
        type: 'quiz',
        order: mediaItem.quiz.order
      });
    }

    return items.sort((a, b) => a.order - b.order);
  };

  const handlePillClick = (item: { id: string; title: string; type: string; order: number }) => {
    setActiveType(item.type);
    onMediaSelect(item);
  };

  const selectedItems = activeMediaItem ? getMediaItems(activeMediaItem) : [];

  // Get library ID from environment variable
  const libraryId = process.env.NEXT_PUBLIC_BUNNY_LIBRARY_ID || '376351';
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const playerUrl = videoId ? 
    `https://iframe.mediadelivery.net/embed/376351/${videoId}?autoplay=false` : 
    null;

  const renderContent = () => {
    const contentFrame = (children: React.ReactNode) => (
      <div className="relative flex-1 bg-[var(--background)]">
        {children}
      </div>
    );

    console.log('Current activeType:', activeType);
    console.log('Selected Media Item:', selectedMediaItem);

    switch (activeType) {
      case 'text':
        if (selectedMediaItem.text?.content_text) {
          return contentFrame(
            <div className="absolute inset-0 overflow-auto">
              <div className="p-8">
                <div 
                  className="max-w-3xl mx-auto prose prose-invert relative"
                  style={{ fontSize: `${fontSize}px` }}
                >
                  <ReactMarkdown 
                    remarkPlugins={[remarkGfm]}
                    className="text-[var(--foreground)]"
                    components={{
                      h1: ({node, ...props}) => <h1 className="text-4xl font-bold mb-4 text-[var(--foreground)]" {...props} />,
                      h2: ({node, ...props}) => <h2 className="text-3xl font-bold mb-3 text-[var(--foreground)]" {...props} />,
                      h3: ({node, ...props}) => <h3 className="text-2xl font-bold mb-2 text-[var(--foreground)]" {...props} />,
                      p: ({node, ...props}) => <p className="mb-4 leading-relaxed text-[var(--foreground)]" {...props} />,
                      ul: ({node, ...props}) => <ul className="list-disc pl-6 mb-4 text-[var(--foreground)]" {...props} />,
                      ol: ({node, ...props}) => <ol className="list-decimal pl-6 mb-4 text-[var(--foreground)]" {...props} />,
                      li: ({node, ...props}) => <li className="mb-1 text-[var(--foreground)]" {...props} />,
                      blockquote: ({node, ...props}) => (
                        <blockquote className="border-l-4 border-[var(--accent)] pl-4 italic mb-4 text-[var(--foreground)]" {...props} />
                      ),
                      code: ({node, className, ...props}: any) => {
                        const match = /language-(\w+)/.exec(className || '');
                        return !className ? (
                          <code className="bg-[var(--hover-bg)] px-1 rounded text-[var(--foreground)]" {...props} />
                        ) : (
                          <code className="block bg-[var(--hover-bg)] p-4 rounded mb-4 text-[var(--foreground)]" {...props} />
                        );
                      },
                    }}
                  >
                    {selectedMediaItem.text.content_text}
                  </ReactMarkdown>
                </div>
              </div>
              {/* Dead simple font size control */}
              <div className="sticky bottom-8 right-8 ml-auto mr-8 w-fit">
                <div className="font-size-control">
                  {isExpanded ? (
                    <div className="flex items-center gap-2 bg-[var(--hover-bg)] rounded-full p-2">
                      <button onClick={() => setFontSize(prev => Math.max(prev - 2, 12))} className="p-1">
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-12 text-center">{fontSize}px</span>
                      <button onClick={() => setFontSize(prev => Math.min(prev + 2, 64))} className="p-1">
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => setIsExpanded(true)}
                      className="p-2 rounded-full hover:bg-[var(--hover-bg)]"
                    >
                      <span className="flex items-baseline gap-0.5">
                        <span className="text-xs">a</span>
                        <span className="text-base">A</span>
                      </span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        }
        break;

      case 'ai':
        if (selectedMediaItem.ai) {
          return contentFrame(
            <iframe 
              src={`${siteUrl}/ai/tools/${slugify(selectedMediaItem.ai.title)}`}
              className="absolute inset-0 w-full h-full"
              style={{ border: 'none' }}
              allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
            />
          );
        }
        break;
      
      case 'video':
        if (playerUrl) {
          return contentFrame(
            <iframe 
              src={playerUrl}
              loading="lazy"
              className="absolute inset-0 w-full h-full"
              style={{ border: 'none' }}
              allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture; fullscreen"
              allowFullScreen
              title={title}
            />
          );
        }
        break;

      case 'pdf':
        console.log('Rendering PDF case');
        console.log('PDF data:', selectedMediaItem.pdf);
        if (selectedMediaItem.pdf?.pdf_url) {
          if (!selectedMediaItem.pdf.pdf_url.trim()) {
            return contentFrame(
              <div className="absolute inset-0 flex items-center justify-center text-white">
                <div className="text-center">
                  <p className="mb-2">PDF URL is not available</p>
                  <p className="text-sm text-gray-400">Please contact support if this issue persists</p>
                </div>
              </div>
            );
          }
          console.log('PDF URL found:', selectedMediaItem.pdf.pdf_url);
          return contentFrame(
            <iframe
              src={selectedMediaItem.pdf.pdf_url}
              className="absolute inset-0 w-full h-full"
              style={{ border: 'none' }}
            />
          );
        } else {
          console.log('No PDF URL found in:', selectedMediaItem);
        }
        break;
    }

    console.log('Falling back to default content frame');
    return contentFrame(
      <div className="absolute inset-0 flex items-center justify-center text-[var(--foreground)]">
        {activeType === 'quiz' ? 'Quiz interface coming soon' : 'No content available'}
      </div>
    );
  };

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

        {/* Media Item Pills */}
        <div className="flex gap-2">
          {selectedItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handlePillClick(item)}
              className={cn(
                "px-4 py-1.5 rounded-full text-sm font-medium transition-all hover:scale-105",
                "border-2 text-[var(--text-secondary)] hover:text-[var(--foreground)]",
                activeType === item.type
                  ? "border-[var(--accent)] bg-[var(--hover-bg)]"
                  : "border-transparent bg-[var(--hover-bg)]"
              )}
            >
              {item.title}
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      {renderContent()}

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
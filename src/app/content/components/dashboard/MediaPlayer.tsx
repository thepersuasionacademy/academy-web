'use client';

import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, ChevronRight, Plus, Minus } from 'lucide-react';
import { cn } from "@/lib/utils";
import { slugify } from "@/lib/utils/slugify";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

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

// Get the site URL from window.location if NEXT_PUBLIC_SITE_URL is not set
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');

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
  const [activeMediaItem, setActiveMediaItem] = useState<MediaItem | null>(null);
  const [activeType, setActiveType] = useState<string | null>(null);
  const [showFontSizeDropdown, setShowFontSizeDropdown] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [fontSize, setFontSize] = useState<number>(() => {
    // Initialize from localStorage or default to 16
    const saved = localStorage.getItem('textLessonFontSize');
    return saved ? parseInt(saved) : 16;
  });

  const [session, setSession] = useState<string | null>(null);
  // Use the default client configuration which will pick up the environment variables
  const supabase = createClientComponentClient();

  // Font size presets
  const fontSizePresets = [12, 14, 16, 18, 20, 24, 32, 48, 64];

  // Save fontSize to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('textLessonFontSize', fontSize.toString());
  }, [fontSize]);

  // Close dropdown and expansion when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const fontSizeControl = target.closest('.font-size-control');
      
      // If clicking outside the font size control entirely, close both dropdown and expanded state
      if (!fontSizeControl) {
        setShowFontSizeDropdown(false);
        setIsExpanded(false);
        return;
      }

      // If clicking inside the control but not on specific interactive elements,
      // don't close anything - let the button clicks handle their own state
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Get session on mount
  useEffect(() => {
    const getSession = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        if (currentSession) {
          // Encode the full session object
          const sessionData = {
            access_token: currentSession.access_token,
            refresh_token: currentSession.refresh_token,
            expires_at: currentSession.expires_at
          };
          setSession(btoa(JSON.stringify(sessionData)));
        }
      } catch (error) {
        console.error('Error getting session:', error);
      }
    };
    getSession();
  }, []);

  const increaseFontSize = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFontSize(prev => Math.min(prev + 2, 64));
  };
  
  const decreaseFontSize = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFontSize(prev => Math.max(prev - 2, 12));
  };

  useEffect(() => {
    if (selectedMediaItem) {
      setActiveMediaItem(selectedMediaItem);
      // Only set the initial active type if there isn't one already
      if (!activeType) {
        if (selectedMediaItem.video) setActiveType('video');
        else if (selectedMediaItem.text) setActiveType('text');
        else if (selectedMediaItem.ai) setActiveType('ai');
        else if (selectedMediaItem.pdf) setActiveType('pdf');
        else if (selectedMediaItem.quiz) setActiveType('quiz');
      }
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
                      h1: ({...props}) => <h1 className="text-4xl font-bold mb-4 text-[var(--foreground)]" {...props} />,
                      h2: ({...props}) => <h2 className="text-3xl font-bold mb-3 text-[var(--foreground)]" {...props} />,
                      h3: ({...props}) => <h3 className="text-2xl font-bold mb-2 text-[var(--foreground)]" {...props} />,
                      p: ({...props}) => <p className="mb-4 leading-relaxed text-[var(--foreground)]" {...props} />,
                      ul: ({...props}) => <ul className="list-disc pl-6 mb-4 text-[var(--foreground)]" {...props} />,
                      ol: ({...props}) => <ol className="list-decimal pl-6 mb-4 text-[var(--foreground)]" {...props} />,
                      li: ({...props}) => <li className="mb-1 text-[var(--foreground)]" {...props} />,
                      blockquote: ({...props}) => (
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
              {/* Font size controls - subtle aA with hover/click states */}
              <div className="sticky bottom-8 right-8 ml-auto mr-8 w-fit">
                <div className={cn(
                  "font-size-control group relative flex items-center gap-1 transition-all rounded-full",
                  isExpanded ? "bg-[var(--hover-bg)] px-2" : ""
                )}>
                  {isExpanded ? (
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={decreaseFontSize}
                        className="p-2 rounded-full hover:bg-[var(--background)] transition-colors"
                        aria-label="Decrease font size"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowFontSizeDropdown(!showFontSizeDropdown);
                          }}
                          className="text-sm font-medium px-3 py-2 hover:text-[var(--accent)] transition-colors font-size-trigger"
                        >
                          {fontSize}px
                        </button>
                        {showFontSizeDropdown && (
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 py-2 w-12 bg-[var(--background)] rounded-lg shadow-lg border border-[var(--border-color)] font-size-dropdown">
                            {fontSizePresets.map(size => (
                              <button
                                type="button"
                                key={size}
                                onClick={() => {
                                  setFontSize(size);
                                  setShowFontSizeDropdown(false);
                                }}
                                className={cn(
                                  "w-full px-2 py-1 text-sm text-center hover:bg-[var(--hover-bg)] transition-colors",
                                  fontSize === size && "text-[var(--accent)]"
                                )}
                              >
                                {size}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={increaseFontSize}
                        className="p-2 rounded-full hover:bg-[var(--background)] transition-colors"
                        aria-label="Increase font size"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => setIsExpanded(true)}
                        className="p-2 text-sm font-medium text-center opacity-50 group-hover:opacity-100 transition-all rounded-full group-hover:bg-[var(--hover-bg)] px-3"
                      >
                        <span className="inline-flex items-baseline gap-0.5">
                          <span className="text-xs">a</span>
                          <span className="text-base">A</span>
                        </span>
                      </button>
                      <div className="absolute right-full mr-2 py-1.5 px-3 rounded-full bg-[var(--background)] border border-[var(--border-color)] shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                        Font Size: {fontSize}px
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        }
        break;

      case 'ai':
        if (selectedMediaItem.ai) {
          const sessionParam = session ? `?session=${encodeURIComponent(session)}` : '';
          const toolUrl = `${siteUrl}/ai/tools/${slugify(selectedMediaItem.ai.title)}${sessionParam}`;
          console.log('Loading AI tool with URL:', toolUrl);
          return contentFrame(
            <iframe 
              src={toolUrl}
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

  const handleMediaSelect = (item: { id: string; title: string; type: string }) => {
    setActiveType(item.type);
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
            {courseName && courseName !== title && (
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
                  ? "border-[var(--accent)] bg-[var(--accent)] text-white shadow-[0_2px_10px_-2px_var(--accent)] hover:shadow-[0_4px_15px_-3px_var(--accent)]"
                  : "border-transparent bg-[var(--hover-bg)] shadow-md hover:shadow-lg"
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
          <h1 className={cn(
            "text-2xl font-bold mb-2 relative",
            "bg-clip-text text-transparent",
            "bg-gradient-to-b from-[var(--foreground)] via-[var(--foreground)] to-[color-mix(in_srgb,var(--foreground),transparent_15%)]",
            "[text-shadow:_1px_1px_0_rgba(0,0,0,0.1),_-0.5px_-0.5px_0_rgba(255,255,255,0.05)]",
            "after:content-[attr(data-text)] after:absolute after:left-0 after:top-[0.5px]",
            "after:z-[-1] after:text-[color-mix(in_srgb,var(--foreground),transparent_85%)]",
            "after:[text-shadow:_2px_2px_2px_rgba(0,0,0,0.1)]"
          )}
          data-text={title}
          >
            {title}
          </h1>
          <div className="text-[var(--text-secondary)]">
            {description}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MediaPlayer;
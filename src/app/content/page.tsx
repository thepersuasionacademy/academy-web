'use client';

import React, { useState, useEffect } from 'react';
import { ContentGrid } from '@/app/content/components/dashboard/ContentGrid';
import { SuiteView } from '@/app/content/components/SuiteView';
import { MediaPlayer } from '@/app/content/components/dashboard/MediaPlayer';
import ScrollProgress from '@/app/content/components/ScrollProgress';
import type { MediaItem } from '@/app/content/lib/types';
import { FeaturedContent } from '@/app/content/components/dashboard/FeaturedContent';
import { cn } from '@/lib/utils';
import { getCollections, getContent, getLessons, getStreamingContentBySuiteId, type Collection, type Content, type Lesson, type ContentWithModules } from '@/lib/supabase/learning';
import { ExtendedContent } from '@/types/extended';

type ContentMediaItem = {
  id: string;
  title: string;
  video_id?: string | null;
  video_name?: string | null;
  content_text?: string | null;
  text_title?: string | null;
  tool_id?: string | null;
  tool?: {
    id: string;
    title: string;
    description: string;
    credits_cost: number;
    collection_title: string | null;
    suite_title: string | null;
  } | null;
  pdf_url?: string | null;
  pdf_title?: string | null;
  quiz_data?: Record<string, any> | null;
  quiz_title?: string | null;
  order: number;
};

interface MediaPlayerMediaItem {
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

// Featured content that matches the design
const featuredItem = {
  id: 'focus-flow',
  title: 'Focus Flow',
  description: 'Deep concentration tracks',
  image: '/images/focus-flow.jpg',
  tracks: 12
};

// Convert Supabase Content to MediaItem format for ContentGrid
function convertContentToMediaItem(content: Content): MediaItem {
  return {
    id: content.id,
    title: content.title,
    description: content.description || '',
    image: content.thumbnail_url || '/images/default-content.jpg',
    tracks: 1,
  };
}

// Convert Collection and its Content to Category format for ContentGrid
function convertToCategory(collection: Collection, content: Content[]) {
  return {
    name: collection.name,
    items: content.map(convertContentToMediaItem),
    categoryType: 'learning' as const,
  };
}

// Convert ContentMediaItem to MediaPlayerItem
const convertToMediaItem = (item: ContentMediaItem): MediaPlayerItem => {
  return {
    id: item.id,
    title: item.title,
    order: item.order,
    video: item.video_id ? {
      id: `${item.id}-video`,
      video_id: item.video_id,
      title: item.video_name || item.title,
      order: item.order
    } : undefined,
    text: item.content_text ? {
      id: `${item.id}-text`,
      content_text: item.content_text,
      title: item.text_title || item.title,
      order: item.order
    } : undefined,
    ai: item.tool_id ? {
      id: `${item.id}-ai`,
      tool_id: item.tool_id,
      title: item.tool?.title || item.title,
      order: item.order,
      tool: item.tool ? {
        id: item.tool.id,
        title: item.tool.title,
        description: item.tool.description,
        credits_cost: item.tool.credits_cost,
        status: 'published'
      } : undefined
    } : undefined,
    pdf: item.pdf_url ? {
      id: `${item.id}-pdf`,
      pdf_url: item.pdf_url,
      title: item.pdf_title || item.title,
      order: item.order
    } : undefined,
    quiz: item.quiz_data ? {
      id: `${item.id}-quiz`,
      quiz_data: item.quiz_data,
      title: item.quiz_title || item.title,
      order: item.order
    } : undefined
  };
};

interface MediaPlayerItem {
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

const getMediaItems = (mediaItem: MediaPlayerItem) => {
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
      title: mediaItem.ai.title || 'AI Tool',
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
      title: mediaItem.text.title || 'Text Lesson',
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

export default function Page(): React.JSX.Element {
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [contentByCollection, setContentByCollection] = useState<Record<string, Content[]>>({});
  const [selectedContent, setSelectedContent] = useState<ContentWithModules | null>(null);
  const [selectedMediaItem, setSelectedMediaItem] = useState<MediaPlayerItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isContentLoading, setIsContentLoading] = useState(false);
  const [showMediaPlayer, setShowMediaPlayer] = useState(false);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const collectionsData = await getCollections();
        setCollections(collectionsData || []);

        const contentData: Record<string, Content[]> = {};
        
        if (Array.isArray(collectionsData)) {
          for (const collection of collectionsData) {
            try {
              const collectionContent = await getContent(collection.id);
              contentData[collection.id] = collectionContent;
            } catch (error) {
              console.error(`Error fetching content for collection ${collection.id}`);
              contentData[collection.id] = [];
            }
          }
        }
        
        setContentByCollection(contentData);
      } catch (error) {
        console.error('Error loading data');
        // Set empty arrays to prevent undefined errors
        setCollections([]);
        setContentByCollection({});
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, []);

  // Convert Supabase data to the format expected by ContentGrid
  const categories = React.useMemo(() => {
    if (!collections || collections.length === 0) return [];
    return collections.map(collection => 
      convertToCategory(collection, contentByCollection[collection.id] || [])
    );
  }, [collections, contentByCollection]);

  const handleItemClick = async (itemId: string) => {
    const item = categories
      .flatMap(cat => cat.items)
      .find(item => item.id === itemId);
    if (item) {
      setSelectedItem(item);
      setSelectedLesson(null);
      setIsContentLoading(true);
      try {
        const contentData = await getStreamingContentBySuiteId(itemId);
        setSelectedContent(contentData);
        
        // If there are modules and media items, set up the initial media item
        if (contentData.modules && contentData.modules.length > 0) {
          const firstModule = contentData.modules[0];
          if (firstModule.media && firstModule.media.length > 0) {
            const firstMediaItem = firstModule.media[0];
            setSelectedMediaItem(convertToMediaItem(firstMediaItem));
          }
        }
      } catch (error) {
        console.error('Error loading content');
        setSelectedItem(null);
      } finally {
        setIsContentLoading(false);
      }
    }
  };

  const handleModuleSelect = (moduleId: string, mediaItem: ContentMediaItem) => {
    if (selectedContent) {
      const moduleItem = selectedContent.modules.find(m => m.id === moduleId);
      if (moduleItem) {
        setSelectedMediaItem(convertToMediaItem(mediaItem));
        setShowMediaPlayer(true);
      }
    }
  };

  const handleMediaSelect = (item: { id: string; title: string; type: string }) => {
    if (selectedContent) {
      const moduleWithMedia = selectedContent.modules.find(m => 
        m.media?.some(mediaItem => mediaItem.id === item.id)
      );
      
      if (moduleWithMedia) {
        const mediaItem = moduleWithMedia.media.find(mediaItem => mediaItem.id === item.id);
        if (mediaItem) {
          setSelectedMediaItem(convertToMediaItem(mediaItem));
          setShowMediaPlayer(true);
        }
      }
    }
  };

  return (
    <div className="min-h-screen text-[color:var(--foreground)]" style={{ background: 'var(--background)' }}>
      <ScrollProgress />
      
      <main className="relative">
        <div className="px-[5px]">
          <FeaturedContent 
            content={featuredItem}
            onPlay={() => console.log('Play featured')}
            onLike={() => console.log('Like featured')}
            onShare={() => console.log('Share featured')}
          />
          {isLoading ? (
            <div className="flex justify-center items-center min-h-[200px]">
              <div className="text-[var(--text-secondary)]">Loading content...</div>
            </div>
          ) : categories.length > 0 ? (
            <div className="mt-8">
              <ContentGrid
                categories={categories}
                onItemClick={handleItemClick}
              />
            </div>
          ) : (
            <div className="flex justify-center items-center min-h-[200px]">
              <div className="text-[var(--text-secondary)]">No content available</div>
            </div>
          )}
        </div>

        {selectedContent && selectedContent.content && (
          <div className="fixed inset-0 z-50 flex">
            {selectedMediaItem && (
              <MediaPlayer
                title={selectedContent.content.title}
                description={selectedContent.content.description || ''}
                isOpen={showMediaPlayer}
                courseName={selectedContent.content.title}
                videoId={selectedMediaItem.video?.video_id}
                mediaItems={selectedContent.modules.flatMap(m => m.media || [])}
                onMediaSelect={handleMediaSelect}
                selectedMediaItem={selectedMediaItem as MediaPlayerItem}
              />
            )}
            <div className="w-[400px] overflow-hidden">
              {isContentLoading ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-[var(--text-secondary)]">Loading content...</div>
                </div>
              ) : (
                <SuiteView
                  isOpen={true}
                  onClose={() => {
                    setSelectedItem(null);
                    setSelectedContent(null);
                    setSelectedMediaItem(null);
                    setShowMediaPlayer(false);
                  }}
                  title={selectedContent.content.title}
                  description={selectedContent.content.description || ''}
                  modules={selectedContent.modules}
                  onPlay={handleModuleSelect}
                  thumbnailUrl={selectedContent.content.thumbnail_url}
                  activeMediaItem={selectedMediaItem}
                />
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

<style jsx global>{`
  :root {
    /* Existing variables */
    --background: #ffffff !important; /* Set to desired color with higher specificity */
    --card-bg: transparent !important; /* Override card background to transparent */
    --accent: #ff0000 !important; /* Example: Set to desired accent color */
    --hover-bg: #f0f0f0 !important; /* Example: Set to desired hover background */
    --border-color: #dddddd !important; /* Example: Set to desired border color */
    /* ...other variables */
  }
`}</style>
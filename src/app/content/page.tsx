'use client';

import React, { useState, useEffect } from 'react';
import { ContentGrid } from '@/app/content/components/dashboard/ContentGrid';
import { SuiteView } from '@/app/content/components/SuiteView';
import { MediaPlayer } from '@/app/content/components/dashboard/MediaPlayer';
import ScrollProgress from '@/app/content/components/ScrollProgress';
import type { MediaItem } from '@/app/content/lib/types';
import { FeaturedContent } from '@/app/content/components/dashboard/FeaturedContent';
import { cn } from '@/lib/utils';
import { getCollections, getContent, getLessons, getStreamingContentBySuiteId, type Collection, type Content, type Lesson } from '@/lib/supabase/learning';
import { ExtendedContent } from '@/types/extended';
import { supabase } from '@/lib/supabase';

// Update ContentWithModules type to match access structure
type ModuleType = {
  id: string;
  name: string;
  type: 'module';
  hasAccess: boolean;
  accessDelay?: {
    value: number;
    unit: 'days' | 'weeks' | 'months';
  };
  children?: MediaType[];
};

type MediaType = {
  id: string;
  name: string;
  type: 'media';
  mediaType?: string;
  hasAccess: boolean;
  accessDelay?: {
    value: number;
    unit: 'days' | 'weeks' | 'months';
  };
};

type ContentWithModules = {
  id: string;
  name: string;
  type: 'content';
  hasAccess: boolean;
  description?: string;
  thumbnail_url?: string;
  access_starts_at?: string;
  children?: ModuleType[];
};

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
function convertContentToMediaItem(content: Content): ExtendedMediaItem {
  return {
    id: content.id,
    title: content.title,
    description: content.description || '',
    image: content.thumbnail_url || '/images/default-content.jpg',
    type: 'media',
    order: 0,
    hasAccess: content.has_access || false,
    has_access: content.has_access || false,
    debug_info: content.debug_info
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

type ContentStructure = {
  id: string;
  name: string;
  type: 'content';
  children?: Array<{
    id: string;
    name: string;
    type: 'module';
    order?: number;
    children?: Array<{
      id: string;
      name: string;
      type: 'media';
      order?: number;
    }>;
  }>;
};

// Update MediaItem type to include hasAccess
type MediaItem = {
  id: string;
  title: string;
  type: 'media';
  hasAccess: boolean;
  order: number;
};

// Extend the imported MediaItem type
interface ExtendedMediaItem extends MediaItem {
  hasAccess: boolean;
  name?: string;
  description?: string;
  image?: string;
  debug_info?: any;
  has_access?: boolean;
}

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
    console.log('🔵 Starting content load for item:', itemId);
    const item = categories
      .flatMap(cat => cat.items)
      .find(item => item.id === itemId);
    
    if (item) {
      console.log('🟢 Found item:', {
        id: item.id,
        title: item.title,
        has_access: item.has_access,
        debug_info: item.debug_info
      });
      setSelectedItem(item);
      setSelectedLesson(null);
      setIsContentLoading(true);
      
      try {
        console.log('🟡 Fetching access structure...');
        const { data: accessStructure, error } = await supabase.rpc(
          'get_content_access_structure',
          { p_content_id: itemId }
        );
        
        if (error) {
          console.error('🔴 Access Structure Error:', {
            message: error.message,
            details: error.details
          });
          throw error;
        }
        
        console.log('🟢 Received access structure:', JSON.stringify(accessStructure, null, 2));
        
        if (!accessStructure) {
          throw new Error('No access structure received');
        }

        const contentStructure = accessStructure;
        console.log('🔍 Debug info:', item.debug_info);
        
        // Get access settings and start time from the debug info
        const accessSettings = item.debug_info?.access_settings?.[0];
        const accessStartsAt = item.debug_info?.access_starts_at;
        
        // Helper to check if a media item has access and get its delay
        const getMediaAccess = (id: string) => {
          if (!accessSettings?.children?.[0]?.children) return { hasAccess: false };
          
          // First find the media item in the main children array
          const mediaItem = accessSettings.children[0].children.find(c => c.id === id);
          
          if (!mediaItem) {
            // If not found, look for it in the nested children arrays
            for (const module of accessSettings.children[0].children) {
              const nestedItem = module.children?.find(c => c.id === id);
              if (nestedItem) {
                return {
                  hasAccess: nestedItem.hasAccess,
                  accessDelay: nestedItem.accessDelay
                };
              }
            }
            return { hasAccess: false };
          }
          
          return {
            hasAccess: mediaItem.hasAccess,
            accessDelay: mediaItem.accessDelay
          };
        };
        
        // Ensure the thumbnail_url is set from the item's image
        const contentWithThumbnail: ContentWithModules = {
          id: contentStructure.id,
          name: item.title,
          type: 'content',
          hasAccess: true, // Content level always has access if we can view it
          description: item.description,
          thumbnail_url: item.image,
          access_starts_at: accessStartsAt,
          children: contentStructure.children?.map((module) => ({
            id: module.id,
            name: module.name || `Module ${module.order || 1}`,
            type: 'module',
            hasAccess: true, // Module level always has access
            children: module.children?.map((media) => {
              // Get media access status and delay info
              const accessInfo = getMediaAccess(media.id);
              return {
                id: media.id,
                name: media.name,
                type: 'media' as const,
                hasAccess: accessInfo.hasAccess,
                accessDelay: accessInfo.accessDelay,
                order: media.order || 0
              };
            })
          }))
        };
        
        console.log('🔍 Mapped content structure:', contentWithThumbnail);
        
        setSelectedContent(contentWithThumbnail);
        
        // If there are modules and media items, set up the initial media item
        if (contentWithThumbnail.children && contentWithThumbnail.children.length > 0) {
          const firstModule = contentWithThumbnail.children[0];
          if (firstModule && firstModule.children && firstModule.children.length > 0) {
            const firstMedia = firstModule.children[0];
            if (firstMedia) {
              await handleMediaSelect(firstMedia);
            }
          }
        }
      } catch (error: any) {
        console.error('🔴 Error loading content:', {
          message: error.message,
          response: error.response ? {
            data: error.response.data,
            status: error.response.status
          } : undefined
        });
        setSelectedItem(null);
      } finally {
        setIsContentLoading(false);
      }
    } else {
      console.log('🔴 Item not found in categories:', itemId);
    }
  };

  const handleModuleSelect = async (moduleId: string, mediaItem: { id: string; name: string; type: 'media'; hasAccess: boolean }) => {
    if (mediaItem.hasAccess) {
      await handleMediaSelect(mediaItem);
    }
  };

  const handleMediaSelect = async (mediaItem: { id: string; name: string; type: 'media'; hasAccess: boolean }) => {
    if (!mediaItem.hasAccess) return;
    
    try {
      console.log('🟡 Fetching media content:', mediaItem.id);
      const { data: mediaContent, error } = await supabase.rpc(
        'get_media_content',
        { p_media_id: mediaItem.id }
      );
      
      if (error) {
        console.error('🔴 Media Content Error:', {
          message: error.message,
          details: error.details
        });
        throw error;
      }
      
      console.log('🟢 Received media content:', mediaContent);
      
      if (!mediaContent) {
        throw new Error('No media content received');
      }
      
      setSelectedMediaItem(mediaContent);
      setShowMediaPlayer(true);
    } catch (error: any) {
      console.error('🔴 Error loading media:', error);
    }
  };

  const handleCloseContent = () => {
    setSelectedItem(null);
    setSelectedContent(null);
    setSelectedMediaItem(null);
    setShowMediaPlayer(false);
  };

  const handlePlayMedia = (moduleId: string) => {
    // Implement the logic to handle playing media
    console.log('Playing media:', moduleId);
  };

  const activeMediaItem = selectedMediaItem as MediaPlayerItem;

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

        {/* Content Viewer */}
        {selectedContent && (
          <div className="fixed inset-0 z-50 flex">
            {selectedMediaItem && (
              <MediaPlayer
                title={selectedContent.name}
                description={selectedContent.description || ''}
                isOpen={showMediaPlayer}
                courseName={selectedContent.name}
                videoId={selectedMediaItem.video?.video_id}
                mediaItems={selectedContent.children?.flatMap((module: ModuleType) => 
                  module.children?.filter((media: MediaType) => media.hasAccess).map(media => ({
                    id: media.id,
                    title: media.name,
                    order: 0,
                    [media.mediaType || 'video']: {
                      id: media.id,
                      video_id: media.id,
                      title: media.name,
                      order: 0
                    }
                  })) || []
                ) || []}
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
                  isOpen={!!selectedContent}
                  onClose={handleCloseContent}
                  title={selectedContent?.name || ''}
                  description={selectedContent?.description || ''}
                  modules={selectedContent?.children?.map(module => ({
                    id: module.id,
                    title: module.name,
                    order: module.order || 0,
                    hasAccess: module.hasAccess,
                    accessDelay: module.accessDelay,
                    media: module.children?.map(media => ({
                      id: media.id,
                      title: media.name,
                      order: media.order || 0,
                      hasAccess: media.hasAccess,
                      accessDelay: media.accessDelay,
                      mediaType: media.type
                    })) || []
                  })) || []}
                  accessStartsAt={selectedContent?.access_starts_at || new Date().toISOString()}
                  onPlay={handlePlayMedia}
                  thumbnailUrl={selectedContent?.thumbnail_url}
                  activeMediaItem={activeMediaItem}
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
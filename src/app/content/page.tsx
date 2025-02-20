'use client';

import React, { useState, useEffect } from 'react';
import { ContentGrid } from '@/app/content/components/dashboard/ContentGrid';
import { SuiteView } from '@/app/content/components/SuiteView';
import { MediaPlayer } from '@/app/content/components/dashboard/MediaPlayer';
import ScrollProgress from '@/app/content/components/ScrollProgress';
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
  order: number;
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
  order: number;
  mediaType?: string;
  hasAccess: boolean;
  accessDelay?: {
    value: number;
    unit: 'days' | 'weeks' | 'months';
  };
};

// Update the MediaItem type to match what we're using
interface MediaItem {
  id: string;
  title: string;
  order: number;
  module_id: string;
  mediaType: string;
  hasAccess: boolean;
}

// Update Module type to match what we're using
interface Module {
  id: string;
  title: string;
  order: number;
  media: MediaItem[];
}

interface ContentWithModules {
  id: string;
  name: string;
  type: 'content';
  description: string;
  thumbnail_url: string | null;
  modules: Module[];
}

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

// Update ExtendedMediaItem type to include userAccess
interface ExtendedMediaItem {
  id: string;
  title: string;
  description: string;
  image: string;
  type: 'media';
  order: number;
  hasAccess: boolean;
  has_access: boolean;
  userAccess?: {
    access_starts_at: string;
    access_overrides: {
      media?: Record<string, {
        status: 'locked' | 'pending';
        delay?: {
          unit: 'days' | 'weeks' | 'months';
          value: number;
        };
      }>;
      modules?: Record<string, any>;
    };
  } | null;
  debug_info?: any;
}

// Update MediaPlayerItem to include hasAccess
interface MediaPlayerItem {
  id: string;
  title: string;
  order: number;
  hasAccess: boolean;
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
    order: number
  };
}

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
    hasAccess: true, // If we can convert it, it's accessible
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

// Update types to match the raw data structure
type RawModule = {
  id: string;
  title: string;
  order: number;
  content_id: string;
};

type RawMedia = {
  id: string;
  title: string;
  order: number;
  module_id: string;
  content_id: string;
};

type RawContent = {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  status: string;
};

type RawAccessStructure = {
  content: RawContent;
  modules: RawModule[];
  media: RawMedia[];
  user_access: {
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
};

// Add type for sorting function parameters
function sortByOrder(a: { order: number }, b: { order: number }): number {
  return (a.order || 0) - (b.order || 0);
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
  const [accessStructure, setAccessStructure] = useState<RawAccessStructure | null>(null);

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
        ) as { data: RawAccessStructure };
        
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

        console.log('🔍 Raw access structure:', JSON.stringify(accessStructure, null, 2));

        // Map the raw data to the format SuiteView expects
        const mappedModules = accessStructure.modules.map((module: RawModule) => ({
          id: module.id,
          title: module.title,
          order: module.order || 0,
          media: accessStructure.media
            .filter((media: RawMedia) => media.module_id === module.id)
            .map((media: RawMedia) => ({
              id: media.id,
              title: media.title,
              order: media.order || 0,
              module_id: media.module_id,
              mediaType: 'video', // Default to video for now
              hasAccess: true // We'll handle access in SuiteView
            }))
            .sort((a, b) => (a.order || 0) - (b.order || 0))
        }));

        // Create a default user access object if none exists
        const userAccess = {
          access_starts_at: new Date().toISOString(), // This is when their access starts
          access_overrides: {
            media: {
              // Add pending status for Belief Alchemy
              'abc84830-2b92-495f-8f75-6892f1888172': {
                status: 'pending',
                delay: {
                  unit: 'days',
                  value: 10
                }
              }
            }
          }
        };

        const contentWithAccess: ContentWithModules = {
          id: accessStructure.content.id,
          name: accessStructure.content.title,
          type: 'content',
          description: accessStructure.content.description || '',
          thumbnail_url: accessStructure.content.thumbnail_url,
          modules: mappedModules
        };

        console.log('🔍 Mapped content structure:', contentWithAccess);
        console.log('🔍 User access structure:', userAccess);

        setSelectedContent(contentWithAccess);
        setAccessStructure(userAccess); // Pass the user access object directly

        // If there are modules and media items, set up the initial media item
        if (contentWithAccess.modules && contentWithAccess.modules.length > 0) {
          const firstModule = contentWithAccess.modules[0];
          if (firstModule && firstModule.media && firstModule.media.length > 0) {
            const firstMediaItem = firstModule.media[0];
            await handleMediaSelect(firstMediaItem);
          }
        }
      } catch (error: any) {
        console.error('🔴 Error loading content:', error);
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

  const handleMediaSelect = async (mediaItem: { id: string; title?: string; name?: string; type: string; order?: number; hasAccess?: boolean }) => {
    // Skip if we know the item is not accessible
    if (mediaItem.hasAccess === false) return;
    
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
      
      // Add hasAccess to the media content
      const mediaContentWithAccess = {
        ...mediaContent,
        hasAccess: true, // Media content is accessible if we can fetch it
        title: mediaContent.title || mediaItem.title || mediaItem.name || 'Untitled',
        order: mediaContent.order || mediaItem.order || 0
      };
      
      setSelectedMediaItem(mediaContentWithAccess);
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
                mediaItems={selectedContent.modules.flatMap((module: ModuleType) => 
                  module.media.map(media => ({
                    id: media.id,
                    title: media.title,
                    order: 0,
                    [media.mediaType || 'video']: {
                      id: media.id,
                      video_id: media.id,
                      title: media.title,
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
                  modules={selectedContent?.modules || []}
                  userAccess={accessStructure?.user_access || null}
                  onPlay={handlePlayMedia}
                  thumbnailUrl={selectedContent?.thumbnail_url || undefined}
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
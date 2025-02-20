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
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

// Update types at the top to be simpler
type MediaItem = {
  id: string;
  title: string;
  order: number;
  module_id: string;
};

type Module = {
  id: string;
  title: string;
  order: number;
  media: MediaItem[];
};

type ContentWithModules = {
  id: string;
  name: string;
  type: string;
  description: string;
  thumbnail_url: string;
  modules: Module[];
  collection?: {
    id: string;
    name: string;
    description: string;
  };
};

type RawAccessStructure = {
  user_access: {
    id: string;
    user_id: string;
    content_id: string;
    granted_by: string;
    granted_at: string;
    access_starts_at: string;
    access_overrides: {
      media?: Record<string, {
        status: 'locked' | 'pending';
        delay?: {
          unit: 'days' | 'weeks' | 'months';
          value: number;
        };
      }>;
    };
  } | null;
  content: {
    id: string;
    title: string;
    description: string;
    thumbnail_url: string;
    status: string;
    created_at: string;
    updated_at: string;
    collection_id: string;
  };
  modules: Array<{
    id: string;
    title: string;
    order: number;
  }>;
  media: Array<{
    id: string;
    title: string;
    order: number;
    module_id: string;
  }>;
};

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

// Update the type definitions at the top
type UserAccess = {
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

// Add type for sorting function parameters
function sortByOrder(a: { order: number }, b: { order: number }): number {
  return (a.order || 0) - (b.order || 0);
}

type MediaPlayerItem = {
  id: string;
  title: string;
  url?: string;
  type?: string;
  thumbnail_url?: string;
  description?: string;
  order: number;
  module_id?: string;
  hasAccess?: boolean;
  [key: string]: any; // Allow any additional properties
};

type ContentMediaItem = MediaPlayerItem; // Use the same type for simplicity

export default function Page(): React.JSX.Element {
  const router = useRouter();
  const supabase = createClientComponentClient();
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
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<any>(null);

  // Get session without redirecting (middleware handles auth)
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

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
    setError(null);
    console.log('🔵 Starting content load for item:', itemId);
    
    const foundItem = categories.flatMap(cat => cat.items).find(item => item.id === itemId);
    
    if (foundItem) {
      setIsContentLoading(true);
      console.log('Found item:', foundItem);
      
      try {
        // First verify access using our test function
        console.log('🟡 Checking access record for:', {
          content_id: itemId,
          user_id: session.user.id
        });

        const { data: accessRecord, error: accessError } = await supabase.rpc(
          'test_get_user_access',
          { p_content_id: itemId }
        );

        if (accessError) {
          console.error('🔴 Access Check Error:', {
            message: accessError.message,
            details: accessError.details,
            hint: accessError.hint
          });
          throw accessError;
        }

        console.log('🟢 Access check raw response:', accessRecord);

        // Since it returns a table/array, check if we got any records
        if (!accessRecord || !Array.isArray(accessRecord) || accessRecord.length === 0) {
          console.error('🔴 No access record found:', {
            content_id: itemId,
            user_id: session.user.id,
            response: accessRecord
          });
          throw new Error('You do not have access to this content');
        }

        // Use the first access record (should only be one per user per content)
        const userAccess = accessRecord[0];
        console.log('🟢 Found user access record:', {
          id: userAccess.id,
          content_id: userAccess.content_id,
          granted_at: userAccess.granted_at,
          access_starts_at: userAccess.access_starts_at,
          has_overrides: !!userAccess.access_overrides
        });

        console.log('🟡 Fetching access structure...');
        const { data: accessStructure, error: rpcError } = await supabase.rpc(
          'get_content_access_structure',
          { p_content_id: itemId }
        ) as { data: RawAccessStructure; error: any };
        
        if (rpcError) {
          console.error('🔴 Access Structure Error:', {
            message: rpcError.message,
            details: rpcError.details
          });
          throw rpcError;
        }
        
        console.log('🟢 Received access structure:', JSON.stringify(accessStructure, null, 2));
        
        if (!accessStructure) {
          throw new Error('No access structure received');
        }

        console.log('🔍 Raw access structure:', JSON.stringify(accessStructure, null, 2));

        // Map the raw data to the format SuiteView expects
        const mappedModules = accessStructure.modules.map((module) => ({
          id: module.id,
          title: module.title,
          order: module.order || 0,
          media: accessStructure.media
            .filter((media) => media.module_id === module.id)
            .map((media) => ({
              id: media.id,
              title: media.title,
              order: media.order || 0,
              module_id: media.module_id
            }))
            .sort((a, b) => (a.order || 0) - (b.order || 0))
        }));

        const contentWithAccess: ContentWithModules = {
          id: accessStructure.content.id,
          name: accessStructure.content.title,
          type: 'content',
          description: accessStructure.content.description || '',
          thumbnail_url: accessStructure.content.thumbnail_url,
          modules: mappedModules,
          collection: accessStructure.content.collection_id ? {
            id: accessStructure.content.collection_id,
            name: '', // We'll need to fetch this if needed
            description: ''
          } : undefined
        };

        console.log('🔍 Mapped content structure:', contentWithAccess);

        setSelectedContent(contentWithAccess);
        setAccessStructure(accessStructure);

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
        setError(error.message || 'Error loading content');
        setSelectedItem(null);
      } finally {
        setIsContentLoading(false);
      }
    } else {
      console.log('🔴 Item not found in categories:', itemId);
      setError('Content not found');
    }
  };

  const handleModuleSelect = async (moduleId: string, mediaItem: MediaItem) => {
    await handleMediaSelect(mediaItem);
  };

  const handleMediaSelect = async (mediaItem: MediaItem) => {
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
      
      setSelectedItem(mediaItem);
    } catch (error: any) {
      console.error('🔴 Error loading media:', error);
    }
  };

  const handleCloseContent = () => {
    setSelectedItem(null);
    setSelectedContent(null);
  };

  const handlePlayMedia = (moduleId: string, mediaItem: MediaItem) => {
    try {
      console.log('🟡 Playing media:', { moduleId, mediaItem });
      
      // First get the media content from the RPC
      supabase.rpc('get_media_content', { p_media_id: mediaItem.id })
        .then(({ data: mediaContent, error }) => {
          if (error) {
            console.error('🔴 Media Content Error:', error);
            return;
          }
          
          console.log('🟢 Received media content:', mediaContent);
          
          if (!mediaContent) {
            console.error('No media content received');
            return;
          }

          // Convert the media content to the format expected by MediaPlayer
          const convertedMediaItem = {
            ...mediaContent,
            id: mediaContent.id,
            title: mediaContent.title,
            order: mediaContent.order,
            video: mediaContent.video,
            text: mediaContent.text,
            ai: mediaContent.ai,
            pdf: mediaContent.pdf,
            quiz: mediaContent.quiz
          };
          
          // Set the selected media item and show the media player
          setSelectedMediaItem(convertedMediaItem);
          setShowMediaPlayer(true);
        });
    } catch (error) {
      console.error('🔴 Error playing media:', error);
    }
  };

  return (
    <div className="min-h-screen text-[color:var(--foreground)]" style={{ background: 'var(--background)' }}>
      <ScrollProgress />
      
      <main className="relative">
        <div className="px-[5px]">
          {error && (
            <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
              {error}
            </div>
          )}
          
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
          <div className="fixed inset-0 z-50 bg-[var(--background)] flex justify-end">
            {showMediaPlayer && selectedMediaItem ? (
              <div className="flex-1 h-full border-r border-[var(--border-color)]">
                <MediaPlayer
                  title={selectedContent?.name || ''}
                  description={selectedContent?.description || ''}
                  isOpen={showMediaPlayer}
                  category={selectedContent?.collection?.name}
                  videoId={selectedMediaItem?.video?.video_id}
                  courseName={selectedContent?.name}
                  mediaItems={[selectedMediaItem]}
                  onMediaSelect={() => {}}
                  selectedMediaItem={selectedMediaItem}
                />
              </div>
            ) : (
              <div className="flex-1 h-full flex items-center justify-center text-[var(--text-secondary)] border-r border-[var(--border-color)]">
                Select a media item to begin
              </div>
            )}
            
            <div className="w-[400px] flex-shrink-0">
              <SuiteView
                isOpen={!!selectedContent}
                onClose={handleCloseContent}
                title={selectedContent?.name || ''}
                description={selectedContent?.description || ''}
                modules={selectedContent?.modules || []}
                userAccess={accessStructure?.user_access ? {
                  access_starts_at: accessStructure.user_access.access_starts_at,
                  access_overrides: accessStructure.user_access.access_overrides
                } : null}
                onPlay={handlePlayMedia}
                thumbnailUrl={selectedContent?.thumbnail_url}
                activeMediaItem={selectedItem}
              />
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
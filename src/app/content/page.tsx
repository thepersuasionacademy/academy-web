'use client';

import React, { useState, useEffect } from 'react';
import { ContentGrid } from '@/app/content/components/dashboard/ContentGrid';
import { SuiteView } from '@/app/content/components/SuiteView';
import { MediaPlayer } from '@/app/content/components/dashboard/MediaPlayer';
import ScrollProgress from '@/app/content/components/ScrollProgress';
import { CategoryPills } from '@/app/content/components/CategoryPills';
import type { MediaItem } from '@/app/content/lib/types';
import { FeaturedContent } from '@/app/content/components/dashboard/FeaturedContent';
import { cn } from '@/lib/utils';
import { getCollections, getContent, getLessons, getContentById, type Collection, type Content, type Lesson, type ContentWithModules } from '@/lib/supabase/learning';

// Featured content that matches the design
const featuredItem = {
  id: 'focus-flow',
  title: 'Focus Flow',
  description: 'Deep concentration tracks',
  image: '/images/focus-flow.jpg',
  tracks: 12
};

interface MediaItemType {
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

export default function Page(): React.JSX.Element {
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);
  const [activeCategory, setActiveCategory] = useState<'learning' | 'imprinting'>('learning');
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [contentByCollection, setContentByCollection] = useState<Record<string, Content[]>>({});
  const [selectedContent, setSelectedContent] = useState<ContentWithModules | null>(null);
  const [selectedMediaItem, setSelectedMediaItem] = useState<MediaItemType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showMediaPlayer, setShowMediaPlayer] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        console.log('Fetching collections...');
        const collectionsData = await getCollections();
        console.log('Collections fetched:', collectionsData);
        setCollections(collectionsData);

        const contentData: Record<string, Content[]> = {};
        
        for (const collection of collectionsData) {
          try {
            console.log(`Fetching content for collection ${collection.id}...`);
            const collectionContent = await getContent(collection.id);
            console.log(`Content fetched for collection ${collection.id}:`, collectionContent);
            if (Array.isArray(collectionContent)) {
              contentData[collection.id] = collectionContent;
            }
          } catch (error) {
            console.error(`Error fetching content for collection ${collection.id}:`, error);
            contentData[collection.id] = [];
          }
        }
        
        console.log('All content data:', contentData);
        setContentByCollection(contentData);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, []);

  // Convert Supabase data to the format expected by ContentGrid
  const categories = collections
    .map(collection => convertToCategory(collection, contentByCollection[collection.id] || []));

  const handleItemClick = async (itemId: string) => {
    const item = categories
      .flatMap(cat => cat.items)
      .find(item => item.id === itemId);
    if (item) {
      setSelectedItem(item);
      setSelectedLesson(null);
      try {
        const contentData = await getContentById(itemId);
        setSelectedContent(contentData);
      } catch (error) {
        console.error('Error fetching content details:', error);
      }
    }
  };

  const handleModuleSelect = (moduleId: string, mediaItem: MediaItemType) => {
    if (selectedContent) {
      const moduleItem = selectedContent.modules.find(m => m.id === moduleId);
      if (moduleItem) {
        console.log('Selected media item:', mediaItem);
        setSelectedMediaItem(mediaItem);
        setShowMediaPlayer(true);
      }
    }
  };

  const handleMediaSelect = (item: { id: string; title: string; type: string }) => {
    // No need for complex logic here since MediaPlayer handles the state internally
    if (selectedMediaItem) {
      setSelectedMediaItem({...selectedMediaItem});
      setShowMediaPlayer(true);
    }
  };

  return (
    <div className="min-h-screen text-[color:var(--foreground)]" style={{ background: 'var(--background)' }}>
      <ScrollProgress />
      
      <main className="relative">
      <div className="backdrop-blur-md bg-[var(--background)]/80 border-b border-[var(--border-color)]">
          <div className="relative">
            <div className="px-[10px]">
              <CategoryPills onCategoryChange={setActiveCategory} />
            </div>
          </div>
        </div>

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
          ) : (
            <div className="mt-8">
              <ContentGrid
                categories={categories}
                onItemClick={handleItemClick}
              />
            </div>
          )}
        </div>

        {/* Overlay layer for SuiteView */}
        {selectedItem && selectedContent && (
          <div 
            className="fixed inset-0 z-50 flex overflow-hidden"
            onClick={(e) => {
              if (!showMediaPlayer && e.target === e.currentTarget) {
                setSelectedItem(null);
                setSelectedContent(null);
                setSelectedMediaItem(null);
                setShowMediaPlayer(false);
              }
            }}
          >
            {/* Left side - empty until media is selected */}
            <div className="flex-1">
              {selectedMediaItem && showMediaPlayer && (
                <MediaPlayer
                  title={selectedMediaItem.title}
                  description={selectedContent.content.description || ''}
                  isOpen={true}
                  category={categories.find(cat => 
                    cat.items.some(item => item.id === selectedItem?.id)
                  )?.name}
                  courseName={selectedContent.content.title}
                  videoId={selectedMediaItem.video?.video_id}
                  mediaItems={selectedContent.modules[0].media}
                  selectedMediaItem={selectedMediaItem}
                  onMediaSelect={handleMediaSelect}
                />
              )}
            </div>

            {/* SuiteView - always shown when content is selected */}
            <div className="w-[400px] overflow-hidden">
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
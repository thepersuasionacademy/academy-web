'use client';

import React, { useState } from 'react';
import { ContentGrid } from '@/app/content/components/dashboard/ContentGrid';
import { SuiteView } from '@/app/content/components/dashboard/SuiteView';
import { MediaPlayer } from '@/app/content/components/dashboard/MediaPlayer';
import ScrollProgress from '@/app/content/components/ScrollProgress';
import { CategoryPills } from '@/app/content/components/CategoryPills';
import { categories } from '@/app/content/lib/data';
import type { MediaItem } from '@/app/content/lib/types';
import { FeaturedContent } from '@/app/content/components/dashboard/FeaturedContent';
import { cn } from '@/lib/utils';

// Featured content that matches the design
const featuredItem = {
  id: 'focus-flow',
  title: 'Focus Flow',
  description: 'Deep concentration tracks',
  image: '/images/focus-flow.jpg',
  tracks: 12
};

// Mock description for all media items
const MOCK_DESCRIPTION = "Experience transformative content designed to enhance your mental capabilities and unlock your full potential. This carefully crafted series combines cutting-edge techniques with proven methodologies to deliver exceptional results.";

export default function Page(): React.JSX.Element {
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);
  const [activeCategory, setActiveCategory] = useState<'mind' | 'training'>('mind');
  const [selectedTrackNumber, setSelectedTrackNumber] = useState<number | undefined>();
  const [isSuiteCollapsed, setIsSuiteCollapsed] = useState(false);

  // Filter categories based on active category
  const filteredCategories = categories.filter(cat => {
    return cat.categoryType === activeCategory;
  });

  const handleItemClick = (itemId: string) => {
    const item = filteredCategories
      .flatMap(cat => cat.items)
      .find(item => item.id === itemId);
    if (item) {
      setSelectedItem(item);
      setSelectedTrackNumber(undefined);
    }
  };

  const handleSuiteClose = () => {
    setSelectedItem(null);
    setSelectedTrackNumber(undefined);
  };

  const handleTrackSelect = (trackNumber: number) => {
    if (selectedItem) {
      setSelectedTrackNumber(trackNumber);
    }
  };

  const handleSuiteAction = (action: 'play' | 'like' | 'share') => {
    if (!selectedItem) return;
    
    switch (action) {
      case 'play':
        handleTrackSelect(0); // Play first track
        break;
      case 'like':
        console.log('Liked:', selectedItem.title);
        break;
      case 'share':
        console.log('Sharing:', selectedItem.title);
        break;
    }
  };

  return (
    <div className="min-h-screen text-[color:var(--foreground)]" style={{ background: 'var(--background)' }}>
      <ScrollProgress />
      
      <main className="relative">
        <div className="sticky top-0 z-10 backdrop-blur-md bg-[var(--background)]/80 border-b border-[var(--border-color)]">
          <div className="px-[10px]">
            <CategoryPills onCategoryChange={setActiveCategory} />
          </div>
        </div>

        <div className="px-[5px]">
          <FeaturedContent 
            content={featuredItem}
            onPlay={() => console.log('Play featured')}
            onLike={() => console.log('Like featured')}
            onShare={() => console.log('Share featured')}
          />
          <div className="mt-8">
            <ContentGrid
              categories={filteredCategories}
              onItemClick={handleItemClick}
            />
          </div>
        </div>

        {/* Overlay layer for MediaPlayer and SuiteView */}
        {selectedItem && (
          <div className="fixed inset-0 z-50 flex overflow-hidden">
            {/* Main Content Area - MediaPlayer */}
            {selectedTrackNumber !== undefined && (
              <div className="flex-1 flex bg-black">
                <MediaPlayer
                  title={selectedItem.title}
                  trackNumber={selectedTrackNumber + 1}
                  description={MOCK_DESCRIPTION}
                  isOpen={true}
                />
              </div>
            )}

            {/* Suite View */}
            <div className={cn(
              isSuiteCollapsed ? "w-[100px]" : "w-[450px]",
              "transition-all duration-300 border-l border-white/10"
            )}>
              <SuiteView
                isOpen={true}
                onClose={handleSuiteClose}
                isCollapsed={isSuiteCollapsed}
                onToggleCollapse={() => setIsSuiteCollapsed(!isSuiteCollapsed)}
                title={selectedItem.title}
                description={selectedItem.description}
                image={selectedItem.image}
                tracks={selectedItem.tracks || 0}
                onPlay={() => handleSuiteAction('play')}
                onLike={() => handleSuiteAction('like')}
                onShare={() => handleSuiteAction('share')}
                onTrackSelect={handleTrackSelect}
                selectedTrackNumber={selectedTrackNumber}
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
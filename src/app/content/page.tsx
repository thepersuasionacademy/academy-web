'use client';

import React, { useState } from 'react';
import { ContentGrid } from '@/app/content/components/dashboard/ContentGrid';
import { SuiteView } from '@/streaming/components/dashboard/SuiteView';
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

  const handleSuiteAction = (action: 'play') => {
    if (!selectedItem) return;
    
    if (action === 'play') {
      handleTrackSelect(0); // Play first track
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
            {/* Main Content Area - MediaPlayer Container */}
            {selectedTrackNumber !== undefined && (
              <div className="flex-1 flex bg-[var(--card-bg)] relative">
                <div className="absolute inset-0 pr-[400px]">
                  <div className="w-full h-full pr-16">
                    <MediaPlayer
                      title={selectedItem.title}
                      trackNumber={selectedTrackNumber + 1}
                      description={MOCK_DESCRIPTION}
                      isOpen={true}
                      category={filteredCategories.find(cat => 
                        cat.items.some(item => item.id === selectedItem?.id)
                      )?.name}
                      suite={selectedItem.title}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Suite View - Absolute positioned */}
            <div className="absolute right-0 top-0 bottom-0 w-[400px] bg-[var(--card-bg)]">
              <SuiteView
                isOpen={true}
                onClose={handleSuiteClose}
                title={selectedItem.title}
                description={selectedItem.description}
                image={selectedItem.image}
                tracks={selectedItem.tracks || 0}
                onPlay={handleTrackSelect}
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
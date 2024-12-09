'use client';

import { useState } from 'react';
import NavigationBar from '@/components/media/NavigationBar';  // Add this import
import { FeaturedContent } from '@/components/media/FeaturedContent';
import { ContentGrid } from '@/components/media/ContentGrid';
import { MediaPlayer } from '@/components/player';
import { categories, MediaItem } from '@/components/media/types';
import { PlayerState } from '@/components/player/types';

export default function Home() {
  const [playerState, setPlayerState] = useState<PlayerState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 0.7,
    title: 'Focus Flow',
    artist: 'Daily Mix',
    coverImage: '/api/placeholder/60/60'
  });

  const featuredContent = categories[0].items[0];

  const handlePlay = (item: MediaItem) => {
    setPlayerState(prev => ({
      ...prev,
      isPlaying: true,
      title: item.title,
      artist: item.artist || '',
      coverImage: item.image,
      duration: item.duration || 0
    }));
  };

  const handleLike = () => {
    // Implement like functionality
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: playerState.title,
          text: 'Check out this track',
          url: window.location.href
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    }
  };

  return (
    <div className="min-h-screen bg-zinc-900 text-white">
      <NavigationBar />  {/* Add this line */}
      <main className="pb-24">
        <FeaturedContent 
          content={featuredContent}
          onPlay={() => handlePlay(featuredContent)}
          onLike={handleLike}
          onShare={handleShare}
        />
        
        <ContentGrid 
          categories={categories}
          onItemClick={(itemId) => {
            const item = categories
              .flatMap(cat => cat.items)
              .find(item => item.id === itemId);
            if (item) handlePlay(item);
          }}
        />
  
        <MediaPlayer 
          initialState={playerState}
          onStateChange={(newState) => setPlayerState(prev => ({ ...prev, ...newState }))}
        />
      </main>
    </div>
  );
}
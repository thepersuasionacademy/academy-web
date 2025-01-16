'use client';

import { useState, useEffect, useRef } from 'react';
import NavigationBar from '@/streaming/components/dashboard/navigation/NavigationBar';
import { FeaturedContent } from '@/streaming/components/dashboard/FeaturedContent';
import { ContentGrid } from '@/streaming/components/dashboard/ContentGrid';
import { MediaPlayer } from '@/streaming/components/player';
import { SuiteView } from '@/streaming/components/dashboard/SuiteView';
import { categories, MediaItem } from '@/app/mind/lib/types/dashboard';
import { PlayerState, PlayerView } from '@/streaming/lib/types/media';

const AUDIO_SOURCES = {
  audio: "https://mindmasterystack-streamingbucket7fe001bf-0msumefkguly.s3.us-east-2.amazonaws.com/00+-+Pre-float+Preparation.mp3"
};

export default function Home() {
  const [playerState, setPlayerState] = useState<PlayerState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 0.7,
    title: 'Focus Flow',
    artist: 'Daily Mix',
    coverImage: '/api/placeholder/60/60',
    isLiked: false,
    view: PlayerView.BAR
  });

  const [selectedSuite, setSelectedSuite] = useState<MediaItem | null>(null);
  const scrollPositionRef = useRef(0);

  const featuredContent = categories[0].items[0];

  useEffect(() => {
    if (selectedSuite) {
      // Store current scroll position when opening suite
      scrollPositionRef.current = window.scrollY;
    } else {
      // Restore scroll position when closing suite
      requestAnimationFrame(() => {
        window.scrollTo(0, scrollPositionRef.current);
      });
    }
  }, [selectedSuite]);

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

  const handleTrackPlay = (trackId: string) => {
    if (selectedSuite) {
      handlePlay({
        ...selectedSuite,
        title: `${selectedSuite.title} - Track ${trackId}`
      });
    }
  };

  const handleLike = () => {
    setPlayerState(prev => ({
      ...prev,
      isLiked: !prev.isLiked
    }));
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
      <NavigationBar />
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
            if (item) setSelectedSuite(item);
          }}
        />
  
        <MediaPlayer 
          streamUrl={AUDIO_SOURCES.audio}
          initialState={playerState}
          onStateChange={(newState) => setPlayerState(prev => ({ ...prev, ...newState }))}
        />

        {selectedSuite && (
          <SuiteView
            isOpen={true}
            onClose={() => setSelectedSuite(null)}
            title={selectedSuite.title}
            description={selectedSuite.description || ''}
            image={selectedSuite.image}
            tracks={selectedSuite.tracks}
            onPlay={handleTrackPlay}
            onLike={handleLike}
            onShare={handleShare}
          />
        )}
      </main>
    </div>
  );
}
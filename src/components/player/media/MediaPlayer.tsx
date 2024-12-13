// MediaPlayer.tsx
import React, { useState } from 'react';
import { AudioPlayer } from './AudioPlayer';
import { VideoPlayer } from './VideoPlayer';
import { BarView } from '../views/BarView';
import { FullscreenView } from '../views/FullScreenView';
import { PlayerView, PlayerState, MediaType } from '@/lib/types/media';

interface MediaPlayerProps {
  streamUrl: string;
  mediaType?: MediaType;
  initialState: PlayerState;
  onStateChange: (state: Partial<PlayerState>) => void;
  poster?: string;
  quality?: string;
}

export const MediaPlayer: React.FC<MediaPlayerProps> = ({ 
  streamUrl, 
  mediaType = MediaType.AUDIO,
  initialState, 
  onStateChange,
  poster,
  quality = 'auto'
}) => {
  const [playerDuration, setPlayerDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  
  const handleTimeUpdate = (time: number) => {
    setCurrentTime(time);
    onStateChange({ currentTime: time });
  };

  const handleDurationChange = (duration: number) => {
    setPlayerDuration(duration);
    onStateChange({ duration });
  };

  const handleViewChange = (view: PlayerView) => {
    onStateChange({ view });
  };

  const handleError = (error: string) => {
    console.error('Media error:', error);
    onStateChange({ 
      isPlaying: false,
      error
    });
  };

  const handleStateChange = (newState: Partial<PlayerState>) => {
    if (newState.currentTime !== undefined) {
      setCurrentTime(newState.currentTime);
    }
    onStateChange(newState);
  };

  return (
    <>
      {mediaType === MediaType.AUDIO ? (
        <AudioPlayer
          src={streamUrl}
          isPlaying={initialState.isPlaying}
          currentTime={currentTime}
          volume={initialState.volume}
          onTimeUpdate={handleTimeUpdate}
          onDurationChange={handleDurationChange}
          onError={handleError}
        />
      ) : (
        <VideoPlayer
          src={streamUrl}
          isPlaying={initialState.isPlaying}
          currentTime={currentTime}
          volume={initialState.volume}
          quality={quality}
          poster={poster}
          onTimeUpdate={handleTimeUpdate}
          onDurationChange={handleDurationChange}
          onError={handleError}
        />
      )}

      {initialState.view === PlayerView.BAR && (
        <BarView
          state={{
            ...initialState,
            currentTime: currentTime,
            duration: playerDuration
          }}
          onStateChange={handleStateChange}
          onViewChange={handleViewChange}
        />
      )}
      
      {initialState.view === PlayerView.FULLSCREEN && (
        <FullscreenView
          state={{
            ...initialState,
            currentTime: currentTime,
            duration: playerDuration
          }}
          onStateChange={handleStateChange}
          onViewChange={handleViewChange}
        />
      )}
    </>
  );
};
import React, { useRef, useEffect } from 'react';

interface AudioPlayerProps {
  src: string;
  onTimeUpdate: (time: number) => void;
  onDurationChange: (duration: number) => void;
  isPlaying: boolean;
  currentTime: number;
  volume: number;
  onError?: (error: string) => void;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  src,
  onTimeUpdate,
  onDurationChange,
  isPlaying,
  currentTime,
  volume,
  onError
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const playPromiseRef = useRef<Promise<void> | null>(null);

  // Reset states when source changes
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
      onTimeUpdate(0);
      onDurationChange(0);
      
      audio.src = src;
      audio.load();
    }
  }, [src]);

  // Handle play/pause
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handlePlay = async () => {
      try {
        // If there's a pending play operation, wait for it
        if (playPromiseRef.current) {
          await playPromiseRef.current;
        }
        
        // Start new play operation
        if (isPlaying) {
          playPromiseRef.current = audio.play();
          await playPromiseRef.current;
        } else {
          audio.pause();
        }
        playPromiseRef.current = null;
      } catch (error) {
        // Only log errors that aren't abort errors
        if (error instanceof Error && error.name !== 'AbortError') {
          console.error('Playback error:', error);
          onError?.('Failed to play audio');
        }
        playPromiseRef.current = null;
      }
    };

    handlePlay();
  }, [isPlaying]);

  // Handle seeking
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (Math.abs(audio.currentTime - currentTime) > 0.1) {
      audio.currentTime = currentTime;
    }
  }, [currentTime]);

  // Handle volume
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.volume = volume;
    }
  }, [volume]);

  return (
    <audio
      ref={audioRef}
      onTimeUpdate={(e) => onTimeUpdate(e.currentTarget.currentTime)}
      onLoadedMetadata={(e) => {
        const duration = e.currentTarget.duration;
        console.log('Audio loaded, duration:', duration);
        onDurationChange(duration);
      }}
      onError={(e) => {
        console.error('Audio error:', e);
        onError?.('Failed to load audio');
      }}
      preload="auto"
      playsInline
    />
  );
};
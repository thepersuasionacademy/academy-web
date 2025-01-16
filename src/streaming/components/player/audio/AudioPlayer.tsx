import React, { useRef, useEffect } from 'react';

interface AudioPlayerProps {
  src: string;
  onTimeUpdate: (time: number) => void;
  onDurationChange: (duration: number) => void;
  isPlaying: boolean;
  currentTime?: number;
  volume: number;
  onError?: (error: string) => void;
  onBuffering?: (isBuffering: boolean) => void;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  src,
  onTimeUpdate,
  onDurationChange,
  isPlaying,
  currentTime,
  volume,
  onError,
  onBuffering
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);

  // Initialize audio element
  useEffect(() => {
    if (audioRef.current) {
      // Set optimal buffering strategy
      audioRef.current.preload = "auto";
      audioRef.current.autoplay = false;
      
      // Set larger buffer size (in seconds)
      if ('bufferSize' in audioRef.current) {
        (audioRef.current as any).bufferSize = 50;
      }
    }
  }, []);

  // Handle source changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.load();
    }
  }, [src]);

  // Playback control with error handling
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const playWithRetry = async () => {
      if (isPlaying) {
        try {
          await audio.play();
        } catch (error) {
          // Wait briefly and retry once
          await new Promise(resolve => setTimeout(resolve, 300));
          try {
            await audio.play();
          } catch (playError) {
            console.error('Playback error:', playError);
            onError?.('Playback error occurred');
          }
        }
      } else {
        audio.pause();
      }
    };

    playWithRetry();
  }, [isPlaying, onError]);

  // Smooth time control
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || currentTime === undefined) return;

    // Only seek if the difference is significant
    if (Math.abs(audio.currentTime - currentTime) > 0.5) {
      audio.currentTime = currentTime;
    }
  }, [currentTime]);

  // Volume control with smoothing
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // Smooth volume transition
    const steps = 5;
    const currentVolume = audio.volume;
    const volumeDiff = volume - currentVolume;
    const stepSize = volumeDiff / steps;

    let step = 0;
    const smoothVolume = () => {
      if (step < steps) {
        audio.volume = currentVolume + (stepSize * step);
        step++;
        requestAnimationFrame(smoothVolume);
      } else {
        audio.volume = volume;
      }
    };

    requestAnimationFrame(smoothVolume);
  }, [volume]);

  return (
    <audio
      ref={audioRef}
      src={src}
      onTimeUpdate={(e) => onTimeUpdate(e.currentTarget.currentTime)}
      onDurationChange={(e) => onDurationChange(e.currentTarget.duration)}
      onWaiting={() => onBuffering?.(true)}
      onPlaying={() => onBuffering?.(false)}
      onSeeking={() => onBuffering?.(true)}
      onSeeked={() => onBuffering?.(false)}
      onError={(e) => {
        console.error('Audio error:', e);
        onError?.('Audio loading error');
      }}
      preload="auto"
      playsInline
    />
  );
};
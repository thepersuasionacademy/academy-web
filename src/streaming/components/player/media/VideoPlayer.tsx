import React, { useRef, useEffect, forwardRef } from 'react';

interface VideoPlayerProps {
  src: string;
  onTimeUpdate: (time: number) => void;
  onDurationChange: (duration: number) => void;
  isPlaying: boolean;
  currentTime?: number;
  volume: number;
  quality: string;
  poster?: string;
  onError?: (error: string) => void;
  onBuffering?: (isBuffering: boolean) => void;
  onQualityChange?: (quality: string) => void;
}

export const VideoPlayer = forwardRef<HTMLVideoElement, VideoPlayerProps>(({
  src,
  onTimeUpdate,
  onDurationChange,
  isPlaying,
  currentTime,
  volume,
  quality,
  poster,
  onError,
  onBuffering,
  onQualityChange
}, ref) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const actualRef = (ref as React.RefObject<HTMLVideoElement>) || videoRef;

  useEffect(() => {
    if (actualRef.current) {
      actualRef.current.preload = "auto";
      actualRef.current.autoplay = false;
    }
  }, []);

  useEffect(() => {
    if (actualRef.current) {
      actualRef.current.load();
    }
  }, [src]);

  useEffect(() => {
    const video = actualRef.current;
    if (!video) return;

    const playWithRetry = async () => {
      if (isPlaying) {
        try {
          await video.play();
        } catch (error) {
          await new Promise(resolve => setTimeout(resolve, 300));
          try {
            await video.play();
          } catch (playError) {
            console.error('Playback error:', playError);
            onError?.('Playback error occurred');
          }
        }
      } else {
        video.pause();
      }
    };

    playWithRetry();
  }, [isPlaying, onError]);

  useEffect(() => {
    const video = actualRef.current;
    if (!video || currentTime === undefined) return;

    if (Math.abs(video.currentTime - currentTime) > 0.5) {
      video.currentTime = currentTime;
    }
  }, [currentTime]);

  useEffect(() => {
    const video = actualRef.current;
    if (!video) return;

    const steps = 5;
    const currentVolume = video.volume;
    const volumeDiff = volume - currentVolume;
    const stepSize = volumeDiff / steps;

    let step = 0;
    const smoothVolume = () => {
      if (step < steps) {
        video.volume = currentVolume + (stepSize * step);
        step++;
        requestAnimationFrame(smoothVolume);
      } else {
        video.volume = volume;
      }
    };

    requestAnimationFrame(smoothVolume);
  }, [volume]);

  return (
    <video
      ref={actualRef}
      src={src}
      poster={poster}
      onTimeUpdate={(e) => onTimeUpdate(e.currentTarget.currentTime)}
      onDurationChange={(e) => onDurationChange(e.currentTarget.duration)}
      onWaiting={() => onBuffering?.(true)}
      onPlaying={() => onBuffering?.(false)}
      onSeeking={() => onBuffering?.(true)}
      onSeeked={() => onBuffering?.(false)}
      onError={(e) => {
        console.error('Video error:', e);
        onError?.('Video loading error');
      }}
      preload="auto"
      playsInline
    />
  );
});

VideoPlayer.displayName = 'VideoPlayer';
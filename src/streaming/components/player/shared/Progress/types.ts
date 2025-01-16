// src/components/player/shared/Progress/types.ts
export interface ProgressProps {
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
  onPause?: () => void;
  onResume?: () => void;
}
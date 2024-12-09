// shared/Progress/types.ts
export interface ProgressProps {
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
 }
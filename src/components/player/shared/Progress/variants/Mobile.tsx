// components/player/shared/Progress/variants/Mobile.tsx
import React from 'react';
import type { ProgressProps } from '../types';

export const Mobile = ({ currentTime, duration, onSeek }: ProgressProps) => (
  <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
    <div 
      className="h-full bg-red-500/60 rounded-full" 
      style={{ width: `${(currentTime / duration) * 100}%` }} 
    />
  </div>
);
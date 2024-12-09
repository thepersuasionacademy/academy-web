// components/player/shared/NowPlaying/variants/Desktop.tsx
import React from 'react';
import { Heart } from 'lucide-react';
import type { NowPlayingProps } from '../types';

export const Desktop = ({ title, artist, coverImage, isLiked, onLikeToggle }: NowPlayingProps) => (
  <div className="flex items-center space-x-4">
    <img src={coverImage} alt="Now playing" className="w-12 h-12 rounded shadow-lg" />
    <div>
      <p className="font-medium text-white/90">{title}</p>
      <p className="text-sm text-white/60">{artist}</p>
    </div>
    <button 
      onClick={onLikeToggle}
      className={`transition-colors ${isLiked ? 'text-red-500' : 'text-white/60 hover:text-red-500'}`}
    >
      <Heart className="w-5 h-5 drop-shadow-[0_0_3px_rgba(239,68,68,0.5)]" />
    </button>
  </div>
);

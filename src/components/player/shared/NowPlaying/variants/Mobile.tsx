// components/player/shared/NowPlaying/variants/Mobile.tsx
import React from 'react';
import type { NowPlayingProps } from '../types';

export const Mobile = ({ title, artist, coverImage }: NowPlayingProps) => (
  <div className="flex items-center gap-3">
    <img src={coverImage} alt="" className="w-10 h-10 rounded shadow-lg" />
    <div className="min-w-0">
      <p className="font-medium text-white/90 truncate">{title}</p>
      <p className="text-sm text-white/60 truncate">{artist}</p>
    </div>
  </div>
);
// components/player/shared/Volume/Desktop.tsx
import React from 'react';
import { Volume2 } from 'lucide-react';
import { VolumeProps } from '../types';

export const Desktop = ({ volume, onVolumeChange }: VolumeProps) => (
  <div className="flex items-center space-x-3">
    <Volume2 className="w-5 h-5 text-white/80" />
    <div className="w-24 h-1 bg-white/20 rounded-full overflow-hidden">
      <div className="h-full bg-white/60 rounded-full" style={{ width: `${volume * 100}%` }} />
    </div>
  </div>
);
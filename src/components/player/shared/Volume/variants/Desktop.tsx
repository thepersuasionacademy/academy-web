// components/player/shared/Volume/Desktop.tsx
import React from 'react';
import { Volume2 } from 'lucide-react';
import { VolumeProps } from '../types';

export const Desktop = ({ volume, onVolumeChange }: VolumeProps) => (
  <div className="flex items-center space-x-3">
    <Volume2 className="w-5 h-5 text-white/60 hover:text-white transition-colors" />
    <div className="group relative">
      <div className="w-24 h-1 bg-white/10 rounded-full overflow-hidden group-hover:h-1.5 transition-all">
        <div 
          className="h-full bg-white group-hover:bg-green-500 rounded-full transition-colors" 
          style={{ width: `${volume * 100}%` }} 
        />
        <div 
          className="absolute h-3 w-3 bg-white rounded-full -top-1 opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ left: `${volume * 100}%`, transform: 'translateX(-50%)' }} 
        />
      </div>
    </div>
  </div>
);
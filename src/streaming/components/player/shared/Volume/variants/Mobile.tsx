// components/player/shared/Volume/Mobile.tsx
import React, { useState } from 'react';
import { Volume2 } from 'lucide-react';
import { VolumeProps } from '@/app/mind/lib/types/media';

export const Mobile = ({ volume, onVolumeChange }: VolumeProps) => {
  const [showVolume, setShowVolume] = useState(false);
  return (
    <div className="relative">
      <button onClick={() => setShowVolume(!showVolume)} className="p-2 hover:bg-white/10 rounded-full">
        <Volume2 className="w-5 h-5 text-white/80" />
      </button>
      {showVolume && (
        <div className="absolute bottom-full right-0 mb-2 p-3 bg-zinc-900 rounded-lg shadow-lg">
          <div className="h-32 w-1 bg-white/20 rounded-full overflow-hidden">
            <div className="w-full bg-white/60 rounded-full" style={{ height: `${volume * 100}%` }} />
          </div>
        </div>
      )}
    </div>
  );
};
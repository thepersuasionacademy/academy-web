import React from 'react';
import { SkipBack, SkipForward } from 'lucide-react';
import { CustomPlay, CustomPause } from '../icons';
import type { ControlsProps } from '@/lib/types/media';

export const Controls = ({ isPlaying, onPlayPause, onNext, onPrevious }: ControlsProps) => {
  return (
    <div className="flex items-center gap-6">
      <button 
        onClick={onPrevious}
        className="text-white/60 hover:text-white transition-colors"
      >
        <SkipBack className="w-5 h-5" />
      </button>

      <button
        onClick={onPlayPause}
        className={`
          relative
          group
          w-12 
          h-12 
          rounded-full
          bg-white 
          flex 
          items-center 
          justify-center
          shadow-lg
          transition-all 
          duration-150
          hover:scale-105
          active:scale-95
          before:absolute
          before:inset-0
          before:rounded-full
          before:bg-black/5
          before:opacity-0
          hover:before:opacity-100
          before:transition-opacity
          after:absolute
          after:inset-0
          after:rounded-full
          after:shadow-[inset_0_1px_1px_rgba(255,255,255,0.6)]
          hover:shadow-xl
          active:shadow-inner
        `}
      >
        {isPlaying ? (
          <CustomPause className="w-5 h-5 text-black/90 transition-transform group-active:scale-95" />
        ) : (
          <CustomPlay className="w-5 h-5 text-black/90 transition-transform group-active:scale-95 ml-0.5" />
        )}
      </button>

      <button 
        onClick={onNext}
        className="text-white/60 hover:text-white transition-colors"
      >
        <SkipForward className="w-5 h-5" />
      </button>
    </div>
  );
};
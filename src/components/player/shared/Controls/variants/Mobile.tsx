// shared/Controls/variants/Mobile.tsx
import React from 'react';
import { Play, Pause } from 'lucide-react';
import type { ControlsProps } from '../types';

const Mobile = ({ isPlaying, onPlayPause }: ControlsProps) => (
 <button 
   onClick={onPlayPause}
   className="w-14 h-14 rounded-full bg-gradient-to-br from-red-500 to-red-600 
            hover:from-red-600 hover:to-red-700 transition-all flex items-center 
            justify-center shadow-lg">
   {isPlaying ? 
     <Pause className="w-7 h-7 text-white" /> : 
     <Play className="w-7 h-7 text-white ml-1" />
   }
 </button>
);

export { Mobile as Controls };
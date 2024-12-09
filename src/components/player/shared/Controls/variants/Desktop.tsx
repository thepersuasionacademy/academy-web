// shared/Controls/variants/Desktop.tsx
import React from 'react';
import { Play, Pause, SkipBack, SkipForward } from 'lucide-react';
import type { ControlsProps } from '../types';

const Desktop = ({ isPlaying, onPlayPause, onNext, onPrevious }: ControlsProps) => (
 <div className="flex items-center space-x-6">
   <button onClick={onPrevious} className="text-white/80 hover:text-white transition-colors">
     <SkipBack className="w-5 h-5" />
   </button>
   <button 
     onClick={onPlayPause}
     className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 
               transition-all flex items-center justify-center shadow-lg">
     {isPlaying ? 
       <Pause className="w-5 h-5 text-white" /> : 
       <Play className="w-5 h-5 text-white ml-1" />
     }
   </button>
   <button onClick={onNext} className="text-white/80 hover:text-white transition-colors">
     <SkipForward className="w-5 h-5" />
   </button>
 </div>
);

export { Desktop as Controls };
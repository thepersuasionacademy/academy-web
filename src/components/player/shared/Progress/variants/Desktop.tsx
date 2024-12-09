// Desktop.tsx (Progress variant)
import React from 'react';
import type { ProgressProps } from '../types';

const Desktop = ({ currentTime, duration, onSeek }: ProgressProps) => (
 <div className="w-full space-y-2">
   <div 
     className="w-full h-1 bg-zinc-800 rounded-full cursor-pointer"
     onClick={(e) => {
       const rect = e.currentTarget.getBoundingClientRect();
       const position = (e.clientX - rect.left) / rect.width;
       onSeek(position * duration);
     }}
   >
     <div 
       className="h-full bg-red-500 rounded-full"
       style={{ width: `${(currentTime / duration) * 100}%` }}
     />
   </div>
   
   <div className="flex justify-between text-sm text-zinc-400">
     <span>{formatTime(currentTime)}</span>
     <span>{formatTime(duration)}</span>
   </div>
 </div>
);

const formatTime = (seconds: number): string => {
 const minutes = Math.floor(seconds / 60);
 const remainingSeconds = Math.floor(seconds % 60);
 return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

export { Desktop as Progress };
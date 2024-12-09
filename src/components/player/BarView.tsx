import React, { useState, MouseEvent, useRef, useEffect } from 'react';
import { Volume2, Heart, Maximize2, PictureInPicture, Play, Pause, SkipBack, SkipForward, ChevronUp } from 'lucide-react';
import { PlayerState, PlayerView, ViewProps } from './types';

interface BarViewProps extends ViewProps {}

interface ProgressBarProps {
 currentTime: number;
 duration: number;
 onSeek: (time: number) => void;
}

interface VolumeControlProps {
 volume: number;
 onVolumeChange: (volume: number) => void;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ currentTime, duration, onSeek }) => {
 const [isDragging, setIsDragging] = useState(false);
 const [isHovering, setIsHovering] = useState(false);
 const [localTime, setLocalTime] = useState(currentTime);
 const progressRef = useRef<HTMLDivElement>(null);
 const progressPercent = (localTime / duration) * 100;

 useEffect(() => {
   if (!isDragging) {
     setLocalTime(currentTime);
   }
 }, [currentTime, isDragging]);

 const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
   if ((isDragging || isHovering) && progressRef.current) {
     const rect = progressRef.current.getBoundingClientRect();
     const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
     setLocalTime(percent * duration);
     if (isDragging) {
       onSeek(percent * duration);
     }
   }
 };

 useEffect(() => {
   const handleMouseUp = () => setIsDragging(false);
   if (isDragging) {
     document.addEventListener('mouseup', handleMouseUp);
   }
   return () => document.removeEventListener('mouseup', handleMouseUp);
 }, [isDragging]);

 return (
   <div 
     ref={progressRef}
     className="relative w-full h-1 group bg-white/20 rounded-full overflow-visible cursor-pointer"
     onMouseEnter={() => setIsHovering(true)}
     onMouseLeave={() => setIsHovering(false)}
     onMouseDown={(e) => {
       setIsDragging(true);
       handleMouseMove(e);
     }}
     onMouseMove={handleMouseMove}
   >
     <div 
       className="absolute h-full bg-red-500/60 rounded-full transition-colors"
       style={{ width: `${progressPercent}%` }} 
     />
     <div 
       className={`absolute top-1/2 -mt-1.5 -ml-1.5 w-3 h-3 bg-white rounded-full transform transition-opacity ${
         isHovering || isDragging ? 'opacity-100' : 'opacity-0'
       }`}
       style={{ left: `${progressPercent}%` }}
     />
   </div>
 );
};

const VolumeControl: React.FC<VolumeControlProps> = ({ volume, onVolumeChange }) => {
 const [isDragging, setIsDragging] = useState(false);
 const [isHovering, setIsHovering] = useState(false);
 const volumeRef = useRef<HTMLDivElement>(null);

 const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
   if (isDragging && volumeRef.current) {
     const rect = volumeRef.current.getBoundingClientRect();
     const newVolume = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
     onVolumeChange(newVolume);
   }
 };

 useEffect(() => {
   const handleMouseUp = () => setIsDragging(false);
   if (isDragging) {
     document.addEventListener('mouseup', handleMouseUp);
   }
   return () => document.removeEventListener('mouseup', handleMouseUp);
 }, [isDragging]);

 return (
   <div 
     ref={volumeRef}
     className="relative w-24 h-1 group bg-white/20 rounded-full overflow-visible cursor-pointer"
     onMouseEnter={() => setIsHovering(true)}
     onMouseLeave={() => setIsHovering(false)}
     onMouseDown={(e) => {
       setIsDragging(true);
       const rect = volumeRef.current?.getBoundingClientRect();
       if (rect) {
         const newVolume = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
         onVolumeChange(newVolume);
       }
     }}
     onMouseMove={handleMouseMove}
   >
     <div 
       className="absolute h-full bg-white/60 rounded-full transition-colors"
       style={{ width: `${volume * 100}%` }} 
     />
     <div 
       className={`absolute top-1/2 -mt-1.5 -ml-1.5 w-3 h-3 bg-white rounded-full transform transition-opacity ${
         isHovering || isDragging ? 'opacity-100' : 'opacity-0'
       }`}
       style={{ left: `${volume * 100}%` }}
     />
   </div>
 );
};

export const BarView: React.FC<BarViewProps> = ({ state, onStateChange, onViewChange }) => {
 return (
   <div className="fixed bottom-0 left-0 right-0 bg-zinc-900/40 backdrop-blur-xl border-t border-white/10 z-50">
     {/* Regular Wide Layout */}
     <div className="hidden lg:block h-20">
       <div className="max-w-screen-2xl mx-auto h-full flex items-center justify-between px-6">
         <div className="flex items-center space-x-4">
           <img src={state.coverImage} alt="Now playing" className="w-12 h-12 rounded shadow-lg" />
           <div>
             <p className="font-medium text-white/90">{state.title}</p>
             <p className="text-sm text-white/60">{state.artist}</p>
           </div>
           <button 
             onClick={() => onStateChange({ isLiked: !state.isLiked })}
             className={`transition-colors ${state.isLiked ? 'text-red-500' : 'text-white/60 hover:text-red-500'}`}
           >
             <Heart className="w-5 h-5 drop-shadow-[0_0_3px_rgba(239,68,68,0.5)]" />
           </button>
         </div>

         <div className="flex flex-col items-center flex-1 max-w-xl">
           <div className="flex items-center space-x-6 mb-2">
             <button className="text-white/80 hover:text-white transition-colors">
               <SkipBack className="w-5 h-5" />
             </button>
             <button 
               onClick={() => onStateChange({ isPlaying: !state.isPlaying })}
               className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 
                      transition-all flex items-center justify-center shadow-lg"
             >
               {state.isPlaying ? <Pause className="w-5 h-5 text-white" /> : <Play className="w-5 h-5 text-white ml-1" />}
             </button>
             <button className="text-white/80 hover:text-white transition-colors">
               <SkipForward className="w-5 h-5" />
             </button>
           </div>
           <ProgressBar 
             currentTime={state.currentTime} 
             duration={state.duration} 
             onSeek={time => onStateChange({ currentTime: time })} 
           />
         </div>

         <div className="flex items-center space-x-6">
           <div className="flex items-center space-x-3">
             <Volume2 className="w-5 h-5 text-white/80" />
             <VolumeControl 
               volume={state.volume} 
               onVolumeChange={volume => onStateChange({ volume })} 
             />
           </div>
           <div className="flex space-x-2">
             <button 
               onClick={() => onViewChange(PlayerView.PIP)} 
               className="p-2 hover:bg-white/10 rounded-full"
             >
               <PictureInPicture className="w-5 h-5 text-white/80" />
             </button>
             <button 
               onClick={() => onViewChange(PlayerView.FULLSCREEN)}
               className="p-2 hover:bg-white/10 rounded-full"
             >
               <Maximize2 className="w-5 h-5 text-white/80" />
             </button>
           </div>
         </div>
       </div>
     </div>

     {/* Compact Layout */}
     <div className="lg:hidden flex flex-col">
       <button 
         onClick={() => onViewChange(PlayerView.FULLSCREEN)}
         className="flex justify-center py-2 hover:bg-white/5 transition-colors"
       >
         <ChevronUp className="w-5 h-5 text-white/60" />
       </button>
       
       <div className="flex items-center px-4 py-3">
         <div className="flex flex-col flex-shrink min-w-[120px] mr-4">
           <p className="font-medium text-white/90 truncate">{state.title}</p>
           <p className="text-sm text-white/60 truncate">{state.artist}</p>
         </div>

         <div className="flex-1 flex justify-center">
           <button 
             className="w-14 h-14 rounded-full bg-gradient-to-br from-red-500 to-red-600 
                      hover:from-red-600 hover:to-red-700 transition-all flex items-center 
                      justify-center shadow-lg"
             onClick={() => onStateChange({ isPlaying: !state.isPlaying })}
           >
             {state.isPlaying ? 
               <Pause className="w-7 h-7 text-white" /> : 
               <Play className="w-7 h-7 text-white ml-1" />
             }
           </button>
         </div>

         <div className="flex items-center gap-3 ml-4">
           <Volume2 className="w-5 h-5 text-white/80" />
           <VolumeControl 
             volume={state.volume} 
             onVolumeChange={volume => onStateChange({ volume })} 
           />
         </div>
       </div>
     </div>
   </div>
 );
};
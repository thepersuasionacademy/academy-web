import React, { useEffect } from 'react';
import { Controls } from '../shared/Controls';
import { Progress } from '../shared/Progress';
import { Maximize2, ChevronDown, Volume2 } from 'lucide-react';
import { PlayerView, ViewProps } from '@/lib/types/media';

export const PiPView: React.FC<ViewProps> = ({ state, onStateChange, onViewChange }) => {
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        onViewChange(PlayerView.BAR);
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [onViewChange]);

  return (
    <div className="fixed bottom-4 right-4 w-[480px] rounded-2xl border-2 border-[#2a2a2a] shadow-[0_8px_60px_rgba(0,0,0,0.9)] overflow-hidden">
      {/* 16:9 Image Container */}
      <div className="relative w-full aspect-video">
        <div 
          className="absolute inset-0 bg-center bg-cover"
          style={{
            backgroundImage: 'url(https://storage.googleapis.com/msgsndr/0WQ7GPZN4PMMOAZunq8O/media/675660468e049a4ed9d8ec68.jpeg)',
          }}
        />
        
        {/* Track info in top left with glassmorphic background */}
<div className="absolute top-4 left-4">
  <div className="px-3 py-2 rounded-lg bg-black/20 backdrop-blur-md border border-white/10">
    <div className="flex-1 overflow-hidden">
      <p className="text-sm font-medium text-white truncate">{state.title}</p>
      <p className="text-xs text-white/60 truncate">{state.artist}</p>
    </div>
  </div>
</div>

        {/* View controls in top right */}
        <div className="absolute top-0 right-0 p-4">
          <div className="flex items-center space-x-1">
            <button 
              onClick={() => onViewChange(PlayerView.FULLSCREEN)} 
              className="p-2 hover:bg-black/20 rounded-full text-white/60 hover:text-white"
            >
              <Maximize2 className="w-5 h-5" />
            </button>
            <button 
              onClick={() => onViewChange(PlayerView.BAR)} 
              className="p-2 hover:bg-black/20 rounded-full text-white/60 hover:text-white"
            >
              <ChevronDown className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Player Bar */}
      <div className="bg-zinc-900/90 backdrop-blur relative -mt-2">
        {/* Progress bar container */}
        <div className="absolute -top-1.5 left-0 right-0 h-1 group hover:h-2 transition-all">
          <Progress
            currentTime={state.currentTime}
            duration={state.duration}
            onSeek={(time) => onStateChange({ currentTime: time })}
          />
        </div>

        <div className="p-4 flex items-center justify-between">
          {/* Left-aligned play controls */}
          <div>
            <Controls
              isPlaying={state.isPlaying}
              onPlayPause={() => onStateChange({ isPlaying: !state.isPlaying })}
              onNext={() => onStateChange({ currentTime: Math.min(state.duration, state.currentTime + 30) })}
              onPrevious={() => onStateChange({ currentTime: Math.max(0, state.currentTime - 30) })}
            />
          </div>
          
          {/* Right-aligned volume */}
          <div className="flex items-center space-x-3">
            <Volume2 className="w-5 h-5 text-white/60" />
            <div className="w-20 h-1 bg-white/20 rounded-full overflow-hidden">
              <div 
                className="h-full bg-white/60 rounded-full" 
                style={{ width: `${state.volume * 100}%` }} 
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
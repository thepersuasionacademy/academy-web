import React, { useState, useEffect, useCallback } from 'react';
import { ChevronDown, Volume2, Heart } from 'lucide-react';
import { Controls } from './shared/Controls';
import { Progress } from './shared/Progress';
import { PlayerView, ViewProps } from './types';

export const FullscreenView: React.FC<ViewProps> = ({ state, onStateChange, onViewChange }) => {
  const [showControls, setShowControls] = useState(true);
  let timeoutId: NodeJS.Timeout;

  const handleMouseMove = useCallback(() => {
    setShowControls(true);
    clearTimeout(timeoutId);
    
    if (window.innerWidth >= 1024) {
      timeoutId = setTimeout(() => {
        setShowControls(false);
      }, 2000);
    }
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      clearTimeout(timeoutId);
    };
  }, [handleMouseMove]);

  return (
    <div 
      className="fixed inset-0 z-50"
      onMouseMove={handleMouseMove}
    >
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-center bg-cover"
        style={{
          backgroundImage: 'url(https://storage.googleapis.com/msgsndr/0WQ7GPZN4PMMOAZunq8O/media/675660468e049a4ed9d8ec68.jpeg)',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/30" />
      </div>

      {/* Mobile Layout */}
      <div className="lg:hidden h-full flex flex-col px-6 relative">
        {/* Mobile content stays the same */}
        <div className="flex items-center justify-between pt-8">
          <button 
            onClick={() => onViewChange(PlayerView.BAR)}
            className="text-white/60 hover:text-white"
          >
            <ChevronDown className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1" />

        <div className="flex flex-col items-center mb-14">
          <div className="w-full mb-10">
            <Progress 
              currentTime={state.currentTime}
              duration={state.duration}
              onSeek={(time) => onStateChange({ currentTime: time })}
            />
          </div>

          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-white">{state.title}</h2>
            <p className="text-white/60 mt-3">{state.artist}</p>
          </div>
          
          <div className="flex justify-center transform scale-[2.0] mb-6">
            <Controls 
              isPlaying={state.isPlaying}
              onPlayPause={() => onStateChange({ isPlaying: !state.isPlaying })}
              onNext={() => {}}
              onPrevious={() => {}}
            />
          </div>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden lg:flex flex-col h-full relative">
        {/* Back Button */}
        <div className={`
          absolute top-8 left-8 z-10
          transition-opacity duration-300
          ${showControls ? 'opacity-100' : 'opacity-0'}
        `}>
          <button 
            onClick={() => onViewChange(PlayerView.BAR)}
            className="text-white/60 hover:text-white"
          >
            <ChevronDown className="w-6 h-6" />
          </button>
        </div>

        {/* Track Info */}
        <div className={`
          absolute top-8 left-1/2 -translate-x-1/2 z-10
          transition-all duration-300
          ${showControls ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}
        `}>
          <div className="px-8 py-4 rounded-full bg-zinc-900/80 backdrop-blur-md border border-white/10">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-white">{state.title}</h2>
              <p className="text-white/60 mt-2 text-lg">{state.artist}</p>
            </div>
          </div>
        </div>

        {/* Controls Bar */}
        <div className={`
          fixed bottom-0 left-0 right-0 
          transition-all duration-300
          ${showControls ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
        `}>
          {/* Progress bar at the very top */}
          <div className="absolute -top-px left-0 right-0 z-20">
            <Progress 
              currentTime={state.currentTime}
              duration={state.duration}
              onSeek={(time) => onStateChange({ currentTime: time })}
            />
          </div>

          <div className="bg-zinc-900/40 backdrop-blur-xl border-t border-white/5">
            <div className="max-w-screen-xl mx-auto px-8 py-6">
              <div className="flex items-center justify-between">
                <div className="w-12" />
                <Controls 
                  isPlaying={state.isPlaying}
                  onPlayPause={() => onStateChange({ isPlaying: !state.isPlaying })}
                  onNext={() => {}}
                  onPrevious={() => {}}
                />
                <button className="w-12 text-white/60 hover:text-white">
                  <Volume2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
import React, { useState, useEffect, useCallback } from 'react';
import { ChevronDown, Volume2, PictureInPicture, Heart } from 'lucide-react';
import { Controls } from '../shared/Controls';
import { Progress } from '../shared/Progress';
import { PlayerView, ViewProps } from '@/lib/types/media';

export const FullscreenView: React.FC<ViewProps> = ({ state, onStateChange, onViewChange }) => {
  const [showControls, setShowControls] = useState(true);
  let timeoutId: NodeJS.Timeout;

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

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
      />

      {/* Mobile Layout */}
      <div className="lg:hidden h-full flex flex-col relative">
        <div className="px-6 pt-8">
          <button 
            onClick={() => onViewChange(PlayerView.BAR)}
            className="text-white/60 hover:text-white"
          >
            <ChevronDown className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 flex flex-col justify-end">
          <div className="bg-zinc-900/40 backdrop-blur-xl rounded-t-3xl relative">
            <div className="absolute -top-px left-0 right-0 z-20">
              <Progress 
                currentTime={state.currentTime}
                duration={state.duration}
                onSeek={(time) => onStateChange({ currentTime: time })}
              />
            </div>

            <div className="flex flex-col items-center px-6 pt-10 pb-12">
              <div className="text-center mb-12">
                <h2 className="text-2xl font-bold text-white">{state.title}</h2>
                <p className="text-white/60 mt-3">{state.artist}</p>
              </div>
              
              <div className="flex justify-center transform scale-[2.0]">
                <Controls 
                  isPlaying={state.isPlaying}
                  onPlayPause={() => onStateChange({ isPlaying: !state.isPlaying })}
                  onNext={() => {}}
                  onPrevious={() => {}}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden lg:flex flex-col h-full relative">
        {/* Track Info */}
        <div className={`
          absolute top-8 left-1/2 -translate-x-1/2 z-10
          transition-all duration-300
          ${showControls ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}
        `}>
          <div className="px-6 py-3 rounded-full bg-zinc-900/80 backdrop-blur-md border border-white/10">
            <h2 className="text-lg text-white font-medium">
              {state.title} <span className="text-white/60 px-3">|</span> {state.artist}
            </h2>
          </div>
        </div>

        {/* Controls Bar */}
        <div className={`
          fixed bottom-0 left-0 right-0 bg-zinc-900/40 backdrop-blur-xl z-50
          transition-all duration-300
          ${showControls ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
        `}>
          {/* Progress bar */}
          <div className="absolute -top-px left-0 right-0 z-20">
            <Progress 
              currentTime={state.currentTime}
              duration={state.duration}
              onSeek={(time) => onStateChange({ currentTime: time })}
            />
          </div>

          <div className="hidden lg:block h-20 border-t border-white/5">
            <div className="max-w-screen-2xl mx-auto h-full flex items-center justify-between px-6">
              <div className="flex items-center space-x-4 invisible pointer-events-none">
                <div className="w-12 h-12 rounded bg-white/10" />
                <div>
                  <p className="font-medium text-white/90 whitespace-nowrap">{state.title}</p>
                  <p className="text-sm text-white/60 whitespace-nowrap">{state.artist}</p>
                </div>
                <button className="w-5 h-5">
                  <Heart className="w-5 h-5" />
                </button>
              </div>
              
              <div className="flex-1 flex justify-center">
                <Controls 
                  isPlaying={state.isPlaying}
                  onPlayPause={() => onStateChange({ isPlaying: !state.isPlaying })}
                  onNext={() => {}}
                  onPrevious={() => {}}
                />
              </div>

              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-3">
                  <Volume2 className="w-5 h-5 text-white/60" />
                  <div className="w-24 h-1 bg-white/20 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-white/60 rounded-full" 
                      style={{ width: `${state.volume * 100}%` }} 
                    />
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button onClick={() => onViewChange(PlayerView.PIP)} className="p-2 hover:bg-white/10 rounded-full">
                    <PictureInPicture className="w-5 h-5 text-white/60" />
                  </button>
                  <button onClick={() => onViewChange(PlayerView.BAR)} className="p-2 hover:bg-white/10 rounded-full">
                    <ChevronDown className="w-5 h-5 text-white/60" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
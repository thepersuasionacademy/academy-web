import React from 'react';
import { Volume2, Heart, Maximize2, PictureInPicture } from 'lucide-react';
import { Controls } from './shared/Controls';
import { Progress } from './shared/Progress';
import { PlayerView, ViewProps } from './types';

export const BarView: React.FC<ViewProps> = ({ state, onStateChange, onViewChange }) => {
  const handleBarClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button, img')) return;
    onViewChange(PlayerView.FULLSCREEN);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-zinc-900/40 backdrop-blur-xl z-50">
      <div className="absolute -top-px left-0 right-0">
        <Progress 
          currentTime={state.currentTime}
          duration={state.duration}
          onSeek={(time) => onStateChange({ currentTime: time })}
        />
      </div>

      {/* Regular Wide Layout */}
      <div className="hidden lg:block h-20 border-t border-white/5">
        <div className="max-w-screen-2xl mx-auto h-full flex items-center justify-between px-6">
          <div className="flex items-center space-x-4">
            <img src={state.coverImage} alt="Now playing" className="w-12 h-12 rounded shadow-lg" />
            <div>
              <p className="font-medium text-white/90">{state.title}</p>
              <p className="text-sm text-white/60">{state.artist}</p>
            </div>
            <button 
              onClick={() => onStateChange({ isLiked: !state.isLiked })}
              className={`transition-colors ${state.isLiked ? 'text-green-500' : 'text-white/60 hover:text-white'}`}
            >
              <Heart className="w-5 h-5" />
            </button>
          </div>

          <Controls 
            isPlaying={state.isPlaying}
            onPlayPause={() => onStateChange({ isPlaying: !state.isPlaying })}
            onNext={() => {}}
            onPrevious={() => {}}
          />

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
              <button onClick={() => onViewChange(PlayerView.FULLSCREEN)} className="p-2 hover:bg-white/10 rounded-full">
                <Maximize2 className="w-5 h-5 text-white/60" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Layout */}
      <div 
        className="lg:hidden flex flex-col border-t border-white/5 cursor-pointer"
        onClick={handleBarClick}
      >
        <div className="flex items-center px-4 py-3">
          <div className="w-14">
            <img src={state.coverImage} alt="" className="w-10 h-10 rounded shadow-lg" />
          </div>

          <div className="flex-1 flex justify-center">
            <Controls 
              isPlaying={state.isPlaying}
              onPlayPause={() => onStateChange({ isPlaying: !state.isPlaying })}
              onNext={() => {}}
              onPrevious={() => {}}
            />
          </div>

          <div className="w-14 flex justify-end">
            <button className="text-white/60 p-2">
              <Volume2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
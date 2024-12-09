import { Volume2, Heart, Maximize2, PictureInPicture, Play, Pause, SkipBack, SkipForward } from 'lucide-react';
import { Controls } from './shared/Controls';
import { Progress } from './shared/Progress';
import { PlayerState, PlayerView } from './types';

interface BarViewProps {
  state: PlayerState;
  onStateChange: (state: Partial<PlayerState>) => void;
  onViewChange: (view: PlayerView) => void;
}

export const BarView = ({ state, onStateChange, onViewChange }: BarViewProps) => (
  <div className="fixed bottom-0 left-0 right-0 h-20 bg-zinc-900/40 backdrop-blur-xl border-t border-white/10 z-50">
    <div className="max-w-screen-2xl mx-auto h-full flex items-center justify-between px-6">
      <div className="flex items-center space-x-4">
        <img src={state.coverImage} alt="Now playing" className="w-12 h-12 rounded shadow-lg" />
        <div>
          <p className="font-medium text-white/90">{state.title}</p>
          <p className="text-sm text-white/60">{state.artist}</p>
        </div>
        <Heart className="w-5 h-5 text-red-500 drop-shadow-[0_0_3px_rgba(239,68,68,0.5)]" />
      </div>

      <div className="flex flex-col items-center flex-1 max-w-xl">
        <div className="flex items-center space-x-6">
          <button className="text-white/80 hover:text-white transition-colors drop-shadow-[0_0_2px_rgba(255,255,255,0.3)]">
            <SkipBack className="w-5 h-5" />
          </button>
          <button 
            className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 
                     transition-all flex items-center justify-center shadow-lg 
                     shadow-red-500/20 hover:shadow-red-500/30
                     ring-1 ring-red-500/50 hover:ring-red-600/50"
            onClick={() => onStateChange({ isPlaying: !state.isPlaying })}
          >
            {state.isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          </button>
          <button className="text-white/80 hover:text-white transition-colors drop-shadow-[0_0_2px_rgba(255,255,255,0.3)]">
            <SkipForward className="w-5 h-5" />
          </button>
        </div>
        <Progress currentTime={state.currentTime} duration={state.duration} onSeek={(time) => onStateChange({ currentTime: time })} />
      </div>

      <div className="flex items-center space-x-6">
        <div className="flex items-center space-x-3">
          <Volume2 className="w-5 h-5 text-white/80" />
          <div className="w-24 h-1 bg-white/20 rounded-full overflow-hidden">
            <div className="h-full bg-white/60 rounded-full" style={{ width: `${state.volume * 100}%` }} />
          </div>
        </div>
        <div className="flex space-x-2">
          <button onClick={() => onViewChange(PlayerView.PIP)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <PictureInPicture className="w-5 h-5 text-white/80" />
          </button>
          <button onClick={() => onViewChange(PlayerView.FULLSCREEN)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <Maximize2 className="w-5 h-5 text-white/80" />
          </button>
        </div>
      </div>
    </div>
  </div>
);
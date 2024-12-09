import { Minimize2, Maximize2 } from 'lucide-react';
import { Controls } from './shared/Controls';
import { Progress } from './shared/Progress';
import { PlayerState, PlayerView } from './types';

interface PiPViewProps {
  state: PlayerState;
  onStateChange: (newState: Partial<PlayerState>) => void;
  onViewChange: (view: PlayerView) => void;
}

export const PiPView = ({ state, onStateChange, onViewChange }: PiPViewProps) => (
  <div className="fixed bottom-4 right-4 w-80 bg-zinc-900 rounded-lg shadow-xl z-50 overflow-hidden">
    <div className="relative">
      <img src={state.coverImage} alt="Now playing" className="w-full aspect-video object-cover" />
      <div className="absolute top-2 right-2 flex space-x-2">
        <button onClick={() => onViewChange(PlayerView.BAR)} className="p-1.5 bg-black/50 hover:bg-black/70 rounded-full">
          <Minimize2 className="w-4 h-4" />
        </button>
        <button onClick={() => onViewChange(PlayerView.FULLSCREEN)} className="p-1.5 bg-black/50 hover:bg-black/70 rounded-full">
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>
    </div>
    
    <div className="p-4 space-y-4">
      <div className="space-y-1">
        <p className="font-medium truncate">{state.title}</p>
        <p className="text-sm text-zinc-400 truncate">{state.artist}</p>
      </div>
      
      <Controls
        isPlaying={state.isPlaying}
        onPlayPause={() => onStateChange({ isPlaying: !state.isPlaying })}
        onNext={() => {}}
        onPrevious={() => {}}
      />
      
      <Progress
        currentTime={state.currentTime}
        duration={state.duration}
        onSeek={(time) => onStateChange({ currentTime: time })}
      />
    </div>
  </div>
);
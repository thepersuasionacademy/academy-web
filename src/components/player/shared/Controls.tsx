import { Play, Pause, SkipBack, SkipForward } from 'lucide-react';

interface ControlsProps {
  isPlaying: boolean;
  onPlayPause: () => void;
  onNext: () => void;
  onPrevious: () => void;
}

export const Controls = ({ isPlaying, onPlayPause, onNext, onPrevious }: ControlsProps) => (
  <div className="flex items-center space-x-6">
    <button onClick={onPrevious} className="text-zinc-400 hover:text-white transition">
      <SkipBack className="w-5 h-5" />
    </button>
    <button 
      className="w-10 h-10 rounded-full bg-red-600 hover:bg-red-700 transition flex items-center justify-center"
      onClick={onPlayPause}
    >
      {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
    </button>
    <button onClick={onNext} className="text-zinc-400 hover:text-white transition">
      <SkipForward className="w-5 h-5" />
    </button>
  </div>
);
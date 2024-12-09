import React from 'react';
import { Desktop as Controls } from './shared/Controls/variants/Desktop';
import { Desktop as Progress } from './shared/Progress/variants/Desktop';
import type { PlayerState, PlayerView } from './types';

interface PiPViewProps {
  state: PlayerState;
  onStateChange: (state: Partial<PlayerState>) => void;
  onViewChange: (view: PlayerView) => void;
}

export const PiPView = ({ state, onStateChange, onViewChange }: PiPViewProps) => (
  <div className="fixed bottom-4 right-4 h-32 w-64 bg-zinc-900/90 backdrop-blur rounded-lg shadow-lg overflow-hidden">
    <div className="h-full flex flex-col justify-between p-3">
      <div className="flex items-center justify-between">
        <div className="flex-1 overflow-hidden">
          <p className="text-sm text-white font-medium truncate">{state.title}</p>
          <p className="text-xs text-white/60 truncate">{state.artist}</p>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Controls
          isPlaying={state.isPlaying}
          onPlayPause={() => onStateChange({ isPlaying: !state.isPlaying })}
          onNext={() => onStateChange({ currentTime: Math.min(state.duration, state.currentTime + 30) })}
          onPrevious={() => onStateChange({ currentTime: Math.max(0, state.currentTime - 30) })}
        />
        <Progress
          currentTime={state.currentTime}
          duration={state.duration}
          onSeek={(time: number) => onStateChange({ currentTime: time })}
        />
      </div>
    </div>
  </div>
);
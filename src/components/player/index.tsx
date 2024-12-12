import React, { useState } from 'react';
import { AudioPlayer } from './audio/AudioPlayer';
import { BarView } from './views/BarView';
import { FullscreenView } from './views/FullScreenView';
import { PiPView } from './views/PiPView';
import { PlayerState, PlayerView } from '@/lib/types/media';

interface MediaPlayerProps {
  streamUrl: string;
  initialState: PlayerState;
  onStateChange: (state: Partial<PlayerState>) => void;
  defaultView?: PlayerView;
}

export const MediaPlayer = ({ 
  streamUrl, 
  initialState, 
  onStateChange,
  defaultView = PlayerView.BAR 
}: MediaPlayerProps) => {
  const [view, setView] = useState<PlayerView>(defaultView);

  const renderView = () => {
    switch (view) {
      case PlayerView.BAR:
        return <BarView state={initialState} onStateChange={onStateChange} onViewChange={setView} />;
      case PlayerView.FULLSCREEN:
        return <FullscreenView state={initialState} onStateChange={onStateChange} onViewChange={setView} />;
      case PlayerView.PIP:
        return <PiPView state={initialState} onStateChange={onStateChange} onViewChange={setView} />;
    }
  };

  return (
    <>
      <AudioPlayer  // Changed from HLSAudio to AudioPlayer
        src={streamUrl}
        isPlaying={initialState.isPlaying}
        currentTime={initialState.currentTime}
        volume={initialState.volume}
        onTimeUpdate={(time: number) => onStateChange({ currentTime: time })}
        onDurationChange={(duration: number) => onStateChange({ duration })}
      />
      {renderView()}
    </>
  );
};
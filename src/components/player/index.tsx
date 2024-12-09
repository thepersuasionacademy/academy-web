import { useState } from 'react';
import { BarView } from './BarView';
import { PiPView } from './PiPView';
import { FullscreenView } from './FullScreenView';
import { PlayerState, PlayerView } from './types';

interface MediaPlayerProps {
  initialState: PlayerState;
  onStateChange: (state: Partial<PlayerState>) => void;
}

export const MediaPlayer = ({ initialState, onStateChange }: MediaPlayerProps) => {
  const [view, setView] = useState<PlayerView>(PlayerView.BAR);

  const renderView = () => {
    switch (view) {
      case PlayerView.PIP:
        return <PiPView state={initialState} onStateChange={onStateChange} onViewChange={setView} />;
      case PlayerView.FULLSCREEN:
        return <FullscreenView state={initialState} onStateChange={onStateChange} onViewChange={setView} />;
      case PlayerView.BAR:
      default:
        return <BarView state={initialState} onStateChange={onStateChange} onViewChange={setView} />;
    }
  };

  return renderView();
};
// components/player/shared/NowPlaying/index.tsx
import React from 'react';
import { Desktop } from './variants/Desktop';
import { Mobile } from './variants/Mobile';
import type { NowPlayingProps } from './types';

export const NowPlaying = (props: NowPlayingProps) => (
  <>
    <div className="hidden lg:block">
      <Desktop {...props} />
    </div>
    <div className="lg:hidden">
      <Mobile {...props} />
    </div>
  </>
);
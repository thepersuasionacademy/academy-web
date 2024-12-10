// src/components/player/shared/Controls/index.tsx
import React from 'react';
import { Controls as DesktopControls } from './variants/Desktop';
import { Controls as MobileControls } from './variants/Mobile';
import type { ControlsProps } from './types';

export const Controls = (props: ControlsProps) => {
  return (
    <>
      <div className="hidden lg:block">
        <DesktopControls {...props} />
      </div>
      <div className="lg:hidden">
        <MobileControls {...props} />
      </div>
    </>
  );
};
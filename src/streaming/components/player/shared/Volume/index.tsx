
import React from 'react';
import { Desktop } from './variants/Desktop';
import { Mobile } from './variants/Mobile';
import type { VolumeProps } from '@/app/mind/lib/types/media';

export const Volume = (props: VolumeProps) => (
  <>
    <div className="hidden lg:block">
      <Desktop {...props} />
    </div>
    <div className="lg:hidden">
      <Mobile {...props} />
    </div>
  </>
);
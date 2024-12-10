// shared/Progress/index.tsx
import React from 'react';
import { Desktop } from './variants/Desktop';
import { Mobile } from './variants/Mobile';
import type { ProgressProps } from './types';

export const Progress = (props: ProgressProps) => (
  <>
    <div className="hidden lg:block">
      <Desktop {...props} />
    </div>
    <div className="lg:hidden">
      <Mobile {...props} />
    </div>
  </>
);
// shared/Controls/index.tsx 
import React from 'react';
import { Controls as Desktop } from './variants/Desktop';
import { Controls as Mobile } from './variants/Mobile';
import type { ControlsProps } from './types';

export const Controls = (props: ControlsProps) => (
 <>
   <div className="hidden lg:block">
     <Desktop {...props} />
   </div>
   <div className="lg:hidden">
     <Mobile {...props} />
   </div>
 </>
);
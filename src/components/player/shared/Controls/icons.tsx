// src/components/player/shared/Controls/icons.tsx
import React from 'react';

export const CustomPlay = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <polygon points="5 3 19 12 5 21" fill="rgb(24 24 27)" />
  </svg>
);

export const CustomPause = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <rect x="6" y="4" width="4" height="16" fill="rgb(24 24 27)" />
    <rect x="14" y="4" width="4" height="16" fill="rgb(24 24 27)" />
  </svg>
);
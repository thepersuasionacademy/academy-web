// src/app/ai/components/embed/output/LoadingState.tsx
import React from 'react';
import GridLoader from '../GridLoader';

export function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] w-full">
      <div className="scale-[2.5] mb-8">
        <GridLoader />
      </div>
    </div>
  );
}
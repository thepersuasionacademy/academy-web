'use client';

import { useEffect, useState } from 'react';

interface AIToolFrameProps {
  toolId: string;
  initialData?: {
    id: string;
    title: string;
    content: string;
  };
}

export const AIToolFrame = ({ toolId, initialData }: AIToolFrameProps) => {
  if (!initialData) {
    return (
      <div className="w-full h-full flex items-center justify-center text-[var(--text-secondary)]">
        Loading tool...
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      <div className="w-full h-full" dangerouslySetInnerHTML={{ __html: initialData.content }} />
    </div>
  );
}; 
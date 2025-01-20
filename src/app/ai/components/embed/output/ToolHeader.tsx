// src/app/ai/components/ToolHeader.tsx
'use client';

import React from 'react';
import type { Tool } from '@/app/ai/lib/tools';
import { useTheme } from '@/app/context/ThemeContext';

interface ToolHeaderProps {
  tool: Tool | null;
  isLoading: boolean;
}

export function ToolHeader({ tool, isLoading }: ToolHeaderProps) {
  const { theme } = useTheme();

  return (
    <div className="mb-8">
      {isLoading ? (
        <>
          <div className="h-10 w-48 bg-[var(--hover-bg)] animate-pulse rounded mb-3"></div>
          <div className="h-6 w-96 bg-[var(--hover-bg)] animate-pulse rounded"></div>
        </>
      ) : (
        <>
          <h2 className="text-4xl text-[var(--foreground)] mb-3">
            {tool?.name || 'Loading...'}
          </h2>
          <p className="text-lg text-[var(--text-secondary)] leading-relaxed">
            {tool?.description || 'Loading description...'}
          </p>
        </>
      )}
      <p className="text-sm text-[var(--text-secondary)] mt-4">
        Press Enter ↵ to continue
      </p>
    </div>
  );
}
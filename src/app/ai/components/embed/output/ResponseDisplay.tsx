// src/app/ai/components/embed/output/ResponseDisplay.tsx
'use client';

import React from 'react';
import { useTheme } from '@/app/context/ThemeContext';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { markdownComponents } from './MarkdownStyles';

interface ResponseDisplayProps {
  response: string;
  onRegenerate: () => void;
  isGenerating: boolean;
  isLoading: boolean;
}

export function ResponseDisplay({
  response,
  onRegenerate,
  isGenerating,
  isLoading
}: ResponseDisplayProps) {
  const { theme } = useTheme();

  return (
    <div className="max-w-3xl w-full px-4 py-16">
      <div className={`prose max-w-none ${
        theme === 'dark' ? 'prose-invert' : 'prose-gray'
      }`}>
        <div className="mb-16 transition-colors duration-200 text-[var(--foreground)]">
          <Markdown
            remarkPlugins={[remarkGfm]}
            components={markdownComponents}
          >
            {response}
          </Markdown>
        </div>
        
        <div className="flex justify-center gap-4">
        <button
  onClick={onRegenerate}
  disabled={isGenerating || isLoading}
  className={`text-xl font-bold rounded-xl transition-all duration-200 w-[240px] py-5
    ${!isGenerating && !isLoading
      ? 'bg-[var(--accent)] text-white hover:bg-[var(--accent)]/90'
      : 'bg-[var(--card-bg)] text-[var(--text-secondary)] cursor-not-allowed'}`}
>
  Regenerate
</button>

          <button
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(response);
                const button = document.getElementById('copyButton');
                if (button) {
                  button.textContent = 'Copied!';
                  setTimeout(() => {
                    if (button) button.textContent = 'Copy';
                  }, 2000);
                }
              } catch (err) {
                console.error('Failed to copy:', err);
                alert('Failed to copy to clipboard');
              }
            }}
            id="copyButton"
            className={`text-xl font-bold rounded-xl transition-all duration-200 w-[240px] py-5 
              border-2 border-[var(--foreground)] text-[var(--foreground)]
              hover:bg-[var(--hover-bg)]`}
          >
            Copy
          </button>
        </div>
      </div>
    </div>
  );
}
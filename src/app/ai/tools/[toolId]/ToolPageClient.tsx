'use client';

import { useState, useEffect } from 'react';
import { useTheme } from '@/app/context/ThemeContext';
import ToolInterface from '@/app/ai/components/embed/ToolInterface';
import { Moon, Sun } from 'lucide-react';
import { useAITool } from '@/app/ai/hooks/useAITool';
import type { AITool } from '@/lib/supabase/ai';

interface ToolPageClientProps {
  toolId: string;
  isEditMode?: boolean;
}

export default function ToolPageClient({ toolId, isEditMode = false }: ToolPageClientProps) {
  const { tool, inputs, isLoading, error } = useAITool(toolId);
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (error) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl text-[var(--foreground)] mb-4">Error Loading Tool</h2>
          <p className="text-[var(--text-secondary)]">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--background)]">
      {/* Theme Toggle */}
      <div className="w-full py-4 flex justify-center">
        {mounted && (
          <button 
            onClick={toggleTheme}
            className="relative flex items-center p-1 rounded-full bg-[var(--card-bg)] border border-[var(--border-color)]"
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {/* Theme Toggle Content */}
            <div className="flex items-center space-x-1">
              <div className="w-6 h-6 flex items-center justify-center">
                <Moon className="h-3.5 w-3.5 text-[var(--text-secondary)]" />
              </div>
              <div className="w-6 h-6 flex items-center justify-center">
                <Sun className="h-3.5 w-3.5 text-[var(--text-secondary)]" />
              </div>
            </div>
            
            {/* Sliding Indicator */}
            <div className={`absolute top-1 h-6 w-6 rounded-full bg-[var(--hover-bg)] transition-all duration-200 ${
              theme === 'dark' ? 'left-1' : 'left-[calc(100%-28px)]'
            }`}>
              {theme === 'dark' ? (
                <Moon className="h-3.5 w-3.5 text-[var(--foreground)] m-auto mt-1.5" />
              ) : (
                <Sun className="h-3.5 w-3.5 text-[var(--foreground)] m-auto mt-1.5" />
              )}
            </div>
          </button>
        )}
      </div>

      <div className="flex flex-col items-center justify-center pt-8">
        <ToolInterface 
          tool={tool} 
          inputs={inputs}
          prompts={[]}
          isLoading={isLoading}
          isEditMode={isEditMode}
        />
      </div>
    </main>
  );
}
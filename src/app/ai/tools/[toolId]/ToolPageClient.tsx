'use client';

import { useState, useEffect } from 'react';
import { useTheme } from '@/app/context/ThemeContext';
import ToolInterface from '@/app/ai/components/embed/ToolInterface';
import { Moon, Sun } from 'lucide-react';
import type { Tool } from '@/app/ai/components/dashboard/types';

interface ToolPageClientProps {
  toolId: string;
}

export default function ToolPageClient({ toolId }: ToolPageClientProps) {
  const [tool, setTool] = useState<Tool | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    async function fetchTool() {
      try {
        setIsLoading(true);
        console.log('Fetching tool with ID:', toolId);
        
        const response = await fetch(`/api/ai/tool/buyer-psychology-modeling`);
        console.log('Response status:', response.status);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Error response:', errorText);
          throw new Error(`Failed to fetch tool: ${response.status} ${errorText}`);
        }

        const data = await response.json();
        console.log('Tool data:', data);
        setTool(data.tools?.[0] || null);
      } catch (err) {
        console.error('Error details:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    }

    if (toolId) {
      fetchTool();
    }
  }, [toolId]);

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
        <ToolInterface tool={tool} isLoading={isLoading} />
      </div>
    </main>
  );
}
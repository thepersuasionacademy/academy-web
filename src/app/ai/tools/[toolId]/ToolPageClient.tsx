'use client';

import { useState, useEffect } from 'react';
import { useTheme } from '@/app/context/ThemeContext';
import ToolInterface from '@/app/ai/components/embed/ToolInterface';
import { Moon, Sun } from 'lucide-react';
import type { Tool } from '@/app/ai/components/dashboard/types';

interface ToolInterfaceAdapter {
  PK: string;
  SK: string;
  name: string;
  description: string;
  creditCost: number;
  promptTemplate: string;
  inputField1: string;
  inputField1Description: string;
  inputField2?: string;
  inputField2Description?: string;
  inputField3?: string;
  inputField3Description?: string;
}

function adaptTool(tool: Tool | null): ToolInterfaceAdapter | null {
  if (!tool) return null;
  
  return {
    PK: tool.SK,
    SK: tool.SK,
    name: tool.name,
    description: tool.description,
    creditCost: tool.creditCost,
    promptTemplate: tool.promptTemplate,
    inputField1: tool.inputField1,
    inputField1Description: tool.inputField1Description,
    inputField2: tool.inputField2,
    inputField2Description: tool.inputField2Description,
    inputField3: tool.inputField3,
    inputField3Description: tool.inputField3Description
  };
}

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
        const response = await fetch(`/api/tool/${toolId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch tool');
        }

        const data = await response.json();
        setTool(data.tools?.[0] || null);
      } catch (err) {
        console.error('Error fetching tool:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    }

    if (toolId) {
      fetchTool();
    }
  }, [toolId]);

  if (error) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="text-red-500">Error loading tool: {error}</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--background)]">
      {/* Theme Toggle Bar */}
      <div className="w-full py-4 flex justify-center">
        {mounted && (
          <button 
            onClick={toggleTheme}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--card-bg)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--foreground)] transition-all duration-200 hover:shadow-md"
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? (
              <>
                <Sun className="h-4 w-4" />
                <span className="text-sm font-medium">Light Mode</span>
              </>
            ) : (
              <>
                <Moon className="h-4 w-4" />
                <span className="text-sm font-medium">Dark Mode</span>
              </>
            )}
          </button>
        )}
      </div>

      <div className="flex flex-col items-center justify-center pt-8">
        <ToolInterface tool={adaptTool(tool)} isLoading={isLoading} />
      </div>
    </main>
  );
}
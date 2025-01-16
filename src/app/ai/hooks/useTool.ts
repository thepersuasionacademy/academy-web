// src/app/ai/hooks/useTool.ts
import { useState, useEffect } from 'react';
import { type Tool } from '@/app/ai/components/dashboard/types';

export function useTool(toolId: string) {
  const [tool, setTool] = useState<Tool | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!toolId) return;

    const fetchTool = async () => {
      try {
        setIsLoading(true);
        setError('');

        // Make sure we're using the full SK
        const fullSK = toolId.startsWith('SUITE#') ? toolId : `SUITE#basics#TOOL#${toolId}`;
        
        console.log('Fetching tool with SK:', fullSK);
        
        const response = await fetch(`/api/tool/${encodeURIComponent(fullSK)}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch tool');
        }

        const data = await response.json();
        if (data.tools?.[0]) {
          setTool(data.tools[0]);
        } else {
          setTool(null);
          setError('Tool not found');
        }
      } catch (error) {
        console.error('Error fetching tool:', error);
        setError(error instanceof Error ? error.message : 'Failed to load tool');
        setTool(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTool();
  }, [toolId]);

  return { tool, isLoading, error };
}
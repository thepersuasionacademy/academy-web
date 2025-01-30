import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useEffect, useState } from 'react';
import type { AITool, AIInput, AIPrompt } from '@/lib/supabase/ai';

interface UseAIToolResult {
  tool: AITool | null;
  inputs: AIInput[];
  prompts: AIPrompt[];
  isLoading: boolean;
  error: Error | null;
}

export function useAITool(toolId: string): UseAIToolResult {
  const [tool, setTool] = useState<AITool | null>(null);
  const [inputs, setInputs] = useState<AIInput[]>([]);
  const [prompts, setPrompts] = useState<AIPrompt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchTool() {
      if (!toolId) return;

      setIsLoading(true);
      setError(null);

      try {
        const supabase = createClientComponentClient();
        
        // Fetch the tool using RPC
        const { data: tools, error: toolError } = await supabase
          .rpc('get_tool_by_id', { tool_id: toolId });

        if (toolError) throw toolError;
        if (!tools || tools.length === 0) throw new Error('Tool not found');

        const tool = tools[0];
        
        // Fetch inputs using RPC
        const { data: inputsData, error: inputsError } = await supabase
          .rpc('get_tool_inputs', { tool_id: toolId });

        if (inputsError) throw inputsError;

        // Fetch prompts using RPC
        const { data: promptsData, error: promptsError } = await supabase
          .rpc('get_tool_prompts', { tool_id: toolId });

        if (promptsError) throw promptsError;

        setTool(tool);
        setInputs(inputsData || []);
        setPrompts(promptsData || []);
      } catch (err) {
        console.error('Error in useAITool:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch tool data'));
      } finally {
        setIsLoading(false);
      }
    }

    fetchTool();
  }, [toolId]);

  return { tool, inputs, prompts, isLoading, error };
} 
'use client';

import type { AITool, AIInput, AIPrompt } from '@/lib/supabase/ai';
import GenerateSection from './GenerateSection';

interface ToolInterfaceProps {
  tool: AITool | null;
  inputs: AIInput[];
  prompts: AIPrompt[];
  isLoading: boolean;
}

export default function ToolInterface({ tool, inputs, prompts, isLoading }: ToolInterfaceProps) {
  return <GenerateSection tool={tool} inputs={inputs} prompts={prompts} isLoading={isLoading} />;
}
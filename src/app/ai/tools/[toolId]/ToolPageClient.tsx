// src/app/ai/tools/[toolId]/ToolPageClient.tsx
'use client';

import { useTool } from '@/app/ai/hooks/useTool';
import ToolInterface from '@/app/ai/components/embed/ToolInterface';
import type { Tool as DashboardTool } from '@/app/ai/components/dashboard/types';

interface ToolInterfaceAdapter {
  PK: string;
  SK: string;
  name: string;
  description: string;
  creditCost: number;
  promptTemplate: string;
  inputField1: string;
  inputField1Description: string;
}

function adaptDashboardTool(tool: DashboardTool | null): ToolInterfaceAdapter | null {
  if (!tool) return null;
  
  return {
    PK: tool.SK,
    SK: tool.SK,
    name: tool.name,
    description: tool.description,
    creditCost: tool.creditCost,
    promptTemplate: tool.promptTemplate,
    inputField1: tool.inputField1,
    inputField1Description: tool.inputField1Description
  };
}

interface ToolPageClientProps {
  toolId: string;
}

export default function ToolPageClient({ toolId }: ToolPageClientProps) {
  const { tool: dashboardTool, isLoading, error } = useTool(toolId);
  const adaptedTool = adaptDashboardTool(dashboardTool);

  if (error) {
    return <div>Error loading tool: {error}</div>;
  }

  return (
    <main className="min-h-screen bg-[#17171a] relative">
      <div className="flex flex-col items-center justify-center min-h-screen">
        <ToolInterface tool={adaptedTool} isLoading={isLoading} />
      </div>
    </main>
  );
}
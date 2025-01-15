'use client';

import { useEffect, useState } from 'react';
import { use } from 'react';
import type { Tool } from '@/app/lib/tools';
import { ToolService } from '@/app/lib/tools';
import ToolInterface from './components/ToolInterface';

interface PageProps {
  params: Promise<{ toolId: string }>;
}

export default function Page({ params }: PageProps) {
  const resolvedParams = use(params);
  const [tool, setTool] = useState<Tool | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!resolvedParams.toolId) return;

    const fetchTool = async () => {
      try {
        const toolService = new ToolService();
        const toolData = await toolService.getToolById(resolvedParams.toolId);
        if (toolData) {
          setTool(toolData);
        }
      } catch (error) {
        console.error('Error fetching tool:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTool();
  }, [resolvedParams.toolId]);

  return (
    <main className="min-h-screen bg-[#17171a] relative">
      <div className="flex flex-col items-center justify-center min-h-screen">
        <ToolInterface tool={tool} isLoading={isLoading} />
      </div>
    </main>
  );
}
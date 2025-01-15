'use client';

import type { Tool } from '@/app/lib/tools';
import GenerateSection from './GenerateSection';

interface ToolInterfaceProps {
  tool: Tool | null;
  isLoading: boolean;
}

export default function ToolInterface({ tool, isLoading }: ToolInterfaceProps) {
  return <GenerateSection tool={tool} isLoading={isLoading} />;
}
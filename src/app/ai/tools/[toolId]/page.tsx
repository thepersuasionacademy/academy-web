// src/app/ai/tools/[toolId]/page.tsx
import { Suspense } from 'react';
import ToolPageClient from './ToolPageClient';
import { headers } from 'next/headers';

interface PageProps {
  params: { toolId: string };
}

async function getToolData(toolId: string) {
  // Use scan to find the tool without needing to know the suite
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/tool/${toolId}`, {
    headers: {
      'Content-Type': 'application/json',
    },
    cache: 'no-store'
  });

  if (!response.ok) {
    throw new Error('Failed to fetch tool');
  }

  return response.json();
}

export default async function Page({ params }: PageProps) {
  const toolId = await Promise.resolve(params.toolId);
  
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ToolPageClient toolId={toolId} />
    </Suspense>
  );
}
// src/app/ai/tools/[toolId]/page.tsx
import { Suspense } from 'react';
import ToolPageClient from './ToolPageClient';

interface PageProps {
  params: { toolId: string };
}

export default async function Page({ params }: PageProps) {
  const toolId = params.toolId;
  
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ToolPageClient toolId={toolId} />
    </Suspense>
  );
}
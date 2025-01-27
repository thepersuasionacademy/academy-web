'use client';

import React from 'react';
import dynamic from 'next/dynamic';

const ScrollProgress = dynamic(() => import('@/app/content/components/ScrollProgress'), {
  ssr: false
});

export function ClientWrapper() {
  return <ScrollProgress />;
} 
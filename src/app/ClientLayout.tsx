// src/app/ClientLayout.tsx
'use client';

import { usePathname } from 'next/navigation';
import Header from '@/app/layout/Header';
import ScrollProgress from "../streaming/components/ScrollProgress";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  // Only hide header on specific paths
  const hideHeader = pathname?.startsWith('/ai/tools/');

  return (
    <>
      {!hideHeader && <Header />}
      <main>
        <ScrollProgress />
        {children}
      </main>
    </>
  );
}
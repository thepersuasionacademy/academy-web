// src/app/ClientLayout.tsx
'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Header from '@/app/layout/Header';
import ScrollProgress from '@/app/content/components/ScrollProgress';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClientComponentClient();
  
  // Hide header on auth pages and AI tool pages
  const hideHeader = pathname?.startsWith('/auth/') || pathname?.startsWith('/ai/tools/');

  // Protect routes
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        // List of public routes that don't require authentication
        const publicRoutes = ['/auth/login', '/auth/signup', '/auth/reset'];
        const isPublicRoute = publicRoutes.some(route => pathname?.startsWith(route));
        
        if (!session && !isPublicRoute && pathname !== '/auth/login') {
          router.push('/auth/login');
        }
      } catch (error) {
        console.error('Auth check error:', error);
        router.push('/auth/login');
      }
    };

    checkAuth();
  }, [pathname, router, supabase.auth]);

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
// src/app/ClientLayout.tsx
'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
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
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  
  // Hide header on auth pages and AI tool pages
  const hideHeader = pathname?.startsWith('/auth/') || pathname?.startsWith('/ai/tools/');

  // List of public routes that don't require authentication
  const publicRoutes = ['/auth/login', '/auth/signup', '/auth/reset'];
  const isPublicRoute = publicRoutes.some(route => pathname?.startsWith(route));

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session);
      
      // Handle navigation based on auth state
      if (!session && !isPublicRoute && pathname !== '/auth/login') {
        router.push('/auth/login');
      }
    });

    // Initial auth check
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
      
      if (!session && !isPublicRoute && pathname !== '/auth/login') {
        router.push('/auth/login');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [pathname, router, supabase.auth, isPublicRoute]);

  // Show loading state while checking auth
  if (isAuthenticated === null && !isPublicRoute) {
    return <div>Loading...</div>;
  }

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
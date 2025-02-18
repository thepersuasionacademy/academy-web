// src/app/layout.tsx
'use client'

import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { ThemeProvider } from './context/ThemeContext';
import ClientLayout from './ClientLayout';
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Toaster } from 'sonner';
import { initializeIntercom, updateIntercomUser, shutdownIntercom } from '@/lib/intercom';

// Remove global declarations causing linter errors
type IntercomType = (...args: any[]) => void;

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [error, setError] = useState<string | null>(null)

  // Initialize Intercom
  useEffect(() => {
    initializeIntercom();
    return () => {
      if (window.Intercom) {
        window.Intercom('shutdown');
      }
    };
  }, []);

  // Update Intercom when user session changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        const timestamp = Math.floor(new Date(session.user.created_at).getTime() / 1000);
        updateIntercomUser({
          user_id: session.user.id,
          email: session.user.email,
          name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0],
          created_at: timestamp
        });
      } else if (event === 'SIGNED_OUT') {
        shutdownIntercom();
        initializeIntercom();
      }
    });

    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const timestamp = Math.floor(new Date(session.user.created_at).getTime() / 1000);
        updateIntercomUser({
          user_id: session.user.id,
          email: session.user.email,
          name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0],
          created_at: timestamp
        });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase.auth]);

  useEffect(() => {
    // Check for error parameter in URL
    const params = new URLSearchParams(window.location.search)
    const errorMsg = params.get('error')
    if (errorMsg) {
      setError(errorMsg)
      // Clean up the URL
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [])

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Intercom Base Code */}
        <script
          type="text/javascript"
          dangerouslySetInnerHTML={{
            __html: `
              (function(){var w=window;var ic=w.Intercom;if(typeof ic==="function"){ic('reattach_activator');ic('update',w.intercomSettings);}else{var d=document;var i=function(){i.c(arguments);};i.q=[];i.c=function(args){i.q.push(args);};w.Intercom=i;var l=function(){var s=d.createElement('script');s.type='text/javascript';s.async=true;s.src='https://widget.intercom.io/widget/${process.env.NEXT_PUBLIC_INTERCOM_APP_ID || 'lkn5t8ql'}';var x=d.getElementsByTagName('script')[0];x.parentNode.insertBefore(s,x);};if(document.readyState==='complete'){l();}else if(w.attachEvent){w.attachEvent('onload',l);}else{w.addEventListener('load',l,false);}}})();
            `
          }}
        />
      </head>
      <body 
        className={`${geistSans.variable} ${geistMono.variable} antialiased
          transition-colors duration-200`}
      >
        <ThemeProvider>
          <Toaster 
            position="top-center" 
            expand={true} 
            richColors 
            theme="dark"
            closeButton
          />
          {error && (
            <div className="fixed top-4 right-4 z-50 bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded-md shadow-lg">
              {error}
              <button 
                onClick={() => setError(null)}
                className="ml-2 text-red-400 hover:text-red-600"
              >
                ×
              </button>
            </div>
          )}
          <ClientLayout>
            {children}
          </ClientLayout>
        </ThemeProvider>
      </body>
    </html>
  );
}
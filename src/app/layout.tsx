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
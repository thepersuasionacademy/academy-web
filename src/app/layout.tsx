'use client';

import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import ScrollProgress from "../streaming/components/ScrollProgress";
import { UserProvider } from '@auth0/nextjs-auth0/client';
import Header from '@/app/layout/Header';
import { usePathname } from 'next/navigation';

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
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const hideHeader = pathname?.startsWith('/ai/tools/');

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <UserProvider>
          {!hideHeader && <Header />}
          <main className="pt-0">
            <ScrollProgress />
            {children}
          </main>
        </UserProvider>
      </body>
    </html>
  );
}
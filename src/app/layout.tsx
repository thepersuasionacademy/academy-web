// src/app/layout.tsx
import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { UserProvider } from '@auth0/nextjs-auth0/client';
import { ThemeProvider } from './context/ThemeContext';
import ClientLayout from './ClientLayout';

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
  return (
    <html lang="en" suppressHydrationWarning>
      <body 
        className={`${geistSans.variable} ${geistMono.variable} antialiased
          transition-colors duration-200`}
      >
        <ThemeProvider>
          <UserProvider>
            <ClientLayout>
              {children}
            </ClientLayout>
          </UserProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
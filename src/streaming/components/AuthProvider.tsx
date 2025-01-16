// src/components/AuthProvider.tsx
import { UserProvider } from '@auth0/nextjs-auth0/client';
import { ReactNode } from 'react';

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  return <UserProvider>{children}</UserProvider>;
}
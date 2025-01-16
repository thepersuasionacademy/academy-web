// src/app/api/auth/[...auth0]/route.ts
import { handleAuth } from '@auth0/nextjs-auth0';
import { NextResponse } from 'next/server';

export const GET = process.env.NODE_ENV === 'development' 
  ? () => NextResponse.json({ user: { email: 'dev@example.com' } })
  : handleAuth();
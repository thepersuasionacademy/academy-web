// src/lib/auth.ts
import { getSession, Claims } from '@auth0/nextjs-auth0';
import { NextRequest, NextResponse } from 'next/server';

export interface UserProfile extends Claims {
  email: string;
  email_verified: boolean;
  name: string;
  nickname: string;
  picture: string;
  sub: string;
  updated_at: string;
}

export const checkAuth = async (req: NextRequest) => {
  try {
    const res = new NextResponse();
    const session = await getSession(req, res);
    return !!session;
  } catch (error) {
    return false;
  }
};

export const getUser = async (req: NextRequest): Promise<UserProfile | null> => {
  try {
    const res = new NextResponse();
    const session = await getSession(req, res);
    return session?.user as UserProfile || null;
  } catch (error) {
    return null;
  }
};

export const getAuthToken = async (req: NextRequest): Promise<string | null> => {
  try {
    const res = new NextResponse();
    const session = await getSession(req, res);
    return session?.accessToken || null;
  } catch (error) {
    return null;
  }
};

// Optional: Helper to create a new response
export const createAuthResponse = () => {
  return new NextResponse();
};
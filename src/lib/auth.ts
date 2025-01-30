// src/lib/auth.ts
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export interface UserProfile {
  id: string;
  email: string;
  email_verified: boolean;
  full_name?: string;
  avatar_url?: string;
  updated_at?: string;
}

export const checkAuth = async (req: NextRequest) => {
  try {
    const supabase = createServerComponentClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();
    return !!session;
  } catch (error) {
    return false;
  }
};

export const getUser = async (req: NextRequest): Promise<UserProfile | null> => {
  try {
    const supabase = createServerComponentClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) return null;
    
    return {
      id: session.user.id,
      email: session.user.email!,
      email_verified: session.user.email_verified ?? false,
      full_name: session.user.user_metadata?.full_name,
      avatar_url: session.user.user_metadata?.avatar_url,
      updated_at: session.user.updated_at
    };
  } catch (error) {
    return null;
  }
};

export const getAuthToken = async (req: NextRequest): Promise<string | null> => {
  try {
    const supabase = createServerComponentClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
  } catch (error) {
    return null;
  }
};

// Optional: Helper to create a new response
export const createAuthResponse = () => {
  return new NextResponse();
};
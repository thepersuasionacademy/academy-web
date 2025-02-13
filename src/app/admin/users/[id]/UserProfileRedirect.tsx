'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface Props {
  userId: string;
}

export default function UserProfileRedirect({ userId }: Props) {
  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    const checkUserAndRedirect = async () => {
      try {
        // Verify the user exists in user_profiles
        const { data: user, error } = await supabase
          .from('user_profiles')
          .select('id')
          .eq('id', userId)
          .single();

        if (error || !user) {
          console.error('User not found:', error);
          // Go back to the users list
          window.history.back();
          return;
        }

        // If user exists, navigate to their profile page using path parameter
        window.location.href = `/profile/${userId}`;
      } catch (err) {
        console.error('Error checking user:', err);
        window.history.back();
      }
    };

    checkUserAndRedirect();
  }, [userId]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-pulse">Loading user profile...</div>
    </div>
  );
} 
import IntercomSDK from '@intercom/messenger-js-sdk';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface IntercomUser {
  email?: string;
  name?: string;
  user_id?: string;
  created_at?: number;
  user_hash?: string;
  avatar?: {
    type: string;
    image_url: string;
  };
  [key: string]: any;
}

interface UserProfile {
  first_name: string;
  last_name: string;
  email: string;
  profile_image_url: string | null;
}

const INTERCOM_APP_ID = process.env.NEXT_PUBLIC_INTERCOM_APP_ID || 'lkn5t8ql';

export const initializeIntercom = async (userData?: IntercomUser) => {
  // Only try to get hash if we have a user_id
  if (userData?.user_id) {
    try {
      const response = await fetch('/api/intercom/hash');
      if (response.ok) {
        const { hash } = await response.json();
        userData.user_hash = hash;
      }
      // If hash fails, continue without it - Intercom will still work, just without identity verification
    } catch (error) {
      // Continue without hash
    }
  }

  IntercomSDK({
    app_id: INTERCOM_APP_ID,
    ...userData
  });
};

// Type assertion to handle method calls
const intercom = IntercomSDK as typeof IntercomSDK & {
  (command: 'update' | 'show' | 'hide' | 'shutdown', data?: any): void;
};

export const updateIntercomUser = async (userData: IntercomUser) => {
  if (!userData.user_id || !window.Intercom) return;

  try {
    // Try to get hash but don't fail if we can't
    try {
      const hashResponse = await fetch('/api/intercom/hash');
      if (hashResponse.ok) {
        const { hash } = await hashResponse.json();
        userData.user_hash = hash;
      }
    } catch (error) {
      // Continue without hash
    }
    
    // Get name from Supabase with fresh data
    const supabase = createClientComponentClient();
    const { data, error } = await supabase
      .rpc('get_user_names', { p_user_id: userData.user_id })
      .returns<{ first_name: string; last_name: string }>()
      .single();

    if (error) throw error;

    // Remove any existing name from userData
    const { name: _, ...cleanUserData } = userData;

    // Update without full shutdown/reboot cycle
    window.Intercom('update', {
      app_id: INTERCOM_APP_ID,
      ...cleanUserData,
      name: data ? `${data.first_name} ${data.last_name}`.trim() : undefined
    });
  } catch (error) {
    // If update fails, try a simple update with just the basic user data
    try {
      window.Intercom('update', {
        app_id: INTERCOM_APP_ID,
        ...userData
      });
    } catch (e) {
      // Silently fail - Intercom will still work with existing data
    }
  }
};

export const showIntercom = () => {
  if (window.Intercom) window.Intercom('show');
};

export const hideIntercom = () => {
  if (window.Intercom) window.Intercom('hide');
};

export const shutdownIntercom = () => {
  if (window.Intercom) window.Intercom('shutdown');
}; 
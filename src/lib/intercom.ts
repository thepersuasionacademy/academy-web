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
  if (userData?.user_id) {
    try {
      const response = await fetch('/api/intercom/hash');
      if (!response.ok) throw new Error('Failed to get Intercom hash');
      const { hash } = await response.json();
      userData.user_hash = hash;
    } catch (error) {
      console.error('Error getting Intercom hash:', error);
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
    // Get user hash first
    const hashResponse = await fetch('/api/intercom/hash');
    if (!hashResponse.ok) throw new Error('Failed to get Intercom hash');
    const { hash } = await hashResponse.json();
    
    // Get name from Supabase with fresh data
    const supabase = createClientComponentClient();
    const { data, error } = await supabase
      .rpc('get_user_names', { p_user_id: userData.user_id })
      .returns<{ first_name: string; last_name: string }>()
      .single();

    if (error) throw error;

    // Remove any existing name from userData
    const { name: _, ...cleanUserData } = userData;

    // Completely shutdown and reinitialize
    window.Intercom('shutdown');
    
    // Small delay to ensure shutdown completes
    await new Promise(resolve => setTimeout(resolve, 100));

    // Reinitialize with new data
    window.Intercom('boot', {
      app_id: INTERCOM_APP_ID,
      ...cleanUserData,
      user_hash: hash,
      name: data ? `${data.first_name} ${data.last_name}`.trim() : undefined
    });
  } catch (error) {
    console.error('Error updating Intercom:', error);
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
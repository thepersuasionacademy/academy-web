'use client';

import React, { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { AIItem } from './components/types';
import { Toast } from './components/common/Toast';
import { ProfileHeader } from './components/header/ProfileHeader';
import { TabsContainer } from './components/tabs/TabsContainer';

interface ToolRun {
  id: string;
  tool_name: string;
  collection_name: string | null;
  suite_name: string | null;
  created_at: string;
  credits_cost: number;
  credits_before: number;
  credits_after: number;
  ai_response: string;
}

interface ProfilePageProps {
  userId?: string;
}

export default function ProfilePage({ userId }: ProfilePageProps) {
  // User state
  const [user, setUser] = useState({
    firstName: '',
    lastName: '',
    email: '',
    hasPassword: false
  });

  // State
  const [isLoading, setIsLoading] = useState(true);
  const [aiItems, setAiItems] = useState<AIItem[]>([]);
  const [contentItems, setContentItems] = useState<any[]>([]);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // Initialize Supabase client
  const supabase = createClientComponentClient();

  // Toast state
  const [toast, setToast] = useState<{
    message: string;
    type: 'error' | 'success';
    position?: 'bottom-right' | 'profile-image';
  } | null>(null);

  const showToast = (message: string, type: 'error' | 'success') => {
    setToast({ message, type });
  };

  // Check if user is admin using RPC
  useEffect(() => {
    async function checkAdminStatus() {
      try {
        // Check both admin and super admin status
        const [{ data: isAdminResult, error: adminError }, { data: isSuperAdminResult, error: superAdminError }] = await Promise.all([
          supabase.rpc('is_admin'),
          supabase.rpc('is_super_admin')
        ]);

        if (adminError) {
          console.error('Error checking admin status:', adminError);
          return;
        }

        if (superAdminError) {
          console.error('Error checking super admin status:', superAdminError);
          return;
        }

        console.log('Admin status check:', { isAdmin: isAdminResult, isSuperAdmin: isSuperAdminResult });
        setIsAdmin(!!(isAdminResult || isSuperAdminResult));
      } catch (error) {
        console.error('Error in checkAdminStatus:', error);
      }
    }

    checkAdminStatus();
  }, [supabase]);

  // Fetch user data
  useEffect(() => {
    async function fetchUserData() {
      try {
        // If userId is provided (admin view), use that, otherwise get current user's ID
        const { data: { session } } = await supabase.auth.getSession();
        const targetUserId = userId || session?.user?.id;

        if (!targetUserId) return;

        // Get user names from user_profiles
        const { data: userData, error: userError } = await supabase
          .rpc('get_user_names', {
            p_user_id: targetUserId
          });

        if (userError) {
          console.error('Error fetching user data:', userError);
          return;
        }

        const firstName = userData?.[0]?.first_name || 'Add your name';
        const lastName = userData?.[0]?.last_name || '';
        const email = userData?.[0]?.email || '';
        const profileImageUrl = userData?.[0]?.profile_image_url || null;
        const hasPassword = userData?.[0]?.has_password || false;

        setUser({
          firstName,
          lastName,
          email,
          hasPassword
        });
        setProfileImage(profileImageUrl);
      } catch (error) {
        console.error('Error in fetchUserData:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchUserData();
  }, [supabase, userId]);

  // Fetch tool runs
  useEffect(() => {
    async function fetchData() {
      try {
        // If userId is provided (admin view), use that, otherwise get current user's ID
        const { data: { session } } = await supabase.auth.getSession();
        const targetUserId = userId || session?.user?.id;

        if (!targetUserId) return;

        console.log('Fetching tool runs for user:', targetUserId);
        const { data: toolRuns, error } = await supabase
          .rpc('get_user_tool_runs', {
            p_user_id: targetUserId,
            p_limit: 10
          });

        if (error) {
          console.error('Error fetching tool runs:', error);
          throw error;
        }

        console.log('Tool runs data:', toolRuns);

        const formattedAIItems: AIItem[] = toolRuns.map((run: ToolRun) => ({
          id: run.id,
          toolName: run.tool_name,
          collectionName: run.collection_name,
          suiteName: run.suite_name,
          timestamp: run.created_at,
          creditsCost: run.credits_cost,
          creditsBefore: run.credits_before,
          creditsAfter: run.credits_after,
          aiResponse: run.ai_response
        }));

        console.log('Formatted AI items:', formattedAIItems);
        setAiItems(formattedAIItems);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    }

    fetchData();
  }, [supabase, userId]);

  // Fetch content items
  useEffect(() => {
    async function fetchContentData() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const targetUserId = userId || session?.user?.id;

        if (!targetUserId) return;

        console.log('Fetching content for user:', targetUserId);
        
        // Get all access records with content info in a single query
        const { data: accessRecords, error: accessError } = await supabase
          .from('access.user_access')
          .select(`
            *,
            content:content_id (
              *,
              collection:collection_id (*),
              modules (
                *,
                media (*)
              )
            ),
            streaming:content_id (
              streaming_content:get_streaming_content(*)
            )
          `)
          .eq('user_id', targetUserId);

        if (accessError) {
          console.error('Error fetching access records:', accessError);
          return;
        }

        // Transform the data to include streaming content
        const validContent = accessRecords.map(record => ({
          ...record,
          streamingData: record.streaming?.streaming_content
        })).filter(item => item !== null);

        console.log('Content data:', validContent);
        setContentItems(validContent || []);
      } catch (error) {
        console.error('Error in fetchContentData:', error);
      }
    }

    fetchContentData();
  }, [supabase, userId]);

  const handleUpdateUser = async (updates: Partial<{ firstName: string; lastName: string; email: string }>) => {
    try {
      const targetUserId = userId || (await supabase.auth.getSession()).data.session?.user?.id;
      if (!targetUserId) return;

      if ('firstName' in updates || 'lastName' in updates) {
        const { error } = await supabase
          .rpc('update_user_names', {
            user_id: targetUserId,
            new_first_name: updates.firstName || user.firstName,
            new_last_name: updates.lastName || user.lastName
          });

        if (error) {
          console.error('Error updating names:', error);
          return;
        }

        setUser(prev => ({
          ...prev,
          firstName: updates.firstName || prev.firstName,
          lastName: updates.lastName || prev.lastName
        }));
      }

      if ('email' in updates) {
        const { error } = await supabase
          .from('user_profiles')
          .update({ email: updates.email })
          .eq('id', targetUserId);
        
        if (error) {
          console.error('Error updating email:', error);
          return;
        }

        setUser(prev => ({
          ...prev,
          email: updates.email || prev.email
        }));
      }
    } catch (error) {
      console.error('Error in handleUpdateUser:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-[var(--text-secondary)]">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <ProfileHeader
        user={user}
        profileImage={profileImage}
        onUpdateUser={handleUpdateUser}
      />
      <TabsContainer
        isAdmin={isAdmin}
        userId={userId}
        aiItems={aiItems}
        contentItems={contentItems}
      />
      {toast && toast.position === 'bottom-right' && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
          position="bottom-right"
        />
      )}
    </div>
  );
}
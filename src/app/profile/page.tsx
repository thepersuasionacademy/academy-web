'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  User,
  ChevronRight,
  Clock,
  Pencil,
  Check,
  X,
  Camera,
  Lock,
  Eye,
  EyeOff,
  ChevronLeft
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { AICreditsDetail } from './components/AICreditsDetail';
import { PaymentDetail } from './components/PaymentDetail';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { AIItem, PaymentItem } from './components/types';
import { Toast } from './components/Toast';

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

  // Add edit states
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [tempFirstName, setTempFirstName] = useState('');
  const [tempLastName, setTempLastName] = useState('');
  const [tempEmail, setTempEmail] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Tool runs state
  const [aiItems, setAiItems] = useState<AIItem[]>([]);

  // Image state
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize Supabase client
  const supabase = createClientComponentClient();

  // Toast state
  const [toast, setToast] = useState<{
    message: string;
    type: 'error' | 'success';
    position?: 'bottom-right' | 'profile-image';
  } | null>(null);

  // Password reset state
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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

        // Only set the temp values to empty strings, not the placeholder
        setTempFirstName('');
        setTempLastName('');
        setTempEmail(email);
      } catch (error) {
        console.error('Error in fetchUserData:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchUserData();
  }, [supabase, userId]);

  // Handle input changes with save
  const handleNameChange = async (field: 'firstName' | 'lastName', value: string) => {
    if (field === 'firstName') {
      setTempFirstName(value);
    } else {
      setTempLastName(value);
    }
  };

  const handleSaveName = async () => {
    try {
      const targetUserId = userId || (await supabase.auth.getSession()).data.session?.user?.id;
      if (!targetUserId) return;

      const { error } = await supabase
        .rpc('update_user_names', {
          user_id: targetUserId,
          new_first_name: tempFirstName || user.firstName,
          new_last_name: tempLastName
        });

      if (error) {
        console.error('Error updating names:', error);
        return;
      }

      setUser(prev => ({
        ...prev,
        firstName: tempFirstName || prev.firstName,
        lastName: tempLastName
      }));
      setIsEditingName(false);
    } catch (error) {
      console.error('Error in handleSaveName:', error);
    }
  };

  const handleEmailChange = (value: string) => {
    setTempEmail(value);
  };

  const handleSaveEmail = async () => {
    try {
      const targetUserId = userId || (await supabase.auth.getSession()).data.session?.user?.id;
      if (!targetUserId) return;

      // Update email in user_profiles table
      const { error } = await supabase
        .from('user_profiles')
        .update({ email: tempEmail })
        .eq('id', targetUserId);
      
      if (error) {
        console.error('Error updating email:', error);
        return;
      }

      setUser(prev => ({
        ...prev,
        email: tempEmail
      }));
      setIsEditingEmail(false);
    } catch (error) {
      console.error('Error in handleSaveEmail:', error);
    }
  };

  const handlePasswordReset = async () => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
      
      if (error) {
        console.error('Error sending password reset:', error);
        showToast('Failed to send password reset email', 'error');
        return;
      }

      showToast('Password reset email sent', 'success');
      setIsResettingPassword(false);
    } catch (error) {
      console.error('Error in handlePasswordReset:', error);
      showToast('Failed to send password reset email', 'error');
    }
  };

  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      showToast('Passwords do not match', 'error');
      return;
    }

    if (newPassword.length < 6) {
      showToast('Password must be at least 6 characters', 'error');
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        console.error('Error updating password:', error);
        showToast('Failed to update password', 'error');
        return;
      }

      showToast('Password updated successfully', 'success');
      setIsChangingPassword(false);
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('Error in handlePasswordChange:', error);
      showToast('Failed to update password', 'error');
    }
  };

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

  const [activeTab, setActiveTab] = useState<'credits' | 'billing'>('credits');
  const [selectedItem, setSelectedItem] = useState<AIItem | null>(null);
  const [showCopied, setShowCopied] = useState(false);

  // Format timestamp to readable date and time
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return {
      date: date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      time: date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      })
    };
  };

  // Get current items based on active tab
  const currentItems = aiItems;
  console.log('Current items:', currentItems);

  // Get current items for display
  const getCurrentItems = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const items = currentItems.slice(startIndex, endIndex);
    console.log('Items for current page:', items);
    return items;
  };

  // Get total pages
  const totalPages = Math.ceil(currentItems.length / itemsPerPage);

  // Generate page numbers to display
  const getPageNumbers = () => {
    const delta = 1; // Number of pages to show on each side of current page
    const pages = [];
    
    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 || // First page
        i === totalPages || // Last page
        (i >= currentPage - delta && i <= currentPage + delta) // Pages around current
      ) {
        pages.push(i);
      } else if (pages[pages.length - 1] !== '...') {
        pages.push('...');
      }
    }
    
    return pages;
  };

  const handleCopyResponse = (response: string) => {
    navigator.clipboard.writeText(response);
    setShowCopied(true);
    setTimeout(() => setShowCopied(false), 2000);
  };

  // Helper function to determine if an item is an AIItem
  const isAIItem = (item: AIItem | PaymentItem): item is AIItem => {
    return 'toolName' in item;
  };

  // Helper function to get item details
  const getItemDetails = (item: AIItem) => {
    return {
      category: item.collectionName || '',
      suite: item.suiteName || '',
      name: item.toolName
    };
  };

  // Helper function to get metadata for display
  const getItemMetadata = (item: AIItem) => {
    const details = getItemDetails(item);
    return {
      category: details.category,
      suite: details.suite,
      name: details.name,
      type: 'AI Tool Run'
    };
  };

  const showToast = (message: string, type: 'error' | 'success', position: 'bottom-right' | 'profile-image' = 'bottom-right') => {
    setToast({ message, type, position });
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (5MB limit)
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > MAX_FILE_SIZE) {
      showToast('Image size must be less than 5MB', 'error', 'profile-image');
      return;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      showToast('Image must be JPEG, PNG, GIF, or WebP', 'error', 'profile-image');
      return;
    }

    try {
      setIsUploadingImage(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      // Upload image to storage
      const fileExt = file.name.split('.').pop();
      const filePath = `${session.user.id}/profile.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('profile-images')
        .upload(filePath, file, { 
          upsert: true,
          contentType: file.type
        });

      if (uploadError) {
        console.error('Error uploading image:', uploadError);
        if (uploadError.message.includes('size')) {
          showToast('Image size must be less than 5MB', 'error', 'profile-image');
        } else if (uploadError.message.includes('type')) {
          showToast('Image must be JPEG, PNG, GIF, or WebP', 'error', 'profile-image');
        } else {
          showToast('Failed to upload image. Please try again.', 'error', 'profile-image');
        }
        return;
      }

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profile-images')
        .getPublicUrl(filePath);

      // Update user profile with the new image path
      const { error: updateError } = await supabase
        .rpc('update_user_avatar', {
          user_id: session.user.id,
          new_avatar_path: publicUrl
        });

      if (updateError) {
        console.error('Error updating avatar:', updateError);
        showToast('Failed to update profile. Please try again.', 'error', 'profile-image');
        return;
      }

      setProfileImage(publicUrl);
      showToast('Profile image updated successfully', 'success', 'profile-image');
    } catch (error) {
      console.error('Error in handleImageUpload:', error);
      showToast('Failed to upload image. Please try again.', 'error', 'profile-image');
    } finally {
      setIsUploadingImage(false);
      if (event.target) {
        event.target.value = ''; // Reset file input
      }
    }
  };

  const handleBillingPortal = async () => {
    try {
      const targetUserId = userId || (await supabase.auth.getSession()).data.session?.user?.id;
      if (!targetUserId) return;

      const response = await fetch('/api/payments/billing-portal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: targetUserId })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error);
      }

      // Redirect to the billing portal URL in the same tab
      window.location.href = data.url;
    } catch (error) {
      console.error('Error accessing billing portal:', error);
      showToast(error instanceof Error ? error.message : 'Failed to access billing portal', 'error');
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
      {/* Updated Header with user info */}
      <div className="border-b border-[var(--border-color)] p-8">
        <div className="flex items-start justify-center gap-8 max-w-6xl mx-auto">
          <div className="relative group">
            <div className={cn(
              "w-24 h-24 rounded-full overflow-hidden",
              "bg-[var(--hover-bg)]",
              "flex items-center justify-center",
              "flex-shrink-0"
            )}>
              {profileImage ? (
                <img 
                  src={profileImage} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-12 h-12 text-[var(--text-secondary)]" />
              )}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "absolute inset-0 flex items-center justify-center",
                "bg-black/50 opacity-0 group-hover:opacity-100",
                "transition-opacity rounded-full",
                "text-white"
              )}
            >
              <div className="flex flex-col items-center">
                <Camera className="w-6 h-6 mb-1" />
                <span className="text-sm">
                  {profileImage ? 'Change' : 'Add'}
                </span>
              </div>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            {toast && toast.position === 'profile-image' && (
              <Toast
                message={toast.message}
                type={toast.type}
                onClose={() => setToast(null)}
                position="profile-image"
              />
            )}
          </div>
          <div className="flex flex-col gap-4">
            {isEditingName ? (
              <div className="flex items-start gap-4">
                <div className="space-y-2">
                  <input
                    type="text"
                    value={tempFirstName}
                    onChange={(e) => handleNameChange('firstName', e.target.value)}
                    className="px-4 py-2 text-2xl bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg focus:outline-none focus:border-[var(--accent)] transition-colors"
                    placeholder="First Name"
                    autoFocus
                  />
                  <input
                    type="text"
                    value={tempLastName}
                    onChange={(e) => handleNameChange('lastName', e.target.value)}
                    className="px-4 py-2 text-2xl bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg focus:outline-none focus:border-[var(--accent)] transition-colors"
                    placeholder="Last Name (optional)"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <button 
                    onClick={handleSaveName}
                    className="p-2 bg-[var(--accent)] text-white hover:opacity-90 rounded-lg transition-opacity"
                  >
                    <Check className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => {
                      setIsEditingName(false);
                      setTempFirstName(user.firstName === 'Add your name' ? '' : user.firstName);
                      setTempLastName(user.lastName);
                    }}
                    className="p-2 border border-[var(--border-color)] hover:border-[var(--accent)] rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ) : (
              <div 
                onClick={() => setIsEditingName(true)}
                className={cn(
                  "group relative inline-flex items-center"
                )}
              >
                <h2 className={cn(
                  "text-3xl font-medium text-[var(--foreground)] transition-colors",
                  user.firstName === 'Add your name' && "text-[var(--text-secondary)] italic"
                )}>
                  {user.firstName} {user.lastName}
                </h2>
              </div>
            )}

            {isEditingEmail ? (
              <div className="flex items-center gap-4">
                <input
                  type="email"
                  value={tempEmail}
                  onChange={(e) => handleEmailChange(e.target.value)}
                  className="px-4 py-2 text-xl bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg w-full focus:outline-none focus:border-[var(--accent)] transition-colors"
                  placeholder="Email"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button 
                    onClick={handleSaveEmail}
                    className="p-2 bg-[var(--accent)] text-white hover:opacity-90 rounded-lg transition-opacity"
                  >
                    <Check className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => {
                      setIsEditingEmail(false);
                      setTempEmail(user.email);
                    }}
                    className="p-2 border border-[var(--border-color)] hover:border-[var(--accent)] rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <div 
                  onClick={() => setIsEditingEmail(true)}
                  className={cn(
                    "group relative inline-flex items-center cursor-pointer"
                  )}
                >
                  <p className={cn(
                    "text-xl text-[var(--text-secondary)] transition-colors group-hover:text-[var(--accent)]"
                  )}>
                    {user.email}
                  </p>
                  <div className="absolute -right-8 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Pencil className="w-5 h-5 text-[var(--accent)]" />
                  </div>
                </div>

                {/* Password Change Option */}
                {isChangingPassword ? (
                  <div className="flex flex-col gap-4 mt-2">
                    <div className="space-y-2">
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full px-4 py-2 text-sm bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg focus:outline-none focus:border-[var(--accent)] transition-colors"
                          placeholder="New password"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors"
                        >
                          {showPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full px-4 py-2 text-sm bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg focus:outline-none focus:border-[var(--accent)] transition-colors"
                        placeholder="Confirm new password"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={handlePasswordChange}
                        className="px-4 py-2 bg-[var(--accent)] text-white hover:opacity-90 rounded-lg transition-opacity text-sm"
                      >
                        Update Password
                      </button>
                      <button 
                        onClick={() => {
                          setIsChangingPassword(false);
                          setNewPassword('');
                          setConfirmPassword('');
                          setShowPassword(false);
                        }}
                        className="px-4 py-2 border border-[var(--border-color)] hover:border-[var(--accent)] rounded-lg transition-colors text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div 
                    onClick={() => setIsChangingPassword(true)}
                    className="group relative inline-flex items-center cursor-pointer"
                  >
                    <p className="text-sm text-[var(--text-secondary)] transition-colors group-hover:text-[var(--accent)] flex items-center gap-2">
                      <Lock className="w-4 h-4" />
                      {user.hasPassword ? 'Change password' : 'Set password'}
                    </p>
                    <div className="absolute -right-8 opacity-0 group-hover:opacity-100 transition-opacity">
                      <ChevronRight className="w-4 h-4 text-[var(--accent)]" />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-6xl mx-auto mt-8 px-6 pb-16">
        {/* Centered tab buttons */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex items-center gap-2 p-1 rounded-lg bg-[var(--card-bg)] border border-[var(--border-color)]">
            <button 
              onClick={() => setActiveTab('credits')}
              className={cn(
                "px-6 py-3 rounded-md text-lg font-medium transition-all",
                activeTab === 'credits' 
                  ? "bg-[var(--accent)] text-white" 
                  : "hover:bg-[var(--hover-bg)]"
              )}>
              AI Credits
            </button>
            <button 
              onClick={handleBillingPortal}
              className="px-6 py-3 rounded-md text-lg font-medium transition-all hover:bg-[var(--hover-bg)]">
              Billing
            </button>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-8">
          {/* Left Column - Recent History */}
          <div className="col-span-5">
            <div className="space-y-4">
              <h3 className="text-xl font-medium text-[var(--text-secondary)] mb-6">Recent History</h3>
              {currentItems.length > 0 ? (
                <div className="space-y-4">
                  {getCurrentItems().map((item) => {
                    const metadata = getItemMetadata(item);
                    return (
                      <div
                        key={item.id}
                        onClick={() => setSelectedItem(item)}
                        className={cn(
                          "p-4 rounded-lg",
                          "border border-[var(--border-color)]",
                          "cursor-pointer",
                          "transition-all",
                          selectedItem?.id === item.id 
                            ? 'border-[var(--accent)] bg-[var(--accent)]/5' 
                            : 'hover:border-[var(--accent)]'
                        )}
                      >
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                            <span>{metadata.category}</span>
                            <ChevronRight className="w-3 h-3" />
                            <span>{metadata.suite}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-lg text-[var(--foreground)]">{metadata.name}</span>
                            <ChevronRight className="w-5 h-5 text-[var(--text-secondary)]" />
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-6">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className={cn(
                          "p-1 rounded-md transition-colors",
                          currentPage === 1 
                            ? "text-[var(--text-secondary)] cursor-not-allowed"
                            : "hover:bg-[var(--hover-bg)]"
                        )}
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>

                      {getPageNumbers().map((page, index) => (
                        <button
                          key={index}
                          onClick={() => typeof page === 'number' && setCurrentPage(page)}
                          className={cn(
                            "w-8 h-8 rounded-md flex items-center justify-center transition-colors",
                            typeof page === 'number' && page === currentPage
                              ? "bg-[var(--accent)] text-white"
                              : page === '...'
                              ? "text-[var(--text-secondary)] cursor-default"
                              : "hover:bg-[var(--hover-bg)]"
                          )}
                        >
                          {page}
                        </button>
                      ))}

                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className={cn(
                          "p-1 rounded-md transition-colors",
                          currentPage === totalPages
                            ? "text-[var(--text-secondary)] cursor-not-allowed"
                            : "hover:bg-[var(--hover-bg)]"
                        )}
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-[var(--text-secondary)]">
                  No AI credits history available
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Details */}
          <div className="col-span-7">
            {selectedItem ? (
              <div className="space-y-6">
                <div className="rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] p-8">
                  <AICreditsDetail 
                    item={selectedItem}
                    formatTimestamp={formatTimestamp}
                    onCopy={handleCopyResponse}
                    showCopied={showCopied}
                  />
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] p-8">
                <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-[var(--text-secondary)] text-lg">
                  <p>Select an item to view details</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

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
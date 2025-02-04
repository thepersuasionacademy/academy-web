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
  EyeOff
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

export default function ProfileDashboard() {
  // User state
  const [user, setUser] = useState({
    firstName: '',
    lastName: '',
    email: '',
  });

  // Add edit states
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [tempFirstName, setTempFirstName] = useState('');
  const [tempLastName, setTempLastName] = useState('');
  const [tempEmail, setTempEmail] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Tool runs and payments state
  const [aiItems, setAiItems] = useState<AIItem[]>([]);
  const [paymentItems, setPaymentItems] = useState<PaymentItem[]>([]);

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

  // Fetch user data
  useEffect(() => {
    async function fetchUserData() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) return;

        // Get user names from auth
        const { data: userData, error: userError } = await supabase
          .rpc('get_user_names', {
            p_user_id: session.user.id
          });

        if (userError) {
          console.error('Error fetching user data:', userError);
          return;
        }

        const firstName = userData?.[0]?.first_name || 'Add your name';
        const lastName = userData?.[0]?.last_name || '';
        const email = userData?.[0]?.email || session.user.email || '';
        const profileImageUrl = userData?.[0]?.profile_image_url || null;

        setUser({
          firstName,
          lastName,
          email,
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
  }, [supabase]);

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
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const { error } = await supabase
        .rpc('update_user_names', {
          user_id: session.user.id,
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
      const { error } = await supabase.auth.updateUser({ email: tempEmail });
      
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

  // Fetch tool runs on component mount
  useEffect(() => {
    async function fetchToolRuns() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) return;

        const { data: toolRuns, error } = await supabase
          .rpc('get_user_tool_runs', {
            p_user_id: session.user.id,
            p_limit: 10  // Fetch last 10 runs
          });

        if (error) {
          console.error('Error fetching tool runs:', error);
          return;
        }

        // Transform the data to match our AIItem interface
        const transformedRuns: AIItem[] = (toolRuns as ToolRun[]).map(run => ({
          id: run.id,
          tool_name: run.tool_name,
          collection_name: run.collection_name,
          suite_name: run.suite_name,
          timestamp: run.created_at,
          credits_cost: run.credits_cost,
          credits_before: run.credits_before,
          credits_after: run.credits_after,
          ai_response: run.ai_response
        }));

        setAiItems(transformedRuns);
      } catch (error) {
        console.error('Error in fetchToolRuns:', error);
      }
    }

    fetchToolRuns();
  }, [supabase]);

  // Payments test data (keeping this for now)
  const defaultPaymentItems: PaymentItem[] = [
    {
      id: '1',
      name: "Pro Plan Subscription",
      category: "Subscriptions",
      suite: "Pro Plan",
      timestamp: "2024-03-01T00:00:00Z",
      amount: 49.99,
      status: 'paid',
      receipt: "receipt-123",
      paymentType: 'subscription',
      nextBillingDate: "2024-04-01T00:00:00Z",
      billingCycle: 'monthly'
    }
  ];

  useEffect(() => {
    setPaymentItems(defaultPaymentItems);
  }, []);

  const [activeTab, setActiveTab] = useState<'credits' | 'payments'>('credits');
  const [selectedItem, setSelectedItem] = useState<AIItem | PaymentItem | null>(null);
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
  const currentItems = activeTab === 'credits' ? aiItems : paymentItems;

  const handleCopyResponse = (response: string) => {
    navigator.clipboard.writeText(response);
    setShowCopied(true);
    setTimeout(() => setShowCopied(false), 2000);
  };

  // Helper function to determine if an item is an AIItem
  const isAIItem = (item: AIItem | PaymentItem): item is AIItem => {
    return 'tool_name' in item;
  };

  // Helper function to get category and suite for display
  const getItemMetadata = (item: AIItem | PaymentItem) => {
    if (isAIItem(item)) {
      return {
        category: item.collection_name || '',
        suite: item.suite_name || '',
        name: item.tool_name
      };
    }
    return {
      category: item.category,
      suite: item.suite,
      name: item.name
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
            {isUploadingImage && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              </div>
            )}
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
                onClick={() => {
                  setIsEditingName(true);
                  setTempFirstName(user.firstName === 'Add your name' ? '' : user.firstName);
                  setTempLastName(user.lastName);
                }}
                className="group relative inline-flex items-center cursor-pointer"
              >
                <h2 className={cn(
                  "text-3xl font-medium text-[var(--foreground)] transition-colors",
                  user.firstName === 'Add your name' && "text-[var(--text-secondary)] italic",
                  "group-hover:text-[var(--accent)]"
                )}>
                  {user.firstName} {user.lastName}
                </h2>
                <div className="absolute -right-8 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Pencil className="w-5 h-5 text-[var(--accent)]" />
                </div>
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
                  onClick={() => {
                    setIsEditingEmail(true);
                    setTempEmail(user.email);
                  }}
                  className="group relative inline-flex items-center cursor-pointer"
                >
                  <p className="text-xl text-[var(--text-secondary)] transition-colors group-hover:text-[var(--accent)]">
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
                      Change password
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
      <div className="max-w-6xl mx-auto mt-8 px-6">
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
              onClick={() => setActiveTab('payments')}
              className={cn(
                "px-6 py-3 rounded-md text-lg font-medium transition-all",
                activeTab === 'payments' 
                  ? "bg-[var(--accent)] text-white" 
                  : "hover:bg-[var(--hover-bg)]"
              )}>
              Payments
            </button>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-8">
          {/* Left Column - Recent History */}
          <div className="col-span-5">
            <div className="space-y-4">
              <h3 className="text-xl font-medium text-[var(--text-secondary)] mb-6">Recent History</h3>
              {currentItems.map((item) => {
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
                      <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                        <Clock className="w-3 h-3" />
                        <span>{formatTimestamp(item.timestamp).date}</span>
                        <span>•</span>
                        <span>{formatTimestamp(item.timestamp).time}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column - Details */}
          <div className="col-span-7">
            {selectedItem ? (
              <div className="space-y-6">
                <div className="rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] p-8">
                  {isAIItem(selectedItem) ? (
                    <AICreditsDetail 
                      item={selectedItem}
                      formatTimestamp={formatTimestamp}
                      onCopy={handleCopyResponse}
                      showCopied={showCopied}
                    />
                  ) : (
                    <PaymentDetail 
                      item={selectedItem}
                      formatTimestamp={formatTimestamp}
                    />
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-[var(--text-secondary)] text-lg">
                <p>Select an item to view details</p>
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
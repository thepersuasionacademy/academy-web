import React, { useState, useRef } from 'react';
import { 
  User,
  Pencil,
  Check,
  X,
  Camera,
  Lock,
  Eye,
  EyeOff,
  ChevronRight
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { Toast } from '../common/Toast';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface ProfileHeaderProps {
  user: {
    firstName: string;
    lastName: string;
    email: string;
    hasPassword: boolean;
  };
  profileImage: string | null;
  onUpdateUser: (updates: Partial<{ firstName: string; lastName: string; email: string }>) => void;
}

export function ProfileHeader({ user, profileImage, onUpdateUser }: ProfileHeaderProps) {
  // Edit states
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [tempFirstName, setTempFirstName] = useState('');
  const [tempLastName, setTempLastName] = useState('');
  const [tempEmail, setTempEmail] = useState('');

  // Image state
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Password states
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Toast state
  const [toast, setToast] = useState<{
    message: string;
    type: 'error' | 'success';
    position?: 'bottom-right' | 'profile-image';
  } | null>(null);

  // Initialize Supabase client
  const supabase = createClientComponentClient();

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (5MB limit)
    const MAX_FILE_SIZE = 5 * 1024 * 1024;
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

      showToast('Profile image updated successfully', 'success', 'profile-image');
    } catch (error) {
      console.error('Error in handleImageUpload:', error);
      showToast('Failed to upload image. Please try again.', 'error', 'profile-image');
    } finally {
      setIsUploadingImage(false);
      if (event.target) {
        event.target.value = '';
      }
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

  const showToast = (message: string, type: 'error' | 'success', position: 'bottom-right' | 'profile-image' = 'bottom-right') => {
    setToast({ message, type, position });
  };

  return (
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
                  onChange={(e) => setTempFirstName(e.target.value)}
                  className="px-4 py-2 text-2xl bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg focus:outline-none focus:border-[var(--accent)] transition-colors"
                  placeholder="First Name"
                  autoFocus
                />
                <input
                  type="text"
                  value={tempLastName}
                  onChange={(e) => setTempLastName(e.target.value)}
                  className="px-4 py-2 text-2xl bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg focus:outline-none focus:border-[var(--accent)] transition-colors"
                  placeholder="Last Name (optional)"
                />
              </div>
              <div className="flex flex-col gap-2">
                <button 
                  onClick={() => {
                    onUpdateUser({ firstName: tempFirstName || user.firstName, lastName: tempLastName });
                    setIsEditingName(false);
                  }}
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
              className="group relative inline-flex items-center"
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
                onChange={(e) => setTempEmail(e.target.value)}
                className="px-4 py-2 text-xl bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg w-full focus:outline-none focus:border-[var(--accent)] transition-colors"
                placeholder="Email"
                autoFocus
              />
              <div className="flex gap-2">
                <button 
                  onClick={() => {
                    onUpdateUser({ email: tempEmail });
                    setIsEditingEmail(false);
                  }}
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
                className="group relative inline-flex items-center cursor-pointer"
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
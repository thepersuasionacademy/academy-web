import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import Image from 'next/image'
import { useState, useRef } from 'react'
import { User, Camera } from 'lucide-react'

interface SignupViewProps {
  onBack: () => void;
}

export default function SignupView({ onBack }: SignupViewProps) {
  const supabase = createClientComponentClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [profileImage, setProfileImage] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isSending, setIsSending] = useState(false)
  const [notification, setNotification] = useState('')
  const [showVerification, setShowVerification] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setProfileImage(file)
      
      // Create preview URL
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
      
      // Clean up the old preview URL if it exists
      return () => {
        if (previewUrl) {
          URL.revokeObjectURL(previewUrl)
        }
      }
    }
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSending(true)
    setNotification('')

    try {
      // 1. Sign up the user
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${location.origin}/auth/callback`,
          data: {
            first_name: firstName,
            last_name: lastName,
          }
        }
      })

      if (signUpError) {
        setNotification(signUpError.message)
        setIsSending(false)
        return
      }

      const userId = signUpData.user?.id
      if (!userId) {
        setNotification('Failed to create user')
        setIsSending(false)
        return
      }

      // 2. Update user names in the database
      const { error: namesError } = await supabase.rpc('update_user_names', {
        user_id: userId,
        new_first_name: firstName,
        new_last_name: lastName
      })

      if (namesError) {
        console.error('Error updating names:', namesError)
      }

      // 3. Upload profile image if provided
      if (profileImage) {
        const fileExt = profileImage.name.split('.').pop()
        const filePath = `${userId}/profile.${fileExt}`

        const { error: uploadError } = await supabase.storage
          .from('profile-images')
          .upload(filePath, profileImage)

        if (uploadError) {
          console.error('Error uploading profile image:', uploadError)
        } else {
          // Get the public URL
          const { data: { publicUrl } } = supabase.storage
            .from('profile-images')
            .getPublicUrl(filePath)

          // Update the user's avatar path
          await supabase.rpc('update_user_avatar', {
            user_id: userId,
            new_avatar_path: filePath
          })
        }
      }

      setNotification('Check your email for the verification link')
      setShowVerification(true)
    } catch (error) {
      console.error('Signup error:', error)
      setNotification('An error occurred during signup')
    }

    setIsSending(false)
  }

  return (
    <div className="overflow-y-auto max-h-[calc(100vh-4rem)] px-1">
      {/* Logo */}
      <div className="flex flex-col items-center mb-12">
        <Image
          src="https://thepersuasionacademycdn.b-cdn.net/Images/TPA%20The%20Power%20Ark%20Logo%20New.png"
          alt="The Power Ark Logo"
          width={120}
          height={120}
          className="mb-4 drop-shadow-2xl filter brightness-0 invert"
        />
        <span className="text-white text-3xl font-light tracking-wide drop-shadow-lg">The Persuasion Academy</span>
        <span className="text-white/80 text-xl font-light mt-1">Create Your Profile</span>
      </div>

      {notification && (
        <div className="text-white bg-green-500/20 border border-green-500/30 p-4 rounded-lg mt-4 backdrop-blur-sm">
          {notification}
        </div>
      )}

      {!showVerification ? (
        <form onSubmit={handleSignup} className="space-y-6">
          <div className="space-y-4">
            {/* Profile Section */}
            <div className="flex items-center space-x-6 p-4 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10">
              {/* Avatar */}
              <div 
                className="relative w-24 h-24 rounded-full bg-white/10 flex items-center justify-center overflow-hidden cursor-pointer border border-white/20 hover:border-white/40 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                {previewUrl ? (
                  <Image
                    src={previewUrl}
                    alt="Profile Preview"
                    fill
                    className="object-cover"
                  />
                ) : (
                  <User className="w-12 h-12 text-white/50" />
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  ref={fileInputRef}
                  className="hidden"
                />
                <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors flex items-center justify-center">
                  <Camera className="w-8 h-8 text-white opacity-0 hover:opacity-100 transition-opacity" />
                </div>
              </div>
              
              {/* Name Fields */}
              <div className="flex-1 space-y-4">
                <input
                  type="text"
                  placeholder="First Name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  className="w-full bg-white/5 text-lg py-4 px-4 
                    border-b border-white/20 
                    text-white placeholder-white/50
                    focus:outline-none focus:border-white/40
                    transition-all duration-300"
                />
                <input
                  type="text"
                  placeholder="Last Name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  className="w-full bg-white/5 text-lg py-4 px-4 
                    border-b border-white/20 
                    text-white placeholder-white/50
                    focus:outline-none focus:border-white/40
                    transition-all duration-300"
                />
              </div>
            </div>

            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-white/5 text-lg py-4 px-4 
                border-b border-white/20 
                text-white placeholder-white/50
                focus:outline-none focus:border-white/40
                transition-all duration-300"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-white/5 text-lg py-4 px-4 
                border-b border-white/20 
                text-white placeholder-white/50
                focus:outline-none focus:border-white/40
                transition-all duration-300"
            />
          </div>
          <button
            type="submit"
            disabled={isSending || !firstName || !lastName || !email || !password}
            className="w-full px-6 py-3 text-xl font-medium bg-[#B22222]/80 text-white rounded-lg 
              backdrop-blur-sm hover:bg-[#B22222] 
              focus:outline-none focus:ring-2 focus:ring-[#B22222]/50
              transition-all duration-300 disabled:opacity-50"
          >
            {isSending ? 'Creating Account...' : 'Create Account'}
          </button>
          <button
            type="button"
            onClick={onBack}
            className="w-full text-white/70 hover:text-white text-sm font-medium transition-colors hover:underline decoration-white/30"
          >
            Back to Sign In
          </button>
        </form>
      ) : (
        <div className="space-y-6">
          <p className="text-center text-white/80">
            Please check your email to verify your account. Once verified, you can sign in.
          </p>
          <button
            onClick={onBack}
            className="w-full text-white/70 hover:text-white text-sm font-medium transition-colors hover:underline decoration-white/30"
          >
            Return to Sign In
          </button>
        </div>
      )}
    </div>
  )
} 
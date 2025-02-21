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
            last_name: lastName
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
      setNotification('An error occurred during signup')
      console.error('Signup error:', error)
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto p-6">
      <button
        onClick={onBack}
        className="mb-4 text-gray-600 hover:text-gray-800 transition-colors"
      >
        ← Back to Login
      </button>

      {notification && (
        <div className={`p-4 mb-4 rounded-lg ${showVerification ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {notification}
        </div>
      )}

      {!showVerification ? (
        <form onSubmit={handleSignup} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
              First Name
            </label>
            <input
              id="firstName"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
              Last Name
            </label>
            <input
              id="lastName"
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Profile Picture (Optional)
            </label>
            <div className="flex items-center space-x-4">
              <div className="relative w-20 h-20 border-2 border-gray-300 rounded-full overflow-hidden">
                {previewUrl ? (
                  <Image
                    src={previewUrl}
                    alt="Profile preview"
                    fill
                    style={{ objectFit: 'cover' }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-50">
                    <User className="w-8 h-8 text-gray-400" />
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                <Camera className="w-5 h-5 mr-2" />
                Upload
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSending}
            className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
              isSending ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isSending ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>
      ) : (
        <div className="text-center">
          <h3 className="text-xl font-semibold mb-2">Verification Email Sent</h3>
          <p className="text-gray-600">
            Please check your email to verify your account.
          </p>
        </div>
      )}
    </div>
  )
} 
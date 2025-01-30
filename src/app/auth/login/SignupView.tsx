import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import Image from 'next/image'
import { useState } from 'react'

interface SignupViewProps {
  onBack: () => void;
}

export default function SignupView({ onBack }: SignupViewProps) {
  const supabase = createClientComponentClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [notification, setNotification] = useState('')
  const [showVerification, setShowVerification] = useState(false)

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSending(true)
    setNotification('')

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${location.origin}/auth/callback`
      }
    })

    if (error) {
      setNotification(error.message)
    } else {
      setNotification('Check your email for the verification link')
      setShowVerification(true)
    }

    setIsSending(false)
  }

  return (
    <>
      {/* Logo */}
      <div className="flex flex-col items-center mb-12">
        <Image
          src="https://wltjkhsmqhospeezdgga.supabase.co/storage/v1/object/public/Public%20Images//The%20TPA%20Logo%20New%20Black.png"
          alt="Logo"
          width={100}
          height={100}
          className="mb-4"
        />
        <span className="text-gray-900 text-3xl font-light">The Persuasion Academy</span>
      </div>

      {notification && (
        <div className="p-4 rounded-md bg-green-50 text-green-700 text-sm mb-6">
          {notification}
        </div>
      )}

      {!showVerification ? (
        <form onSubmit={handleSignup} className="space-y-6">
          <div className="space-y-4">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-700 text-gray-900"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-700 text-gray-900"
            />
          </div>
          <button
            type="submit"
            disabled={isSending}
            className="w-full px-4 py-2.5 bg-[#B22222] text-white rounded-md hover:bg-[#8B0000] transition-colors disabled:opacity-50"
          >
            {isSending ? 'Creating Account...' : 'Create Account'}
          </button>
          <button
            type="button"
            onClick={onBack}
            className="w-full text-blue-600 hover:underline text-sm"
          >
            Back to Sign In
          </button>
        </form>
      ) : (
        <div className="space-y-6">
          <p className="text-center text-gray-600">
            Please check your email to verify your account. Once verified, you can sign in.
          </p>
          <button
            onClick={onBack}
            className="w-full text-blue-600 hover:underline text-sm"
          >
            Return to Sign In
          </button>
        </div>
      )}
    </>
  )
} 
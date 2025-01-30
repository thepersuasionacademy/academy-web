'use client'

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import ResetPasswordView from './ResetPasswordView'
import SignupView from './SignupView'
import './styles.css'
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/solid'

export default function LoginPage() {
  const supabase = createClientComponentClient()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [view, setView] = useState<'login' | 'reset' | 'signup'>('login')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Check for error parameter in URL
    const params = new URLSearchParams(window.location.search)
    const errorMsg = params.get('error')
    if (errorMsg) {
      setError(errorMsg)
      // Clean up the URL
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [])

  const handleGoogleSignIn = async () => {
    const redirectUrl = process.env.NODE_ENV === 'production'
      ? 'https://app.thepersuasionacademy.com/auth/callback'
      : `${window.location.origin}/auth/callback`

    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        }
      }
    })
  }

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    await supabase.auth.signInWithPassword({
      email,
      password
    })
  }

  const handleSignIn = async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    })
    // ... handle error and success states ...
  }

  const renderView = () => {
    switch (view) {
      case 'reset':
        return <ResetPasswordView onBack={() => setView('login')} />;
      case 'signup':
        return <SignupView onBack={() => setView('login')} />;
      default:
        return (
          <>
            {/* Show error message if exists */}
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-600 rounded-md">
                {error}
              </div>
            )}
            
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

            {/* Auth Form */}
            <div className="space-y-6">
              {/* Google Sign In */}
              <button
                onClick={handleGoogleSignIn}
                className="flex items-center justify-center w-full gap-2 px-4 py-2.5 border border-gray-200 rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                <Image
                  src="https://authjs.dev/img/providers/google.svg"
                  alt="Google"
                  width={20}
                  height={20}
                />
                Sign in with Google
              </button>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 text-gray-500 bg-white">or</span>
                </div>
              </div>

              <form onSubmit={handleEmailSignIn} className="space-y-4">
                <div className="space-y-4">
                  <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-700 text-gray-900"
                  />
                  <div className="space-y-1">
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-700 text-gray-900"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? (
                          <EyeSlashIcon className="h-5 w-5" />
                        ) : (
                          <EyeIcon className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                    <button 
                      onClick={() => setView('reset')}
                      type="button"
                      className="text-[#3B82F6] hover:underline text-sm font-semibold"
                    >
                      Forgot password?
                    </button>
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full px-4 py-2.5 bg-[#B22222] text-white rounded-md hover:bg-[#8B0000] transition-colors"
                >
                  Sign in
                </button>
              </form>

              <div className="text-sm pt-4">
                <button
                  onClick={() => setView('signup')}
                  type="button" 
                  className="text-gray-600 hover:underline text-sm"
                >
                  Don&apos;t have an account?{' '}
                  <span className="text-[#3B82F6] font-semibold">Sign up</span>
                </button>
              </div>
            </div>
          </>
        );
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center">
      {/* Background Image with blur */}
      <Image
        src="https://wltjkhsmqhospeezdgga.supabase.co/storage/v1/object/public/Public%20Images//thepowerark_black_background_magic_4k_wallpaper_background_burg_8b1627cb-2a30-4594-9766-7512a94c2a31%20(1)%20(1).jpeg"
        alt="Background"
        fill
        className="object-cover blur-[2px]"
        priority
        quality={100}
      />
      
      {/* Auth Container - increased border radius */}
      <div className="relative z-10 w-full max-w-md p-8 bg-white rounded-2xl shadow-lg">
        {renderView()}
      </div>
    </div>
  )
}
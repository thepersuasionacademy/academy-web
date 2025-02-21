'use client'

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import Image from 'next/image'
import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import ResetPasswordView from './ResetPasswordView'
import SignupView from './SignupView'
import './styles.css'
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/solid'
import HCaptcha from '@hcaptcha/react-hcaptcha'

export default function LoginPage() {
  // Add debugging before client creation
  console.log('Environment:', process.env.NODE_ENV)
  console.log('Supabase URL from env:', process.env.NEXT_PUBLIC_SUPABASE_URL)
  
  const supabase = createClientComponentClient()
  
  // Log the actual client config
  console.log('Supabase Client Config:', (supabase as any).supabaseUrl)
  
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Add this temporarily for debugging
  console.log('Current Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [view, setView] = useState<'login' | 'reset' | 'signup'>('login')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(searchParams.get('error') || null)
  const [isSending, setIsSending] = useState(false)
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const captchaRef = useRef<HCaptcha>(null)

  useEffect(() => {
    // Check for error parameter in URL
    const params = new URLSearchParams(window.location.search)
    const errorMsg = params.get('error')
    if (errorMsg) {
      console.log('Login error received:', errorMsg)
      setError(errorMsg)
      // Clean up the URL but preserve the error in state
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [])

  const handleGoogleSignIn = async () => {
    try {
      setError(null) // Clear any existing errors
      const redirectUrl = process.env.NODE_ENV === 'production'
        ? 'https://app.thepersuasionacademy.com/auth/callback'
        : `${window.location.origin}/auth/callback`

      // Get the redirectTo parameter
      const params = new URLSearchParams(window.location.search)
      const redirectTo = params.get('redirectTo')
      if (redirectTo) {
        // Store the redirectTo in localStorage to use after callback
        localStorage.setItem('redirectTo', redirectTo)
      }

      console.log('Redirect URL:', redirectUrl)
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      })

      if (error) {
        console.error('Sign in error:', error)
        setError(error.message)
      }
    } catch (err) {
      console.error('Sign in error:', err)
      setError(err instanceof Error ? err.message : 'Failed to initiate sign in')
    }
  }

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSending(true)
    setError(null)

    if (!captchaToken) {
      setError('Please complete the captcha verification')
      setIsSending(false)
      return
    }

    try {
      // First verify the captcha
      const verifyResponse = await fetch('/api/verify-captcha', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: captchaToken })
      })

      const verifyData = await verifyResponse.json()
      
      if (!verifyResponse.ok || !verifyData.success) {
        setError('Captcha verification failed. Please try again.')
        setIsSending(false)
        captchaRef.current?.resetCaptcha()
        return
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        console.error('Sign in error:', error)
        setError(error.message)
        captchaRef.current?.resetCaptcha()
        return
      }

      if (data?.user) {
        console.log('Sign in successful, redirecting...')
        // Get the redirectTo parameter or default to /content
        const params = new URLSearchParams(window.location.search)
        const redirectTo = params.get('redirectTo') || '/content'
        router.push(redirectTo as any)
      }
    } catch (err) {
      console.error('Sign in error:', err)
      setError(err instanceof Error ? err.message : 'An error occurred during sign in')
      captchaRef.current?.resetCaptcha()
    } finally {
      setIsSending(false)
    }
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
              <div className="text-white bg-red-500/20 border border-red-500/30 p-4 rounded-lg mt-4 backdrop-blur-sm">
                <strong>Authentication Error:</strong> {error}
              </div>
            )}
            
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
              <span className="text-white/80 text-xl font-light mt-1">Sign In or Sign Up</span>
            </div>

            {/* Auth Form */}
            <div className="space-y-6">
              <form onSubmit={handleEmailSignIn} className="space-y-6">
                <div className="space-y-4">
                  <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white/5 text-lg py-4 px-4 
                      border-b border-white/20 
                      text-white placeholder-white/50
                      focus:outline-none focus:border-white/40
                      transition-all duration-300"
                  />
                  <div className="space-y-1">
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-white/5 text-lg py-4 px-4 
                          border-b border-white/20 
                          text-white placeholder-white/50
                          focus:outline-none focus:border-white/40
                          transition-all duration-300"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors"
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
                      className="text-white/70 hover:text-white text-sm font-medium transition-colors mt-2 hover:underline decoration-white/30"
                    >
                      Forgot password?
                    </button>
                  </div>
                </div>

                <div className="flex justify-center my-4">
                  <HCaptcha
                    ref={captchaRef}
                    sitekey={process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY || ''}
                    onVerify={(token) => setCaptchaToken(token)}
                    onExpire={() => setCaptchaToken(null)}
                  />
                </div>

                <div className="space-y-4">
                  <button
                    type="submit"
                    disabled={isSending}
                    className="w-full px-6 py-3 text-xl font-medium bg-white/10 text-white rounded-lg 
                      border border-white/20 hover:bg-white/20 
                      focus:outline-none focus:ring-2 focus:ring-white/20
                      transition-all duration-300 backdrop-blur-sm disabled:opacity-50"
                  >
                    {isSending ? 'Signing in...' : 'Sign In'}
                  </button>

                  {/* Divider */}
                  <div className="relative py-2">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-white/20"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-4 text-white/50 bg-transparent backdrop-blur-sm">or</span>
                    </div>
                  </div>

                  {/* Google Sign In */}
                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    className="flex items-center justify-center w-full gap-3 px-6 py-3 text-lg 
                      bg-white/5 text-white rounded-lg border border-white/20 
                      hover:bg-white/10 backdrop-blur-sm
                      focus:outline-none focus:ring-2 focus:ring-white/20
                      transition-all duration-300"
                  >
                    <Image
                      src="https://authjs.dev/img/providers/google.svg"
                      alt="Google"
                      width={20}
                      height={20}
                      className="filter brightness-0 invert"
                    />
                    Sign in with Google
                  </button>

                  <div className="pt-6 text-center text-white/70 text-sm">
                    Don&apos;t Have An Account?
                  </div>
                  <button
                    type="button"
                    onClick={() => setView('signup')}
                    className="w-full px-6 py-3 text-xl font-medium bg-[#B22222]/80 text-white rounded-lg 
                      backdrop-blur-sm hover:bg-[#B22222] 
                      focus:outline-none focus:ring-2 focus:ring-[#B22222]/50
                      transition-all duration-300"
                  >
                    Sign Up
                  </button>
                </div>
              </form>
            </div>
          </>
        );
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 animate-[flow_24s_ease-in-out_infinite] scale-[1.02]">
          <img 
            src="https://thepersuasionacademycdn.b-cdn.net/Images/thepowerark_black_background_magic_4k_wallpaper_background_burg_8b1627cb-2a30-4594-9766-7512a94c2a31%20(1).jpeg"
            alt="Background"
            className="w-full h-full object-cover animate-[wave_30s_ease-in-out_infinite] scale-[1.15] will-change-transform"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-radial from-transparent via-black/10 to-transparent animate-pulse" />
      </div>
      
      {/* Auth Container - pure glass effect */}
      <div className="relative z-10 w-full max-w-md p-8 bg-black/20 backdrop-blur-xl rounded-2xl border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] transition-all duration-300 my-8">
        {renderView()}
      </div>

      {/* Update the global styles */}
      <style jsx global>{`
        @tailwind base;
        @tailwind components;
        @tailwind utilities;

        @layer utilities {
          .bg-gradient-radial {
            background-image: radial-gradient(circle at center, var(--tw-gradient-from) 0%, var(--tw-gradient-via) 50%, var(--tw-gradient-to) 100%);
          }
        }

        body {
          overflow: hidden;
          height: 100vh;
          position: fixed;
          width: 100%;
        }

        .relative .flex .justify-center .text-sm span {
          background: transparent;
          backdrop-filter: blur-xl;
          padding: 0 12px;
        }

        /* Enhance scrollbar for glass theme */
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }

        ::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
        }

        ::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.3);
          border-radius: 4px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.4);
        }

        /* Selection style */
        ::selection {
          background: rgba(255, 255, 255, 0.2);
          color: white;
        }
      `}</style>

      <style jsx>{`
        @keyframes wave {
          0% { 
            transform: scale(1.15) perspective(500px) rotateX(0deg) rotateY(0deg) translateZ(0px);
            filter: brightness(1);
          }
          25% { 
            transform: scale(1.16) perspective(500px) rotateX(1deg) rotateY(-1deg) translateZ(10px);
            filter: brightness(1.1);
          }
          50% { 
            transform: scale(1.15) perspective(500px) rotateX(-1deg) rotateY(1deg) translateZ(20px);
            filter: brightness(1.05);
          }
          75% { 
            transform: scale(1.17) perspective(500px) rotateX(1deg) rotateY(-0.5deg) translateZ(10px);
            filter: brightness(1.1);
          }
          100% { 
            transform: scale(1.15) perspective(500px) rotateX(0deg) rotateY(0deg) translateZ(0px);
            filter: brightness(1);
          }
        }
        @keyframes flow {
          0% { 
            transform: scale(1.02) translate3d(0px, 0px, 0px);
            filter: contrast(1);
          }
          25% { 
            transform: scale(1.04) translate3d(-5px, -5px, 10px);
            filter: contrast(1.1);
          }
          50% { 
            transform: scale(1.03) translate3d(5px, 5px, -10px);
            filter: contrast(1.05);
          }
          75% { 
            transform: scale(1.04) translate3d(-3px, 3px, 5px);
            filter: contrast(1.1);
          }
          100% { 
            transform: scale(1.02) translate3d(0px, 0px, 0px);
            filter: contrast(1);
          }
        }
      `}</style>
    </div>
  )
}
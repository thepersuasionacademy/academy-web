import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import Image from 'next/image'
import { useState, useRef, useEffect } from 'react'
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/solid'
import { useRouter } from 'next/navigation'

interface ResetPasswordViewProps {
  onBack: () => void;
}

export default function ResetPasswordView({ onBack }: ResetPasswordViewProps) {
  const supabase = createClientComponentClient()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', ''])
  const [newPassword, setNewPassword] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [notification, setNotification] = useState('')
  const [showOtpInput, setShowOtpInput] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const digitRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    // Initialize refs array
    digitRefs.current = digitRefs.current.slice(0, 6)
  }, [])

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSending(true)
    setNotification('')

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email)

      if (error) {
        setNotification(error.message)
      } else {
        setNotification('Check your email for the verification code')
        setShowOtpInput(true)
      }
    } catch (error) {
      setNotification('An error occurred while sending reset instructions')
    } finally {
      setIsSending(false)
    }
  }

  const handleDigitChange = (index: number, value: string) => {
    if (value.length > 1) {
      // Handle paste event
      const digits = value.slice(0, 6).split('')
      const newOtpDigits = [...otpDigits]
      digits.forEach((digit, i) => {
        if (index + i < 6) {
          newOtpDigits[index + i] = digit
        }
      })
      setOtpDigits(newOtpDigits)
      // Focus the next empty input or the last input
      const nextEmptyIndex = newOtpDigits.findIndex((digit) => !digit)
      if (nextEmptyIndex !== -1 && nextEmptyIndex < 6) {
        digitRefs.current[nextEmptyIndex]?.focus()
      } else {
        digitRefs.current[5]?.focus()
      }
    } else {
      // Handle single digit input
      const newOtpDigits = [...otpDigits]
      newOtpDigits[index] = value
      setOtpDigits(newOtpDigits)
      if (value && index < 5) {
        digitRefs.current[index + 1]?.focus()
      }
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      digitRefs.current[index - 1]?.focus()
    }
  }

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSending(true)
    setNotification('')

    const otp = otpDigits.join('')
    if (otp.length !== 6) {
      setNotification('Please enter all 6 digits of the verification code')
      setIsSending(false)
      return
    }

    try {
      // First verify the OTP and update password in one step
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'recovery',
      })

      if (error) {
        setNotification(error.message)
        return
      }

      // After OTP is verified, update the password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (updateError) {
        setNotification(updateError.message)
        return
      }

      // Sign in the user automatically
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: newPassword
      })

      if (signInError) {
        setNotification('Password updated but auto sign-in failed. Please sign in manually.')
        setTimeout(() => {
          onBack()
        }, 2000)
        return
      }

      setNotification('Password updated successfully! Redirecting...')
      setTimeout(() => {
        router.push('/content')
      }, 2000)
    } catch (err) {
      setNotification('An error occurred during password reset')
      console.error('Password reset error:', err)
    } finally {
      setIsSending(false)
    }
  }

  return (
    <>
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
        <span className="text-white/80 text-xl font-light mt-1">Reset Your Password</span>
      </div>

      {notification && (
        <div className="text-white bg-green-500/20 border border-green-500/30 p-4 rounded-lg my-8 backdrop-blur-sm">
          {notification}
        </div>
      )}

      <div className="mt-8">
        {!showOtpInput ?
          // Email Input Form
          <form onSubmit={handleSendOTP} className="space-y-6">
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

            <button
              type="submit"
              disabled={isSending}
              className="w-full px-6 py-3 text-xl font-medium bg-white/10 text-white rounded-lg 
                border border-white/20 hover:bg-white/20 
                focus:outline-none focus:ring-2 focus:ring-white/20
                transition-all duration-300 backdrop-blur-sm disabled:opacity-50"
            >
              {isSending ? 'Sending...' : 'Send Reset Instructions'}
            </button>
            <button
              type="button"
              onClick={onBack}
              className="w-full text-white/70 hover:text-white text-sm font-medium transition-colors hover:underline decoration-white/30"
            >
              Back to Sign In
            </button>
          </form>
        :
          // OTP and New Password Form
          <form onSubmit={handleVerifyOTP} className="space-y-6">
            <div className="space-y-4">
              <div className="flex gap-2 justify-between">
                {otpDigits.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => {
                      if (el) {
                        digitRefs.current[index] = el
                      }
                    }}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    value={digit}
                    onChange={(e) => handleDigitChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className="w-12 h-20 text-center bg-white/5 text-lg
                      border-b border-white/20 
                      text-white placeholder-white/50
                      focus:outline-none focus:border-white/40
                      transition-all duration-300 rounded-lg"
                  />
                ))}
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="New password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
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
            </div>
            <button
              type="submit"
              disabled={isSending}
              className="w-full px-6 py-3 text-xl font-medium bg-[#B22222]/80 text-white rounded-lg 
                backdrop-blur-sm hover:bg-[#B22222] 
                focus:outline-none focus:ring-2 focus:ring-[#B22222]/50
                transition-all duration-300 disabled:opacity-50"
            >
              {isSending ? 'Updating...' : 'Update Password'}
            </button>
            <button
              type="button"
              onClick={() => setShowOtpInput(false)}
              className="w-full text-white/70 hover:text-white text-sm font-medium transition-colors hover:underline decoration-white/30"
            >
              Try Different Email
            </button>
          </form>
        }
      </div>
    </>
  )
} 
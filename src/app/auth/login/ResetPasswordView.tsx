import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import Image from 'next/image'
import { useState } from 'react'
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/solid'

interface ResetPasswordViewProps {
  onBack: () => void;
}

export default function ResetPasswordView({ onBack }: ResetPasswordViewProps) {
  const supabase = createClientComponentClient()
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [notification, setNotification] = useState('')
  const [showOtpInput, setShowOtpInput] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSending(true)
    setNotification('')

    const { error } = await supabase.auth.resetPasswordForEmail(email)

    if (error) {
      setNotification(error.message)
    } else {
      setNotification('Check your email for the verification code')
      setShowOtpInput(true)
    }

    setIsSending(false)
  }

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSending(true)
    setNotification('')

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

      setNotification('Password updated successfully!')
      setTimeout(() => {
        onBack()
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
        <div className="text-white bg-green-500/20 border border-green-500/30 p-4 rounded-lg mt-4 backdrop-blur-sm">
          {notification}
        </div>
      )}

      {!showOtpInput ? (
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
      ) : (
        // OTP and New Password Form
        <form onSubmit={handleVerifyOTP} className="space-y-6">
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Enter verification code"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="w-full bg-white/5 text-lg py-4 px-4 
                border-b border-white/20 
                text-white placeholder-white/50
                focus:outline-none focus:border-white/40
                transition-all duration-300"
            />
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
      )}
    </>
  )
} 
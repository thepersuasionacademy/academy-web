import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import Image from 'next/image'
import { useState } from 'react'

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

      {!showOtpInput ? (
        // Email Input Form
        <form onSubmit={handleSendOTP} className="space-y-6">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-700 text-gray-900"
          />
          <button
            type="submit"
            disabled={isSending}
            className="w-full px-4 py-2.5 bg-[#B22222] text-white rounded-md hover:bg-[#8B0000] transition-colors disabled:opacity-50"
          >
            {isSending ? 'Sending...' : 'Send Reset Instructions'}
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
        // OTP and New Password Form
        <form onSubmit={handleVerifyOTP} className="space-y-6">
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Enter verification code"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-700 text-gray-900"
            />
            <input
              type="password"
              placeholder="New password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-700 text-gray-900"
            />
          </div>
          <button
            type="submit"
            disabled={isSending}
            className="w-full px-4 py-2.5 bg-[#B22222] text-white rounded-md hover:bg-[#8B0000] transition-colors disabled:opacity-50"
          >
            {isSending ? 'Updating...' : 'Update Password'}
          </button>
          <button
            type="button"
            onClick={() => setShowOtpInput(false)}
            className="w-full text-blue-600 hover:underline text-sm"
          >
            Try Different Email
          </button>
        </form>
      )}
    </>
  )
} 
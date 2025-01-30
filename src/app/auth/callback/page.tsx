import { headers } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default function AuthCallbackPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h2 className="text-lg font-semibold mb-2">Completing sign in...</h2>
        <p className="text-sm text-gray-500">Please wait while we verify your credentials.</p>
      </div>
    </div>
  )
}
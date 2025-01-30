import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createServerComponentClient({
    cookies,
    options: {
      auth: {
        flowType: 'pkce',
        cookieOptions: {
          domain: '.thepersuasionacademy.com',
          sameSite: 'lax',
          secure: true
        }
      }
    }
  })
  
  // Add error handling for server-side auth
  try {
    const { data: { session } } = await supabase.auth.getSession()
    console.log('Server-side session:', session ? 'exists' : 'missing')
  } catch (error) {
    console.error('Server-side auth error:', error)
  }

  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
} 
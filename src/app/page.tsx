'use client'

import { useEffect } from 'react'
import AuthTest from '@/components/AuthTest'
import { supabase } from '@/lib/supabase'

export default function Home() {
  useEffect(() => {
    const debugAuth = async () => {
      // Log current config
      console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
      console.log('Site URL:', process.env.NEXT_PUBLIC_SITE_URL)
      
      // Test auth
      const { data, error } = await supabase.auth.getSession()
      console.log('Auth Test:', { data, error })
      
      // Log all cookies
      console.log('All Cookies:', document.cookie.split(';').map(c => c.trim()))
    }
    
    debugAuth()
  }, [])

  return (
    <div>
      <h1>Auth Debug Page</h1>
      <AuthTest />
    </div>
  )
} 
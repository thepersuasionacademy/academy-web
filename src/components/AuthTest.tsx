'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function AuthTest() {
  const [debugInfo, setDebugInfo] = useState<any>({})
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Test 1: Basic Connection
        console.log('Testing Supabase connection...')
        const { data: pingData, error: pingError } = await supabase
          .from('dummy')
          .select('*')
          .limit(1)
        
        // Test 2: Auth Status
        console.log('Checking auth status...')
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        // Test 3: Cookie Check
        const cookies = document.cookie
          .split(';')
          .reduce((acc: any, cookie) => {
            const [key, value] = cookie.split('=')
            acc[key.trim()] = value
            return acc
          }, {})

        setDebugInfo({
          supabaseUrl: supabase.supabaseUrl,
          pingResult: pingError ? 'Failed' : 'Success',
          pingError,
          session,
          sessionError,
          cookies,
          timestamp: new Date().toISOString()
        })

        if (pingError) setError(`Connection Error: ${pingError.message}`)
        if (sessionError) setError(`Auth Error: ${sessionError.message}`)

      } catch (err) {
        console.error('Debug Error:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
      }
    }

    checkAuth()
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth State Change:', event, session)
      checkAuth()
    })

    return () => subscription.unsubscribe()
  }, [])

  return (
    <div style={{ padding: '20px' }}>
      <h2>Supabase Debug Info</h2>
      
      {error && (
        <div style={{ 
          color: 'red', 
          padding: '10px', 
          border: '1px solid red',
          marginBottom: '20px'
        }}>
          Error: {error}
        </div>
      )}

      <div style={{ 
        backgroundColor: '#f5f5f5', 
        padding: '15px',
        borderRadius: '5px'
      }}>
        <pre style={{ whiteSpace: 'pre-wrap' }}>
          {JSON.stringify(debugInfo, null, 2)}
        </pre>
      </div>

      <div style={{ marginTop: '20px' }}>
        <button onClick={() => supabase.auth.signOut()}>
          Sign Out (Test)
        </button>
      </div>
    </div>
  )
} 
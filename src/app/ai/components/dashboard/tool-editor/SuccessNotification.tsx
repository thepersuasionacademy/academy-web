'use client'

import { useTheme } from '@/app/context/ThemeContext'
import { SuccessState } from '../types'

type SuccessNotificationProps = {
  success: SuccessState
}

export function SuccessNotification({ success }: SuccessNotificationProps) {
  const { theme } = useTheme()
  
  return (
    <div className={`fixed bottom-4 right-4 rounded-lg p-4 border shadow-lg ${
      theme === 'dark' 
        ? 'bg-green-900/50 border-green-800/50 text-green-200' 
        : 'bg-green-100 border-green-200 text-green-800'
    }`}>
      <h3 className="font-semibold mb-2">Tool Successfully Created!</h3>
      <ul className="list-disc list-inside space-y-1">
        <li>Name: {success.name}</li>
        <li>Category: {success.category}</li>
        <li>Suite: {success.suite}</li>
      </ul>
    </div>
  )
}
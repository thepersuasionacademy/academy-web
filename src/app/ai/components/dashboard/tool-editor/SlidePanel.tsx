'use client'

import { X } from 'lucide-react'
import { useEffect, type ReactNode } from 'react'
import { useTheme } from '@/app/context/ThemeContext'

interface SlidePanelProps {
  isOpen: boolean
  onClose: () => void
  title: string
  description: string
  children: ReactNode
}

export function SlidePanel({
  isOpen,
  onClose,
  title,
  description,
  children
}: SlidePanelProps) {
  const { theme } = useTheme()

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [onClose])

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-[var(--background)]/50 backdrop-blur-sm transition-opacity z-40"
          onClick={onClose}
        />
      )}

      {/* Sliding Panel */}
      <div 
        className={`fixed right-0 top-0 h-full w-full max-w-2xl bg-[var(--card-bg)] shadow-xl transition-transform duration-300 ease-in-out transform z-50 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="h-full overflow-y-auto p-6">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold text-[var(--foreground)]">{title}</h1>
              <p className="text-lg text-[var(--text-secondary)]">{description}</p>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-[var(--hover-bg)] rounded-full transition-colors duration-200"
            >
              <X className="h-6 w-6 text-[var(--text-secondary)] hover:text-[var(--foreground)]" />
            </button>
          </div>
          {children}
        </div>
      </div>
    </>
  )
}
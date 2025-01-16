//src/app/ai/components/dashboard/SlidePanel.tsx
import { X } from 'lucide-react'
import { useEffect, type ReactNode } from 'react'

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
  // Handle escape key
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
          className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity z-40"
          onClick={onClose}
        />
      )}

      {/* Sliding Panel */}
      <div 
        className={`fixed right-0 top-0 h-full w-full max-w-2xl bg-gray-900 shadow-xl transition-transform duration-300 ease-in-out transform z-50 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="h-full overflow-y-auto p-6">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold text-white">{title}</h1>
              <p className="text-lg text-gray-400">{description}</p>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-gray-800/50 rounded-full transition-colors duration-200"
            >
              <X className="h-6 w-6 text-gray-400 hover:text-white" />
            </button>
          </div>
          {children}
        </div>
      </div>
    </>
  )
}

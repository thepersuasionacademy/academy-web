import { useEffect } from 'react';
import { AlertCircle, CheckCircle, X } from 'lucide-react';

interface ToastProps {
  message: string;
  type: 'error' | 'success';
  onClose: () => void;
  position?: 'bottom-right' | 'profile-image';
}

export function Toast({ message, type, onClose, position = 'bottom-right' }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000); // Auto dismiss after 5 seconds

    return () => clearTimeout(timer);
  }, [onClose]);

  const positionClasses = {
    'bottom-right': 'fixed bottom-4 right-4',
    'profile-image': 'absolute -bottom-16 left-1/2 -translate-x-1/2 whitespace-nowrap'
  };

  return (
    <div
      className={`${positionClasses[position]} flex items-center gap-2 rounded-lg px-4 py-2 text-white shadow-lg transition-all duration-300 z-50 ${
        type === 'error' ? 'bg-red-600' : 'bg-green-600'
      }`}
    >
      {type === 'error' ? (
        <AlertCircle className="h-5 w-5" />
      ) : (
        <CheckCircle className="h-5 w-5" />
      )}
      <span className="text-sm font-medium">{message}</span>
      <button
        onClick={onClose}
        className="ml-2 rounded-full p-1 hover:bg-white/20"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
} 
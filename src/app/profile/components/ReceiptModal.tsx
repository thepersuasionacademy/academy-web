import { X } from 'lucide-react';
import { useEffect } from 'react';

interface ReceiptModalProps {
  receiptUrl: string;
  onClose: () => void;
}

export function ReceiptModal({ receiptUrl, onClose }: ReceiptModalProps) {
  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  // Prevent scrolling when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-4xl h-[80vh] mx-4 bg-[var(--card-bg)] rounded-lg shadow-xl">
        {/* Header */}
        <div className="absolute top-4 right-4 z-10">
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-[var(--hover-bg)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Receipt iframe */}
        <iframe
          src={receiptUrl}
          className="w-full h-full rounded-lg"
          title="Receipt"
        />
      </div>
    </div>
  );
} 
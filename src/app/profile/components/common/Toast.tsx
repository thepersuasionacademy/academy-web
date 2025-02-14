'use client';

import React, { useEffect } from 'react';
import { cn } from "@/lib/utils";
import { X } from 'lucide-react';

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
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const positionClasses = {
    'bottom-right': 'fixed bottom-4 right-4',
    'profile-image': 'absolute -bottom-16 left-1/2 -translate-x-1/2 whitespace-nowrap'
  };

  return (
    <div
      className={cn(
        "z-50 flex items-center gap-2 px-4 py-2 rounded-lg shadow-lg",
        type === 'error' ? "bg-red-500 text-white" : "bg-green-500 text-white",
        positionClasses[position]
      )}
    >
      <span>{message}</span>
      <button
        onClick={onClose}
        className="p-1 hover:bg-black/10 rounded-full transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
} 
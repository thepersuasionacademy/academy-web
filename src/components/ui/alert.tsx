import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface AlertProps {
  children: ReactNode;
  variant?: 'default' | 'destructive';
  className?: string;
}

export function Alert({ children, variant = 'default', className }: AlertProps) {
  return (
    <div className={cn(
      'flex items-center gap-2 p-4 rounded-lg',
      variant === 'destructive' ? 'bg-red-100 text-red-900' : 'bg-gray-100 text-gray-900',
      className
    )}>
      {children}
    </div>
  );
}

export function AlertDescription({ children }: { children: ReactNode }) {
  return <div className="text-sm">{children}</div>;
} 
import { Clock } from 'lucide-react';
import { cn } from "@/lib/utils";

interface AccessDelayStatusProps {
  accessStartsAt: string; // ISO timestamp from access_starts_at
  accessDelay: {
    value: number;
    unit: 'days' | 'weeks' | 'months';
  };
  className?: string;
}

const calculateRemainingTime = (accessStartsAt: string, delay: { value: number; unit: 'days' | 'weeks' | 'months' }) => {
  const startDate = new Date(accessStartsAt);
  const targetDate = new Date(startDate);
  
  switch (delay.unit) {
    case 'days':
      targetDate.setDate(targetDate.getDate() + delay.value);
      break;
    case 'weeks':
      targetDate.setDate(targetDate.getDate() + (delay.value * 7));
      break;
    case 'months':
      targetDate.setMonth(targetDate.getMonth() + delay.value);
      break;
  }
  
  const now = new Date();
  const diffTime = targetDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays <= 0) return null;
  
  if (diffDays > 30) {
    const months = Math.floor(diffDays / 30);
    return `${months} month${months > 1 ? 's' : ''}`;
  } else if (diffDays > 7) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks} week${weeks > 1 ? 's' : ''}`;
  }
  return `${diffDays} day${diffDays > 1 ? 's' : ''}`;
};

export const AccessDelayStatus: React.FC<AccessDelayStatusProps> = ({
  accessStartsAt,
  accessDelay,
  className
}) => {
  const remainingTime = calculateRemainingTime(accessStartsAt, accessDelay);
  if (!remainingTime) return null;

  return (
    <div className={cn("flex items-center gap-1.5 dark:text-[var(--muted-foreground)]/60 text-[var(--muted-foreground)]/70", className)}>
      <Clock className="w-4 h-4" />
      <span className="text-sm font-medium">{remainingTime}</span>
    </div>
  );
};

export default AccessDelayStatus; 
import { cn } from "@/lib/utils";
import { AccessDelayStatus } from "./AccessDelayStatus";

interface AccessStatusProps {
  item: {
    hasAccess: boolean;
    accessStartsAt?: string; // From the parent access_starts_at
    accessDelay?: {
      value: number;
      unit: 'days' | 'weeks' | 'months';
    };
  };
  showMessage?: boolean;
  className?: string;
}

export const getAccessStatusColor = (item: { hasAccess: boolean; accessDelay?: { value: number; unit: string } }) => {
  // If they have a delay, they don't have access yet - show no color
  if (item.accessDelay) return 'bg-transparent';
  
  // If they have access (and no delay), show accent color
  if (item.hasAccess) return 'bg-[var(--accent)]';
  
  // Otherwise (no access, no delay), it's hidden
  return 'hidden';
};

export const getAccessMessage = (item: { hasAccess: boolean; accessDelay?: { value: number; unit: string; daysRemaining?: number } }) => {
  // If they have a delay, show the message regardless of hasAccess value
  if (item.accessDelay?.daysRemaining) {
    return `Access in ${item.accessDelay.daysRemaining} days`;
  }
  return null;
};

export const hasEffectiveAccess = (item: { hasAccess: boolean; accessDelay?: { value: number; unit: string } }) => {
  // If there's a delay, they don't have access yet, regardless of hasAccess value
  if (item.accessDelay) return false;
  return item.hasAccess;
};

export const AccessStatus: React.FC<AccessStatusProps> = ({ item, showMessage = true, className }) => {
  const statusColor = getAccessStatusColor(item);

  return (
    <div className="flex items-center gap-2">
      <div className={cn("absolute inset-y-0 left-0 w-1", statusColor, className)} />
      {showMessage && item.accessDelay && item.accessStartsAt && (
        <AccessDelayStatus
          accessStartsAt={item.accessStartsAt}
          accessDelay={item.accessDelay}
        />
      )}
    </div>
  );
};

export default AccessStatus; 
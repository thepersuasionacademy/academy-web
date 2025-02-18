import { Youtube, Type, Bot, FileText, HelpCircle } from 'lucide-react';
import { cn } from "@/lib/utils";

interface NodeTypeIconProps {
  mediaType?: string;
  hasNoAccess?: boolean;
}

export function NodeTypeIcon({ mediaType, hasNoAccess }: NodeTypeIconProps) {
  const iconClasses = cn(
    "w-5 h-5",
    hasNoAccess 
      ? "dark:text-[var(--muted-foreground)]/70 text-[var(--muted-foreground)]"
      : "text-[var(--muted-foreground)]"
  );

  switch (mediaType) {
    case 'video':
      return <Youtube className={iconClasses} />;
    case 'text':
      return <Type className={iconClasses} />;
    case 'tool':
      return <Bot className={iconClasses} />;
    case 'pdf':
      return <FileText className={iconClasses} />;
    case 'quiz':
      return <HelpCircle className={iconClasses} />;
    default:
      return null;
  }
} 
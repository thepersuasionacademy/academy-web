import { Eye, Zap, Clock } from 'lucide-react';
import { cn } from "@/lib/utils";
import { AccessMethod } from './types';

interface HeaderProps {
  isEditMode: boolean;
  accessMethod: AccessMethod;
  onEditModeToggle: () => void;
  onAccessMethodChange: (method: AccessMethod) => void;
  onSave: () => void;
  onPreview?: () => void;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  hasExistingAccess: boolean;
  isNewAccess?: boolean;
}

export function Header({
  isEditMode,
  accessMethod,
  onEditModeToggle,
  onAccessMethodChange,
  onSave,
  onPreview,
  isAdmin,
  isSuperAdmin,
  hasExistingAccess,
  isNewAccess = false
}: HeaderProps) {
  return (
    <div className="flex items-center justify-between mb-8">
      <div className="flex items-center gap-2 bg-[var(--muted)]/50 p-1.5 rounded-lg">
        {!isNewAccess && onPreview && (
          <button
            onClick={onPreview}
            title="Preview"
            className={cn(
              "p-2.5 rounded-md transition-all",
              "hover:bg-[var(--muted)] text-[var(--muted-foreground)]"
            )}
          >
            <Eye className="w-5 h-5" />
          </button>
        )}
        <button
          onClick={() => onAccessMethodChange('instant')}
          title="Instant Access"
          className={cn(
            "p-2.5 rounded-md transition-all",
            accessMethod === 'instant'
              ? "bg-[var(--accent)] text-white shadow-sm"
              : "hover:bg-[var(--muted)] text-[var(--muted-foreground)]"
          )}
          disabled={!isEditMode}
        >
          <Zap className="w-5 h-5" />
        </button>
        <button
          onClick={() => onAccessMethodChange('drip')}
          title="Drip Feed"
          className={cn(
            "p-2.5 rounded-md transition-all",
            accessMethod === 'drip'
              ? "bg-[var(--accent)] text-white shadow-sm"
              : "hover:bg-[var(--muted)] text-[var(--muted-foreground)]"
          )}
          disabled={!isEditMode}
        >
          <Clock className="w-5 h-5" />
        </button>
      </div>
      <button
        onClick={onSave}
        className={cn(
          "px-4 py-2 text-sm font-medium rounded-lg transition-colors",
          "bg-[var(--accent)] text-white hover:opacity-90"
        )}
      >
        Save
      </button>
    </div>
  );
} 
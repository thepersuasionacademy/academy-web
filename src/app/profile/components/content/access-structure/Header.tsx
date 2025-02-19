import { Zap, Clock, ChevronRight } from 'lucide-react';
import { cn } from "@/lib/utils";
import { AccessMethod } from './types';

interface HeaderProps {
  isEditMode: boolean;
  accessMethod: AccessMethod;
  onEditModeToggle: () => void;
  onAccessMethodChange: (method: AccessMethod) => void;
  onSave: () => void;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  hasExistingAccess: boolean;
}

export function Header({
  isEditMode,
  accessMethod,
  onEditModeToggle,
  onAccessMethodChange,
  onSave,
  isAdmin,
  isSuperAdmin,
  hasExistingAccess
}: HeaderProps) {
  return (
    <div className="flex items-center justify-between mb-8">
      <h3 className="text-3xl font-medium text-[var(--foreground)]">Access Overview</h3>
      <div className="flex items-center gap-4">
        {/* Edit Mode Toggle (only for admins and super admins) */}
        {(isAdmin || isSuperAdmin) && !hasExistingAccess && (
          <button
            onClick={onEditModeToggle}
            className={cn(
              "p-2.5 rounded-lg transition-colors",
              isEditMode
                ? "bg-[var(--muted)] text-[var(--foreground)]"
                : "bg-[var(--accent)] text-white"
            )}
          >
            {isEditMode ? (
              <ChevronRight className="w-5 h-5" />
            ) : (
              "Edit Mode"
            )}
          </button>
        )}

        {/* Access Method Selection (only visible in edit mode) */}
        {isEditMode && (
          <div className="flex gap-2 bg-[var(--muted)]/50 p-1.5 rounded-lg">
            <button
              onClick={() => onAccessMethodChange('instant')}
              title="Instant Access"
              className={cn(
                "p-2.5 rounded-md transition-all",
                accessMethod === 'instant'
                  ? "bg-[var(--accent)] text-white shadow-sm"
                  : "hover:bg-[var(--muted)] text-[var(--muted-foreground)]"
              )}
            >
              <Zap className="w-6 h-6" />
            </button>
            <button
              onClick={() => onAccessMethodChange('drip')}
              title="Drip Access"
              className={cn(
                "p-2.5 rounded-md transition-all",
                accessMethod === 'drip'
                  ? "bg-[var(--accent)] text-white shadow-sm"
                  : "hover:bg-[var(--muted)] text-[var(--muted-foreground)]"
              )}
            >
              <Clock className="w-6 h-6" />
            </button>
          </div>
        )}

        {/* Save Button (only visible in edit mode) */}
        {isEditMode && (
          <button
            onClick={onSave}
            className={cn(
              "px-8 py-2.5 rounded-lg text-lg font-medium",
              "bg-[var(--accent)] text-white",
              "hover:opacity-90 transition-opacity",
              "shadow-sm"
            )}
          >
            Save
          </button>
        )}
      </div>
    </div>
  );
} 
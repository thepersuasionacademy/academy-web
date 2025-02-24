import { useState } from 'react';
import { cn } from "@/lib/utils";
import { X } from 'lucide-react';

interface SaveTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string) => void;
}

export function SaveTemplateModal({
  isOpen,
  onClose,
  onSave
}: SaveTemplateModalProps) {
  const [templateName, setTemplateName] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-[var(--background)] rounded-lg p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Save as Template</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[var(--muted)]/50 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label htmlFor="templateName" className="block text-sm font-medium mb-2">
              Template Name
            </label>
            <input
              id="templateName"
              type="text"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              className={cn(
                "w-full px-3 py-2 rounded-lg border border-[var(--border-color)]",
                "bg-[var(--background)] text-[var(--foreground)]",
                "focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50"
              )}
              placeholder="Enter template name"
              autoFocus
            />
          </div>
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className={cn(
                "px-4 py-2 text-sm font-medium rounded-lg transition-colors",
                "bg-[var(--muted)] text-[var(--muted-foreground)] hover:opacity-90"
              )}
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (templateName.trim()) {
                  onSave(templateName.trim());
                  onClose();
                }
              }}
              disabled={!templateName.trim()}
              className={cn(
                "px-4 py-2 text-sm font-medium rounded-lg transition-colors",
                "bg-[var(--accent)] text-white hover:opacity-90",
                !templateName.trim() && "opacity-50 cursor-not-allowed"
              )}
            >
              Save Template
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 
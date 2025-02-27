import { Package, FileText } from 'lucide-react';
import { cn } from "@/lib/utils";
import { AccessType } from './types';

interface AccessTypeSelectorProps {
  selectedType: AccessType;
  onTypeSelect: (type: AccessType) => void;
}

export function AccessTypeSelector({ selectedType, onTypeSelect }: AccessTypeSelectorProps) {
  const accessTypes = [
    { id: 'content', label: 'Content', icon: FileText },
    { id: 'ai', label: 'AI', icon: Package },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {accessTypes.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          onClick={() => onTypeSelect(id as AccessType)}
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm",
            "border transition-all",
            selectedType === id
              ? "border-[var(--text-secondary)] bg-[var(--hover-bg)] text-[var(--foreground)]"
              : "border-[var(--border-color)] hover:border-[var(--text-secondary)] text-[var(--text-secondary)]"
          )}
        >
          <Icon className="w-4 h-4" />
          <span>{label}</span>
        </button>
      ))}
    </div>
  );
} 
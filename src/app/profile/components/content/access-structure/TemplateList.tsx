import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { cn } from "@/lib/utils";
import { Loader2 } from 'lucide-react';

interface Template {
  id: string;
  name: string;
  access_overrides: any;
  created_at: string;
  updated_at: string;
}

interface TemplateListProps {
  contentId: string;
  onTemplateSelect?: (template: Template) => void;
}

export function TemplateList({ contentId, onTemplateSelect }: TemplateListProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(null);
  const supabase = createClientComponentClient();

  useEffect(() => {
    async function fetchTemplates() {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .rpc('get_content_templates', {
            p_content_id: contentId
          });

        if (error) throw error;
        setTemplates(data || []);
      } catch (err) {
        console.error('Error fetching templates:', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchTemplates();
  }, [contentId, supabase]);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-[var(--muted-foreground)] mt-2">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-sm">Loading templates...</span>
      </div>
    );
  }

  if (templates.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-1.5 mt-2 mb-6">
      {templates.map(template => (
        <button
          key={template.id}
          onClick={() => {
            setActiveTemplateId(template.id);
            onTemplateSelect?.(template);
          }}
          className={cn(
            "px-2.5 py-0.5 text-sm rounded-full transition-all",
            "border border-transparent",
            "bg-[var(--muted)]/50 hover:bg-[var(--muted)]",
            "text-[var(--muted-foreground)] hover:text-[var(--foreground)]",
            "hover:border-[var(--border-color)] hover:shadow-sm",
            activeTemplateId === template.id && "border-[var(--accent)] text-[var(--foreground)]"
          )}
        >
          {template.name}
        </button>
      ))}
    </div>
  );
} 
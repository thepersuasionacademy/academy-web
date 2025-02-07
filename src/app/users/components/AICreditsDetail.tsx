import { Clock, ChevronRight, Copy, CheckCircle } from 'lucide-react';

interface AIItem {
  id: number;
  name: string;
  category: string;
  suite: string;
  timestamp: string;
  cost: number;
  description: string;
  aiResponse: string;
}

interface AICreditsDetailProps {
  item: AIItem;
  formatTimestamp: (timestamp: string) => { date: string; time: string };
  onCopy: (response: string) => void;
  showCopied: boolean;
}

export function AICreditsDetail({ item, formatTimestamp, onCopy, showCopied }: AICreditsDetailProps) {
  return (
    <>
      {/* Title and Description */}
      <div className="space-y-2 mb-6">
        <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
          <span>{item.category}</span>
          <ChevronRight className="w-3 h-3" />
          <span>{item.suite}</span>
        </div>
        <h3 className="text-2xl font-medium text-[var(--foreground)]">
          {item.name}
        </h3>
        <p className="text-lg text-[var(--text-secondary)]">
          {item.description}
        </p>
        <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
          <Clock className="w-3 h-3" />
          <span>{formatTimestamp(item.timestamp).date}</span>
          <span>•</span>
          <span>{formatTimestamp(item.timestamp).time}</span>
        </div>
      </div>

      {/* Cost in credits */}
      <div className="mb-6">
        <p className="text-lg text-[var(--text-secondary)]">Credits Used</p>
        <p className="text-2xl font-medium text-[var(--foreground)]">
          {item.cost} credits
        </p>
      </div>

      {/* AI Response */}
      <div>
        <p className="text-lg text-[var(--text-secondary)] mb-3">AI Response</p>
        <div className="p-6 rounded-lg bg-[var(--hover-bg)] relative group">
          <p className="text-lg text-[var(--foreground)]">
            {item.aiResponse}
          </p>
          <button 
            onClick={() => onCopy(item.aiResponse)}
            className="absolute top-4 right-4 p-2 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            {showCopied ? (
              <CheckCircle className="w-6 h-6 text-green-500" />
            ) : (
              <Copy className="w-6 h-6 text-[var(--text-secondary)]" />
            )}
          </button>
        </div>
      </div>
    </>
  );
} 
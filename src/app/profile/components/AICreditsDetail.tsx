import { Clock, ChevronRight, Copy, CheckCircle, Minus } from 'lucide-react';
import type { AIItem } from './types';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from "@/lib/utils";
import { markdownComponents } from '@/app/ai/components/embed/output/MarkdownStyles';

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
          <span>{item.collection_name}</span>
          <ChevronRight className="w-3 h-3" />
          <span>{item.suite_name}</span>
        </div>
        <h3 className="text-2xl font-medium text-[var(--foreground)]">
          {item.tool_name}
        </h3>
        <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
          <Clock className="w-3 h-3" />
          <span>{formatTimestamp(item.timestamp).date}</span>
          <span>•</span>
          <span>{formatTimestamp(item.timestamp).time}</span>
        </div>
      </div>

      {/* Credits Math Equation */}
      <div className="mb-8 p-6 rounded-lg bg-[var(--hover-bg)]">
        <div className="max-w-[400px] mx-auto">
          <div className="grid grid-cols-2 gap-x-8 gap-y-2">
            {/* Credits Before */}
            <p className="text-3xl font-medium text-[var(--text-secondary)] text-right leading-none">
              {item.credits_before}
            </p>
            <p className="text-lg text-[var(--text-secondary)] leading-none pt-2">Credits Before</p>

            {/* Credits Used with minus sign */}
            <div className="flex items-center justify-end gap-3">
              <span className="text-3xl font-medium text-red-500 leading-none">−</span>
              <p className="text-3xl font-medium text-red-500 leading-none">
                {item.credits_cost}
              </p>
            </div>
            <p className="text-lg text-red-500 leading-none pt-2">Credits Used</p>

            {/* Divider line */}
            <div className="col-span-2 h-[2px] bg-[#333333] my-2" />

            {/* Credits Remaining */}
            <p className="text-3xl font-bold text-[var(--foreground)] text-right leading-none">
              {item.credits_after}
            </p>
            <p className="text-lg text-[var(--foreground)] leading-none pt-2">Credits Remaining</p>
          </div>
        </div>
      </div>

      {/* AI Response with Markdown */}
      <div className="space-y-4">
        {/* Header with top copy button */}
        <div className="flex items-center justify-between">
          <p className="text-lg text-[var(--text-secondary)]">AI Response</p>
          <button 
            onClick={() => onCopy(item.ai_response)}
            className="p-2 rounded-lg hover:bg-[var(--hover-bg)] flex items-center gap-2"
          >
            {showCopied ? (
              <>
                <span className="text-sm text-green-500">Copied!</span>
                <CheckCircle className="w-5 h-5 text-green-500" />
              </>
            ) : (
              <>
                <span className="text-sm text-[var(--text-secondary)]">Copy response</span>
                <Copy className="w-5 h-5 text-[var(--text-secondary)]" />
              </>
            )}
          </button>
        </div>

        {/* Response content */}
        <div className="p-6 rounded-lg bg-[var(--hover-bg)]">
          <div className={cn(
            "prose max-w-none",
            "prose-headings:text-[var(--foreground)] prose-headings:font-medium",
            "prose-p:text-[var(--foreground)]",
            "prose-strong:text-[var(--foreground)]",
            "prose-code:text-[var(--foreground)]",
            "prose-ul:text-[var(--foreground)]",
            "prose-ol:text-[var(--foreground)]",
            "prose-li:text-[var(--foreground)]",
            "prose-pre:bg-[var(--card-bg)]",
            "prose-pre:border prose-pre:border-[var(--border-color)]",
            "prose-pre:rounded-lg",
            "prose-code:before:content-none prose-code:after:content-none"
          )}>
            <Markdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
              {item.ai_response}
            </Markdown>
          </div>
        </div>

        {/* Bottom copy button */}
        <div className="flex justify-end">
          <button 
            onClick={() => onCopy(item.ai_response)}
            className="p-2 rounded-lg hover:bg-[var(--hover-bg)] flex items-center gap-2"
          >
            {showCopied ? (
              <>
                <span className="text-sm text-green-500">Copied!</span>
                <CheckCircle className="w-5 h-5 text-green-500" />
              </>
            ) : (
              <>
                <span className="text-sm text-[var(--text-secondary)]">Copy response</span>
                <Copy className="w-5 h-5 text-[var(--text-secondary)]" />
              </>
            )}
          </button>
        </div>
      </div>
    </>
  );
} 
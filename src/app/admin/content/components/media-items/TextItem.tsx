import React, { useState, useEffect } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Pencil, Eye, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { markdownComponents } from '@/app/ai/components/embed/output/MarkdownStyles';
import { MediaItemProps } from './types';

export function TextItem({ item, onUpdate, onRemove }: MediaItemProps) {
  const [mode, setMode] = useState<'edit' | 'preview'>('edit');
  const [isExpanded, setIsExpanded] = useState(false);
  const [localTitle, setLocalTitle] = useState(item.title || '');
  const [localContent, setLocalContent] = useState(item.content_text || '');

  // Update local state when props change
  useEffect(() => {
    setLocalTitle(item.title || '');
    setLocalContent(item.content_text || '');
  }, [item.title, item.content_text]);

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between">
        <input
          type="text"
          value={localTitle}
          onChange={e => {
            setLocalTitle(e.target.value);
            onUpdate({ title: e.target.value || null });
          }}
          placeholder="New Text Content"
          className="flex-1 px-4 py-3 text-2xl font-medium bg-transparent focus:outline-none text-[var(--foreground)]"
        />
        <button
          onClick={onRemove}
          className="p-2 mr-2 rounded-lg hover:bg-red-500/10 text-red-500 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full py-2 border-t border-[var(--border-color)] hover:bg-[var(--hover-bg)] transition-colors group"
      >
        <div className="flex items-center justify-center gap-1.5 text-sm text-[var(--text-secondary)] group-hover:text-[var(--foreground)]">
          See Full Content
          <Eye className="w-3.5 h-3.5" />
        </div>
      </button>

      <div className={cn(
        "overflow-hidden transition-all duration-200",
        isExpanded ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0"
      )}>
        <div className="flex flex-col gap-4 p-4">
          <div className="flex items-center gap-3 justify-end">
            <button
              onClick={() => setMode('edit')}
              className={cn(
                "px-4 py-2 rounded-lg border border-[var(--border-color)] transition-colors",
                "flex items-center gap-2",
                mode === 'edit' 
                  ? "bg-[var(--accent)] text-white border-[var(--accent)]" 
                  : "text-[var(--text-secondary)] hover:text-[var(--foreground)] hover:border-[var(--accent)]"
              )}
            >
              <Pencil className="w-4 h-4" />
              <span>Edit</span>
            </button>
            <button
              onClick={() => setMode('preview')}
              className={cn(
                "px-4 py-2 rounded-lg border border-[var(--border-color)] transition-colors",
                "flex items-center gap-2",
                mode === 'preview' 
                  ? "bg-[var(--accent)] text-white border-[var(--accent)]" 
                  : "text-[var(--text-secondary)] hover:text-[var(--foreground)] hover:border-[var(--accent)]"
              )}
            >
              <Eye className="w-4 h-4" />
              <span>Preview</span>
            </button>
          </div>

          {mode === 'edit' ? (
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Content</label>
              <textarea
                value={localContent}
                onChange={e => {
                  setLocalContent(e.target.value);
                  onUpdate({ content_text: e.target.value || null });
                }}
                placeholder="Enter text content..."
                className="w-full h-48 px-3 py-2 text-lg rounded-lg border border-[var(--border-color)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] resize-none"
              />
            </div>
          ) : (
            <div className={cn(
              "h-[400px] p-4 overflow-auto rounded-lg border border-[var(--border-color)]",
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
                {localContent || ''}
              </Markdown>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 
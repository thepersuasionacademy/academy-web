import React, { useRef, useState } from 'react';
import { MediaType } from '@/types/course';
import { cn } from '@/lib/utils';
import { MediaItemProps } from './types';
import { MediaTypeIcon } from './MediaTypeIcon';
import { TextItem } from './TextItem';
import { VideoItem } from './VideoItem';
import { AIItem } from './AIItem';
import { PDFItem } from './PDFItem';

export function MediaItemContainer({ item, onUpdate, onRemove }: MediaItemProps) {
  const [showTypeSelector, setShowTypeSelector] = useState(false);
  const typeRef = useRef<HTMLDivElement>(null);

  const handleTypeChange = (newType: MediaType) => {
    onUpdate({
      type: newType,
      // Reset type-specific fields
      video_id: undefined,
      video_name: undefined,
      content_text: undefined,
      tool_id: undefined,
      pdf_url: undefined,
      pdf_type: undefined,
      custom_pdf_type: undefined,
      quiz_data: undefined
    });
    setShowTypeSelector(false);
  };

  const renderMediaItem = () => {
    switch (item.type) {
      case MediaType.TEXT:
        return <TextItem item={item} onUpdate={onUpdate} onRemove={onRemove} />;
      case MediaType.VIDEO:
        return <VideoItem item={item} onUpdate={onUpdate} onRemove={onRemove} />;
      case MediaType.AI:
        return <AIItem item={item} onUpdate={onUpdate} onRemove={onRemove} />;
      case MediaType.PDF:
        return <PDFItem item={item} onUpdate={onUpdate} onRemove={onRemove} />;
      default:
        return null;
    }
  };

  return (
    <div>
      <div className="flex rounded-lg border border-[var(--border-color)] dark:bg-[var(--background)] bg-[var(--card-bg)]">
        <div className="relative flex border-r border-[var(--border-color)]" ref={typeRef}>
          <button
            onClick={() => setShowTypeSelector(!showTypeSelector)}
            className={cn(
              "p-8 rounded-l-lg transition-all hover:bg-[var(--hover-bg)] flex items-center justify-center",
              item.type 
                ? "text-[var(--text-secondary)]" 
                : "bg-red-500/10 text-red-500"
            )}
          >
            {!item.type && <div className="w-8 h-8 flex items-center justify-center font-bold">!</div>}
            {item.type && <MediaTypeIcon type={item.type} className="w-8 h-8" />}
          </button>
          {showTypeSelector && (
            <div className="absolute top-full left-0 mt-1 py-1 rounded-lg border border-[var(--border-color)] bg-[var(--card-bg)] shadow-lg z-10">
              {Object.values(MediaType).map((type) => (
                <button
                  key={type}
                  onClick={() => handleTypeChange(type)}
                  className="w-full px-4 py-2 text-left hover:bg-[var(--hover-bg)] transition-colors flex items-center gap-3"
                >
                  <div className="p-2 bg-[var(--hover-bg)] rounded-lg">
                    <MediaTypeIcon type={type} className="w-5 h-5 text-[var(--text-secondary)]" />
                  </div>
                  {type}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1 dark:bg-[var(--background)] bg-[var(--card-bg)]">
          {renderMediaItem()}
        </div>
      </div>
    </div>
  );
} 
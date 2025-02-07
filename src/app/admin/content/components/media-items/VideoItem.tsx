import React, { useState, useEffect, useRef } from 'react';
import { Eye, X } from 'lucide-react';
import { VideoNameType } from '@/types/course';
import { cn } from '@/lib/utils';
import { MediaItemProps } from './types';

export function VideoItem({ item, onUpdate, onRemove }: MediaItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showTitleSuggestions, setShowTitleSuggestions] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const videoTypes = [
    { type: VideoNameType.VIDEO, label: 'Video' },
    { type: VideoNameType.LESSON, label: 'Lesson' },
    { type: VideoNameType.IMPRINTING_SESSION, label: 'Imprinting Session' }
  ];

  // Set initial values if not set
  useEffect(() => {
    if (!item.title && !item.video_name) {
      const defaultType = videoTypes[0];
      onUpdate({
        title: defaultType.label,
        video_name: defaultType.type
      });
    }
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowTitleSuggestions(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between">
        <div className="flex-1 relative" ref={dropdownRef}>
          <input
            type="text"
            value={item.title || ''}
            onChange={e => onUpdate({ title: e.target.value })}
            onFocus={() => setShowTitleSuggestions(true)}
            placeholder="New Video Content"
            className="w-full px-4 py-3 text-2xl font-medium bg-transparent focus:outline-none text-[var(--foreground)]"
          />
          {showTitleSuggestions && (
            <div 
              className="absolute top-full left-0 right-0 mt-1 py-1 rounded-lg border border-[var(--border-color)] bg-[var(--card-bg)] shadow-lg z-10"
            >
              {videoTypes.map(({ type, label }) => (
                <button
                  key={type}
                  onMouseDown={(e) => {
                    e.preventDefault(); // Prevent input blur
                    onUpdate({ 
                      title: label,
                      video_name: type 
                    });
                    setShowTitleSuggestions(false);
                  }}
                  className="w-full px-4 py-2 text-left hover:bg-[var(--hover-bg)] transition-colors text-2xl font-medium"
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
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
          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Video ID</label>
              <input
                type="text"
                value={item.video_id || ''}
                onChange={e => onUpdate({ video_id: e.target.value })}
                placeholder="Enter Video ID"
                className="w-full px-3 py-2 text-lg rounded-lg border border-[var(--border-color)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              />
            </div>

            {item.video_id && (
              <div className="aspect-video w-full rounded-lg border border-[var(--border-color)] overflow-hidden bg-black">
                <iframe 
                  src={`https://iframe.mediadelivery.net/embed/376351/${item.video_id}?autoplay=false`}
                  loading="lazy"
                  className="w-full h-full"
                  style={{ border: 'none' }}
                  allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture; fullscreen"
                  allowFullScreen
                  title={item.title || 'Video Preview'}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 
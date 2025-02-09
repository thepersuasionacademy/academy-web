import React, { useState, useEffect, useRef } from 'react';
import { Eye, X, File } from 'lucide-react';
import { PDFType } from '@/types/content';
import { cn } from '@/lib/utils';
import { MediaItemProps } from './types';

export function PDFItem({ item, onUpdate, onRemove }: MediaItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Local state for input values
  const [localTitle, setLocalTitle] = useState(item.title || '');
  const [localPdfUrl, setLocalPdfUrl] = useState(item.pdf_url || '');
  const [localCustomType, setLocalCustomType] = useState(item.custom_pdf_type || '');

  // Update local state when props change
  useEffect(() => {
    setLocalTitle(item.title || '');
    setLocalPdfUrl(item.pdf_url || '');
    setLocalCustomType(item.custom_pdf_type || '');
  }, [item.title, item.pdf_url, item.custom_pdf_type]);

  const pdfTypes = [
    { type: PDFType.TRANSCRIPT, label: 'Transcript' },
    { type: PDFType.NOTES, label: 'Notes' },
    { type: PDFType.CUSTOM, label: 'Custom' }
  ];

  // Set initial values if not set
  useEffect(() => {
    if (!item.title && !item.pdf_type) {
      const defaultType = pdfTypes[0];
      onUpdate({
        title: defaultType.label,
        pdf_type: defaultType.type
      });
    }
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowTypeDropdown(false);
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
            value={localTitle}
            onChange={e => {
              setLocalTitle(e.target.value);
              onUpdate({ title: e.target.value || null });
            }}
            onFocus={() => setShowTypeDropdown(true)}
            placeholder="New PDF Content"
            className="w-full px-4 py-3 text-2xl font-medium bg-transparent focus:outline-none text-[var(--foreground)]"
          />
          {showTypeDropdown && (
            <div 
              className="absolute top-full left-0 right-0 mt-1 py-1 rounded-lg border border-[var(--border-color)] bg-[var(--card-bg)] shadow-lg z-10"
            >
              {pdfTypes.map(({ type, label }) => (
                <button
                  key={type}
                  onMouseDown={(e) => {
                    e.preventDefault(); // Prevent input blur
                    setLocalTitle(label);
                    onUpdate({ 
                      title: label,
                      pdf_type: type 
                    });
                    setShowTypeDropdown(false);
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
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">PDF URL</label>
              <input
                type="text"
                value={localPdfUrl}
                onChange={e => {
                  setLocalPdfUrl(e.target.value);
                  onUpdate({ pdf_url: e.target.value || null });
                }}
                placeholder="Enter PDF URL"
                className="w-full px-3 py-2 text-lg rounded-lg border border-[var(--border-color)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              />
            </div>

            {item.pdf_type === PDFType.CUSTOM && (
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Custom Type</label>
                <input
                  type="text"
                  value={localCustomType}
                  onChange={e => {
                    setLocalCustomType(e.target.value);
                    onUpdate({ custom_pdf_type: e.target.value || null });
                  }}
                  placeholder="Enter custom PDF type"
                  className="w-full px-3 py-2 text-lg rounded-lg border border-[var(--border-color)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                />
              </div>
            )}

            {localPdfUrl && (
              <div className="w-full max-w-3xl mx-auto">
                <div className="aspect-[8.5/11] w-full rounded-lg border border-[var(--border-color)] overflow-hidden bg-black">
                  <iframe 
                    src={localPdfUrl}
                    loading="lazy"
                    className="w-full h-full"
                    style={{ border: 'none' }}
                    title={localTitle || 'PDF Preview'}
                  />
                </div>
                <a 
                  href={localPdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 flex items-center justify-center gap-2 p-2 rounded-lg border border-[var(--border-color)] hover:bg-[var(--hover-bg)] transition-colors text-[var(--text-secondary)] hover:text-[var(--foreground)]"
                >
                  <File className="w-4 h-4" />
                  <span>Open in New Tab</span>
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 
import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Eye, Copy, CheckCircle } from 'lucide-react';
import { Link as LinkIcon } from 'lucide-react';
import type { SavedLink } from '../types';

interface LinkCardProps {
  link: SavedLink;
  copiedId: string | null;
  onCopy: (id: string, url: string) => void;
  onEdit: () => void;
}

interface PreviewTooltipProps {
  url: string;
  isVisible: boolean;
  anchorRect: DOMRect | null;
}

function PreviewTooltip({ url, isVisible, anchorRect }: PreviewTooltipProps) {
  if (!isVisible || !url || !anchorRect) return null;

  // Calculate position
  const tooltipStyle = {
    position: 'fixed' as const,
    top: `${anchorRect.top - 10}px`,
    left: `${anchorRect.right + 10}px`,
    zIndex: 9999,
    opacity: 1,
  };

  // Get favicon URL using Google's favicon service (free)
  const faviconUrl = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(url)}&sz=64`;
  
  // Format the URL for display
  const urlObject = new URL(url);
  const hostname = urlObject.hostname.replace('www.', '');
  const pathname = urlObject.pathname === '/' ? '' : urlObject.pathname;

  return createPortal(
    <div 
      className="w-[400px] bg-[var(--card-bg)] rounded-lg border border-[var(--border-color)] shadow-xl overflow-hidden transition-all duration-200"
      style={tooltipStyle}
    >
      <div className="p-4 flex gap-4">
        <div className="flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden bg-[var(--background)] border border-[var(--border-color)] flex items-center justify-center">
          <img
            src={faviconUrl}
            alt="Site icon"
            className="w-8 h-8"
          />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-[var(--foreground)] font-medium text-base truncate">
            {hostname}
          </h3>
          <p className="text-[var(--text-secondary)] text-sm mt-1 truncate">
            {pathname}
          </p>
        </div>
      </div>
      <div className="px-4 py-3 bg-[var(--background)] text-xs text-[var(--text-secondary)] flex items-center gap-2 border-t border-[var(--border-color)]">
        <div className="w-2 h-2 rounded-full bg-green-500" />
        Click to open in new tab
      </div>
    </div>,
    document.body
  );
}

export function LinkCard({ link, copiedId, onCopy, onEdit }: LinkCardProps) {
  const [isHovering, setIsHovering] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [buttonRect, setButtonRect] = useState<DOMRect | null>(null);

  const updateButtonRect = () => {
    if (buttonRef.current) {
      setButtonRect(buttonRef.current.getBoundingClientRect());
    }
  };

  useEffect(() => {
    if (isHovering) {
      updateButtonRect();
      // Update position on scroll or resize
      window.addEventListener('scroll', updateButtonRect);
      window.addEventListener('resize', updateButtonRect);
      
      return () => {
        window.removeEventListener('scroll', updateButtonRect);
        window.removeEventListener('resize', updateButtonRect);
      };
    }
  }, [isHovering]);

  return (
    <div className="bg-[var(--background)] rounded-lg p-5 border border-[var(--border-color)] hover:border-[var(--accent)] transition-colors">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h4 className="text-lg font-medium text-[var(--foreground)]">
            {link.title}
          </h4>
          <p className="text-base text-[var(--text-secondary)]">
            {link.description}
          </p>
        </div>
        <div>
          <button 
            ref={buttonRef}
            className="p-1.5 rounded-lg hover:bg-[var(--hover-bg)] transition-colors text-[var(--text-secondary)] hover:text-[var(--foreground)]"
            onClick={() => window.open(link.url, '_blank')}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
          >
            <Eye className="w-5 h-5" />
          </button>
          <PreviewTooltip 
            url={link.url} 
            isVisible={isHovering} 
            anchorRect={buttonRect}
          />
        </div>
      </div>

      <div className="h-px bg-[var(--border-color)] w-full my-4" />
      <div className="flex items-center gap-2 text-[var(--text-secondary)] text-sm px-1 bg-[var(--card-bg)] rounded-md">
        <LinkIcon className="w-4 h-4 flex-shrink-0" />
        <div className="overflow-x-auto whitespace-nowrap py-2 no-scrollbar">
          {link.url}
        </div>
      </div>

      <button
        onClick={() => onCopy(link.id, link.url)}
        className="w-full flex items-center justify-center gap-1 hover:text-[var(--foreground)] transition-colors text-[var(--text-secondary)] py-2 mt-4 border border-[var(--border-color)] rounded-lg hover:border-[var(--accent)]"
      >
        {copiedId === link.id ? (
          <>
            <CheckCircle className="w-5 h-5 text-green-500" />
            <span className="text-sm text-green-500">Copied</span>
          </>
        ) : (
          <>
            <Copy className="w-5 h-5" />
            <span className="text-sm">Copy</span>
          </>
        )}
      </button>

      <div className="h-px bg-[var(--border-color)] w-full my-4" />

      <button
        onClick={onEdit}
        className="w-full text-center hover:text-[var(--foreground)] transition-colors text-[var(--text-secondary)] text-sm"
      >
        Edit
      </button>
    </div>
  );
} 
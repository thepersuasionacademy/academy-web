import React, { useEffect, useMemo } from 'react';
import { Play, X } from 'lucide-react';
import { cn } from "@/lib/utils";

interface Track {
  id: string;
  title: string;
  duration: string;
}

interface SuiteViewProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  tracks: number;
  onPlay: (trackId: string) => void;
}

export const SuiteView = ({
  isOpen,
  onClose,
  title,
  description,
  tracks: trackCount,
  onPlay,
}: SuiteViewProps) => {
  const generatedTracks = useMemo(() => 
    Array.from({ length: trackCount }, (_, i) => ({
      id: `${i + 1}`,
      title: `Track ${i + 1}`,
      duration: "20:00"
    })),
    [trackCount, title]
  );

  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow;
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.height = '100%';
    }
    return () => {
      document.body.style.overflow = originalStyle;
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.height = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div 
      className={cn(
        "fixed inset-y-0 right-0 z-50",
        "w-[450px]",
        "transform transition-transform duration-300 ease-out",
        "bg-[var(--card-bg)] text-[var(--foreground)] flex-shrink-0",
        "border-l border-[var(--border-color)]",
        isOpen ? "translate-x-0" : "translate-x-full"
      )}
    >
      <div className="relative h-full overflow-auto">
        <div className="p-6 sticky top-0 bg-[var(--card-bg)]/80 backdrop-blur-sm">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl md:text-2xl font-bold">{title}</h1>
            <button 
              onClick={onClose}
              className="p-2 rounded-full hover:bg-[var(--hover-bg)] transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <p className="text-base md:text-sm text-[var(--text-secondary)]">{description}</p>
        </div>

        <div className="px-6 pb-safe">
          {generatedTracks.map((track, index) => (
            <div key={track.id}>
              <button
                onClick={() => onPlay(track.id)}
                className="w-full flex items-center justify-between py-4 transition-colors duration-200 hover:bg-[var(--hover-bg)] rounded-lg px-3"
              >
                <span className="font-medium text-lg">{`Track ${index + 1}`}</span>
                <span className="text-[var(--text-secondary)] text-base">{track.duration}</span>
              </button>
              {index < generatedTracks.length - 1 && (
                <div className="h-px bg-[var(--border-color)]" />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SuiteView;
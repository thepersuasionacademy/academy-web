import React, { useEffect, useMemo } from 'react';
import { Play, Heart, Share2, X } from 'lucide-react';
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
  image: string;
  tracks: number;
  onPlay: (trackId: string) => void;
  onLike: () => void;
  onShare: () => void;
}

export const SuiteView = ({
  isOpen,
  onClose,
  title,
  description,
  image,
  tracks: trackCount,
  onPlay,
  onLike,
  onShare
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
    <>
      <div 
        className={cn(
          "fixed inset-0 bg-black/50 z-40 transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

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
          <div className="relative pb-[56.25%]">
            <div className="absolute inset-0">
              <img 
                src={image} 
                alt={title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0">
                {/* Subtle vertical gradient */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[var(--card-bg)]/30 to-[var(--card-bg)]" />
                {/* Very subtle vignette effect */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/10 via-transparent to-black/10" />
              </div>
            </div>
            
            <div className="absolute top-safe right-4 top-4">
              <button 
                onClick={onClose}
                className="p-2 rounded-full bg-[var(--card-bg)]/80 backdrop-blur-sm hover:bg-[var(--hover-bg)] transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="absolute bottom-0 p-6 w-full">
              <h1 className="text-3xl md:text-2xl font-bold mb-1">{title}</h1>
              <p className="text-base md:text-sm text-zinc-400">{description}</p>
            </div>
          </div>

          <div className="flex gap-4 p-6 sticky top-0 bg-[var(--card-bg)]/80 backdrop-blur-sm">
            <button 
              className="flex-1 flex items-center justify-center gap-2 bg-red-600 text-white px-8 py-3 rounded-full font-semibold text-lg"
              onClick={() => onPlay(generatedTracks[0].id)}
            >
              <Play className="w-5 h-5" />
              Play Now
            </button>
            <button 
              className="p-3 rounded-full bg-zinc-800/80"
              onClick={onLike}
            >
              <Heart className="w-6 h-6" />
            </button>
            <button 
              className="p-3 rounded-full bg-zinc-800/80"
              onClick={onShare}
            >
              <Share2 className="w-6 h-6" />
            </button>
          </div>

          <div className="px-6 pb-safe">
            {generatedTracks.map((track, index) => (
              <div key={track.id}>
                <button
                  onClick={() => onPlay(track.id)}
                  className="w-full flex items-center justify-between py-4 transition-colors duration-200 hover:bg-white/10 rounded-lg px-3"
                >
                  <span className="font-medium text-lg">{`Track ${index + 1}`}</span>
                  <span className="text-zinc-400 text-base">{track.duration}</span>
                </button>
                {index < generatedTracks.length - 1 && (
                  <div className="h-px bg-white/[0.08]" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default SuiteView;
import React, { useState, useRef } from 'react';
import type { ProgressProps } from '@/lib/types/media';

interface EnhancedProgressProps extends ProgressProps {
  onPause?: () => void;
  onResume?: () => void;
}

export const Desktop = ({ currentTime, duration, onSeek, onPause, onResume }: EnhancedProgressProps) => {
  const progressRef = useRef<HTMLDivElement>(null);
  const [draggingTime, setDraggingTime] = useState(currentTime);
  const [isDragging, setIsDragging] = useState(false);
  const displayTime = isDragging ? draggingTime : currentTime;
  const latestTimeRef = useRef(currentTime);

  function handlePosition(clientX: number): number {
    if (!progressRef.current) return 0;
    const rect = progressRef.current.getBoundingClientRect();
    const position = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    return position * duration;
  }

  function startDragging(e: React.MouseEvent) {
    const handleDrag = (e: MouseEvent) => {
      const newTime = handlePosition(e.clientX);
      setDraggingTime(newTime);
      latestTimeRef.current = newTime;
    };

    const stopDragging = () => {
      setIsDragging(false);
      onSeek(latestTimeRef.current);
      onResume?.();
      document.removeEventListener('mousemove', handleDrag);
      document.removeEventListener('mouseup', stopDragging);
    };

    setIsDragging(true);
    onPause?.();
    document.addEventListener('mousemove', handleDrag);
    document.addEventListener('mouseup', stopDragging);

    const initialTime = handlePosition(e.clientX);
    setDraggingTime(initialTime);
    latestTimeRef.current = initialTime;
  }

  return (
    <div className="w-full">
      <div className="group relative select-none">
        <div 
          ref={progressRef}
          className="w-full bg-zinc-700 rounded-full cursor-pointer transition-all duration-200 h-1 group-hover:h-2 group-hover:-translate-y-0.5"
          onMouseDown={startDragging}
        >
          <div 
            className="absolute h-full rounded-full transition-colors duration-200 bg-white group-hover:bg-red-600"
            style={{ 
              width: `${(displayTime / duration) * 100}%`,
              transition: isDragging ? 'none' : undefined
            }}
          />
          <div 
            className={`absolute h-3 w-3 bg-white rounded-full transition-opacity duration-200 ${isDragging ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
            style={{ 
              left: `${(displayTime / duration) * 100}%`, 
              transform: 'translateX(-50%)',
              top: '-2px',
              transition: isDragging ? 'none' : undefined
            }} 
          />
        </div>
      </div>
    </div>
  );
};
import React, { useState, useRef, TouchEvent } from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { cn } from "@/lib/utils";

interface CarouselProps {
  items: React.ReactNode[];
  title: string;
}

export const MobileCarousel = ({ items, title }: CarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);
  const isDragging = useRef<boolean>(false);

  const handleTouchStart = (e: TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    isDragging.current = false;
  };

  const handleTouchMove = (e: TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
    const difference = Math.abs(touchStartX.current - touchEndX.current);
    if (difference > 20) {
      isDragging.current = true;
      e.preventDefault();
    }
  };

  const handleTouchEnd = (e: TouchEvent) => {
    if (!isDragging.current) return;
    
    const difference = touchStartX.current - touchEndX.current;
    if (Math.abs(difference) > 50) {
      if (difference > 0 && currentIndex < items.length - 1) {
        setCurrentIndex(prev => prev + 1);
      } else if (difference < 0 && currentIndex > 0) {
        setCurrentIndex(prev => prev - 1);
      }
    }
  };

  return (
    <div className="relative w-full px-6">
      <h2 className="text-2xl font-semibold mb-4 ml-4">{title}</h2>
      
      <div className="relative">
        <div 
          className="overflow-hidden rounded-2xl mx-4 touch-pan-x"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div 
            className="flex transition-transform duration-300 ease-out"
            style={{ transform: `translateX(-${currentIndex * 100}%)` }}
          >
            {items.map((item, index) => (
              <div key={index} className="w-full flex-shrink-0">
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-center gap-6 mt-6">
          <button 
            onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
            className="p-3 touch-manipulation"
            disabled={currentIndex === 0}
          >
            <ChevronLeft className={cn(
              "w-6 h-6",
              currentIndex === 0 ? "text-white/30" : "text-white"
            )} />
          </button>

          <div className="flex gap-4">
            {items.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={cn(
                  "h-3 rounded-full transition-all touch-manipulation",
                  currentIndex === index 
                    ? "bg-white w-10" 
                    : "bg-white/50 w-3"
                )}
              />
            ))}
          </div>

          <button 
            onClick={() => setCurrentIndex(prev => Math.min(items.length - 1, prev + 1))}
            className="p-3 touch-manipulation"
            disabled={currentIndex === items.length - 1}
          >
            <ChevronRight className={cn(
              "w-6 h-6",
              currentIndex === items.length - 1 ? "text-white/30" : "text-white"
            )} />
          </button>
        </div>
      </div>
    </div>
  );
};
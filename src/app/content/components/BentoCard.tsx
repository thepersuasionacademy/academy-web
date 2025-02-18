'use client';

import React from 'react';
import { cn } from "@/lib/utils";
import Image from 'next/image';

interface BentoCardProps {
  title: string;
  description?: string;
  className?: string;
  image?: string;
  onClick?: (event: React.MouseEvent) => void;
  hasAccess?: boolean;
}

export function BentoCard({
  title,
  description,
  className,
  image,
  onClick,
  hasAccess = false
}: BentoCardProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onClick) {
      onClick(e);
    }
  };

  // Debug log only in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`BentoCard ${title}: ${hasAccess ? 'unlocked' : 'locked'}`);
  }

  const isLocked = !hasAccess;

  return (
    <div
      onClick={handleClick}
      className={cn(
        "block group w-full cursor-pointer relative z-10",
        "hover:z-20",
        className
      )}
    >
      <div className={cn(
        "relative w-full h-[250px] overflow-visible",
        "transition-transform duration-300 group-hover:scale-105 origin-center"
      )}>
        {/* Base card */}
        <div className={cn(
          "absolute inset-0 rounded-2xl overflow-hidden",
          "border border-[var(--border-color)]",
          "transition-all duration-300",
          "group-hover:border-[var(--accent)] group-hover:shadow-lg"
        )}>
          {/* Main content area */}
          <div className="absolute inset-x-0 top-0 h-[calc(100%-52px)]">
            <div className="relative w-full h-full">
              {/* Base image */}
              <Image 
                src={image || "/api/placeholder/400/250"}
                alt={title}
                fill
                className={cn(
                  "object-cover group-hover:scale-105 transition-transform duration-500",
                  isLocked && "filter grayscale blur-[4px]"
                )}
              />
              
              {/* Active state overlay */}
              <div className={cn(
                "absolute inset-0 bg-gradient-to-b from-black/0 to-black/60",
                "opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              )} />
            </div>
          </div>
          
          {/* Title bar */}
          <div className="absolute inset-x-0 bottom-0">
            <div className={cn(
              "px-6 py-4 backdrop-blur-md border-t border-[var(--border-color)]",
              "bg-white/90 dark:bg-zinc-900/90 group-hover:bg-[var(--accent)]/90 transition-colors duration-300"
            )}>
              <h3 className={cn(
                "text-2xl font-bold tracking-wide text-[var(--foreground)]",
                "group-hover:text-white transition-colors duration-300"
              )}>{title}</h3>
              {description && (
                <p className={cn(
                  "mt-1 text-sm text-[var(--text-secondary)]",
                  "group-hover:text-white/80 transition-colors duration-300"
                )}>{description}</p>
              )}
            </div>
          </div>
        </div>

        {/* Lock icon - only show when locked */}
        {isLocked && (
          <div className="absolute inset-x-0 top-0 h-[calc(100%-52px)] flex items-center justify-center z-20">
            <svg 
              width="80" 
              height="80" 
              viewBox="0 0 24 24" 
              fill="none" 
              className="drop-shadow-[0_8px_24px_rgba(0,0,0,0.7)] filter saturate-150"
              style={{
                filter: `
                  drop-shadow(0 2px 4px rgba(0,0,0,0.4))
                  drop-shadow(0 4px 8px rgba(0,0,0,0.4))
                  drop-shadow(0 8px 16px rgba(0,0,0,0.4))
                  drop-shadow(0 16px 32px rgba(0,0,0,0.5))
                  drop-shadow(0 32px 64px rgba(0,0,0,0.3))
                `
              }}
            >
              <path
                d="M12 2C9.23858 2 7 4.23858 7 7V9H8.5V7C8.5 5.067 10.067 3.5 12 3.5C13.933 3.5 15.5 5.067 15.5 7V9H17V7C17 4.23858 14.7614 2 12 2Z"
                fill="white"
                className="drop-shadow-[0_4px_8px_rgba(0,0,0,0.6)]"
              />
              <path
                d="M7 9C5.34315 9 4 10.3431 4 12V19C4 20.6569 5.34315 22 7 22H17C18.6569 22 20 20.6569 20 19V12C20 10.3431 18.6569 9 17 9H7Z"
                fill="white"
                className="drop-shadow-[0_4px_8px_rgba(0,0,0,0.6)]"
              />
              {/* Enhanced 3D Keyhole */}
              <path
                d="M12 13.2C11.0059 13.2 10.2 14.0059 10.2 15C10.2 15.7 10.6 16.3 11.2 16.6L10.8 18.4C10.7 18.7 10.9 19 11.2 19H12.8C13.1 19 13.3 18.7 13.2 18.4L12.8 16.6C13.4 16.3 13.8 15.7 13.8 15C13.8 14.0059 12.9941 13.2 12 13.2Z"
                fill="#111827"
                className="drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]"
              />
              {/* Keyhole Inner Shadow */}
              <path
                d="M12 14C11.4477 14 11 14.4477 11 15C11 15.5523 11.4477 16 12 16C12.5523 16 13 15.5523 13 15C13 14.4477 12.5523 14 12 14Z"
                fill="#000000"
                opacity="0.3"
                className="drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]"
              />
              {/* Keyhole Highlight */}
              <path
                d="M12 14.2C11.5582 14.2 11.2 14.5582 11.2 15C11.2 15.4418 11.5582 15.8 12 15.8C12.4418 15.8 12.8 15.4418 12.8 15C12.8 14.5582 12.4418 14.2 12 14.2Z"
                fill="#666666"
                opacity="0.5"
              />
            </svg>
          </div>
        )}
      </div>
    </div>
  );
} 
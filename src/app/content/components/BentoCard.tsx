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
}

export function BentoCard({
  title,
  description,
  className,
  image,
  onClick
}: BentoCardProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onClick) {
      onClick(e);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={cn("block group w-full cursor-pointer", className)}
    >
      <div className="relative w-full h-[250px]">
        <div className={cn(
          "absolute inset-0 rounded-2xl",
          "overflow-hidden",
          "transition-all duration-300",
          "bg-[#fafafa] dark:bg-zinc-900/50",
          "border border-[var(--border-color)]",
          "hover:border-[var(--accent)]"
        )}>
          <div className="absolute inset-x-0 top-0 h-[calc(100%-52px)]">
            <Image 
              src={image || "/api/placeholder/400/250"}
              alt={title}
              fill
              className={cn(
                "object-cover transition-all duration-200",
                "brightness-100 dark:md:brightness-[0.7] dark:md:group-hover:brightness-100"
              )}
            />
          </div>
          
          <div className="absolute inset-x-0 bottom-0">
            <div className={cn(
              "px-6 py-4",
              "bg-[#fafafa]/80 dark:bg-zinc-900/40",
              "backdrop-blur-md",
              "border-t border-[var(--border-color)] dark:border-white/[0.15]"
            )}>
              <h3 className="text-2xl font-bold text-[var(--foreground)] dark:text-white tracking-wide">{title}</h3>
              {description && (
                <p className="text-[var(--text-secondary)] dark:text-zinc-400 mt-1 text-sm">{description}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
import React from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { cn } from "@/lib/utils";

interface BentoMetric {
  value: string | number;
  label: string;
}

interface BentoCardProps {
  title: string;
  description?: string;
  metrics?: BentoMetric[];
  href: string;
  className?: string;
  image?: string;
  tracks?: number;
}

export const BentoCard = ({
  title,
  description,
  metrics,
  href,
  className,
  image,
  tracks
}: BentoCardProps) => {
  return (
    <Link
      href={href}
      className={cn("block group", className)}
    >
      <div className={cn(
        "glass-card rounded-2xl relative",
        "w-full h-[250px]",
        "border border-white/[0.15]",
        "hover:border-red-600 hover:shadow-[0_0_10px_rgba(171,2,43,0.6)]",
        "overflow-hidden",
        "transition-all duration-200",
        "bg-zinc-900/50",
        "shadow-[0_4px_12px_rgba(0,0,0,0.5)]"
      )}>
        {/* Main image limited to space above overlay */}
        <div className="absolute inset-x-0 top-0 h-[calc(100%-52px)]">
          <img 
            src={image || "/api/placeholder/400/250"}
            alt={title}
            className="w-full h-full object-cover brightness-[0.7] group-hover:brightness-100 transition-all duration-200"
          />
        </div>
        
        {/* Zinc-colored glassmorphic title overlay */}
        <div className="absolute inset-x-0 bottom-0">
          <div className="px-6 py-4 bg-zinc-900/40 backdrop-blur-md border-t border-white/[0.15]">
            <h3 className="text-2xl font-bold text-white tracking-wide">{title}</h3>
          </div>
        </div>
      </div>
    </Link>
  );
};
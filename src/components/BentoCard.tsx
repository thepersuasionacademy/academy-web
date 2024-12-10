import React from 'react';
import { cn } from "@/lib/utils";

interface BentoCardProps {
  title: string;
  description?: string;
  href: string;
  className?: string;
  image?: string;
  tracks?: number;
  onClick?: (event: React.MouseEvent) => void;
}

export const BentoCard = ({
  title,
  description,
  href,
  className,
  image,
  tracks,
  onClick
}: BentoCardProps) => {
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
        <div className="absolute inset-0 rounded-2xl border border-white/[0.15] hover:border-red-600 transition-all duration-200 z-30" />
        <div className={cn(
          "absolute inset-0 rounded-2xl",
          "overflow-hidden",
          "transition-all duration-200",
          "bg-zinc-900/50",
          "shadow-[0_4px_12px_rgba(0,0,0,0.5)]",
          "group-hover:shadow-[0_0_10px_rgba(171,2,43,0.6)]"
        )}>
          <div className="absolute inset-x-0 top-0 h-[calc(100%-52px)]">
            <img 
              src={image || "/api/placeholder/400/250"}
              alt={title}
              className={cn(
                "w-full h-full object-cover transition-all duration-200",
                "md:brightness-[0.7] md:group-hover:brightness-100",
                "brightness-100"
              )}
            />
          </div>
          
          <div className="absolute inset-x-0 bottom-0">
            <div className="px-6 py-4 bg-zinc-900/40 backdrop-blur-md border-t border-white/[0.15]">
              <h3 className="text-2xl font-bold text-white tracking-wide">{title}</h3>
              {description && (
                <p className="text-sm text-zinc-400 mt-1">{description}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BentoCard;
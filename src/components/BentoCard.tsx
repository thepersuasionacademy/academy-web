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

type BentoGridVariant = "single" | "double" | "triple" | "quad";
type BentoSpacing = "none" | "sm" | "md" | "lg" | "xl";

interface BentoGridProps {
  variant?: BentoGridVariant;
  spacing?: BentoSpacing;
  className?: string;
  children: React.ReactNode;
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
        "transition-all duration-500 ease-in-out",
        "w-full h-[250px]",
        "border border-white/10",
        "hover:border-red-600 hover:shadow-[0_0_10px_rgba(171,2,43,0.6)]",
        "overflow-hidden"
      )}>
        <img 
          src={image || "/api/placeholder/400/250"}
          alt={title}
          className="w-full h-full object-cover"
        />
        
        <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
          <div className="transform transition-all duration-500 ease-in-out">
            <h3 className="text-xl font-semibold text-white">{title}</h3>
            <div className="h-0 group-hover:h-auto overflow-hidden opacity-0 group-hover:opacity-100 transition-all duration-500 ease-in-out">
              <p className="text-white/60 mt-2 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-500 ease-in-out">{description}</p>
              <p className="text-white/60 mt-1 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-500 ease-in-out delay-75">{tracks} tracks</p>
              {metrics && (
                <div className="flex gap-8 mt-4">
                  {metrics.map((metric, index) => (
                    <div key={index} className="relative">
                      <div className="text-xl font-semibold">{metric.value}</div>
                      <div className="text-white/60 text-sm">{metric.label}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export const BentoGrid = ({
  variant = "double",
  spacing = "lg",
  children,
  className
}: BentoGridProps) => {
  const gridCols = {
    single: "grid-cols-1",
    double: "grid-cols-1 md:grid-cols-2",
    triple: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    quad: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4"
  };

  const gridGaps = {
    none: "gap-0",
    sm: "gap-4",
    md: "gap-6",
    lg: "gap-8",
    xl: "gap-12"
  };

  return (
    <div className={cn(
      "grid",
      gridCols[variant],
      gridGaps[spacing],
      className
    )}>
      {children}
    </div>
  );
};

export type { BentoCardProps, BentoGridProps, BentoGridVariant, BentoSpacing, BentoMetric };
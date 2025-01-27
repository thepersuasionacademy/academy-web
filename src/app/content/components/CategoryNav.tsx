'use client';

import React from 'react';
import { cn } from "@/lib/utils";
import Link from 'next/link';
import type { Route } from 'next';

interface CategoryNavProps {
  currentCategory?: string;
}

export function CategoryNav({ currentCategory }: CategoryNavProps) {
  return (
    <nav className="category-nav bg-transparent">
      <Link 
        href={'/content/mind' as Route}
        className={cn(
          "px-4 py-2 rounded-full",
          "text-sm font-medium",
          currentCategory === 'mind' 
            ? "bg-red-600 text-white"
            : "text-zinc-400 hover:text-white"
        )}
      >
        Mind
      </Link>
      <Link 
        href={'/content/training' as Route}
        className={cn(
          "px-4 py-2 rounded-full",
          "text-sm font-medium",
          currentCategory === 'training' 
            ? "bg-red-600 text-white"
            : "text-zinc-400 hover:text-white"
        )}
      >
        Training
      </Link>
    </nav>
  );
} 
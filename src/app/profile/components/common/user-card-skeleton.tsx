// app/admin/users/components/user-card-skeleton.tsx
import React from 'react';
import { cn } from "@/lib/utils";

export function UserCardSkeleton() {
  return (
    <div className={cn(
      "p-4 rounded-lg border border-[var(--border-color)]",
      "animate-pulse"
    )}>
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-[var(--hover-bg)]" />
        <div className="space-y-2">
          <div className="h-5 w-32 bg-[var(--hover-bg)] rounded" />
          <div className="h-4 w-48 bg-[var(--hover-bg)] rounded" />
        </div>
      </div>
    </div>
  );
}
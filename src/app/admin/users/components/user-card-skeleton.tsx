// app/admin/users/components/user-card-skeleton.tsx
import { cn } from "@/lib/utils";

export function UserCardSkeleton() {
  return (
    <div className={cn(
      "relative rounded-2xl p-4 animate-pulse",
      "bg-[var(--card-bg)]",
      "border border-[var(--border-color)]",
      "shadow-lg",
      "min-h-[200px]"
    )}>
      <div className="h-8 w-3/4 bg-[var(--hover-bg)] rounded mb-3" />
      <div className="h-6 w-full bg-[var(--hover-bg)] rounded mb-3" />
      <div className="h-6 w-1/2 bg-[var(--hover-bg)] rounded mt-auto" />
    </div>
  );
}
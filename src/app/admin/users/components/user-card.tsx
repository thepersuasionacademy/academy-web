'use client';

import { cn } from "@/lib/utils";
import { Mail, UserCircle } from 'lucide-react';
import { User } from './types';

interface UserCardProps {
  user: User;
  onSelect: (user: User) => void;
}

export function UserCard({ user, onSelect }: UserCardProps) {
  return (
    <div 
      onClick={() => onSelect(user)}
      className={cn(
        "relative rounded-2xl p-6",
        "border border-[var(--border-color)] hover:border-[var(--accent)]",
        "transition-all duration-200",
        "bg-[var(--card-bg)]",
        "shadow-lg",
        "hover:shadow-[0_0_10px_rgba(var(--accent),0.3)]",
        "flex flex-col min-h-[200px] cursor-pointer",
        "text-left relative"
      )}
    >
      <div>
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-3xl font-bold text-[var(--foreground)]">{user.name}</h3>
          <UserCircle className="w-7 h-7 text-[var(--text-secondary)]" />
        </div>
        <div className="flex items-center gap-2 text-[var(--text-secondary)] mb-4">
          <Mail className="w-5 h-5" />
          <p className="text-xl line-clamp-1">{user.email}</p>
        </div>
      </div>

      <div className="text-xl text-[var(--text-secondary)] mt-auto">
        Credits: <span className="font-medium">{user.credits}</span>
      </div>
    </div>
  );
}
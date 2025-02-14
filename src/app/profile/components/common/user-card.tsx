'use client';

import React from 'react';
import { User } from 'lucide-react';
import { cn } from "@/lib/utils";

interface UserCardProps {
  firstName: string;
  lastName: string;
  email: string;
  profileImage?: string | null;
  isSelected?: boolean;
  onClick?: () => void;
}

export function UserCard({ firstName, lastName, email, profileImage, isSelected, onClick }: UserCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "p-4 rounded-lg border border-[var(--border-color)] cursor-pointer transition-all",
        isSelected ? "border-[var(--accent)] bg-[var(--accent)]/5" : "hover:border-[var(--accent)]"
      )}
    >
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-full overflow-hidden bg-[var(--hover-bg)] flex items-center justify-center flex-shrink-0">
          {profileImage ? (
            <img 
              src={profileImage} 
              alt={`${firstName} ${lastName}`} 
              className="w-full h-full object-cover"
            />
          ) : (
            <User className="w-6 h-6 text-[var(--text-secondary)]" />
          )}
        </div>
        <div>
          <h3 className="text-lg font-medium">{firstName} {lastName}</h3>
          <p className="text-sm text-[var(--text-secondary)]">{email}</p>
        </div>
      </div>
    </div>
  );
}
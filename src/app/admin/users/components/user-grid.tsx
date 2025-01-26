// app/admin/users/components/user-grid.tsx
import { cn } from "@/lib/utils";
import { User as UserIcon, Mail, Phone } from 'lucide-react';
import type { User } from './types';

interface UserGridProps {
  users: User[];
  isLoading: boolean;
  onSelectUser: (user: User) => void;
  selectedUserId?: string;
}

export function UserGrid({ users, isLoading, onSelectUser, selectedUserId }: UserGridProps) {
  if (isLoading) {
    return <div className="text-[var(--text-secondary)]">Loading...</div>;
  }

  if (users.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      {users.map((user) => (
        <button
          key={user.id}
          onClick={() => onSelectUser(user)}
          className={cn(
            "w-full text-left p-4 rounded-lg",
            "border border-[var(--border-color)]",
            "transition-colors duration-200",
            "hover:border-[var(--accent)]",
            selectedUserId === user.id && "border-[var(--accent)] bg-[var(--accent)]/5",
          )}
        >
          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-full bg-[var(--hover-bg)] flex items-center justify-center flex-shrink-0">
              <UserIcon className="w-5 h-5 text-[var(--text-secondary)]" />
            </div>
            <div className="min-w-0 space-y-2">
              <p className="text-base font-medium">
                {user.name}
              </p>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                  <Mail className="w-4 h-4" />
                  <p className="text-sm truncate">
                    {user.email}
                  </p>
                </div>
                {user.phone && (
                  <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                    <Phone className="w-4 h-4" />
                    <p className="text-sm">
                      {user.phone}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
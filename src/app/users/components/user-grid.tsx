import { cn } from "@/lib/utils";
import { User } from './types';

interface UserGridProps {
  users: User[];
  isLoading: boolean;
  onSelectUser: (user: User) => void;
  selectedUserId?: string;
}

export function UserGrid({ users, isLoading, onSelectUser, selectedUserId }: UserGridProps) {
  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-20 bg-[var(--hover-bg)] rounded-lg" />
        ))}
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="text-center py-8 text-[var(--text-secondary)]">
        No users found
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {users.map((user) => (
        <button
          key={user.id}
          onClick={() => onSelectUser(user)}
          className={cn(
            "w-full p-4 rounded-lg text-left transition-colors",
            "hover:bg-[var(--hover-bg)]",
            selectedUserId === user.id && "bg-[var(--hover-bg)]"
          )}
        >
          <div className="flex items-center gap-4">
            {user.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.full_name || user.email}
                className="w-10 h-10 rounded-full"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-[var(--accent)] flex items-center justify-center text-white">
                {(user.full_name?.[0] || user.email[0]).toUpperCase()}
              </div>
            )}
            <div>
              {user.full_name && (
                <div className="font-medium">{user.full_name}</div>
              )}
              <div className="text-sm text-[var(--text-secondary)]">
                {user.email}
              </div>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
} 
// app/admin/users/components/user-grid.tsx
import React from 'react';
import { UserCard } from './user-card';
import { UserCardSkeleton } from './user-card-skeleton';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  profileImage?: string | null;
}

interface UserGridProps {
  users: User[];
  isLoading?: boolean;
  selectedUserId?: string;
  onSelectUser?: (user: User) => void;
}

export function UserGrid({ users, isLoading, selectedUserId, onSelectUser }: UserGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <UserCardSkeleton key={i} />
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {users.map((user) => (
        <UserCard
          key={user.id}
          firstName={user.firstName}
          lastName={user.lastName}
          email={user.email}
          profileImage={user.profileImage}
          isSelected={user.id === selectedUserId}
          onClick={() => onSelectUser?.(user)}
        />
      ))}
    </div>
  );
}
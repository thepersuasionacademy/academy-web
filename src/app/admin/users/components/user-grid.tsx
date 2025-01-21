// app/admin/users/components/user-grid.tsx
import { User } from './types';
import { UserCard } from './user-card';
import { UserCardSkeleton } from './user-card-skeleton';

interface UserGridProps {
  users: User[];
  isLoading?: boolean;
  onSelectUser: (user: User) => void;
}

export function UserGrid({ users, isLoading, onSelectUser }: UserGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map(i => (
          <UserCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {users.map(user => (
        <UserCard 
          key={user.id} 
          user={user} 
          onSelect={onSelectUser}
        />
      ))}
    </div>
  );
}
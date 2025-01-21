'use client';

import { useState } from 'react';
import { Mail, User } from 'lucide-react';
import { UserGrid } from './components/user-grid';
import { cn } from "@/lib/utils";
import type { User as UserType } from './components/types';

export default function AdminUsersPage() {
  const [emailQuery, setEmailQuery] = useState('');
  const [nameQuery, setNameQuery] = useState('');
  const [users, setUsers] = useState<UserType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchUsers = async (type: 'email' | 'name', value: string) => {
    if (value.length < 3) return;

    setIsLoading(true);
    setError(null);
    
    try {
      const queryParams = new URLSearchParams();
      if (type === 'email') queryParams.append('email', value);
      if (type === 'name') queryParams.append('name', value);

      const response = await fetch(`/api/users?${queryParams}`);
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      if (!Array.isArray(data)) {
        throw new Error('Unexpected API response format');
      }

      setUsers(data);
      setError(null);
    } catch (error) {
      console.error('Error searching users:', error);
      setUsers([]);
      setError(error instanceof Error ? error.message : 'Failed to search users');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (type: 'email' | 'name', value: string) => {
    if (type === 'email') {
      setEmailQuery(value);
    } else {
      setNameQuery(value);
    }

    // Clear results if both fields are empty
    if (!value && (type === 'email' ? !nameQuery : !emailQuery)) {
      setUsers([]);
      setError(null);
      return;
    }
    
    const timeoutId = setTimeout(() => {
      searchUsers(type, value);
    }, 300);

    return () => clearTimeout(timeoutId);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[var(--background)]">
      <div className="flex-1">
        <div className="px-4 py-4 border-b border-[var(--border-color)]">
          <div className="flex justify-between items-center max-w-[2000px] mx-auto">
            <h1 className="px-5 text-2xl font-bold text-[var(--foreground)]">User Management</h1>
            
            <div className="flex gap-2 w-[800px]">
              {/* Email search field */}
              <div className="relative flex-1">
                <Mail className="absolute left-2 top-2.5 h-5 w-5 text-[var(--text-secondary)]" />
                <input
                  type="text"
                  placeholder="Search by email..."
                  className={cn(
                    "w-full pl-9 pr-3 py-2 text-base",
                    "bg-transparent border-b-2 border-[var(--border-color)]",
                    "text-[var(--foreground)]",
                    "placeholder:text-[var(--text-secondary)]",
                    "transition-colors",
                    "focus:outline-none focus:border-[var(--accent)]"
                  )}
                  value={emailQuery}
                  onChange={(e) => handleSearch('email', e.target.value)}
                />
              </div>

              {/* Name search field */}
              <div className="relative flex-1">
                <User className="absolute left-2 top-2.5 h-5 w-5 text-[var(--text-secondary)]" />
                <input
                  type="text"
                  placeholder="Search by name..."
                  className={cn(
                    "w-full pl-9 pr-3 py-2 text-base",
                    "bg-transparent border-b-2 border-[var(--border-color)]",
                    "text-[var(--foreground)]",
                    "placeholder:text-[var(--text-secondary)]",
                    "transition-colors",
                    "focus:outline-none focus:border-[var(--accent)]"
                  )}
                  value={nameQuery}
                  onChange={(e) => handleSearch('name', e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="p-4">
          {error && (
            <p className="mb-4 text-[var(--accent)]">
              {error}
            </p>
          )}

          {((emailQuery && emailQuery.length < 3) || (nameQuery && nameQuery.length < 3)) && (
            <p className="mb-4 text-[var(--text-secondary)]">
              Please enter at least 3 characters to search
            </p>
          )}

          <UserGrid
            users={users}
            isLoading={isLoading}
            onSelectUser={(user) => console.log('Selected user:', user)}
          />
        </div>
      </div>
    </div>
  );
}
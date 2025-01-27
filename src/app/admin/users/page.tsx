'use client';

import { useState } from 'react';
import { Mail, User, ChevronLeft, ChevronRight } from 'lucide-react';
import { UserGrid } from './components/user-grid';
import { cn } from "@/lib/utils";
import type { User as UserType } from './components/types';

export default function AdminUsersPage() {
  // Search states
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [emailQuery, setEmailQuery] = useState('');
  const [nameQuery, setNameQuery] = useState('');
  const [users, setUsers] = useState<UserType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);

  const searchUsers = async (type: 'email' | 'name', value: string) => {
    if (value.length < 3) return;

    setIsLoading(true);
    
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
    } catch (error) {
      console.error('Error searching users:', error);
      setUsers([]);
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
      return;
    }
    
    const timeoutId = setTimeout(() => {
      searchUsers(type, value);
    }, 300);

    return () => clearTimeout(timeoutId);
  };

  const handleUserSelect = (user: UserType) => {
    setSelectedUser(user);
    // Close sidebar on mobile
    if (window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
  };

  return (
    <div className="h-screen flex bg-[var(--background)] relative overflow-hidden">
      {/* Collapsible Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50",
        "transform transition-transform duration-300 ease-in-out",
        "bg-[var(--card-bg)] border-r border-[var(--border-color)]",
        "w-[400px] overflow-auto",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full",
        !isSidebarOpen && "hidden lg:hidden"
      )}>
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="p-4 border-b border-[var(--border-color)] flex justify-between items-center">
            <h2 className="text-xl font-semibold">User Search</h2>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="p-2 hover:bg-[var(--hover-bg)] rounded-lg"
            >
              <ChevronLeft />
            </button>
          </div>

          <div className="p-4 space-y-4">
            {/* Email search field */}
            <div className="relative">
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
            <div className="relative">
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

            {/* Search Results */}
            <div className="mt-4">
              <UserGrid
                users={users}
                isLoading={isLoading}
                onSelectUser={handleUserSelect}
                selectedUserId={selectedUser?.id}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Toggle Button - Only show when sidebar is closed */}
      {!isSidebarOpen && (
        <button
          onClick={() => setIsSidebarOpen(true)}
          className={cn(
            "fixed left-0 z-50",
            "p-2 rounded-r-lg",
            "bg-[var(--card-bg)] border border-l-0 border-[var(--border-color)]",
            "hover:bg-[var(--hover-bg)] transition-colors",
            "flex items-center gap-2",
            "top-1/2 -translate-y-1/2"
          )}
        >
          <ChevronRight className="w-5 h-5" />
          <span className="text-sm">Search</span>
        </button>
      )}

      {/* Main Content - Dashboard */}
      <div className={cn(
        "flex-1 transition-all duration-300 overflow-auto",
        isSidebarOpen ? "ml-[400px]" : "ml-0"
      )}>
        {selectedUser ? (
          <div className="h-full">
            {/* Dashboard content */}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            {!isSidebarOpen && (
              <button
                onClick={() => setIsSidebarOpen(true)}
                className={cn(
                  "flex items-center gap-4 px-16 py-12",
                  "rounded-2xl",
                  "hover:opacity-80 transition-opacity -translate-y-20",
                  "group bg-transparent"
                )}
              >
                <span className="text-5xl font-light tracking-wide text-[var(--text-secondary)]">
                  Search Users
                </span>
                <ChevronRight className="w-10 h-10 text-[var(--text-secondary)] group-hover:text-[var(--accent)] transition-colors" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
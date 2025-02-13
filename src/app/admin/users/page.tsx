'use client';

import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter,
  Mail,
  Calendar,
  ArrowUpDown,
  ChevronLeft,
  Loader2,
  User
} from 'lucide-react';
import { cn } from "@/lib/utils";
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  created_at: string;
  updated_at: string;
  profile_image_url: string | null;
}

export default function UsersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<'email' | 'created_at'>('email');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const supabase = createClientComponentClient();
  const router = useRouter();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/admin/users');
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        setUsers(data.users || []);
      } catch (err) {
        console.error('Error fetching users:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch users');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []); // Only fetch on mount

  // Client-side sorting
  const sortedUsers = [...users].sort((a, b) => {
    const aValue = sortField === 'email' ? a.email : a.created_at;
    const bValue = sortField === 'email' ? b.email : b.created_at;
    
    if (sortDirection === 'asc') {
      return aValue > bValue ? 1 : -1;
    }
    return aValue < bValue ? 1 : -1;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getSubscriptionColor = (subscription?: string | null) => {
    switch (subscription) {
      case 'free':
        return 'text-gray-500';
      case 'pro':
        return 'text-blue-500';
      case 'enterprise':
        return 'text-purple-500';
      default:
        return 'text-gray-500';
    }
  };

  const handleSort = (field: 'email' | 'created_at') => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getFullName = (user: User) => {
    if (user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    if (user.first_name) return user.first_name;
    if (user.last_name) return user.last_name;
    return null;
  };

  const filteredUsers = sortedUsers.filter(user => {
    const searchLower = searchQuery.toLowerCase();
    const fullName = getFullName(user);
    return (
      user.email.toLowerCase().includes(searchLower) ||
      (fullName?.toLowerCase() || '').includes(searchLower)
    );
  });

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <div className="border-b border-[var(--border-color)] bg-[var(--background)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16 gap-4">
            <Link 
              href="/admin"
              className="p-2 rounded-lg hover:bg-[var(--hover-bg)] transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-[var(--text-secondary)]" />
            </Link>
            <h1 className="text-2xl font-semibold text-[var(--foreground)]">Users</h1>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-secondary)]" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--card-bg)] text-[var(--foreground)] placeholder-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent)]"
            />
          </div>
          <button className="px-4 py-2 rounded-lg border border-[var(--border-color)] hover:border-[var(--accent)] transition-colors flex items-center gap-2">
            <Filter className="w-5 h-5" />
            <span>Filters</span>
          </button>
        </div>

        {/* Error State */}
        {error && (
          <div className="p-4 mb-8 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-[var(--accent)]" />
          </div>
        ) : (
          /* Users Table */
          <div className="border border-[var(--border-color)] rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[var(--card-bg)] border-b border-[var(--border-color)]">
                  <tr>
                    <th 
                      className="px-6 py-4 text-left cursor-pointer hover:bg-[var(--hover-bg)]"
                    >
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        <span>Name</span>
                      </div>
                    </th>
                    <th 
                      className="px-6 py-4 text-left cursor-pointer hover:bg-[var(--hover-bg)]"
                      onClick={() => handleSort('email')}
                    >
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        <span>Email</span>
                        <ArrowUpDown className="w-4 h-4" />
                      </div>
                    </th>
                    <th 
                      className="px-6 py-4 text-left cursor-pointer hover:bg-[var(--hover-bg)]"
                      onClick={() => handleSort('created_at')}
                    >
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>Join Date</span>
                        <ArrowUpDown className="w-4 h-4" />
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr 
                      key={user.id}
                      className="border-b border-[var(--border-color)] last:border-0 hover:bg-[var(--hover-bg)] cursor-pointer"
                      onClick={() => router.push(`/admin/users/${user.id}`)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {user.profile_image_url ? (
                            <img 
                              src={user.profile_image_url} 
                              alt={getFullName(user) || user.email}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-[var(--accent)] flex items-center justify-center text-white font-medium">
                              {(getFullName(user) || user.email).charAt(0).toUpperCase()}
                            </div>
                          )}
                          <span className="font-medium">{getFullName(user) || 'No name'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-[var(--text-secondary)]">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 text-[var(--text-secondary)]">
                        {formatDate(user.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 
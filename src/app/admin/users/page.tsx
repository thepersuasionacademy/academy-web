'use client';

import React, { useState } from 'react';
import { 
  Search, 
  Filter,
  Mail,
  Calendar,
  CreditCard,
  Brain,
  MoreVertical,
  ArrowUpDown,
  ChevronLeft
} from 'lucide-react';
import { cn } from "@/lib/utils";
import Link from 'next/link';

interface User {
  id: string;
  name: string;
  email: string;
  joinDate: string;
  credits: number;
  status: 'active' | 'inactive';
  subscription: 'free' | 'pro' | 'enterprise';
}

export default function UsersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<keyof User>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Mock user data
  const users: User[] = [
    {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
      joinDate: '2024-01-15',
      credits: 1500,
      status: 'active',
      subscription: 'pro'
    },
    {
      id: '2',
      name: 'Jane Smith',
      email: 'jane@example.com',
      joinDate: '2024-02-01',
      credits: 2500,
      status: 'active',
      subscription: 'enterprise'
    },
    {
      id: '3',
      name: 'Bob Wilson',
      email: 'bob@example.com',
      joinDate: '2024-03-10',
      credits: 500,
      status: 'inactive',
      subscription: 'free'
    },
    // Add more mock users as needed
  ];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getSubscriptionColor = (subscription: User['subscription']) => {
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

  const handleSort = (field: keyof User) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

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

        {/* Users Table */}
        <div className="border border-[var(--border-color)] rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[var(--card-bg)] border-b border-[var(--border-color)]">
                <tr>
                  <th 
                    className="px-6 py-4 text-left cursor-pointer hover:bg-[var(--hover-bg)]"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center gap-2">
                      <span>Name</span>
                      <ArrowUpDown className="w-4 h-4" />
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      <span>Email</span>
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>Join Date</span>
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left">
                    <div className="flex items-center gap-2">
                      <Brain className="w-4 h-4" />
                      <span>Credits</span>
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4" />
                      <span>Subscription</span>
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr 
                    key={user.id}
                    className="border-b border-[var(--border-color)] last:border-0 hover:bg-[var(--hover-bg)]"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[var(--accent)] flex items-center justify-center text-white font-medium">
                          {user.name.charAt(0)}
                        </div>
                        <span>{user.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-[var(--text-secondary)]">{user.email}</td>
                    <td className="px-6 py-4 text-[var(--text-secondary)]">{formatDate(user.joinDate)}</td>
                    <td className="px-6 py-4">{user.credits.toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "capitalize font-medium",
                        getSubscriptionColor(user.subscription)
                      )}>
                        {user.subscription}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button className="p-2 rounded-lg hover:bg-[var(--card-bg)] transition-colors">
                        <MoreVertical className="w-5 h-5 text-[var(--text-secondary)]" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
} 
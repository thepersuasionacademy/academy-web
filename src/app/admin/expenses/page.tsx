'use client';

import React, { useState } from 'react';
import { 
  Search, 
  Filter,
  ChevronLeft,
  ChevronDown,
  ArrowRight,
  MoreVertical,
  Plus,
  Calendar,
  Clock,
  DollarSign,
  AlertCircle
} from 'lucide-react';
import { cn } from "@/lib/utils";
import Link from 'next/link';

interface Expense {
  id: string;
  name: string;
  description: string;
  amount: number;
  type: 'one-time' | 'recurring';
  category: string;
  startDate: string;
  endDate?: string;
  interval?: 'weekly' | 'monthly' | 'yearly';
  nextPaymentDate?: string;
  status: 'active' | 'completed' | 'cancelled';
  lastPaymentDate?: string;
}

interface ExpenseCategory {
  id: string;
  name: string;
  count: number;
}

export default function ExpensesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [expandedExpenseId, setExpandedExpenseId] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'active' | 'completed' | 'cancelled'>('all');

  // Mock categories
  const categories: ExpenseCategory[] = [
    { id: 'all', name: 'All Expenses', count: 12 },
    { id: 'software', name: 'Software', count: 4 },
    { id: 'equipment', name: 'Equipment', count: 2 },
    { id: 'rent', name: 'Rent', count: 1 },
    { id: 'utilities', name: 'Utilities', count: 3 },
    { id: 'services', name: 'Services', count: 2 }
  ];

  // Status filters
  const statusFilters = [
    { id: 'all', label: 'All Status' },
    { id: 'active', label: 'Active' },
    { id: 'completed', label: 'Completed' },
    { id: 'cancelled', label: 'Cancelled' }
  ];

  // Mock expenses data
  const expenses: Expense[] = [
    {
      id: '1',
      name: 'Adobe Creative Suite',
      description: 'Design software subscription',
      amount: 52.99,
      type: 'recurring',
      category: 'software',
      startDate: '2024-01-01',
      interval: 'monthly',
      nextPaymentDate: '2024-04-01',
      status: 'active',
      lastPaymentDate: '2024-03-01'
    },
    {
      id: '2',
      name: 'Office Chairs',
      description: 'Ergonomic chairs for the office',
      amount: 899.99,
      type: 'one-time',
      category: 'equipment',
      startDate: '2024-03-15',
      status: 'completed',
      lastPaymentDate: '2024-03-15'
    },
    {
      id: '3',
      name: 'Office Rent',
      description: 'Monthly office space rental',
      amount: 2500.00,
      type: 'recurring',
      category: 'rent',
      startDate: '2024-01-01',
      interval: 'monthly',
      nextPaymentDate: '2024-04-01',
      status: 'active',
      lastPaymentDate: '2024-03-01'
    }
  ];

  // Filter expenses
  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = 
      expense.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      expense.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || selectedCategory === 'all' || 
                          expense.category === selectedCategory;
    const matchesStatus = selectedStatus === 'all' || expense.status === selectedStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const getStatusColor = (status: Expense['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-500';
      case 'completed':
        return 'bg-blue-500';
      case 'cancelled':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <div className="border-b border-[var(--border-color)] bg-[var(--background)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link 
                href="/admin"
                className="p-2 rounded-lg hover:bg-[var(--hover-bg)] transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-[var(--text-secondary)]" />
              </Link>
              <h1 className="text-2xl font-semibold text-[var(--foreground)]">Expenses</h1>
            </div>
            <button className="px-4 py-2 bg-[var(--accent)] text-white rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2">
              <Plus className="w-5 h-5" />
              <span>Add Expense</span>
            </button>
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
              placeholder="Search expenses..."
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

        {/* Categories */}
        <div className="mb-8 overflow-x-auto">
          <div className="flex gap-2 min-w-max">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={cn(
                  "px-4 py-2 rounded-lg transition-all whitespace-nowrap",
                  selectedCategory === category.id
                    ? "bg-[var(--accent)] text-white"
                    : "bg-[var(--card-bg)] border border-[var(--border-color)] hover:border-[var(--accent)]"
                )}
              >
                {category.name}
                <span className="ml-2 text-sm opacity-70">({category.count})</span>
              </button>
            ))}
          </div>
        </div>

        {/* Status Filters */}
        <div className="mb-8 overflow-x-auto">
          <div className="flex gap-2 min-w-max">
            {statusFilters.map((status) => (
              <button
                key={status.id}
                onClick={() => setSelectedStatus(status.id as typeof selectedStatus)}
                className={cn(
                  "px-4 py-2 rounded-lg transition-all whitespace-nowrap",
                  selectedStatus === status.id
                    ? "bg-[var(--accent)] text-white"
                    : "bg-[var(--card-bg)] border border-[var(--border-color)] hover:border-[var(--accent)]"
                )}
              >
                {status.label}
              </button>
            ))}
          </div>
        </div>

        {/* Expenses List */}
        <div className="space-y-4">
          {filteredExpenses.map((expense) => (
            <div
              key={expense.id}
              className="border border-[var(--border-color)] rounded-lg overflow-hidden hover:border-[var(--accent)] transition-colors bg-[var(--card-bg)]"
            >
              {/* Expense Header */}
              <button
                onClick={() => setExpandedExpenseId(
                  expandedExpenseId === expense.id ? null : expense.id
                )}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-[var(--hover-bg)] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <ArrowRight className="w-5 h-5 text-[var(--text-secondary)]" />
                  <div className="text-left">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={cn(
                        "w-2 h-2 rounded-full",
                        getStatusColor(expense.status)
                      )} />
                      <span className="text-sm text-[var(--text-secondary)] capitalize">
                        {expense.status}
                      </span>
                    </div>
                    <h3 className="text-lg font-medium text-[var(--foreground)]">
                      {expense.name}
                    </h3>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="text-sm text-[var(--text-secondary)]">
                        {formatAmount(expense.amount)}
                        {expense.type === 'recurring' && `/${expense.interval?.slice(0, 1)}`}
                      </span>
                      <span className="text-sm text-[var(--text-secondary)]">
                        {expense.type === 'recurring' ? 'Recurring' : 'One-time'}
                      </span>
                    </div>
                  </div>
                </div>
                <ChevronDown className={cn(
                  "w-5 h-5 text-[var(--text-secondary)] transition-transform",
                  expandedExpenseId === expense.id && "rotate-180"
                )} />
              </button>

              {/* Expense Details */}
              {expandedExpenseId === expense.id && (
                <div className="border-t border-[var(--border-color)] p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <h4 className="text-sm font-medium text-[var(--text-secondary)] mb-4">
                        Expense Details
                      </h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[var(--text-secondary)]">Type</span>
                          <span className="text-[var(--foreground)] capitalize">{expense.type}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[var(--text-secondary)]">Category</span>
                          <span className="text-[var(--foreground)] capitalize">{expense.category}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[var(--text-secondary)]">Amount</span>
                          <span className="text-[var(--foreground)]">
                            {formatAmount(expense.amount)}
                            {expense.type === 'recurring' && `/${expense.interval?.slice(0, 1)}`}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[var(--text-secondary)]">Status</span>
                          <span className="text-[var(--foreground)] capitalize">{expense.status}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-[var(--text-secondary)] mb-4">
                        Payment Schedule
                      </h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[var(--text-secondary)]">Start Date</span>
                          <span className="text-[var(--foreground)]">{formatDate(expense.startDate)}</span>
                        </div>
                        {expense.endDate && (
                          <div className="flex items-center justify-between">
                            <span className="text-[var(--text-secondary)]">End Date</span>
                            <span className="text-[var(--foreground)]">{formatDate(expense.endDate)}</span>
                          </div>
                        )}
                        {expense.type === 'recurring' && (
                          <>
                            <div className="flex items-center justify-between">
                              <span className="text-[var(--text-secondary)]">Interval</span>
                              <span className="text-[var(--foreground)] capitalize">{expense.interval}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-[var(--text-secondary)]">Last Payment</span>
                              <span className="text-[var(--foreground)]">
                                {expense.lastPaymentDate ? formatDate(expense.lastPaymentDate) : 'N/A'}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-[var(--text-secondary)]">Next Payment</span>
                              <span className="text-[var(--foreground)]">
                                {expense.nextPaymentDate ? formatDate(expense.nextPaymentDate) : 'N/A'}
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end mt-6 gap-3">
                    {expense.status === 'active' && (
                      <>
                        <button className="px-4 py-2 rounded-lg border border-[var(--border-color)] hover:border-[var(--accent)] transition-colors">
                          Edit Expense
                        </button>
                        <button className="px-4 py-2 rounded-lg border border-red-500 text-red-500 hover:bg-red-500 hover:text-white transition-colors">
                          Cancel Expense
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 
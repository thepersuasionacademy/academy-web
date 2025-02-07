'use client';

import React, { useState } from 'react';
import { 
  Search, 
  Filter,
  ChevronLeft,
  ChevronDown,
  ArrowRight,
  MoreVertical,
  Plus
} from 'lucide-react';
import { cn } from "@/lib/utils";
import Link from 'next/link';

interface Payment {
  id: string;
  customerName: string;
  customerEmail: string;
  type: 'subscription' | 'one-time' | 'refund' | 'payment-plan' | 'expense';
  status: 'completed' | 'pending' | 'failed' | 'refunded' | 'paused' | 'cancelled' | 'active';
  amount: number;
  date: string;
  description: string;
  subscriptionDetails?: {
    plan: string;
    interval: 'monthly' | 'yearly';
    nextBilling: string;
    status: 'active' | 'cancelled' | 'past_due';
  };
  paymentPlanDetails?: {
    totalAmount: number;
    installments: {
      total: number;
      completed: number;
      amount: number;
      nextPaymentDate: string;
    };
    status: 'active' | 'paused' | 'cancelled';
  };
  expenseDetails?: {
    type: 'one-time' | 'recurring';
    category: string;
    startDate: string;
    endDate?: string; // Optional for indefinite recurring expenses
    interval?: 'weekly' | 'monthly' | 'yearly'; // For recurring expenses
    nextPaymentDate?: string; // For recurring expenses
    status: 'active' | 'completed' | 'cancelled';
  };
}

interface PaymentCategory {
  id: string;
  name: string;
  count: number;
}

export default function PaymentsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [expandedPaymentId, setExpandedPaymentId] = useState<string | null>(null);

  // Mock categories data
  const categories: PaymentCategory[] = [
    { id: 'all', name: 'All Payments', count: 156 },
    { id: 'subscriptions', name: 'Subscriptions', count: 89 },
    { id: 'payment-plans', name: 'Payment Plans', count: 34 },
    { id: 'one-time', name: 'One-time Payments', count: 45 },
    { id: 'refunds', name: 'Refunds', count: 22 },
    { id: 'expenses', name: 'Expenses', count: 15 },
  ];

  // Payment plan status options
  const statusFilters = [
    { id: 'all', label: 'All Status' },
    { id: 'active', label: 'Active' },
    { id: 'paused', label: 'Paused' },
    { id: 'cancelled', label: 'Cancelled' }
  ];

  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Mock payments data
  const payments: Payment[] = [
    {
      id: '1',
      customerName: 'John Doe',
      customerEmail: 'john@example.com',
      type: 'subscription',
      status: 'completed',
      amount: 49.99,
      date: '2024-03-15',
      description: 'Pro Plan Subscription',
      subscriptionDetails: {
        plan: 'Pro Plan',
        interval: 'monthly',
        nextBilling: '2024-04-15',
        status: 'active'
      }
    },
    {
      id: '2',
      customerName: 'Jane Smith',
      customerEmail: 'jane@example.com',
      type: 'payment-plan',
      status: 'completed',
      amount: 999.99,
      date: '2024-03-14',
      description: 'Leadership Course Bundle - Payment Plan',
      paymentPlanDetails: {
        totalAmount: 999.99,
        installments: {
          total: 3,
          completed: 1,
          amount: 333.33,
          nextPaymentDate: '2024-04-14'
        },
        status: 'active'
      }
    },
    {
      id: '3',
      customerName: 'Bob Wilson',
      customerEmail: 'bob@example.com',
      type: 'payment-plan',
      status: 'completed',
      amount: 1499.99,
      date: '2024-03-13',
      description: 'Complete Course Bundle - Payment Plan',
      paymentPlanDetails: {
        totalAmount: 1499.99,
        installments: {
          total: 4,
          completed: 2,
          amount: 374.99,
          nextPaymentDate: '2024-04-13'
        },
        status: 'paused'
      }
    },
    {
      id: '4',
      customerName: 'Software License',
      customerEmail: 'admin@example.com',
      type: 'expense',
      status: 'active',
      amount: 299.99,
      date: '2024-03-01',
      description: 'Annual Software License',
      expenseDetails: {
        type: 'recurring',
        category: 'Software',
        startDate: '2024-03-01',
        interval: 'yearly',
        nextPaymentDate: '2025-03-01',
        status: 'active'
      }
    },
    {
      id: '5',
      customerName: 'Office Equipment',
      customerEmail: 'admin@example.com',
      type: 'expense',
      status: 'completed',
      amount: 1499.99,
      date: '2024-03-15',
      description: 'New Office Furniture',
      expenseDetails: {
        type: 'one-time',
        category: 'Equipment',
        startDate: '2024-03-15',
        status: 'completed'
      }
    },
    {
      id: '6',
      customerName: 'Office Rent',
      customerEmail: 'admin@example.com',
      type: 'expense',
      status: 'active',
      amount: 2500.00,
      date: '2024-03-01',
      description: 'Monthly Office Rent',
      expenseDetails: {
        type: 'recurring',
        category: 'Rent',
        startDate: '2024-03-01',
        interval: 'monthly',
        nextPaymentDate: '2024-04-01',
        status: 'active'
      }
    }
  ];

  // Filter payments based on search, category, and status
  const filteredPayments = payments.filter(payment => {
    const matchesSearch = 
      payment.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.customerEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || selectedCategory === 'all' || 
                          (selectedCategory === payment.type);
    const matchesStatus = selectedStatus === 'all' || 
                         (payment.paymentPlanDetails?.status === selectedStatus) ||
                         (payment.subscriptionDetails?.status === selectedStatus);
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const getStatusColor = (status: Payment['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500';
      case 'pending':
        return 'bg-yellow-500';
      case 'failed':
        return 'bg-red-500';
      case 'refunded':
        return 'bg-gray-500';
      case 'paused':
        return 'bg-orange-500';
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
              <h1 className="text-2xl font-semibold text-[var(--foreground)]">Payments</h1>
            </div>
            <button className="px-4 py-2 bg-[var(--accent)] text-white rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2">
              <Plus className="w-5 h-5" />
              <span>New Payment</span>
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
              placeholder="Search payments..."
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
                onClick={() => setSelectedStatus(status.id)}
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

        {/* Payments List */}
        <div className="space-y-4">
          {filteredPayments.map((payment) => (
            <div
              key={payment.id}
              className="border border-[var(--border-color)] rounded-lg overflow-hidden hover:border-[var(--accent)] transition-colors bg-[var(--card-bg)]"
            >
              {/* Payment Header */}
              <button
                onClick={() => setExpandedPaymentId(
                  expandedPaymentId === payment.id ? null : payment.id
                )}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-[var(--hover-bg)] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <ArrowRight className="w-5 h-5 text-[var(--text-secondary)]" />
                  <div className="text-left">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={cn(
                        "w-2 h-2 rounded-full",
                        getStatusColor(payment.status)
                      )} />
                      <span className="text-sm text-[var(--text-secondary)] capitalize">
                        {payment.status}
                      </span>
                    </div>
                    <h3 className="text-lg font-medium text-[var(--foreground)]">
                      {payment.description}
                    </h3>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="text-sm text-[var(--text-secondary)]">
                        {formatAmount(payment.amount)}
                      </span>
                      <span className="text-sm text-[var(--text-secondary)]">
                        {formatDate(payment.date)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-[var(--foreground)]">{payment.customerName}</p>
                    <p className="text-sm text-[var(--text-secondary)]">{payment.customerEmail}</p>
                  </div>
                  <ChevronDown className={cn(
                    "w-5 h-5 text-[var(--text-secondary)] transition-transform",
                    expandedPaymentId === payment.id && "rotate-180"
                  )} />
                </div>
              </button>

              {/* Payment Details */}
              {expandedPaymentId === payment.id && (
                <div className="border-t border-[var(--border-color)] p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <h4 className="text-sm font-medium text-[var(--text-secondary)] mb-4">
                        Payment Details
                      </h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[var(--text-secondary)]">Type</span>
                          <span className="text-[var(--foreground)] capitalize">{payment.type}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[var(--text-secondary)]">Amount</span>
                          <span className="text-[var(--foreground)]">{formatAmount(payment.amount)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[var(--text-secondary)]">Date</span>
                          <span className="text-[var(--foreground)]">{formatDate(payment.date)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[var(--text-secondary)]">Status</span>
                          <span className="text-[var(--foreground)] capitalize">{payment.status}</span>
                        </div>
                      </div>
                    </div>

                    {payment.subscriptionDetails && (
                      <div>
                        <h4 className="text-sm font-medium text-[var(--text-secondary)] mb-4">
                          Subscription Details
                        </h4>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-[var(--text-secondary)]">Plan</span>
                            <span className="text-[var(--foreground)]">
                              {payment.subscriptionDetails.plan}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-[var(--text-secondary)]">Billing Interval</span>
                            <span className="text-[var(--foreground)] capitalize">
                              {payment.subscriptionDetails.interval}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-[var(--text-secondary)]">Next Billing</span>
                            <span className="text-[var(--foreground)]">
                              {formatDate(payment.subscriptionDetails.nextBilling)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-[var(--text-secondary)]">Status</span>
                            <span className="text-[var(--foreground)] capitalize">
                              {payment.subscriptionDetails.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {payment.paymentPlanDetails && (
                      <div>
                        <h4 className="text-sm font-medium text-[var(--text-secondary)] mb-4">
                          Payment Plan Details
                        </h4>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-[var(--text-secondary)]">Total Amount</span>
                            <span className="text-[var(--foreground)]">
                              {formatAmount(payment.paymentPlanDetails.totalAmount)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-[var(--text-secondary)]">Installment Amount</span>
                            <span className="text-[var(--foreground)]">
                              {formatAmount(payment.paymentPlanDetails.installments.amount)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-[var(--text-secondary)]">Progress</span>
                            <span className="text-[var(--foreground)]">
                              {payment.paymentPlanDetails.installments.completed} of {payment.paymentPlanDetails.installments.total} payments
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-[var(--text-secondary)]">Next Payment</span>
                            <span className="text-[var(--foreground)]">
                              {formatDate(payment.paymentPlanDetails.installments.nextPaymentDate)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-[var(--text-secondary)]">Status</span>
                            <span className="text-[var(--foreground)] capitalize">
                              {payment.paymentPlanDetails.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {payment.expenseDetails && (
                      <div>
                        <h4 className="text-sm font-medium text-[var(--text-secondary)] mb-4">
                          Expense Details
                        </h4>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-[var(--text-secondary)]">Type</span>
                            <span className="text-[var(--foreground)] capitalize">
                              {payment.expenseDetails.type}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-[var(--text-secondary)]">Category</span>
                            <span className="text-[var(--foreground)]">
                              {payment.expenseDetails.category}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-[var(--text-secondary)]">Start Date</span>
                            <span className="text-[var(--foreground)]">
                              {formatDate(payment.expenseDetails.startDate)}
                            </span>
                          </div>
                          {payment.expenseDetails.endDate && (
                            <div className="flex items-center justify-between">
                              <span className="text-[var(--text-secondary)]">End Date</span>
                              <span className="text-[var(--foreground)]">
                                {formatDate(payment.expenseDetails.endDate)}
                              </span>
                            </div>
                          )}
                          {payment.expenseDetails.interval && (
                            <div className="flex items-center justify-between">
                              <span className="text-[var(--text-secondary)]">Interval</span>
                              <span className="text-[var(--foreground)] capitalize">
                                {payment.expenseDetails.interval}
                              </span>
                            </div>
                          )}
                          {payment.expenseDetails.nextPaymentDate && (
                            <div className="flex items-center justify-between">
                              <span className="text-[var(--text-secondary)]">Next Payment</span>
                              <span className="text-[var(--foreground)]">
                                {formatDate(payment.expenseDetails.nextPaymentDate)}
                              </span>
                            </div>
                          )}
                          <div className="flex items-center justify-between">
                            <span className="text-[var(--text-secondary)]">Status</span>
                            <span className="text-[var(--foreground)] capitalize">
                              {payment.expenseDetails.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end mt-6 gap-3">
                    <button className="px-4 py-2 rounded-lg border border-[var(--border-color)] hover:border-[var(--accent)] transition-colors">
                      View Receipt
                    </button>
                    {payment.status !== 'refunded' && (
                      <button className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors">
                        Issue Refund
                      </button>
                    )}
                    {payment.type === 'expense' && payment.expenseDetails?.status === 'active' && (
                      <button className="px-4 py-2 rounded-lg border border-red-500 text-red-500 hover:bg-red-500 hover:text-white transition-colors">
                        Cancel Expense
                      </button>
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
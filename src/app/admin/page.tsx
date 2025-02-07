'use client';

import React, { useState } from 'react';
import { 
  Users, 
  CreditCard, 
  Brain, 
  Book, 
  Settings, 
  ChevronRight,
  BarChart3,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Tag,
  Link as LinkIcon,
  DollarSign
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { useRouter } from 'next/navigation';

interface DashboardCard {
  title: string;
  value: string | number;
  change?: {
    value: number;
    trend: 'up' | 'down';
  };
  icon: React.ReactNode;
}

interface AlertItem {
  id: string;
  message: string;
  type: 'warning' | 'success';
  timestamp: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<'overview' | 'users' | 'content' | 'ai' | 'offers' | 'links' | 'payments' | 'expenses'>('overview');
  const [activeMetric, setActiveMetric] = useState<'users' | 'revenue' | 'mrr' | 'new-users'>('users');

  // Mock data for the dashboard
  const dashboardCards: DashboardCard[] = [
    {
      title: 'Total Users',
      value: '2,547',
      change: { value: 12.5, trend: 'up' },
      icon: <Users className="w-6 h-6" />
    },
    {
      title: 'Total Monthly Revenue',
      value: '$24,892',
      change: { value: 8.2, trend: 'up' },
      icon: <CreditCard className="w-6 h-6" />
    },
    {
      title: 'Monthly Recurring Revenue',
      value: '$18,450',
      change: { value: 15.3, trend: 'up' },
      icon: <TrendingUp className="w-6 h-6" />
    },
    {
      title: 'New Users',
      value: '128',
      change: { value: 22.4, trend: 'up' },
      icon: <Users className="w-6 h-6" />
    }
  ];

  // Mock alerts
  const alerts: AlertItem[] = [
    {
      id: '1',
      message: 'New course completion rate above target',
      type: 'success',
      timestamp: '2 hours ago'
    },
    {
      id: '2',
      message: 'AI credit usage spike detected',
      type: 'warning',
      timestamp: '5 hours ago'
    },
    {
      id: '3',
      message: 'Monthly revenue target achieved',
      type: 'success',
      timestamp: '1 day ago'
    }
  ];

  const navigationItems = [
    { id: 'overview', label: 'Overview', icon: <BarChart3 className="w-5 h-5" /> },
    { id: 'users', label: 'Users', icon: <Users className="w-5 h-5" />, href: '/admin/users' },
    { id: 'content', label: 'Content', icon: <Book className="w-5 h-5" />, href: '/admin/content' },
    { id: 'ai', label: 'AI Engine', icon: <Brain className="w-5 h-5" />, href: '/admin/ai' },
    { id: 'offers', label: 'Offers', icon: <Tag className="w-5 h-5" />, href: '/admin/offers' },
    { id: 'links', label: 'Links', icon: <LinkIcon className="w-5 h-5" />, href: '/admin/links' },
    { id: 'payments', label: 'Payments', icon: <CreditCard className="w-5 h-5" />, href: '/admin/payments' },
    { id: 'expenses', label: 'Expenses', icon: <DollarSign className="w-5 h-5" />, href: '/admin/expenses' }
  ];

  const handleNavigation = (item: typeof navigationItems[0]) => {
    setActiveSection(item.id as any);
    if (item.href) {
      router.push(item.href);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Top Navigation */}
      <div className="border-b border-[var(--border-color)] bg-[var(--background)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-semibold text-[var(--foreground)]">Admin Dashboard</h1>
            <button className="p-2 rounded-lg hover:bg-[var(--hover-bg)] transition-colors">
              <Settings className="w-6 h-6 text-[var(--text-secondary)]" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="flex gap-2 mb-8 p-1 bg-[var(--card-bg)] rounded-lg border border-[var(--border-color)] overflow-x-auto">
          {navigationItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavigation(item)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-md transition-all whitespace-nowrap",
                activeSection === item.id
                  ? "bg-[var(--accent)] text-white"
                  : "hover:bg-[var(--hover-bg)] text-[var(--text-secondary)]"
              )}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </div>

        {/* Dashboard Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {dashboardCards.map((card, index) => (
            <div
              key={index}
              className="p-6 rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] hover:border-[var(--accent)] transition-colors"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 rounded-lg bg-[var(--hover-bg)]">
                  {card.icon}
                </div>
                {card.change && (
                  <div className={cn(
                    "flex items-center gap-1 text-sm",
                    card.change.trend === 'up' ? 'text-green-500' : 'text-red-500'
                  )}>
                    <TrendingUp className={cn(
                      "w-4 h-4",
                      card.change.trend === 'down' && "rotate-180"
                    )} />
                    <span>{card.change.value}%</span>
                  </div>
                )}
              </div>
              <h3 className="text-[var(--text-secondary)] text-sm mb-1">{card.title}</h3>
              <p className="text-2xl font-semibold text-[var(--foreground)]">{card.value}</p>
            </div>
          ))}
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Activity Chart */}
          <div className="lg:col-span-2 p-6 rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-[var(--foreground)]">Activity Overview</h2>
              <div className="flex gap-2 p-1 bg-[var(--hover-bg)] rounded-lg">
                <button
                  onClick={() => setActiveMetric('users')}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-sm transition-all whitespace-nowrap",
                    activeMetric === 'users'
                      ? "bg-[var(--accent)] text-white"
                      : "hover:bg-[var(--card-bg)] text-[var(--text-secondary)]"
                  )}
                >
                  Total Users
                </button>
                <button
                  onClick={() => setActiveMetric('revenue')}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-sm transition-all whitespace-nowrap",
                    activeMetric === 'revenue'
                      ? "bg-[var(--accent)] text-white"
                      : "hover:bg-[var(--card-bg)] text-[var(--text-secondary)]"
                  )}
                >
                  Monthly Revenue
                </button>
                <button
                  onClick={() => setActiveMetric('mrr')}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-sm transition-all whitespace-nowrap",
                    activeMetric === 'mrr'
                      ? "bg-[var(--accent)] text-white"
                      : "hover:bg-[var(--card-bg)] text-[var(--text-secondary)]"
                  )}
                >
                  MRR
                </button>
                <button
                  onClick={() => setActiveMetric('new-users')}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-sm transition-all whitespace-nowrap",
                    activeMetric === 'new-users'
                      ? "bg-[var(--accent)] text-white"
                      : "hover:bg-[var(--card-bg)] text-[var(--text-secondary)]"
                  )}
                >
                  New Users
                </button>
              </div>
            </div>
            <div className="h-[300px] flex items-center justify-center text-[var(--text-secondary)]">
              {activeMetric === 'users' && "Total Users chart will be implemented here"}
              {activeMetric === 'revenue' && "Monthly Revenue chart will be implemented here"}
              {activeMetric === 'mrr' && "Monthly Recurring Revenue chart will be implemented here"}
              {activeMetric === 'new-users' && "New Users chart will be implemented here"}
            </div>
          </div>

          {/* Recent Alerts */}
          <div className="p-6 rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)]">
            <h2 className="text-xl font-semibold text-[var(--foreground)] mb-6">Recent Alerts</h2>
            <div className="space-y-4">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className="p-4 rounded-lg bg-[var(--hover-bg)] flex items-start gap-3"
                >
                  {alert.type === 'warning' ? (
                    <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0" />
                  ) : (
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[var(--foreground)] mb-1">{alert.message}</p>
                    <p className="text-xs text-[var(--text-secondary)]">{alert.timestamp}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-[var(--text-secondary)] flex-shrink-0" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

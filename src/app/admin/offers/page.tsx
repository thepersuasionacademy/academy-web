'use client';

import React, { useState } from 'react';
import { 
  Search, 
  Filter,
  ChevronLeft,
  MoreVertical,
  Plus,
  Tag,
  Calendar,
  Users,
  DollarSign,
  Clock,
  Percent
} from 'lucide-react';
import { cn } from "@/lib/utils";
import Link from 'next/link';

interface Offer {
  id: string;
  title: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  startDate: string;
  endDate: string | null;
  usageLimit: number | null;
  usageCount: number;
  status: 'active' | 'scheduled' | 'expired' | 'draft';
  applicableTo: {
    type: 'content' | 'collection' | 'all';
    name: string;
  };
}

export default function OffersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<Offer['status'] | 'all'>('all');

  // Mock offers data
  const offers: Offer[] = [
    {
      id: '1',
      title: 'Early Bird Special',
      description: 'Get 20% off on all leadership courses',
      discountType: 'percentage',
      discountValue: 20,
      startDate: '2024-03-01',
      endDate: '2024-04-30',
      usageLimit: 100,
      usageCount: 45,
      status: 'active',
      applicableTo: {
        type: 'collection',
        name: 'Leadership'
      }
    },
    {
      id: '2',
      title: 'Summer Bundle',
      description: '$50 off when you buy any 2 courses',
      discountType: 'fixed',
      discountValue: 50,
      startDate: '2024-06-01',
      endDate: '2024-08-31',
      usageLimit: null,
      usageCount: 0,
      status: 'scheduled',
      applicableTo: {
        type: 'all',
        name: 'All Courses'
      }
    },
    {
      id: '3',
      title: 'Flash Sale',
      description: '30% off on Persuasion Mastery',
      discountType: 'percentage',
      discountValue: 30,
      startDate: '2024-02-15',
      endDate: '2024-02-20',
      usageLimit: 50,
      usageCount: 50,
      status: 'expired',
      applicableTo: {
        type: 'content',
        name: 'Persuasion Mastery'
      }
    }
  ];

  const statusOptions = [
    { value: 'all', label: 'All Offers' },
    { value: 'active', label: 'Active' },
    { value: 'scheduled', label: 'Scheduled' },
    { value: 'expired', label: 'Expired' },
    { value: 'draft', label: 'Draft' }
  ];

  // Filter offers based on search and status
  const filteredOffers = offers.filter(offer => {
    const matchesSearch = offer.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         offer.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || offer.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: Offer['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-500';
      case 'scheduled':
        return 'bg-blue-500';
      case 'expired':
        return 'bg-gray-500';
      case 'draft':
        return 'bg-yellow-500';
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

  const formatDiscount = (type: Offer['discountType'], value: number) => {
    return type === 'percentage' ? `${value}%` : `$${value}`;
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
              <h1 className="text-2xl font-semibold text-[var(--foreground)]">Offers</h1>
            </div>
            <button className="px-4 py-2 bg-[var(--accent)] text-white rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2">
              <Plus className="w-5 h-5" />
              <span>New Offer</span>
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
              placeholder="Search offers..."
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

        {/* Status Filter */}
        <div className="mb-8 overflow-x-auto">
          <div className="flex gap-2 min-w-max">
            {statusOptions.map((status) => (
              <button
                key={status.value}
                onClick={() => setSelectedStatus(status.value as Offer['status'] | 'all')}
                className={cn(
                  "px-4 py-2 rounded-lg transition-all whitespace-nowrap",
                  selectedStatus === status.value
                    ? "bg-[var(--accent)] text-white"
                    : "bg-[var(--card-bg)] border border-[var(--border-color)] hover:border-[var(--accent)]"
                )}
              >
                {status.label}
              </button>
            ))}
          </div>
        </div>

        {/* Offers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOffers.map((offer) => (
            <div
              key={offer.id}
              className="border border-[var(--border-color)] rounded-lg overflow-hidden hover:border-[var(--accent)] transition-colors bg-[var(--card-bg)]"
            >
              <div className="p-6">
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Tag className="w-4 h-4 text-[var(--accent)]" />
                      <span className={cn(
                        "px-2 py-1 rounded-md text-xs text-white",
                        getStatusColor(offer.status)
                      )}>
                        {offer.status}
                      </span>
                    </div>
                    <h3 className="text-lg font-medium text-[var(--foreground)]">
                      {offer.title}
                    </h3>
                  </div>
                  <button className="p-2 rounded-lg hover:bg-[var(--hover-bg)] transition-colors">
                    <MoreVertical className="w-5 h-5 text-[var(--text-secondary)]" />
                  </button>
                </div>

                {/* Description */}
                <p className="text-sm text-[var(--text-secondary)] mb-4">
                  {offer.description}
                </p>

                {/* Details */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                    <Percent className="w-4 h-4" />
                    <span>
                      {formatDiscount(offer.discountType, offer.discountValue)} off
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {formatDate(offer.startDate)}
                      {offer.endDate && ` - ${formatDate(offer.endDate)}`}
                    </span>
                  </div>
                  {offer.usageLimit && (
                    <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                      <Users className="w-4 h-4" />
                      <span>{offer.usageCount} / {offer.usageLimit} used</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                    <Tag className="w-4 h-4" />
                    <span>{offer.applicableTo.name}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 
'use client';

import React, { useState } from 'react';
import { 
  Search, 
  Filter,
  ChevronLeft,
  Plus,
} from 'lucide-react';
import { cn } from "@/lib/utils";
import Link from 'next/link';
import OffersView from './components/OffersView';
import BundlesView from './components/BundlesView';

type ViewType = 'offers' | 'bundles';

export default function OffersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<'active' | 'draft' | 'all'>('all');
  const [selectedView, setSelectedView] = useState<ViewType>('offers');
  const [isBundleModalOpen, setIsBundleModalOpen] = useState(false);
  const [selectedBundle, setSelectedBundle] = useState<any>(null);

  const handleBundleClick = (bundle?: any) => {
    setSelectedBundle(bundle || null);
    setIsBundleModalOpen(true);
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
              <h1 className="text-2xl font-semibold text-[var(--foreground)]">
                {selectedView === 'offers' ? 'Offers' : 'Access Bundles'}
              </h1>
            </div>
            <button 
              onClick={() => selectedView === 'bundles' ? handleBundleClick() : undefined}
              className="px-4 py-2 bg-[var(--accent)] text-white rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              <span>{selectedView === 'offers' ? 'New Offer' : 'New Bundle'}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* View Selector */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex rounded-lg border border-[var(--border-color)] p-1.5 bg-[var(--card-bg)]">
            <button
              onClick={() => setSelectedView('offers')}
              className={cn(
                "px-6 py-3 rounded-md text-lg font-semibold transition-all min-w-[140px] border-2",
                selectedView === 'offers'
                  ? "bg-[var(--hover-bg)] text-[var(--foreground)] border-[var(--accent)]"
                  : "text-[var(--text-secondary)] hover:text-[var(--foreground)] border-transparent"
              )}
            >
              Offers
            </button>
            <button
              onClick={() => setSelectedView('bundles')}
              className={cn(
                "px-6 py-3 rounded-md text-lg font-semibold transition-all min-w-[140px] border-2",
                selectedView === 'bundles'
                  ? "bg-[var(--hover-bg)] text-[var(--foreground)] border-[var(--accent)]"
                  : "text-[var(--text-secondary)] hover:text-[var(--foreground)] border-transparent"
              )}
            >
              Access Bundles
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-secondary)]" />
            <input
              type="text"
              placeholder={selectedView === 'offers' ? "Search offers..." : "Search bundles..."}
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

        {/* Content */}
        {selectedView === 'offers' ? (
          <OffersView
            searchQuery={searchQuery}
            selectedStatus={selectedStatus}
            onStatusChange={setSelectedStatus}
          />
        ) : (
          <BundlesView
            searchQuery={searchQuery}
            isModalOpen={isBundleModalOpen}
            onModalClose={() => {
              setIsBundleModalOpen(false);
              setSelectedBundle(null);
            }}
            onBundleClick={handleBundleClick}
          />
        )}
      </div>
    </div>
  );
} 
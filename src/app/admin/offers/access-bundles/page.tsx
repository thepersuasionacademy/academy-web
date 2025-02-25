'use client';

import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter,
  ChevronLeft,
  Plus,
  Loader2
} from 'lucide-react';
import { cn } from "@/lib/utils";
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { AccessBundleModal } from '../components/AccessBundleModal';

interface BundleVariation {
  id: string;
  name?: string;         // Name might come as 'name' or 'variation_name'
  variation_name?: string; // In the SQL function it uses 'variation_name'
  description?: string;
  templates?: any[];
}

// Bundle interface for data from the database
interface Bundle {
  id: string;
  name: string;
  description: string;
  variations: BundleVariation[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

// Bundle interface for the modal
interface BundleForModal {
  id: string;
  name: string;
  description: string;
  variations: {
    id: string;
    name: string;
    variation_name?: string;
    templates?: any[];
    description?: string;
  }[];
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
}

export default function AccessBundlesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBundle, setSelectedBundle] = useState<BundleForModal | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchBundles = async () => {
      try {
        setIsLoading(true);
        const supabase = createClientComponentClient();
        
        // Add console logs to debug the RPC call and response
        console.log('Calling get_access_bundle_cards RPC function...');
        const { data, error } = await supabase.rpc('get_access_bundle_cards');
        console.log('RPC response:', { data, error });
        
        if (error) {
          throw new Error(error.message);
        }
        
        // Log raw data structure for debugging
        console.log('Raw data structure:', data);
        
        if (data?.success && Array.isArray(data?.bundles)) {
          console.log('Bundles found:', data.bundles.length);
          setBundles(data.bundles);
        } else {
          console.log('No bundles or invalid data format:', data);
          setBundles([]);
        }
      } catch (err) {
        console.error('Error fetching access bundles:', err);
        setError(err instanceof Error ? err.message : 'Failed to load access bundles');
      } finally {
        setIsLoading(false);
      }
    };

    fetchBundles();
  }, []);

  // Handle opening modal to create a new bundle
  const handleNewBundle = () => {
    setSelectedBundle(null);
    setIsModalOpen(true);
  };

  // Handle clicking on a bundle to edit
  const handleBundleClick = (bundle: Bundle) => {
    console.log('Selected bundle for editing:', bundle);
    
    // Transform bundle to match the expected format for the modal
    const bundleForModal: BundleForModal = {
      id: bundle.id,
      name: bundle.name,
      description: bundle.description,
      // Ensure each variation has name as a string (not undefined)
      variations: bundle.variations.map(v => ({
        id: v.id,
        name: v.name || v.variation_name || 'Unnamed Variation',
        variation_name: v.variation_name,
        description: v.description,
        templates: v.templates || []
      })),
      createdAt: bundle.createdAt,
      updatedAt: bundle.updatedAt,
      createdBy: bundle.createdBy
    };
    
    setSelectedBundle(bundleForModal);
    setIsModalOpen(true);
  };

  // Handle modal close
  const handleCloseModal = () => {
    setIsModalOpen(false);
    // Optionally refresh bundles when modal closes
    // fetchBundles();
  };

  // Filter bundles based on search query
  const filteredBundles = bundles.filter(bundle => 
    bundle.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    bundle.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
              <h1 className="text-2xl font-semibold text-[var(--foreground)]">Access Bundles</h1>
            </div>
            <button 
              onClick={handleNewBundle}
              className="px-4 py-2 bg-[var(--accent)] text-white rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              <span>New Bundle</span>
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
              placeholder="Search bundles..."
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

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center items-center py-16">
            <Loader2 className="w-8 h-8 text-[var(--accent)] animate-spin" />
            <span className="ml-2 text-[var(--text-secondary)]">Loading bundles...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="p-4 rounded-lg bg-red-100 border border-red-300 text-red-800 my-4">
            <p>Error: {error}</p>
            <button 
              className="mt-2 px-3 py-1 bg-red-200 rounded-md hover:bg-red-300 transition-colors"
              onClick={() => window.location.reload()}
            >
              Retry
            </button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && filteredBundles.length === 0 && (
          <div className="text-center py-16">
            <p className="text-[var(--text-secondary)] text-lg">
              {searchQuery ? 'No bundles match your search.' : 'No access bundles found.'}
            </p>
            <button 
              onClick={handleNewBundle}
              className="mt-4 inline-block px-4 py-2 bg-[var(--accent)] text-white rounded-lg hover:opacity-90 transition-opacity"
            >
              Create your first bundle
            </button>
          </div>
        )}

        {/* Bundles Grid */}
        {!isLoading && !error && filteredBundles.length > 0 && (
          <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBundles.map((bundle) => (
              <div
                key={bundle.id}
                className={cn(
                  "group relative rounded-2xl p-6",
                  "border border-[var(--border-color)]",
                  "transition-all duration-300",
                  "bg-[#fafafa] hover:bg-white dark:bg-[var(--card-bg)]",
                  "hover:scale-[1.02] hover:shadow-lg",
                  "hover:border-[var(--accent)]",
                  "cursor-pointer",
                  "flex flex-col min-h-[220px]"
                )}
                onClick={() => handleBundleClick(bundle)}
              >
                <div className="space-y-4">
                  <h3 className="text-2xl font-bold text-[var(--foreground)] transition-colors">
                    {bundle.name}
                  </h3>
                  <p className="text-lg text-[var(--text-secondary)] line-clamp-2 group-hover:text-[var(--foreground)] transition-colors">
                    {bundle.description}
                  </p>
                </div>

                <div className="mt-auto pt-6">
                  <div className="flex flex-wrap gap-2">
                    {bundle.variations && bundle.variations.map((variation) => (
                      <div
                        key={variation.id}
                        className={cn(
                          "px-3 py-1 rounded-lg text-sm font-medium",
                          "border border-[var(--text-secondary)] bg-[var(--card-bg)]",
                          "text-[var(--text-secondary)]",
                          "group-hover:border-[var(--accent)]",
                          "transition-colors"
                        )}
                      >
                        {variation.name || variation.variation_name}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Bundle Modal */}
        {isModalOpen && (
          <AccessBundleModal
            isOpen={isModalOpen}
            onClose={handleCloseModal}
            bundle={selectedBundle || undefined}
          />
        )}
      </div>
    </div>
  );
} 
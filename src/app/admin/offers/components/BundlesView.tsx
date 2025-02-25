import React, { useEffect, useState } from 'react';
import { cn } from "@/lib/utils";
import { AccessBundleModal } from './AccessBundleModal';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Loader2 } from 'lucide-react';

// Define interface for the bundle data expected by AccessBundleModal
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

interface BundleVariation {
  id: string;
  name?: string;
  variation_name?: string;
  description?: string;
  templates?: any[];
}

interface Bundle {
  id: string;
  name: string;
  description: string;
  variations: BundleVariation[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

interface BundlesViewProps {
  searchQuery: string;
  isModalOpen: boolean;
  onModalClose: () => void;
  onBundleClick: (bundle?: Bundle) => void;
}

export default function BundlesView({ searchQuery, isModalOpen, onModalClose, onBundleClick }: BundlesViewProps) {
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBundle, setSelectedBundle] = useState<BundleForModal | null>(null);
  
  useEffect(() => {
    const fetchBundles = async () => {
      try {
        setIsLoading(true);
        const supabase = createClientComponentClient();
        
        console.log('Calling get_access_bundle_cards RPC function...');
        const { data, error } = await supabase.rpc('get_access_bundle_cards');
        console.log('RPC response:', { data, error });
        
        if (error) {
          throw new Error(error.message);
        }
        
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

  // Handle bundle click to set the selected bundle and open modal
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
    onBundleClick(bundle);
  };

  // Filter bundles based on search
  const filteredBundles = bundles.filter(bundle => 
    bundle.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    bundle.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
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
            className="mt-4 px-4 py-2 bg-[var(--accent)] text-white rounded-lg hover:opacity-90 transition-opacity"
            onClick={() => onBundleClick()}
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
      
      {/* Modal */}
      {isModalOpen && (
        <AccessBundleModal
          isOpen={isModalOpen}
          onClose={onModalClose}
          bundle={selectedBundle || undefined}
        />
      )}
    </>
  );
} 
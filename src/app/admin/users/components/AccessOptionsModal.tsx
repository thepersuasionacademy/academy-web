import React, { useRef, useEffect, useState } from 'react';
import { X, Search, Filter, ChevronDown, Loader2 } from 'lucide-react';
import { BundleGroup } from '../types';

interface AccessOptionsModalProps {
  showAccessModal: boolean;
  setShowAccessModal: (show: boolean) => void;
  selectedUsers: string[];
  bundleGroups: BundleGroup[];
  bundleSearchQuery: string;
  setBundleSearchQuery: (query: string) => void;
  dropdownOpen: boolean;
  setDropdownOpen: (open: boolean) => void;
  selectedBundle: BundleGroup | null;
  setSelectedBundle: (bundle: BundleGroup | null) => void;
  selectedVariation: string | null;
  setSelectedVariation: (variation: string | null) => void;
  handleApplyAccess: () => void;
  loadingBundles: boolean;
  error?: string | null;
}

export const AccessOptionsModal: React.FC<AccessOptionsModalProps> = ({
  showAccessModal,
  setShowAccessModal,
  selectedUsers,
  bundleGroups,
  bundleSearchQuery,
  setBundleSearchQuery,
  dropdownOpen,
  setDropdownOpen,
  selectedBundle,
  setSelectedBundle,
  selectedVariation,
  setSelectedVariation,
  handleApplyAccess,
  loadingBundles,
  error
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [setDropdownOpen]);

  // Filter bundles based on search query
  const filteredBundles = bundleGroups.filter(bundle =>
    bundle.bundleName.toLowerCase().includes(bundleSearchQuery.toLowerCase())
  );

  // Close modal handlers
  const handleClose = () => {
    setShowAccessModal(false);
  };

  if (!showAccessModal) return null;

  return (
    <>
      {/* Modal Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-30"
        onClick={handleClose}
      />
      
      {/* Modal Content */}
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-[var(--background)] rounded-lg shadow-2xl border border-[var(--border-color)] p-6 w-full max-w-xl z-40">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Manage Access Options</h2>
          <button 
            onClick={handleClose}
            className="p-1 rounded-full hover:bg-[var(--hover-bg)]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-md">
            {error}
          </div>
        )}
        
        <div className="mb-6">
          <p className="text-[var(--text-secondary)] mb-4">
            Select a bundle and variation to grant access to the selected {selectedUsers.length} {selectedUsers.length === 1 ? 'user' : 'users'}.
          </p>
          
          {/* Bundle Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Bundle</label>
            <div className="relative" ref={dropdownRef}>
              <div
                className="flex items-center justify-between px-4 py-2 border border-[var(--border-color)] rounded-lg bg-[var(--card-bg)] cursor-pointer"
                onClick={() => setDropdownOpen(!dropdownOpen)}
              >
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-[var(--text-secondary)]" />
                  <span>{selectedBundle ? selectedBundle.bundleName : 'Select a bundle'}</span>
                </div>
                <ChevronDown className="w-4 h-4 text-[var(--text-secondary)]" />
              </div>
              
              {dropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                  <div className="p-2">
                    <div className="relative mb-2">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
                      <input
                        type="text"
                        placeholder="Search bundles..."
                        value={bundleSearchQuery}
                        onChange={(e) => setBundleSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--background)] text-[var(--foreground)] placeholder-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent)]"
                      />
                    </div>
                    
                    {loadingBundles ? (
                      <div className="py-4 flex justify-center">
                        <Loader2 className="w-5 h-5 animate-spin text-[var(--accent)]" />
                      </div>
                    ) : error ? (
                      <div className="py-2 px-3 text-red-500 text-sm">
                        {error}
                      </div>
                    ) : filteredBundles.length === 0 ? (
                      <div className="py-2 px-3 text-[var(--text-secondary)] text-sm">
                        No bundles found
                      </div>
                    ) : (
                      filteredBundles.map((bundle) => (
                        <div
                          key={bundle.bundleId}
                          className="py-2 px-3 hover:bg-[var(--hover-bg)] rounded cursor-pointer"
                          onClick={() => {
                            setSelectedBundle(bundle);
                            setSelectedVariation(null);
                            setDropdownOpen(false);
                          }}
                        >
                          {bundle.bundleName}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Variation Selection - Only shown when a bundle is selected */}
          {selectedBundle && selectedBundle.variations.length > 0 && (
            <div>
              <label className="block text-sm font-medium mb-2">Variation <span className="text-red-500">*</span></label>
              <p className="text-sm text-[var(--text-secondary)] mb-2">
                Select a variation to grant access to. Access is managed at the variation level.
              </p>
              <div className="flex flex-wrap gap-2">
                {selectedBundle.variations.map((variation) => (
                  <button
                    key={variation.variationId}
                    className={`px-3 py-1 rounded-full border ${
                      selectedVariation === variation.variationId
                        ? 'bg-[var(--accent)] text-white border-[var(--accent)]'
                        : 'border-[var(--border-color)] hover:bg-[var(--hover-bg)]'
                    }`}
                    onClick={() => setSelectedVariation(variation.variationId)}
                  >
                    {variation.variationName}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <div className="flex justify-end gap-3">
          <button
            onClick={handleClose}
            className="px-4 py-2 border border-[var(--border-color)] rounded-lg hover:bg-[var(--hover-bg)]"
          >
            Cancel
          </button>
          <button
            onClick={handleApplyAccess}
            disabled={!selectedBundle || !selectedVariation}
            className={`px-4 py-2 rounded-lg text-white ${
              !selectedBundle || !selectedVariation
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            Apply Access
          </button>
        </div>
      </div>
    </>
  );
}; 
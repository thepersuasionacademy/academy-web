import React from 'react';
import type { BundleGroup } from '../types.js';

interface ViewModePillsProps {
  viewMode: 'bundles' | 'variations' | 'none';
  setViewMode: (mode: 'bundles' | 'variations' | 'none') => void;
  selectedList: string | null;
  setSelectedList: (listId: string | null) => void;
  bundleGroups: BundleGroup[];
}

export function ViewModePills({ 
  viewMode, 
  setViewMode, 
  selectedList, 
  setSelectedList, 
  bundleGroups 
}: ViewModePillsProps) {
  return (
    <div className="flex mb-4 px-2">
      <button
        className={`px-4 py-2 rounded-full mr-2 font-medium text-sm transition-colors ${
          selectedList === 'all-users' && viewMode !== 'bundles'
            ? 'border-2 border-[var(--accent)]' 
            : 'border border-[var(--border-color)] text-[var(--text-secondary)] hover:border-[var(--accent)]'
        }`}
        onClick={() => {
          // Force a re-fetch by setting to null first if already on all-users
          if (selectedList === 'all-users') {
            setSelectedList(null);
            setTimeout(() => {
              setSelectedList('all-users');
              // Reset view mode to neither bundles nor variations
              setViewMode('none');
            }, 0);
          } else {
            setSelectedList('all-users');
            // Reset view mode to neither bundles nor variations
            setViewMode('none');
          }
        }}
      >
        All
      </button>
      <button
        className={`px-4 py-2 rounded-full mr-2 font-medium text-sm transition-colors ${
          viewMode === 'bundles' && selectedList !== 'all-users'
            ? 'border-2 border-[var(--accent)]' 
            : 'border border-[var(--border-color)] text-[var(--text-secondary)] hover:border-[var(--accent)]'
        }`}
        onClick={() => {
          setViewMode('bundles');
          // If we're on "All", switch to a specific list
          if (selectedList === 'all-users' && bundleGroups.length > 0 && bundleGroups[0].bundleList) {
            setSelectedList(bundleGroups[0].bundleList.id);
          }
        }}
      >
        Bundles
      </button>
    </div>
  );
} 
import React from 'react';

interface ListTypeTabsProps {
  listType: 'auto' | 'custom';
  setListType: (type: 'auto' | 'custom') => void;
  selectedList: string | null;
  clearFilters: () => void;
}

export function ListTypeTabs({ listType, setListType, selectedList, clearFilters }: ListTypeTabsProps) {
  return (
    <div className="flex justify-center border-b border-[var(--border-color)] mb-4">
      <div className="inline-flex">
        <button
          className={`px-6 py-3 font-medium relative text-[var(--foreground)]`}
          onClick={() => setListType('auto')}
        >
          Auto Lists
          {listType === 'auto' && (
            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[var(--accent)]"></div>
          )}
        </button>
        <button
          className={`px-6 py-3 font-medium relative text-[var(--foreground)]`}
          onClick={() => setListType('custom')}
        >
          Custom Lists
          {listType === 'custom' && (
            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[var(--accent)]"></div>
          )}
        </button>
      </div>
      {selectedList && selectedList !== 'all-users' && (
        <div className="absolute right-4">
          <button 
            onClick={clearFilters}
            className="text-sm text-[var(--accent)] hover:underline"
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
} 
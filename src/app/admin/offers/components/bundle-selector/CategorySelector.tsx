import { useRef, useState, useEffect } from 'react';
import { Loader2, X, ArrowDownCircle, Check, Plus, Clock } from 'lucide-react';
import { cn } from "@/lib/utils";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { AICategory, DripSetting } from './types';
import { Pagination } from './Pagination';
import { DripSettingsInput } from './DripSettingsInput';

interface CategorySelectorProps {
  selectedCategoryId: string | null;
  selectedCategoryName: string | null;
  onCategorySelect: (category: AICategory) => void;
  onCategoryReset: () => void;
  collectionDripEnabled: boolean;
  toggleCollectionDrip: () => void;
  collectionDripSettings: DripSetting;
  updateCollectionDripValue: (value: number) => void;
  updateCollectionDripUnit: (unit: 'days' | 'weeks' | 'months') => void;
}

export function CategorySelector({
  selectedCategoryId,
  selectedCategoryName,
  onCategorySelect,
  onCategoryReset,
  collectionDripEnabled,
  toggleCollectionDrip,
  collectionDripSettings,
  updateCollectionDripValue,
  updateCollectionDripUnit
}: CategorySelectorProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState<AICategory[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const supabase = createClientComponentClient<any>();

  // Fetch categories on mount
  useEffect(() => {
    fetchCategories();
  }, []);
  
  // Handle outside click to close dropdown
  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      // Use Supabase RPC instead of API route
      const { data, error } = await supabase.rpc('list_collections');
      
      if (error) {
        console.error('Error fetching AI categories:', error);
        return;
      }
      
      if (Array.isArray(data)) {
        setCategories(data);
      } else {
        console.error('Invalid data format for categories:', data);
      }
    } catch (error) {
      console.error('Error fetching AI categories:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter categories based on search query
  const filteredCategories = categories.filter(category => 
    (category.title || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const resetSearch = () => {
    setSearchQuery('');
    setIsDropdownOpen(false);
  };

  return (
    <div ref={dropdownRef} className="relative w-full">
      {/* Category Display */}
      {selectedCategoryId && (
        <div className="space-y-2 mb-2">
          <div className="px-4 py-2 border border-[var(--border-color)] rounded-lg bg-[var(--hover-bg)] hover:bg-[var(--hover-bg)]/80">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-medium text-base">{selectedCategoryName || 'Selected Category'}</span>
              </div>
              <div className="flex items-center gap-2">
                {collectionDripEnabled && (
                  <DripSettingsInput 
                    value={collectionDripSettings}
                    onChange={updateCollectionDripValue}
                    onUnitChange={updateCollectionDripUnit}
                  />
                )}
                <button 
                  onClick={toggleCollectionDrip}
                  className={cn(
                    "flex items-center justify-center p-1 rounded-full",
                    collectionDripEnabled 
                      ? "bg-[var(--accent)]/10 text-[var(--accent)]" 
                      : "bg-[var(--hover-bg)]/50 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  )}
                >
                  {collectionDripEnabled ? (
                    <Clock className="w-3.5 h-3.5" />
                  ) : (
                    <Plus className="w-3.5 h-3.5" />
                  )}
                </button>
                <button 
                  onClick={onCategoryReset}
                  className="text-[var(--text-secondary)] hover:text-[var(--accent)] p-1 rounded-full hover:bg-[var(--hover-bg)]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Search Input */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search categories..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setIsDropdownOpen(true)}
          className="w-full px-4 py-3 bg-[var(--hover-bg)] border border-[var(--border-color)] rounded-lg focus:outline-none focus:border-[var(--accent)] transition-colors text-base"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="p-1 rounded-full hover:bg-[var(--hover-bg)]/80 text-[var(--text-secondary)]"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <ArrowDownCircle
            className={cn(
              "w-5 h-5 text-[var(--text-secondary)] transition-transform",
              isDropdownOpen && "rotate-180"
            )}
          />
        </div>
      </div>
      
      {/* Dropdown List */}
      {isDropdownOpen && (
        <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg shadow-lg max-h-[250px] overflow-y-auto">
          {/* Search input inside dropdown */}
          {selectedCategoryId && (
            <div className="p-2 border-b border-[var(--border-color)]">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search categories..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-3 py-2 bg-[var(--hover-bg)] border border-[var(--border-color)] rounded-md focus:outline-none focus:border-[var(--accent)] transition-colors text-sm"
                  autoFocus
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-[var(--hover-bg)]/80 text-[var(--text-secondary)]"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          )}
          
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-[var(--text-secondary)]" />
            </div>
          ) : filteredCategories.length === 0 ? (
            <div className="p-3 text-center text-sm text-[var(--text-secondary)]">
              {searchQuery ? "No matching categories found" : "No categories available"}
            </div>
          ) : (
            <>
              <div className="divide-y divide-[var(--border-color)]">
                {filteredCategories
                  .slice((page - 1) * 5, page * 5)
                  .map((category) => (
                    <button
                      key={category.id}
                      onClick={() => {
                        onCategorySelect(category);
                        setIsDropdownOpen(false);
                        resetSearch();
                      }}
                      className={cn(
                        "w-full px-4 py-3 text-left transition-colors text-base flex items-center justify-between",
                        selectedCategoryId === category.id
                          ? "bg-[var(--hover-bg)]"
                          : "hover:bg-[var(--hover-bg)]"
                      )}
                    >
                      <span className="font-medium">{category.title || 'Unnamed Category'}</span>
                      {selectedCategoryId === category.id && (
                        <Check className="w-4 h-4 text-[var(--text-secondary)]" />
                      )}
                    </button>
                  ))}
              </div>
              <Pagination 
                currentPage={page}
                totalItems={filteredCategories.length}
                onPageChange={setPage}
              />
            </>
          )}
        </div>
      )}
    </div>
  );
} 
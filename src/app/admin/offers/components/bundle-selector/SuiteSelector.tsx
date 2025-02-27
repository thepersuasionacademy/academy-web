import { useRef, useState, useEffect } from 'react';
import { Loader2, X, ArrowDownCircle, Check, Plus, Clock } from 'lucide-react';
import { cn } from "@/lib/utils";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { AISuite, DripSetting } from './types';
import { Pagination } from './Pagination';
import { DripSettingsInput } from './DripSettingsInput';

interface SuiteSelectorProps {
  categoryId: string;
  selectedSuiteId: string | null;
  selectedSuiteName: string | null;
  onSuiteSelect: (suite: AISuite) => void;
  onSuiteReset: () => void;
  suiteDripEnabled: boolean;
  toggleSuiteDrip: () => void;
  suiteDripSettings: DripSetting;
  updateSuiteDripValue: (value: number) => void;
  updateSuiteDripUnit: (unit: 'days' | 'weeks' | 'months') => void;
  collectionDripEnabled: boolean;
}

export function SuiteSelector({
  categoryId,
  selectedSuiteId,
  selectedSuiteName,
  onSuiteSelect,
  onSuiteReset,
  suiteDripEnabled,
  toggleSuiteDrip,
  suiteDripSettings,
  updateSuiteDripValue,
  updateSuiteDripUnit,
  collectionDripEnabled
}: SuiteSelectorProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [suites, setSuites] = useState<AISuite[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const supabase = createClientComponentClient<any>();

  // Fetch suites when category changes
  useEffect(() => {
    if (categoryId) {
      fetchSuites(categoryId);
    } else {
      setSuites([]);
    }
  }, [categoryId]);
  
  // Handle outside click to close dropdown
  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        // Don't close if target is within drip settings components
        const target = e.target as HTMLElement;
        const closestDripSettings = target.closest('.drip-settings-container');
        if (closestDripSettings) {
          // Clicking within drip settings - don't close dropdown
          console.log('🔥 PRESERVING DROPDOWN STATE - clicked within drip settings');
          return;
        }
        
        // Safe to close dropdown (click was outside)
        console.log('🔥 CLOSING DROPDOWN - outside click detected');
        setIsDropdownOpen(false);
      }
    }
    
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const fetchSuites = async (categoryId: string) => {
    setIsLoading(true);
    try {
      // Use Supabase RPC instead of API route
      const { data, error } = await supabase.rpc('get_suites_by_collection', {
        collection_id: categoryId
      });
      
      if (error) {
        console.error('Error fetching AI suites:', error);
        return;
      }
      
      if (Array.isArray(data)) {
        setSuites(data);
      } else {
        console.error('Invalid data format for suites:', data);
      }
    } catch (error) {
      console.error('Error fetching AI suites:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter suites based on search query
  const filteredSuites = suites.filter(suite => 
    (suite.title || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const resetSearch = () => {
    setSearchQuery('');
    setIsDropdownOpen(false);
  };

  return (
    <div ref={dropdownRef} className="relative w-full">
      {/* Suite Display */}
      {selectedSuiteId && (
        <div className="space-y-2 mb-2">
          <div className="px-4 py-2 border border-[var(--border-color)] rounded-lg bg-[var(--hover-bg)] hover:bg-[var(--hover-bg)]/80">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-medium text-base">{selectedSuiteName || 'Selected Suite'}</span>
              </div>
              <div className="flex items-center gap-2">
                {!collectionDripEnabled && suiteDripEnabled && (
                  <DripSettingsInput 
                    value={suiteDripSettings}
                    onChange={updateSuiteDripValue}
                    onUnitChange={updateSuiteDripUnit}
                  />
                )}
                <button 
                  onClick={toggleSuiteDrip}
                  className={cn(
                    "flex items-center justify-center p-1 rounded-full",
                    suiteDripEnabled 
                      ? "bg-[var(--accent)]/10 text-[var(--accent)]" 
                      : "bg-[var(--hover-bg)]/50 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  )}
                  disabled={collectionDripEnabled}
                >
                  {suiteDripEnabled ? (
                    <Clock className="w-3.5 h-3.5" />
                  ) : (
                    <Plus className="w-3.5 h-3.5" />
                  )}
                </button>
                <button 
                  onClick={onSuiteReset}
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
          placeholder="Search suites..."
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
          {selectedSuiteId && (
            <div className="p-2 border-b border-[var(--border-color)]">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search suites..."
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
          ) : filteredSuites.length === 0 ? (
            <div className="p-3 text-center text-sm text-[var(--text-secondary)]">
              {searchQuery ? "No matching suites found" : "No suites available in this category"}
            </div>
          ) : (
            <>
              <div className="divide-y divide-[var(--border-color)]">
                {filteredSuites
                  .slice((page - 1) * 5, page * 5)
                  .map((suite) => (
                    <button
                      key={suite.id}
                      onClick={() => {
                        onSuiteSelect(suite);
                        setIsDropdownOpen(false);
                        resetSearch();
                      }}
                      className={cn(
                        "w-full px-4 py-3 text-left transition-colors text-base flex items-center justify-between",
                        selectedSuiteId === suite.id
                          ? "bg-[var(--hover-bg)]"
                          : "hover:bg-[var(--hover-bg)]"
                      )}
                    >
                      <span className="font-medium">{suite.title || 'Unnamed Suite'}</span>
                      {selectedSuiteId === suite.id && (
                        <Check className="w-4 h-4 text-[var(--text-secondary)]" />
                      )}
                    </button>
                  ))}
              </div>
              <Pagination 
                currentPage={page}
                totalItems={filteredSuites.length}
                onPageChange={setPage}
              />
            </>
          )}
        </div>
      )}
    </div>
  );
} 
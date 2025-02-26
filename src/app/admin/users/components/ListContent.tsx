import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { BundleGroup, AccessList, ListMember } from '../types.js';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface ListContentProps {
  loadingLists: boolean;
  listType: 'auto' | 'custom';
  viewMode: 'bundles' | 'variations' | 'none';
  bundleGroups: BundleGroup[];
  customLists: AccessList[];
  selectedList: string | null;
  handleListSelect: (listId: string) => void;
  setListMembers: (members: ListMember[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export function ListContent({
  loadingLists,
  listType,
  viewMode,
  bundleGroups,
  customLists,
  selectedList,
  handleListSelect,
  setListMembers,
  setLoading,
  setError
}: ListContentProps) {
  const [loadingBundleLists, setLoadingBundleLists] = useState(false);
  const [loadingVariationLists, setLoadingVariationLists] = useState(false);
  const supabase = createClientComponentClient();

  if (loadingLists) {
    return (
      <div className="flex justify-center items-center h-32">
        <Loader2 className="w-5 h-5 animate-spin text-[var(--accent)]" />
      </div>
    );
  }

  // Function to handle bundle selection with direct RPC
  const handleBundleSelect = async (bundleId: string, listId: string) => {
    setLoadingBundleLists(true);
    setLoading(true);
    
    try {
      // First update the UI to show this list is selected
      handleListSelect(listId);
      
      // Then fetch the list members for this bundle
      const { data, error } = await supabase.rpc('get_list_members', { 
        p_list_id: listId 
      });
      
      if (error) {
        throw new Error(error.message);
      }
      
      // Update the list members in the parent component
      setListMembers(data || []);
      console.log(`Fetched ${data?.length || 0} members for bundle ${bundleId}`);
      
    } catch (error) {
      console.error('Error fetching bundle members:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch bundle members');
      setListMembers([]);
    } finally {
      setLoadingBundleLists(false);
      setLoading(false);
    }
  };

  // Function to handle variation selection with direct RPC
  const handleVariationSelect = async (variationId: string, listId: string) => {
    setLoadingVariationLists(true);
    setLoading(true);
    
    try {
      // First update the UI to show this list is selected
      handleListSelect(listId);
      
      // Then fetch the list members for this variation
      const { data, error } = await supabase.rpc('get_list_members', { 
        p_list_id: listId 
      });
      
      if (error) {
        throw new Error(error.message);
      }
      
      // Update the list members in the parent component
      setListMembers(data || []);
      console.log(`Fetched ${data?.length || 0} members for variation ${variationId}`);
      
    } catch (error) {
      console.error('Error fetching variation members:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch variation members');
      setListMembers([]);
    } finally {
      setLoadingVariationLists(false);
      setLoading(false);
    }
  };

  // Function to handle all users selection
  const handleAllUsersSelect = () => {
    handleListSelect('all-users');
    setListMembers([]);
  };

  if (listType === 'auto') {
    // Find the currently selected bundle (if any)
    const selectedBundle = bundleGroups.find(group => 
      group.bundleList?.id === selectedList || 
      group.variations.some(v => v.list.id === selectedList)
    );

    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {bundleGroups.length === 0 ? (
          <p className="text-[var(--text-secondary)] text-center py-4 col-span-full">No auto-generated lists found</p>
        ) : viewMode === 'bundles' ? (
          // Bundle View with Variations underneath the selected bundle
          <>
            {bundleGroups.map(group => (
              group.bundleList && (
                <div key={group.bundleId} className="inline-block">
                  <div className="flex flex-col">
                    <button 
                      className={`px-2 py-2 font-medium relative text-[var(--foreground)]`}
                      onClick={() => handleBundleSelect(group.bundleId, group.bundleList!.id)}
                    >
                      {group.bundleName}
                      {group.bundleList.id === selectedList && (
                        <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[var(--accent)]"></div>
                      )}
                    </button>
                    
                    {/* Show loading indicator when fetching bundle lists */}
                    {loadingBundleLists && group.bundleList.id === selectedList && (
                      <div className="mt-2 pl-2">
                        <Loader2 className="w-4 h-4 animate-spin text-[var(--accent)]" />
                      </div>
                    )}
                    
                    {/* Show variations underneath only when this bundle is selected */}
                    {(group.bundleList.id === selectedList || 
                      group.variations.some(v => v.list.id === selectedList)) && 
                      group.variations.length > 0 && (
                      <div className="mt-3 pl-2 flex flex-wrap gap-2">
                        {group.variations.map(variation => (
                          <button
                            key={variation.variationId}
                            className={`px-4 py-1.5 text-sm rounded-full border transition-colors ${
                              variation.list.id === selectedList
                                ? 'border-[var(--accent)] bg-[var(--accent)] bg-opacity-10 text-[var(--accent)] font-medium'
                                : 'border-[var(--border-color)] text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--foreground)]'
                            }`}
                            onClick={() => handleVariationSelect(variation.variationId, variation.list.id)}
                          >
                            {variation.variationName}
                            {loadingVariationLists && variation.list.id === selectedList && (
                              <Loader2 className="inline ml-1 w-3 h-3 animate-spin" />
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )
            ))}
          </>
        ) : viewMode === 'variations' ? (
          // This view is no longer used, but keeping for compatibility
          bundleGroups.flatMap(group => 
            group.variations.map(variation => (
              <div key={variation.variationId} className="inline-block">
                <button 
                  className={`px-2 py-2 font-medium relative text-[var(--foreground)]`}
                  onClick={() => handleVariationSelect(variation.variationId, variation.list.id)}
                >
                  {variation.variationName}
                  {variation.list.id === selectedList && (
                    <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[var(--accent)]"></div>
                  )}
                </button>
              </div>
            ))
          )
        ) : (
          // No message when in 'none' mode (All is selected)
          <></>
        )}
      </div>
    );
  }

  if (listType === 'custom') {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {/* All Users option for Custom Lists */}
        <div className="inline-block">
          <button 
            className={`px-2 py-2 font-medium relative text-[var(--foreground)]`}
            onClick={handleAllUsersSelect}
          >
            All Users
            {selectedList === 'all-users' && (
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[var(--accent)]"></div>
            )}
          </button>
        </div>
        
        {customLists.length === 0 ? (
          <p className="text-[var(--text-secondary)] text-center py-4 col-span-full">No custom lists found</p>
        ) : (
          customLists.map(list => (
            <div key={list.id} className="inline-block">
              <button 
                className={`px-2 py-2 font-medium relative text-[var(--foreground)]`}
                onClick={async () => {
                  setLoading(true);
                  try {
                    // First update the UI to show this list is selected
                    handleListSelect(list.id);
                    
                    // Then fetch the list members for this custom list
                    const { data, error } = await supabase.rpc('get_list_members', { 
                      p_list_id: list.id 
                    });
                    
                    if (error) {
                      throw new Error(error.message);
                    }
                    
                    // Update the list members in the parent component
                    setListMembers(data || []);
                    console.log(`Fetched ${data?.length || 0} members for custom list ${list.name}`);
                    
                  } catch (error) {
                    console.error('Error fetching custom list members:', error);
                    setError(error instanceof Error ? error.message : 'Failed to fetch custom list members');
                    setListMembers([]);
                  } finally {
                    setLoading(false);
                  }
                }}
              >
                {list.name}
                {list.id === selectedList && (
                  <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[var(--accent)]"></div>
                )}
              </button>
            </div>
          ))
        )}
      </div>
    );
  }

  return null;
} 
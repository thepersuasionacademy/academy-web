'use client';

import React, { useState, useEffect } from 'react';
import { ChevronLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

// Import types
import { User as UserType, BundleGroup, AccessList, ListMember, AutoList } from './types';

// Import components
import { 
  ListTypeTabs, 
  ViewModePills, 
  ListContent,
  UserTable,
  TablePagination,
  FloatingActionBar,
  AccessOptionsModal,
  SearchBar
} from './components';

export default function UsersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<'email' | 'created_at'>('email');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Pagination state
  const [pageSize, setPageSize] = useState<25 | 50 | 100>(25);
  const [currentPage, setCurrentPage] = useState(1);
  
  // Selection state
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  
  // Filters state
  const [listType, setListType] = useState<'auto' | 'custom'>('auto');
  const [viewMode, setViewMode] = useState<'bundles' | 'variations' | 'none'>('none');
  const [bundleGroups, setBundleGroups] = useState<BundleGroup[]>([]);
  const [customLists, setCustomLists] = useState<AccessList[]>([]);
  const [selectedList, setSelectedList] = useState<string | null>('all-users');
  const [listMembers, setListMembers] = useState<ListMember[]>([]);
  const [loadingLists, setLoadingLists] = useState(false);
  
  // Modal state
  const [showAccessModal, setShowAccessModal] = useState(false);
  const [bundleSearchQuery, setBundleSearchQuery] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedBundle, setSelectedBundle] = useState<BundleGroup | null>(null);
  const [selectedVariation, setSelectedVariation] = useState<string | null>(null);
  const [availableBundles, setAvailableBundles] = useState<BundleGroup[]>([]);
  const [loadingBundles, setLoadingBundles] = useState(false);
  
  const supabase = createClientComponentClient();

  // Reset modal state when it closes
  useEffect(() => {
    if (!showAccessModal) {
      setBundleSearchQuery('');
      setSelectedBundle(null);
      setSelectedVariation(null);
    } else {
      // Fetch bundles when modal opens
      fetchBundles();
    }
  }, [showAccessModal]);

  // Fetch bundles from the RPC
  const fetchBundles = async () => {
    setLoadingBundles(true);
    setError('');
    
    try {
      // Call the RPC function to get all bundles
      const { data, error } = await supabase.rpc('get_access_bundle_cards');
      
      if (error) {
        console.error('Error fetching bundles:', error);
        setError(`Failed to fetch bundles: ${error.message}`);
        return;
      }
      
      // Transform the data into the format expected by the UI
      const bundles: BundleGroup[] = [];
      
      if (data && data.bundles && Array.isArray(data.bundles)) {
        data.bundles.forEach((bundle: { id: string; name: string; variations?: any[] }) => {
          const bundleGroup: BundleGroup = {
            bundleId: bundle.id,
            bundleName: bundle.name,
            variations: []
          };
          
          // Add variations if they exist
          if (bundle.variations && Array.isArray(bundle.variations)) {
            bundleGroup.variations = bundle.variations.map((variation: { id: string; name: string }) => ({
              variationId: variation.id,
              variationName: variation.name,
              templates: []
            }));
          }
          
          bundles.push(bundleGroup);
        });
      }
      
      // Sort bundles by name
      bundles.sort((a, b) => a.bundleName.localeCompare(b.bundleName));
      
      // Sort variations within each bundle
      bundles.forEach(bundle => {
        bundle.variations.sort((a, b) => a.variationName.localeCompare(b.variationName));
      });
      
      setAvailableBundles(bundles);
    } catch (err: any) {
      console.error('Error fetching bundles:', err);
      setError(err.message || 'Failed to fetch bundles');
    } finally {
      setLoadingBundles(false);
    }
  };

  // Fetch users only when explicitly requested, not on page load
  const fetchUsers = async () => {
    try {
      console.log('Fetching all users');
      setLoading(true);
      const response = await fetch('/api/admin/users');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setUsers(data.users || []);
      console.log('Fetched users:', data.users?.length || 0);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  // Only fetch all users on initial page load, not when selectedList changes
  useEffect(() => {
    // Only fetch users if we're showing "All Users"
    if (selectedList === 'all-users') {
      fetchUsers();
    }
  }, []); // Empty dependency array - only run once on mount

  // Reset to first page when page size changes
  useEffect(() => {
    setCurrentPage(1);
  }, [pageSize]);

  // Fetch access lists when listType changes
  useEffect(() => {
    const fetchAccessLists = async () => {
      try {
        setLoadingLists(true);
        
        if (listType === 'auto') {
          // Call the RPC function directly instead of using the API
          const { data, error } = await supabase.rpc('get_auto_lists_with_ids');
          
          if (error) {
            // Fall back to the simpler function if the new one doesn't exist yet
            const { data: fallbackData, error: fallbackError } = await supabase.rpc('get_auto_list_names');
            
            if (fallbackError) {
              throw new Error(fallbackError.message);
            }
            
            // Transform the simple list data into the format expected by the UI
            const autoLists = fallbackData || [] as AutoList[];
            transformAndSetBundleGroups(autoLists);
            return;
          }
          
          // Transform the list data into the format expected by the UI
          const autoLists = data || [] as AutoList[];
          transformAndSetBundleGroups(autoLists);
        } else {
          // Call the RPC function directly for custom lists
          const { data, error } = await supabase.rpc('get_access_lists_organized', { 
            p_list_type: ['custom', 'combination'] 
          });
          
          if (error) {
            throw new Error(error.message);
          }
          
          setCustomLists(data?.lists || []);
        }
      } catch (err) {
        console.error('Error fetching access lists:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch access lists');
      } finally {
        setLoadingLists(false);
      }
    };
    
    fetchAccessLists();
  }, [listType, supabase]);

  // Transform auto lists into bundle groups
  const transformAndSetBundleGroups = (autoLists: AutoList[]) => {
    // Group by bundle
    const bundleMap = new Map<string, BundleGroup>();
    
    autoLists.forEach(list => {
      // Use bundle_name from the list or extract from the name field
      const bundleName = list.bundle_name || list.name.replace('Auto: ', '').split(' - ')[0];
      const bundleId = list.bundle_id || bundleName;
      
      if (!bundleMap.has(bundleId)) {
        bundleMap.set(bundleId, {
          bundleId,
          bundleName,
          variations: []
        });
      }
      
      // Add variation if it exists
      // Use variation_name from the list or extract from the name field
      const nameParts = list.name.replace('Auto: ', '').split(' - ');
      const isVariation = nameParts.length > 1;
      const variationName = list.variation_name || (isVariation ? nameParts[1] : null);
      
      if (variationName) {
        const bundle = bundleMap.get(bundleId);
        if (bundle) {
          bundle.variations.push({
            variationId: list.variation_id || variationName,
            variationName
          });
        }
      }
    });
    
    // Convert map to array and sort by bundle name
    const sortedBundles = Array.from(bundleMap.values())
      .sort((a, b) => a.bundleName.localeCompare(b.bundleName));
    
    // Sort variations within each bundle
    sortedBundles.forEach(bundle => {
      bundle.variations.sort((a, b) => a.variationName.localeCompare(b.variationName));
    });
    
    setBundleGroups(sortedBundles);
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Sort users based on sort field and direction
  const sortedUsers = [...users].sort((a, b) => {
    if (sortField === 'email') {
      return sortDirection === 'asc'
        ? a.email.localeCompare(b.email)
        : b.email.localeCompare(a.email);
    } else {
      return sortDirection === 'asc'
        ? new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        : new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
  });

  const handleSort = (field: 'email' | 'created_at') => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getFullName = (user: UserType) => {
    if (user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    if (user.first_name) return user.first_name;
    if (user.last_name) return user.last_name;
    return null;
  };

  const handleListSelect = (listId: string) => {
    // If selecting a bundle or variation, set viewMode to 'bundles'
    if (listId !== 'all-users') {
      setViewMode('bundles');
    } else {
      // If selecting 'all-users', reset viewMode to 'none'
      setViewMode('none');
    }
    
    setSelectedList(prev => prev === listId ? 'all-users' : listId);
  };

  // Clear all filters
  const clearFilters = () => {
    setSelectedList('all-users');
    setViewMode('none');
  };

  // Handle user selection
  const toggleUserSelection = (userId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent row click from navigating
    
    setSelectedUsers(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  // Select all visible users
  const toggleSelectAll = () => {
    if (selectedUsers.length === paginatedUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(paginatedUsers.map(user => user.id));
    }
  };

  // Handle send email action
  const handleSendEmail = () => {
    // Implement email sending functionality
    console.log('Send email to:', selectedUsers);
    // You would typically open a modal or navigate to an email composition page
  };

  // Clear error message
  const clearError = () => {
    setError(null);
  };

  // Handle access options action
  const handleAccessOptions = () => {
    clearError();
    setShowAccessModal(true);
  };

  // Handle applying access to selected users
  const handleApplyAccess = async () => {
    if (!selectedBundle) return;
    
    try {
      setLoading(true);
      
      const bundleId = selectedBundle.bundleId;
      const bundleName = selectedBundle.bundleName;
      const variationId = selectedVariation;
      const variationName = selectedVariation 
        ? selectedBundle.variations.find(v => v.variationId === selectedVariation)?.variationName 
        : null;
      
      console.log('Apply access to users:', selectedUsers);
      console.log('Bundle ID:', bundleId);
      console.log('Variation ID:', variationId || 'None (Bundle only)');
      
      // If no variation is selected, we need to handle this differently
      if (!variationId) {
        setError("Please select a variation. Bundle-only access is not supported.");
        setLoading(false);
        return;
      }
      
      // Call the RPC function to grant access to the variation
      const { data, error } = await supabase.rpc('grant_bundle_variation_access', { 
        user_ids: selectedUsers,
        p_variation_id: variationId
      });
      
      if (error) {
        console.error('Error applying access:', error);
        setError(`Failed to apply access: ${error.message}`);
      } else {
        console.log('Access applied successfully:', data);
        // Clear selections after successful application
        clearSelections();
        
        // Create success message with bundle and variation names
        const userCount = selectedUsers.length;
        const userText = userCount === 1 ? 'user' : 'users';
        const accessText = `${bundleName} - ${variationName}`;
        
        setSuccessMessage(`Access to ${accessText} variation granted for ${userCount} ${userText}.`);
      }
    } catch (err) {
      console.error('Error in handleApplyAccess:', err);
      setError(err instanceof Error ? err.message : 'Failed to apply access');
    } finally {
      setLoading(false);
      setShowAccessModal(false);
    }
  };

  // Clear selections
  const clearSelections = () => {
    setSelectedUsers([]);
  };

  // Handle page size change
  const handlePageSizeChange = (size: 25 | 50 | 100) => {
    setPageSize(size);
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Filter users based on search query or selected list
  const filteredUsers = selectedList === 'all-users'
    ? sortedUsers.filter(user => {
        const searchLower = searchQuery.toLowerCase();
        const fullName = getFullName(user);
        return (
          user.email.toLowerCase().includes(searchLower) ||
          (fullName?.toLowerCase() || '').includes(searchLower)
        );
      })
    : listMembers.map(member => {
        const user = users.find(u => u.id === member.user_id);
        return user || { 
          id: member.user_id, 
          email: member.email,
          first_name: null,
          last_name: null,
          created_at: member.created_at,
          updated_at: member.created_at,
          profile_image_url: null
        };
      });
  
  // Calculate pagination
  const totalPages = Math.ceil(filteredUsers.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + pageSize);

  // Clear success message after a few seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 5000); // 5 seconds
      
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Handle modal visibility
  const toggleAccessModal = (show: boolean) => {
    if (!show) {
      clearError();
    }
    setShowAccessModal(show);
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <div className="border-b border-[var(--border-color)] bg-[var(--background)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16 gap-4">
            <Link 
              href="/admin"
              className="p-2 rounded-lg hover:bg-[var(--hover-bg)] transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-[var(--text-secondary)]" />
            </Link>
            <h1 className="text-2xl font-semibold text-[var(--foreground)]">Users</h1>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search */}
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <SearchBar 
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
          />
        </div>
            
        {/* Filters Panel - Always visible */}
        <div className="mb-6">
          {/* List Type Tabs */}
          <ListTypeTabs 
            listType={listType}
            setListType={setListType}
            selectedList={selectedList}
            clearFilters={clearFilters}
          />
          
          {/* View Mode Pills - Only for Auto lists */}
          {listType === 'auto' && (
            <ViewModePills
              viewMode={viewMode}
              setViewMode={setViewMode}
              selectedList={selectedList}
              setSelectedList={setSelectedList}
              bundleGroups={bundleGroups}
            />
          )}
          
          {/* Lists Content */}
          <div className="py-2">
            <ListContent
              loadingLists={loadingLists}
              listType={listType}
              viewMode={viewMode}
              bundleGroups={bundleGroups}
              customLists={customLists}
              selectedList={selectedList}
              handleListSelect={handleListSelect}
              setListMembers={setListMembers}
              setLoading={setLoading}
              setError={setError}
            />
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="p-4 mb-8 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* Success State */}
        {successMessage && (
          <div className="p-4 mb-8 bg-green-100 border border-green-400 text-green-700 rounded-lg">
            {successMessage}
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-[var(--accent)]" />
          </div>
        ) : (
          <>
            {/* Users Table */}
            <UserTable
              paginatedUsers={paginatedUsers}
              selectedUsers={selectedUsers}
              toggleUserSelection={toggleUserSelection}
              toggleSelectAll={toggleSelectAll}
              handleSort={handleSort}
              formatDate={formatDate}
              getFullName={getFullName}
            />
            
            {/* Table Pagination */}
            <TablePagination
              currentPage={currentPage}
              totalPages={totalPages}
              pageSize={pageSize}
              filteredUsers={filteredUsers}
              startIndex={startIndex}
              handlePageChange={handlePageChange}
              handlePageSizeChange={handlePageSizeChange}
            />
          </>
        )}
        
        {/* Floating Action Bar */}
        <FloatingActionBar
          selectedUsers={selectedUsers}
          handleSendEmail={handleSendEmail}
          handleAccessOptions={handleAccessOptions}
          clearSelections={clearSelections}
        />
        
        {/* Access Options Modal */}
        <AccessOptionsModal
          showAccessModal={showAccessModal}
          setShowAccessModal={toggleAccessModal}
          selectedUsers={selectedUsers}
          bundleGroups={availableBundles}
          bundleSearchQuery={bundleSearchQuery}
          setBundleSearchQuery={setBundleSearchQuery}
          dropdownOpen={dropdownOpen}
          setDropdownOpen={setDropdownOpen}
          selectedBundle={selectedBundle}
          setSelectedBundle={setSelectedBundle}
          selectedVariation={selectedVariation}
          setSelectedVariation={setSelectedVariation}
          handleApplyAccess={handleApplyAccess}
          loadingBundles={loadingBundles}
          error={error}
        />
      </div>
    </div>
  );
} 
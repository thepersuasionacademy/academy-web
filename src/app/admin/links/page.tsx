'use client';

import React, { useState, useEffect } from 'react';
import { 
  Search, 
  ChevronLeft,
  Plus,
} from 'lucide-react';
import { cn } from "@/lib/utils";
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { toast } from 'sonner';
import { LinkCard, CreateLinkModal, EditLinkModal } from './components';
import type { LinkCollection, LinkSuite, SavedLink } from './types';

export default function LinksPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | 'software' | 'resources' | 'offers'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [collections, setCollections] = useState<LinkCollection[]>([]);
  const [suites, setSuites] = useState<LinkSuite[]>([]);
  const [links, setLinks] = useState<{ [key: string]: SavedLink[] }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [editingLink, setEditingLink] = useState<SavedLink | null>(null);
  const [isAddingLink, setIsAddingLink] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const supabase = createClientComponentClient();

  // Link types
  const linkTypes = [
    { id: 'all', name: 'All Types' },
    { id: 'software', name: 'Software' },
    { id: 'resources', name: 'Resources' },
    { id: 'offers', name: 'Offers' }
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch collections
      const { data: collectionsData, error: collectionsError } = await supabase
        .rpc('list_link_collections');
      
      if (collectionsError) throw collectionsError;
      console.log('Fetched collections:', collectionsData); // Debug log
      setCollections(collectionsData);

      // For each collection, fetch its suites
      const suitesPromises = collectionsData.map((collection: LinkCollection) =>
        supabase.rpc('get_link_suites_by_collection', { collection_id: collection.id })
      );
      const suitesResults = await Promise.all(suitesPromises);
      const allSuites = suitesResults.flatMap(result => result.data || []);
      setSuites(allSuites);

      // For each suite, fetch its links
      const linksPromises = allSuites.map(suite =>
        supabase.rpc('get_links_by_suite', { p_suite_id: suite.id })
      );
      const linksResults = await Promise.all(linksPromises);
      
      // Organize links by suite_id using the suite_id from each link
      const linksBySuite = {} as { [key: string]: SavedLink[] };
      linksResults.forEach((result, index) => {
        if (result.data) {
          result.data.forEach((link: SavedLink & { suite_id: string }) => {
            // Use the suite_id from the link itself
            const suiteId = link.suite_id;
            if (!linksBySuite[suiteId]) {
              linksBySuite[suiteId] = [];
            }
            linksBySuite[suiteId].push(link);
          });
        }
      });
      
      setLinks(linksBySuite);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load links');
    } finally {
      setIsLoading(false);
    }
  };

  // Function to refresh collections
  const refreshCollections = async () => {
    try {
      const { data: collectionsData, error: collectionsError } = await supabase
        .rpc('list_link_collections');
      
      if (collectionsError) throw collectionsError;
      console.log('Refreshed collections:', collectionsData); // Debug log
      setCollections(collectionsData);
    } catch (error) {
      console.error('Error refreshing collections:', error);
    }
  };

  const handleSaveLink = async (link: Partial<SavedLink> & { suite_id: string }) => {
    try {
      const { data, error } = await supabase.rpc('save_link_changes', {
        p_link_id: link.id || null,
        p_title: link.title || '',
        p_description: link.description || '',
        p_url: link.url || '',
        p_type: link.type || 'software',
        p_status: link.status || 'active',
        p_suite_id: link.suite_id,
        p_tags: link.tags || []
      });

      if (error) throw error;

      toast.success(link.id ? 'Link updated successfully' : 'Link created successfully');
      fetchData(); // Refresh data
      setEditingLink(null);
      setIsAddingLink(null);
      setShowModal(false);
    } catch (error) {
      console.error('Error saving link:', error);
      toast.error('Failed to save link');
    }
  };

  const handleCopyUrl = (id: string, url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filter links based on search and type
  const getFilteredLinks = (suiteLinks: SavedLink[]) => {
    return suiteLinks.filter(link => {
      const matchesSearch = 
        link.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        link.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        link.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesType = selectedType === 'all' || link.type === selectedType;
      return matchesSearch && matchesType;
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--background)] p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-8">
            <div className="h-16 bg-[var(--card-bg)] rounded-lg" />
            <div className="flex gap-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-10 w-32 bg-[var(--card-bg)] rounded-full" />
              ))}
            </div>
            <div className="flex gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex-none w-80 h-96 bg-[var(--card-bg)] rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

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
                <ChevronLeft className="w-6 h-6 text-[var(--text-secondary)]" />
              </Link>
              <h1 className="text-3xl font-semibold text-[var(--foreground)]">Links</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Type Toggle */}
        <div className="flex flex-col gap-6 mb-8">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-[var(--text-secondary)]" />
            <input
              type="text"
              placeholder="Search links..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-lg border border-[var(--border-color)] bg-[var(--card-bg)] text-[var(--foreground)] placeholder-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent)] text-lg"
            />
          </div>

          {/* Type Pills and Add Button */}
          <div className="flex items-center justify-between">
            <div className="flex flex-wrap gap-3">
              {linkTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setSelectedType(type.id as typeof selectedType)}
                  className={cn(
                    "px-5 py-2.5 rounded-full font-medium transition-all text-lg",
                    "border",
                    selectedType === type.id
                      ? "bg-[var(--accent)] text-white border-[var(--accent)]"
                      : "border-[var(--border-color)] text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--foreground)]"
                  )}
                >
                  {type.name}
                </button>
              ))}
            </div>
            <button
              onClick={() => {
                setIsAddingLink(null);
                setShowModal(true);
              }}
              className="px-5 py-2.5 bg-[var(--accent)] text-white rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2 text-lg"
            >
              <Plus className="w-5 h-5" />
              <span>Add Link</span>
            </button>
          </div>
        </div>

        {/* Kanban Board */}
        <div className="flex gap-6 overflow-x-auto pb-6">
          {suites.map(suite => (
            <div key={suite.id} className="flex-none w-96 bg-[var(--card-bg)] rounded-lg border border-[var(--border-color)]">
              <div className="p-5 border-b border-[var(--border-color)]">
                <h3 className="text-xl font-medium text-[var(--foreground)]">{suite.title}</h3>
                <p className="text-base text-[var(--text-secondary)] mt-1">{suite.description}</p>
              </div>
              <div className="p-5 space-y-4">
                {getFilteredLinks(links[suite.id] || []).map((link) => (
                  <LinkCard 
                    key={link.id} 
                    link={link} 
                    copiedId={copiedId} 
                    onCopy={handleCopyUrl}
                    onEdit={() => setEditingLink(link)}
                  />
                ))}
                <button
                  onClick={() => {
                    setIsAddingLink(suite.id);
                    setShowModal(true);
                  }}
                  className={cn(
                    "w-full p-4 rounded-lg",
                    "border border-dashed border-[var(--border-color)]",
                    "text-[var(--text-secondary)]",
                    "hover:border-[var(--accent)] hover:text-[var(--accent)]",
                    "transition-colors",
                    "flex items-center justify-center gap-2",
                    "text-lg"
                  )}
                >
                  <Plus className="w-5 h-5" />
                  <span>Add Link</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Edit Modal */}
      {editingLink ? (
        <EditLinkModal
          link={editingLink}
          onClose={() => {
            setEditingLink(null);
            setShowModal(false);
            refreshCollections(); // Refresh collections when modal closes
          }}
          onSave={async (link) => {
            await handleSaveLink(link);
            refreshCollections(); // Refresh collections after save
          }}
          suites={suites}
          collections={collections}
          setCollections={setCollections}
          setSuites={setSuites}
        />
      ) : showModal && (
        <CreateLinkModal
          suiteId={isAddingLink}
          onClose={() => {
            setIsAddingLink(null);
            setShowModal(false);
            refreshCollections(); // Refresh collections when modal closes
          }}
          onSave={async (link) => {
            await handleSaveLink(link);
            refreshCollections(); // Refresh collections after save
          }}
          suites={suites}
          collections={collections}
          setCollections={setCollections}
          setSuites={setSuites}
        />
      )}
    </div>
  );
} 
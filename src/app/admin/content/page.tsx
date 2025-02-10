'use client';

import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Users,
  Star,
  Clock,
  Plus,
  Edit,
  Trash,
  Archive
} from 'lucide-react';
import { cn } from "@/lib/utils";
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from 'sonner';
import NewCourseClient from './new/components/NewCourseClient';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Image from 'next/image';
import DeleteConfirmationDialog from './components/DeleteConfirmationDialog';
import NewContentDialog from './components/NewContentDialog';

interface Content {
  id: string;
  title: string;
  description: string;
  collection_id: string;
  thumbnail_url: string;
  status: 'draft' | 'published' | 'archived';
  created_at: string;
  updated_at: string;
  collection?: {
    id: string;
    name: string;
  };
  stats?: {
    enrolled_count: number;
  };
}

interface Collection {
  id: string;
  name: string;
  description?: string;
}

export default function ContentPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
  const [isNewContentOpen, setIsNewContentOpen] = useState(false);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [content, setContent] = useState<Content[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [contentToDelete, setContentToDelete] = useState<Content | null>(null);
  const [isNewContentDialogOpen, setIsNewContentDialogOpen] = useState(false);

  useEffect(() => {
    fetchCollections();
    fetchContent();
  }, []);

  const fetchCollections = async () => {
    try {
      const { data, error } = await supabase
        .rpc('get_content_collections');
      
      if (error) {
        console.error('Error fetching collections:', error);
        toast.error(`Failed to fetch collections: ${error.message}`);
        return;
      }
    
      if (data) {
        setCollections(data);
      }
    } catch (error: any) {
      console.error('Error fetching collections:', error);
      toast.error('Failed to fetch collections');
    }
  };

  const fetchContent = async () => {
    try {
      setIsLoading(true);
      
      // Fetch content using the get_content_with_stats RPC function
      const { data: contentData, error: contentError } = await supabase
        .rpc('get_content_with_stats');

      if (contentError) {
        console.error('Error fetching content:', contentError);
        toast.error('Failed to fetch content');
        return;
      }

      // Transform the data to match our Content interface
      const transformedContent = (contentData || []).map((item: any) => ({
        id: item.id,
        title: item.title,
        description: item.description,
        collection_id: item.collection_id,
        thumbnail_url: item.thumbnail_url,
        status: item.status,
        created_at: item.created_at,
        updated_at: item.updated_at,
        stats: {
          enrolled_count: item.stats?.enrolled_count || 0
        },
        collection: item.collection ? {
          id: item.collection.id,
          name: item.collection.name
        } : undefined
      }));

      setContent(transformedContent);
    } catch (error: any) {
      console.error('Error fetching content:', error);
      toast.error('Failed to fetch content');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter content based on search and collection
  const filteredContent = content.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCollection = !selectedCollection || selectedCollection === 'all' || 
                            item.collection_id === selectedCollection;
    return matchesSearch && matchesCollection;
  });

  const getStatusColor = (status: Content['status']) => {
    switch (status) {
      case 'published':
        return 'bg-green-500';
      case 'draft':
        return 'bg-yellow-500';
      case 'archived':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  const handleEdit = (contentId: string) => {
    router.push(`/admin/content/${contentId}`);
  };

  const handleDelete = async (contentId: string) => {
    const contentItem = content.find(item => item.id === contentId);
    if (contentItem) {
      setContentToDelete(contentItem);
      setDeleteDialogOpen(true);
    }
  };

  const handleConfirmDelete = async () => {
    if (!contentToDelete) return;

    try {
      const loadingToast = toast.loading('Deleting content...');

      // Call RPC function to delete content
      const { error } = await supabase
        .rpc('delete_content', {
          p_content_id: contentToDelete.id
        });

      if (error) {
        console.error('Error deleting content:', error);
        toast.error(`Failed to delete content: ${error.message}`);
        return;
      }

      // Remove the content from local state
      setContent(prevContent => prevContent.filter(item => item.id !== contentToDelete.id));
      
      toast.dismiss(loadingToast);
      toast.success('Content deleted successfully');
    } catch (error: any) {
      console.error('Error deleting content:', error);
      toast.error('Failed to delete content');
    } finally {
      setDeleteDialogOpen(false);
      setContentToDelete(null);
    }
  };

  const handleArchive = async (contentId: string) => {
    // Add archive functionality later
    toast.error('Archive functionality not implemented yet');
  };

  const handleNewContentSuccess = (contentId: string) => {
    router.push(`/admin/content/${contentId}`);
  };

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
              <h1 className="text-2xl font-semibold text-[var(--foreground)]">Content</h1>
            </div>
            <button 
              onClick={() => setIsNewContentDialogOpen(true)}
              className="px-4 py-2 bg-[var(--accent)] text-white rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              <span>New Content</span>
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
              placeholder="Search content..."
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

        {/* Collections */}
        <div className="mb-8 overflow-x-auto">
          <div className="flex gap-2 min-w-max">
            <button
              onClick={() => setSelectedCollection('all')}
              className={cn(
                "px-4 py-2 rounded-lg transition-all whitespace-nowrap",
                selectedCollection === 'all'
                  ? "bg-[var(--accent)] text-white"
                  : "bg-[var(--card-bg)] border border-[var(--border-color)] hover:border-[var(--accent)]"
              )}
            >
              All Content
              <span className="ml-2 text-sm opacity-70">({content.length})</span>
            </button>
            {collections.map((collection) => {
              const contentCount = content.filter(item => item.collection_id === collection.id).length;
              return (
                <button
                  key={collection.id}
                  onClick={() => setSelectedCollection(collection.id)}
                  className={cn(
                    "px-4 py-2 rounded-lg transition-all whitespace-nowrap",
                    selectedCollection === collection.id
                      ? "bg-[var(--accent)] text-white"
                      : "bg-[var(--card-bg)] border border-[var(--border-color)] hover:border-[var(--accent)]"
                  )}
                >
                  {collection.name}
                  <span className="ml-2 text-sm opacity-70">({contentCount})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--accent)]"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredContent.map((item) => (
              <div
                key={item.id}
                className="border border-[var(--border-color)] rounded-lg overflow-hidden hover:border-[var(--accent)] transition-colors bg-[var(--card-bg)]"
              >
                <div
                  onClick={() => handleEdit(item.id)}
                  className="cursor-pointer"
                >
                  {/* Content Thumbnail */}
                  <div className="aspect-video relative bg-[var(--hover-bg)]">
                    {item.thumbnail_url ? (
                      <img
                        src={item.thumbnail_url}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[var(--text-secondary)]">
                        <Image 
                          src="/placeholder-image.png"
                          alt="Placeholder"
                          width={48}
                          height={48}
                        />
                      </div>
                    )}
                    <div 
                      className="absolute top-2 right-2"
                      onClick={(e) => e.stopPropagation()} // Prevent card click when clicking dropdown
                    >
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="p-2 rounded-lg bg-black/50 hover:bg-black/70 transition-colors">
                            <MoreVertical className="w-5 h-5 text-white" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(item.id)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleArchive(item.id)}>
                            <Archive className="w-4 h-4 mr-2" />
                            Archive
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDelete(item.id)}
                            className="text-red-500 focus:text-red-500"
                          >
                            <Trash className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className="absolute bottom-2 left-2 flex gap-2">
                      <div className={cn(
                        "px-2 py-1 rounded-md text-xs text-white",
                        getStatusColor(item.status)
                      )}>
                        {item.status}
                      </div>
                    </div>
                  </div>

                  {/* Content Info */}
                  <div className="p-4">
                    <h3 className="text-lg font-medium text-[var(--foreground)] mb-2">
                      {item.title}
                    </h3>
                    <p className="text-sm text-[var(--text-secondary)] mb-4">
                      {item.description}
                    </p>
                    <div className="flex items-center justify-between text-sm text-[var(--text-secondary)]">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          <span>{item.stats?.enrolled_count || 0}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{formatDate(item.updated_at)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <NewContentDialog
        isOpen={isNewContentDialogOpen}
        onClose={() => setIsNewContentDialogOpen(false)}
        onSuccess={handleNewContentSuccess}
        collections={collections}
      />

      <DeleteConfirmationDialog
        isOpen={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setContentToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title={contentToDelete?.title || ''}
      />
    </div>
  );
}

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(
    Math.floor((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
    'day'
  );
} 
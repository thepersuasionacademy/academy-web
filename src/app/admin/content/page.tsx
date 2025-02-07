'use client';

import React, { useState } from 'react';
import { 
  Search, 
  Filter,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Users,
  Star,
  Clock,
  Plus
} from 'lucide-react';
import { cn } from "@/lib/utils";
import Link from 'next/link';
import NewCourseClient from './new/components/NewCourseClient';

interface Content {
  id: string;
  title: string;
  description: string;
  collection: string;
  thumbnail: string;
  enrolledCount: number;
  rating: number;
  duration: string;
  type: 'course' | 'workshop' | 'resource';
  status: 'published' | 'draft' | 'archived';
}

interface Collection {
  id: string;
  name: string;
  contentCount: number;
}

export default function ContentPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
  const [isNewContentOpen, setIsNewContentOpen] = useState(false);

  // Mock collections data
  const collections: Collection[] = [
    { id: 'all', name: 'All Content', contentCount: 24 },
    { id: 'persuasion', name: 'Persuasion', contentCount: 8 },
    { id: 'negotiation', name: 'Negotiation', contentCount: 6 },
    { id: 'leadership', name: 'Leadership', contentCount: 5 },
    { id: 'communication', name: 'Communication', contentCount: 5 },
  ];

  // Mock content data
  const contentItems: Content[] = [
    {
      id: '1',
      title: 'Mastering Persuasion',
      description: 'Learn the art of persuasion through practical examples and proven techniques.',
      collection: 'persuasion',
      thumbnail: 'https://api.placeholder.com/300x200',
      enrolledCount: 1250,
      rating: 4.8,
      duration: '6 hours',
      type: 'course',
      status: 'published'
    },
    {
      id: '2',
      title: 'Advanced Negotiation Skills',
      description: 'Take your negotiation skills to the next level with real-world scenarios.',
      collection: 'negotiation',
      thumbnail: 'https://api.placeholder.com/300x200',
      enrolledCount: 980,
      rating: 4.7,
      duration: '8 hours',
      type: 'course',
      status: 'published'
    },
    {
      id: '3',
      title: 'Leadership Workshop',
      description: 'Interactive workshop covering core principles and practices for effective leadership.',
      collection: 'leadership',
      thumbnail: 'https://api.placeholder.com/300x200',
      enrolledCount: 750,
      rating: 4.9,
      duration: '2 hours',
      type: 'workshop',
      status: 'published'
    },
    // Add more mock content as needed
  ];

  // Filter content based on search and collection
  const filteredContent = contentItems.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCollection = !selectedCollection || selectedCollection === 'all' || 
                            item.collection === selectedCollection;
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

  const getTypeColor = (type: Content['type']) => {
    switch (type) {
      case 'course':
        return 'bg-blue-500';
      case 'workshop':
        return 'bg-purple-500';
      case 'resource':
        return 'bg-indigo-500';
      default:
        return 'bg-gray-500';
    }
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
              onClick={() => setIsNewContentOpen(true)}
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
            {collections.map((collection) => (
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
                <span className="ml-2 text-sm opacity-70">({collection.contentCount})</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredContent.map((item) => (
            <div
              key={item.id}
              className="border border-[var(--border-color)] rounded-lg overflow-hidden hover:border-[var(--accent)] transition-colors bg-[var(--card-bg)]"
            >
              {/* Content Thumbnail */}
              <div className="aspect-video relative bg-[var(--hover-bg)]">
                <img
                  src={item.thumbnail}
                  alt={item.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 right-2">
                  <button className="p-2 rounded-lg bg-black/50 hover:bg-black/70 transition-colors">
                    <MoreVertical className="w-5 h-5 text-white" />
                  </button>
                </div>
                <div className="absolute bottom-2 left-2 flex gap-2">
                  <div className={cn(
                    "px-2 py-1 rounded-md text-xs text-white",
                    getTypeColor(item.type)
                  )}>
                    {item.type}
                  </div>
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
                      <span>{item.enrolledCount}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4" />
                      <span>{item.rating}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{item.duration}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <NewCourseClient 
        isOpen={isNewContentOpen}
        onClose={() => setIsNewContentOpen(false)}
      />
    </div>
  );
} 
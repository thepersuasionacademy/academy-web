'use client';

import React, { useState } from 'react';
import { 
  Search, 
  Filter,
  ChevronLeft,
  MoreVertical,
  Plus,
  Link as LinkIcon,
  ExternalLink,
  Calendar,
  Tag as TagIcon,
  Copy,
  CheckCircle
} from 'lucide-react';
import { cn } from "@/lib/utils";
import Link from 'next/link';

interface SavedLink {
  id: string;
  title: string;
  url: string;
  description: string;
  tags: string[];
  type: 'offers' | 'software' | 'resources';
  createdAt: string;
  lastAccessed?: string;
}

export default function LinksPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | 'offers' | 'software' | 'resources'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Link types
  const linkTypes = [
    { id: 'all', name: 'All Types' },
    { id: 'offers', name: 'Offers' },
    { id: 'software', name: 'Software' },
    { id: 'resources', name: 'Resources' }
  ];

  // Mock links data
  const links: SavedLink[] = [
    {
      id: '1',
      title: 'API Documentation',
      url: 'https://api.example.com/docs',
      description: 'Official API documentation for our services',
      tags: ['api', 'reference', 'development'],
      type: 'software',
      createdAt: '2024-03-01',
      lastAccessed: '2024-03-15'
    },
    {
      id: '2',
      title: 'Design System',
      url: 'https://design.example.com',
      description: 'Our design system guidelines and components',
      tags: ['design', 'ui', 'guidelines'],
      type: 'resources',
      createdAt: '2024-02-15',
      lastAccessed: '2024-03-14'
    },
    {
      id: '3',
      title: 'Analytics Dashboard',
      url: 'https://analytics.example.com',
      description: 'Main analytics dashboard for tracking metrics',
      tags: ['analytics', 'dashboard', 'metrics'],
      type: 'software',
      createdAt: '2024-02-01',
      lastAccessed: '2024-03-16'
    }
  ];

  // Filter links based on search and type
  const filteredLinks = links.filter(link => {
    const matchesSearch = 
      link.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      link.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      link.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesType = selectedType === 'all' || link.type === selectedType;
    return matchesSearch && matchesType;
  });

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleCopyUrl = (id: string, url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
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
              <h1 className="text-2xl font-semibold text-[var(--foreground)]">Links</h1>
            </div>
            <button className="px-4 py-2 bg-[var(--accent)] text-white rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2">
              <Plus className="w-5 h-5" />
              <span>Save Link</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Type Toggle */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-secondary)]" />
            <input
              type="text"
              placeholder="Search links..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--card-bg)] text-[var(--foreground)] placeholder-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent)]"
            />
          </div>
          <div className="inline-flex p-1 gap-1 bg-[var(--card-bg)] rounded-lg border border-[var(--border-color)]">
            {linkTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => setSelectedType(type.id as typeof selectedType)}
                className={cn(
                  "px-4 py-2 rounded-md transition-all whitespace-nowrap text-base",
                  selectedType === type.id
                    ? "bg-[var(--accent)] text-white"
                    : "hover:bg-[var(--hover-bg)] text-[var(--text-secondary)]"
                )}
              >
                {type.name}
              </button>
            ))}
          </div>
        </div>

        {/* Links Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLinks.map((link) => (
            <div
              key={link.id}
              className="border border-[var(--border-color)] rounded-lg overflow-hidden bg-[var(--card-bg)]"
            >
              <a 
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-6 hover:border-[var(--accent)] transition-colors"
              >
                {/* Header */}
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-xl font-medium text-[var(--foreground)]">
                      {link.title}
                    </h3>
                    {/* Description */}
                    <p className="text-base text-[var(--text-secondary)] mt-1">
                      {link.description}
                    </p>
                  </div>
                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }} 
                    className="p-2 rounded-lg hover:bg-[var(--hover-bg)] transition-colors ml-4"
                  >
                    <MoreVertical className="w-5 h-5 text-[var(--text-secondary)]" />
                  </button>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mt-4 mb-4">
                  {link.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1.5 rounded-md text-sm bg-[var(--hover-bg)] text-[var(--text-secondary)]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Details */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-base text-[var(--text-secondary)]">
                    <Calendar className="w-5 h-5" />
                    <span>Added {formatDate(link.createdAt)}</span>
                  </div>
                </div>
              </a>
              <div className="px-6 pb-6">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleCopyUrl(link.id, link.url);
                  }}
                  className={cn(
                    "w-full px-4 py-3 rounded-lg border border-[var(--border-color)] transition-colors flex items-center justify-center gap-2 text-base",
                    copiedId === link.id 
                      ? "border-green-500"
                      : "hover:border-[var(--accent)]"
                  )}
                >
                  {copiedId === link.id ? (
                    <>
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span className="text-green-500">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-5 h-5" />
                      <span>Copy URL</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 
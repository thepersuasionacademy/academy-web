'use client';

import React, { useState } from 'react';
import { 
  Search, 
  Filter,
  ChevronLeft,
  Plus,
} from 'lucide-react';
import { cn } from "@/lib/utils";
import Link from 'next/link';

interface Bundle {
  id: string;
  name: string;
  description: string;
  variations: {
    id: string;
    name: string;
    templates: {
      type: 'content' | 'ai';
      name: string;
      details: any;
    }[];
  }[];
  createdAt: string;
  status: 'active' | 'draft';
}

export default function AccessBundlesPage() {
  const [searchQuery, setSearchQuery] = useState('');

  // Mock bundles data
  const bundles: Bundle[] = [
    {
      id: '1',
      name: 'Power Bundle',
      description: 'Complete access to Power Patterns course and AI tools',
      variations: [
        {
          id: 'v1',
          name: 'Basic',
          templates: [
            {
              type: 'content',
              name: 'Basic Power Patterns Access',
              details: { modules: ['Module 1', 'Module 2'] }
            },
            {
              type: 'ai',
              name: 'Basic AI Tools',
              details: { tools: ['Tool 1', 'Tool 2'] }
            }
          ]
        },
        {
          id: 'v2',
          name: 'Premium',
          templates: [
            {
              type: 'content',
              name: 'Full Power Patterns Access',
              details: { modules: ['All Modules'] }
            },
            {
              type: 'ai',
              name: 'Premium AI Tools',
              details: { tools: ['All Tools'] }
            }
          ]
        }
      ],
      createdAt: '2024-02-20',
      status: 'active'
    },
    {
      id: '2',
      name: 'Leadership Bundle',
      description: 'Leadership course with specialized AI tools',
      variations: [
        {
          id: 'v1',
          name: 'Standard',
          templates: [
            {
              type: 'content',
              name: 'Leadership Basics',
              details: { modules: ['Intro', 'Fundamentals'] }
            },
            {
              type: 'ai',
              name: 'Leadership AI Suite',
              details: { tools: ['Leadership Assistant', 'Team Analysis'] }
            }
          ]
        }
      ],
      createdAt: '2024-02-19',
      status: 'draft'
    }
  ];

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
              <h1 className="text-2xl font-semibold text-[var(--foreground)]">Access Bundles</h1>
            </div>
            <button className="px-4 py-2 bg-[var(--accent)] text-white rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2">
              <Plus className="w-5 h-5" />
              <span>New Bundle</span>
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
              placeholder="Search bundles..."
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

        {/* Bundles Grid */}
        <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bundles.map((bundle) => (
            <div
              key={bundle.id}
              className={cn(
                "group relative rounded-2xl p-6",
                "border border-[var(--border-color)]",
                "transition-all duration-300",
                "bg-[#fafafa] hover:bg-white dark:bg-[var(--card-bg)]",
                "hover:scale-[1.02] hover:shadow-lg",
                "hover:border-[var(--accent)]",
                "cursor-pointer",
                "flex flex-col min-h-[220px]"
              )}
            >
              <div className="space-y-4">
                <h3 className="text-2xl font-bold text-[var(--foreground)] transition-colors">
                  {bundle.name}
                </h3>
                <p className="text-lg text-[var(--text-secondary)] line-clamp-2 group-hover:text-[var(--foreground)] transition-colors">
                  {bundle.description}
                </p>
              </div>

              <div className="mt-auto pt-6">
                <div className="flex flex-wrap gap-2">
                  {bundle.variations.map((variation) => (
                    <div
                      key={variation.id}
                      className={cn(
                        "px-3 py-1 rounded-lg text-sm font-medium",
                        "border border-[var(--text-secondary)] bg-[var(--card-bg)]",
                        "text-[var(--text-secondary)]",
                        "group-hover:border-[var(--accent)]",
                        "transition-colors"
                      )}
                    >
                      {variation.name}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 
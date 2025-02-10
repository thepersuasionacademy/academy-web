'use client';

import React, { useState, useEffect } from 'react';
import { 
  Search,
  ChevronLeft,
  Settings,
  Plus,
  Users,
  CreditCard
} from 'lucide-react';
import { cn } from "@/lib/utils";
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { AITool, AICollection, AISuite, AIToolStatus } from '@/lib/supabase/ai';
import { AIToolModal } from '@/app/ai/components/AIToolModal';

// Extend the base interfaces to include the nested relationships we need
interface ExtendedAITool extends Omit<AITool, 'status'> {
  status: AIToolStatus;
  usage_count?: number;
  average_time?: string;
}

interface ExtendedAISuite extends AISuite {
  description?: string;
  tools: ExtendedAITool[];
}

interface ExtendedAICollection extends AICollection {
  description?: string;
  suites: ExtendedAISuite[];
}

interface AIEngineClientProps {
  params: { id: string };
  searchParams: { [key: string]: string | string[] | undefined };
}

export default function AIEngineClient({ params, searchParams }: AIEngineClientProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
  const [collections, setCollections] = useState<ExtendedAICollection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTool, setSelectedTool] = useState<AITool | null>(null);
  const supabase = createClientComponentClient();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch collections
        const { data: collections, error: collectionsError } = await supabase
          .rpc('list_collections');
        
        if (collectionsError) throw collectionsError;

        // For each collection, fetch its suites
        const collectionsWithSuites = await Promise.all(collections.map(async (collection: AICollection) => {
          const { data: suites, error: suitesError } = await supabase
            .rpc('get_suites_by_collection', { collection_id: collection.id });
          
          if (suitesError) throw suitesError;

          // For each suite, fetch its tools
          const suitesWithTools = await Promise.all((suites || []).map(async (suite: AISuite) => {
            const { data: tools, error: toolsError } = await supabase
              .rpc('get_tools_by_suite', { suite_id: suite.id });
            
            if (toolsError) throw toolsError;

            return {
              ...suite,
              tools: tools || []
            } as ExtendedAISuite;
          }));

          return {
            ...collection,
            suites: suitesWithTools
          } as ExtendedAICollection;
        }));

        setCollections(collectionsWithSuites);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter collections based on search
  const filteredCollections = collections.map(collection => ({
    ...collection,
    suites: collection.suites.map(suite => ({
      ...suite,
      tools: suite.tools.filter(tool =>
        tool.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tool.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    })).filter(suite => suite.tools.length > 0)
  })).filter(collection => collection.suites.length > 0);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500';
      case 'disabled':
        return 'bg-gray-500';
      case 'maintenance':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--background)] p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-8">
            {/* Header Skeleton */}
            <div className="h-16 bg-[var(--card-bg)] rounded-lg" />
            
            {/* Pills Skeleton */}
            <div className="flex gap-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-10 w-32 bg-[var(--card-bg)] rounded-full" />
              ))}
            </div>
            
            {/* Kanban Columns Skeleton */}
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
              <h1 className="text-3xl font-semibold text-[var(--foreground)]">AI Engine</h1>
            </div>
            <button className="px-5 py-2.5 bg-[var(--accent)] text-white rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2 text-lg">
              <Plus className="w-6 h-6" />
              <span>New Tool</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Collection Pills */}
        <div className="flex flex-col gap-6 mb-8">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-[var(--text-secondary)]" />
            <input
              type="text"
              placeholder="Search AI tools..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-lg border border-[var(--border-color)] bg-[var(--card-bg)] text-[var(--foreground)] placeholder-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent)] text-lg"
            />
          </div>

          {/* Collection Pills */}
          <div className="flex flex-wrap gap-3">
            {collections.map((collection) => (
              <button
                key={collection.id}
                onClick={() => setSelectedCollection(collection.id === selectedCollection ? null : collection.id)}
                className={cn(
                  "px-5 py-2.5 rounded-full font-medium transition-all text-lg",
                  "border",
                  selectedCollection === collection.id
                    ? "bg-[var(--accent)] text-white border-[var(--accent)]"
                    : "border-[var(--border-color)] text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--foreground)]"
                )}
              >
                {collection.title}
              </button>
            ))}
          </div>
        </div>

        {/* Kanban Board */}
        <div className="flex gap-6 overflow-x-auto pb-6">
          {filteredCollections
            .filter(collection => !selectedCollection || collection.id === selectedCollection)
            .map(collection => (
              collection.suites.map(suite => (
                <div
                  key={suite.id}
                  className="flex-none w-96 bg-[var(--card-bg)] rounded-lg border border-[var(--border-color)]"
                >
                  {/* Suite Header */}
                  <div className="p-5 border-b border-[var(--border-color)]">
                    <h3 className="text-xl font-medium text-[var(--foreground)]">{suite.title}</h3>
                    <p className="text-base text-[var(--text-secondary)] mt-1">{suite.description}</p>
                  </div>

                  {/* Tools List */}
                  <div className="p-5 space-y-4">
                    {suite.tools.map(tool => (
                      <div
                        key={tool.id}
                        onClick={() => setSelectedTool(tool)}
                        className="bg-[var(--background)] rounded-lg p-5 border border-[var(--border-color)] hover:border-[var(--accent)] transition-colors cursor-pointer"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={cn(
                                "w-2.5 h-2.5 rounded-full",
                                getStatusColor(tool.status || 'active')
                              )} />
                              <span className="text-sm text-[var(--text-secondary)]">
                                {tool.status || 'active'}
                              </span>
                            </div>
                            <h4 className="text-lg font-medium text-[var(--foreground)]">
                              {tool.title}
                            </h4>
                          </div>
                          <button 
                            className="p-1.5 rounded-lg hover:bg-[var(--hover-bg)] transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedTool(tool);
                            }}
                          >
                            <Settings className="w-5 h-5 text-[var(--text-secondary)]" />
                          </button>
                        </div>
                        <p className="text-base text-[var(--text-secondary)] mb-4">
                          {tool.description}
                        </p>
                        <div className="flex items-center justify-between text-base text-[var(--text-secondary)]">
                          <div className="flex items-center gap-1">
                            <Users className="w-5 h-5" />
                            <span>{tool.usage_count || 0}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CreditCard className="w-5 h-5" />
                            <span>{tool.credits_cost || 0}</span>
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Add Tool Button */}
                    <button
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
                      <span>Add Tool</span>
                    </button>
                  </div>
                </div>
              ))
            ))}
        </div>
      </div>

      {/* AI Tool Modal */}
      {selectedTool && (
        <AIToolModal
          tool={selectedTool}
          isOpen={!!selectedTool}
          onClose={() => setSelectedTool(null)}
        />
      )}
    </div>
  );
} 
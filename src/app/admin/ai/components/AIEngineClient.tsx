'use client';

import React, { useState } from 'react';
import { 
  Search, 
  Filter,
  ChevronLeft,
  ChevronDown,
  MoreVertical,
  ArrowRight,
  Brain,
  Zap,
  Users,
  Clock,
  Settings,
  Plus,
  Sparkles
} from 'lucide-react';
import { cn } from "@/lib/utils";
import Link from 'next/link';

interface AITool {
  id: string;
  name: string;
  description: string;
  usageCount: number;
  averageTime: string;
  status: 'active' | 'disabled' | 'maintenance';
  creditCost: number;
}

interface Suite {
  id: string;
  name: string;
  description: string;
  tools: AITool[];
  isExpanded?: boolean;
}

interface Collection {
  id: string;
  name: string;
  description: string;
  suites: Suite[];
  isExpanded?: boolean;
}

interface AIEngineClientProps {
  params: { id: string };
  searchParams: { [key: string]: string | string[] | undefined };
}

export default function AIEngineClient({ params, searchParams }: AIEngineClientProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [collections, setCollections] = useState<Collection[]>([
    {
      id: '1',
      name: 'Persuasion',
      description: 'Tools for mastering the art of persuasion',
      isExpanded: true,
      suites: [
        {
          id: '1-1',
          name: 'Argument Analysis',
          description: 'Tools for analyzing and strengthening arguments',
          isExpanded: true,
          tools: [
            {
              id: '1-1-1',
              name: 'Argument Validator',
              description: 'Analyze the logical structure and validity of arguments',
              usageCount: 1250,
              averageTime: '45s',
              status: 'active',
              creditCost: 5
            },
            {
              id: '1-1-2',
              name: 'Fallacy Detector',
              description: 'Identify logical fallacies in arguments',
              usageCount: 980,
              averageTime: '30s',
              status: 'active',
              creditCost: 3
            }
          ]
        },
        {
          id: '1-2',
          name: 'Audience Analysis',
          description: 'Tools for understanding and connecting with your audience',
          isExpanded: false,
          tools: [
            {
              id: '1-2-1',
              name: 'Persona Generator',
              description: 'Create detailed audience personas',
              usageCount: 750,
              averageTime: '60s',
              status: 'active',
              creditCost: 8
            }
          ]
        }
      ]
    },
    {
      id: '2',
      name: 'Leadership',
      description: 'Tools for developing leadership skills',
      isExpanded: false,
      suites: [
        {
          id: '2-1',
          name: 'Decision Making',
          description: 'Tools for making better decisions',
          isExpanded: false,
          tools: [
            {
              id: '2-1-1',
              name: 'Decision Matrix',
              description: 'Create and analyze decision matrices',
              usageCount: 500,
              averageTime: '90s',
              status: 'active',
              creditCost: 10
            }
          ]
        }
      ]
    }
  ]);

  const toggleCollection = (collectionId: string) => {
    setCollections(prev => prev.map(collection => 
      collection.id === collectionId 
        ? { ...collection, isExpanded: !collection.isExpanded }
        : collection
    ));
  };

  const toggleSuite = (collectionId: string, suiteId: string) => {
    setCollections(prev => prev.map(collection => 
      collection.id === collectionId 
        ? {
            ...collection,
            suites: collection.suites.map(suite =>
              suite.id === suiteId
                ? { ...suite, isExpanded: !suite.isExpanded }
                : suite
            )
          }
        : collection
    ));
  };

  const getStatusColor = (status: AITool['status']) => {
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

  // Filter collections based on search
  const filteredCollections = collections.map(collection => ({
    ...collection,
    suites: collection.suites.map(suite => ({
      ...suite,
      tools: suite.tools.filter(tool =>
        tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tool.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    })).filter(suite => suite.tools.length > 0)
  })).filter(collection => collection.suites.length > 0);

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
              <h1 className="text-2xl font-semibold text-[var(--foreground)]">AI Engine</h1>
            </div>
            <button className="px-4 py-2 bg-[var(--accent)] text-white rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2">
              <Plus className="w-5 h-5" />
              <span>New Tool</span>
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
              placeholder="Search AI tools..."
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
        <div className="space-y-6">
          {filteredCollections.map((collection) => (
            <div
              key={collection.id}
              className="border border-[var(--border-color)] rounded-lg bg-[var(--card-bg)]"
            >
              {/* Collection Header */}
              <button
                onClick={() => toggleCollection(collection.id)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-[var(--hover-bg)] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <ArrowRight className="w-5 h-5 text-[var(--text-secondary)]" />
                  <div className="text-left">
                    <h2 className="text-lg font-medium text-[var(--foreground)]">
                      {collection.name}
                    </h2>
                    <p className="text-sm text-[var(--text-secondary)]">
                      {collection.description}
                    </p>
                  </div>
                </div>
                <ChevronDown className={cn(
                  "w-5 h-5 text-[var(--text-secondary)] transition-transform",
                  collection.isExpanded && "rotate-180"
                )} />
              </button>

              {/* Suites */}
              {collection.isExpanded && (
                <div className="border-t border-[var(--border-color)]">
                  {collection.suites.map((suite) => (
                    <div key={suite.id} className="border-b border-[var(--border-color)] last:border-0">
                      {/* Suite Header */}
                      <button
                        onClick={() => toggleSuite(collection.id, suite.id)}
                        className="w-full px-6 py-4 flex items-center justify-between hover:bg-[var(--hover-bg)] transition-colors"
                      >
                        <div className="flex items-center gap-3 pl-8">
                          <ArrowRight className="w-5 h-5 text-[var(--text-secondary)]" />
                          <div className="text-left">
                            <h3 className="text-base font-medium text-[var(--foreground)]">
                              {suite.name}
                            </h3>
                            <p className="text-sm text-[var(--text-secondary)]">
                              {suite.description}
                            </p>
                          </div>
                        </div>
                        <ChevronDown className={cn(
                          "w-5 h-5 text-[var(--text-secondary)] transition-transform",
                          suite.isExpanded && "rotate-180"
                        )} />
                      </button>

                      {/* Tools Grid */}
                      {suite.isExpanded && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 pl-16">
                          {suite.tools.map((tool) => (
                            <div
                              key={tool.id}
                              className="border border-[var(--border-color)] rounded-lg p-4 hover:border-[var(--accent)] transition-colors"
                            >
                              <div className="flex justify-between items-start mb-3">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className={cn(
                                      "w-2 h-2 rounded-full",
                                      getStatusColor(tool.status)
                                    )} />
                                    <span className="text-xs text-[var(--text-secondary)]">
                                      {tool.status}
                                    </span>
                                  </div>
                                  <h4 className="font-medium text-[var(--foreground)]">
                                    {tool.name}
                                  </h4>
                                </div>
                                <button className="p-1 rounded-lg hover:bg-[var(--hover-bg)] transition-colors">
                                  <Settings className="w-4 h-4 text-[var(--text-secondary)]" />
                                </button>
                              </div>
                              <p className="text-sm text-[var(--text-secondary)] mb-4">
                                {tool.description}
                              </p>
                              <div className="flex items-center justify-between text-sm text-[var(--text-secondary)]">
                                <div className="flex items-center gap-4">
                                  <div className="flex items-center gap-1">
                                    <ArrowRight className="w-4 h-4 text-[var(--text-secondary)]" />
                                    <span>{tool.usageCount}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <ArrowRight className="w-4 h-4 text-[var(--text-secondary)]" />
                                    <span>{tool.averageTime}</span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1">
                                  <ArrowRight className="w-4 h-4 text-[var(--text-secondary)]" />
                                  <span>{tool.creditCost} credits</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 
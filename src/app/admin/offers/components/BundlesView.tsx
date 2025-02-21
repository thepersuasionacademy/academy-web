import React from 'react';
import { cn } from "@/lib/utils";

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

interface BundlesViewProps {
  searchQuery: string;
}

export default function BundlesView({ searchQuery }: BundlesViewProps) {
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

  // Filter bundles based on search
  const filteredBundles = bundles.filter(bundle => 
    bundle.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    bundle.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {filteredBundles.map((bundle) => (
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
  );
} 
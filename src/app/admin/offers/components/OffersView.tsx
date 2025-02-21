import React from 'react';
import { cn } from "@/lib/utils";

interface Offer {
  id: string;
  title: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  startDate: string;
  endDate: string | null;
  usageLimit: number | null;
  usageCount: number;
  status: 'active' | 'draft';
  applicableTo: {
    type: 'content' | 'collection' | 'all';
    name: string;
  };
  variations: {
    name: string;
    discountValue: number;
  }[];
}

interface OffersViewProps {
  searchQuery: string;
  selectedStatus: Offer['status'] | 'all';
  onStatusChange: (status: Offer['status'] | 'all') => void;
}

export default function OffersView({ searchQuery, selectedStatus, onStatusChange }: OffersViewProps) {
  // Mock offers data
  const offers: Offer[] = [
    {
      id: '1',
      title: 'Early Bird Special',
      description: 'Get 20% off on all leadership courses',
      discountType: 'percentage',
      discountValue: 20,
      startDate: '2024-03-01',
      endDate: '2024-04-30',
      usageLimit: 100,
      usageCount: 45,
      status: 'active',
      applicableTo: {
        type: 'collection',
        name: 'Leadership'
      },
      variations: [
        { name: 'Basic', discountValue: 20 },
        { name: 'Premium', discountValue: 30 },
        { name: 'Enterprise', discountValue: 40 }
      ]
    },
    {
      id: '2',
      title: 'Summer Bundle',
      description: '$50 off when you buy any 2 courses',
      discountType: 'fixed',
      discountValue: 50,
      startDate: '2024-06-01',
      endDate: '2024-08-31',
      usageLimit: null,
      usageCount: 0,
      status: 'draft',
      applicableTo: {
        type: 'all',
        name: 'All Courses'
      },
      variations: [
        { name: 'Starter', discountValue: 50 },
        { name: 'Pro', discountValue: 100 }
      ]
    },
    {
      id: '3',
      title: 'Flash Sale',
      description: '30% off on Persuasion Mastery',
      discountType: 'percentage',
      discountValue: 30,
      startDate: '2024-02-15',
      endDate: '2024-02-20',
      usageLimit: 50,
      usageCount: 50,
      status: 'draft',
      applicableTo: {
        type: 'content',
        name: 'Persuasion Mastery'
      },
      variations: [
        { name: 'Individual', discountValue: 30 },
        { name: 'Team', discountValue: 45 }
      ]
    }
  ];

  // Filter offers based on search and status
  const filteredOffers = offers.filter(offer => {
    const matchesSearch = offer.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         offer.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || offer.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {filteredOffers.map((offer) => (
        <div
          key={offer.id}
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
              {offer.title}
            </h3>
            <p className="text-lg text-[var(--text-secondary)] line-clamp-2 group-hover:text-[var(--foreground)] transition-colors">
              {offer.description}
            </p>
          </div>

          <div className="mt-auto pt-6">
            <div className="flex flex-wrap gap-2">
              {offer.variations.map((variation) => (
                <div
                  key={variation.name}
                  className={cn(
                    "px-3 py-1 rounded-lg text-sm font-medium",
                    "border border-[var(--text-secondary)] bg-[var(--card-bg)]",
                    "text-[var(--text-secondary)]",
                    "group-hover:border-[var(--accent)]",
                    "transition-colors"
                  )}
                >
                  {variation.name} - {offer.discountType === 'percentage' ? `${variation.discountValue}%` : `$${variation.discountValue}`}
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
} 
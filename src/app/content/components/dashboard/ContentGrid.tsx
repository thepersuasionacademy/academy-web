import { useState } from 'react';
import { BentoCard } from '@/app/content/components/BentoCard';
import { MobileCarousel } from './MobileCarousel';
import { cn } from "@/lib/utils";

interface Category {
  name: string;
  items: {
    id: string;
    title: string;
    description: string;
    image: string;
    has_access: boolean;
    debug_info?: any;
  }[];
}

interface ContentGridProps {
  categories: Category[];
  onItemClick: (itemId: string) => void;
}

// Extract card rendering to avoid duplication
const ContentCard = ({ item, onClick }: { 
  item: Category['items'][0], 
  onClick: (id: string, e: React.MouseEvent) => void 
}) => {
  // Debug log in development
  if (process.env.NODE_ENV === 'development' && item.debug_info) {
    console.log(`Access debug for ${item.title}:`, item.debug_info);
  }
  
  return (
    <BentoCard
      title={item.title}
      description={item.description}
      image={item.image}
      onClick={(e) => onClick(item.id, e)}
      has_access={item.has_access}
    />
  );
};

export const ContentGrid = ({ categories, onItemClick }: ContentGridProps) => {
  const handleCardClick = (itemId: string, event: React.MouseEvent) => {
    event.preventDefault();
    onItemClick(itemId);
  };

  // Sort items within each category to show unlocked items first
  const sortedCategories = categories.map(category => ({
    ...category,
    items: [...category.items].sort((a, b) => {
      // Sort by access first (accessible items come first)
      if (a.has_access && !b.has_access) return -1;
      if (!a.has_access && b.has_access) return 1;
      // If access is the same, maintain original order
      return 0;
    })
  }));

  return (
    <div className="relative py-8 space-y-12">
      {sortedCategories.map((category) => (
        <div key={category.name} className="relative">
          {/* Desktop View */}
          <div className="hidden md:block">
            <div className="px-6">
              <h2 className="text-2xl font-semibold mb-4 ml-4">{category.name}</h2>
              <div className="relative">
                <div className="flex gap-4 overflow-x-auto pt-4 pb-8 -my-4 pl-4 -ml-4 scrollbar-hide">
                  {category.items.map((item) => (
                    <div 
                      key={item.id} 
                      className="relative"
                      style={{ width: '23%', minWidth: '400px', height: '250px', flexShrink: 0 }}
                    >
                      <ContentCard item={item} onClick={handleCardClick} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Mobile View */}
          <div className="block md:hidden">
            <MobileCarousel
              title={category.name}
              items={category.items.map((item) => (
                <div key={item.id} className="relative pt-4 pl-4 -ml-4">
                  <ContentCard item={item} onClick={handleCardClick} />
                </div>
              ))}
            />
          </div>
        </div>
      ))}
    </div>
  );
};
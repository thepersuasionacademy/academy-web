import { useState } from 'react';
import { BentoCard } from '@/components/BentoCard';
import { MobileCarousel } from './MobileCarousel';
import { Category } from '@/lib/types/dashboard';
import { cn } from "@/lib/utils";

interface ContentGridProps {
  categories: Category[];
  onItemClick: (itemId: string) => void;
}

export const ContentGrid = ({ categories, onItemClick }: ContentGridProps) => {
  const handleCardClick = (itemId: string, event: React.MouseEvent) => {
    event.preventDefault();
    onItemClick(itemId);
  };

  return (
    <div className="relative py-8 space-y-12">
      {categories.map((category) => (
        <div key={category.name} className="relative">
          <div className="hidden md:block">
            <div className="px-10">
              <h2 className="text-2xl font-semibold mb-4">{category.name}</h2>
              <div className="relative overflow-visible">
                <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                  {category.items.map((item) => (
                    <div 
                      key={item.id} 
                      style={{ width: '23%', minWidth: '400px', height: '250px', flexShrink: 0 }}
                    >
                      <BentoCard
                        title={item.title}
                        description={item.description}
                        image={item.image}
                        tracks={item.tracks}
                        href="#"
                        onClick={(e) => handleCardClick(item.id, e)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="block md:hidden">
            <MobileCarousel
              title={category.name}
              items={category.items.map((item) => (
                <div key={item.id} onClick={() => onItemClick(item.id)}>
                  <BentoCard
                    title={item.title}
                    description={item.description}
                    image={item.image}
                    tracks={item.tracks}
                    href="#"
                    onClick={(e) => handleCardClick(item.id, e)}
                  />
                </div>
              ))}
            />
          </div>
        </div>
      ))}
    </div>
  );
};
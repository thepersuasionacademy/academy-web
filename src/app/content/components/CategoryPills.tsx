'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

const categories = [
  { name: 'Learning', id: 'learning' },
  { name: 'Imprinting', id: 'imprinting' }
] as const;

type CategoryId = typeof categories[number]['id'];

interface CategoryPillsProps {
  onCategoryChange?: (category: CategoryId) => void;
}

export function CategoryPills({ onCategoryChange }: CategoryPillsProps) {
  const [activeCategory, setActiveCategory] = useState<CategoryId>('learning');

  const handleCategoryClick = (categoryId: CategoryId) => {
    setActiveCategory(categoryId);
    onCategoryChange?.(categoryId);
  };

  return (
    <div className="flex justify-center gap-4 py-2 bg-transparent">
      {categories.map((category) => (
        <button
          key={category.id}
          onClick={() => handleCategoryClick(category.id)}
          className={cn(
            'px-6 py-3 rounded-full text-base font-medium transition-colors',
            'border border-[var(--border-color)]',
            activeCategory === category.id
              ? 'bg-[var(--accent)] text-white border-transparent'
              : 'hover:bg-[var(--hover-bg)] text-[var(--text-secondary)]'
          )}
        >
          {category.name}
        </button>
      ))}
    </div>
  );
} 
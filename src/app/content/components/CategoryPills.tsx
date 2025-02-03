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
    <div className="h-14 flex items-center justify-center gap-4">
      {categories.map((category) => (
        <button
          key={category.id}
          onClick={() => handleCategoryClick(category.id)}
          className={cn(
            'h-10 px-6 rounded-full text-base font-medium transition-all duration-200',
            'border',
            activeCategory === category.id
              ? 'bg-[var(--accent)] text-white border-[var(--accent)]'
              : 'text-[var(--text-secondary)] border-[var(--border-color)] hover:border-[var(--accent)] hover:text-[var(--foreground)] hover:bg-[var(--hover-bg)]'
          )}
        >
          {category.name}
        </button>
      ))}
    </div>
  );
} 
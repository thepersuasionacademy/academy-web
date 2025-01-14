// components/tools/admin/CategorySidebar.tsx
'use client'

import { Search } from 'lucide-react'
import { useState } from 'react'

type Category = {
  id: string
  name: string
}

interface CategorySidebarProps {
  categories: Category[]
  selectedCategory: string | null
  onSelectCategory: (category: string) => void
  isLoadingCategories: boolean
  categoryInput: string
  setCategoryInput: (value: string) => void
}

export default function CategorySidebar({
  categories,
  selectedCategory,
  onSelectCategory,
  isLoadingCategories,
  categoryInput,
  setCategoryInput
}: CategorySidebarProps) {
  return (
    <div className="w-64 border-r border-gray-700 p-4">
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={categoryInput}
            onChange={(e) => setCategoryInput(e.target.value)}
            placeholder="Search categories..."
            className="w-full pl-8 pr-4 py-2 bg-gray-800/50 rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#9d042b]"
          />
        </div>
      </div>
      
      {isLoadingCategories ? (
        <div className="text-gray-400 p-2">Loading categories...</div>
      ) : (
        categories.map((category) => (
          <div
            key={category.id}
            className={`mb-2 p-2 rounded-lg cursor-pointer transition-colors duration-200 ${
              selectedCategory === category.name 
                ? 'bg-[#9d042b] text-white' 
                : 'text-gray-300 hover:bg-gray-800/50'
            }`}
            onClick={() => onSelectCategory(category.name)}
          >
            {category.name}
          </div>
        ))
      )}
    </div>
  )
}
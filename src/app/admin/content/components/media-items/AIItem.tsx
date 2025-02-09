import React, { useState, useEffect } from 'react';
import { Eye, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MediaItemProps } from './types';
import { useCategories } from '@/app/ai/hooks/useCategories';
import { useSuites } from '@/app/ai/hooks/useSuites';
import { useTools } from '@/app/ai/hooks/useTools';
import { AIToolModal } from '@/app/ai/components/AIToolModal';
import type { AITool } from '@/lib/supabase/ai';
import type { AIItem as AIItemType } from '@/types/content';

interface AIItemProps extends Omit<MediaItemProps, 'item'> {
  item: Partial<AIItemType>;
}

export function AIItem({ item, onUpdate, onRemove }: AIItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);
  const [selectedSuite, setSelectedSuite] = useState<string | undefined>(undefined);
  const [selectedTool, setSelectedTool] = useState<string | undefined>(undefined);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showSuiteDropdown, setShowSuiteDropdown] = useState(false);
  const [showToolDropdown, setShowToolDropdown] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { categories, isLoadingCategories } = useCategories();
  const { suites, isLoadingSuites } = useSuites(selectedCategory ?? null);
  const { tools, isLoadingTools } = useTools(selectedCategory ?? null, selectedSuite ?? null);

  // Initialize values from item.tool when component mounts or item changes
  useEffect(() => {
    if (item.tool) {
      const tool = item.tool;
      setSelectedCategory(tool.collection_title ?? undefined);
      setSelectedSuite(tool.suite_title ?? undefined);
      setSelectedTool(tool.title ?? undefined);
    }
  }, [item.tool]);

  const handleCategorySelect = (name: string) => {
    setSelectedCategory(name);
    setSelectedSuite(undefined);
    setSelectedTool(undefined);
    setShowCategoryDropdown(false);
    onUpdate({ title: name });
  };

  const handleSuiteSelect = (name: string) => {
    setSelectedSuite(name);
    setSelectedTool(undefined);
    setShowSuiteDropdown(false);
  };

  const handleToolSelect = (tool: AITool) => {
    setSelectedTool(tool.title ?? undefined);
    setShowToolDropdown(false);
    onUpdate({
      title: tool.title ?? '',
      tool_id: tool.id
    });
  };

  // Find the selected tool object
  const currentTool = tools.find(tool => tool.id === item.tool_id) || item.tool;

  return (
    <div className="flex flex-col">
      <div className="flex items-center">
        {/* Category Input */}
        <div className="flex-1 relative">
          <input
            type="text"
            value={selectedCategory ?? ''}
            onChange={e => setSelectedCategory(e.target.value)}
            onFocus={() => setShowCategoryDropdown(true)}
            placeholder="Select Category"
            className="w-full px-4 py-3 text-2xl font-medium bg-transparent focus:outline-none text-[var(--foreground)]"
          />
          {showCategoryDropdown && (
            <div className="absolute top-full left-0 right-0 mt-1 py-1 rounded-lg border border-[var(--border-color)] bg-[var(--card-bg)] shadow-lg z-10">
              {categories.map(category => (
                <button
                  key={category.id}
                  onClick={() => category.title && handleCategorySelect(category.title)}
                  className="w-full px-4 py-2 text-left hover:bg-[var(--hover-bg)] transition-colors"
                >
                  {category.title}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Vertical Divider */}
        <div className="w-px h-12 bg-[var(--border-color)]" />

        {/* Suite Input */}
        <div className="flex-1 relative">
          <input
            type="text"
            value={selectedSuite ?? ''}
            onChange={e => setSelectedSuite(e.target.value)}
            onFocus={() => selectedCategory && setShowSuiteDropdown(true)}
            placeholder={selectedCategory ? "Select Suite" : "Select Category First"}
            disabled={!selectedCategory}
            className="w-full px-4 py-3 text-2xl font-medium bg-transparent focus:outline-none text-[var(--foreground)] disabled:opacity-50 disabled:cursor-not-allowed"
          />
          {showSuiteDropdown && (
            <div className="absolute top-full left-0 right-0 mt-1 py-1 rounded-lg border border-[var(--border-color)] bg-[var(--card-bg)] shadow-lg z-10">
              {suites.map(suite => (
                <button
                  key={suite.id}
                  onClick={() => suite.title && handleSuiteSelect(suite.title)}
                  className="w-full px-4 py-2 text-left hover:bg-[var(--hover-bg)] transition-colors"
                >
                  {suite.title}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Vertical Divider */}
        <div className="w-px h-12 bg-[var(--border-color)]" />

        {/* Tool Input */}
        <div className="flex-1 relative">
          <div className="flex items-center">
            <input
              type="text"
              value={selectedTool ?? ''}
              onChange={e => setSelectedTool(e.target.value)}
              onFocus={() => selectedSuite && setShowToolDropdown(true)}
              placeholder={selectedSuite ? "Select Tool" : "Select Suite First"}
              disabled={!selectedSuite}
              className="flex-1 px-4 py-3 text-2xl font-medium bg-transparent focus:outline-none text-[var(--foreground)] disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <button
              onClick={onRemove}
              className="p-2 mr-2 rounded-lg hover:bg-red-500/10 text-red-500 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          {showToolDropdown && (
            <div className="absolute top-full left-0 right-0 mt-1 py-1 rounded-lg border border-[var(--border-color)] bg-[var(--card-bg)] shadow-lg z-10">
              {tools.map(tool => (
                <button
                  key={tool.id}
                  onClick={() => tool.title && handleToolSelect(tool)}
                  className="w-full px-4 py-2 text-left hover:bg-[var(--hover-bg)] transition-colors"
                >
                  {tool.title}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {currentTool && (
        <>
          <button
            onClick={() => setIsModalOpen(true)}
            className="w-full py-2 border-t border-[var(--border-color)] hover:bg-[var(--hover-bg)] transition-colors group"
          >
            <div className="flex items-center justify-center gap-1.5 text-sm text-[var(--text-secondary)] group-hover:text-[var(--foreground)]">
              See Full Content
              <Eye className="w-3.5 h-3.5" />
            </div>
          </button>

          <AIToolModal
            tool={currentTool}
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
          />
        </>
      )}
    </div>
  );
} 
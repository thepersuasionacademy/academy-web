import React, { useState } from 'react';
import { cn } from "@/lib/utils";
import { AICreditsTab } from './AICreditsTab';
import { ContentTab } from './ContentTab';
import { BillingTab } from './BillingTab';
import type { AIItem } from '../types';

interface TabsContainerProps {
  isAdmin: boolean;
  userId?: string;
  aiItems: AIItem[];
}

type TabType = 'credits' | 'content' | 'billing';

export function TabsContainer({ isAdmin, userId, aiItems }: TabsContainerProps) {
  const [activeTab, setActiveTab] = useState<TabType>('credits');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'credits':
        return <AICreditsTab aiItems={aiItems} />;
      case 'content':
        return <ContentTab aiItems={aiItems} isAdmin={isAdmin} />;
      case 'billing':
        return <BillingTab userId={userId} />;
      default:
        return null;
    }
  };

  return (
    <div className="max-w-6xl mx-auto mt-8 px-6 pb-16">
      {/* Centered tab buttons */}
      <div className="flex justify-center mb-8">
        <div className="inline-flex items-center gap-2 p-1 rounded-lg bg-[var(--card-bg)] border border-[var(--border-color)]">
          <button 
            onClick={() => setActiveTab('credits')}
            className={cn(
              "px-6 py-3 rounded-md text-lg font-medium transition-all",
              activeTab === 'credits' 
                ? "bg-[var(--accent)] text-white" 
                : "hover:bg-[var(--hover-bg)]"
            )}>
            AI Credits
          </button>
          <button 
            onClick={() => setActiveTab('content')}
            className={cn(
              "px-6 py-3 rounded-md text-lg font-medium transition-all",
              activeTab === 'content' 
                ? "bg-[var(--accent)] text-white" 
                : "hover:bg-[var(--hover-bg)]"
            )}>
            Content
          </button>
          <button 
            onClick={() => setActiveTab('billing')}
            className={cn(
              "px-6 py-3 rounded-md text-lg font-medium transition-all",
              activeTab === 'billing' 
                ? "bg-[var(--accent)] text-white" 
                : "hover:bg-[var(--hover-bg)]"
            )}>
            Billing
          </button>
        </div>
      </div>

      {/* Tab content */}
      {renderTabContent()}
    </div>
  );
} 
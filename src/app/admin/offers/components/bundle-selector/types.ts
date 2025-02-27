import { AICollection, AISuite as SupabaseAISuite, AITool as SupabaseAITool } from '@/lib/supabase/ai';

export type AccessType = 'ai' | 'content' | null;

// Interface for drip settings
export interface DripSetting {
  value: number;
  unit: 'days' | 'weeks' | 'months';
}

export interface BundleAccessSelectorProps {
  bundleId: string;
  onSave: (data: any) => void;
  onCancel: () => void;
}

export interface ContentItem {
  id: string;
  title: string | null;
  description: string | null;
  type: string | null;
  thumbnail: string | null;
}

export interface SearchResult {
  id: string;
  title: string | null;
  author: string | null;
  type: string | null;
  slug: string | null;
  thumbnail: string | null;
}

export interface ContentTemplate {
  id: string;
  template: string | null;
}

// Export types from Supabase for consistency across components
export type AICategory = AICollection & {
  title: string | null;
};

export type AISuite = SupabaseAISuite & {
  title: string | null;
};

export type AITool = SupabaseAITool & {
  title: string | null;
  credits_per_use: number | null;
};

// Pagination constants
export const ITEMS_PER_PAGE = 5; 
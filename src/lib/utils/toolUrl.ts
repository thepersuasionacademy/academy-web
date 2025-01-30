import { slugify } from './slugify';
import type { AITool } from '@/lib/supabase/ai';

export function getToolUrl(tool: AITool): string {
  return `/ai/tools/${slugify(tool.title || '')}`;
}

export function getToolUrlFromTitle(title: string): string {
  return `/ai/tools/${slugify(title)}`;
} 
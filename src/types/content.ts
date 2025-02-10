import { AIInput, AIPrompt } from '@/lib/supabase/ai';

export const ContentStatus = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  ARCHIVED: 'archived'
} as const;

export type ContentStatus = typeof ContentStatus[keyof typeof ContentStatus];

export const MediaType = {
  VIDEO: 'VIDEO',
  TEXT: 'TEXT',
  AI: 'AI',
  PDF: 'PDF',
  QUIZ: 'QUIZ'
} as const;

export type MediaType = typeof MediaType[keyof typeof MediaType];

export const VideoNameType = {
  VIDEO: 'VIDEO',
  LESSON: 'LESSON',
  IMPRINTING_SESSION: 'IMPRINTING_SESSION'
} as const;

export type VideoNameType = typeof VideoNameType[keyof typeof VideoNameType];

export const PDFType = {
  TRANSCRIPT: 'TRANSCRIPT',
  NOTES: 'NOTES',
  CUSTOM: 'CUSTOM'
} as const;

export type PDFType = typeof PDFType[keyof typeof PDFType];

export interface MediaItemBase {
  id: string;
  type: MediaType;
  title: string;
  order: number;
  showTypeSelector?: boolean;
  showNameSuggestions?: boolean;
}

export interface VideoItem extends MediaItemBase {
  type: 'VIDEO';
  video_id: string | null;
  video_name: VideoNameType | null;
}

export interface TextItem extends MediaItemBase {
  type: 'TEXT';
  content_text: string | null;
}

export interface AIItem extends MediaItemBase {
  type: 'AI';
  tool_id: string | null;
  tool?: {
    id: string;
    title: string;
    description: string;
    credits_cost: number;
    collection_title: string | null;
    suite_title: string | null;
    inputs: AIInput[];
    prompts: AIPrompt[];
  } | null;
}

export interface PDFItem extends MediaItemBase {
  type: 'PDF';
  pdf_url: string | null;
  pdf_type: PDFType | null;
  custom_pdf_type: string | null;
}

export interface QuizItem extends MediaItemBase {
  type: 'QUIZ';
  quiz_data: Record<string, any>;
}

export type MediaItem = VideoItem | TextItem | AIItem | PDFItem | QuizItem;

export interface Collection {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface Content {
  id: string;
  collection_id: string;
  title: string;
  description: string | null;
  status: ContentStatus;
  thumbnail_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Module {
  id: string;
  content_id: string;
  title: string;
  description: string | null;
  order: number;
  created_at: string;
  updated_at: string;
}

export interface Media {
  id: string;
  module_id: string;
  content_id: string;
  title: string;
  description: string | null;
  order: number;
  created_at: string;
  updated_at: string;
}

export interface VideoContent {
  id: string;
  media_id: string;
  content_id: string;
  title: string;
  video_id: string;
  video_name: VideoNameType | null;
  order: number;
  created_at: string;
  updated_at: string;
}

export interface TextContent {
  id: string;
  media_id: string;
  content_id: string;
  title: string;
  content_text: string;
  order: number;
  created_at: string;
  updated_at: string;
}

export interface AIContent {
  id: string;
  media_id: string;
  content_id: string;
  title: string;
  tool_id: string;
  tool?: {
    id: string;
    title: string;
    description: string;
    credits_cost: number;
    collection_title: string | null;
    suite_title: string | null;
    inputs: AIInput[];
    prompts: AIPrompt[];
  } | null;
  order: number;
  created_at: string;
  updated_at: string;
}

export interface PDFContent {
  id: string;
  media_id: string;
  content_id: string;
  title: string;
  pdf_url: string;
  pdf_type: PDFType | null;
  custom_pdf_type: string | null;
  order: number;
  created_at: string;
  updated_at: string;
}

export interface QuizContent {
  id: string;
  media_id: string;
  content_id: string;
  title: string;
  quiz_data: Record<string, any>;
  order: number;
  created_at: string;
  updated_at: string;
}

export interface ExtendedContent extends Content {
  modules: {
    id: string;
    title: string;
    description: string | null;
    order: number;
    created_at: string;
    updated_at: string;
    media: {
      id: string;
      title: string;
      description: string | null;
      order: number;
      created_at: string;
      updated_at: string;
      items: MediaItem[];
    }[];
  }[];
  collection: Collection | null;
  stats: {
    enrolled_count: number;
    created_at: string;
    updated_at: string;
  };
}

// Partial types for updates
export type MediaItemUpdates = Partial<MediaItem>;
export type ModuleUpdates = Partial<Module>;
export type ContentUpdates = Partial<Content>;

export interface AITool {
  id: string;
  title: string;
  description: string;
  credits_cost: number;
  collection_title: string | null;
  suite_title: string | null;
  inputs: AIInput[];
  prompts: AIPrompt[];
} 
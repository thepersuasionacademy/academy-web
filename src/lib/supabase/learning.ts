import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export interface Collection {
  id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
  type: string;
}

export interface Content {
  id: string;
  collection_id: string;
  title: string;
  description?: string;
  status: 'draft' | 'published' | 'archived';
  thumbnail_url?: string;
  created_at: string;
  updated_at: string;
  has_access?: boolean;
  available_at?: string | null;
  debug_info?: any;
}

export type LessonType = 'text' | 'video';
export type LessonStatus = 'draft' | 'published';

export interface Lesson {
  id: string;
  content_id: string;
  title: string;
  description?: string;
  lesson_type: LessonType;
  content_text?: string;
  video_id?: string;
  order: number;
  created_at: string;
  updated_at: string;
  status: LessonStatus;
  tool_id?: string;
}

export interface Module {
  id: string;
  title: string;
  description?: string;
  order: number;
  created_at: string;
  updated_at: string;
  has_access?: boolean;
  available_at?: string | null;
  media: Array<{
    id: string;
    title: string;
    order: number;
    has_access?: boolean;
    available_at?: string | null;
    video_id?: string;
    video_name?: string;
    content_text?: string;
    text_title?: string;
    tool_id?: string;
    tool?: {
      id: string;
      title: string;
      description: string;
      credits_cost: number;
      collection_title?: string | null;
      suite_title?: string | null;
    } | null;
    pdf_url?: string;
    pdf_title?: string;
    quiz_data?: any;
    quiz_title?: string;
  }>;
}

export interface ContentWithModules {
  content: Content & {
    collection: {
      id: string;
      name: string;
      description: string;
    };
    stats?: {
      enrolled_count: number;
      created_at: string;
      updated_at: string;
    };
  };
  modules: Module[];
  debug?: {
    function_start_time: string;
    function_end_time: string;
    execution_time_ms: number;
    p_suite_id: string;
    p_user_id: string;
    auth_uid: string;
    access_settings_found: boolean;
    access_starts_at: string | null;
    access_settings: any;
  };
}

export async function getCollections() {
  const supabase = createClientComponentClient();
  const { data: collections, error } = await supabase
    .rpc('get_content_collections');

  if (error) {
    console.error('Error fetching collections');
    throw error;
  }

  return collections;
}

export async function getContent(collectionId: string) {
  const supabase = createClientComponentClient();
  const { data: content, error } = await supabase
    .rpc('get_content_by_collection', { p_collection_id: collectionId });

  if (error) {
    console.error('Error fetching content');
    throw error;
  }

  return content;
}

export async function getLessons(contentId: string) {
  const supabase = createClientComponentClient();
  const { data: lessons, error } = await supabase
    .rpc('get_content_cards', { p_content_id: contentId });

  if (error) {
    console.error('Error fetching lessons');
    throw error;
  }

  return lessons;
}

export async function getContentById(contentId: string): Promise<ContentWithModules> {
  const supabase = createClientComponentClient();
  const { data, error } = await supabase
    .rpc('get_content_by_id', { p_content_id: contentId });

  if (error) {
    console.error('Error fetching content');
    throw error;
  }

  // If data is an array, take the first item
  const rawContent = Array.isArray(data) ? data[0] : data;

  if (!rawContent) {
    throw new Error('Content not found');
  }

  // Transform the flat content structure into the expected nested format
  const transformedContent: ContentWithModules = {
    content: {
      id: rawContent.id,
      collection_id: rawContent.collection_id,
      title: rawContent.title,
      description: rawContent.description || '',
      status: rawContent.status || 'draft',
      thumbnail_url: rawContent.thumbnail_url,
      created_at: rawContent.created_at,
      updated_at: rawContent.updated_at || rawContent.created_at,
      collection: {
        id: rawContent.collection_id,
        name: '', // We'll need to fetch this separately if needed
        description: ''
      },
      stats: {
        enrolled_count: 0,
        created_at: rawContent.created_at,
        updated_at: rawContent.updated_at || rawContent.created_at
      }
    },
    modules: [] // Initialize with empty modules array
  };

  // Fetch modules for this content
  const { data: modules, error: modulesError } = await supabase
    .rpc('get_content_cards', { p_content_id: contentId });

  if (modulesError) {
    console.error('Error fetching modules');
  } else if (modules) {
    transformedContent.modules = Array.isArray(modules) ? modules : [modules];
  }

  return transformedContent;
}

export async function getStreamingContentBySuiteId(contentId: string): Promise<ContentWithModules> {
  try {
    const response = await fetch(`/api/content/streaming?id=${contentId}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch content');
    }

    return await response.json();
  } catch (error) {
    console.error('Error loading content');
    throw new Error('Failed to load content');
  }
} 
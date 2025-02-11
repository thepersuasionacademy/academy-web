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
  media: any[]; // You can type this more specifically if needed
}

export interface ContentWithModules {
  content: Content & {
    collection: {
      id: string;
      name: string;
      description: string;
    };
    stats: {
      enrolled_count: number;
      created_at: string;
      updated_at: string;
    };
  };
  modules: Module[];
}

export async function getCollections() {
  const supabase = createClientComponentClient();
  const { data: collections, error } = await supabase
    .rpc('get_content_collections');

  if (error) {
    console.error('Error fetching collections:', error);
    throw error;
  }

  return collections;
}

export async function getContent(collectionId: string) {
  const supabase = createClientComponentClient();
  const { data: content, error } = await supabase
    .rpc('get_content_by_collection', { p_collection_id: collectionId });

  if (error) {
    console.error('Error fetching content:', error);
    throw error;
  }

  return content;
}

export async function getLessons(contentId: string) {
  const supabase = createClientComponentClient();
  const { data: lessons, error } = await supabase
    .rpc('get_content_cards', { p_content_id: contentId });

  if (error) {
    console.error('Error fetching lessons:', error);
    throw error;
  }

  return lessons;
}

export async function getContentById(contentId: string): Promise<ContentWithModules> {
  const supabase = createClientComponentClient();
  const { data, error } = await supabase
    .rpc('get_content_by_id', { p_content_id: contentId });

  if (error) {
    console.error('Error fetching content:', error);
    throw error;
  }

  return data;
} 
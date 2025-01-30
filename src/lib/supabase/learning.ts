import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export interface Collection {
  id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
  type: string;
}

export interface Course {
  id: string;
  collection_id: string;
  title: string;
  description?: string;
  thumbnail?: string;
  created_at: string;
  updated_at: string;
  status: string;
}

export type LessonType = 'text' | 'video';
export type LessonStatus = 'draft' | 'published';

export interface Lesson {
  id: string;
  course_id: string;
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

export async function getCollections() {
  const supabase = createClientComponentClient();
  const { data: collections, error } = await supabase
    .rpc('get_learning_collections');

  if (error) {
    console.error('Error fetching collections:', error);
    throw error;
  }

  return collections;
}

export async function getCourses(collectionId: string) {
  const supabase = createClientComponentClient();
  const { data: courses, error } = await supabase
    .rpc('get_learning_courses', { collection_id_param: collectionId });

  if (error) {
    console.error('Error fetching courses:', error);
    throw error;
  }

  return courses;
}

export async function getLessons(courseId: string) {
  const supabase = createClientComponentClient();
  const { data: lessons, error } = await supabase
    .rpc('get_learning_lessons', { course_id_param: courseId });

  if (error) {
    console.error('Error fetching lessons:', error);
    throw error;
  }

  return lessons;
} 
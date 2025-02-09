export interface Collection {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export type CollectionInsert = Omit<Collection, 'id'>;

export interface Content {
  id: string;
  collection_id: string;
  title: string;
  description: string | null;
  status: 'draft' | 'published' | 'archived';
  thumbnail_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Module {
  id: string;
  content_id: string;
  title: string;
  order: number;
  created_at: string;
  updated_at: string;
}

export interface Media {
  id: string;
  module_id: string;
  content_id: string;
  title: string;
  order: number;
  created_at: string;
  updated_at: string;
} 
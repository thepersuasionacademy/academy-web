export interface LinkCollection {
  id: string;
  title: string;
  description: string | null;
}

export interface LinkSuite {
  id: string;
  collection_id: string;
  title: string;
  description: string | null;
}

export interface SavedLink {
  id: string;
  title: string;
  url: string;
  description: string | null;
  type: string;
  status: string;
  tags: string[];
  created_at: string;
  last_accessed?: string;
  suite_id: string;
} 
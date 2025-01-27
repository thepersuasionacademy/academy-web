export interface MediaItem {
  id: string;
  title: string;
  description: string;
  image: string;
  tracks?: number;
  duration?: number;
  artist?: string;
}

export interface Category {
  name: string;
  items: MediaItem[];
  categoryType: 'mind' | 'training';
} 
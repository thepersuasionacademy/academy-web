export interface MediaItem {
  id: string;
  title: string;
  description: string;
  image: string;
  tracks?: number;
  duration?: number;
  artist?: string;
  has_access: boolean;
  debug_info?: any;
}

export interface Category {
  name: string;
  items: MediaItem[];
  categoryType: 'learning' | 'imprinting';
} 
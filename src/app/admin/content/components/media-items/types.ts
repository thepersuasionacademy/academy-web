import { MediaItem, MediaType } from '@/types/content';

export interface MediaItemProps {
  item: Partial<MediaItem>;
  onUpdate: (updates: Partial<MediaItem>) => void;
  onRemove: () => void;
}

export interface MediaTypeIconProps {
  type: MediaType;
  className?: string;
} 
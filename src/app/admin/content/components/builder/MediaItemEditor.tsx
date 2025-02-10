import React from 'react';
import { MediaItem } from '@/types/content';
import { MediaItemContainer, MediaItemProps } from '../media-items';

export default function MediaItemEditor({
  item,
  onUpdate,
  onRemove
}: MediaItemProps) {
  return (
    <MediaItemContainer
      item={item}
      onUpdate={onUpdate}
      onRemove={onRemove}
    />
  );
} 
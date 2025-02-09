import React from 'react';
import { Video, FileText, Bot, File, FileQuestion } from 'lucide-react';
import { MediaType } from '@/types/content';
import { MediaTypeIconProps } from './types';

export function MediaTypeIcon({ type, className }: MediaTypeIconProps) {
  switch (type) {
    case MediaType.VIDEO:
      return <Video className={className} />;
    case MediaType.TEXT:
      return <FileText className={className} />;
    case MediaType.AI:
      return <Bot className={className} />;
    case MediaType.PDF:
      return <File className={className} />;
    case MediaType.QUIZ:
      return <FileQuestion className={className} />;
    default:
      return <FileText className={className} />;
  }
} 
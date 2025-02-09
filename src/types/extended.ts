import { Content, MediaType } from './course';
import { AIInput, AIPrompt } from '@/lib/supabase/ai';

export interface ExtendedContent extends Content {
  modules?: {
    id: string;
    title: string;
    description: string | null;
    order: number;
    media?: {
      id: string;
      title: string;
      description: string | null;
      order: number;
      items: {
        id?: string;
        type?: MediaType;
        title?: string | null;
        video_id?: string | null;
        video_name?: string | null;
        content_text?: string | null;
        tool_id?: string | null;
        tool?: {
          id: string;
          title: string;
          description: string;
          credits_cost: number;
          collection_title: string | null;
          suite_title: string | null;
          inputs: AIInput[];
          prompts: AIPrompt[];
        } | null;
        pdf_url?: string | null;
        pdf_type?: string | null;
        custom_pdf_type?: string | null;
        quiz_data?: Record<string, any> | null;
        order: number;
      }[];
    }[];
  }[];
} 
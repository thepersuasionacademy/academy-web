'use client';

import React, { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Content, MediaType } from '@/types/content';
import { ExtendedContent } from '@/types/extended';
import { useRouter } from 'next/navigation';
import LeftContentBuilder from '../components/builder/LeftContentBuilder';
import { toast } from 'sonner';

interface ContentEditPageProps {
  params: Promise<{ slug: string }>;
}

export default function ContentEditPage({ params }: ContentEditPageProps) {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [content, setContent] = useState<ExtendedContent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { slug } = React.use(params);

  useEffect(() => {
    if (slug) {
      loadContent();
    }
  }, [slug]);

  const loadContent = async () => {
    try {
      setIsLoading(true);
      console.log('Loading content for slug:', slug);

      // First, check if we're authenticated
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      
      if (authError) {
        console.error('Authentication error:', authError);
        toast.error('Authentication failed');
        return;
      }

      if (!session) {
        console.error('No active session');
        toast.error('Please log in to access content');
        return;
      }

      // Fetch all content data using the RPC function
      const { data: contentData, error: contentError } = await supabase
        .rpc('get_content_by_id', { p_content_id: slug });

      if (contentError) {
        console.error('Error fetching content:', contentError);
        toast.error(contentError.message || 'Failed to load content');
        return;
      }

      if (!contentData) {
        console.error('No content found for id:', slug);
        toast.error('Content not found');
        return;
      }

      console.log('Content loaded successfully:', contentData);
      
      // Transform the content data to match our ExtendedContent interface
      const transformedContent = {
        id: contentData.content.id,
        collection_id: contentData.content.collection_id,
        title: contentData.content.title || '',
        description: contentData.content.description || null,
        status: contentData.content.status || 'draft',
        thumbnail_url: contentData.content.thumbnail_url || null,
        created_at: contentData.content.created_at,
        updated_at: contentData.content.updated_at,
        collection: contentData.content.collection ? {
          id: contentData.content.collection.id,
          name: contentData.content.collection.name,
          description: contentData.content.collection.description
        } : null,
        stats: contentData.content.stats || {
          enrolled_count: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        modules: (contentData.modules || []).map((module: any) => ({
          id: module.id,
          title: module.title || '',
          description: module.description || null,
          order: module.order,
          created_at: module.created_at,
          updated_at: module.updated_at,
          media: (module.media || []).map((media: any) => ({
            id: media.id,
            title: media.title || '',
            description: media.description || null,
            order: media.order,
            created_at: media.created_at,
            updated_at: media.updated_at,
            items: [
              media.video && {
                id: media.video.id,
                type: 'VIDEO',
                title: media.video.title || '',
                video_id: media.video.video_id || null,
                video_name: media.video.video_name || null,
                order: media.order
              },
              media.text && {
                id: media.text.id,
                type: 'TEXT',
                title: media.text.title || '',
                content_text: media.text.content_text || null,
                order: media.order
              },
              media.ai && {
                id: media.ai.id,
                type: 'AI',
                title: media.ai.title || '',
                tool_id: media.ai.tool_id || null,
                order: media.order
              },
              media.pdf && {
                id: media.pdf.id,
                type: 'PDF',
                title: media.pdf.title || '',
                pdf_url: media.pdf.pdf_url || null,
                pdf_type: media.pdf.pdf_type || null,
                custom_pdf_type: media.pdf.custom_pdf_type || null,
                order: media.order
              },
              media.quiz && {
                id: media.quiz.id,
                type: 'QUIZ',
                title: media.quiz.title || '',
                quiz_data: media.quiz.quiz_data || {},
                order: media.order
              }
            ].filter(Boolean) // Remove null/undefined items
          }))
        }))
      };

      setContent(transformedContent);
    } catch (error: any) {
      console.error('Unexpected error loading content:', {
        error,
        message: error.message,
        stack: error.stack
      });
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    // Do nothing, we want to stay on the page
  };

  const handleSave = async (updatedContent: ExtendedContent) => {
    const loadingToast = toast.loading('Saving changes...');

    try {
      // Call the save_content RPC function with all content data
      const { data, error } = await supabase
        .rpc('save_content', {
          p_content_id: slug,
          p_content: updatedContent
        });

      if (error) throw error;

      // Reload the content to get the latest data
      await loadContent();
      
      // Success! Dismiss loading toast and show success
      toast.dismiss(loadingToast);
      toast.success('Content updated successfully');
    } catch (error: any) {
      console.error('Error saving content:', error);
      toast.dismiss(loadingToast);
      toast.error(error.message || 'Failed to save changes');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--accent)]"></div>
      </div>
    );
  }

  if (!content) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <LeftContentBuilder
        content={content}
        onSave={handleSave}
        onClose={handleClose}
      />
    </div>
  );
} 
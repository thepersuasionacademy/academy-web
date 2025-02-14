'use client';

import React, { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { ExtendedContent } from '@/types/content';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import ContentBuilder from '../components/builder/ContentBuilder';

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
        .rpc('get_streaming_content', { p_content_id: slug });

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
      
      // Log the raw AI items
      contentData.modules?.forEach((module: any) => {
        module.media?.forEach((media: any) => {
          if (media.tool_id) {
            console.log('Raw AI item:', media);
          }
        });
      });

      // Transform the content data to match our ExtendedContent interface
      const transformedContent: ExtendedContent = {
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
          description: contentData.content.collection.description,
          created_at: contentData.content.created_at,
          updated_at: contentData.content.updated_at
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
          content_id: contentData.content.id,
          created_at: module.created_at,
          updated_at: module.updated_at,
          media: (module.media || []).map((media: any) => ({
            id: media.id,
            title: media.title || '',
            description: media.description || null,
            order: media.order,
            module_id: module.id,
            content_id: contentData.content.id,
            created_at: module.created_at,
            updated_at: module.updated_at,
            items: [
              media.video_id && {
                id: media.id,
                type: 'VIDEO',
                title: media.video_name || '',
                video_id: media.video_id || null,
                video_name: media.video_name || null,
                order: media.order
              },
              media.content_text && {
                id: media.id,
                type: 'TEXT',
                title: media.text_title || '',
                content_text: media.content_text || null,
                order: media.order
              },
              media.tool_id && {
                id: media.id,
                type: 'AI',
                title: media.tool?.title || '',
                tool_id: media.tool_id || null,
                order: media.order
              },
              media.pdf_url && {
                id: media.id,
                type: 'PDF',
                title: media.pdf_title || '',
                pdf_url: media.pdf_url || null,
                pdf_type: media.pdf_type || null,
                custom_pdf_type: media.custom_pdf_type || null,
                order: media.order
              },
              media.quiz_data && {
                id: media.id,
                type: 'QUIZ',
                title: media.quiz_title || '',
                quiz_data: media.quiz_data || {},
                order: media.order
              }
            ].filter(Boolean)
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

  const handleSave = async (updatedContent: ExtendedContent) => {
    try {
      console.log('Starting save process with content:', updatedContent);
      
      // Transform the content to match the database structure
      const transformedContent = {
        ...updatedContent,
        modules: updatedContent.modules.map(module => ({
          ...module,
          media: module.media.map(media => {
            // Find the items of each type
            const videoItem = media.items.find(item => item.type === 'VIDEO');
            const textItem = media.items.find(item => item.type === 'TEXT');
            const aiItem = media.items.find(item => item.type === 'AI');
            const pdfItem = media.items.find(item => item.type === 'PDF');
            const quizItem = media.items.find(item => item.type === 'QUIZ');

            return {
              id: media.id,
              title: media.title,
              description: media.description,
              order: media.order,
              module_id: module.id,
              content_id: updatedContent.id,
              created_at: media.created_at,
              updated_at: media.updated_at,
              // Add each type of item as a separate property
              video: videoItem ? {
                id: videoItem.id,
                title: videoItem.title,
                video_id: videoItem.video_id,
                video_name: videoItem.video_name,
                order: videoItem.order
              } : null,
              text: textItem ? {
                id: textItem.id,
                title: textItem.title,
                content_text: textItem.content_text,
                order: textItem.order
              } : null,
              ai: aiItem ? {
                id: aiItem.id,
                title: aiItem.title,
                tool_id: aiItem.tool_id,
                order: aiItem.order
              } : null,
              pdf: pdfItem ? {
                id: pdfItem.id,
                title: pdfItem.title,
                pdf_url: pdfItem.pdf_url,
                pdf_type: pdfItem.pdf_type,
                custom_pdf_type: pdfItem.custom_pdf_type,
                order: pdfItem.order
              } : null,
              quiz: quizItem ? {
                id: quizItem.id,
                title: quizItem.title,
                quiz_data: quizItem.quiz_data,
                order: quizItem.order
              } : null
            };
          })
        }))
      };

      console.log('Transformed content for save:', transformedContent);
      
      // Call the save_content RPC function with transformed content data
      const { data, error } = await supabase
        .rpc('save_content', {
          p_content_id: slug,
          p_content: transformedContent
        });

      console.log('Save content RPC response:', { data, error });

      if (error) throw error;

      // Update the local state with the saved content
      if (data) {
        // Transform the returned data back to ExtendedContent format
        const savedContent: ExtendedContent = {
          id: data.content.id,
          collection_id: data.content.collection_id,
          title: data.content.title,
          description: data.content.description,
          status: data.content.status,
          thumbnail_url: data.content.thumbnail_url,
          created_at: data.content.created_at,
          updated_at: data.content.updated_at,
          collection: data.content.collection ? {
            id: data.content.collection.id,
            name: data.content.collection.name,
            description: data.content.collection.description,
            created_at: data.content.collection.created_at,
            updated_at: data.content.collection.updated_at
          } : null,
          stats: data.content.stats,
          modules: (data.modules || []).map((module: {
            id: string;
            title: string;
            description: string | null;
            order: number;
            created_at: string;
            updated_at: string;
            media: Array<{
              id: string;
              title: string;
              description: string | null;
              order: number;
              created_at: string;
              updated_at: string;
              video: {
                id: string;
                title: string;
                video_id: string | null;
                video_name: string | null;
                order: number;
              } | null;
              text: {
                id: string;
                title: string;
                content_text: string | null;
                order: number;
              } | null;
              ai: {
                id: string;
                title: string;
                tool_id: string | null;
                order: number;
              } | null;
              pdf: {
                id: string;
                title: string;
                pdf_url: string | null;
                pdf_type: string | null;
                custom_pdf_type: string | null;
                order: number;
              } | null;
              quiz: {
                id: string;
                title: string;
                quiz_data: Record<string, any>;
                order: number;
              } | null;
            }>;
          }) => ({
            id: module.id,
            title: module.title,
            description: module.description,
            order: module.order,
            content_id: data.content.id,
            created_at: module.created_at,
            updated_at: module.updated_at,
            media: (module.media || []).map((media) => ({
              id: media.id,
              title: media.title,
              description: media.description,
              order: media.order,
              module_id: module.id,
              content_id: data.content.id,
              created_at: media.created_at,
              updated_at: media.updated_at,
              items: [
                media.video && {
                  id: media.video.id,
                  type: 'VIDEO' as const,
                  title: media.video.title,
                  video_id: media.video.video_id,
                  video_name: media.video.video_name,
                  order: media.video.order
                },
                media.text && {
                  id: media.text.id,
                  type: 'TEXT' as const,
                  title: media.text.title,
                  content_text: media.text.content_text,
                  order: media.text.order
                },
                media.ai && {
                  id: media.ai.id,
                  type: 'AI' as const,
                  title: media.ai.title,
                  tool_id: media.ai.tool_id,
                  order: media.ai.order
                },
                media.pdf && {
                  id: media.pdf.id,
                  type: 'PDF' as const,
                  title: media.pdf.title,
                  pdf_url: media.pdf.pdf_url,
                  pdf_type: media.pdf.pdf_type,
                  custom_pdf_type: media.pdf.custom_pdf_type,
                  order: media.pdf.order
                },
                media.quiz && {
                  id: media.quiz.id,
                  type: 'QUIZ' as const,
                  title: media.quiz.title,
                  quiz_data: media.quiz.quiz_data,
                  order: media.quiz.order
                }
              ].filter(Boolean)
            }))
          }))
        };

        // Update the local state with the properly transformed content
        setContent(savedContent);
      } else {
        // If no data returned, reload content as fallback
        await loadContent();
      }
    } catch (error: any) {
      console.error('Error saving content:', error);
      throw error; // Re-throw the error to be handled by ContentBuilder
    }
  };

  const handleClose = () => {
    router.push('/admin/content');
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
    <ContentBuilder
      content={content}
      onSave={handleSave}
      onClose={handleClose}
    />
  );
} 
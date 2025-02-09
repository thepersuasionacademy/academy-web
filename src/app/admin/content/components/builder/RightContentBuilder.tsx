'use client';

import React, { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { PostgrestError } from '@supabase/postgrest-js';
import {
  Content,
  MediaType,
  ContentStatus,
  MediaItem,
  Module,
  Media,
  VideoItem,
  TextItem,
  AIItem,
  PDFItem,
  QuizItem,
  ExtendedContent,
  MediaItemUpdates,
} from '@/types/content';
import { 
  Play, 
  X,
  FileText, 
  Video,
  Plus,
  Edit,
  Save,
  Grip,
  ChevronDown,
  ChevronUp,
  FolderPlus,
  Bot,
  FileQuestion,
  File,
  Search,
  Check
} from 'lucide-react';
import { cn } from "@/lib/utils";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Collection, CollectionInsert } from '@/types/content';
import {
  GetContentCollectionsParams,
  GetContentCollectionsResult,
  CreateContentCollectionParams,
  CreateContentCollectionResult
} from '@/types/rpc';

interface NewContentClientProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ModuleWithMedia extends Module {
  media: (Media & {
    video?: VideoItem;
    text?: TextItem;
    ai?: AIItem;
    pdf?: PDFItem;
    quiz?: QuizItem;
  })[];
}

interface SortableMediaItemProps {
  media: Media & {
    video?: VideoItem;
    text?: TextItem;
    ai?: AIItem;
    pdf?: PDFItem;
    quiz?: QuizItem;
  };
  mediaIndex: number;
  selectedModule: ModuleWithMedia;
  updateModule: (moduleId: string, updates: Partial<ModuleWithMedia>) => void;
}

function SortableMediaItem({ media, mediaIndex, selectedModule, updateModule }: SortableMediaItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ 
    id: media.id,
    data: {
      type: 'media',
      media
    }
  });

  const style = transform ? {
    transform: CSS.Translate.toString(transform),
    transition,
    ...(isDragging ? {
      position: 'relative' as const,
      zIndex: 50,
    } : {})
  } : undefined;

  const getMediaType = () => {
    if (media.video) return MediaType.VIDEO;
    if (media.text) return MediaType.TEXT;
    if (media.ai) return MediaType.AI;
    if (media.pdf) return MediaType.PDF;
    if (media.quiz) return MediaType.QUIZ;
    return null;
  };

  const handleTypeChange = (type: MediaType) => {
    const newModule = { ...selectedModule };
    const newMedia = { ...newModule.media[mediaIndex] };
    
    // Clear all content types
    delete newMedia.video;
    delete newMedia.text;
    delete newMedia.ai;
    delete newMedia.pdf;
    delete newMedia.quiz;

    // Set the new type with default values
    switch (type) {
      case MediaType.VIDEO:
        newMedia.video = {
          id: crypto.randomUUID(),
          media_id: newMedia.id,
          content_id: selectedModule.content_id,
          title: newMedia.title,
          video_id: '',
          order: mediaIndex,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        break;
      case MediaType.TEXT:
        newMedia.text = {
          id: crypto.randomUUID(),
          media_id: newMedia.id,
          content_id: selectedModule.content_id,
          title: newMedia.title,
          content_text: '',
          order: mediaIndex,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        break;
      case MediaType.AI:
        newMedia.ai = {
          id: crypto.randomUUID(),
          media_id: newMedia.id,
          content_id: selectedModule.content_id,
          title: newMedia.title,
          tool_id: '',
          order: mediaIndex,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        break;
      case MediaType.PDF:
        newMedia.pdf = {
          id: crypto.randomUUID(),
          media_id: newMedia.id,
          content_id: selectedModule.content_id,
          title: newMedia.title,
          pdf_url: '',
          order: mediaIndex,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        break;
      case MediaType.QUIZ:
        newMedia.quiz = {
          id: crypto.randomUUID(),
          media_id: newMedia.id,
          content_id: selectedModule.content_id,
          title: newMedia.title,
          quiz_data: {},
          order: mediaIndex,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        break;
    }

    newModule.media[mediaIndex] = newMedia;
    updateModule(selectedModule.id, newModule);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group/media bg-[var(--card-bg)] rounded-lg border border-[var(--border-color)]",
        isDragging && "shadow-lg opacity-90"
      )}
    >
      <div className="flex">
        <div
          {...attributes}
          {...listeners}
          className="w-6 flex-shrink-0 cursor-grab opacity-0 group-hover/media:opacity-100 transition-opacity flex items-center justify-center border-r border-[var(--border-color)]"
        >
          <Grip className="w-4 h-4 text-[var(--text-secondary)]" />
        </div>
        <div className="flex-1">
          <div className="p-6">
            <div className="flex items-center gap-4">
              <input
                type="text"
                value={media.title}
                onChange={e => {
                  const newModule = { ...selectedModule };
                  newModule.media[mediaIndex].title = e.target.value;
                  updateModule(selectedModule.id, newModule);
                }}
                className="flex-1 text-xl font-medium bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-[var(--accent)] rounded px-2"
                placeholder="Media Title"
              />
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => {
                    const newModule = { ...selectedModule };
                    newModule.media.splice(mediaIndex, 1);
                    updateModule(selectedModule.id, newModule);
                  }}
                  className="p-2 rounded-lg hover:bg-red-500/10 text-red-500 transition-colors opacity-0 group-hover/media:opacity-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          <div className="px-6 pb-6">
            <div className="space-y-4">
              <select
                value={getMediaType() || ''}
                onChange={e => handleTypeChange(e.target.value as MediaType)}
                className="w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              >
                <option value="">Select Type</option>
                <option value={MediaType.VIDEO}>Video</option>
                <option value={MediaType.TEXT}>Text</option>
                <option value={MediaType.AI}>AI</option>
                <option value={MediaType.PDF}>PDF</option>
                <option value={MediaType.QUIZ}>Quiz</option>
              </select>

              {media.video && (
                <div className="space-y-4">
                  <input
                    type="text"
                    value={media.video.video_id}
                    onChange={e => {
                      const newModule = { ...selectedModule };
                      if (newModule.media[mediaIndex].video) {
                        newModule.media[mediaIndex].video!.video_id = e.target.value;
                      }
                      updateModule(selectedModule.id, newModule);
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                    placeholder="Video ID"
                  />
                </div>
              )}

              {media.text && (
                <textarea
                  value={media.text.content_text}
                  onChange={e => {
                    const newModule = { ...selectedModule };
                    if (newModule.media[mediaIndex].text) {
                      newModule.media[mediaIndex].text!.content_text = e.target.value;
                    }
                    updateModule(selectedModule.id, newModule);
                  }}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                  rows={4}
                  placeholder="Text Content"
                />
              )}

              {media.ai && (
                <select
                  value={media.ai.tool_id}
                  onChange={e => {
                    const newModule = { ...selectedModule };
                    if (newModule.media[mediaIndex].ai) {
                      newModule.media[mediaIndex].ai!.tool_id = e.target.value;
                    }
                    updateModule(selectedModule.id, newModule);
                  }}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                >
                  <option value="">Select AI Tool</option>
                  {/* Add AI tools options here */}
                </select>
              )}

              {media.pdf && (
                <input
                  type="text"
                  value={media.pdf.pdf_url}
                  onChange={e => {
                    const newModule = { ...selectedModule };
                    if (newModule.media[mediaIndex].pdf) {
                      newModule.media[mediaIndex].pdf!.pdf_url = e.target.value;
                    }
                    updateModule(selectedModule.id, newModule);
                  }}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                  placeholder="PDF URL"
                />
              )}

              {media.quiz && (
                <textarea
                  value={JSON.stringify(media.quiz.quiz_data, null, 2)}
                  onChange={e => {
                    try {
                      const quizData = JSON.parse(e.target.value);
                      const newModule = { ...selectedModule };
                      if (newModule.media[mediaIndex].quiz) {
                        newModule.media[mediaIndex].quiz!.quiz_data = quizData;
                      }
                      updateModule(selectedModule.id, newModule);
                    } catch (error) {
                      // Handle invalid JSON
                    }
                  }}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                  rows={4}
                  placeholder="Quiz Data (JSON)"
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SortableModuleItem({ 
  module, 
  isSelected, 
  onSelect, 
  onRemove,
  updateModule 
}: {
  module: ModuleWithMedia;
  isSelected: boolean;
  onSelect: () => void;
  onRemove: () => void;
  updateModule: (moduleId: string, updates: Partial<ModuleWithMedia>) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ 
    id: module.id,
    data: {
      type: 'module',
      module
    }
  });

  const style = transform ? {
    transform: CSS.Translate.toString(transform),
    transition,
    ...(isDragging ? {
      position: 'relative' as const,
      zIndex: 50,
    } : {})
  } : undefined;

  return (
    <button
      ref={setNodeRef}
      style={style}
      onClick={onSelect}
      className={cn(
        "group w-full flex rounded-lg border transition-colors",
        isSelected
          ? "border-[var(--accent)] bg-[var(--accent)]/5"
          : "border-[var(--border-color)] hover:border-[var(--accent)] bg-transparent",
        isDragging && "shadow-lg opacity-90"
      )}
    >
      <div
        {...attributes}
        {...listeners}
        className={cn(
          "w-6 flex-shrink-0 cursor-grab opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center border-r",
          isSelected ? "border-[var(--accent)]" : "border-[var(--border-color)]"
        )}
        onClick={e => e.stopPropagation()}
      >
        <Grip className="w-4 h-4 text-[var(--text-secondary)]" />
      </div>
      <div className="flex-1 flex items-center gap-4 p-4">
        <div className="flex-1 relative">
          <input
            type="text"
            value={module.title}
            onChange={e => {
              e.stopPropagation();
              updateModule(module.id, { title: e.target.value });
            }}
            onClick={e => e.stopPropagation()}
            className="w-full bg-transparent outline-none focus:outline-none focus:ring-0 ring-0 border-0 focus:border-0 rounded-none focus:rounded-none px-0 select-none focus:shadow-none shadow-none text-xl font-medium"
            placeholder="Module Title"
          />
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="p-2 rounded-lg hover:bg-red-500/10 text-red-500 transition-colors opacity-0 group-hover:opacity-100"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </button>
  );
}

export default function NewContentClient({ isOpen, onClose }: NewContentClientProps) {
  const supabase = createClientComponentClient();
  const [content, setContent] = useState<Partial<Content>>({
    title: '',
    description: '',
    status: 'draft'
  });
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<string>('');
  const [newCollectionName, setNewCollectionName] = useState('');
  const [isCreatingCollection, setIsCreatingCollection] = useState(false);
  const [modules, setModules] = useState<ModuleWithMedia[]>([]);
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCollectionDropdown, setShowCollectionDropdown] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow;
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.height = '100%';
    }
    return () => {
      document.body.style.overflow = originalStyle;
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.height = '';
    };
  }, [isOpen]);

  useEffect(() => {
    fetchCollections();
  }, []);

  const fetchCollections = async () => {
    try {
      console.log('Fetching collections...');
      
      // First, check if we're authenticated
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      console.log('Auth state:', {
        isAuthenticated: !!session,
        userId: session?.user?.id,
        authError
      });

      if (!session) {
        console.error('Not authenticated');
        alert('You must be logged in to access collections');
        return;
      }

      const { data, error } = await supabase
        .rpc('get_content_collections');

      if (error) {
        console.error('Error fetching collections:', error);
        alert(`Failed to fetch collections: ${error.message}`);
        return;
      }
      
      if (data) {
        console.log('Successfully fetched collections:', data);
        setCollections(data);
      } else {
        console.log('No collections data returned');
        setCollections([]);
      }
    } catch (error: unknown) {
      const err = error as Error;
      console.error('Unexpected error in fetchCollections:', {
        name: err.name,
        message: err.message,
        stack: err.stack,
        error
      });
      alert('An unexpected error occurred while fetching collections');
    }
  };

  const filteredCollections = collections.filter(collection =>
    collection.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSearchFocus = () => {
    setShowCollectionDropdown(true);
    fetchCollections(); // Refresh collections when focusing
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setShowCollectionDropdown(true);
  };

  const handleCreateCollection = async () => {
    if (!searchQuery.trim()) {
      alert('Please enter a collection name');
      return;
    }

    try {
      // First, check if we're authenticated
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      console.log('Auth state for create collection:', {
        isAuthenticated: !!session,
        userId: session?.user?.id,
        authError
      });

      if (!session) {
        console.error('Not authenticated');
        alert('You must be logged in to create collections');
        return;
      }

      console.log('Creating collection with name:', searchQuery);

      const { data, error } = await supabase
        .rpc('create_content_collection', {
          p_name: searchQuery,
          p_description: null
        });

      if (error) {
        console.error('Error creating collection:', error);
        alert(`Failed to create collection: ${error.message}`);
        return;
      }

      if (data) {
        console.log('Collection created successfully:', data);
        setCollections(prev => [...prev, data]);
        setSelectedCollection(data.id);
        setSearchQuery('');
        setShowCollectionDropdown(false);
      }
    } catch (error: unknown) {
      const err = error as Error;
      console.error('Unexpected error creating collection:', {
        name: err.name,
        message: err.message,
        stack: err.stack,
        error
      });
      alert('An unexpected error occurred while creating the collection');
    }
  };

  // Add this useEffect to handle clicking outside the dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.collection-search-container')) {
        setShowCollectionDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Replace the collection selection UI with this new version
  const renderCollectionSearch = () => (
    <div className="collection-search-container relative">
      <div className="flex items-center gap-2 p-3 rounded-lg border border-[var(--border-color)] bg-[var(--card-bg)]">
        <Search className="w-5 h-5 text-[var(--text-secondary)]" />
        <input
          type="text"
          value={searchQuery}
          onChange={handleSearchChange}
          onFocus={handleSearchFocus}
          placeholder="Search or create collections..."
          className="flex-1 bg-transparent border-none focus:outline-none text-[var(--foreground)] text-lg"
        />
      </div>

      {showCollectionDropdown && (
        <div className="absolute w-full mt-2 py-1 rounded-lg border border-[var(--border-color)] bg-[var(--card-bg)] shadow-lg z-10">
          {filteredCollections.map(collection => (
            <button
              key={collection.id}
              onClick={() => {
                setSelectedCollection(collection.id);
                setSearchQuery(collection.name);
                setShowCollectionDropdown(false);
              }}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-[var(--hover-bg)] transition-colors text-lg"
            >
              <span>{collection.name}</span>
              {selectedCollection === collection.id && (
                <Check className="w-5 h-5 text-green-500" />
              )}
            </button>
          ))}
          
          {searchQuery && !filteredCollections.some(c => 
            c.name.toLowerCase() === searchQuery.toLowerCase()
          ) && (
            <button
              onClick={handleCreateCollection}
              className="w-full px-4 py-3 flex items-center gap-2 text-[var(--accent)] hover:bg-[var(--hover-bg)] transition-colors text-lg"
            >
              <Plus className="w-5 h-5" />
              Create &quot;{searchQuery}&quot;
            </button>
          )}
        </div>
      )}
    </div>
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) return;

    const activeData = active.data.current;
    const overData = over.data.current;

    if (activeData?.type === 'module') {
      setModules(items => {
        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    } else if (activeData?.type === 'media' && selectedModuleId) {
      const selectedModule = modules.find(m => m.id === selectedModuleId);
      if (selectedModule) {
        const newModule = { ...selectedModule };
        const oldIndex = newModule.media.findIndex(m => m.id === active.id);
        const newIndex = newModule.media.findIndex(m => m.id === over.id);
        newModule.media = arrayMove(newModule.media, oldIndex, newIndex);
        setModules(prev => prev.map(m => m.id === selectedModuleId ? newModule : m));
      }
    }
  };

  const handleSubmit = async () => {
    try {
      // Validate required fields
      if (!content.title?.trim()) {
        alert('Please enter a content title');
        return;
      }

      if (!selectedCollection) {
        alert('Please select or create a collection');
        return;
      }

      if (!modules.length) {
        alert('Please add at least one module');
        return;
      }

      // Insert content
      const { data: contentData, error: contentError } = await supabase
        .from('content.content')
        .insert([{
          collection_id: selectedCollection,
          title: content.title,
          description: content.description || '',
          status: content.status,
          thumbnail_url: content.thumbnail_url
        }])
        .select()
        .single();

      if (contentError) throw contentError;

      // Insert modules
      for (const [moduleIndex, module] of modules.entries()) {
        const { data: moduleData, error: moduleError } = await supabase
          .from('content.modules')
          .insert([{
            content_id: contentData.id,
            title: module.title,
            order: moduleIndex
          }])
          .select()
          .single();

        if (moduleError) throw moduleError;

        // Insert media for this module
        for (const [mediaIndex, media] of module.media.entries()) {
          const { data: mediaData, error: mediaError } = await supabase
            .from('content.media')
            .insert([{
              module_id: moduleData.id,
              content_id: contentData.id,
              title: media.title,
              order: mediaIndex
            }])
            .select()
            .single();

          if (mediaError) throw mediaError;

          // Insert the specific media content based on type
          if (media.video) {
            const { error: videoError } = await supabase
              .from('content.videos')
              .insert([{
                media_id: mediaData.id,
                content_id: contentData.id,
                title: media.video.title,
                video_id: media.video.video_id,
                order: mediaIndex
              }]);
          }

          if (media.text) {
            const { error: textError } = await supabase
              .from('content.text_content')
              .insert([{
                media_id: mediaData.id,
                content_id: contentData.id,
                title: media.text.title,
                content_text: media.text.content_text,
                order: mediaIndex
              }]);
          }

          if (media.ai) {
            const { error: aiError } = await supabase
              .from('content.ai_content')
              .insert([{
                media_id: mediaData.id,
                content_id: contentData.id,
                title: media.ai.title,
                tool_id: media.ai.tool_id,
                order: mediaIndex
              }]);
          }

          if (media.pdf) {
            const { error: pdfError } = await supabase
              .from('content.pdf_content')
              .insert([{
                media_id: mediaData.id,
                content_id: contentData.id,
                title: media.pdf.title,
                pdf_url: media.pdf.pdf_url,
                order: mediaIndex
              }]);
          }

          if (media.quiz) {
            const { error: quizError } = await supabase
              .from('content.quiz_content')
              .insert([{
                media_id: mediaData.id,
                content_id: contentData.id,
                title: media.quiz.title,
                quiz_data: media.quiz.quiz_data,
                order: mediaIndex
              }]);
          }
        }
      }

      // Create initial stats
      const { error: statsError } = await supabase
        .from('content.content_stats')
        .insert([{
          content_id: contentData.id,
          enrolled_count: 0
        }]);

      if (statsError) throw statsError;

      onClose();
    } catch (error: any) {
      console.error('Error creating content:', error);
      alert(error.message || 'Failed to create content. Please try again.');
    }
  };

  const addModule = () => {
    const newModule: ModuleWithMedia = {
      id: crypto.randomUUID(),
      content_id: '', // This will be set when saving
      title: 'New Module',
      order: modules.length,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      media: []
    };
    setModules([...modules, newModule]);
  };

  const updateModule = (moduleId: string, updates: Partial<ModuleWithMedia>) => {
    setModules(prev => prev.map(module => 
      module.id === moduleId ? { ...module, ...updates } : module
    ));
  };

  const addMedia = (moduleId: string) => {
    setModules(prev => prev.map(module => {
      if (module.id === moduleId) {
        const newMedia: Media & {
          video?: VideoItem;
          text?: TextItem;
          ai?: AIItem;
          pdf?: PDFItem;
          quiz?: QuizItem;
        } = {
          id: crypto.randomUUID(),
          module_id: module.id,
          content_id: module.content_id,
          title: 'New Media',
          order: module.media.length,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        return {
          ...module,
          media: [...module.media, newMedia]
        };
      }
      return module;
    }));
  };

  if (!isOpen) return null;

  return (
    <div 
      className={cn(
        "fixed inset-y-0 right-0 z-50",
        "w-[600px]",
        "transform transition-transform duration-300 ease-out",
        "bg-[var(--card-bg)] text-[var(--foreground)] flex-shrink-0",
        "border-l border-[var(--border-color)]",
        isOpen ? "translate-x-0" : "translate-x-full"
      )}
    >
      <div className="relative h-full overflow-auto">
        <div className="p-6 sticky top-0 bg-[var(--card-bg)]/80 backdrop-blur-sm border-b border-[var(--border-color)]">
          <div className="flex justify-between items-center mb-4">
            <input
              type="text"
              value={content.title}
              onChange={e => setContent({ ...content, title: e.target.value })}
              className="text-3xl md:text-2xl font-bold bg-transparent outline-none focus:outline-none focus:ring-0 ring-0 focus:border-0 border-0 rounded-none focus:rounded-none px-0 select-none focus:shadow-none shadow-none"
              placeholder="Content Title"
            />
            <div className="flex items-center gap-2">
              <button 
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-[var(--hover-bg)] transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>
          <input
            type="text"
            value={content.description}
            onChange={e => setContent({ ...content, description: e.target.value })}
            className="w-full text-base md:text-sm text-[var(--text-secondary)] bg-transparent outline-none focus:outline-none focus:ring-0 ring-0 focus:border-0 border-0 rounded-none focus:rounded-none px-0 select-none focus:shadow-none shadow-none"
            placeholder="Content Description"
          />
          <div className="flex flex-col gap-4 mt-4">
            {renderCollectionSearch()}

            <div className="flex items-center gap-4">
              <select
                value={content.status}
                onChange={e => setContent({ ...content, status: e.target.value as ContentStatus })}
                className="px-3 py-1 rounded-lg border border-[var(--border-color)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
              <button
                onClick={() => addModule()}
                className="flex items-center gap-2 px-3 py-1 rounded-lg bg-[var(--accent)]/10 text-[var(--accent)] hover:bg-[var(--accent)]/20 transition-all"
              >
                <Plus className="w-4 h-4" />
                Add Module
              </button>
            </div>
          </div>
        </div>

        <div className="px-6 pb-safe">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={modules.map(module => module.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-4">
                {modules.map((module) => (
                  <SortableModuleItem
                    key={module.id}
                    module={module}
                    isSelected={selectedModuleId === module.id}
                    onSelect={() => setSelectedModuleId(module.id)}
                    onRemove={() => {
                      setModules(prev => prev.filter(m => m.id !== module.id));
                      if (selectedModuleId === module.id) {
                        setSelectedModuleId(null);
                      }
                    }}
                    updateModule={updateModule}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          {selectedModuleId && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-medium">Media Items</h3>
                <button
                  onClick={() => addMedia(selectedModuleId)}
                  className="px-3 py-1 rounded-lg bg-[var(--accent)]/10 text-[var(--accent)] hover:bg-[var(--accent)]/20 transition-all flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Media
                </button>
              </div>

              <SortableContext
                items={modules
                  .find(m => m.id === selectedModuleId)
                  ?.media.map(m => m.id) || []}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-4">
                  {modules
                    .find(m => m.id === selectedModuleId)
                    ?.media.map((media, mediaIndex) => (
                      <SortableMediaItem
                        key={media.id}
                        media={media}
                        mediaIndex={mediaIndex}
                        selectedModule={modules.find(m => m.id === selectedModuleId)!}
                        updateModule={updateModule}
                      />
                    ))}
                </div>
              </SortableContext>
            </div>
          )}
        </div>

        {/* Save Button */}
        <div className="sticky bottom-0 p-4 bg-[var(--card-bg)]/80 backdrop-blur-sm border-t border-[var(--border-color)]">
          <button
            onClick={handleSubmit}
            className="w-full py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
          >
            <Save className="w-5 h-5" />
            Save Content
          </button>
        </div>
      </div>
    </div>
  );
} 
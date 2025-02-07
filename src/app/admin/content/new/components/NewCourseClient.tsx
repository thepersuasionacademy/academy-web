'use client';

import React, { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Content, Media as DBMedia, MediaItem, MediaType, VideoNameType, PDFType, ContentStatus } from '@/types/course';
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
  File
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

interface NewContentClientProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Module {
  id: string;
  title: string;
  description: string;
  media: ModuleMedia[];
  isExpanded?: boolean;
}

interface ModuleMedia {
  id: string;
  title: string;
  description: string;
  items: Partial<MediaItem>[];
  isExpanded?: boolean;
}

interface Collection {
  id: string;
  name: string;
}

interface SortableMediaItemProps {
  mediaItem: Partial<MediaItem>;
  index: number;
  editingMedia: number | null;
  onEdit: (index: number) => void;
  onRemove: (index: number) => void;
  onUpdate: (index: number, updates: Partial<MediaItem>) => void;
  totalItems: number;
}

const MediaTypeIcon = ({ type }: { type: MediaType }) => {
  switch (type) {
    case MediaType.VIDEO:
      return <Video className="w-5 h-5 text-[var(--text-secondary)]" />;
    case MediaType.TEXT:
      return <FileText className="w-5 h-5 text-[var(--text-secondary)]" />;
    case MediaType.AI:
      return <Bot className="w-5 h-5 text-[var(--text-secondary)]" />;
    case MediaType.PDF:
      return <File className="w-5 h-5 text-[var(--text-secondary)]" />;
    case MediaType.QUIZ:
      return <FileQuestion className="w-5 h-5 text-[var(--text-secondary)]" />;
    default:
      return <FileText className="w-5 h-5 text-[var(--text-secondary)]" />;
  }
};

function SortableMediaItem({ 
  mediaItem, 
  index, 
  editingMedia,
  onEdit,
  onRemove,
  onUpdate,
  totalItems
}: SortableMediaItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: `media-${index}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  };

  return (
    <div ref={setNodeRef} style={style}>
      <div className="group border rounded-lg border-[var(--border-color)] bg-[var(--card-bg)]">
        <div 
          {...attributes}
          {...listeners}
          className="flex w-full cursor-grab"
        >
          <div className="w-16 flex items-center justify-center hover:bg-[var(--hover-bg)] transition-colors rounded-l-lg border-r border-[var(--border-color)]">
            <Grip className="w-4 h-4 text-[var(--text-secondary)]" />
          </div>
          <div className="flex-1">
            <button
              onClick={() => onEdit(index)}
              className={cn(
                "w-full flex items-center justify-between py-4 transition-colors duration-200 hover:bg-[var(--hover-bg)] px-3",
                editingMedia === index && "bg-[var(--hover-bg)]"
              )}
            >
              <div className="flex items-center gap-3">
                <MediaTypeIcon type={mediaItem.type as MediaType} />
                {editingMedia === index ? (
                  <input
                    type="text"
                    value={mediaItem.title}
                    onChange={e => onUpdate(index, { title: e.target.value })}
                    className="font-medium text-lg bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-[var(--accent)] rounded px-2"
                    placeholder="Media Title"
                    onClick={e => e.stopPropagation()}
                  />
                ) : (
                  <span className="font-medium text-lg">
                    {mediaItem.title || `Media ${index + 1}`}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove(index);
                  }}
                  className="p-1 rounded-lg hover:bg-red-500/10 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-4 h-4" />
                </button>
                {editingMedia === index ? (
                  <ChevronUp className="w-4 h-4 text-[var(--text-secondary)]" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-[var(--text-secondary)]" />
                )}
              </div>
            </button>
          </div>
        </div>

        {/* Expanded Media Editor */}
        {editingMedia === index && (
          <div className="px-12 pb-4 space-y-4">
            <div>
              <select
                value={mediaItem.type}
                onChange={e => onUpdate(index, { 
                  type: e.target.value as MediaType,
                  // Reset type-specific fields
                  video_id: undefined,
                  video_name: undefined,
                  content_text: undefined,
                  tool_id: undefined,
                  pdf_url: undefined,
                  pdf_type: undefined,
                  custom_pdf_type: undefined,
                  quiz_data: undefined
                })}
                className="w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              >
                <option value={MediaType.VIDEO}>Video</option>
                <option value={MediaType.TEXT}>Text</option>
                <option value={MediaType.AI}>AI</option>
                <option value={MediaType.PDF}>PDF</option>
                <option value={MediaType.QUIZ}>Quiz</option>
              </select>
            </div>

            {mediaItem.type === MediaType.VIDEO && (
              <>
                <select
                  value={mediaItem.video_name}
                  onChange={e => onUpdate(index, { video_name: e.target.value as VideoNameType })}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                >
                  <option value={VideoNameType.VIDEO}>Video</option>
                  <option value={VideoNameType.LESSON}>Lesson</option>
                  <option value={VideoNameType.IMPRINTING_SESSION}>Imprinting Session</option>
                </select>
                <input
                  type="text"
                  value={mediaItem.video_id}
                  onChange={e => onUpdate(index, { video_id: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                  placeholder="Video ID"
                />
              </>
            )}

            {mediaItem.type === MediaType.TEXT && (
              <textarea
                value={mediaItem.content_text}
                onChange={e => onUpdate(index, { content_text: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                rows={4}
                placeholder="Text Content"
              />
            )}

            {mediaItem.type === MediaType.AI && (
              <select
                value={mediaItem.tool_id}
                onChange={e => onUpdate(index, { tool_id: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              >
                <option value="">Select AI Tool</option>
                {/* Add AI tools options here */}
              </select>
            )}

            {mediaItem.type === MediaType.PDF && (
              <>
                <input
                  type="text"
                  value={mediaItem.pdf_url}
                  onChange={e => onUpdate(index, { pdf_url: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                  placeholder="PDF URL"
                />
                <select
                  value={mediaItem.pdf_type}
                  onChange={e => onUpdate(index, { 
                    pdf_type: e.target.value as PDFType,
                    custom_pdf_type: e.target.value === PDFType.CUSTOM ? mediaItem.custom_pdf_type : undefined
                  })}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                >
                  <option value={PDFType.TRANSCRIPT}>Transcript</option>
                  <option value={PDFType.NOTES}>Notes</option>
                  <option value={PDFType.CUSTOM}>Custom</option>
                </select>
                {mediaItem.pdf_type === PDFType.CUSTOM && (
                  <input
                    type="text"
                    value={mediaItem.custom_pdf_type}
                    onChange={e => onUpdate(index, { custom_pdf_type: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                    placeholder="Custom PDF Type"
                  />
                )}
              </>
            )}

            {mediaItem.type === MediaType.QUIZ && (
              <textarea
                value={mediaItem.quiz_data ? JSON.stringify(mediaItem.quiz_data, null, 2) : ''}
                onChange={e => {
                  try {
                    const quizData = JSON.parse(e.target.value);
                    onUpdate(index, { quiz_data: quizData });
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
        )}
      </div>
      {index < totalItems - 1 && (
        <div className="h-px bg-[var(--border-color)]" />
      )}
    </div>
  );
}

export default function NewContentClient({ isOpen, onClose }: NewContentClientProps) {
  const supabase = createClientComponentClient();
  const [content, setContent] = useState<Partial<Content>>({
    title: '',
    description: '',
    status: ContentStatus.DRAFT as ContentStatus
  });
  const [selectedCollection, setSelectedCollection] = useState<string>('');
  const [newCollectionName, setNewCollectionName] = useState('');
  const [isCreatingCollection, setIsCreatingCollection] = useState(false);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [editingMedia, setEditingMedia] = useState<number | null>(null);

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
    const { data, error } = await supabase
      .from('collections')
      .select('id, name');
    
    if (data) {
      setCollections(data);
    }
  };

  const addModule = () => {
    const newModule: Module = {
      id: crypto.randomUUID(),
      title: 'New Module',
      description: '',
      media: [],
      isExpanded: true
    };
    setModules([...modules, newModule]);
  };

  const updateModule = (moduleId: string, updates: Partial<Module>) => {
    setModules(prev => prev.map(module => 
      module.id === moduleId ? { ...module, ...updates } : module
    ));
  };

  const removeModule = (moduleId: string) => {
    setModules(prev => prev.filter(module => module.id !== moduleId));
  };

  const addMedia = (moduleId: string) => {
    setModules(prev => prev.map(module => {
      if (module.id === moduleId) {
        return {
          ...module,
          media: [
            ...module.media,
            {
              id: crypto.randomUUID(),
              title: 'New Media',
              description: '',
              items: [],
              isExpanded: true
            } as ModuleMedia
          ]
        };
      }
      return module;
    }));
  };

  const addMediaItem = (moduleId: string, mediaId: string) => {
    setModules(prev => prev.map(module => {
      if (module.id === moduleId) {
        return {
          ...module,
          media: module.media.map(media => {
            if (media.id === mediaId) {
              return {
                ...media,
                items: [
                  ...media.items,
                  {
                    type: MediaType.VIDEO,
                    title: 'New Media Item',
                    order: media.items.length
                  }
                ]
              };
            }
            return media;
          })
        };
      }
      return module;
    }));
  };

  const handleCreateCollection = async () => {
    if (!newCollectionName.trim()) return;

    const { data, error } = await supabase
      .from('collections')
      .insert([{ name: newCollectionName }])
      .select()
      .single();

    if (data) {
      setCollections([...collections, data]);
      setSelectedCollection(data.id);
      setNewCollectionName('');
      setIsCreatingCollection(false);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) return;

    setModules(items => {
      const oldIndex = items.findIndex(item => item.id === active.id);
      const newIndex = items.findIndex(item => item.id === over.id);
      
      return arrayMove(items, oldIndex, newIndex);
    });
  };

  const handleSubmit = async () => {
    try {
      if (!selectedCollection) {
        alert('Please select or create a collection');
        return;
      }

      // Insert content
      const { data: contentData, error: contentError } = await supabase
        .from('content')
        .insert([{ ...content, collection_id: selectedCollection }])
        .select()
        .single();

      if (contentError) throw contentError;

      // Insert modules
      for (const [moduleIndex, module] of modules.entries()) {
        const { data: moduleData, error: moduleError } = await supabase
          .from('modules')
          .insert([{
            content_id: contentData.id,
            title: module.title,
            description: module.description,
            order: moduleIndex
          }])
          .select()
          .single();

        if (moduleError) throw moduleError;

        // Insert media for this module
        for (const [mediaIndex, media] of module.media.entries()) {
          const { data: mediaData, error: mediaError } = await supabase
            .from('media')
            .insert([{
              module_id: moduleData.id,
              title: media.title,
              description: media.description,
              order: mediaIndex
            }])
            .select()
            .single();

          if (mediaError) throw mediaError;

          // Insert media items for this media
          const mediaItems = media.items.map((item, index) => ({
            ...item,
            media_id: mediaData.id,
            order: index
          }));

          const { error: itemsError } = await supabase
            .from('media_items')
            .insert(mediaItems);

          if (itemsError) throw itemsError;
        }
      }

      onClose();
    } catch (error) {
      console.error('Error creating content:', error);
      alert('Failed to create content. Please try again.');
    }
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
            <div className="flex items-center gap-4">
              <select
                value={content.status}
                onChange={e => setContent({ ...content, status: e.target.value as ContentStatus })}
                className="px-3 py-1 rounded-lg border border-[var(--border-color)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              >
                <option value={ContentStatus.DRAFT}>Draft</option>
                <option value={ContentStatus.PUBLISHED}>Published</option>
                <option value={ContentStatus.ARCHIVED}>Archived</option>
              </select>
              <button
                onClick={addModule}
                className="flex items-center gap-2 px-3 py-1 rounded-lg bg-[var(--accent)]/10 text-[var(--accent)] hover:bg-[var(--accent)]/20 transition-all"
              >
                <Plus className="w-4 h-4" />
                Add Module
              </button>
            </div>

            <div className="flex items-center gap-2">
              {isCreatingCollection ? (
                <div className="flex-1 flex items-center gap-2">
                  <input
                    type="text"
                    value={newCollectionName}
                    onChange={e => setNewCollectionName(e.target.value)}
                    placeholder="New Collection Name"
                    className="flex-1 px-3 py-1 rounded-lg border border-[var(--border-color)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                  />
                  <button
                    onClick={handleCreateCollection}
                    className="px-3 py-1 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors"
                  >
                    Create
                  </button>
                  <button
                    onClick={() => setIsCreatingCollection(false)}
                    className="px-3 py-1 rounded-lg border border-[var(--border-color)] hover:border-[var(--accent)] transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <>
                  <select
                    value={selectedCollection}
                    onChange={e => setSelectedCollection(e.target.value)}
                    className="flex-1 px-3 py-1 rounded-lg border border-[var(--border-color)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                  >
                    <option value="">Select Collection</option>
                    {collections.map(collection => (
                      <option key={collection.id} value={collection.id}>
                        {collection.name}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => setIsCreatingCollection(true)}
                    className="p-2 rounded-lg hover:bg-[var(--hover-bg)] transition-colors text-[var(--text-secondary)]"
                  >
                    <FolderPlus className="w-5 h-5" />
                  </button>
                </>
              )}
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
              {modules.map((module, moduleIndex) => (
                <div
                  key={module.id}
                  className="border border-[var(--border-color)] rounded-lg bg-[var(--card-bg)] mb-4"
                >
                  <div className="p-4 flex items-center justify-between">
                    <div className="flex-1">
                      <input
                        type="text"
                        value={module.title}
                        onChange={e => updateModule(module.id, { title: e.target.value })}
                        className="text-lg font-medium bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-[var(--accent)] rounded px-2"
                        placeholder="Module Title"
                      />
                      <input
                        type="text"
                        value={module.description}
                        onChange={e => updateModule(module.id, { description: e.target.value })}
                        className="text-sm text-[var(--text-secondary)] bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-[var(--accent)] rounded px-2"
                        placeholder="Module Description"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => addMedia(module.id)}
                        className="p-2 rounded-lg hover:bg-[var(--hover-bg)] transition-colors"
                      >
                        <Plus className="w-4 h-4 text-[var(--text-secondary)]" />
                      </button>
                      <button
                        onClick={() => removeModule(module.id)}
                        className="p-2 rounded-lg hover:bg-[var(--hover-bg)] text-red-500 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="border-t border-[var(--border-color)]">
                    {module.media.map((media, mediaIndex) => (
                      <SortableMediaItem
                        key={`${module.id}-media-${mediaIndex}`}
                        mediaItem={media.items[0] || {}}
                        index={mediaIndex}
                        editingMedia={editingMedia}
                        onEdit={(index) => setEditingMedia(index)}
                        onRemove={(index) => {
                          const newModule = { ...module };
                          newModule.media[mediaIndex].items = newModule.media[mediaIndex].items.filter((_, i) => i !== index);
                          updateModule(module.id, newModule);
                        }}
                        onUpdate={(index, updates) => {
                          const newModule = { ...module };
                          newModule.media[mediaIndex].items[index] = { ...newModule.media[mediaIndex].items[index], ...updates };
                          updateModule(module.id, newModule);
                        }}
                        totalItems={media.items.length}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </SortableContext>
          </DndContext>
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
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
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
  Collection,
  VideoNameType
} from '@/types/content';
import { AITool, AIInput, AIPrompt } from '@/lib/supabase/ai';
import { cn } from "@/lib/utils";
import { toast } from 'sonner';
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
  ChevronLeft,
  LayoutGrid,
  Settings,
  MoreVertical,
  Search,
  Check,
  Eye,
  EyeOff,
  ChevronRight
} from 'lucide-react';
import { marked } from 'marked';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  MeasuringStrategy,
  defaultDropAnimationSideEffects
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { MediaItemContainer } from '@/app/admin/content/components/media-items';
import { Toaster } from 'sonner';

interface ExtendedModule extends Omit<Module, 'media'> {
  media: Array<ExtendedMedia>;
}

interface ExtendedMedia extends Omit<Media, 'items'> {
  items: MediaItem[];
}

interface SortableMediaItemProps {
  media: ExtendedMedia;
  mediaIndex: number;
  selectedModule: ExtendedModule;
  updateModule: (moduleId: string, updates: Partial<ExtendedModule>) => void;
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
                  const mediaToUpdate = newModule.media[mediaIndex];
                  if (mediaToUpdate) {
                    mediaToUpdate.title = e.target.value;
                    updateModule(selectedModule.id, newModule);
                  }
                }}
                className="flex-1 text-xl font-medium bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-[var(--accent)] rounded px-2"
                placeholder="Media Title"
              />
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => {
                    const newModule = { ...selectedModule };
                    const newItem: MediaItem = {
                      id: crypto.randomUUID(),
                      type: MediaType.VIDEO,
                      title: 'New Item',
                      order: newModule.media[mediaIndex].items.length,
                      video_id: null,
                      video_name: null
                    };
                    newModule.media[mediaIndex].items.push(newItem);
                    updateModule(selectedModule.id, newModule);
                  }}
                  className="p-2 rounded-lg hover:bg-[var(--hover-bg)] transition-colors opacity-0 group-hover/media:opacity-100"
                >
                  <Plus className="w-5 h-5 text-[var(--text-secondary)]" />
                </button>
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

          {media.items.length > 0 && (
            <div className="px-6 pb-6">
              <div className="space-y-4">
                {media.items.map((item, itemIndex) => (
                  <MediaItemContainer
                    key={itemIndex}
                    item={item}
                    onUpdate={(updates: MediaItemUpdates) => {
                      const newModule = { ...selectedModule };
                      newModule.media[mediaIndex].items[itemIndex] = {
                        ...item,
                        ...updates
                      };
                      updateModule(selectedModule.id, newModule);
                    }}
                    onRemove={() => {
                      const newModule = { ...selectedModule };
                      newModule.media[mediaIndex].items.splice(itemIndex, 1);
                      updateModule(selectedModule.id, newModule);
                    }}
                  />
                ))}
              </div>
            </div>
          )}
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
  module: Module;
  isSelected: boolean;
  onSelect: () => void;
  onRemove: () => void;
  updateModule: (moduleId: string, updates: Partial<Module>) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
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

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={onSelect}
      onDoubleClick={(e) => {
        e.stopPropagation();
        setIsEditing(true);
      }}
      className={cn(
        "group w-full flex rounded-lg border transition-colors cursor-pointer",
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
            ref={inputRef}
            type="text"
            value={module.title}
            onChange={e => {
              e.stopPropagation();
              updateModule(module.id, { title: e.target.value });
            }}
            onBlur={() => setIsEditing(false)}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                setIsEditing(false);
              }
              e.stopPropagation();
            }}
            className={cn(
              "w-full bg-transparent outline-none focus:outline-none focus:ring-0 ring-0 border-0 focus:border-0 rounded-none focus:rounded-none px-0 select-none focus:shadow-none shadow-none text-xl font-medium pointer-events-none",
              isEditing && "bg-[var(--hover-bg)] px-2 rounded-md pointer-events-auto"
            )}
            placeholder="Module Title"
            readOnly={!isEditing}
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
    </div>
  );
}

interface LeftContentBuilderProps {
  content: ExtendedContent;
  onSave: (content: ExtendedContent) => Promise<void>;
  onClose: () => void;
}

export default function LeftContentBuilder({ content: initialContent, onSave, onClose }: LeftContentBuilderProps) {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const typeRef = useRef<HTMLDivElement>(null);
  const nameRef = useRef<HTMLDivElement>(null);
  const collectionRef = useRef<HTMLDivElement>(null);
  const [isEditing, setIsEditing] = useState(true);
  const [content, setContent] = useState<ExtendedContent>({
    ...initialContent,
    modules: initialContent.modules || [],
    collection: initialContent.collection || null,
    stats: initialContent.stats || {
      enrolled_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  });
  const [selectedCollection, setSelectedCollection] = useState<string>(content.collection_id);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [isCreatingCollection, setIsCreatingCollection] = useState(false);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [aiTools, setAITools] = useState<AITool[]>([]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Fetch collections on mount
  useEffect(() => {
    fetchCollections();
  }, []);

  const handleSubmit = async () => {
    try {
      // Validate required fields
      if (!content.title?.trim()) {
        toast.error('Please enter a content title');
        return;
      }

      if (!selectedCollection) {
        toast.error('Please select or create a collection');
        return;
      }

      if (!content.modules.length) {
        toast.error('Please add at least one module');
        return;
      }

      // Show loading toast
      const loadingToast = toast.loading('Updating content...');

      // Call the onSave callback with the updated content
      await onSave(content);

      // Success! Dismiss loading toast and show success
      toast.dismiss(loadingToast);
      toast.success('Content updated successfully!');
    } catch (error: any) {
      console.error('Error updating content:', error);
      toast.error(`Failed to update content: ${error.message}`);
    }
  };

  const fetchCollections = async () => {
    try {
      const { data, error } = await supabase
        .rpc('get_content_collections');
      
      if (error) {
        console.error('Error fetching collections:', error);
        toast.error(`Failed to fetch collections: ${error.message}`);
        return;
      }
    
      if (data) {
        // Sort collections by name for better usability
        const sortedCollections = data.sort((a: Collection, b: Collection) => 
          a.name.toLowerCase().localeCompare(b.name.toLowerCase())
        );
        setCollections(sortedCollections);
      } else {
        setCollections([]);
      }
    } catch (error: any) {
      console.error('Error fetching collections:', error);
      toast.error('Failed to fetch collections');
    }
  };

  const handleCreateCollection = async () => {
    if (!newCollectionName.trim()) {
      alert('Please enter a collection name');
      return;
    }

    try {
      console.log('Creating collection with name:', newCollectionName);

      const { data, error } = await supabase
        .rpc('create_content_collection', {
          p_name: newCollectionName,
          p_description: null
        });

      console.log('Create collection response:', {
        error,
        data
      });

      if (error) {
        console.error('Error creating collection:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        alert(error.message || 'Failed to create collection');
        return;
      }

      if (data) {
        console.log('Collection created successfully:', data);
        setCollections(prev => [...prev, data]);
        setSelectedCollection(data.id);
        setNewCollectionName('');
        setIsCreatingCollection(false);
      }
    } catch (error: any) {
      console.error('Unexpected error creating collection:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      alert('An unexpected error occurred while creating the collection');
    }
  };

  function createEmptyMediaItem(type: MediaType): MediaItem {
    const baseItem = {
      id: crypto.randomUUID(),
      title: '',
      order: 0
    };

    switch (type) {
      case MediaType.VIDEO:
        return {
          ...baseItem,
          type: MediaType.VIDEO,
          video_id: null,
          video_name: null
        } as VideoItem;
      case MediaType.TEXT:
        return {
          ...baseItem,
          type: MediaType.TEXT,
          content_text: null
        } as TextItem;
      case MediaType.AI:
        return {
          ...baseItem,
          type: MediaType.AI,
          tool_id: null,
          tool: null
        } as AIItem;
      case MediaType.PDF:
        return {
          ...baseItem,
          type: MediaType.PDF,
          pdf_url: null,
          pdf_type: null,
          custom_pdf_type: null
        } as PDFItem;
      case MediaType.QUIZ:
        return {
          ...baseItem,
          type: MediaType.QUIZ,
          quiz_data: {}
        } as QuizItem;
      default:
        throw new Error(`Invalid media item type: ${type}`);
    }
  }

  function createEmptyMedia(order: number = 0, moduleId: string, contentId: string): ExtendedMedia {
    return {
      id: crypto.randomUUID(),
      title: '',
      description: null,
      order,
      module_id: moduleId,
      content_id: contentId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      items: []
    };
  }

  function createEmptyModule(order: number = 0, contentId: string): ExtendedModule {
    return {
      id: crypto.randomUUID(),
      title: '',
      description: null,
      order,
      content_id: contentId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      media: []
    };
  }

  const addModule = () => {
    setContent(prevContent => ({
      ...prevContent,
      modules: [...prevContent.modules, createEmptyModule(prevContent.modules.length, prevContent.id)]
    }));
  };

  const updateModule = (moduleId: string, updates: Partial<ExtendedModule>) => {
    setContent(prevContent => ({
      ...prevContent,
      modules: prevContent.modules.map(module =>
        module.id === moduleId ? { ...module, ...updates } : module
      )
    }));
  };

  const handleMediaItemUpdate = (moduleIndex: number, mediaIndex: number, itemIndex: number, updates: Partial<MediaItem>) => {
    setContent(prevContent => {
      const newContent = { ...prevContent };
      const module = newContent.modules[moduleIndex];
      if (!module) return prevContent;

      const media = module.media[mediaIndex];
      if (!media) return prevContent;

      const items = [...media.items];
      const currentItem = items[itemIndex];
      if (!currentItem) return prevContent;

      // Create a new item with the correct type based on the current item's type
      const updatedItem = {
        ...currentItem,
        ...updates,
        type: currentItem.type // Preserve the original type
      } as MediaItem;

      items[itemIndex] = updatedItem;
      media.items = items;
      return newContent;
    });
  };

  const removeModule = (moduleId: string) => {
    setContent(prevContent => ({
      ...prevContent,
      modules: prevContent.modules.filter(module => module.id !== moduleId)
    }));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) return;

    setContent(items => {
      const oldIndex = items.modules.findIndex(item => item.id === active.id);
      const newIndex = items.modules.findIndex(item => item.id === over.id);
      
      return {
        ...items,
        modules: arrayMove(items.modules, oldIndex, newIndex)
      };
    });
  };

  const selectedModule = content.modules.find(m => m.id === selectedModuleId);

  const filteredCollections = collections
    .filter(collection =>
      collection.name.toLowerCase().includes(newCollectionName.toLowerCase())
    )
    .slice(0, 5);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      // Handle collection dropdown
      if (isCreatingCollection || newCollectionName) {
        if (collectionRef.current && !collectionRef.current.contains(event.target as Node)) {
          setIsCreatingCollection(false);
          setNewCollectionName('');
        }
      }

      // Handle type selector dropdown
      if (selectedModule?.media.some(media => 
        media.items.some(item => item.showTypeSelector)
      )) {
        if (typeRef.current && !typeRef.current.contains(event.target as Node)) {
          const newModule = { ...selectedModule };
          newModule.media = newModule.media.map(media => ({
            ...media,
            items: media.items.map(item => ({
              ...item,
              showTypeSelector: false
            }))
          }));
          updateModule(selectedModule.id, newModule);
        }
      }

      // Handle name suggestions dropdown
      if (selectedModule?.media.some(media => 
        media.items.some(item => item.showNameSuggestions)
      )) {
        if (nameRef.current && !nameRef.current.contains(event.target as Node)) {
          const newModule = { ...selectedModule };
          newModule.media = newModule.media.map(media => ({
            ...media,
            items: media.items.map(item => ({
              ...item,
              showNameSuggestions: false
            }))
          }));
          updateModule(selectedModule.id, newModule);
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [selectedModule, isCreatingCollection, newCollectionName]);

  // Function to fetch AI tool details
  const fetchAIToolDetails = async (toolId: string) => {
    try {
      const supabase = createClientComponentClient();
      
      // Fetch the tool with collection and suite titles
      const { data: tools, error: toolError } = await supabase
        .rpc('get_tool_with_names', { p_tool_id: toolId });

      if (toolError) {
        console.error('Error fetching AI tool:', toolError);
        return null;
      }

      if (!tools || tools.length === 0) {
        return null;
      }

      const tool = tools[0];

      // Fetch the inputs
      const { data: inputs, error: inputsError } = await supabase
        .rpc('get_tool_inputs', { tool_id: toolId });

      if (inputsError) {
        console.error('Error fetching AI tool inputs:', inputsError);
        return null;
      }

      // Fetch the prompts
      const { data: prompts, error: promptsError } = await supabase
        .rpc('get_tool_prompts', { tool_id: toolId });

      if (promptsError) {
        console.error('Error fetching AI tool prompts:', promptsError);
        return null;
      }

      return {
        ...tool,
        inputs: inputs || [],
        prompts: prompts || []
      };
    } catch (error) {
      console.error('Error fetching AI tool details:', error);
      return null;
    }
  };

  // Fetch AI tool details for each AI media item on mount
  useEffect(() => {
    const fetchAllAITools = async () => {
      const updatedModules = [...content.modules];
      let hasUpdates = false;

      for (let moduleIndex = 0; moduleIndex < updatedModules.length; moduleIndex++) {
        const module = updatedModules[moduleIndex];
        for (let mediaIndex = 0; mediaIndex < module.media.length; mediaIndex++) {
          const media = module.media[mediaIndex];
          for (let itemIndex = 0; itemIndex < media.items.length; itemIndex++) {
            const item = media.items[itemIndex];
            if (item.type === MediaType.AI && item.tool_id) {
              const toolDetails = await fetchAIToolDetails(item.tool_id);
              if (toolDetails) {
                media.items[itemIndex] = {
                  ...item,
                  tool: toolDetails
                };
                hasUpdates = true;
              }
            }
          }
        }
      }

      if (hasUpdates) {
        setContent(prevContent => ({
          ...prevContent,
          modules: updatedModules
        }));
      }
    };

    fetchAllAITools();
  }, []);

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Toaster richColors position="top-center" />
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-[var(--border-color)] bg-[var(--background)]/80 backdrop-blur-sm">
        <div className="flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-2">
            <Link 
              href="/admin/content"
              className="p-2 rounded-lg hover:bg-[var(--hover-bg)] transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-[var(--text-secondary)]" />
            </Link>
            <div className="flex items-center gap-2 text-[var(--text-secondary)]">
              <span>Admin</span>
              <ChevronRight className="w-4 h-4" />
              <span>Content</span>
              <ChevronRight className="w-4 h-4" />
              <span className="text-[var(--foreground)] font-medium">New Content</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center p-1 gap-1 rounded-lg border border-[var(--border-color)] bg-[var(--background)]">
              <button
                onClick={() => setContent(prev => ({ ...prev, status: ContentStatus.DRAFT }))}
                className={cn(
                  "px-3 py-1.5 rounded-md text-sm font-medium transition-colors text-[var(--foreground)]",
                  content.status === ContentStatus.DRAFT
                    ? "border-2 border-[var(--accent)]"
                    : "hover:bg-[var(--hover-bg)] text-[var(--text-secondary)]"
                )}
              >
                Draft
              </button>
              <button
                onClick={() => setContent(prev => ({ ...prev, status: ContentStatus.PUBLISHED }))}
                className={cn(
                  "px-3 py-1.5 rounded-md text-sm font-medium transition-colors text-[var(--foreground)]",
                  content.status === ContentStatus.PUBLISHED
                    ? "border-2 border-[var(--accent)]"
                    : "hover:bg-[var(--hover-bg)] text-[var(--text-secondary)]"
                )}
              >
                Published
              </button>
              <button
                onClick={() => setContent(prev => ({ ...prev, status: ContentStatus.ARCHIVED }))}
                className={cn(
                  "px-3 py-1.5 rounded-md text-sm font-medium transition-colors text-[var(--foreground)]",
                  content.status === ContentStatus.ARCHIVED
                    ? "border-2 border-[var(--accent)]"
                    : "hover:bg-[var(--hover-bg)] text-[var(--text-secondary)]"
                )}
              >
                Archived
              </button>
            </div>
            <button
              onClick={() => handleSubmit()}
              className="px-4 py-2 rounded-lg bg-[var(--accent)] text-white hover:opacity-90 transition-opacity flex items-center gap-2 text-sm font-medium"
            >
              <Save className="w-4 h-4" />
              Save
            </button>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-4rem)]">
        {/* Left Panel - 30% */}
        <div className="w-[30%] border-r border-[var(--border-color)] overflow-y-auto">
          <div className="p-8 space-y-8">
            {/* Content Info */}
            <div>
              <input
                type="text"
                value={content.title}
                onChange={e => setContent({ ...content, title: e.target.value })}
                className="text-4xl font-bold bg-transparent outline-none focus:outline-none focus:ring-0 ring-0 border-0 focus:border-0 rounded-none focus:rounded-none px-0 select-none focus:shadow-none shadow-none w-full mb-4"
                placeholder="Content Title"
              />
              <textarea
                value={content.description || ''}
                onChange={e => setContent({ ...content, description: e.target.value })}
                className="w-full text-xl text-[var(--text-secondary)] bg-transparent outline-none focus:outline-none focus:ring-0 ring-0 border-0 focus:border-0 rounded-none focus:rounded-none px-0 select-none focus:shadow-none shadow-none resize-none overflow-hidden"
                placeholder="Content Description"
                style={{ height: 'auto' }}
                onInput={e => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = 'auto';
                  target.style.height = target.scrollHeight + 'px';
                }}
              />
            </div>

            {/* Collections */}
            <div ref={collectionRef} className="relative py-10 border-y border-[var(--border-color)]">
              <div className="text-2xl font-bold text-[var(--text-secondary)] mb-4">Collection</div>
              <input
                type="text"
                value={selectedCollection ? collections.find(c => c.id === selectedCollection)?.name || '' : newCollectionName}
                onChange={e => {
                  setNewCollectionName(e.target.value);
                  setIsCreatingCollection(true);
                  // Fetch collections when typing
                  fetchCollections();
                }}
                onFocus={() => {
                  fetchCollections();
                  setIsCreatingCollection(true);
                  // Clear selected collection when focusing to allow new search
                  setSelectedCollection('');
                }}
                placeholder="Select Collection"
                className="w-full text-xl text-[var(--text-secondary)] bg-transparent outline-none focus:outline-none focus:ring-0 ring-0 border-0 focus:border-0 rounded-none focus:rounded-none px-0 select-none focus:shadow-none shadow-none"
              />
              {(isCreatingCollection || newCollectionName) && (
                <div className="absolute w-full mt-2 py-1 rounded-lg border border-[var(--border-color)] bg-[var(--card-bg)] shadow-lg z-10">
                  {collections
                    .filter(collection => 
                      collection.name.toLowerCase().includes(newCollectionName.toLowerCase())
                    )
                    .map(collection => (
                      <button
                        key={collection.id}
                        onClick={() => {
                          setSelectedCollection(collection.id);
                          setNewCollectionName('');
                          setIsCreatingCollection(false);
                        }}
                        className="w-full px-4 py-3 flex items-center justify-between hover:bg-[var(--hover-bg)] transition-colors text-lg"
                      >
                        <span>{collection.name}</span>
                        {selectedCollection === collection.id && (
                          <Check className="w-5 h-5 text-green-500" />
                        )}
                      </button>
                    ))}
                  {newCollectionName && !collections.some(c => 
                    c.name.toLowerCase() === newCollectionName.toLowerCase()
                  ) && (
                    <button
                      onClick={handleCreateCollection}
                      className="w-full px-4 py-3 flex items-center gap-2 text-[var(--accent)] hover:bg-[var(--hover-bg)] transition-colors text-lg"
                    >
                      <Plus className="w-5 h-5" />
                      Create &quot;{newCollectionName}&quot;
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Modules List */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-[var(--text-secondary)]">Modules</h2>
                <button
                  onClick={addModule}
                  className="p-2 rounded-lg hover:bg-[var(--hover-bg)] transition-colors text-[var(--text-secondary)]"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                measuring={{
                  droppable: {
                    strategy: MeasuringStrategy.Always
                  }
                }}
                onDragStart={() => {
                  document.body.style.setProperty('cursor', 'grabbing');
                }}
                onDragEnd={(event) => {
                  document.body.style.setProperty('cursor', '');
                  const { active, over } = event;
                  if (!over || active.id === over.id) return;

                  const oldIndex = content.modules.findIndex(item => item.id === active.id);
                  const newIndex = content.modules.findIndex(item => item.id === over.id);
                  
                  setContent(prevContent => ({
                    ...prevContent,
                    modules: arrayMove(prevContent.modules, oldIndex, newIndex)
                  }));
                }}
              >
                <SortableContext
                  items={content.modules.map(module => module.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-3">
                    {content.modules.map((module) => (
                      <SortableModuleItem
                        key={module.id}
                        module={module}
                        isSelected={selectedModuleId === module.id}
                        onSelect={() => setSelectedModuleId(module.id)}
                        onRemove={() => removeModule(module.id)}
                        updateModule={updateModule}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </div>
          </div>
        </div>

        {/* Right Panel - 70% */}
        <div className="flex-1 overflow-y-auto">
          {selectedModule ? (
            <div className="p-8">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-semibold">{selectedModule.title}</h2>
                <button
                  onClick={() => {
                    const newModule = { ...selectedModule };
                    newModule.media.push(createEmptyMedia(selectedModule.media.length, selectedModule.id, content.id));
                    updateModule(selectedModule.id, newModule);
                  }}
                  className="px-4 py-2 rounded-lg bg-[var(--accent)] text-white hover:opacity-90 transition-opacity flex items-center gap-2 text-base font-medium"
                >
                  <Plus className="w-5 h-5" />
                  Add Media
                </button>
              </div>

              <div className="space-y-6">
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  measuring={{
                    droppable: {
                      strategy: MeasuringStrategy.Always
                    }
                  }}
                  onDragStart={() => {
                    document.body.style.setProperty('cursor', 'grabbing');
                  }}
                  onDragEnd={(event) => {
                    document.body.style.setProperty('cursor', '');
                    const { active, over } = event;
                    if (!over || active.id === over.id) return;

                    const oldIndex = selectedModule.media.findIndex(m => m.id === active.id);
                    const newIndex = selectedModule.media.findIndex(m => m.id === over.id);
                    
                    const newModule = { ...selectedModule };
                    newModule.media = arrayMove(newModule.media, oldIndex, newIndex);
                    updateModule(selectedModule.id, newModule);
                    handleMediaItemUpdate(selectedModule.id, newModule);
                  }}
                >
                  <SortableContext
                    items={selectedModule.media.map(m => m.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {selectedModule.media.map((media, mediaIndex) => (
                      <SortableMediaItem
                        key={media.id}
                        media={media}
                        mediaIndex={mediaIndex}
                        selectedModule={selectedModule}
                        updateModule={handleMediaItemUpdate}
                      />
                    ))}
                  </SortableContext>
                </DndContext>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-[var(--text-secondary)] text-xl">
              Select a module to edit its content
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 
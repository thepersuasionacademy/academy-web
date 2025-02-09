'use client';

import React, { useState, useRef, useEffect } from 'react';
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
import { cn } from "@/lib/utils";
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
import { MediaItemContainer } from '../components/media-items';
import { toast, Toaster } from 'sonner';

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
  media: ModuleMedia;
  mediaIndex: number;
  selectedModule: Module;
  updateModule: (moduleId: string, updates: Partial<Module>) => void;
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
                    newModule.media[mediaIndex].items.push({
                      type: MediaType.VIDEO,
                      title: 'New Item',
                      order: newModule.media[mediaIndex].items.length
                    });
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
                    onUpdate={(updates) => {
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

export default function NewContentPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const typeRef = useRef<HTMLDivElement>(null);
  const nameRef = useRef<HTMLDivElement>(null);
  const collectionRef = useRef<HTMLDivElement>(null);
  const [isEditing, setIsEditing] = useState(true);
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
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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

      if (!modules.length) {
        toast.error('Please add at least one module');
        return;
      }

      // Show loading toast
      const loadingToast = toast.loading('Creating content...');

      // Prepare the content input
      const contentInput = {
        collection_id: selectedCollection,
        title: content.title.trim(),
        description: content.description?.trim() || null,
        status: content.status?.toLowerCase() || 'draft',
        thumbnail_url: content.thumbnail_url || null,
        modules: modules.map((module, moduleIndex) => ({
          title: module.title.trim(),
          description: module.description?.trim() || null,
          order: moduleIndex,
          media: module.media.map((media, mediaIndex) => ({
            title: media.title.trim(),
            description: media.description?.trim() || null,
            order: mediaIndex,
            items: media.items.map((item, itemIndex) => ({
              type: item.type,
              title: item.title?.trim() || null,
              video_id: item.video_id || null,
              video_name: item.video_name || null,
              content_text: item.content_text?.trim() || null,
              tool_id: item.tool_id || null,
              pdf_url: item.pdf_url || null,
              pdf_type: item.pdf_type || null,
              custom_pdf_type: item.custom_pdf_type || null,
              quiz_data: item.quiz_data || {},
              order: itemIndex
            }))
          }))
        }))
      };

      // Call the RPC function
      const { data, error } = await supabase
        .rpc('create_content', {
          p_content: contentInput
        });

      if (error) {
        console.error('Error creating content:', error);
        toast.error(`Failed to create content: ${error.message}`);
        toast.dismiss(loadingToast);
        return;
      }

      // Success! Dismiss loading toast and show success
      toast.dismiss(loadingToast);
      toast.success('Content created successfully!');

      // Redirect back to content list
      router.push('/admin/content');
    } catch (error: any) {
      console.error('Error creating content:', error);
      toast.error(error.message || 'Failed to create content. Please try again.');
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

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) return;

    setModules(items => {
      const oldIndex = items.findIndex(item => item.id === active.id);
      const newIndex = items.findIndex(item => item.id === over.id);
      
      return arrayMove(items, oldIndex, newIndex);
    });
  };

  const selectedModule = modules.find(m => m.id === selectedModuleId);

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

                  const oldIndex = modules.findIndex(item => item.id === active.id);
                  const newIndex = modules.findIndex(item => item.id === over.id);
                  
                  setModules(arrayMove(modules, oldIndex, newIndex));
                }}
              >
                <SortableContext
                  items={modules.map(module => module.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-3">
                    {modules.map((module) => (
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
                  onClick={() => addMedia(selectedModule.id)}
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
                        updateModule={updateModule}
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
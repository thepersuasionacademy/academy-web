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
  EyeOff
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
import { MediaItemContainer } from '../components/media-items';

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

export default function NewContentPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const typeRef = useRef<HTMLDivElement>(null);
  const nameRef = useRef<HTMLDivElement>(null);
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
      if (!selectedCollection) {
        alert('Please select or create a collection');
        return;
      }

      // ... Keep the existing submit logic ...

      router.push('/admin/content');
    } catch (error) {
      console.error('Error creating content:', error);
      alert('Failed to create content. Please try again.');
    }
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

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
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
  }, [selectedModule]);

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-[var(--border-color)] bg-[var(--background)]/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link 
                href="/admin/content"
                className="p-2 rounded-lg hover:bg-[var(--hover-bg)] transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-[var(--text-secondary)]" />
              </Link>
              <h1 className="text-2xl font-semibold text-[var(--foreground)]">New Content</h1>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={content.status}
                onChange={e => setContent({ ...content, status: e.target.value as ContentStatus })}
                className="px-3 py-1.5 rounded-lg border border-[var(--border-color)] bg-[var(--background)] text-[var(--text-secondary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              >
                <option value={ContentStatus.DRAFT}>Draft</option>
                <option value={ContentStatus.PUBLISHED}>Published</option>
                <option value={ContentStatus.ARCHIVED}>Archived</option>
              </select>
              <button
                onClick={handleSubmit}
                className="px-4 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 text-sm font-medium"
              >
                <Save className="w-4 h-4" />
                Publish
              </button>
            </div>
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
                className="text-4xl font-bold bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-[var(--accent)] rounded px-2 w-full mb-4"
                placeholder="Content Title"
              />
              <textarea
                value={content.description}
                onChange={e => setContent({ ...content, description: e.target.value })}
                className="w-full text-xl text-[var(--text-secondary)] bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-[var(--accent)] rounded px-2"
                placeholder="Content Description"
                rows={3}
              />
            </div>

            {/* Collections */}
            <div className="relative">
              <div className="flex items-center gap-2 p-3 rounded-lg border border-[var(--border-color)] bg-[var(--card-bg)]">
                <Search className="w-5 h-5 text-[var(--text-secondary)]" />
                <input
                  type="text"
                  value={newCollectionName}
                  onChange={e => setNewCollectionName(e.target.value)}
                  placeholder="Search or create collections..."
                  className="flex-1 bg-transparent border-none focus:outline-none text-[var(--foreground)] text-lg"
                />
                <button
                  onClick={() => setIsCreatingCollection(true)}
                  className="p-2 rounded-lg hover:bg-[var(--hover-bg)] transition-colors text-[var(--text-secondary)]"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              {(isCreatingCollection || newCollectionName) && (
                <div className="absolute w-full mt-2 py-1 rounded-lg border border-[var(--border-color)] bg-[var(--card-bg)] shadow-lg z-10">
                  {collections
                    .filter(c => c.name.toLowerCase().includes(newCollectionName.toLowerCase()))
                    .map(collection => (
                      <button
                        key={collection.id}
                        onClick={() => setSelectedCollection(collection.id)}
                        className="w-full px-4 py-3 flex items-center justify-between hover:bg-[var(--hover-bg)] transition-colors text-lg"
                      >
                        <span>{collection.name}</span>
                        {selectedCollection === collection.id && (
                          <Check className="w-5 h-5 text-green-500" />
                        )}
                      </button>
                    ))}
                  {newCollectionName && !collections.some(c => c.name.toLowerCase() === newCollectionName.toLowerCase()) && (
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
              <div className="flex items-center justify-between px-2">
                <h2 className="text-lg font-medium text-[var(--text-secondary)]">Modules</h2>
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
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={modules.map(module => module.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-3">
                    {modules.map((module) => (
                      <button
                        key={module.id}
                        onClick={() => setSelectedModuleId(module.id)}
                        className={cn(
                          "group w-full flex rounded-lg border transition-colors",
                          selectedModuleId === module.id
                            ? "border-[var(--border-color)] bg-[var(--accent)]/5"
                            : "border-[var(--border-color)] hover:border-[var(--accent)] hover:bg-[var(--accent)]/5 bg-[var(--card-bg)]"
                        )}
                      >
                        <div className={cn(
                          "w-16 cursor-grab flex items-center justify-center transition-colors rounded-l-lg border-r border-[var(--border-color)]",
                          selectedModuleId === module.id
                            ? "hover:bg-[var(--accent)]/10"
                            : "hover:bg-[var(--hover-bg)]"
                        )}>
                          <Grip className="w-5 h-5 text-[var(--text-secondary)]" />
                        </div>
                        <div className="flex-1 flex items-center gap-4 p-4">
                          <input
                            type="text"
                            value={module.title}
                            onChange={e => {
                              e.stopPropagation();
                              updateModule(module.id, { title: e.target.value });
                            }}
                            onClick={e => e.stopPropagation()}
                            className={cn(
                              "flex-1 bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-[var(--accent)] rounded px-2 text-xl font-medium",
                              selectedModuleId === module.id
                                ? "text-[var(--foreground)]"
                                : "text-[var(--foreground)]"
                            )}
                            placeholder="Module Title"
                          />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeModule(module.id);
                            }}
                            className="p-2 rounded-lg hover:bg-red-500/10 text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      </button>
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
                {selectedModule.media.map((media, mediaIndex) => (
                  <div
                    key={media.id}
                    className="group/media bg-[var(--card-bg)] rounded-lg border border-[var(--border-color)]"
                  >
                    <div className="p-6 flex items-center gap-4">
                      <div className="p-2 cursor-grab opacity-0 group-hover/media:opacity-100 transition-opacity">
                        <Grip className="w-5 h-5 text-[var(--text-secondary)]" />
                      </div>
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
                      <div className="flex items-center gap-2">
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
                ))}
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
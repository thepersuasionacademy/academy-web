import React from 'react';
import { Grip, X, Plus, Video, Type, FileText, ListChecks, Bot } from 'lucide-react';
import { cn } from "@/lib/utils";
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Module, MediaItem, VideoItem, TextItem, AIItem, PDFItem, QuizItem, MediaItemUpdates } from '@/types/content';
import { MediaItemContainer, MediaItemProps } from '../../media-items';

interface ExtendedModule extends Module {
  media: {
    id: string;
    title: string;
    description: string | null;
    order: number;
    created_at: string;
    updated_at: string;
    items: MediaItem[];
  }[];
}

interface SortableMediaItemProps {
  media: ExtendedModule['media'][0];
  mediaIndex: number;
  selectedModule: ExtendedModule;
  onUpdate: (updates: Partial<ExtendedModule['media'][0]>) => void;
}

export function SortableMediaItem({
  media,
  mediaIndex,
  selectedModule,
  onUpdate
}: SortableMediaItemProps) {
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

  const [showAddMenu, setShowAddMenu] = React.useState(false);

  const handleAddItem = (newItem: MediaItem) => {
    // Create a copy of the current items array and add the new item
    const updatedItems = [...media.items, newItem];
    
    // Update the media object with the new items array
    onUpdate({ items: updatedItems });
    
    // Close the add menu
    setShowAddMenu(false);
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
                onChange={e => onUpdate({ title: e.target.value })}
                className="flex-1 text-xl font-medium bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-[var(--accent)] rounded px-2"
                placeholder="Media Title"
              />
              <div className="flex items-center gap-2 flex-shrink-0">
                <div className="relative">
                  <button
                    onClick={() => setShowAddMenu(!showAddMenu)}
                    className="p-2 rounded-lg hover:bg-[var(--hover-bg)] transition-colors opacity-0 group-hover/media:opacity-100"
                  >
                    <Plus className="w-5 h-5 text-[var(--text-secondary)]" />
                  </button>
                  {showAddMenu && (
                    <div className="absolute top-full right-0 mt-1 py-1 rounded-lg border border-[var(--border-color)] bg-[var(--card-bg)] shadow-lg z-10">
                      <button
                        onClick={() => {
                          const newItem: VideoItem = {
                            id: crypto.randomUUID(),
                            type: 'VIDEO',
                            title: 'Lesson',
                            order: media.items.length,
                            video_id: null,
                            video_name: null
                          };
                          handleAddItem(newItem);
                        }}
                        className="w-full px-4 py-2 text-left hover:bg-[var(--hover-bg)] transition-colors flex items-center gap-2"
                      >
                        <Video className="w-4 h-4" />
                        <span>Video</span>
                      </button>
                      <button
                        onClick={() => {
                          const newItem: TextItem = {
                            id: crypto.randomUUID(),
                            type: 'TEXT',
                            title: 'Text',
                            order: media.items.length,
                            content_text: null
                          };
                          handleAddItem(newItem);
                        }}
                        className="w-full px-4 py-2 text-left hover:bg-[var(--hover-bg)] transition-colors flex items-center gap-2"
                      >
                        <Type className="w-4 h-4" />
                        <span>Text</span>
                      </button>
                      <button
                        onClick={() => {
                          const newItem: AIItem = {
                            id: crypto.randomUUID(),
                            type: 'AI',
                            title: 'AI Tool',
                            order: media.items.length,
                            tool_id: null
                          };
                          handleAddItem(newItem);
                        }}
                        className="w-full px-4 py-2 text-left hover:bg-[var(--hover-bg)] transition-colors flex items-center gap-2"
                      >
                        <Bot className="w-4 h-4" />
                        <span>AI Tool</span>
                      </button>
                      <button
                        onClick={() => {
                          const newItem: PDFItem = {
                            id: crypto.randomUUID(),
                            type: 'PDF',
                            title: 'Transcript',
                            order: media.items.length,
                            pdf_url: null,
                            pdf_type: null,
                            custom_pdf_type: null
                          };
                          handleAddItem(newItem);
                        }}
                        className="w-full px-4 py-2 text-left hover:bg-[var(--hover-bg)] transition-colors flex items-center gap-2"
                      >
                        <FileText className="w-4 h-4" />
                        <span>PDF</span>
                      </button>
                      <button
                        onClick={() => {
                          const newItem: QuizItem = {
                            id: crypto.randomUUID(),
                            type: 'QUIZ',
                            title: 'Quiz',
                            order: media.items.length,
                            quiz_data: {}
                          };
                          handleAddItem(newItem);
                        }}
                        className="w-full px-4 py-2 text-left hover:bg-[var(--hover-bg)] transition-colors flex items-center gap-2"
                      >
                        <ListChecks className="w-4 h-4" />
                        <span>Quiz</span>
                      </button>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => {
                    const newModule = { ...selectedModule };
                    newModule.media.splice(mediaIndex, 1);
                    onUpdate(newModule.media[mediaIndex] || {});
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
                      const newItems = [...media.items];
                      newItems[itemIndex] = {
                        ...item,
                        ...updates
                      } as MediaItem;
                      onUpdate({ items: newItems });
                    }}
                    onRemove={() => {
                      const newItems = [...media.items];
                      newItems.splice(itemIndex, 1);
                      onUpdate({ items: newItems });
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
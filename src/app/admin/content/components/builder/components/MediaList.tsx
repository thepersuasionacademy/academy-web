import React from 'react';
import { Plus } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  MeasuringStrategy
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Module, MediaItem } from '@/types/content';
import { SortableMediaItem } from './SortableMediaItem';

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

interface MediaListProps {
  selectedModule: ExtendedModule;
  onMediaAdd: () => void;
  onMediaUpdate: (mediaIndex: number, updates: Partial<ExtendedModule['media'][0]>) => void;
  onMediaReorder: (media: ExtendedModule['media']) => void;
}

export default function MediaList({
  selectedModule,
  onMediaAdd,
  onMediaUpdate,
  onMediaReorder
}: MediaListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) return;

    const oldIndex = selectedModule.media.findIndex(m => m.id === active.id);
    const newIndex = selectedModule.media.findIndex(m => m.id === over.id);
    
    onMediaReorder(arrayMove(selectedModule.media, oldIndex, newIndex));
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-semibold">{selectedModule.title}</h2>
        <button
          onClick={onMediaAdd}
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
            handleDragEnd(event);
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
                onUpdate={(updates) => onMediaUpdate(mediaIndex, updates)}
              />
            ))}
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
} 
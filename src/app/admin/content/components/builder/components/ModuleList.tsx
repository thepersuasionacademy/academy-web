import React from 'react';
import { Plus, Grip, X } from 'lucide-react';
import { cn } from "@/lib/utils";
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
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Module, MediaItem } from '@/types/content';

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

interface SortableModuleItemProps {
  module: ExtendedModule;
  isSelected: boolean;
  onSelect: () => void;
  onRemove: () => void;
  updateModule: (moduleId: string, updates: Partial<ExtendedModule>) => void;
}

function SortableModuleItem({ 
  module, 
  isSelected, 
  onSelect, 
  onRemove,
  updateModule 
}: SortableModuleItemProps) {
  const [isEditing, setIsEditing] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);
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

  React.useEffect(() => {
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

interface ModuleListProps {
  modules: ExtendedModule[];
  selectedModuleId: string | null;
  onModuleSelect: (moduleId: string) => void;
  onModuleAdd: () => void;
  onModuleRemove: (moduleId: string) => void;
  onModulesReorder: (modules: ExtendedModule[]) => void;
  updateModule: (moduleId: string, updates: Partial<ExtendedModule>) => void;
}

export default function ModuleList({
  modules,
  selectedModuleId,
  onModuleSelect,
  onModuleAdd,
  onModuleRemove,
  onModulesReorder,
  updateModule
}: ModuleListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) return;

    const oldIndex = modules.findIndex(item => item.id === active.id);
    const newIndex = modules.findIndex(item => item.id === over.id);
    
    onModulesReorder(arrayMove(modules, oldIndex, newIndex));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-[var(--text-secondary)]">Modules</h2>
        <button
          onClick={onModuleAdd}
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
          handleDragEnd(event);
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
                onSelect={() => onModuleSelect(module.id)}
                onRemove={() => onModuleRemove(module.id)}
                updateModule={updateModule}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
} 
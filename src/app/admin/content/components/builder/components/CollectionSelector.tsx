import React, { useRef, useEffect } from 'react';
import { Check, Plus } from 'lucide-react';
import { Collection } from '@/types/content';

interface CollectionSelectorProps {
  selectedCollection: string;
  collections: Collection[];
  newCollectionName: string;
  isCreatingCollection: boolean;
  onCollectionSelect: (collectionId: string) => void;
  onNewCollectionNameChange: (name: string) => void;
  onCreateCollection: () => void;
  onCreateModeChange: (isCreating: boolean) => void;
}

export default function CollectionSelector({
  selectedCollection,
  collections,
  newCollectionName,
  isCreatingCollection,
  onCollectionSelect,
  onNewCollectionNameChange,
  onCreateCollection,
  onCreateModeChange
}: CollectionSelectorProps) {
  const collectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (collectionRef.current && !collectionRef.current.contains(event.target as Node)) {
        onCreateModeChange(false);
        onNewCollectionNameChange('');
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onCreateModeChange, onNewCollectionNameChange]);

  const filteredCollections = collections
    .filter(collection =>
      collection.name.toLowerCase().includes(newCollectionName.toLowerCase())
    )
    .slice(0, 5);

  return (
    <div ref={collectionRef} className="relative py-10 border-y border-[var(--border-color)]">
      <div className="text-2xl font-bold text-[var(--text-secondary)] mb-4">Collection</div>
      <input
        type="text"
        value={selectedCollection ? collections.find(c => c.id === selectedCollection)?.name || '' : newCollectionName}
        onChange={e => {
          onNewCollectionNameChange(e.target.value);
          onCreateModeChange(true);
        }}
        onFocus={() => {
          onCreateModeChange(true);
          onCollectionSelect('');
        }}
        placeholder="Select Collection"
        className="w-full text-xl text-[var(--text-secondary)] bg-transparent outline-none focus:outline-none focus:ring-0 ring-0 border-0 focus:border-0 rounded-none focus:rounded-none px-0 select-none focus:shadow-none shadow-none"
      />
      {(isCreatingCollection || newCollectionName) && (
        <div className="absolute w-full mt-2 py-1 rounded-lg border border-[var(--border-color)] bg-[var(--card-bg)] shadow-lg z-10">
          {filteredCollections.map(collection => (
            <button
              key={collection.id}
              onClick={() => {
                onCollectionSelect(collection.id);
                onNewCollectionNameChange('');
                onCreateModeChange(false);
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
              onClick={onCreateCollection}
              className="w-full px-4 py-3 flex items-center gap-2 text-[var(--accent)] hover:bg-[var(--hover-bg)] transition-colors text-lg"
            >
              <Plus className="w-5 h-5" />
              Create "{newCollectionName}"
            </button>
          )}
        </div>
      )}
    </div>
  );
} 
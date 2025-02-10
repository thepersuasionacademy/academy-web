import React, { useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { toast } from 'sonner';
import { ChevronDown } from 'lucide-react';

interface Collection {
  id: string;
  name: string;
  description?: string;
}

interface NewContentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (contentId: string) => void;
  collections: Collection[];
}

export default function NewContentDialog({
  isOpen,
  onClose,
  onSuccess,
  collections
}: NewContentDialogProps) {
  const supabase = createClientComponentClient();
  const [title, setTitle] = useState('');
  const [collectionId, setCollectionId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCollectionOpen, setIsCollectionOpen] = useState(false);

  const selectedCollection = collections.find(c => c.id === collectionId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast.error('Please enter a content title');
      return;
    }

    if (!collectionId) {
      toast.error('Please select a collection');
      return;
    }

    setIsLoading(true);

    try {
      // Create new content using RPC
      const { data, error } = await supabase
        .rpc('create_content', {
          p_title: title,
          p_collection_id: collectionId
        });

      if (error) throw error;

      if (data?.id) {
        onSuccess(data.id);
        handleClose();
      }
    } catch (error: any) {
      console.error('Error creating content:', error);
      toast.error(error.message || 'Failed to create content');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setTitle('');
    setCollectionId('');
    setIsCollectionOpen(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Dialog */}
      <div className="relative bg-[var(--card-bg)] rounded-xl shadow-xl w-full max-w-2xl p-8">
        <h2 className="text-2xl font-semibold text-[var(--foreground)] mb-8">Create New Content</h2>
        
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-3">
            <label htmlFor="title" className="block text-base font-medium text-[var(--foreground)]">
              Content Title
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 text-lg rounded-lg border border-[var(--border-color)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              placeholder="Enter content title"
            />
          </div>

          <div className="space-y-3">
            <label className="block text-base font-medium text-[var(--foreground)]">
              Collection
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsCollectionOpen(!isCollectionOpen)}
                className="w-full px-4 py-3 text-lg rounded-lg border border-[var(--border-color)] bg-[var(--background)] text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              >
                <span className={selectedCollection ? 'text-[var(--foreground)]' : 'text-[var(--text-secondary)]'}>
                  {selectedCollection ? selectedCollection.name : 'Select a collection'}
                </span>
                <ChevronDown className={`w-5 h-5 transition-transform ${isCollectionOpen ? 'rotate-180' : ''}`} />
              </button>

              {isCollectionOpen && (
                <div className="absolute z-10 w-full mt-2 py-2 bg-[var(--card-bg)] rounded-lg border border-[var(--border-color)] shadow-lg max-h-64 overflow-y-auto">
                  {collections.map((collection) => (
                    <button
                      key={collection.id}
                      type="button"
                      onClick={() => {
                        setCollectionId(collection.id);
                        setIsCollectionOpen(false);
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-[var(--hover-bg)] transition-colors text-base"
                    >
                      {collection.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-4 pt-6">
            <button
              type="button"
              onClick={handleClose}
              className="px-6 py-3 text-base rounded-lg hover:bg-[var(--hover-bg)] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-3 text-base rounded-lg bg-[var(--accent)] text-white hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Creating...</span>
                </>
              ) : (
                'Create'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 
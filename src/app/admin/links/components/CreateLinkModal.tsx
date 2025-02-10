import React, { useState, useRef, useEffect } from 'react';
import { X, Plus, CheckCircle, Link as LinkIcon } from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { toast } from 'sonner';
import type { SavedLink, LinkCollection, LinkSuite } from '../types';

interface CreateLinkModalProps {
  suiteId: string | null;
  onClose: () => void;
  onSave: (link: Partial<SavedLink> & { suite_id: string }) => void;
  suites: LinkSuite[];
  collections: LinkCollection[];
  setCollections: React.Dispatch<React.SetStateAction<LinkCollection[]>>;
  setSuites: React.Dispatch<React.SetStateAction<LinkSuite[]>>;
}

export function CreateLinkModal({ 
  suiteId, 
  onClose, 
  onSave, 
  suites, 
  collections, 
  setCollections, 
  setSuites 
}: CreateLinkModalProps) {
  const initialSuite = suiteId ? suites.find(s => s.id === suiteId) : null;
  const initialCollection = initialSuite 
    ? collections.find(c => c.id === initialSuite.collection_id)
    : null;

  const [formData, setFormData] = useState<Partial<SavedLink> & { suite_id: string }>({
    id: undefined,
    title: '',
    description: '',
    url: '',
    type: 'software',
    status: 'active',
    tags: [],
    suite_id: suiteId || ''
  });

  const [collectionInput, setCollectionInput] = useState(initialCollection?.title || '');
  const [suiteInput, setSuiteInput] = useState(initialSuite?.title || '');
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(initialCollection?.id || null);
  const [showCollectionDropdown, setShowCollectionDropdown] = useState(false);
  const [showSuiteDropdown, setShowSuiteDropdown] = useState(false);
  const [isCreatingCollection, setIsCreatingCollection] = useState(false);
  const [newCollectionTitle, setNewCollectionTitle] = useState('');
  const [isCreatingSuite, setIsCreatingSuite] = useState(false);
  const [newSuiteTitle, setNewSuiteTitle] = useState('');

  const collectionRef = useRef<HTMLDivElement>(null);
  const suiteRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (collectionRef.current && !collectionRef.current.contains(event.target as Node)) {
        setShowCollectionDropdown(false);
      }
      if (suiteRef.current && !suiteRef.current.contains(event.target as Node)) {
        setShowSuiteDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredCollections = collections.filter(collection =>
    collection.title.toLowerCase().includes(collectionInput.toLowerCase())
  );

  const filteredSuites = suites.filter(suite =>
    suite.collection_id === selectedCollectionId &&
    suite.title.toLowerCase().includes(suiteInput.toLowerCase())
  );

  const handleCollectionSelect = (collection: LinkCollection) => {
    setCollectionInput(collection.title);
    setSelectedCollectionId(collection.id);
    setShowCollectionDropdown(false);
    setSuiteInput('');
    setFormData(prev => ({ ...prev, suite_id: '' }));
  };

  const handleSuiteSelect = (suite: LinkSuite) => {
    setSuiteInput(suite.title);
    setFormData(prev => ({ ...prev, suite_id: suite.id }));
    setShowSuiteDropdown(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.suite_id) {
      toast.error('Please select a suite');
      return;
    }
    onSave(formData);
  };

  const handleCreateCollection = async () => {
    if (!newCollectionTitle.trim()) return;

    try {
      const supabase = createClientComponentClient();
      const { data: collection, error } = await supabase
        .from('collections')
        .insert([
          { title: newCollectionTitle.trim() }
        ])
        .select()
        .single();

      if (error) throw error;

      setCollections([...collections, collection]);
      setCollectionInput(collection.title);
      setSelectedCollectionId(collection.id);
      setShowCollectionDropdown(false);
      setIsCreatingCollection(false);
      setNewCollectionTitle('');

      toast.success('Collection created successfully');
    } catch (error) {
      console.error('Error creating collection:', error);
      toast.error('Failed to create collection');
    }
  };

  const handleCreateSuite = async () => {
    if (!newSuiteTitle.trim() || !selectedCollectionId) return;

    try {
      const supabase = createClientComponentClient();
      const { data: suite, error } = await supabase
        .from('suites')
        .insert([
          { 
            title: newSuiteTitle.trim(),
            collection_id: selectedCollectionId
          }
        ])
        .select()
        .single();

      if (error) throw error;

      setSuites([...suites, suite]);
      setSuiteInput(suite.title);
      setFormData(prev => ({ ...prev, suite_id: suite.id }));
      setShowSuiteDropdown(false);
      setIsCreatingSuite(false);
      setNewSuiteTitle('');

      toast.success('Suite created successfully');
    } catch (error) {
      console.error('Error creating suite:', error);
      toast.error('Failed to create suite');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-[var(--card-bg)] rounded-xl w-full max-w-xl border border-[var(--border-color)] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-[var(--border-color)]">
          <h2 className="text-2xl font-semibold text-[var(--foreground)]">
            Add Link
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[var(--hover-bg)] rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-[var(--text-secondary)]" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {/* Collection and Suite Inputs */}
          <div className="mb-6 space-y-4">
            {/* Collection Input */}
            <div className="relative" ref={collectionRef}>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                Collection
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={isCreatingCollection ? newCollectionTitle : collectionInput}
                  onChange={(e) => {
                    if (isCreatingCollection) {
                      setNewCollectionTitle(e.target.value);
                    } else {
                      setCollectionInput(e.target.value);
                      setShowCollectionDropdown(true);
                    }
                  }}
                  onFocus={() => !isCreatingCollection && setShowCollectionDropdown(true)}
                  className="w-full p-2 rounded-lg border border-[var(--border-color)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)]"
                  placeholder={isCreatingCollection ? "Enter new collection name..." : "Search or add new collection..."}
                />
                {showCollectionDropdown && !isCreatingCollection && (
                  <div className="absolute z-10 w-full mt-1 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg shadow-lg max-h-60 overflow-auto">
                    <div className="py-1">
                      <button
                        type="button"
                        onClick={() => {
                          setIsCreatingCollection(true);
                          setShowCollectionDropdown(false);
                          setNewCollectionTitle(collectionInput);
                        }}
                        className="flex items-center gap-2 w-full px-4 py-2 text-left text-sm hover:bg-[var(--hover-bg)] text-[var(--accent)]"
                      >
                        <Plus className="w-4 h-4" />
                        Add New Collection
                      </button>
                      {filteredCollections.map(collection => (
                        <button
                          key={collection.id}
                          type="button"
                          onClick={() => handleCollectionSelect(collection)}
                          className="w-full px-4 py-2 text-left text-sm hover:bg-[var(--hover-bg)] text-[var(--text-secondary)] hover:text-[var(--foreground)]"
                        >
                          {collection.title}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {isCreatingCollection && (
                  <div className="absolute right-0 top-0 h-full flex items-center gap-2 pr-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsCreatingCollection(false);
                        setNewCollectionTitle('');
                      }}
                      className="p-1 hover:bg-[var(--hover-bg)] rounded-md text-[var(--text-secondary)]"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={handleCreateCollection}
                      className="p-1 hover:bg-[var(--hover-bg)] rounded-md text-[var(--accent)]"
                    >
                      <CheckCircle className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Suite Input */}
            <div className="relative" ref={suiteRef}>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                Suite
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={isCreatingSuite ? newSuiteTitle : suiteInput}
                  onChange={(e) => {
                    if (isCreatingSuite) {
                      setNewSuiteTitle(e.target.value);
                    } else {
                      setSuiteInput(e.target.value);
                      setShowSuiteDropdown(true);
                    }
                  }}
                  onFocus={() => !isCreatingSuite && setShowSuiteDropdown(true)}
                  className="w-full p-2 rounded-lg border border-[var(--border-color)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)]"
                  placeholder={isCreatingSuite ? "Enter new suite name..." : "Search or add new suite..."}
                  disabled={!selectedCollectionId}
                />
                {showSuiteDropdown && !isCreatingSuite && selectedCollectionId && (
                  <div className="absolute z-10 w-full mt-1 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg shadow-lg max-h-60 overflow-auto">
                    <div className="py-1">
                      <button
                        type="button"
                        onClick={() => {
                          setIsCreatingSuite(true);
                          setShowSuiteDropdown(false);
                          setNewSuiteTitle(suiteInput);
                        }}
                        className="flex items-center gap-2 w-full px-4 py-2 text-left text-sm hover:bg-[var(--hover-bg)] text-[var(--accent)]"
                      >
                        <Plus className="w-4 h-4" />
                        Add New Suite
                      </button>
                      {filteredSuites.map(suite => (
                        <button
                          key={suite.id}
                          type="button"
                          onClick={() => handleSuiteSelect(suite)}
                          className="w-full px-4 py-2 text-left text-sm hover:bg-[var(--hover-bg)] text-[var(--text-secondary)] hover:text-[var(--foreground)]"
                        >
                          {suite.title}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {isCreatingSuite && (
                  <div className="absolute right-0 top-0 h-full flex items-center gap-2 pr-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsCreatingSuite(false);
                        setNewSuiteTitle('');
                      }}
                      className="p-1 hover:bg-[var(--hover-bg)] rounded-md text-[var(--text-secondary)]"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={handleCreateSuite}
                      className="p-1 hover:bg-[var(--hover-bg)] rounded-md text-[var(--accent)]"
                    >
                      <CheckCircle className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Link Card Preview */}
          <div className="bg-[var(--background)] rounded-lg p-5 border border-[var(--border-color)]">
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1">
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="text-lg font-medium text-[var(--foreground)] bg-transparent border-none focus:outline-none focus:ring-0 w-full mb-1"
                  placeholder="Enter title"
                  required
                />
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="text-base text-[var(--text-secondary)] bg-transparent border-none focus:outline-none focus:ring-0 w-full resize-none"
                  placeholder="Enter description"
                  rows={2}
                />
              </div>
            </div>

            <div className="h-px bg-[var(--border-color)] w-full my-4" />
            <div className="flex items-center gap-2 text-[var(--text-secondary)] text-sm px-1">
              <LinkIcon className="w-4 h-4 flex-shrink-0" />
              <input
                type="url"
                value={formData.url}
                onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                className="flex-1 bg-transparent border-none focus:outline-none focus:ring-0 text-[var(--text-secondary)]"
                placeholder="Enter URL"
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--foreground)] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-[var(--accent)] text-white hover:opacity-90 transition-opacity"
            >
              Create Link
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 
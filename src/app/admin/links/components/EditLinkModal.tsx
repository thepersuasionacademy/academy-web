import React, { useState, useRef, useEffect } from 'react';
import { X, Plus, CheckCircle, Link as LinkIcon, Pencil, ChevronDown, Check, Eye } from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { toast } from 'sonner';
import type { SavedLink, LinkCollection, LinkSuite } from '../types';

interface EditLinkModalProps {
  link: SavedLink;
  onClose: () => void;
  onSave: (link: Partial<SavedLink> & { suite_id: string }) => void;
  suites: LinkSuite[];
  collections: LinkCollection[];
  setCollections: React.Dispatch<React.SetStateAction<LinkCollection[]>>;
  setSuites: React.Dispatch<React.SetStateAction<LinkSuite[]>>;
}

interface Option {
  id: string;
  title: string;
}

interface CustomDropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder: string;
  disabled?: boolean;
}

function CustomDropdown({ value, onChange, options, placeholder, disabled }: CustomDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.id === value);

  return (
    <div className="relative flex-1" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg border bg-[var(--background)] text-[var(--foreground)] transition-all duration-200 ${
          disabled 
            ? 'opacity-50 cursor-not-allowed border-[var(--border-color)]' 
            : 'hover:border-[var(--accent)] border-[var(--border-color)] cursor-pointer'
        }`}
      >
        <span className={!selectedOption ? 'text-[var(--text-secondary)]' : ''}>
          {selectedOption ? selectedOption.title : placeholder}
        </span>
        <ChevronDown className={`w-4 h-4 text-[var(--text-secondary)] transition-transform duration-200 ${isOpen ? 'transform rotate-180' : ''}`} />
      </button>

      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-1 py-1 rounded-lg border border-[var(--border-color)] bg-[var(--background)] shadow-lg">
          {options.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => {
                onChange(option.id);
                setIsOpen(false);
              }}
              className="w-full flex items-center px-4 py-2 text-[var(--foreground)] hover:bg-[var(--hover-bg)] transition-colors"
            >
              <span className="flex-1 text-left">{option.title}</span>
              {option.id === value && (
                <Check className="w-4 h-4 text-[var(--accent)]" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

interface PreviewTooltipProps {
  url: string;
  isVisible: boolean;
}

function PreviewTooltip({ url, isVisible }: PreviewTooltipProps) {
  if (!isVisible || !url) return null;

  return (
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-[var(--card-bg)] rounded-lg border border-[var(--border-color)] shadow-lg overflow-hidden z-50">
      <div className="aspect-video w-full bg-[var(--background)] relative">
        <iframe
          src={url}
          className="w-full h-full pointer-events-none"
          style={{ transform: 'scale(0.7)', transformOrigin: 'top left' }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--card-bg)] to-transparent" />
      </div>
      <div className="p-2 text-xs text-[var(--text-secondary)] truncate">
        {url}
      </div>
    </div>
  );
}

export function EditLinkModal({ 
  link, 
  onClose, 
  onSave, 
  suites, 
  collections, 
  setCollections, 
  setSuites 
}: EditLinkModalProps) {
  const currentSuite = suites.find(s => s.id === link.suite_id);
  const currentCollection = currentSuite 
    ? collections.find(c => c.id === currentSuite.collection_id)
    : null;

  const [formData, setFormData] = useState({
    ...link,
    suite_id: link.suite_id
  });

  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(currentCollection?.id || null);
  const [isCreatingCollection, setIsCreatingCollection] = useState(false);
  const [newCollectionTitle, setNewCollectionTitle] = useState('');
  const [isCreatingSuite, setIsCreatingSuite] = useState(false);
  const [newSuiteTitle, setNewSuiteTitle] = useState('');

  // Get available suites for selected collection
  const availableSuites = suites.filter(s => s.collection_id === selectedCollectionId);

  const handleCollectionChange = (collectionId: string) => {
    setSelectedCollectionId(collectionId);
    // Clear suite selection when collection changes
    setFormData(prev => ({ ...prev, suite_id: '' }));
  };

  const handleSuiteChange = (suiteId: string) => {
    const updatedData = { ...formData, suite_id: suiteId };
    setFormData(updatedData);
  };

  const handleCreateCollection = async () => {
    if (!newCollectionTitle.trim()) return;

    try {
      const supabase = createClientComponentClient();
      const { data: collection, error } = await supabase
        .rpc('create_link_collection', {
          p_title: newCollectionTitle.trim(),
          p_description: null
        });

      if (error) throw error;

      setCollections(prev => [...prev, collection]);
      setSelectedCollectionId(collection.id);
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
        .rpc('create_link_suite', {
          p_title: newSuiteTitle.trim(),
          p_collection_id: selectedCollectionId,
          p_description: null
        });

      if (error) throw error;

      setSuites(prev => [...prev, suite]);
      setFormData(prev => ({ ...prev, suite_id: suite.id }));
      setIsCreatingSuite(false);
      setNewSuiteTitle('');

      toast.success('Suite created successfully');
    } catch (error) {
      console.error('Error creating suite:', error);
      toast.error('Failed to create suite');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.suite_id) {
      toast.error('Please select a suite');
      return;
    }
    await onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-[var(--card-bg)] rounded-xl w-full max-w-xl border border-[var(--border-color)] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-[var(--border-color)]">
          <h2 className="text-2xl font-semibold text-[var(--foreground)]">Edit Link</h2>
          <button onClick={onClose} className="p-2 hover:bg-[var(--hover-bg)] rounded-lg transition-colors">
            <X className="w-5 h-5 text-[var(--text-secondary)]" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-6 space-y-4">
            {/* Collection Selection */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Collection</label>
              {isCreatingCollection ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newCollectionTitle}
                    onChange={(e) => setNewCollectionTitle(e.target.value)}
                    className="flex-1 px-4 py-2.5 rounded-lg border border-[var(--border-color)] bg-[var(--background)] text-[var(--foreground)]"
                    placeholder="Enter new collection name"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={handleCreateCollection}
                    className="px-4 py-2.5 bg-[var(--accent)] text-white rounded-lg hover:opacity-90 transition-opacity"
                  >
                    Create
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCreatingCollection(false)}
                    className="px-4 py-2.5 border border-[var(--border-color)] rounded-lg hover:bg-[var(--hover-bg)] transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <CustomDropdown
                    value={selectedCollectionId || ''}
                    onChange={handleCollectionChange}
                    options={collections.map(c => ({ id: c.id, title: c.title }))}
                    placeholder="Select Collection"
                  />
                  <button
                    type="button"
                    onClick={() => setIsCreatingCollection(true)}
                    className="px-3 py-2 border border-[var(--border-color)] rounded-lg hover:bg-[var(--hover-bg)] hover:border-[var(--accent)] transition-all duration-200 flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--foreground)] group"
                  >
                    <Plus className="w-4 h-4 transition-transform duration-200 group-hover:scale-110 group-hover:rotate-90" />
                    <span>New</span>
                  </button>
                </div>
              )}
            </div>

            {/* Suite Selection */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Suite</label>
              {isCreatingSuite ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newSuiteTitle}
                    onChange={(e) => setNewSuiteTitle(e.target.value)}
                    className="flex-1 px-4 py-2.5 rounded-lg border border-[var(--border-color)] bg-[var(--background)] text-[var(--foreground)]"
                    placeholder="Enter new suite name"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={handleCreateSuite}
                    className="px-4 py-2.5 bg-[var(--accent)] text-white rounded-lg hover:opacity-90 transition-opacity"
                  >
                    Create
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCreatingSuite(false)}
                    className="px-4 py-2.5 border border-[var(--border-color)] rounded-lg hover:bg-[var(--hover-bg)] transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <CustomDropdown
                    value={formData.suite_id || ''}
                    onChange={handleSuiteChange}
                    options={availableSuites.map(s => ({ id: s.id, title: s.title }))}
                    placeholder="Select Suite"
                    disabled={!selectedCollectionId}
                  />
                  <button
                    type="button"
                    onClick={() => setIsCreatingSuite(true)}
                    disabled={!selectedCollectionId}
                    className="px-3 py-2 border border-[var(--border-color)] rounded-lg hover:bg-[var(--hover-bg)] hover:border-[var(--accent)] transition-all duration-200 flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--foreground)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-[var(--border-color)] group"
                  >
                    <Plus className="w-4 h-4 transition-transform duration-200 group-hover:scale-110 group-hover:rotate-90" />
                    <span>New</span>
                  </button>
                </div>
              )}
            </div>

            {/* Rest of the form fields */}
            <div className="bg-[var(--background)] rounded-lg p-5 border border-[var(--border-color)]">
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
                {formData.url && (
                  <div className="relative group">
                    <button
                      type="button"
                      className="p-1 rounded hover:bg-[var(--hover-bg)] transition-colors"
                      onClick={(e) => e.preventDefault()}
                    >
                      <Eye className="w-4 h-4 text-[var(--text-secondary)] group-hover:text-[var(--foreground)]" />
                    </button>
                    <PreviewTooltip url={formData.url} isVisible={true} />
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
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
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 
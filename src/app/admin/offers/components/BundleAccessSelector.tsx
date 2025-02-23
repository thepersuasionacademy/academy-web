import { useState, useEffect } from 'react';
import { Package, FileText, Search, Loader2, ChevronRight, Plus } from 'lucide-react';
import { cn } from "@/lib/utils";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

type AccessType = 'ai' | 'content' | null;

interface BundleAccessSelectorProps {
  onSubmit: (type: AccessType, id: string) => void;
  onCancel: () => void;
}

interface ContentItem {
  id: string;
  name: string;
  description?: string;
  templates?: {
    id: string;
    name: string;
    type: 'drip' | 'full' | 'basic' | 'premium';
  }[];
}

interface SearchResult {
  id: string;
  title: string;
  description: string | null;
  collection_id: string | null;
  thumbnail_url: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export function BundleAccessSelector({ onSubmit, onCancel }: BundleAccessSelectorProps) {
  const [selectedType, setSelectedType] = useState<AccessType>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [isAddingTemplate, setIsAddingTemplate] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const supabase = createClientComponentClient();

  const accessTypes = [
    { id: 'content', label: 'Content', icon: FileText },
    { id: 'ai', label: 'AI', icon: Package },
  ];

  // Mock templates for different types
  const mockContentTemplates = {
    drip: { id: 'drip', name: 'Drip Access', type: 'drip' as const },
    full: { id: 'full', name: 'Full Access', type: 'full' as const }
  };

  const mockAITemplates = {
    basic: { id: 'basic', name: 'Basic Access', type: 'basic' as const },
    premium: { id: 'premium', name: 'Premium Access', type: 'premium' as const }
  };

  // Search for content when query changes
  useEffect(() => {
    const searchContent = async () => {
      if (!selectedType || !searchQuery.trim()) {
        setSearchResults([]);
        return;
      }

      setIsLoading(true);
      try {
        let data: ContentItem[] = [];
        const error = null;

        if (selectedType === 'content') {
          const { data: searchResults, error: searchError } = await supabase
            .rpc('search_content', { p_search_query: searchQuery });
          
          if (searchError) {
            console.error('Error searching content:', searchError);
            return;
          }

          data = (searchResults as SearchResult[] || []).map(item => ({
            id: item.id,
            name: item.title,
            description: item.description || undefined,
            templates: [mockContentTemplates.drip, mockContentTemplates.full]
          }));
        } else if (selectedType === 'ai') {
          // Mock AI search results with templates
          data = [
            {
              id: '1',
              name: 'AI Collection 1',
              description: 'Full collection access',
              templates: [mockAITemplates.basic, mockAITemplates.premium]
            },
            {
              id: '2',
              name: 'AI Suite 1',
              description: 'Basic suite access',
              templates: [mockAITemplates.basic, mockAITemplates.premium]
            }
          ];
        }

        setSearchResults(data);
      } catch (error) {
        console.error('Error in searchContent:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const debounceTimeout = setTimeout(searchContent, 300);
    return () => clearTimeout(debounceTimeout);
  }, [searchQuery, selectedType, supabase]);

  const selectedItemData = selectedItem ? searchResults.find(item => item.id === selectedItem) : null;

  const handleAddTemplate = () => {
    if (!isAddingTemplate) {
      setIsAddingTemplate(true);
      return;
    }

    if (newTemplateName.trim()) {
      // In a real implementation, this would create a new template
      // For now, we'll just select it immediately
      const newTemplate = {
        id: crypto.randomUUID(),
        name: newTemplateName.trim(),
        type: selectedType === 'content' ? ('full' as const) : ('basic' as const)
      };
      
      // Add the new template to the selected item's templates
      const updatedResults = searchResults.map(item => {
        if (item.id === selectedItem) {
          return {
            ...item,
            templates: [...(item.templates || []), newTemplate]
          };
        }
        return item;
      });
      
      setSearchResults(updatedResults);
      setSelectedTemplate(newTemplate.id);
      setNewTemplateName('');
      setIsAddingTemplate(false);
    }
  };

  const handleTemplateKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleAddTemplate();
    } else if (e.key === 'Escape') {
      setIsAddingTemplate(false);
      setNewTemplateName('');
    }
  };

  return (
    <div className="space-y-4 mb-6 p-4 bg-[var(--card-bg)] rounded-lg border border-[var(--border-color)]">
      {/* Access Type Selection */}
      <div className="flex flex-wrap gap-2">
        {accessTypes.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => {
              setSelectedType(id as AccessType);
              setSearchQuery('');
              setSearchResults([]);
              setSelectedItem(null);
              setSelectedTemplate(null);
            }}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm",
              "border transition-all",
              selectedType === id
                ? "border-[var(--accent)] bg-[var(--accent)] text-white"
                : "border-[var(--border-color)] hover:border-[var(--accent)] text-[var(--text-secondary)]"
            )}
          >
            <Icon className="w-4 h-4" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Content Selection Area */}
      {selectedType && (
        <>
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search ${selectedType}...`}
              className="w-full pl-9 pr-4 py-1.5 text-sm bg-[var(--hover-bg)] border border-[var(--border-color)] rounded-lg focus:outline-none focus:border-[var(--accent)] transition-colors"
            />
          </div>

          {/* Search Results */}
          <div className="max-h-[200px] overflow-y-auto rounded-lg border border-[var(--border-color)]">
            {isLoading ? (
              <div className="flex items-center justify-center p-3">
                <Loader2 className="w-5 h-5 animate-spin text-[var(--text-secondary)]" />
              </div>
            ) : searchResults.length > 0 ? (
              <div className="divide-y divide-[var(--border-color)]">
                {searchResults.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setSelectedItem(item.id);
                      setSelectedTemplate(null);
                    }}
                    className={cn(
                      "w-full px-3 py-2 text-left transition-colors text-sm",
                      "border-2 border-transparent",
                      selectedItem === item.id
                        ? "bg-[var(--accent)]/5 border-[var(--accent)]"
                        : "hover:bg-[var(--hover-bg)]"
                    )}
                  >
                    <div className="font-medium">{item.name}</div>
                    {item.description && (
                      <div className="text-xs text-[var(--text-secondary)] mt-0.5">
                        {item.description}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            ) : searchQuery ? (
              <div className="p-3 text-center text-sm text-[var(--text-secondary)]">
                No results found
              </div>
            ) : (
              <div className="p-3 text-center text-sm text-[var(--text-secondary)]">
                Start typing to search for {selectedType}
              </div>
            )}
          </div>

          {/* Template Selection */}
          {selectedItemData && (
            <div className="space-y-2">
              <div className="text-sm font-medium text-[var(--text-secondary)]">Select Template:</div>
              <div className="flex flex-wrap gap-2">
                {selectedItemData.templates?.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => setSelectedTemplate(selectedTemplate === template.id ? null : template.id)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-sm",
                      "border transition-all",
                      selectedTemplate === template.id
                        ? "border-[var(--accent)] bg-[var(--accent)] text-white"
                        : "border-[var(--border-color)] hover:border-[var(--accent)] text-[var(--text-secondary)]"
                    )}
                  >
                    {template.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-2">
            <button
              onClick={onCancel}
              className="px-3 py-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--foreground)] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (selectedTemplate && selectedType && selectedItem) {
                  onSubmit(selectedType, selectedItem);
                } else {
                  // Handle new template creation
                  console.log('Create new template');
                }
              }}
              disabled={!selectedType || !selectedItem}
              className={cn(
                "px-3 py-1.5 rounded-lg transition-all text-sm flex items-center gap-2",
                selectedType && selectedItem
                  ? "bg-[var(--accent)] text-white hover:opacity-90"
                  : "bg-[var(--hover-bg)] text-[var(--text-secondary)] cursor-not-allowed"
              )}
            >
              <span>{selectedTemplate ? 'Confirm Template' : 'New Template'}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </>
      )}
    </div>
  );
} 
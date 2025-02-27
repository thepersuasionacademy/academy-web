import { useRef, useState, useEffect } from 'react';
import { Search, Loader2, ChevronRight, Plus, X } from 'lucide-react';
import { cn } from "@/lib/utils";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { ContentItem, ContentTemplate, SearchResult } from './types';

// Helper function to generate unique IDs
const generateUniqueId = () => `template-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

interface ContentSelectorProps {
  onItemSelect: (item: ContentItem) => void;
  onTemplateSelect: (template: ContentTemplate) => void;
  selectedItem: string | null | undefined;
  selectedTemplate: string | null | undefined;
}

export function ContentSelector({
  onItemSelect,
  onTemplateSelect,
  selectedItem,
  selectedTemplate
}: ContentSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedContentItem, setSelectedContentItem] = useState<ContentItem | null>(null);
  const [templates, setTemplates] = useState<ContentTemplate[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
  const [newTemplate, setNewTemplate] = useState('');
  
  const searchTimeout = useRef<NodeJS.Timeout>();
  const supabase = createClientComponentClient<any>();

  // Perform search when query changes
  useEffect(() => {
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    searchTimeout.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        // Use Supabase RPC instead of API route
        const { data, error } = await supabase.rpc('search_content', {
          search_term: searchQuery
        });
        
        if (error) {
          console.error('Error searching content:', error);
          return;
        }
        
        if (Array.isArray(data)) {
          setSearchResults(data);
        } else {
          console.error('Invalid data format for search results:', data);
        }
      } catch (error) {
        console.error('Error searching content:', error);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, [searchQuery, supabase]);

  // Fetch templates when content item is selected
  useEffect(() => {
    if (!selectedItem) return;
    
    const fetchSelectedItem = async () => {
      try {
        // Fetch the content item
        const { data: contentData, error: contentError } = await supabase
          .from('content')
          .select('*')
          .eq('id', selectedItem)
          .single();
        
        if (contentError) {
          console.error('Error fetching content item:', contentError);
          return;
        }
        
        if (contentData) {
          setSelectedContentItem({
            id: contentData.id,
            title: contentData.title,
            description: contentData.description,
            type: contentData.type,
            thumbnail: contentData.thumbnail
          });
          
          // Fetch templates for this content
          setIsLoadingTemplates(true);
          const { data: templatesData, error: templatesError } = await supabase.rpc(
            'get_content_templates',
            { content_id: selectedItem }
          );
          
          if (templatesError) {
            console.error('Error fetching templates:', templatesError);
            return;
          }
          
          if (Array.isArray(templatesData)) {
            setTemplates(templatesData);
          } else {
            console.error('Invalid data format for templates:', templatesData);
          }
        }
      } catch (error) {
        console.error('Error fetching content details:', error);
      } finally {
        setIsLoadingTemplates(false);
      }
    };
    
    fetchSelectedItem();
  }, [selectedItem, supabase]);

  const handleAddTemplate = () => {
    if (!newTemplate.trim() || !selectedContentItem) return;
    
    // In a real implementation, you would save this to the database
    const newTemplateItem: ContentTemplate = {
      id: generateUniqueId(),
      template: newTemplate
    };
    
    setTemplates([...templates, newTemplateItem]);
    setNewTemplate('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddTemplate();
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Selected Content Display */}
      {selectedContentItem && (
        <div className="p-4 border border-[var(--border-color)] rounded-lg bg-[var(--hover-bg)]">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-medium">{selectedContentItem.title || 'Unnamed Content'}</h3>
              {selectedContentItem.description && (
                <p className="text-sm text-[var(--text-secondary)] mt-1">
                  {selectedContentItem.description}
                </p>
              )}
            </div>
            <button 
              onClick={() => {
                setSelectedContentItem(null);
                setTemplates([]);
              }}
              className="text-[var(--text-secondary)] hover:text-[var(--accent)] p-1 rounded-full hover:bg-[var(--hover-bg)]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
      
      {/* Search Section */}
      {!selectedContentItem && (
        <div className="space-y-4">
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]">
              <Search className="w-5 h-5" />
            </div>
            <input
              type="text"
              placeholder="Search for content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-[var(--hover-bg)] border border-[var(--border-color)] rounded-lg focus:outline-none focus:border-[var(--accent)] transition-colors"
            />
          </div>
          
          {/* Search Results */}
          {isSearching ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-[var(--text-secondary)]" />
            </div>
          ) : searchResults.length > 0 ? (
            <div className="space-y-2">
              {searchResults.map((result) => (
                <button
                  key={result.id}
                  onClick={() => {
                    const item: ContentItem = {
                      id: result.id,
                      title: result.title,
                      description: null,
                      type: result.type,
                      thumbnail: result.thumbnail
                    };
                    setSelectedContentItem(item);
                    onItemSelect(item);
                  }}
                  className="w-full p-4 border border-[var(--border-color)] rounded-lg text-left hover:bg-[var(--hover-bg)] transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">{result.title || 'Unnamed Content'}</h4>
                      <p className="text-sm text-[var(--text-secondary)]">
                        {result.type || 'Unknown Type'}{result.author ? ` • ${result.author}` : ''}
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-[var(--text-secondary)]" />
                  </div>
                </button>
              ))}
            </div>
          ) : searchQuery.trim().length >= 2 ? (
            <div className="py-8 text-center text-[var(--text-secondary)]">
              No content found. Try a different search term.
            </div>
          ) : null}
        </div>
      )}
      
      {/* Templates Section */}
      {selectedContentItem && (
        <div className="space-y-4">
          <h3 className="text-base font-medium">Templates</h3>
          
          {/* Add New Template */}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Add a new template..."
              value={newTemplate}
              onChange={(e) => setNewTemplate(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 px-4 py-2 bg-[var(--hover-bg)] border border-[var(--border-color)] rounded-lg focus:outline-none focus:border-[var(--accent)] transition-colors"
            />
            <button
              onClick={handleAddTemplate}
              className="px-3 py-2 bg-[var(--accent)] text-white rounded-lg hover:bg-[var(--accent)]/90 transition-colors"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
          
          {/* Templates List */}
          {isLoadingTemplates ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="w-5 h-5 animate-spin text-[var(--text-secondary)]" />
            </div>
          ) : templates.length > 0 ? (
            <div className="space-y-2">
              {templates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => onTemplateSelect(template)}
                  className={cn(
                    "w-full p-3 border border-[var(--border-color)] rounded-lg text-left transition-colors",
                    selectedTemplate === template.id
                      ? "bg-[var(--hover-bg)] border-[var(--accent)]"
                      : "hover:bg-[var(--hover-bg)]"
                  )}
                >
                  {template.template || 'Default Template'}
                </button>
              ))}
            </div>
          ) : (
            <div className="py-6 text-center text-[var(--text-secondary)] border border-dashed border-[var(--border-color)] rounded-lg">
              No templates available. Add one above.
            </div>
          )}
        </div>
      )}
    </div>
  );
} 
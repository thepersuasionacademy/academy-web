import { useState, useEffect, useRef } from 'react';
import { Package, FileText, Search, Loader2, ChevronRight, Plus, ChevronDown, ChevronLeft, X, ArrowDownCircle, Check } from 'lucide-react';
import { cn } from "@/lib/utils";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { AICollection, AISuite as SupabaseAISuite, AITool as SupabaseAITool } from '@/lib/supabase/ai';

// Pagination constants
const ITEMS_PER_PAGE = 5;

type AccessType = 'ai' | 'content' | null;

interface BundleAccessSelectorProps {
  onSubmit: (type: AccessType, id: string, templateInfo?: any) => void;
  onCancel: () => void;
  initialSelection?: {
    type: string;
    categoryId?: string;
    categoryName?: string;
    suiteId?: string;
    suiteName?: string;
    toolIds?: string[];
    toolNames?: string[];
  };
}

interface ContentItem {
  id: string;
  name: string;
  description?: string;
  templates?: {
    id: string;
    name: string;
    type: string;
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

interface ContentTemplate {
  id: string;
  name: string;
  access_overrides: any;
  created_at: string;
  updated_at: string;
  created_by: string;
}

// Use type aliases based on the imported types
type AICategory = AICollection;
type AISuite = SupabaseAISuite;
type AITool = SupabaseAITool;

export function BundleAccessSelector({ onSubmit, onCancel, initialSelection }: BundleAccessSelectorProps) {
  const [selectedType, setSelectedType] = useState<AccessType>(initialSelection?.type as AccessType || null);
  
  // Content selection state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [isAddingTemplate, setIsAddingTemplate] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
  
  // AI selection state
  const [aiCategories, setAICategories] = useState<AICategory[]>([]);
  const [aiSuites, setAISuites] = useState<AISuite[]>([]);
  const [aiTools, setAITools] = useState<AITool[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [isLoadingSuites, setIsLoadingSuites] = useState(false);
  const [isLoadingTools, setIsLoadingTools] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(initialSelection?.categoryId || null);
  const [selectedCategoryName, setSelectedCategoryName] = useState<string | null>(initialSelection?.categoryName || null);
  const [selectedSuiteId, setSelectedSuiteId] = useState<string | null>(initialSelection?.suiteId || null);
  const [selectedSuiteName, setSelectedSuiteName] = useState<string | null>(initialSelection?.suiteName || null);
  const [selectedToolIds, setSelectedToolIds] = useState<string[]>(initialSelection?.toolIds || []);
  const [selectedToolNames, setSelectedToolNames] = useState<string[]>(initialSelection?.toolNames || []);
  
  // Pagination state
  const [categoryPage, setCategoryPage] = useState(1);
  const [suitePage, setSuitePage] = useState(1);
  const [toolPage, setToolPage] = useState(1);
  
  // Search and dropdown state
  const [categorySearchQuery, setCategorySearchQuery] = useState('');
  const [suiteSearchQuery, setSuiteSearchQuery] = useState('');
  const [toolSearchQuery, setToolSearchQuery] = useState('');
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [isSuiteDropdownOpen, setIsSuiteDropdownOpen] = useState(false);
  const [isToolDropdownOpen, setIsToolDropdownOpen] = useState(false);
  
  // Refs for handling outside clicks
  const categoryDropdownRef = useRef<HTMLDivElement>(null);
  const suiteDropdownRef = useRef<HTMLDivElement>(null);
  const toolDropdownRef = useRef<HTMLDivElement>(null);
  
  const supabase = createClientComponentClient();

  const accessTypes = [
    { id: 'content', label: 'Content', icon: FileText },
    { id: 'ai', label: 'AI', icon: Package },
  ];

  // Fetch AI categories when AI access type is selected
  useEffect(() => {
    if (selectedType === 'ai') {
      fetchAICategories();
    }
  }, [selectedType]);

  // Fetch AI suites when a category is selected
  useEffect(() => {
    if (selectedCategoryId) {
      fetchAISuites(selectedCategoryId);
    } else {
      setAISuites([]);
      setSelectedSuiteId(null);
      setSelectedSuiteName(null);
    }
  }, [selectedCategoryId]);

  // Fetch AI tools when a suite is selected
  useEffect(() => {
    if (selectedSuiteId) {
      fetchAITools(selectedSuiteId);
    } else {
      setAITools([]);
      setSelectedToolIds([]);
      setSelectedToolNames([]);
    }
  }, [selectedSuiteId]);

  // Fetch AI categories from the API
  const fetchAICategories = async () => {
    setIsLoadingCategories(true);
    try {
      console.log('Fetching AI categories...');
      
      // Use Supabase RPC instead of API route
      const { data, error } = await supabase.rpc('list_collections');
      
      console.log('Categories RPC response:', data, error);
      
      if (error) {
        console.error('Error fetching AI categories:', error);
        return;
      }
      
      if (Array.isArray(data)) {
        // Log the first category to inspect its structure
        if (data.length > 0) {
          console.log('Example category structure:', data[0]);
          console.log('Category fields:', Object.keys(data[0]));
        }
        setAICategories(data);
      } else {
        console.error('Invalid data format for categories:', data);
      }
    } catch (error) {
      console.error('Error fetching AI categories:', error);
    } finally {
      setIsLoadingCategories(false);
    }
  };

  // Fetch AI suites for a specific category
  const fetchAISuites = async (categoryId: string) => {
    setIsLoadingSuites(true);
    try {
      console.log('Fetching suites for category ID:', categoryId);
      
      // Use Supabase RPC instead of API route
      const { data, error } = await supabase.rpc('get_suites_by_collection', {
        collection_id: categoryId
      });
      
      console.log('Suite RPC response:', data, error);
      
      if (error) {
        console.error('Error fetching AI suites:', error);
        return;
      }
      
      if (Array.isArray(data)) {
        // Log the first suite to inspect its structure
        if (data.length > 0) {
          console.log('Example suite structure:', data[0]);
          console.log('Suite fields:', Object.keys(data[0]));
        }
        setAISuites(data);
      } else {
        console.error('Invalid data format for suites:', data);
      }
    } catch (error) {
      console.error('Error fetching AI suites:', error);
    } finally {
      setIsLoadingSuites(false);
    }
  };

  // Fetch AI tools for a specific suite
  const fetchAITools = async (suiteId: string) => {
    setIsLoadingTools(true);
    try {
      console.log('Fetching tools for suite ID:', suiteId);
      
      // Use Supabase RPC instead of API route
      const { data, error } = await supabase.rpc('get_tools_by_suite', {
        suite_id: suiteId
      });
      
      console.log('Tools RPC response:', data, error);
      
      if (error) {
        console.error('Error fetching AI tools:', error);
        return;
      }
      
      if (Array.isArray(data)) {
        // Log the first tool to inspect its structure
        if (data.length > 0) {
          console.log('Example tool structure:', data[0]);
          console.log('Tool fields:', Object.keys(data[0]));
        }
        setAITools(data);
      } else {
        console.error('Invalid data format for tools:', data);
      }
    } catch (error) {
      console.error('Error fetching AI tools:', error);
    } finally {
      setIsLoadingTools(false);
    }
  };

  // Search for content when query changes
  useEffect(() => {
    const searchContent = async () => {
      if (!selectedType || !searchQuery.trim() || selectedType !== 'content') {
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
            templates: [] // Templates will be loaded when an item is selected
          }));
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

  // Load content templates when an item is selected
  useEffect(() => {
    const fetchContentTemplates = async () => {
      if (selectedType !== 'content' || !selectedItem) return;
      
      setIsLoadingTemplates(true);
      try {
        const { data, error } = await supabase
          .rpc('get_content_templates', {
            p_content_id: selectedItem
          });

        if (error) {
          console.error('Error fetching content templates:', error);
          return;
        }

        // Update the selected item with the fetched templates
        setSearchResults(prev => prev.map(item => {
          if (item.id === selectedItem) {
            return {
              ...item,
              templates: (data as ContentTemplate[] || []).map(template => ({
                id: template.id,
                name: template.name,
                type: 'content'
              }))
            };
          }
          return item;
        }));
      } catch (error) {
        console.error('Error fetching content templates:', error);
      } finally {
        setIsLoadingTemplates(false);
      }
    };

    fetchContentTemplates();
  }, [selectedItem, selectedType, supabase]);

  const selectedItemData = selectedItem ? searchResults.find(item => item.id === selectedItem) : null;
  const selectedTemplateData = selectedTemplate && selectedItemData?.templates 
    ? selectedItemData.templates.find(t => t.id === selectedTemplate) 
    : null;

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
        type: selectedType === 'content' ? 'content' : 'basic'
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

  const handleAICategorySelect = (category: AICategory) => {
    // Toggle selection - if already selected, deselect it
    if (selectedCategoryId === category.id) {
      setSelectedCategoryId(null);
      setSelectedCategoryName(null);
    } else {
      setSelectedCategoryId(category.id);
      setSelectedCategoryName(category.title || '');
    }
  };

  const handleAISuiteSelect = (suite: AISuite) => {
    // Toggle selection - if already selected, deselect it
    if (selectedSuiteId === suite.id) {
      setSelectedSuiteId(null);
      setSelectedSuiteName(null);
    } else {
      setSelectedSuiteId(suite.id);
      setSelectedSuiteName(suite.title || '');
    }
  };

  const handleAIToolSelect = (tool: AITool) => {
    const toolId = tool.id;
    const toolName = tool.title || '';
    
    setSelectedToolIds(prev => {
      // If already selected, remove it
      if (prev.includes(toolId)) {
        // Also remove from names array
        setSelectedToolNames(prevNames => 
          prevNames.filter(name => name !== toolName)
        );
        return prev.filter(id => id !== toolId);
      } 
      // Otherwise add it
      else {
        setSelectedToolNames(prevNames => [...prevNames, toolName]);
        return [...prev, toolId];
      }
    });
  };

  const handleSubmit = () => {
    if (selectedType === 'content' && selectedItem) {
      if (selectedTemplate && selectedTemplateData) {
        // Submit with template info
        onSubmit(selectedType, selectedTemplate, {
          contentId: selectedItem,
          contentName: selectedItemData?.name,
          templateName: selectedTemplateData.name
        });
      } else {
        // Submit without template (for new template creation)
        onSubmit(selectedType, selectedItem, {
          contentName: selectedItemData?.name
        });
      }
    } else if (selectedType === 'ai') {
      // Submit AI at any level of selection (Category, Suite, or Tool)
      if (selectedCategoryId) {
        // If we have at least a category selected
        if (selectedToolIds.length > 0) {
          // When tools are selected, use the first tool ID as the primary ID
          // but include all selected tools in the templateInfo
          onSubmit(selectedType, selectedToolIds[0], {
            categoryId: selectedCategoryId,
            categoryName: selectedCategoryName,
            // Include suite info if selected
            ...(selectedSuiteId && {
              suiteId: selectedSuiteId,
              suiteName: selectedSuiteName,
            }),
            // Include all selected tools
            toolIds: selectedToolIds,
            toolNames: selectedToolNames,
            // For backward compatibility
            toolName: selectedToolNames.join(', ')
          });
        } else {
          // Use suite or category ID if no tools selected
          const submitId = selectedSuiteId || selectedCategoryId;
          onSubmit(selectedType, submitId, {
            categoryId: selectedCategoryId,
            categoryName: selectedCategoryName,
            // Only include suite info if selected
            ...(selectedSuiteId && {
              suiteId: selectedSuiteId,
              suiteName: selectedSuiteName,
            })
          });
        }
      }
    }
  };

  // Reset pagination when selection changes
  useEffect(() => {
    setCategoryPage(1);
  }, [selectedType]);

  useEffect(() => {
    setSuitePage(1);
  }, [selectedCategoryId]);

  useEffect(() => {
    setToolPage(1);
  }, [selectedSuiteId]);

  // Handle outside click to close dropdowns
  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(e.target as Node)) {
        setIsCategoryDropdownOpen(false);
      }
      if (suiteDropdownRef.current && !suiteDropdownRef.current.contains(e.target as Node)) {
        setIsSuiteDropdownOpen(false);
      }
      if (toolDropdownRef.current && !toolDropdownRef.current.contains(e.target as Node)) {
        setIsToolDropdownOpen(false);
      }
    }
    
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Reset search queries when selections change
  useEffect(() => {
    setCategorySearchQuery('');
    setIsCategoryDropdownOpen(false);
  }, [selectedType]);

  useEffect(() => {
    setSuiteSearchQuery('');
    setIsSuiteDropdownOpen(false);
  }, [selectedCategoryId]);

  useEffect(() => {
    setToolSearchQuery('');
    setIsToolDropdownOpen(false);
  }, [selectedSuiteId]);

  // Filter categories based on search query
  const filteredCategories = aiCategories.filter(category => 
    (category.title || '').toLowerCase().includes(categorySearchQuery.toLowerCase())
  );
  
  // Filter suites based on search query
  const filteredSuites = aiSuites.filter(suite => 
    (suite.title || '').toLowerCase().includes(suiteSearchQuery.toLowerCase())
  );
  
  // Filter tools based on search query
  const filteredTools = aiTools.filter(tool => 
    (tool.title || '').toLowerCase().includes(toolSearchQuery.toLowerCase())
  );

  // Pagination component
  const Pagination = ({ 
    currentPage, 
    totalItems, 
    onPageChange 
  }: { 
    currentPage: number; 
    totalItems: number;
    onPageChange: (page: number) => void; 
  }) => {
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
    
    if (totalPages <= 1) return null;
    
    return (
      <div className="flex items-center justify-center mt-2 gap-1">
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className={cn(
            "p-1 rounded",
            currentPage === 1 ? "text-[var(--text-secondary)]/50 cursor-not-allowed" : "text-[var(--text-secondary)] hover:bg-[var(--hover-bg)]"
          )}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        
        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={cn(
              "w-6 h-6 rounded text-sm flex items-center justify-center",
              currentPage === page 
                ? "bg-[var(--accent)]/10 text-[var(--accent)] font-medium" 
                : "text-[var(--text-secondary)] hover:bg-[var(--hover-bg)]"
            )}
          >
            {page}
          </button>
        ))}
        
        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className={cn(
            "p-1 rounded",
            currentPage === totalPages ? "text-[var(--text-secondary)]/50 cursor-not-allowed" : "text-[var(--text-secondary)] hover:bg-[var(--hover-bg)]"
          )}
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    );
  };

  const renderContentSelector = () => (
    <>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search content..."
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
            Start typing to search for content
          </div>
        )}
      </div>

      {/* Template Selection */}
      {selectedItemData && (
        <div className="space-y-2">
          <div className="text-sm font-medium text-[var(--text-secondary)]">Select Template:</div>
          {isLoadingTemplates ? (
            <div className="flex items-center gap-2 text-[var(--text-secondary)] py-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Loading templates...</span>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {selectedItemData.templates && selectedItemData.templates.length > 0 ? (
                selectedItemData.templates.map((template) => (
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
                ))
              ) : (
                <div className="text-sm text-[var(--text-secondary)] py-1">
                  No templates available for this content
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );

  const renderSuitesList = () => {
    // Pagination
    const startIndex = (suitePage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const paginatedSuites = filteredSuites.slice(startIndex, endIndex);
    const hasResults = filteredSuites.length > 0;
    
    return (
      <div ref={suiteDropdownRef} className="relative w-full">
        {/* Selected Suite or Search Input */}
        <div className="relative">
          {selectedSuiteId ? (
            <div 
              onClick={() => setIsSuiteDropdownOpen(!isSuiteDropdownOpen)}
              className="w-full px-4 py-3 bg-[var(--hover-bg)] border border-[var(--border-color)] rounded-lg text-base flex items-center justify-between cursor-pointer"
            >
              <span className="font-medium">
                {aiSuites.find(s => s.id === selectedSuiteId)?.title || 'Selected Suite'}
              </span>
              <div className="flex items-center gap-1">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedSuiteId(null);
                    setSelectedSuiteName(null);
                  }}
                  className="p-1 rounded-full hover:bg-[var(--hover-bg)]/80 text-[var(--text-secondary)]"
                >
                  <X className="w-4 h-4" />
                </button>
                <ArrowDownCircle
                  className={cn(
                    "w-5 h-5 text-[var(--text-secondary)] transition-transform",
                    isSuiteDropdownOpen && "rotate-180"
                  )}
                />
              </div>
            </div>
          ) : (
            <>
              <input
                type="text"
                placeholder="Search suites..."
                value={suiteSearchQuery}
                onChange={(e) => setSuiteSearchQuery(e.target.value)}
                onFocus={() => setIsSuiteDropdownOpen(true)}
                className="w-full px-4 py-3 bg-[var(--hover-bg)] border border-[var(--border-color)] rounded-lg focus:outline-none focus:border-[var(--accent)] transition-colors text-base"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {suiteSearchQuery && (
                  <button 
                    onClick={() => setSuiteSearchQuery('')}
                    className="p-1 rounded-full hover:bg-[var(--hover-bg)]/80 text-[var(--text-secondary)]"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                <ArrowDownCircle
                  className={cn(
                    "w-5 h-5 text-[var(--text-secondary)] transition-transform",
                    isSuiteDropdownOpen && "rotate-180"
                  )}
                />
              </div>
            </>
          )}
        </div>
        
        {/* Dropdown List */}
        {isSuiteDropdownOpen && (
          <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg shadow-lg max-h-[250px] overflow-y-auto">
            {/* Search input inside dropdown */}
            {selectedSuiteId && (
              <div className="p-2 border-b border-[var(--border-color)]">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search suites..."
                    value={suiteSearchQuery}
                    onChange={(e) => setSuiteSearchQuery(e.target.value)}
                    className="w-full px-3 py-2 bg-[var(--hover-bg)] border border-[var(--border-color)] rounded-md focus:outline-none focus:border-[var(--accent)] transition-colors text-sm"
                    autoFocus
                  />
                  {suiteSearchQuery && (
                    <button 
                      onClick={() => setSuiteSearchQuery('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-[var(--hover-bg)]/80 text-[var(--text-secondary)]"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            )}
            
            {isLoadingSuites ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin text-[var(--text-secondary)]" />
              </div>
            ) : !hasResults ? (
              <div className="p-3 text-center text-sm text-[var(--text-secondary)]">
                {suiteSearchQuery ? "No matching suites found" : "No suites available in this category"}
              </div>
            ) : (
              <>
                <div className="divide-y divide-[var(--border-color)]">
                  {paginatedSuites.map((suite) => (
                    <button
                      key={suite.id}
                      onClick={() => {
                        handleAISuiteSelect(suite);
                        setIsSuiteDropdownOpen(false);
                      }}
                      className={cn(
                        "w-full px-4 py-3 text-left transition-colors text-base flex items-center justify-between",
                        selectedSuiteId === suite.id
                          ? "bg-[var(--hover-bg)]"
                          : "hover:bg-[var(--hover-bg)]"
                      )}
                    >
                      <span className="font-medium">{suite.title || 'Unnamed Suite'}</span>
                      {selectedSuiteId === suite.id && (
                        <Check className="w-4 h-4 text-[var(--text-secondary)]" />
                      )}
                    </button>
                  ))}
                </div>
                <Pagination 
                  currentPage={suitePage} 
                  totalItems={filteredSuites.length}
                  onPageChange={setSuitePage}
                />
              </>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderToolsList = () => {
    // Pagination
    const startIndex = (toolPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const paginatedTools = filteredTools.slice(startIndex, endIndex);
    const hasResults = filteredTools.length > 0;
    
    return (
      <div ref={toolDropdownRef} className="relative w-full">
        {/* Selected Tools Display */}
        {selectedToolIds.length > 0 && (
          <div className="space-y-2 mb-2">
            {selectedToolIds.map((toolId, index) => {
              const tool = aiTools.find(t => t.id === toolId);
              return (
                <div 
                  key={toolId}
                  className="flex items-center justify-between px-4 py-2 border border-[var(--border-color)] rounded-lg bg-[var(--hover-bg)] hover:bg-[var(--hover-bg)]/80"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-base">{tool?.title || `Selected Tool ${index + 1}`}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {tool?.credits_cost ? (
                      <div className="text-sm text-[var(--text-secondary)] flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect width="20" height="14" x="2" y="5" rx="2" />
                          <line x1="2" x2="22" y1="10" y2="10" />
                        </svg>
                        {tool.credits_cost} Credits
                      </div>
                    ) : null}
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAIToolSelect(tool!);
                      }}
                      className="text-[var(--text-secondary)] hover:text-[var(--accent)] p-1 rounded-full hover:bg-[var(--hover-bg)]"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        {/* Search Input */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search tools..."
            value={toolSearchQuery}
            onChange={(e) => setToolSearchQuery(e.target.value)}
            onFocus={() => setIsToolDropdownOpen(true)}
            className="w-full px-4 py-3 bg-[var(--hover-bg)] border border-[var(--border-color)] rounded-lg focus:outline-none focus:border-[var(--accent)] transition-colors text-base"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {toolSearchQuery && (
              <button 
                onClick={() => setToolSearchQuery('')}
                className="p-1 rounded-full hover:bg-[var(--hover-bg)]/80 text-[var(--text-secondary)]"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <ArrowDownCircle
              className={cn(
                "w-5 h-5 text-[var(--text-secondary)] transition-transform",
                isToolDropdownOpen && "rotate-180"
              )}
            />
          </div>
        </div>
        
        {/* Dropdown List */}
        {isToolDropdownOpen && (
          <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg shadow-lg max-h-[250px] overflow-y-auto">
            {isLoadingTools ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin text-[var(--text-secondary)]" />
              </div>
            ) : !hasResults ? (
              <div className="p-3 text-center text-sm text-[var(--text-secondary)]">
                {toolSearchQuery ? "No matching tools found" : "No tools available in this suite"}
              </div>
            ) : (
              <>
                <div className="divide-y divide-[var(--border-color)]">
                  {paginatedTools.map((tool) => (
                    <button
                      key={tool.id}
                      onClick={() => handleAIToolSelect(tool)}
                      className={cn(
                        "w-full px-4 py-3 text-left transition-colors text-base",
                        selectedToolIds.includes(tool.id)
                          ? "bg-[var(--hover-bg)]"
                          : "hover:bg-[var(--hover-bg)]"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={cn(
                            "w-4 h-4 rounded-sm border flex items-center justify-center transition-colors",
                            selectedToolIds.includes(tool.id) 
                              ? "bg-[var(--hover-bg)] border-[var(--text-secondary)]" 
                              : "border-[var(--border-color)]"
                          )}>
                            {selectedToolIds.includes(tool.id) && (
                              <Check className="w-3 h-3 text-[var(--text-secondary)]" />
                            )}
                          </div>
                          <span className="font-medium">{tool.title || 'Unnamed Tool'}</span>
                        </div>
                        {tool.credits_cost > 0 && (
                          <div className="text-sm text-[var(--text-secondary)] flex items-center gap-1">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <rect width="20" height="14" x="2" y="5" rx="2" />
                              <line x1="2" x2="22" y1="10" y2="10" />
                            </svg>
                            {tool.credits_cost} Credits
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
                <Pagination 
                  currentPage={toolPage} 
                  totalItems={filteredTools.length}
                  onPageChange={setToolPage}
                />
              </>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderCategoriesList = () => {
    // Pagination
    const startIndex = (categoryPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const paginatedCategories = filteredCategories.slice(startIndex, endIndex);
    const hasResults = filteredCategories.length > 0;
    
    return (
      <div ref={categoryDropdownRef} className="relative w-full">
        {/* Selected Category or Search Input */}
        <div className="relative">
          {selectedCategoryId ? (
            <div 
              onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
              className="w-full px-4 py-3 bg-[var(--hover-bg)] border border-[var(--border-color)] rounded-lg text-base flex items-center justify-between cursor-pointer"
            >
              <span className="font-medium">
                {aiCategories.find(c => c.id === selectedCategoryId)?.title || 'Selected Category'}
              </span>
              <div className="flex items-center gap-1">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedCategoryId(null);
                    setSelectedCategoryName(null);
                  }}
                  className="p-1 rounded-full hover:bg-[var(--hover-bg)]/80 text-[var(--text-secondary)]"
                >
                  <X className="w-4 h-4" />
                </button>
                <ArrowDownCircle
                  className={cn(
                    "w-5 h-5 text-[var(--text-secondary)] transition-transform",
                    isCategoryDropdownOpen && "rotate-180"
                  )}
                />
              </div>
            </div>
          ) : (
            <>
              <input
                type="text"
                placeholder="Search categories..."
                value={categorySearchQuery}
                onChange={(e) => setCategorySearchQuery(e.target.value)}
                onFocus={() => setIsCategoryDropdownOpen(true)}
                className="w-full px-4 py-3 bg-[var(--hover-bg)] border border-[var(--border-color)] rounded-lg focus:outline-none focus:border-[var(--accent)] transition-colors text-base"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {categorySearchQuery && (
                  <button 
                    onClick={() => setCategorySearchQuery('')}
                    className="p-1 rounded-full hover:bg-[var(--hover-bg)]/80 text-[var(--text-secondary)]"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                <ArrowDownCircle
                  className={cn(
                    "w-5 h-5 text-[var(--text-secondary)] transition-transform",
                    isCategoryDropdownOpen && "rotate-180"
                  )}
                />
              </div>
            </>
          )}
        </div>
        
        {/* Dropdown List */}
        {isCategoryDropdownOpen && (
          <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg shadow-lg max-h-[250px] overflow-y-auto">
            {/* Search input inside dropdown */}
            {selectedCategoryId && (
              <div className="p-2 border-b border-[var(--border-color)]">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search categories..."
                    value={categorySearchQuery}
                    onChange={(e) => setCategorySearchQuery(e.target.value)}
                    className="w-full px-3 py-2 bg-[var(--hover-bg)] border border-[var(--border-color)] rounded-md focus:outline-none focus:border-[var(--accent)] transition-colors text-sm"
                    autoFocus
                  />
                  {categorySearchQuery && (
                    <button 
                      onClick={() => setCategorySearchQuery('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-[var(--hover-bg)]/80 text-[var(--text-secondary)]"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            )}
            
            {isLoadingCategories ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin text-[var(--text-secondary)]" />
              </div>
            ) : !hasResults ? (
              <div className="p-3 text-center text-sm text-[var(--text-secondary)]">
                {categorySearchQuery ? "No matching categories found" : "No categories available"}
              </div>
            ) : (
              <>
                <div className="divide-y divide-[var(--border-color)]">
                  {paginatedCategories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => {
                        handleAICategorySelect(category);
                        setIsCategoryDropdownOpen(false);
                      }}
                      className={cn(
                        "w-full px-4 py-3 text-left transition-colors text-base flex items-center justify-between",
                        selectedCategoryId === category.id
                          ? "bg-[var(--hover-bg)]"
                          : "hover:bg-[var(--hover-bg)]"
                      )}
                    >
                      <span className="font-medium">{category.title || 'Unnamed Category'}</span>
                      {selectedCategoryId === category.id && (
                        <Check className="w-4 h-4 text-[var(--text-secondary)]" />
                      )}
                    </button>
                  ))}
                </div>
                <Pagination 
                  currentPage={categoryPage} 
                  totalItems={filteredCategories.length}
                  onPageChange={setCategoryPage}
                />
              </>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderAISelector = () => (
    <div className="space-y-6">
      {/* Category Selection */}
      <div className="space-y-2">
        <div className="text-base font-medium text-[var(--text-secondary)]">Category:</div>
        {isLoadingCategories ? (
          <div className="flex items-center gap-2 text-[var(--text-secondary)] py-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-base">Loading categories...</span>
          </div>
        ) : (
          renderCategoriesList()
        )}
      </div>

      {/* Suite Selection (only shown when a category is selected) */}
      {selectedCategoryId && (
        <div className="space-y-2">
          <div className="text-base font-medium text-[var(--text-secondary)]">Suite:</div>
          {isLoadingSuites ? (
            <div className="flex items-center gap-2 text-[var(--text-secondary)] py-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-base">Loading suites...</span>
            </div>
          ) : (
            renderSuitesList()
          )}
        </div>
      )}

      {/* Tool Selection (only shown when a suite is selected) */}
      {selectedSuiteId && (
        <div className="space-y-2">
          <div className="text-base font-medium text-[var(--text-secondary)]">
            Tools:
            {selectedToolIds.length > 0 && (
              <span className="ml-2 text-sm text-[var(--text-secondary)]">
                {selectedToolIds.length} selected
              </span>
            )}
          </div>
          {isLoadingTools ? (
            <div className="flex items-center gap-2 text-[var(--text-secondary)] py-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-base">Loading tools...</span>
            </div>
          ) : (
            renderToolsList()
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-4 mb-6 p-4 bg-[var(--card-bg)] rounded-lg border border-[var(--border-color)]">
      {/* Access Type Selection - Only show if not editing an existing AI template */}
      {(!initialSelection || initialSelection.type !== 'ai') && (
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
                setSelectedCategoryId(null);
                setSelectedCategoryName(null);
                setSelectedSuiteId(null);
                setSelectedSuiteName(null);
                setSelectedToolIds([]);
                setSelectedToolNames([]);
              }}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm",
                "border transition-all",
                selectedType === id
                  ? "border-[var(--text-secondary)] bg-[var(--hover-bg)] text-[var(--foreground)]"
                  : "border-[var(--border-color)] hover:border-[var(--text-secondary)] text-[var(--text-secondary)]"
              )}
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Content Selection Area */}
      {selectedType && (
        <>
          {selectedType === 'content' ? renderContentSelector() : renderAISelector()}

          {/* Action Buttons */}
          <div className="flex justify-end gap-2">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-base text-[var(--text-secondary)] hover:text-[var(--foreground)] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={
                !selectedType || 
                (selectedType === 'content' && !selectedItem) || 
                (selectedType === 'ai' && !selectedCategoryId)
              }
              className={cn(
                "px-4 py-2 rounded-lg transition-all text-base flex items-center gap-2",
                (selectedType === 'content' && selectedItem) || (selectedType === 'ai' && selectedCategoryId)
                  ? "bg-[var(--hover-bg)] text-[var(--foreground)] border border-[var(--border-color)] hover:bg-[var(--hover-bg)]/80"
                  : "bg-[var(--hover-bg)] text-[var(--text-secondary)] cursor-not-allowed"
              )}
            >
              <span>
                {selectedType === 'content' && selectedTemplate 
                  ? 'Confirm Template' 
                  : selectedType === 'ai' && selectedToolIds.length > 0
                    ? `Confirm ${selectedToolIds.length} AI Tool${selectedToolIds.length !== 1 ? 's' : ''}`
                    : selectedType === 'ai' && selectedSuiteId
                      ? 'Confirm AI Suite'
                      : selectedType === 'ai' && selectedCategoryId
                        ? 'Confirm AI Category'
                        : 'Add Access'
                }
              </span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </>
      )}
    </div>
  );
} 
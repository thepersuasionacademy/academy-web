import React, { useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { toast, Toaster } from 'sonner';
import { Content, Collection, ContentStatus, ExtendedContent, Module, MediaItem, AITool, AIItem } from '@/types/content';
import ContentHeader from './components/ContentHeader';
import ContentInfo from './components/ContentInfo';
import CollectionSelector from './components/CollectionSelector';
import ModuleList from './components/ModuleList';
import MediaList from './components/MediaList';
import ThumbnailUpload from './components/ThumbnailUpload';

type ExtendedModule = ExtendedContent['modules'][0] & {
  content_id: string;
};

type ExtendedMedia = ExtendedModule['media'][0] & {
  module_id: string;
  content_id: string;
};

interface ContentBuilderProps {
  content: ExtendedContent;
  onSave: (content: ExtendedContent) => Promise<void>;
  onClose: () => void;
}

export default function ContentBuilder({
  content: initialContent,
  onSave,
  onClose
}: ContentBuilderProps) {
  const supabase = createClientComponentClient();
  const [content, setContent] = useState<ExtendedContent>({
    ...initialContent,
    modules: initialContent.modules || [],
    collection: initialContent.collection || null,
    stats: initialContent.stats || {
      enrolled_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  });
  const [selectedCollection, setSelectedCollection] = useState<string>(content.collection_id);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [isCreatingCollection, setIsCreatingCollection] = useState(false);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);

  // Fetch initial data on mount and when content changes
  React.useEffect(() => {
    async function fetchInitialData() {
      try {
        // Fetch collections
        const { data: collectionsData, error: collectionsError } = await supabase
          .rpc('get_content_collections');
        
        if (collectionsError) {
          console.error('Error fetching collections:', collectionsError);
          toast.error(`Failed to fetch collections: ${collectionsError.message}`);
        } else if (collectionsData) {
          const sortedCollections = collectionsData.sort((a: Collection, b: Collection) => 
            a.name.toLowerCase().localeCompare(b.name.toLowerCase())
          );
          setCollections(sortedCollections);
        }
      } catch (error) {
        console.error('Error fetching initial data:', error);
      }
    }

    // Only run if we have content
    if (content) {
      console.log('Running initial data fetch');
      fetchInitialData();
    }
  }, [content.id]); // Run when content.id changes, which happens when content is first loaded

  // Fetch AI tool details when content loads
  React.useEffect(() => {
    async function fetchAIToolDetails() {
      console.log('Content modules:', content.modules);
      
      // Log all media items to see what we have
      content.modules.forEach(module => {
        module.media.forEach(media => {
          media.items.forEach(item => {
            console.log('Media item:', {
              type: item.type,
              tool_id: item.type === 'AI' ? (item as AIItem).tool_id : null
            });
          });
        });
      });

      // Get all AI items that have a tool_id
      const aiItems = content.modules.flatMap(module => 
        module.media.flatMap(media => 
          media.items.filter((item): item is AIItem => {
            const isAI = item.type === 'AI';
            const hasToolId = isAI && (item as AIItem).tool_id !== null;
            console.log('Checking item:', { isAI, hasToolId, item });
            return isAI && hasToolId;
          })
        )
      );

      console.log('Found AI items:', aiItems);

      // If no AI items, don't do anything
      if (aiItems.length === 0) {
        console.log('No AI items found with tool_ids');
        return;
      }

      // For each AI item, fetch its tool details
      for (const item of aiItems) {
        console.log('Fetching tool details for:', item.tool_id);
        
        const { data: toolDetail, error } = await supabase
          .rpc('get_tool_with_names', {
            p_tool_id: item.tool_id
          });

        if (error) {
          console.error('Error fetching AI tool details:', error);
          continue;
        }

        console.log('Received tool details:', toolDetail);

        if (toolDetail?.[0]) {
          console.log('Updating content with tool:', toolDetail[0]);
          // Update the content with the tool details
          setContent(prev => ({
            ...prev,
            modules: prev.modules.map(module => ({
              ...module,
              media: module.media.map(media => ({
                ...media,
                items: media.items.map(mediaItem => {
                  if (mediaItem.type === 'AI' && mediaItem.tool_id === item.tool_id) {
                    return {
                      ...mediaItem,
                      tool: toolDetail[0]
                    };
                  }
                  return mediaItem;
                })
              }))
            }))
          }));
        }
      }
    }

    console.log('useEffect triggered with content.id:', content.id);
    fetchAIToolDetails();
  }, [content.id]); // Run when content is first loaded

  const handleCreateCollection = async () => {
    if (!newCollectionName.trim()) {
      alert('Please enter a collection name');
      return;
    }

    try {
      console.log('Creating collection with name:', newCollectionName);

      const { data, error } = await supabase
        .rpc('create_content_collection', {
          p_name: newCollectionName,
          p_description: null
        });

      if (error) {
        console.error('Error creating collection:', error);
        toast.error(error.message || 'Failed to create collection');
        return;
      }

      if (data) {
        setCollections(prev => [...prev, data]);
        setSelectedCollection(data.id);
        setNewCollectionName('');
        setIsCreatingCollection(false);
      }
    } catch (error: any) {
      console.error('Error creating collection:', error);
      toast.error('Failed to create collection');
    }
  };

  function createEmptyMedia(order: number = 0, moduleId: string, contentId: string): ExtendedMedia {
    return {
      id: crypto.randomUUID(),
      title: '',
      description: null,
      order,
      module_id: moduleId,
      content_id: contentId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      items: []
    };
  }

  function createEmptyModule(order: number = 0, contentId: string): ExtendedModule {
    return {
      id: crypto.randomUUID(),
      title: '',
      description: null,
      order,
      content_id: contentId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      media: []
    };
  }

  const handleSubmit = async () => {
    // Validate required fields
    if (!content.title?.trim()) {
      toast.error('Please enter a content title');
      return;
    }

    if (!selectedCollection) {
      toast.error('Please select or create a collection');
      return;
    }

    if (!content.modules.length) {
      toast.error('Please add at least one module');
      return;
    }

    // Prepare the content to save
    const contentToSave = {
      ...content,
      collection_id: selectedCollection
    };
    
    // Use toast.promise with the correct configuration
    await toast.promise(onSave(contentToSave), {
      loading: 'Saving changes...',
      success: 'Changes saved successfully!',
      error: (err) => `Failed to save changes: ${err.message}`,
      id: 'save-content',
      duration: 2000,
    });
  };

  const selectedModule = content.modules.find(m => m.id === selectedModuleId);

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Toaster 
        position="top-center" 
        expand={true} 
        richColors 
        theme="dark"
        closeButton
        className="bg-[var(--card-bg)] text-[var(--foreground)] border border-[var(--border-color)]"
        duration={3000}
      />
      <ContentHeader
        status={content.status}
        onStatusChange={(status) => setContent(prev => ({ ...prev, status }))}
        onSave={handleSubmit}
        title={content.title || 'Untitled Content'}
      />

      <div className="flex h-[calc(100vh-4rem)]">
        {/* Left Panel - 30% */}
        <div className="w-[30%] border-r border-[var(--border-color)] flex flex-col">
          <div className="w-full h-[200px]">
            <ThumbnailUpload
              thumbnailUrl={content.thumbnail_url}
              onThumbnailChange={(url) => setContent(prev => ({ ...prev, thumbnail_url: url }))}
            />
          </div>
          <div className="flex-1 overflow-y-auto">
            <div className="p-4 space-y-4">
              <ContentInfo
                title={content.title}
                description={content.description}
                onTitleChange={(title) => setContent(prev => ({ ...prev, title }))}
                onDescriptionChange={(description) => setContent(prev => ({ ...prev, description }))}
              />

              <CollectionSelector
                selectedCollection={selectedCollection}
                collections={collections}
                newCollectionName={newCollectionName}
                isCreatingCollection={isCreatingCollection}
                onCollectionSelect={setSelectedCollection}
                onNewCollectionNameChange={setNewCollectionName}
                onCreateCollection={handleCreateCollection}
                onCreateModeChange={setIsCreatingCollection}
              />

              <ModuleList
                modules={content.modules as ExtendedModule[]}
                selectedModuleId={selectedModuleId}
                onModuleSelect={setSelectedModuleId}
                onModuleAdd={() => {
                  setContent(prev => ({
                    ...prev,
                    modules: [...prev.modules, createEmptyModule(prev.modules.length, prev.id)]
                  }));
                }}
                onModuleRemove={(moduleId) => {
                  setContent(prev => ({
                    ...prev,
                    modules: prev.modules.filter(module => module.id !== moduleId)
                  }));
                  if (selectedModuleId === moduleId) {
                    setSelectedModuleId(null);
                  }
                }}
                onModulesReorder={(modules) => {
                  setContent(prev => ({ ...prev, modules }));
                }}
                updateModule={(moduleId, updates) => {
                  setContent(prev => ({
                    ...prev,
                    modules: prev.modules.map(module =>
                      module.id === moduleId ? { ...module, ...updates } : module
                    )
                  }));
                }}
              />
            </div>
          </div>
        </div>

        {/* Right Panel - 70% */}
        <div className="flex-1 overflow-y-auto">
          {selectedModule ? (
            <MediaList
              selectedModule={selectedModule as ExtendedModule}
              onMediaAdd={() => {
                setContent(prev => ({
                  ...prev,
                  modules: prev.modules.map(module =>
                    module.id === selectedModule.id
                      ? {
                          ...module,
                          media: [
                            ...module.media,
                            createEmptyMedia(module.media.length, module.id, prev.id)
                          ]
                        }
                      : module
                  )
                }));
              }}
              onMediaUpdate={(mediaIndex, updates) => {
                setContent(prev => ({
                  ...prev,
                  modules: prev.modules.map(module =>
                    module.id === selectedModule.id
                      ? {
                          ...module,
                          media: module.media.map((media, i) =>
                            i === mediaIndex ? { ...media, ...updates } : media
                          )
                        }
                      : module
                  )
                }));
              }}
              onMediaReorder={(media) => {
                setContent(prev => ({
                  ...prev,
                  modules: prev.modules.map(module =>
                    module.id === selectedModule.id
                      ? { ...module, media }
                      : module
                  )
                }));
              }}
            />
          ) : (
            <div className="h-full flex items-center justify-center text-[var(--text-secondary)] text-xl">
              Select a module to edit its content
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 
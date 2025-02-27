import { useRef, useState, useEffect } from 'react';
import { Loader2, X, Plus, Clock, Check } from 'lucide-react';
import { cn } from "@/lib/utils";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { AITool, DripSetting } from './types';
import { DripSettingsInput } from './DripSettingsInput';

interface ToolSelectorProps {
  suiteId: string | null;
  selectedToolIds: Record<string, boolean>;
  onToolSelect: (tool: AITool) => void;
  onToolRemove: (toolId: string) => void;
  toolDripSettings: Record<string, DripSetting>;
  toolDripEnabled: Record<string, boolean>;
  toggleToolDrip: (toolId: string) => void;
  updateToolDripValue: (toolId: string, value: number) => void;
  updateToolDripUnit: (toolId: string, unit: 'days' | 'weeks' | 'months') => void;
  collectionDripEnabled: boolean;
  suiteDripEnabled: boolean;
}

export function ToolSelector({
  suiteId,
  selectedToolIds,
  onToolSelect,
  onToolRemove,
  toolDripSettings,
  toolDripEnabled,
  toggleToolDrip,
  updateToolDripValue,
  updateToolDripUnit,
  collectionDripEnabled,
  suiteDripEnabled
}: ToolSelectorProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [tools, setTools] = useState<AITool[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  
  const supabase = createClientComponentClient<any>();

  // Fetch tools when suite changes
  useEffect(() => {
    if (suiteId) {
      fetchTools(suiteId);
    } else {
      setTools([]);
    }
  }, [suiteId]);

  const fetchTools = async (suiteId: string) => {
    setIsLoading(true);
    try {
      // Use Supabase RPC instead of API route
      const { data, error } = await supabase.rpc('get_tools_by_suite', {
        suite_id: suiteId
      });
      
      if (error) {
        console.error('Error fetching AI tools:', error);
        return;
      }
      
      if (Array.isArray(data)) {
        setTools(data);
      } else {
        console.error('Invalid data format for tools:', data);
      }
    } catch (error) {
      console.error('Error fetching AI tools:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter tools based on search query
  const filteredTools = tools.filter(tool => 
    !selectedToolIds[tool.id] && 
    (tool.title || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Selected tools
  const selectedTools = tools.filter(tool => selectedToolIds[tool.id]);

  return (
    <div className="w-full space-y-4">
      {/* Selected Tools Display */}
      {selectedTools.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-[var(--text-secondary)]">Selected Tools</h3>
          {selectedTools.map(tool => (
            <div 
              key={tool.id}
              className="px-4 py-2 border border-[var(--border-color)] rounded-lg bg-[var(--hover-bg)] hover:bg-[var(--hover-bg)]/80"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-base">{tool.title || 'Unnamed Tool'}</span>
                  <span className="text-xs text-[var(--text-secondary)] px-2 py-1 bg-[var(--hover-bg)]/80 rounded-full">
                    {tool.credits_per_use || 0} credits
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {!collectionDripEnabled && !suiteDripEnabled && toolDripEnabled[tool.id] && (
                    <DripSettingsInput 
                      value={toolDripSettings[tool.id]}
                      onChange={(value) => updateToolDripValue(tool.id, value)}
                      onUnitChange={(unit) => updateToolDripUnit(tool.id, unit)}
                    />
                  )}
                  <button 
                    onClick={() => toggleToolDrip(tool.id)}
                    className={cn(
                      "flex items-center justify-center p-1 rounded-full",
                      toolDripEnabled[tool.id]
                        ? "bg-[var(--accent)]/10 text-[var(--accent)]" 
                        : "bg-[var(--hover-bg)]/50 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                    )}
                    disabled={collectionDripEnabled || suiteDripEnabled}
                  >
                    {toolDripEnabled[tool.id] ? (
                      <Clock className="w-3.5 h-3.5" />
                    ) : (
                      <Plus className="w-3.5 h-3.5" />
                    )}
                  </button>
                  <button 
                    onClick={() => onToolRemove(tool.id)}
                    className="text-[var(--text-secondary)] hover:text-[var(--accent)] p-1 rounded-full hover:bg-[var(--hover-bg)]"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Search Input */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search tools..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-3 bg-[var(--hover-bg)] border border-[var(--border-color)] rounded-lg focus:outline-none focus:border-[var(--accent)] transition-colors text-base"
        />
        {searchQuery && (
          <button 
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-[var(--hover-bg)]/80 text-[var(--text-secondary)]"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      
      {/* Available Tools List */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-[var(--text-secondary)]">Available Tools</h3>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-8 border border-[var(--border-color)] rounded-lg">
            <Loader2 className="w-5 h-5 animate-spin text-[var(--text-secondary)]" />
          </div>
        ) : filteredTools.length === 0 ? (
          <div className="p-6 text-center border border-[var(--border-color)] rounded-lg text-[var(--text-secondary)]">
            {searchQuery ? "No matching tools found" : "No tools available in this suite"}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredTools.map((tool) => (
              <button
                key={tool.id}
                onClick={() => onToolSelect(tool)}
                className="w-full px-4 py-3 border border-[var(--border-color)] rounded-lg text-left hover:bg-[var(--hover-bg)] transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{tool.title || 'Unnamed Tool'}</span>
                    <span className="text-xs text-[var(--text-secondary)] px-2 py-1 bg-[var(--hover-bg)]/80 rounded-full">
                      {tool.credits_per_use || 0} credits
                    </span>
                  </div>
                  <Check className="w-4 h-4 text-transparent hover:text-[var(--text-secondary)]" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 
'use client';

import { useState, useEffect } from 'react';
import type { AITool, AIInput, AIPrompt } from '@/lib/supabase/ai';
import GenerateSection from './GenerateSection';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { ArrowRight, Lock, Unlock, Trash2, Save } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface CreditBalance {
  total: number;
  subscription_credits: number;
  additional_credits: number;
}

interface ToolInterfaceProps {
  tool: AITool | null;
  inputs: AIInput[];
  prompts: AIPrompt[];
  isLoading: boolean;
  isEditMode?: boolean;
}

export default function ToolInterface({ tool, inputs, prompts, isLoading, isEditMode = false }: ToolInterfaceProps) {
  const [credits, setCredits] = useState<CreditBalance>({ total: 0, subscription_credits: 0, additional_credits: 0 });
  const [isLoadingCredits, setIsLoadingCredits] = useState(true);
  const [activeSection, setActiveSection] = useState<'inputs' | 'prompts' | 'credits'>('inputs');
  const [localInputs, setLocalInputs] = useState<AIInput[]>(inputs);
  const [localPrompts, setLocalPrompts] = useState<AIPrompt[]>(prompts);
  const [localTool, setLocalTool] = useState<AITool | null>(tool);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setLocalTool(tool);
  }, [tool]);

  useEffect(() => {
    setLocalInputs(inputs);
  }, [inputs]);

  useEffect(() => {
    setLocalPrompts(prompts);
  }, [prompts]);

  const handleToggleRequired = (inputId: string) => {
    setLocalInputs(current =>
      current.map(input =>
        input.id === inputId
          ? { ...input, is_required: !input.is_required }
          : input
      )
    );
  };

  const handleInputChange = (inputId: string, field: 'input_name' | 'input_description', value: string) => {
    setLocalInputs(current =>
      current.map(input =>
        input.id === inputId
          ? { ...input, [field]: value }
          : input
      )
    );
  };

  const handleAddInput = () => {
    const newInput: AIInput = {
      id: crypto.randomUUID(),
      tool_id: tool?.id || null,
      input_order: localInputs.length + 1,
      input_name: '',
      input_description: '',
      is_required: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    setLocalInputs(current => [...current, newInput]);
  };

  const handleCreditsCostChange = (value: string) => {
    // Convert to number and ensure it's not negative
    const numValue = Math.max(0, Number(value));
    setLocalTool(prev => {
      if (!prev) return null;
      console.log('Updating credits cost to:', numValue);
      return {
        ...prev,
        credits_cost: numValue
      };
    });
  };

  const fetchCredits = async () => {
    try {
      const supabase = createClientComponentClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        const { data, error } = await supabase
          .rpc('get_total_credits', {
            user_id: session.user.id
          });
        
        if (!error && data) {
          setCredits(data);
        }
      }
    } catch (err) {
      console.error('Unexpected error:', err);
    } finally {
      setIsLoadingCredits(false);
    }
  };

  useEffect(() => {
    fetchCredits();
  }, []);

  const handleDeleteInput = (inputId: string) => {
    setLocalInputs(current => current.filter(input => input.id !== inputId));
  };

  const handleDeletePrompt = (promptId: string) => {
    setLocalPrompts(current => current.filter(prompt => prompt.id !== promptId));
  };

  const handlePromptChange = (promptId: string, value: string) => {
    setLocalPrompts(current =>
      current.map(prompt =>
        prompt.id === promptId
          ? { ...prompt, prompt_text: value }
          : prompt
      )
    );
  };

  const handleAddPrompt = () => {
    const newPrompt: AIPrompt = {
      id: crypto.randomUUID(),
      tool_id: tool?.id || null,
      prompt_order: localPrompts.length + 1,
      prompt_text: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    setLocalPrompts(current => [...current, newPrompt]);
  };

  const handleSave = async () => {
    if (!localTool?.id) return;
    setIsSaving(true);
    
    try {
      const supabase = createClientComponentClient();

      // Ensure credits_cost is a valid number and not negative
      const credits_cost = Math.max(0, Number(localTool.credits_cost || 0));
      console.log('Saving credits cost:', credits_cost);

      const saveData = {
        p_credits_cost: credits_cost,
        p_description: localTool.description || '',
        p_inputs: localInputs,
        p_prompts: localPrompts.map((prompt, index) => ({
          ...prompt,
          prompt_order: index + 1
        })),
        p_status: localTool.status || 'draft',
        p_title: localTool.title || '',
        p_tool_id: localTool.id
      };

      console.log('Saving tool with data:', saveData);

      const { data, error } = await supabase.rpc('save_tool_changes', saveData);

      console.log('Response:', { data, error });

      if (error) throw error;

      toast.success('Changes saved successfully', {
        description: 'All updates have been saved to the database.'
      });

    } catch (error) {
      console.error('Error saving changes:', error);
      toast.error('Failed to save changes', {
        description: error instanceof Error ? error.message : 'An unexpected error occurred'
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isEditMode) {
    return (
      <div className="flex justify-center">
        <div className="max-w-3xl w-full px-4 py-18">
          {/* Status Pills */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setLocalTool(prev => prev ? { ...prev, status: 'draft' } : null)}
                className={cn(
                  "px-4 py-1.5 rounded-full text-sm font-medium transition-colors",
                  localTool?.status === 'draft'
                    ? "bg-[var(--accent)] text-white"
                    : "text-[var(--text-secondary)] border border-[var(--border-color)] hover:border-[var(--accent)]"
                )}
              >
                Draft
              </button>
              <button
                onClick={() => setLocalTool(prev => prev ? { ...prev, status: 'published' } : null)}
                className={cn(
                  "px-4 py-1.5 rounded-full text-sm font-medium transition-colors",
                  localTool?.status === 'published'
                    ? "bg-[var(--accent)] text-white"
                    : "text-[var(--text-secondary)] border border-[var(--border-color)] hover:border-[var(--accent)]"
                )}
              >
                Published
              </button>
            </div>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className={cn(
                "flex items-center gap-2 px-4 py-1.5 rounded-lg font-medium transition-colors",
                "bg-[var(--accent)] text-white hover:opacity-90",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>

          {/* Collection/Suite Breadcrumb */}
          <div className="flex flex-col mb-8">
            <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)] mb-2">
              <span>{tool?.collection_title === null ? '' : tool?.collection_title || ''}</span>
              <ArrowRight className="w-4 h-4" />
              <span>{tool?.suite_title === null ? '' : tool?.suite_title || ''}</span>
            </div>
            <div className="h-px bg-[var(--border-color)] w-full" />
          </div>

          {/* Title and Description */}
          <div className="mb-8">
            <input
              type="text"
              value={localTool?.title || ''}
              onChange={(e) => setLocalTool(prev => prev ? { ...prev, title: e.target.value } : null)}
              className="text-4xl text-[var(--foreground)] mb-3 w-full bg-transparent border-none focus:outline-none focus:ring-0"
              placeholder="Enter tool title"
            />
            <textarea
              value={localTool?.description || ''}
              onChange={(e) => setLocalTool(prev => prev ? { ...prev, description: e.target.value } : null)}
              className="text-lg text-[var(--text-secondary)] leading-relaxed w-full bg-transparent border-none focus:outline-none focus:ring-0 resize-none"
              placeholder="Enter tool description"
              rows={2}
            />
          </div>

          {/* Section Selector */}
          <div className="flex items-center justify-between mb-8 border-b border-[var(--border-color)]">
            <div className="flex gap-8">
              <button
                onClick={() => setActiveSection('inputs')}
                className={cn(
                  "pb-3 text-xl font-medium transition-colors relative",
                  activeSection === 'inputs'
                    ? "text-[var(--foreground)]"
                    : "text-[var(--text-secondary)] hover:text-[var(--foreground)]",
                  activeSection === 'inputs' && "after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[var(--accent)]"
                )}
              >
                Inputs
              </button>
              <button
                onClick={() => setActiveSection('prompts')}
                className={cn(
                  "pb-3 text-xl font-medium transition-colors relative",
                  activeSection === 'prompts'
                    ? "text-[var(--foreground)]"
                    : "text-[var(--text-secondary)] hover:text-[var(--foreground)]",
                  activeSection === 'prompts' && "after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[var(--accent)]"
                )}
              >
                Prompts
              </button>
            </div>
            <div className="flex items-center gap-2 pb-3">
              <span className="text-xl font-medium text-[var(--text-secondary)]">Credits:</span>
              <input
                type="number"
                value={localTool?.credits_cost ?? 0}
                onChange={(e) => handleCreditsCostChange(e.target.value)}
                onBlur={(e) => {
                  // Ensure the display value matches the state on blur
                  const value = Math.max(0, Number(e.target.value) || 0);
                  handleCreditsCostChange(value.toString());
                }}
                min={0}
                className="w-16 text-xl font-medium text-[var(--foreground)] bg-transparent border-none focus:outline-none focus:ring-0 text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
          </div>

          {/* Active Section Content */}
          {activeSection === 'inputs' && (
            <div className="space-y-12">
              {localInputs.map((input, index) => (
                <div key={input.id} className="flex items-stretch gap-8 relative">
                  {/* Number */}
                  <div className="flex items-center justify-center w-12">
                    <span className="text-4xl font-light text-[var(--text-secondary)]">{index + 1}</span>
                  </div>
                  
                  {/* Vertical Divider */}
                  <div className="absolute left-12 top-0 bottom-0 w-px bg-[var(--border-color)]" />

                  {/* Input Content */}
                  <div className="flex-1 pl-8">
                    <div className="flex items-center gap-2 mb-3">
                      <input
                        type="text"
                        value={input.input_name || ''}
                        onChange={(e) => handleInputChange(input.id, 'input_name', e.target.value)}
                        className="text-2xl text-[var(--foreground)] bg-transparent border-none focus:outline-none focus:ring-0 w-full"
                        placeholder="Enter input name"
                      />
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleRequired(input.id)}
                          className={cn(
                            "p-1.5 rounded-lg transition-colors",
                            input.is_required
                              ? "text-[var(--accent)]"
                              : "text-[var(--text-secondary)] hover:text-[var(--foreground)]"
                          )}
                        >
                          {input.is_required ? <Lock className="w-5 h-5" /> : <Unlock className="w-5 h-5" />}
                        </button>
                        <button
                          onClick={() => handleDeleteInput(input.id)}
                          className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                    <textarea
                      value={input.input_description || ''}
                      onChange={(e) => handleInputChange(input.id, 'input_description', e.target.value)}
                      className="text-base text-[var(--text-secondary)] mb-4 w-full bg-transparent border-b border-[var(--border-color)] focus:border-[var(--accent)] focus:outline-none focus:ring-0 resize-none py-2"
                      placeholder="Enter input description"
                      rows={2}
                    />
                  </div>
                </div>
              ))}
              <button
                onClick={handleAddInput}
                className="ml-20 text-[var(--text-secondary)] hover:text-[var(--foreground)] transition-colors"
              >
                + Add Input
              </button>
            </div>
          )}

          {activeSection === 'prompts' && (
            <div className="space-y-12">
              {localPrompts.map((prompt, index) => (
                <div key={prompt.id}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-2xl text-[var(--foreground)]">Prompt {index + 1}</span>
                    <div className="flex-1" />
                    <button
                      onClick={() => handleDeletePrompt(prompt.id)}
                      className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                  <textarea
                    value={prompt.prompt_text || ''}
                    onChange={(e) => handlePromptChange(prompt.id, e.target.value)}
                    className="text-base text-[var(--text-secondary)] mb-4 w-full bg-transparent border-b border-[var(--border-color)] focus:border-[var(--accent)] focus:outline-none focus:ring-0 resize-none py-4 min-h-[300px]"
                    placeholder="Enter prompt template"
                  />
                </div>
              ))}
              <button
                onClick={handleAddPrompt}
                className="text-[var(--text-secondary)] hover:text-[var(--foreground)] transition-colors"
              >
                + Add Prompt
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <GenerateSection 
      tool={localTool} 
      inputs={localInputs} 
      prompts={localPrompts} 
      isLoading={isLoading} 
      credits={credits}
      isLoadingCredits={isLoadingCredits}
      onCreditsUpdated={fetchCredits}
    />
  );
}
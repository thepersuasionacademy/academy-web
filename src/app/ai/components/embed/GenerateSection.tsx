'use client';

import { useState, useEffect } from 'react';
import type { AITool, AIInput, AIPrompt } from '@/lib/supabase/ai';
import { ToolHeader } from './output/ToolHeader';
import { InputFields } from './output/InputFields';
import { useTheme } from '@/app/context/ThemeContext';
import { ArrowRight, ArrowLeft, RotateCcw, Copy } from 'lucide-react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { markdownComponents } from './output/MarkdownStyles';
import GridLoader from './GridLoader';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface CreditBalance {
  total: number;
  subscription_credits: number;
  additional_credits: number;
}

interface ToolRun {
  user_id?: string | null;
  collection_name?: string | null;  // Matches database column
  suite_name?: string | null;       // Matches database column
  tool_name?: string | null;
  credits_before: number;
  credits_cost: number;
  credits_after: number;
  ai_response?: string | null;
}

interface GenerateSectionProps {
  tool: AITool | null;
  inputs: AIInput[];
  prompts: AIPrompt[];
  isLoading: boolean;
  credits: CreditBalance;
  isLoadingCredits: boolean;
  onCreditsUpdated?: () => void;  // Add callback prop
}

const MAX_RETRIES = 2;
const TIMEOUT_MS = 58000; // 58 seconds (slightly less than Vercel's 60s to account for network latency)

export default function GenerateSection({ tool, inputs, prompts, isLoading, credits, isLoadingCredits, onCreditsUpdated }: GenerateSectionProps) {
  const [inputValues, setInputValues] = useState<Record<string, string>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [output, setOutput] = useState<string | null>(null);
  const [displayedOutput, setDisplayedOutput] = useState<string>('');
  const [fullResponse, setFullResponse] = useState<string>('');
  const [retryCount, setRetryCount] = useState(0);
  const { theme } = useTheme();

  const hasEnoughCredits = tool && credits.total >= tool.credits_cost;

  useEffect(() => {
    if (fullResponse && isGenerating) {
      let currentIndex = 0;
      const interval = setInterval(() => {
        if (currentIndex <= fullResponse.length) {
          setDisplayedOutput(fullResponse.slice(0, currentIndex));
          currentIndex++;
        } else {
          clearInterval(interval);
          setIsGenerating(false);
        }
      }, 1);

      return () => clearInterval(interval);
    }
  }, [fullResponse, isGenerating]);

  useEffect(() => {
    // Debug log when tool is loaded
    if (tool) {
      console.log('Tool data loaded:', {
        id: tool.id,
        title: tool.title,
        collection_title: tool.collection_title,
        suite_title: tool.suite_title
      });
    }
  }, [tool]);

  const handleInputChange = (field: string, value: string) => {
    setInputValues(prev => ({ ...prev, [field]: value }));
  };

  const handleKeyPress = async (e: React.KeyboardEvent<HTMLInputElement>, field: string, index: number) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      
      // Check if there are more inputs after this one
      if (index < inputs.length - 1) {
        // Focus the next input
        const nextInput = document.querySelector(`input[name="input-${index + 1}"]`) as HTMLInputElement;
        if (nextInput) {
          nextInput.focus();
        }
      } else {
        // If all inputs have values, focus the generate button
        const allInputsFilled = inputs.every(input => 
          !input.is_required || inputValues[input.input_name || '']
        );
        
        if (allInputsFilled) {
          const generateButton = document.querySelector('button[data-generate-button]') as HTMLButtonElement;
          if (generateButton) {
            generateButton.focus();
          }
        }
      }
    }
  };

  const logToolRun = async (toolRun: ToolRun) => {
    try {
      const supabase = createClientComponentClient();
      
      // Get the current user's session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        console.error('No authenticated user found');
        return;
      }

      // Debug log before insert
      console.log('Tool run data:', {
        collection_name: toolRun.collection_name,
        suite_name: toolRun.suite_name,
        tool_name: toolRun.tool_name
      });

      const insertData = {
        user_id: session.user.id,
        collection_name: toolRun.collection_name,
        suite_name: toolRun.suite_name,
        tool_name: toolRun.tool_name,
        credits_before: toolRun.credits_before,
        credits_cost: toolRun.credits_cost,
        credits_after: toolRun.credits_after,
        ai_response: toolRun.ai_response
      };

      // Debug log the actual data being inserted
      console.log('Final insert data:', insertData);

      // Use RPC function to insert through public schema
      const { data: toolRunData, error: toolRunError } = await supabase
        .rpc('log_tool_run', insertData);

      if (toolRunError) {
        console.error('Error logging tool run:', toolRunError);
        return;
      }

      console.log('Successfully inserted tool run:', toolRunData);

      // Deduct credits from user balance
      const { data: balanceData, error: balanceError } = await supabase
        .rpc('deduct_user_credits', {
          p_user_id: session.user.id,
          p_credits_cost: toolRun.credits_cost
        });

      if (balanceError) {
        console.error('Error deducting credits:', balanceError);
      } else {
        console.log('Successfully deducted credits:', balanceData);
        // Trigger credits refresh after successful deduction
        onCreditsUpdated?.();
      }
    } catch (err) {
      console.error('Unexpected error logging tool run:', err);
    }
  };

  const handleGenerate = async () => {
    if (!tool || isGenerating) return;

    setIsGenerating(true);
    setOutput('');
    setDisplayedOutput('');
    setFullResponse('');
    
    try {
      // Validate required inputs
      const missingInputs = inputs
        .filter(input => input.is_required && !inputValues[input.input_name || ''])
        .map(input => input.input_name || '');

      if (missingInputs.length > 0) {
        throw new Error(`Missing required inputs: ${missingInputs.join(', ')}`);
      }

      // Store initial credit amount for logging
      const creditsBefore = credits.total;

      // Prepare the prompts with input values
      const preparedPrompts = prompts.map(prompt => ({
        ...prompt,
        content: replaceInputPlaceholders(prompt.input_description || '', inputValues)
      }));

      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

      try {
        const response = await fetch('/api/ai/generate', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            toolId: tool.id,
            inputs: inputValues,
            prompts: preparedPrompts
          }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          
          // Handle timeout specifically
          if (response.status === 504 || (errorData?.error && errorData.error.includes('timeout'))) {
            if (retryCount < MAX_RETRIES) {
              setRetryCount(prev => prev + 1);
              throw new Error('RETRY_NEEDED');
            } else {
              throw new Error('The request timed out. The AI model is taking longer than expected to respond. Please try again with a simpler prompt or try again later.');
            }
          }

          throw new Error(
            errorData?.error?.message || errorData?.error || 
            `Failed to generate response: ${response.status} ${response.statusText}`
          );
        }

        const data = await response.json();
        if (!data || !data.output) {
          throw new Error('Invalid response format from server');
        }

        setFullResponse(data.output);
        setOutput(data.output);
        setRetryCount(0); // Reset retry count on success

        // Log the tool run after successful response
        console.log('Tool data before logging:', {
          collection_title: tool.collection_title,
          suite_title: tool.suite_title,
          title: tool.title
        });

        await logToolRun({
          collection_name: tool.collection_title || null,
          suite_name: tool.suite_title || null,
          tool_name: tool.title || null,
          credits_before: creditsBefore,
          credits_cost: tool.credits_cost,
          credits_after: creditsBefore - tool.credits_cost,
          ai_response: data.output
        });

      } catch (fetchError: unknown) {
        if (fetchError instanceof Error && fetchError.message === 'RETRY_NEEDED') {
          // Retry the request
          console.log(`Retrying request (${retryCount + 1}/${MAX_RETRIES})...`);
          await handleGenerate();
          return;
        }
        throw fetchError;
      }

    } catch (error: unknown) {
      console.error('Generation error:', error);
      let errorMessage: string;

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorMessage = 'The request was cancelled due to timeout. Please try again.';
        } else {
          errorMessage = error.message;
        }
      } else if (typeof error === 'object' && error !== null && 'message' in error) {
        errorMessage = String(error.message);
      } else {
        errorMessage = 'An unexpected error occurred during generation';
      }
      
      setFullResponse(`Error: ${errorMessage}`);
      setOutput(`Error: ${errorMessage}`);

      // Log the failed tool run
      await logToolRun({
        collection_name: tool.collection_title || null,
        suite_name: tool.suite_title || null,
        tool_name: tool.title || null,
        credits_before: credits.total,
        credits_cost: tool.credits_cost,
        credits_after: credits.total - tool.credits_cost,
        ai_response: `Error: ${errorMessage}`
      });

      setIsGenerating(false);
      setRetryCount(0); // Reset retry count on final error
    }
  };

  const replaceInputPlaceholders = (template: string, values: Record<string, string>): string => {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => values[key] || match);
  };

  if (!tool || isLoading || isLoadingCredits) {
    return (
      <div className="flex justify-center">
        <div className="max-w-3xl w-full px-4 py-18">
          <div className="animate-pulse space-y-8">
            <div>
              <div className="h-10 w-48 bg-[var(--hover-bg)] rounded mb-3"></div>
              <div className="h-6 w-96 bg-[var(--hover-bg)] rounded"></div>
            </div>
            <div className="space-y-6">
              <div className="h-24 bg-[var(--hover-bg)] rounded-lg"></div>
              <div className="h-24 bg-[var(--hover-bg)] rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isGenerating && !output) {
    return (
      <div className="flex justify-center">
        <div className="flex flex-col items-center justify-center min-h-screen w-full">
          <GridLoader />
        </div>
      </div>
    );
  }

  if (output) {
    return (
      <div className="flex justify-center">
        <div className="max-w-3xl w-full px-4 pb-16 relative">
          <div className="mb-8">
            <div className="flex flex-col">
              <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)] mb-2">
                <span>{tool.collection_title === null ? '' : tool.collection_title || ''}</span>
                <ArrowRight className="w-4 h-4" />
                <span>{tool.suite_title === null ? '' : tool.suite_title || ''}</span>
              </div>
              <div className="h-px bg-[var(--border-color)] w-full mb-4" />
            </div>
            <h2 className="text-4xl text-[var(--foreground)] mb-3">
              {tool.title}
            </h2>
          </div>

          <div className="bg-[var(--card-bg)] rounded-xl border border-[var(--border-color)] pt-2 px-6 pb-6 mb-12">
            <div className={`prose max-w-none ${theme === 'dark' ? 'prose-invert' : 'prose-gray'}`}>
              <Markdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                {isGenerating ? displayedOutput : output}
              </Markdown>
            </div>
          </div>

          <div className="fixed bottom-0 left-0 right-0 border-t border-[var(--border-color)] bg-[var(--card-bg)]">
            <div className="flex justify-center gap-4 max-w-3xl mx-auto px-4 py-3">
              <button
                onClick={() => {
                  setOutput(null);
                  setIsGenerating(false);
                }}
                className="text-lg font-semibold rounded-xl transition-all duration-300 w-[280px] py-5
                  bg-[var(--card-bg)] text-[var(--foreground)] border border-[var(--border-color)]
                  hover:border-[var(--accent)]
                  hover:shadow-[0_0_10px_rgba(var(--accent),0.1)]
                  group relative overflow-hidden"
                disabled={isGenerating}
              >
                <div className="absolute inset-0 bg-[var(--accent)] opacity-0 group-hover:opacity-5 transition-opacity duration-300" />
                <div className="flex items-center justify-center gap-2">
                  <ArrowLeft className="w-5 h-5" />
                  Go Back
                </div>
              </button>

              <button
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(output);
                    const button = document.getElementById('copyButton');
                    if (button) {
                      const textSpan = button.querySelector('span');
                      if (textSpan) textSpan.textContent = 'Copied!';
                      setTimeout(() => {
                        if (textSpan) textSpan.textContent = 'Copy';
                      }, 2000);
                    }
                  } catch (err) {
                    console.error('Failed to copy:', err);
                    alert('Failed to copy to clipboard');
                  }
                }}
                id="copyButton"
                className="text-lg font-semibold rounded-xl transition-all duration-300 w-[280px] py-5
                  bg-[var(--card-bg)] text-[var(--foreground)] border border-[var(--border-color)]
                  hover:border-[var(--accent)]
                  hover:shadow-[0_0_10px_rgba(var(--accent),0.1)]
                  group relative overflow-hidden"
                disabled={isGenerating}
              >
                <div className="absolute inset-0 bg-[var(--accent)] opacity-0 group-hover:opacity-5 transition-opacity duration-300" />
                <div className="flex items-center justify-center gap-2">
                  <Copy className="w-5 h-5" />
                  <span>Copy</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center">
      <div className="max-w-3xl w-full px-4 py-18">
        {!hasEnoughCredits && (
          <div className="mb-8 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-700 dark:text-red-400">
              You don&apos;t have enough credits to use this tool. This tool requires {tool.credits_cost} credits, but you only have {credits.total} credits available.
            </p>
          </div>
        )}

        <div className="flex flex-col">
          <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)] mb-2">
            <span>{tool.collection_title === null ? '' : tool.collection_title || ''}</span>
            <ArrowRight className="w-4 h-4" />
            <span>{tool.suite_title === null ? '' : tool.suite_title || ''}</span>
          </div>
          <div className="h-px bg-[var(--border-color)] w-full mb-4" />
        </div>

        <ToolHeader tool={tool} isLoading={isLoading} />
        
        <div className="space-y-12 mb-16">
          {inputs.map((input, index) => (
            <div key={input.id}>
              <label className="block text-[var(--foreground)] text-2xl font-semibold mb-3 flex items-center gap-2">
                <ArrowRight className="h-6 w-6 text-[var(--text-secondary)]" />
                {input.input_name}
              </label>
              <div className="text-base text-[var(--text-secondary)] mb-4 ml-8">
                {input.input_description}
              </div>
              <input 
                type="text"
                name={`input-${index}`}
                className="w-full bg-transparent text-xl py-4 px-2 
                  border-b border-[var(--border-color)] focus:border-[var(--accent)]
                  text-[var(--foreground)]
                  focus:outline-none transition-colors duration-200"
                value={inputValues[input.input_name || ''] || ''}
                onChange={(e) => handleInputChange(input.input_name || '', e.target.value)}
                onKeyPress={(e) => handleKeyPress(e, input.input_name || '', index)}
                autoFocus={index === 0}
                disabled={isGenerating}
              />
            </div>
          ))}
        </div>

        <div className="flex flex-col items-center w-full mb-20">
          <button
            onClick={handleGenerate}
            disabled={isGenerating || Object.keys(inputValues).length === 0 || !hasEnoughCredits}
            data-generate-button
            className={`text-xl font-bold rounded-xl transition-all duration-200 w-full py-6
              ${(!isGenerating && Object.keys(inputValues).length > 0 && hasEnoughCredits)
                ? 'bg-[var(--accent)] text-white hover:bg-[var(--accent)]/90'
                : theme === 'dark'
                  ? 'bg-gray-800 text-gray-500'
                  : 'bg-gray-200 text-gray-400'}`}
          >
            {isGenerating 
              ? 'Generating...' 
              : !hasEnoughCredits
                ? `Insufficient Credits (${credits.total}/${tool.credits_cost})`
                : `Generate for ${tool.credits_cost} Credits`}
          </button>
        </div>
      </div>
    </div>
  );
}
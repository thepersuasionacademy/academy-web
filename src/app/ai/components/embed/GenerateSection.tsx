// GenerateSection.tsx
'use client';

import React, { useState } from 'react';
import type { Tool } from '@/app/ai/lib/tools';
import GridLoader from './GridLoader';
import Markdown from 'react-markdown';

interface GenerateSectionProps {
  tool: Tool | null;
  isLoading: boolean;
}

export default function GenerateSection({ tool, isLoading }: GenerateSectionProps) {
  const [inputs, setInputs] = useState<Record<string, string>>({ field1: '' });
  const [isGenerating, setIsGenerating] = useState(false);
  const [response, setResponse] = useState('');
  const [credits, setCredits] = useState(1000);

  const handleKeyPress = async (e: React.KeyboardEvent<HTMLInputElement>, currentField: string) => {
    if (e.key === 'Enter') {
      if (currentField === 'field1' && tool?.inputField2) {
        const nextInput = document.querySelector<HTMLInputElement>(`[name="field2"]`);
        nextInput?.focus();
      } else if (currentField === 'field2' && tool?.inputField3) {
        const nextInput = document.querySelector<HTMLInputElement>(`[name="field3"]`);
        nextInput?.focus();
      } else if (inputs.field1.trim()) {
        await handleGenerate();
      }
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setInputs(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleGenerate = async () => {
    if (!tool || isGenerating || !inputs.field1.trim()) return;
    
    if (credits < tool.creditCost) {
      alert('Not enough credits!');
      return;
    }
    
    setCredits(prev => prev - tool.creditCost);
    await generateResponse();
  };

  const generateResponse = async () => {
    if (!tool) return;
    setIsGenerating(true);
    setResponse('');
    
    try {
      const requestPayload = {
        promptTemplate: tool.promptTemplate,
        inputs
      };
      console.log('Sending request payload:', JSON.stringify(requestPayload, null, 2));

      const resp = await fetch('/api/ai/models/claude', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestPayload)
      });

      console.log('Response status:', resp.status);
      const rawText = await resp.text();
      console.log('Raw response:', rawText);

      let data;
      try {
        data = JSON.parse(rawText);
      } catch (e) {
        throw new Error(`Failed to parse response as JSON: ${rawText}`);
      }

      if (!resp.ok) {
        throw new Error(data.error || 'Failed to generate response');
      }
      
      const fullResponse = data.content;
      
      for (let i = 0; i < fullResponse.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 5));
        setResponse(prev => prev + fullResponse[i]);
      }
    } catch (error) {
      console.error('Full error details:', {
        error,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        errorStack: error instanceof Error ? error.stack : undefined
      });
      let errorMessage = 'Sorry, there was an error generating the response.';
      if (error instanceof Error) {
        errorMessage += ` Error: ${error.message}`;
      }
      setResponse(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  if (!response) {
    if (isGenerating) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] w-full">
          <div className="scale-[2.5] mb-8">
            <GridLoader />
          </div>
        </div>
      );
    }

    return (
      <div className="max-w-3xl w-full px-4 py-16">
        <div className="mb-8">
          {isLoading ? (
            <>
              <div className="h-10 w-48 bg-gray-700 animate-pulse rounded mb-3"></div>
              <div className="h-6 w-96 bg-gray-700 animate-pulse rounded"></div>
            </>
          ) : (
            <>
              <h2 className="text-4xl text-[#e6e9f0] mb-3">
                {tool?.name || 'Loading...'}
              </h2>
              <p className="text-lg text-gray-400 leading-relaxed">
                {tool?.description || 'Loading description...'}
              </p>
            </>
          )}
          <p className="text-sm text-gray-500 mt-4">
            Press Enter ↵ to continue
          </p>
        </div>

        <div className="space-y-8 mb-16">
          {/* Field 1 - Always required */}
          <div>
            <input 
              type="text"
              name="field1"
              className="w-full bg-transparent text-2xl py-4 px-2 
                border-b border-gray-700 focus:border-gray-500
                text-[#e6e9f0] placeholder-gray-600
                focus:outline-none transition-colors duration-200"
              placeholder={tool?.inputField1Description || 'Loading...'}
              value={inputs.field1}
              onChange={(e) => handleInputChange('field1', e.target.value)}
              onKeyPress={(e) => handleKeyPress(e, 'field1')}
              autoFocus
              disabled={isLoading}
            />
          </div>

          {/* Field 2 - Optional */}
          {(isLoading || tool?.inputField2) && (
            <div>
              <input 
                type="text"
                name="field2"
                className="w-full bg-transparent text-2xl py-4 px-2 
                  border-b border-gray-700 focus:border-gray-500
                  text-[#e6e9f0] placeholder-gray-600
                  focus:outline-none transition-colors duration-200"
                placeholder={tool?.inputField2Description || 'Loading...'}
                value={inputs.field2 || ''}
                onChange={(e) => handleInputChange('field2', e.target.value)}
                onKeyPress={(e) => handleKeyPress(e, 'field2')}
                disabled={isLoading}
              />
            </div>
          )}

          {/* Field 3 - Optional */}
          {(isLoading || tool?.inputField3) && (
            <div>
              <input 
                type="text"
                name="field3"
                className="w-full bg-transparent text-2xl py-4 px-2 
                  border-b border-gray-700 focus:border-gray-500
                  text-[#e6e9f0] placeholder-gray-600
                  focus:outline-none transition-colors duration-200"
                placeholder={tool?.inputField3Description || 'Loading...'}
                value={inputs.field3 || ''}
                onChange={(e) => handleInputChange('field3', e.target.value)}
                onKeyPress={(e) => handleKeyPress(e, 'field3')}
                disabled={isLoading}
              />
            </div>
          )}
        </div>

        <div className="flex flex-col items-center gap-4">
          <button
            onClick={handleGenerate}
            disabled={!tool || isLoading || !inputs.field1.trim() || isGenerating || credits < (tool?.creditCost || 0)}
            className={`text-xl font-bold rounded-xl transition-all duration-200 w-[340px] py-5
              ${(!isLoading && inputs.field1.trim() && credits >= (tool?.creditCost || 0))
                ? 'bg-white text-black hover:bg-gray-100'
                : 'bg-gray-800 text-gray-500'}`}
          >
            {isLoading ? 'Loading...' : `Generate for ${tool?.creditCost || '...'} Credits`}
          </button>

          <div className="text-gray-400">
            {credits} Credits Remaining
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl w-full px-4 py-16">
      <div className="prose prose-invert max-w-none">
        <div className="text-[#e6e9f0] text-xl mb-16">
          <Markdown
            children={response}
            components={{
              h1: ({children}) => <h1 className="text-4xl font-bold mb-4 mt-8">{children}</h1>,
              h2: ({children}) => <h2 className="text-3xl font-bold mb-3 mt-6">{children}</h2>,
              h3: ({children}) => <h3 className="text-2xl font-bold mb-3 mt-6">{children}</h3>,
              p: ({children}) => <p className="mb-4 leading-relaxed">{children}</p>,
              ul: ({children}) => <ul className="list-disc list-inside mb-4 space-y-2">{children}</ul>,
              ol: ({children}) => <ol className="list-decimal list-inside mb-4 space-y-2">{children}</ol>,
              li: ({children}) => <li className="ml-4">{children}</li>,
              strong: ({children}) => <strong className="font-bold">{children}</strong>,
              em: ({children}) => <em className="italic">{children}</em>,
              code: ({children, className}) => 
                className ? (
                  <code className="block bg-gray-800 p-4 rounded-lg text-sm overflow-x-auto">{children}</code>
                ) : (
                  <code className="bg-gray-800 px-1.5 py-0.5 rounded text-sm">{children}</code>
                ),
              blockquote: ({children}) => <blockquote className="border-l-4 border-gray-700 pl-4 italic">{children}</blockquote>,
              a: ({children, href}) => <a href={href} className="text-blue-400 hover:text-blue-300 underline">{children}</a>,
            }}
          />
        </div>
        
        <div className="flex justify-center gap-4">
          <button
            onClick={() => {
              if (!tool || credits < tool.creditCost) {
                alert('Not enough credits!');
                return;
              }
              setCredits(prev => prev - tool.creditCost);
              setResponse('');
              const resetInputs: Record<string, string> = { field1: '' };
              if (tool.inputField2) resetInputs.field2 = '';
              if (tool.inputField3) resetInputs.field3 = '';
              setInputs(resetInputs);
            }}
            disabled={isGenerating || isLoading}
            className={`text-xl font-bold rounded-xl transition-all duration-200 w-[240px] py-5
              ${!isGenerating && !isLoading
                ? 'bg-white text-black hover:bg-gray-100'
                : 'bg-gray-800 text-gray-500 cursor-not-allowed'}`}
          >
            Regenerate
          </button>

          <button
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(response);
                const button = document.getElementById('copyButton');
                if (button) {
                  button.textContent = 'Copied!';
                  setTimeout(() => {
                    if (button) button.textContent = 'Copy';
                  }, 2000);
                }
              } catch (err) {
                console.error('Failed to copy:', err);
                alert('Failed to copy to clipboard');
              }
            }}
            id="copyButton"
            className="text-xl font-bold rounded-xl transition-all duration-200 w-[240px] py-5 
              border-2 border-white text-white hover:bg-white/10"
          >
            Copy
          </button>
        </div>
      </div>
    </div>
  );
}
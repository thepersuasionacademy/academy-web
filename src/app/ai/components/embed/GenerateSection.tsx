'use client';

import React, { useState } from 'react';
import type { Tool } from '@/app/api/ai/types/tools';
import { InputFields } from './output/InputFields';
import { ResponseDisplay } from './output/ResponseDisplay';
import { ToolHeader } from './output/ToolHeader';
import { LoadingState } from './output/LoadingState';
import GridLoader from './GridLoader';
import { useTheme } from '@/app/context/ThemeContext';

interface GenerateSectionProps {
  tool: Tool | null;
  isLoading: boolean;
}

export default function GenerateSection({ tool, isLoading }: GenerateSectionProps) {
  const [inputs, setInputs] = useState<Record<string, string>>({ field1: '' });
  const [isGenerating, setIsGenerating] = useState(false);
  const [response, setResponse] = useState('');
  const [credits, setCredits] = useState(1000);
  const { theme } = useTheme();

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

      const resp = await fetch('/api/ai/models/claude', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestPayload)
      });

      let data;
      try {
        const rawText = await resp.text();
        data = JSON.parse(rawText);
      } catch (e) {
        throw new Error(`Failed to parse response as JSON: ${e}`);
      }

      if (!resp.ok) {
        throw new Error(data.error || 'Failed to generate response');
      }
      
      const content = data.content;
      
      for (let i = 0; i < content.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 5));
        setResponse(prev => prev + content[i]);
      }
    } catch (error) {
      console.error('Error generating response:', error);
      setResponse(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegenerate = () => {
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
  };

  if (!response) {
    if (isGenerating) {
      return <LoadingState />;
    }

    return (
      <div className="max-w-3xl w-full px-4 py-18">
        <ToolHeader tool={tool} isLoading={isLoading} />
        <InputFields
          tool={tool}
          isLoading={isLoading}
          inputs={inputs}
          onInputChange={handleInputChange}
          onKeyPress={handleKeyPress}
        />
        <div className="flex flex-col items-center gap-4">
        <button
  onClick={handleGenerate}
  disabled={!tool || isLoading || !inputs.field1.trim() || isGenerating || credits < (tool?.creditCost || 0)}
  className={`text-xl font-bold rounded-xl transition-all duration-200 w-[340px] py-5
    ${(!isLoading && inputs.field1.trim() && credits >= (tool?.creditCost || 0))
      ? 'bg-[var(--accent)] text-white hover:bg-[var(--accent)]/90'
      : theme === 'dark'
        ? 'bg-gray-800 text-gray-500'
        : 'bg-gray-200 text-gray-400'}`}
>
  {isLoading ? 'Loading...' : `Generate for ${tool?.creditCost || '...'} Credits`}
</button>
          <div className="text-[var(--text-secondary)]">
            {credits} Credits Remaining
          </div>
        </div>
      </div>
    );
  }

  return (
    <ResponseDisplay
      response={response}
      onRegenerate={handleRegenerate}
      isGenerating={isGenerating}
      isLoading={isLoading}
    />
  );
}
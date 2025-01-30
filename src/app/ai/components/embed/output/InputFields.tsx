'use client';

import React from 'react';
import type { AITool, AIInput } from '@/lib/supabase/ai';
import { useTheme } from '@/app/context/ThemeContext';
import { ArrowRight } from 'lucide-react';

interface InputFieldsProps {
  tool: AITool | null;
  toolInputs: AIInput[];
  isLoading: boolean;
  values: Record<string, string>;
  onInputChange: (field: string, value: string) => void;
  onKeyPress: (e: React.KeyboardEvent<HTMLInputElement>, field: string) => void;
}

export function InputFields({ 
  tool, 
  toolInputs, 
  isLoading, 
  values, 
  onInputChange, 
  onKeyPress 
}: InputFieldsProps) {
  const { theme } = useTheme();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-24 bg-[var(--hover-bg)] animate-pulse rounded-lg"></div>
        <div className="h-24 bg-[var(--hover-bg)] animate-pulse rounded-lg"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {toolInputs.map((input, index) => (
        <div 
          key={input.id} 
          className="bg-[var(--card-bg)] rounded-lg p-6 border border-[var(--border-color)]"
        >
          <label className="block text-[var(--foreground)] text-lg font-medium mb-2">
            {input.input_name}
            {input.is_required && <span className="text-red-500 ml-1">*</span>}
          </label>
          
          <p className="text-[var(--text-secondary)] mb-4">
            {input.input_description}
          </p>

          <div className="relative">
            <input
              type="text"
              value={values[input.input_name || ''] || ''}
              onChange={(e) => onInputChange(input.input_name || '', e.target.value)}
              onKeyPress={(e) => onKeyPress(e, input.input_name || '')}
              placeholder={`Enter ${input.input_name?.toLowerCase()}`}
              className="w-full p-4 bg-[var(--background)] border border-[var(--border-color)] 
                       rounded-lg text-[var(--foreground)] placeholder-[var(--text-secondary)]
                       focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            />
            
            {index < toolInputs.length - 1 && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                <ArrowRight className="w-5 h-5 text-[var(--text-secondary)]" />
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
'use client';

import React from 'react';
import type { Tool } from '@/app/ai/lib/tools';
import { useTheme } from '@/app/context/ThemeContext';
import { ArrowRight } from 'lucide-react';

interface InputFieldsProps {
  tool: Tool | null;
  isLoading: boolean;
  inputs: Record<string, string>;
  onInputChange: (field: string, value: string) => void;
  onKeyPress: (e: React.KeyboardEvent<HTMLInputElement>, field: string) => void;
}

export function InputFields({ 
  tool, 
  isLoading, 
  inputs, 
  onInputChange, 
  onKeyPress 
}: InputFieldsProps) {
  return (
    <div className="space-y-12 mb-16">
      <div>
        <label className="block text-[var(--foreground)] text-2xl font-semibold mb-3 flex items-center gap-2">
          <ArrowRight className="h-6 w-6 text-[var(--text-secondary)]" />
          {tool?.inputField1 || 'Loading...'}
        </label>
        <div className="text-base text-[var(--text-secondary)] mb-4 ml-8">
          {tool?.inputField1Description || 'Loading...'}
        </div>
        <input 
          type="text"
          name="field1"
          className="w-full bg-transparent text-xl py-4 px-2 
            border-b border-[var(--border-color)] focus:border-[var(--accent)]
            text-[var(--foreground)]
            focus:outline-none transition-colors duration-200"
          value={inputs.field1}
          onChange={(e) => onInputChange('field1', e.target.value)}
          onKeyPress={(e) => onKeyPress(e, 'field1')}
          autoFocus
          disabled={isLoading}
        />
      </div>

      {(isLoading || tool?.inputField2) && (
        <div>
          <label className="block text-[var(--foreground)] text-2xl font-semibold mb-3 flex items-center gap-2">
            <ArrowRight className="h-6 w-6 text-[var(--text-secondary)]" />
            {tool?.inputField2 || 'Loading...'}
          </label>
          <div className="text-base text-[var(--text-secondary)] mb-4 ml-8">
            {tool?.inputField2Description || 'Loading...'}
          </div>
          <input 
            type="text"
            name="field2"
            className="w-full bg-transparent text-xl py-4 px-2 
              border-b border-[var(--border-color)] focus:border-[var(--accent)]
              text-[var(--foreground)]
              focus:outline-none transition-colors duration-200"
            value={inputs.field2 || ''}
            onChange={(e) => onInputChange('field2', e.target.value)}
            onKeyPress={(e) => onKeyPress(e, 'field2')}
            disabled={isLoading}
          />
        </div>
      )}

      {(isLoading || tool?.inputField3) && (
        <div>
          <label className="block text-[var(--foreground)] text-2xl font-semibold mb-3 flex items-center gap-2">
            <ArrowRight className="h-6 w-6 text-[var(--text-secondary)]" />
            {tool?.inputField3 || 'Loading...'}
          </label>
          <div className="text-base text-[var(--text-secondary)] mb-4 ml-8">
            {tool?.inputField3Description || 'Loading...'}
          </div>
          <input 
            type="text"
            name="field3"
            className="w-full bg-transparent text-xl py-4 px-2 
              border-b border-[var(--border-color)] focus:border-[var(--accent)]
              text-[var(--foreground)]
              focus:outline-none transition-colors duration-200"
            value={inputs.field3 || ''}
            onChange={(e) => onInputChange('field3', e.target.value)}
            onKeyPress={(e) => onKeyPress(e, 'field3')}
            disabled={isLoading}
          />
        </div>
      )}
    </div>
  );
}
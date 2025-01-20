// src/app/ai/components/InputFields.tsx
'use client';

import React from 'react';
import { useTheme } from '@/app/context/ThemeContext';
import type { Tool } from '@/app/ai/lib/tools';

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
  const { theme } = useTheme();

  const inputStyles = `w-full bg-transparent text-2xl py-4 px-2 
    border-b border-[var(--border-color)] focus:border-[var(--accent)]
    text-[var(--foreground)] placeholder-[var(--text-secondary)]
    focus:outline-none transition-colors duration-200`;

  return (
    <div className="space-y-8 mb-16">
      <div>
        <input 
          type="text"
          name="field1"
          className={inputStyles}
          placeholder={tool?.inputField1Description || 'Loading...'}
          value={inputs.field1}
          onChange={(e) => onInputChange('field1', e.target.value)}
          onKeyPress={(e) => onKeyPress(e, 'field1')}
          autoFocus
          disabled={isLoading}
        />
      </div>

      {(isLoading || tool?.inputField2) && (
        <div>
          <input 
            type="text"
            name="field2"
            className={inputStyles}
            placeholder={tool?.inputField2Description || 'Loading...'}
            value={inputs.field2 || ''}
            onChange={(e) => onInputChange('field2', e.target.value)}
            onKeyPress={(e) => onKeyPress(e, 'field2')}
            disabled={isLoading}
          />
        </div>
      )}

      {(isLoading || tool?.inputField3) && (
        <div>
          <input 
            type="text"
            name="field3"
            className={inputStyles}
            placeholder={tool?.inputField3Description || 'Loading...'}
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
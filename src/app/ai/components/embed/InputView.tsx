'use client';

import { useState, useEffect } from 'react';
import { useTheme } from '@/app/context/ThemeContext';

interface InputViewProps {
  input: {
    id: string;
    type: 'text' | 'multiChoice' | 'dropdown';
    prompt: string;
    options?: string[];
  };
  value: string;
  onChange: (value: string) => void;
  onNext: () => void;
  onBack?: () => void;
  isLast: boolean;
  isSubmitting: boolean;
}

export default function InputView({
  input,
  value,
  onChange,
  onNext,
  onBack,
  isLast,
  isSubmitting
}: InputViewProps) {
  const [isFocused, setIsFocused] = useState(false);
  const { theme } = useTheme();

  // Handle enter key for submission
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && value && !isSubmitting) {
        onNext();
      }
    };

    window.addEventListener('keypress', handleKeyPress);
    return () => window.removeEventListener('keypress', handleKeyPress);
  }, [value, onNext, isSubmitting]);

  const renderInput = () => {
    switch (input.type) {
      case 'text':
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className="w-full px-4 py-3 text-lg bg-[var(--card-bg)] border-2 border-[var(--border-color)] rounded-lg focus:outline-none focus:border-[var(--accent)] text-[var(--foreground)] transition-colors placeholder:text-[var(--text-secondary)]"
            placeholder="Type your answer here..."
            autoFocus
          />
        );

      case 'multiChoice':
        return (
          <div className="space-y-2">
            {input.options?.map((option) => (
              <button
                key={option}
                onClick={() => {
                  onChange(option);
                  setTimeout(onNext, 300);
                }}
                className={`w-full px-4 py-3 text-left text-lg rounded-lg border-2 transition-all text-[var(--foreground)]
                  ${value === option 
                    ? 'border-[var(--accent)] bg-[var(--card-bg)]' 
                    : 'border-[var(--border-color)] hover:border-[var(--accent)]'}`}
              >
                {option}
              </button>
            ))}
          </div>
        );

      case 'dropdown':
        return (
          <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-4 py-3 text-lg bg-[var(--card-bg)] border-2 border-[var(--border-color)] rounded-lg focus:outline-none focus:border-[var(--accent)] text-[var(--foreground)] appearance-none"
          >
            <option value="" className="text-[var(--text-secondary)]">Select an option...</option>
            {input.options?.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        );
    }
  };

  return (
    <div className="flex flex-col space-y-6 min-h-[400px] p-6">
      {/* Question */}
      <h2 className="text-2xl font-medium text-[var(--foreground)]">
        {input.prompt}
      </h2>

      {/* Input */}
      <div className="flex-1">
        {renderInput()}
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center pt-4">
        {onBack ? (
          <button
            onClick={onBack}
            className="px-6 py-2 text-[var(--text-secondary)] hover:text-[var(--foreground)] transition-colors"
          >
            Back
          </button>
        ) : <div />}

        <button
          onClick={onNext}
          disabled={!value || isSubmitting}
          className={`px-6 py-2 rounded-lg transition-all
            ${value && !isSubmitting
              ? 'bg-[var(--accent)] text-white hover:bg-[var(--accent)]/90'
              : 'bg-[var(--card-bg)] text-[var(--text-secondary)] cursor-not-allowed'}`}
        >
          {isSubmitting ? 'Processing...' : isLast ? 'Submit' : 'Next'}
        </button>
      </div>
    </div>
  );
}
'use client';

import { useTheme } from '@/app/context/ThemeContext';

interface ResponseProps {
  response: string;
}

export default function Response({ response }: ResponseProps) {
  const { theme } = useTheme();

  return (
    <div className="animate-fade-in p-6 space-y-4">
      <h2 className="text-2xl font-medium text-[var(--foreground)]">
        Here's your response:
      </h2>
      
      <div className={`prose max-w-none ${
        theme === 'dark' ? 'prose-invert' : 'prose-gray'
      }`}>
        {response}
      </div>

      <button 
        onClick={() => window.location.reload()} 
        className="mt-8 px-6 py-2 text-[var(--text-secondary)] hover:text-[var(--foreground)] transition-colors"
      >
        Start Over
      </button>
    </div>
  );
}
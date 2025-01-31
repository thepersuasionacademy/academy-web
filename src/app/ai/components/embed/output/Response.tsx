'use client';

import { useTheme } from '@/app/context/ThemeContext';

interface ResponseProps {
  response: string;
}

export default function Response({ response }: ResponseProps) {
  const { theme } = useTheme();

  // Handle error responses
  const isError = response.startsWith('Error:');
  
  return (
    <div className="animate-fade-in p-6 space-y-4">
      <h2 className={`text-2xl font-medium ${
        isError ? 'text-red-500' : 'text-[var(--foreground)]'
      }`}>
        {isError ? 'Error Occurred:' : 'Here\'s your response:'}
      </h2>
      
      <div className={`prose max-w-none ${
        theme === 'dark' ? 'prose-invert' : 'prose-gray'
      } ${isError ? 'text-red-500' : ''}`}>
        {isError ? response.substring(6).trim() : response}
      </div>

      <button 
        onClick={() => window.location.reload()} 
        className={`mt-8 px-6 py-2 ${
          isError 
            ? 'text-red-500 hover:text-red-600' 
            : 'text-[var(--text-secondary)] hover:text-[var(--foreground)]'
        } transition-colors`}
      >
        {isError ? 'Try Again' : 'Start Over'}
      </button>
    </div>
  );
}
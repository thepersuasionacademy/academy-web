'use client';

// GridLoader.tsx
import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useTheme } from '@/app/context/ThemeContext';

const GridLoader = () => {
  const [isClient, setIsClient] = useState(false);
  const { theme } = useTheme();

  useEffect(() => {
    const registerGrid = async () => {
      const { grid } = await import('ldrs');
      grid.register();
    };
    
    registerGrid();
    setIsClient(true);
  }, []);

  const loaderColor = theme === 'dark' ? '#e8e8e3' : '#2c2c2c';

  if (!isClient) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4">
        <div className="w-[150px] h-[150px] bg-[var(--hover-bg)] rounded-md animate-pulse" />
        <div className="text-[var(--foreground)] text-xl font-medium animate-pulse">
          Generating...
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center space-y-4">
      <div 
        dangerouslySetInnerHTML={{
          __html: `<l-grid size="150" speed="1.5" color="${loaderColor}"></l-grid>`
        }}
      />
      <div className="text-[var(--foreground)] text-xl font-medium animate-pulse">
        Generating...
      </div>
    </div>
  );
};

// Export as a client-side only component
export default dynamic(() => Promise.resolve(GridLoader), {
  ssr: false
});
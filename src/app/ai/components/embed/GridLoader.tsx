'use client';

// GridLoader.tsx
import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

const GridLoader = () => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    const registerGrid = async () => {
      const { grid } = await import('ldrs');
      grid.register();
    };
    
    registerGrid();
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4">
        <div className="w-[60px] h-[60px] bg-[#e6e9f0]/20 rounded-md animate-pulse" />
        <div className="text-[#e6e9f0] font-medium animate-pulse">
          Synthesizing...
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center space-y-4">
      <div 
        dangerouslySetInnerHTML={{
          __html: '<l-grid size="60" speed="1.5" color="#e6e9f0"></l-grid>'
        }}
      />
      <div className="text-[#e6e9f0] font-medium animate-pulse">
        Synthesizing...
      </div>
    </div>
  );
};

// Export as a client-side only component
export default dynamic(() => Promise.resolve(GridLoader), {
  ssr: false
});
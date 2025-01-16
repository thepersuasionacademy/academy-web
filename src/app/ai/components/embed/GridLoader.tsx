// GridLoader.tsx
import React, { useEffect } from 'react';
import { grid } from 'ldrs';

const GridLoader = () => {
  useEffect(() => {
    grid.register();
  }, []);

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

export default GridLoader;
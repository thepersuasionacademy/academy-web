'use client';

import { useEffect, useState } from 'react';

export default function ScrollProgress() {
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = (window.scrollY / totalHeight) * 100;
      setScrollProgress(progress);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="fixed right-0 top-0 h-full w-1.5 z-50 pointer-events-none bg-transparent">
      <div 
        className="w-full transition-all duration-150 ease-out bg-gray-400/30 rounded"
        style={{ height: `${scrollProgress}%` }}
      />
    </div>
  );
} 
'use client';

import { useState, useEffect } from 'react';

interface TransitionViewProps {
  children: React.ReactNode;
}

export default function TransitionView({ children }: TransitionViewProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [content, setContent] = useState(children);

  useEffect(() => {
    setIsVisible(false);
    const timeout = setTimeout(() => {
      setContent(children);
      setIsVisible(true);
    }, 200); // Matches transition duration

    return () => clearTimeout(timeout);
  }, [children]);

  return (
    <div 
      className={`transform transition-all duration-200 ease-in-out
        ${isVisible 
          ? 'opacity-100 translate-y-0' 
          : 'opacity-0 translate-y-4'}`}
    >
      {content}
    </div>
  );
}
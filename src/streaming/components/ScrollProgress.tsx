'use client';

import { useEffect, useState } from 'react';

const ScrollProgress = () => {
 const [scrollProgress, setScrollProgress] = useState(0);

 useEffect(() => {
   const handleScroll = () => {
     const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
     const progress = (window.scrollY / totalHeight) * 100;
     setScrollProgress(progress);
   };

   // Initial calculation
   handleScroll();

   // Add scroll listener
   window.addEventListener('scroll', handleScroll, { passive: true });

   // Cleanup
   return () => window.removeEventListener('scroll', handleScroll);
 }, []);

 return (
   <div 
     className="fixed right-0 top-0 h-full w-1.5 z-50 pointer-events-none"
     style={{ backgroundColor: 'transparent' }}
   >
     <div
       className="w-full transition-all duration-150 ease-out"
       style={{
         height: `${scrollProgress}%`,
         backgroundColor: 'rgba(156, 163, 175, 0.3)',
         maxHeight: '100%',
         borderRadius: '3px'
       }}
     />
   </div>
 );
};

export default ScrollProgress;
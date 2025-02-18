'use client';

import { useTheme } from '@/app/context/ThemeContext';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

const URLS = {
  dark: 'https://love.thepersuasionacademy.com/hC--9R',
  light: 'https://love.thepersuasionacademy.com/daC3tET'
};

const TestimonialSkeleton = () => {
  return (
    <div className="w-full min-h-screen bg-white dark:bg-[#1a0f0f] p-8 animate-pulse">
      {/* Logo */}
      <div className="max-w-[200px] mx-auto mb-16">
        <div className="h-16 bg-gray-200/80 dark:bg-gray-800/50 rounded-lg" />
      </div>

      {/* Header Section */}
      <div className="text-center max-w-2xl mx-auto mb-16">
        <div className="h-16 bg-gray-200/80 dark:bg-gray-800/50 rounded-lg mb-6 w-[300px] mx-auto" /> {/* Testimonials */}
        <div className="h-6 bg-gray-200/80 dark:bg-gray-800/50 rounded w-[400px] mx-auto mb-8" /> {/* Subtitle */}
        <div className="h-12 bg-gray-200/80 dark:bg-gray-800/50 rounded-full w-[300px] mx-auto" /> {/* CTA Button */}
      </div>

      {/* Testimonial Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-gray-50/80 dark:bg-black/20 backdrop-blur rounded-lg p-6 shadow-sm dark:shadow-none">
            {/* Profile Section */}
            <div className="flex items-center mb-6">
              <div className="w-14 h-14 bg-gray-200/80 dark:bg-gray-800/50 rounded-full" />
              <div className="ml-4 flex-1">
                <div className="h-5 bg-gray-200/80 dark:bg-gray-800/50 rounded w-32 mb-2" /> {/* Name */}
                <div className="h-4 bg-gray-200/80 dark:bg-gray-800/50 rounded w-48" /> {/* Title */}
              </div>
            </div>
            {/* Testimonial Content */}
            <div className="space-y-3">
              <div className="h-4 bg-gray-200/80 dark:bg-gray-800/50 rounded w-full" />
              <div className="h-4 bg-gray-200/80 dark:bg-gray-800/50 rounded w-full" />
              <div className="h-4 bg-gray-200/80 dark:bg-gray-800/50 rounded w-5/6" />
              <div className="h-4 bg-gray-200/80 dark:bg-gray-800/50 rounded w-4/6" />
            </div>
            {/* Date */}
            <div className="mt-6">
              <div className="h-4 bg-gray-200/80 dark:bg-gray-800/50 rounded w-24" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function TestimonialsPage() {
  const { theme } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const testimonialUrl = theme === 'dark' ? URLS.dark : URLS.light;
  const [currentUrl, setCurrentUrl] = useState(testimonialUrl);
  const [cachedContent, setCachedContent] = useState<{ [key: string]: boolean }>({});
  
  // Handle theme changes and initial load
  useEffect(() => {
    setIsLoading(true);
    setCurrentUrl(testimonialUrl);
    
    // If content is already cached, reduce loading time
    if (cachedContent[testimonialUrl]) {
      setTimeout(() => setIsLoading(false), 300); // Short delay for smooth transition
    }
  }, [theme, testimonialUrl]);

  // Preload both versions
  useEffect(() => {
    const preloadIframes = async () => {
      const urls = [URLS.dark, URLS.light];
      
      urls.forEach(url => {
        if (!cachedContent[url]) {
          const iframe = document.createElement('iframe');
          iframe.style.display = 'none';
          iframe.src = url;
          
          iframe.onload = () => {
            setCachedContent(prev => ({ ...prev, [url]: true }));
            if (url === currentUrl) {
              setIsLoading(false);
            }
          };
          
          document.body.appendChild(iframe);
          setTimeout(() => {
            document.body.removeChild(iframe);
          }, 100);
        }
      });
    };

    preloadIframes();
  }, []);

  // Handle iframe load
  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  return (
    <div className="w-full h-screen relative">
      <div className={cn(
        "absolute inset-0 bg-[var(--background)] transition-opacity duration-300",
        isLoading ? "opacity-100" : "opacity-0 pointer-events-none"
      )}>
        <TestimonialSkeleton />
      </div>
      <iframe 
        key={currentUrl}
        src={currentUrl}
        className={cn(
          "w-full h-full border-0 transition-opacity duration-300 scrollbar-hide",
          isLoading ? "opacity-0" : "opacity-100"
        )}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        onLoad={handleIframeLoad}
      />
    </div>
  );
} 
'use client';

import { useTheme } from '@/app/context/ThemeContext';

export default function TestimonialsPage() {
  const { theme } = useTheme();
  
  const testimonialUrl = theme === 'dark' 
    ? 'https://love.thepersuasionacademy.com/hC--9R'
    : 'https://love.thepersuasionacademy.com/daC3tET';

  return (
    <div className="w-full h-screen">
      <iframe 
        src={testimonialUrl}
        className="w-full h-full border-0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
} 
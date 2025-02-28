import { useEffect, useState } from 'react';

interface FeaturedContentProps {
  className?: string;
}

export const FeaturedContent = ({ className }: FeaturedContentProps) => {
  return (
    <div className={`relative h-[420px] mt-0 w-full overflow-hidden ${className}`}>
      {/* Background image container */}
      <div className="absolute inset-0">
        <div className="absolute inset-0">
          <img 
            src="https://thepersuasionacademycdn.b-cdn.net/Images/thepowerark_epic_visual_of_silhouette_person_standing_on_foun_e6d651a0-5700-4d4f-a592-9383e035b2b8_2.jpeg"
            alt="Welcome to The Persuasion Academy"
            className="w-full h-full object-cover"
          />
        </div>
        {/* Layered gradients for better text contrast and cinematic look */}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-900/50 via-transparent to-transparent" />
      </div>
      
      {/* Content container - positioned higher */}
      <div className="absolute inset-0 flex items-start justify-center pt-20">
        <div className="text-center space-y-4">
          <div className="space-y-4 transform-gpu">
            <h1 className="text-6xl font-bold tracking-tight text-white [text-shadow:_0_0_20px_rgba(0,0,0,0.8)] transform-gpu hover:scale-[1.02] transition-transform duration-300">
              Welcome to The Persuasion Academy
            </h1>
            <p className="text-xl text-white font-semibold [text-shadow:_0_0_15px_rgba(0,0,0,0.6)] transform-gpu hover:scale-[1.01] transition-transform duration-300">
              Enjoy your content below.
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes skew {
          0%, 100% { transform: skewY(0deg) scale(1); }
          33% { transform: skewY(1deg) scale(1.01); }
          66% { transform: skewY(-1deg) scale(0.99); }
        }
      `}</style>
    </div>
  );
};
import { ChevronDown } from 'lucide-react';
import { useEffect, useState } from 'react';

interface FeaturedContentProps {
  className?: string;
}

export const FeaturedContent = ({ className }: FeaturedContentProps) => {
  const [isAnimating, setIsAnimating] = useState(true);

  useEffect(() => {
    // Stop animation after 3 bounces (approximately 2.4 seconds)
    const timer = setTimeout(() => {
      setIsAnimating(false);
    }, 2400);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={`relative h-[480px] mt-0 w-full overflow-hidden ${className}`}>
      {/* Background image container */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 animate-[flow_18s_ease-in-out_infinite] scale-[1.02]">
          <img 
            src="https://thepersuasionacademycdn.b-cdn.net/Images/thepowerark_black_background_magic_4k_wallpaper_background_burg_8b1627cb-2a30-4594-9766-7512a94c2a31%20(1).jpeg"
            alt="Welcome to The Persuasion Academy"
            className="w-full h-full object-cover animate-[wave_22s_ease-in-out_infinite] scale-[1.15]"
          />
        </div>
        {/* Layered gradients for better text contrast and cinematic look */}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/50 to-transparent animate-[glow_8s_ease-in-out_infinite]" />
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-900/50 via-transparent to-transparent animate-[skew_16s_ease-in-out_infinite]" />
      </div>
      
      {/* Content container */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center space-y-12">
          <div className="space-y-6 transform-gpu">
            <h1 className="text-6xl font-bold tracking-tight text-white [text-shadow:_0_0_20px_rgba(0,0,0,0.8)] transform-gpu hover:scale-[1.02] transition-transform duration-300">
              Welcome to The Persuasion Academy
            </h1>
            <p className="text-xl text-white font-semibold [text-shadow:_0_0_15px_rgba(0,0,0,0.6)] transform-gpu hover:scale-[1.01] transition-transform duration-300">
              Enjoy your content below.
            </p>
          </div>
          
          {/* Animated down arrow */}
          <div className={`${isAnimating ? 'animate-bounce' : 'transition-transform hover:translate-y-1'} [text-shadow:_0_0_12px_rgba(0,0,0,0.6)]`}>
            <ChevronDown className="w-8 h-8 text-white mx-auto" />
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes wave {
          0% { transform: scale(1.15) skew(0deg, 0deg); }
          20% { transform: scale(1.16) skew(2deg, 1deg); }
          40% { transform: scale(1.15) skew(-1deg, -1.5deg); }
          60% { transform: scale(1.17) skew(-2deg, 1deg); }
          80% { transform: scale(1.15) skew(1deg, -1deg); }
          100% { transform: scale(1.15) skew(0deg, 0deg); }
        }
        @keyframes flow {
          0%, 100% { transform: scale(1.02) rotate(0deg) translateY(0px); }
          25% { transform: scale(1.04) rotate(1deg) translateY(-5px); }
          50% { transform: scale(1.03) rotate(-1deg) translateY(5px); }
          75% { transform: scale(1.04) rotate(0.5deg) translateY(-3px); }
        }
        @keyframes glow {
          0%, 100% { opacity: 0.92; background-color: rgba(0, 0, 0, 0.25); }
          50% { opacity: 0.75; background-color: rgba(0, 0, 0, 0.15); }
        }
        @keyframes skew {
          0%, 100% { transform: skewY(0deg) scale(1); }
          33% { transform: skewY(1deg) scale(1.01); }
          66% { transform: skewY(-1deg) scale(0.99); }
        }
      `}</style>
    </div>
  );
};
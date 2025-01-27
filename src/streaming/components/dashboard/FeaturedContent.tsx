import { Play, Heart, Share2 } from 'lucide-react';
import { MediaItem } from '@/streaming/types';

interface FeaturedContentProps {
  content: MediaItem;
  onPlay: () => void;
  onLike: () => void;
  onShare: () => void;
}

const buttonClassName = "px-8 py-3 bg-[var(--accent)] rounded-full hover:opacity-90 transition-all flex items-center space-x-2 hover:scale-105 active:scale-100";

export const FeaturedContent = ({ content, onPlay, onLike, onShare }: FeaturedContentProps) => {
  return (
    <div className="relative h-[480px] mt-0 w-full">
      {/* Background image container */}
      <div className="absolute inset-0">
        <img 
          src={content.image}
          alt={content.title}
          className="w-full h-full object-cover"
        />
        {/* Layered gradients for better text contrast and cinematic look */}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-900/50 via-transparent to-transparent" />
      </div>
      
      {/* Content container */}
      <div className="absolute inset-0 flex items-end">
        <div className="container mx-auto px-6 pb-24">
          <div className="max-w-2xl space-y-6">
            {/* Featured label and title */}
            <div className="space-y-2">
          
              <h1 className="text-6xl font-bold tracking-tight text-white [text-shadow:_0_1px_2px_rgb(0_0_0_/_40%)]">
                {content.title}
              </h1>
              <p className="text-lg text-zinc-200">
                {content.description}
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex items-center space-x-4 pt-2">
              <button 
                onClick={onPlay}
                className={buttonClassName}
              >
                <Play className="w-5 h-5" />
                <span className="font-medium">Play Now</span>
              </button>
              <button 
                onClick={onLike}
                className="p-3 rounded-full bg-zinc-800/50 backdrop-blur-sm hover:bg-zinc-700/60 transition-all hover:scale-105 active:scale-100"
              >
                <Heart className="w-5 h-5" />
              </button>
              <button 
                onClick={onShare}
                className="p-3 rounded-full bg-zinc-800/50 backdrop-blur-sm hover:bg-zinc-700/60 transition-all hover:scale-105 active:scale-100"
              >
                <Share2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
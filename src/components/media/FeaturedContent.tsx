import { Play, Heart, Share2 } from 'lucide-react';
import { MediaItem } from './types';

interface FeaturedContentProps {
  content: MediaItem;
  onPlay: () => void;
  onLike: () => void;
  onShare: () => void;
}

export const FeaturedContent = ({ content, onPlay, onLike, onShare }: FeaturedContentProps) => {
  return (
    <div className="relative h-[380px] z-0 mt-15">
      <div className="absolute inset-0">
        <img 
          src={content.image}
          alt={content.title}
          className="w-full h-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/90 via-zinc-900/20 to-transparent" />
      </div>
      
      <div className="absolute bottom-12 left-10 space-y-4 max-w-2xl">
        <h1 className="text-5xl font-bold leading-tight">{content.title}</h1>
        <p className="text-lg text-zinc-200">{content.description}</p>
        <div className="flex space-x-4">
          <button 
            onClick={onPlay}
            className="px-6 py-2.5 bg-red-600 rounded-full hover:bg-red-700 transition flex items-center space-x-2"
          >
            <Play className="w-5 h-5" />
            <span>Play Now</span>
          </button>
          <button 
            onClick={onLike}
            className="p-2.5 rounded-full bg-zinc-800/50 backdrop-blur-sm hover:bg-zinc-700/60 transition"
          >
            <Heart className="w-5 h-5" />
          </button>
          <button 
            onClick={onShare}
            className="p-2.5 rounded-full bg-zinc-800/50 backdrop-blur-sm hover:bg-zinc-700/60 transition"
          >
            <Share2 className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
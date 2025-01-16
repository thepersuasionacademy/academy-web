import { Search, Clock } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

interface SearchOverlayProps {
  isVisible: boolean;
  onClose: () => void;
}

const SearchOverlay = ({ isVisible, onClose }: SearchOverlayProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchHistory] = useState([
    'Deep Focus Playlist',
    'Meditation Sounds',
    'Study Music'
  ]);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isVisible) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isVisible, onClose]);

  const suggestions = searchQuery ? [
    `${searchQuery} playlist`,
    `${searchQuery} meditation`,
    `${searchQuery} sounds`
  ] : [];

  return (
    <div className={`px-12 transition-opacity duration-200 ${isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
      <div className="max-w-xl mx-auto relative">
        <div 
          ref={searchRef} 
          className={`bg-zinc-900 rounded-b-2xl overflow-hidden transition-all duration-200 ease-out
            ${isVisible ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'}`}
        >
          {/* Search Input */}
          <div className="relative p-1 px-3">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for tracks, playlists, or categories..."
              className="w-full bg-zinc-800 border border-zinc-700 rounded-full px-10 py-2 
                focus:outline-none focus:ring-2 focus:ring-red-500 
                focus:border-transparent placeholder-zinc-400 text-sm"
              autoFocus={isVisible}
            />
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          </div>

          {/* Suggestions */}
          {(suggestions.length > 0 || searchHistory.length > 0) && (
            <div className="pb-3">
              {/* Current Suggestions */}
              {suggestions.length > 0 && (
                <div className="py-1">
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      className="w-full text-left px-4 py-2 hover:bg-zinc-800/50 flex items-center space-x-3 text-sm transition-colors duration-150"
                    >
                      <Search className="w-4 h-4 text-zinc-400" />
                      <span>{suggestion}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Search History */}
              {searchHistory.length > 0 && !searchQuery && (
                <div>
                  <div className="px-4 py-2 text-xs text-zinc-500">Recent searches</div>
                  {searchHistory.map((item, index) => (
                    <button
                      key={index}
                      className="w-full text-left px-4 py-2 hover:bg-zinc-800/50 flex items-center space-x-3 text-sm transition-colors duration-150"
                    >
                      <Clock className="w-4 h-4 text-zinc-400" />
                      <span>{item}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchOverlay;
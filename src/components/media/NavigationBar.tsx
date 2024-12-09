import { Search, X } from 'lucide-react';
import { useState } from 'react';
import SearchOverlay from './SearchOverlay';

const NavigationBar = () => {
  const [isSearchVisible, setIsSearchVisible] = useState(false);

  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      <div className="flex flex-col">
        {/* Title Section */}
        <div className="relative px-4 py-4 bg-zinc-900">
          <div className="flex justify-center items-center space-x-4">
            <h1 className="text-2xl font-bold">Mind Mastery</h1>
            <button
              onClick={() => setIsSearchVisible(!isSearchVisible)}
              className="p-2 rounded-full hover:bg-zinc-800 transition duration-300"
            >
              {isSearchVisible ? (
                <X className="w-4 h-4" />
              ) : (
                <Search className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Search Overlay */}
        <SearchOverlay 
          isVisible={isSearchVisible}
          onClose={() => setIsSearchVisible(false)}
        />
      </div>
    </div>
  );
};

export default NavigationBar;
import React from 'react';
import { Send, Key } from 'lucide-react';

interface FloatingActionBarProps {
  selectedUsers: string[];
  handleSendEmail: () => void;
  handleAccessOptions: () => void;
  clearSelections: () => void;
}

export const FloatingActionBar: React.FC<FloatingActionBarProps> = ({
  selectedUsers,
  handleSendEmail,
  handleAccessOptions,
  clearSelections
}) => {
  if (selectedUsers.length === 0) return null;
  
  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-[var(--card-bg)] shadow-2xl ring-1 ring-black/5 rounded-lg border border-[var(--border-color)] py-3 px-6 flex items-center gap-4 z-20">
      <div className="text-sm font-medium">
        {selectedUsers.length} {selectedUsers.length === 1 ? 'user' : 'users'} selected
      </div>
      
      <div className="flex items-center gap-2">
        <button 
          onClick={handleSendEmail}
          className="flex items-center gap-2 px-4 py-2 bg-[var(--accent)] text-white rounded-lg hover:bg-opacity-90 transition-colors"
        >
          <Send className="w-4 h-4" />
          Send Email
        </button>
        
        <button 
          onClick={handleAccessOptions}
          className="flex items-center gap-2 px-4 py-2 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg hover:bg-[var(--hover-bg)] transition-colors"
        >
          <Key className="w-4 h-4" />
          Access Options
        </button>
        
        <button 
          onClick={clearSelections}
          className="px-4 py-2 text-[var(--text-secondary)] hover:text-[var(--foreground)] transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}; 
import React from 'react';

interface ContentInfoProps {
  title: string;
  description: string | null;
  onTitleChange: (title: string) => void;
  onDescriptionChange: (description: string) => void;
}

export default function ContentInfo({
  title,
  description,
  onTitleChange,
  onDescriptionChange
}: ContentInfoProps) {
  return (
    <div className="space-y-2">
      <input
        type="text"
        value={title}
        onChange={e => onTitleChange(e.target.value)}
        className="text-4xl font-bold bg-transparent outline-none focus:outline-none focus:ring-0 ring-0 border-0 focus:border-0 rounded-none focus:rounded-none px-0 select-none focus:shadow-none shadow-none w-full"
        placeholder="Content Title"
      />
      <input
        type="text"
        value={description || ''}
        onChange={e => onDescriptionChange(e.target.value)}
        className="w-full text-xl text-[var(--text-secondary)] bg-transparent outline-none focus:outline-none focus:ring-0 ring-0 border-0 focus:border-0 rounded-none focus:rounded-none px-0 select-none focus:shadow-none shadow-none"
        placeholder="Content Description"
      />
    </div>
  );
} 
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
    <div>
      <input
        type="text"
        value={title}
        onChange={e => onTitleChange(e.target.value)}
        className="text-4xl font-bold bg-transparent outline-none focus:outline-none focus:ring-0 ring-0 border-0 focus:border-0 rounded-none focus:rounded-none px-0 select-none focus:shadow-none shadow-none w-full mb-4"
        placeholder="Content Title"
      />
      <textarea
        value={description || ''}
        onChange={e => onDescriptionChange(e.target.value)}
        className="w-full text-xl text-[var(--text-secondary)] bg-transparent outline-none focus:outline-none focus:ring-0 ring-0 border-0 focus:border-0 rounded-none focus:rounded-none px-0 select-none focus:shadow-none shadow-none resize-none overflow-hidden"
        placeholder="Content Description"
        style={{ height: 'auto' }}
        onInput={e => {
          const target = e.target as HTMLTextAreaElement;
          target.style.height = 'auto';
          target.style.height = target.scrollHeight + 'px';
        }}
      />
    </div>
  );
} 
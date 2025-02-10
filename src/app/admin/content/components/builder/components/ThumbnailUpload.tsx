import React, { useState, useRef } from 'react';
import { Upload, Link, X } from 'lucide-react';
import Image from 'next/image';
import { toast } from 'sonner';

interface ThumbnailUploadProps {
  thumbnailUrl: string | null;
  onThumbnailChange: (url: string | null) => void;
}

export default function ThumbnailUpload({
  thumbnailUrl,
  onThumbnailChange
}: ThumbnailUploadProps) {
  const [isUrlMode, setIsUrlMode] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (file: File) => {
    // Check file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    // Check file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size should be less than 5MB');
      return;
    }

    setIsUploading(true);
    const loadingToast = toast.loading('Uploading thumbnail...');

    try {
      // Create a FormData instance
      const formData = new FormData();
      formData.append('file', file);

      // Upload to your API endpoint
      const response = await fetch('/api/upload/thumbnail', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.details || data.error || 'Upload failed');
      }

      if (!data.url) {
        throw new Error('No URL returned from upload');
      }

      onThumbnailChange(data.url);
      toast.dismiss(loadingToast);
      toast.success('Thumbnail uploaded successfully');
    } catch (error: any) {
      console.error('Error uploading thumbnail:', error);
      toast.dismiss(loadingToast);
      toast.error(error.message || 'Failed to upload thumbnail');
    } finally {
      setIsUploading(false);
    }
  };

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;

    // Basic URL validation
    try {
      new URL(urlInput);
      onThumbnailChange(urlInput);
      setIsUrlMode(false);
      setUrlInput('');
    } catch {
      toast.error('Please enter a valid URL');
    }
  };

  return (
    <div className="h-full">
      <div className="relative h-full">
        {thumbnailUrl ? (
          <>
            <Image
              src={thumbnailUrl}
              alt="Thumbnail"
              fill
              className="object-cover"
              sizes="30vw"
              priority
            />
            <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
              <button
                onClick={() => !isUploading && fileInputRef.current?.click()}
                disabled={isUploading}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors disabled:opacity-50"
              >
                <Upload className="w-5 h-5 text-white" />
              </button>
              <button
                onClick={() => !isUploading && setIsUrlMode(true)}
                disabled={isUploading}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors disabled:opacity-50"
              >
                <Link className="w-5 h-5 text-white" />
              </button>
              <button
                onClick={() => !isUploading && onThumbnailChange(null)}
                disabled={isUploading}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors disabled:opacity-50"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[var(--background)] border-b border-[var(--border-color)]">
            <div className="flex items-center gap-4">
              <button
                onClick={() => !isUploading && fileInputRef.current?.click()}
                disabled={isUploading}
                className="px-4 py-2 rounded-lg border border-[var(--border-color)] hover:bg-[var(--hover-bg)] transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <Upload className="w-4 h-4" />
                <span>{isUploading ? 'Uploading...' : 'Upload Image'}</span>
              </button>
              <button
                onClick={() => !isUploading && setIsUrlMode(true)}
                disabled={isUploading}
                className="px-4 py-2 rounded-lg border border-[var(--border-color)] hover:bg-[var(--hover-bg)] transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <Link className="w-4 h-4" />
                <span>Use URL</span>
              </button>
            </div>
            <p className="text-sm text-[var(--text-secondary)]">
              Upload a thumbnail image
            </p>
          </div>
        )}
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFileUpload(file);
          }}
          disabled={isUploading}
        />
      </div>

      {isUrlMode && (
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-[var(--background)] border-t border-[var(--border-color)]">
          <form onSubmit={handleUrlSubmit} className="flex gap-2">
            <input
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="Enter image URL"
              className="flex-1 px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-[var(--accent)] text-white hover:opacity-90 transition-opacity"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => {
                setIsUrlMode(false);
                setUrlInput('');
              }}
              className="px-4 py-2 rounded-lg border border-[var(--border-color)] hover:bg-[var(--hover-bg)] transition-colors"
            >
              Cancel
            </button>
          </form>
        </div>
      )}
    </div>
  );
} 
'use client';

import { MediaPlayer } from '@/app/content/components/dashboard/MediaPlayer';

export default function DashboardTestPage() {
  return (
    <div className="h-screen w-full bg-neutral-900">
      <MediaPlayer
        title="Test Video Title"
        description="This is a test description for the video player component. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat."
        isOpen={true}
      />
    </div>
  );
} 
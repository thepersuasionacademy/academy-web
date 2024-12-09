// components/player/shared/NowPlaying/types.ts
export interface NowPlayingProps {
    title: string;
    artist: string;
    coverImage: string;
    isLiked: boolean;
    onLikeToggle: () => void;
  }
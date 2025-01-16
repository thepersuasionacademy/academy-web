import { PlayerView } from '@/app/mind/lib/types/media';

export enum MediaType {
    AUDIO = 'audio',
    VIDEO = 'video'
  }
  
  export interface PlayerState {
    isPlaying: boolean;
    currentTime: number;
    duration: number;
    volume: number;
    title: string;
    artist: string;
    coverImage: string;
    isLiked: boolean;
    view: PlayerView;
    isBuffering?: boolean;
    error?: string;
    quality?: string;
  }
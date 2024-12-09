export enum PlayerView {
    BAR = 'bar',
    PIP = 'pip',
    FULLSCREEN = 'fullscreen'
  }
  
  export interface PlayerState {
    isPlaying: boolean;
    currentTime: number;
    duration: number;
    volume: number;
    title: string;
    artist: string;
    coverImage: string;
  }
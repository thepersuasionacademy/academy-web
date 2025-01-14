// types.ts
export enum PlayerView {
  BAR = 'bar',
  FULLSCREEN = 'fullscreen',
  PIP = 'pip'  
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
  error?: string;
 }
 
 export interface ViewProps {
  state: PlayerState; 
  onStateChange: (state: Partial<PlayerState>) => void;
  onViewChange: (view: PlayerView) => void;
 }
 
 export interface ControlsProps {
  isPlaying: boolean;
  onPlayPause: () => void;
  onNext: () => void;
  onPrevious: () => void;
 }
 
 export interface ProgressProps {
  currentTime: number;
  duration: number; 
  onSeek: (time: number) => void;
 }
 
 export interface VolumeProps {
  volume: number;
  onVolumeChange: (volume: number) => void;
 }
 
 export interface NowPlayingProps {
  title: string;
  artist: string;
  coverImage: string;
  isLiked: boolean;
  onLikeToggle: () => void;
 }

 export enum MediaType {
  AUDIO = 'audio',
  VIDEO = 'video'
}
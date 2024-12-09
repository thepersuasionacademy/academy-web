import { Minimize2, PictureInPicture, Volume2 } from 'lucide-react';
import { Controls } from './shared/Controls/variants/Desktop';
import { Progress } from './shared/Progress/variants/Desktop';
import { PlayerState, PlayerView } from './types';

interface FullscreenViewProps {
 state: PlayerState;
 onStateChange: (newState: Partial<PlayerState>) => void;
 onViewChange: (view: PlayerView) => void;
}

export const FullscreenView = ({ state, onStateChange, onViewChange }: FullscreenViewProps) => (
 <div className="fixed inset-0 bg-zinc-900 z-50">
   <div className="absolute top-4 right-4 flex space-x-2">
     <button onClick={() => onViewChange(PlayerView.PIP)} className="p-2 hover:bg-zinc-800 rounded-full">
       <PictureInPicture className="w-5 h-5" />
     </button>
     <button onClick={() => onViewChange(PlayerView.BAR)} className="p-2 hover:bg-zinc-800 rounded-full">
       <Minimize2 className="w-5 h-5" />
     </button>
   </div>

   <div className="h-full max-w-screen-2xl mx-auto flex flex-col items-center justify-center px-6 space-y-8">
     <img 
       src={state.coverImage} 
       alt="Now playing" 
       className="w-64 h-64 rounded-lg shadow-2xl"
     />
     
     <div className="text-center space-y-2">
       <h2 className="text-3xl font-bold">{state.title}</h2>
       <p className="text-xl text-zinc-400">{state.artist}</p>
     </div>

     <div className="w-full max-w-xl space-y-6">
       <Progress
         currentTime={state.currentTime}
         duration={state.duration}
         onSeek={(time: number) => onStateChange({ currentTime: time })}
       />
       
       <Controls
         isPlaying={state.isPlaying}
         onPlayPause={() => onStateChange({ isPlaying: !state.isPlaying })}
         onNext={() => {}}
         onPrevious={() => {}}
       />

       <div className="flex items-center space-x-3 justify-center">
         <Volume2 className="w-5 h-5" />
         <div className="w-32 h-1 bg-zinc-800 rounded-full">
           <div 
             className="h-full bg-zinc-400 rounded-full" 
             style={{ width: `${state.volume * 100}%` }} 
           />
         </div>
       </div>
     </div>
   </div>
 </div>
);

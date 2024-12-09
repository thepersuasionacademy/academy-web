interface ProgressProps {
    currentTime: number;
    duration: number;
    onSeek: (time: number) => void;
  }
  
  export const Progress = ({ currentTime, duration, onSeek }: ProgressProps) => {
    const formatTime = (seconds: number) => {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = Math.floor(seconds % 60);
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };
  
    return (
      <div className="w-full flex items-center space-x-3 mt-1">
        <span className="text-xs text-white/60">{formatTime(currentTime)}</span>
        <div className="flex-1 h-1 bg-white/20 rounded-full cursor-pointer group"
             onClick={(e) => {
               const rect = e.currentTarget.getBoundingClientRect();
               const percent = (e.clientX - rect.left) / rect.width;
               onSeek(percent * duration);
             }}>
          <div 
            className="h-full bg-red-500 rounded-full group-hover:bg-red-400 transition-colors" 
            style={{ width: `${(currentTime / duration) * 100}%` }}
          />
        </div>
        <span className="text-xs text-white/60">{formatTime(duration)}</span>
      </div>
    );
  };
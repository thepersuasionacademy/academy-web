interface BunnyPlayerProps {
  videoId: string;
  title?: string;
}

const BunnyPlayer: React.FC<BunnyPlayerProps> = ({ 
  videoId, 
  title = 'Audio Player' 
}) => {
  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="aspect-video relative">
        <iframe
          className="absolute top-0 left-0 w-full h-full"
          src={`https://iframe.mediadelivery.net/play/369599/46a59380-3a50-4e28-9545-a9505b1e7bb4`}
          title={title}
          allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
          allowFullScreen={true}
        />
      </div>
    </div>
  );
};

export default BunnyPlayer;
'use client';

export default function TestPage() {
  const libraryId = '369599';
  const videoId = '1e7bb7f1-5b1e-4b9b-b00e-49e1f83c5f19';
  const token = 'c86d59f1-6bd0-42e1-bf13-791c708199a7';
  const playerUrl = `https://iframe.mediadelivery.net/embed/${libraryId}/${videoId}?token=${token}&autoplay=false`;

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Video Player</h1>
      <div className="aspect-video w-full max-w-4xl mx-auto">
        <iframe 
          src={playerUrl}
          loading="lazy"
          className="w-full h-full"
          style={{ border: 'none' }}
          allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
          allowFullScreen
        />
      </div>
      <div className="mt-4 text-sm text-gray-600">
        <p>Debug URL: {playerUrl}</p>
      </div>
    </div>
  );
}
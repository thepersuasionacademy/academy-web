'use client';

export default function MockToolPage() {
  return (
    <div className="w-full h-full bg-white p-8">
      <h1 className="text-2xl font-bold mb-4">Buyer Psychology Modeling Tool</h1>
      <div className="space-y-4">
        <div className="p-4 border rounded">
          <h2 className="font-semibold mb-2">Input 1</h2>
          <textarea 
            className="w-full p-2 border rounded" 
            placeholder="Enter your text here..."
          />
        </div>
        <button className="px-4 py-2 bg-blue-500 text-white rounded">
          Generate
        </button>
      </div>
    </div>
  );
} 
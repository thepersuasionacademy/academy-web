'use client';

interface ResponseProps {
  response: string;
}

export default function Response({ response }: ResponseProps) {
  return (
    <div className="animate-fade-in p-6 space-y-4">
      <h2 className="text-2xl font-medium text-gray-800">
        Here's your response:
      </h2>
      
      <div className="prose prose-gray max-w-none">
        {response}
      </div>

      <button 
        onClick={() => window.location.reload()} 
        className="mt-8 px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors"
      >
        Start Over
      </button>
    </div>
  );
}
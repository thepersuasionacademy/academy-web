'use client';

interface ProgressDotsProps {
  totalSteps: number;
  currentStep: number;
}

export default function ProgressDots({ totalSteps, currentStep }: ProgressDotsProps) {
  return (
    <div className="flex justify-center space-x-2 py-6">
      {Array.from({ length: totalSteps }).map((_, index) => (
        <div
          key={index}
          className={`w-2 h-2 rounded-full transition-all duration-300
            ${index === currentStep 
              ? 'bg-gray-800 scale-125' 
              : index < currentStep 
                ? 'bg-gray-400' 
                : 'bg-gray-200'}`}
        />
      ))}
    </div>
  );
}
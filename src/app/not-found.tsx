import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "404 - Page Not Found",
};

export default function NotFound() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 dark:text-gray-100">
          404 ERROR
        </h1>
        <p className="text-3xl md:text-4xl mt-4 font-light text-gray-800 dark:text-gray-200">
          This page has become unburdened by what has been.
        </p>
        <Link 
          href="/content" 
          className="inline-flex items-center mt-8 px-8 py-4 text-xl font-medium text-white rounded-full transition-colors"
          style={{ backgroundColor: 'var(--accent)' }}
        >
          <span className="mr-2">←</span> Return to Content
        </Link>
      </div>
    </div>
  );
} 
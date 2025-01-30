// src/app/ai/components/MarkdownStyles.tsx
'use client';

import type { Components } from 'react-markdown';
import { useTheme } from '@/app/context/ThemeContext';

export const markdownComponents: Components = {
  h1: ({children}) => (
    <h1 className="text-4xl font-bold mb-6 mt-8 dark:text-white light:text-black">
      {children}
    </h1>
  ),
  h2: ({children}) => (
    <h2 className="text-3xl font-bold mb-4 mt-6 dark:text-white light:text-black">
      {children}
    </h2>
  ),
  h3: ({children}) => (
    <h3 className="text-2xl font-bold mb-3 mt-6 dark:text-white light:text-black">
      {children}
    </h3>
  ),
  p: ({children}) => (
    <p className="mb-4 leading-relaxed dark:text-gray-200 light:text-gray-800">
      {children}
    </p>
  ),
  ul: ({children}) => (
    <ul className="list-disc list-inside mb-4 space-y-2">
      {children}
    </ul>
  ),
  ol: ({children}) => (
    <ol className="list-decimal list-inside mb-4 space-y-2">
      {children}
    </ol>
  ),
  li: ({children}) => (
    <li className="ml-4 dark:text-gray-200 light:text-gray-800">
      {children}
    </li>
  ),
  strong: ({children}) => (
    <strong className="font-bold dark:text-white light:text-black">
      {children}
    </strong>
  ),
  em: ({children}) => (
    <em className="italic">
      {children}
    </em>
  ),
  table: ({children}) => (
    <div className="overflow-hidden rounded-lg border my-6 border-[var(--border-color)]">
      <table className="w-full border-collapse">
        {children}
      </table>
    </div>
  ),
  thead: ({children}) => (
    <thead className="bg-[var(--card-bg)]">
      {children}
    </thead>
  ),
  tbody: ({children}) => (
    <tbody>
      {children}
    </tbody>
  ),
  tr: ({children}) => (
    <tr className="border-b border-[var(--border-color)] last:border-b-0">
      {children}
    </tr>
  ),
  th: ({children}) => (
    <th className="p-6 text-left text-lg font-semibold border-r last:border-r-0 
      text-[var(--foreground)] border-[var(--border-color)]">
      {children}
    </th>
  ),
  td: ({children}) => (
    <td className="p-6 border-r last:border-r-0
      text-[var(--foreground)] border-[var(--border-color)]">
      {children}
    </td>
  ),
  code: ({children, className}) => 
    className ? (
      <code className="block bg-gray-800 p-4 rounded-lg text-sm overflow-x-auto my-4 border border-gray-700">
        {children}
      </code>
    ) : (
      <code className="bg-gray-800 px-1.5 py-0.5 rounded text-sm">
        {children}
      </code>
    ),
  blockquote: ({children}) => (
    <blockquote className="border-l-4 border-[var(--border-color)] pl-4 italic my-4 text-[var(--text-secondary)]">
      {children}
    </blockquote>
  ),
  a: ({children, href}) => (
    <a 
      href={href} 
      className="text-blue-400 hover:text-blue-300 underline"
      target="_blank" 
      rel="noopener noreferrer"
    >
      {children}
    </a>
  ),
  hr: () => <hr className="my-8 border-[var(--border-color)]" />,
};
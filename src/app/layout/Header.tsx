'use client';

import { Search, CreditCard, User } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from "@/lib/utils";
import { type Route } from 'next';

interface HeaderProps {
  credits?: number;
}

const categories = [
  { name: 'Content', path: '/training' as Route },
  { name: 'AI Engine', path: '/ai' as Route },
] as const;

export default function Header({ credits = 0 }: HeaderProps) {
  const pathname = usePathname();
  const currentCategory = categories.find(cat => pathname?.startsWith(cat.path));

  return (
    <header className="bg-gradient-to-b from-[#121826] to-[#161c2d] border-b border-[#1e2538] border-b-2">
      <div className="flex h-14 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left Section - Logo */}
        <div className="flex items-center">
          <Link
            href={'/' as Route}
            className="text-lg font-semibold text-gray-100 hover:text-white transition-colors"
          >
            The Persuasion Academy
          </Link>
        </div>

        {/* Center Section - Navigation Categories */}
        <nav className="hidden sm:block">
          <ul className="flex space-x-8">
            {categories.map((category) => (
              <li key={category.path}>
                <Link
                  href={category.path}
                  className={cn(
                    "px-3 py-2 text-sm font-medium transition-colors",
                    pathname?.startsWith(category.path)
                      ? "text-white"
                      : "text-gray-400 hover:text-gray-200"
                  )}
                >
                  {category.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Right Section - Actions */}
        <div className="flex items-center space-x-4">
          <button className="text-gray-400 hover:text-gray-200 transition-colors">
            <Search className="h-5 w-5" />
          </button>
          <div className="flex items-center text-gray-400 hover:text-gray-200 transition-colors">
            <CreditCard className="h-5 w-5 mr-1" />
            <span className="text-sm">{credits}</span>
          </div>
          <button className="text-gray-400 hover:text-gray-200 transition-colors">
            <User className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
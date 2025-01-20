// Header.tsx
'use client';

import { Search, CreditCard, User, Moon, Sun } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from "@/lib/utils";
import { type Route } from 'next';
import { useTheme } from '../context/ThemeContext';
import { useState, useEffect } from 'react';

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
  const [mounted, setMounted] = useState(false);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  const headerClassName = cn(
    "border-b border-b-2",
    theme === 'dark' 
      ? "bg-gradient-to-b from-[#121826] to-[#161c2d] border-[#1e2538]" 
      : "bg-gradient-to-b from-gray-50 to-white border-gray-200"
  );

  const logoClassName = cn(
    "text-lg font-semibold transition-colors",
    theme === 'dark' ? "text-gray-100 hover:text-white" : "text-gray-800 hover:text-gray-900"
  );

  const navLinkClassName = (isActive: boolean) => cn(
    "px-3 py-2 text-sm font-medium transition-colors",
    isActive
      ? theme === 'dark' ? "text-white" : "text-gray-900"
      : theme === 'dark' ? "text-gray-400 hover:text-gray-200" : "text-gray-600 hover:text-gray-800"
  );

  const iconClassName = cn(
    "transition-colors",
    theme === 'dark' ? "text-gray-400 hover:text-gray-200" : "text-gray-600 hover:text-gray-800"
  );

  return (
    <header className={headerClassName}>
      <div className="flex h-14 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left Section - Logo */}
        <div className="flex items-center">
          <Link
            href={'/' as Route}
            className={logoClassName}
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
                  className={navLinkClassName(pathname?.startsWith(category.path))}
                >
                  {category.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Right Section - Actions */}
        <div className="flex items-center space-x-4">
          <button className={iconClassName}>
            <Search className="h-5 w-5" />
          </button>
          <div className={`flex items-center ${iconClassName}`}>
            <CreditCard className="h-5 w-5 mr-1" />
            <span className="text-sm">{credits}</span>
          </div>
          {mounted && (
            <button 
              onClick={toggleTheme}
              className={iconClassName}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </button>
          )}
          <button className={iconClassName}>
            <User className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
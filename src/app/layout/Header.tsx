// Header.tsx
'use client';

import { Search, CreditCard, User, Moon, Sun } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from "@/lib/utils";
import { type Route } from 'next';
import { useTheme } from '../context/ThemeContext';
import { useState, useEffect, useRef } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

const categories = [
  { name: 'Content', path: '/content' as Route },
  { name: 'AI Engine', path: '/ai' as Route },
] as const;

interface CreditBalance {
  total: number;
  subscription_credits: number;
  additional_credits: number;
}

export default function Header() {
  const pathname = usePathname();
  const currentCategory = categories.find(cat => pathname?.startsWith(cat.path));
  const [mounted, setMounted] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const [credits, setCredits] = useState<CreditBalance>({ total: 0, subscription_credits: 0, additional_credits: 0 });
  const [showCreditsDropdown, setShowCreditsDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowCreditsDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch credits on mount
  useEffect(() => {
    setMounted(true);
    const fetchCredits = async () => {
      try {
        const supabase = createClientComponentClient();
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          const { data, error } = await supabase
            .rpc('get_total_credits', {
              user_id: session.user.id
            });
          
          if (!error && data) {
            setCredits(data);
          }
        }
      } catch (err) {
        console.error('Unexpected error:', err);
      }
    };

    fetchCredits();
  }, []);

  const headerClassName = cn(
    "border-b border-b-2",
    "border-[var(--border-color)]",
    "bg-[var(--card-bg)]"
  );

  const logoClassName = cn(
    "text-lg font-semibold transition-colors",
    "text-[var(--foreground)] hover:text-[var(--foreground)]"
  );

  const navLinkClassName = (isActive: boolean) => cn(
    "px-3 py-2 text-sm font-medium transition-colors",
    isActive
      ? "text-[var(--foreground)]"
      : "text-[var(--text-secondary)] hover:text-[var(--foreground)]"
  );

  const iconClassName = cn(
    "transition-colors",
    "text-[var(--text-secondary)] hover:text-[var(--foreground)]"
  );

  const dropdownClassName = cn(
    "absolute right-0 top-full mt-2 w-64 rounded-md shadow-lg",
    "bg-[var(--card-bg)] border border-[var(--border-color)]",
    "py-2 px-3",
    "z-50"
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
          <div className="relative" ref={dropdownRef}>
            <button 
              className={`flex items-center ${iconClassName}`}
              onClick={() => setShowCreditsDropdown(!showCreditsDropdown)}
            >
              <CreditCard className="h-5 w-5 mr-1" />
              <span className="text-sm">{credits.total.toLocaleString()}</span>
            </button>
            
            {showCreditsDropdown && (
              <div className={dropdownClassName}>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--text-secondary)]">Subscription Credits</span>
                    <span>{credits.subscription_credits.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--text-secondary)]">Additional Credits</span>
                    <span>{credits.additional_credits.toLocaleString()}</span>
                  </div>
                  <div className="my-2 border-t border-[var(--border-color)]" />
                  <div className="flex justify-between text-sm font-medium">
                    <span className="text-[var(--text-secondary)]">Total Credits</span>
                    <span>{credits.total.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )}
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
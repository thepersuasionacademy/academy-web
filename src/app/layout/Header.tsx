'use client';

import { CreditCard, User, Moon, Sun, LogOut } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from "@/lib/utils";
import { type Route } from 'next';
import { useTheme } from '../context/ThemeContext';
import { useState, useEffect, useRef } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface CreditBalance {
  total: number;
  subscription_credits: number;
  additional_credits: number;
}

interface Category {
  name: string;
  path: Route;
}

export default function Header() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const [credits, setCredits] = useState<CreditBalance>({ total: 0, subscription_credits: 0, additional_credits: 0 });
  const [showCreditsDropdown, setShowCreditsDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  
  const baseCategories: Category[] = [
    { name: 'Content', path: '/content' as Route },
    { name: 'AI Engine', path: '/ai' as Route },
    { name: 'Testimonials', path: '/testimonials' as Route },
  ];
  
  const [categories, setCategories] = useState<Category[]>(baseCategories);

  // Update categories when theme changes
  useEffect(() => {
    const updatedBaseCategories = [
      { name: 'Content', path: '/content' as Route },
      { name: 'AI Engine', path: '/ai' as Route },
      { name: 'Testimonials', path: '/testimonials' as Route },
    ];
    
    if (isAdmin) {
      setCategories([
        ...updatedBaseCategories,
        { name: 'Admin', path: '/admin' as Route }
      ]);
    } else {
      setCategories(updatedBaseCategories);
    }
  }, [isAdmin]);

  // Combined effect for mount and initial data fetching
  useEffect(() => {
    const initializeHeader = async () => {
      setMounted(true);
      try {
        const supabase = createClientComponentClient();
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          // Fetch credits
          const { data: creditsData, error: creditsError } = await supabase
            .rpc('get_total_credits', {
              user_id: session.user.id
            });
          
          if (!creditsError && creditsData) {
            setCredits(creditsData);
          }

          // Check admin status
          const { data: isAdminResult, error: adminError } = await supabase
            .rpc('is_admin');
          
          const { data: isSuperAdminResult, error: superAdminError } = await supabase
            .rpc('is_super_admin');
          
          console.log('Admin check result:', isAdminResult);
          console.log('Super admin check result:', isSuperAdminResult);
          
          if ((!adminError && isAdminResult) || (!superAdminError && isSuperAdminResult)) {
            console.log('Setting admin status to true');
            setIsAdmin(true);
          }
        }
      } catch (err) {
        console.error('Error initializing header:', err);
      }
    };

    initializeHeader();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowCreditsDropdown(false);
      }
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setShowProfileDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      const supabase = createClientComponentClient();
      await supabase.auth.signOut();
      // Clear any stored auth data
      localStorage.clear();
      // Use window.location.href to force a full page reload
      window.location.href = '/auth/login';
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const headerClassName = cn(
    "z-50",
    "border-b border-[var(--border-color)]",
    "bg-[#fafafa] dark:bg-[var(--background)]",
    "transition-colors duration-300"
  );

  const logoClassName = cn(
    "text-lg font-semibold transition-colors",
    "text-[var(--foreground)] hover:text-[var(--foreground)]"
  );

  const navLinkClassName = (isActive: boolean) => cn(
    "px-3 h-14 flex items-center text-base font-medium transition-colors relative",
    isActive && "after:absolute after:bottom-[-2px] after:left-0 after:right-0 after:h-[3px] after:bg-[var(--accent)]",
    isActive
      ? "text-[var(--foreground)] font-semibold"
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
    "z-[60]"
  );

  const profileDropdownClassName = cn(
    "absolute right-0 top-full mt-2 w-36 rounded-md shadow-lg",
    "bg-[var(--card-bg)] border border-[var(--border-color)]",
    "py-2 px-2",
    "z-[60]"
  );

  const handleCategoryClick = (path: string, e: React.MouseEvent) => {
    if (path.startsWith('http')) {
      e.preventDefault();
      window.open(path, '_blank');
    }
  };

  return (
    <header className={headerClassName}>
      <div className="flex h-14 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left Section - Logo and Navigation */}
        <div className="flex items-center h-full">
          <Link
            href={'/' as Route}
            className={logoClassName}
          >
            The Persuasion Academy
          </Link>

          {/* Navigation Categories */}
          <nav className="hidden sm:block h-full ml-8">
            <ul className="flex space-x-8 h-full">
              {categories.map((category) => (
                <li key={category.path} className="h-full">
                  <Link
                    href={category.path}
                    onClick={(e) => handleCategoryClick(category.path, e)}
                    className={navLinkClassName(pathname?.startsWith(category.path))}
                  >
                    {category.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* Right Section - Actions */}
        <div className="flex items-center space-x-4">
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
          <div className="relative" ref={profileDropdownRef}>
            <button 
              className={`flex items-center ${iconClassName}`}
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
            >
              <User className="h-5 w-5" />
            </button>
            
            {showProfileDropdown && (
              <div className={profileDropdownClassName}>
                <div className="space-y-1">
                  <Link
                    href="/profile"
                    className="flex items-center px-3 py-2 text-sm rounded-md hover:bg-[var(--hover-bg)] transition-colors cursor-pointer"
                  >
                    <User className="h-4 w-4 mr-2" />
                    <span>My Profile</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full px-3 py-2 text-sm rounded-md hover:bg-[var(--hover-bg)] transition-colors cursor-pointer text-red-500 hover:text-red-600"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
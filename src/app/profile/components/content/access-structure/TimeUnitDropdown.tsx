import { useState, useEffect, useRef } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from "@/lib/utils";
import { TimeUnitDropdownProps } from './types';

export function TimeUnitDropdown({ value, onChange, disabled, inputValue }: TimeUnitDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getSingularForm = (unit: string) => {
    return unit.endsWith('s') ? unit.slice(0, -1) : unit;
  };

  const options = [
    { value: 'days', label: 'days' },
    { value: 'weeks', label: 'weeks' },
    { value: 'months', label: 'months' }
  ];

  const displayValue = inputValue === 1 ? getSingularForm(value) : value;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-1 text-base transition-colors",
          disabled 
            ? "text-[var(--muted-foreground)]/40 cursor-not-allowed" 
            : "text-[var(--foreground)]"
        )}
      >
        <span>{displayValue}</span>
        <ChevronDown className={cn(
          "h-3 w-3",
          disabled 
            ? "opacity-40"
            : "text-[var(--muted-foreground)]"
        )} />
      </button>
      
      {!disabled && isOpen && (
        <div className="absolute right-0 z-10 mt-1 min-w-[100px] py-1 bg-[var(--background)] border border-[var(--border-color)] rounded-md shadow-lg">
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                onChange(option.value as 'days' | 'weeks' | 'months');
                setIsOpen(false);
              }}
              className="flex items-center gap-2 w-full px-3 py-1.5 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
            >
              <span className="w-4">
                {option.value === value && (
                  <Check className="h-3 w-3 text-[var(--accent)]" />
                )}
              </span>
              {inputValue === 1 ? getSingularForm(option.label) : option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
} 
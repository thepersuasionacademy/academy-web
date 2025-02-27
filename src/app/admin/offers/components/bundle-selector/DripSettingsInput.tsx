import { DripSetting } from './types';
import { TimeUnitDropdown } from '@/app/profile/components/content/access-structure/TimeUnitDropdown';

interface DripSettingsInputProps {
  value: DripSetting;
  onChange: (value: number) => void;
  onUnitChange: (unit: 'days' | 'weeks' | 'months') => void;
  disabled?: boolean;
}

export function DripSettingsInput({ 
  value, 
  onChange, 
  onUnitChange, 
  disabled = false 
}: DripSettingsInputProps) {
  return (
    <div className="flex items-center gap-0">
      <input
        type="number"
        min="1"
        value={value.value}
        onChange={(e) => onChange(parseInt(e.target.value) || 1)}
        disabled={disabled}
        className="w-12 px-1 py-1 text-sm bg-transparent border border-[var(--border-color)] rounded-l text-right focus:outline-none focus:border-[var(--accent)] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />
      <TimeUnitDropdown
        value={value.unit}
        onChange={onUnitChange}
        disabled={disabled}
        inputValue={value.value}
      />
    </div>
  );
} 
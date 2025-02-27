// Simple test component to verify drip settings persistence when toggling dropdowns
'use client';

import { useState } from 'react';
import { DripSetting } from './types';

export default function TestDripSettings() {
  // Initial drip settings state
  const [dripSettings, setDripSettings] = useState<DripSetting>({
    value: 30,
    unit: 'days'
  });
  
  // Dropdown state
  const [isOpen, setIsOpen] = useState(false);
  
  // Log whenever drip settings change
  const updateDripValue = (value: number) => {
    console.log(`Setting drip value to: ${value} ${dripSettings.unit}`);
    setDripSettings(prev => ({ ...prev, value }));
  };
  
  const updateDripUnit = (unit: 'days' | 'weeks' | 'months') => {
    console.log(`Setting drip unit to: ${dripSettings.value} ${unit}`);
    setDripSettings(prev => ({ ...prev, unit }));
  };
  
  // Toggle dropdown
  const toggleDropdown = () => {
    console.log(`${isOpen ? 'Closing' : 'Opening'} dropdown - current drip settings: ${dripSettings.value} ${dripSettings.unit}`);
    setIsOpen(!isOpen);
  };
  
  return (
    <div className="p-6 max-w-md mx-auto">
      <h1 className="text-xl font-bold mb-4">Drip Settings Test</h1>
      
      <div className="mb-4 border p-4 rounded">
        <h2 className="font-medium mb-2">Current Settings:</h2>
        <p>Value: {dripSettings.value}</p>
        <p>Unit: {dripSettings.unit}</p>
      </div>
      
      <button 
        onClick={toggleDropdown}
        className="px-4 py-2 bg-blue-500 text-white rounded mb-4"
      >
        {isOpen ? 'Close Dropdown' : 'Open Dropdown'}
      </button>
      
      {isOpen && (
        <div className="border p-4 rounded drip-settings-container">
          <h2 className="font-medium mb-2">Edit Settings:</h2>
          <div className="flex items-center gap-2 mb-2">
            <label>Value:</label>
            <input 
              type="number" 
              value={dripSettings.value}
              onChange={(e) => updateDripValue(parseInt(e.target.value) || 1)}
              className="border px-2 py-1 rounded w-20"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <label>Unit:</label>
            <select
              value={dripSettings.unit}
              onChange={(e) => updateDripUnit(e.target.value as 'days' | 'weeks' | 'months')}
              className="border px-2 py-1 rounded"
            >
              <option value="days">Days</option>
              <option value="weeks">Weeks</option>
              <option value="months">Months</option>
            </select>
          </div>
        </div>
      )}
      
      <div className="mt-4 text-sm text-gray-600">
        <p>Instructions:</p>
        <ol className="list-decimal pl-4">
          <li>Open the dropdown and change some settings</li>
          <li>Close the dropdown - check console for logged values</li>
          <li>Open the dropdown again - settings should be preserved</li>
        </ol>
      </div>
    </div>
  );
}

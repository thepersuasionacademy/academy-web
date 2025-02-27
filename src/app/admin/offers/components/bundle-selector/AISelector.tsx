import { useState } from 'react';
import { AICategory, AISuite, AITool, DripSetting } from './types';
import { CategorySelector } from './CategorySelector';
import { SuiteSelector } from './SuiteSelector';
import { ToolSelector } from './ToolSelector';

interface AISelectorProps {
  onComplete: (data: {
    categoryId: string;
    categoryName: string;
    suiteId?: string;
    suiteName?: string;
    toolIds: string[];
    dripSettings: {
      collectionDrip?: DripSetting;
      suiteDrip?: DripSetting;
      toolDrip?: Record<string, DripSetting>;
    };
  }) => void;
  initialData?: {
    categoryId?: string;
    categoryName?: string;
    suiteId?: string;
    suiteName?: string;
    toolIds?: string[];
    collectionDripSettings?: DripSetting;
    suiteDripSettings?: DripSetting;
    toolDripSettings?: Record<string, DripSetting>;
  };
}

export function AISelector({ onComplete, initialData }: AISelectorProps) {
  // Category state
  const [selectedCategoryId, setSelectedCategoryId] = useState(initialData?.categoryId || null);
  const [selectedCategoryName, setSelectedCategoryName] = useState(initialData?.categoryName || null);
  
  // Suite state
  const [selectedSuiteId, setSelectedSuiteId] = useState(initialData?.suiteId || null);
  const [selectedSuiteName, setSelectedSuiteName] = useState(initialData?.suiteName || null);
  
  // Tool state
  const [selectedToolIds, setSelectedToolIds] = useState<Record<string, boolean>>(
    initialData?.toolIds?.reduce((acc, id) => ({ ...acc, [id]: true }), {}) || {}
  );
  
  // Drip settings state
  const [collectionDripEnabled, setCollectionDripEnabled] = useState(
    !!initialData?.collectionDripSettings
  );
  const [collectionDripSettings, setCollectionDripSettings] = useState<DripSetting>(
    initialData?.collectionDripSettings || { value: 1, unit: 'days' }
  );
  
  const [suiteDripEnabled, setSuiteDripEnabled] = useState(
    !!initialData?.suiteDripSettings
  );
  const [suiteDripSettings, setSuiteDripSettings] = useState<DripSetting>(
    initialData?.suiteDripSettings || { value: 1, unit: 'days' }
  );
  
  const [toolDripEnabled, setToolDripEnabled] = useState<Record<string, boolean>>(
    initialData?.toolDripSettings
      ? Object.keys(initialData.toolDripSettings).reduce((acc, id) => ({ ...acc, [id]: true }), {})
      : {}
  );
  const [toolDripSettings, setToolDripSettings] = useState<Record<string, DripSetting>>(
    initialData?.toolDripSettings || {}
  );

  // Handle category selection
  const handleCategorySelect = (category: AICategory) => {
    setSelectedCategoryId(category.id);
    setSelectedCategoryName(category.title);
    
    // Reset suite and tool selections when category changes
    setSelectedSuiteId(null);
    setSelectedSuiteName(null);
    setSelectedToolIds({});
  };

  // Handle category reset
  const handleCategoryReset = () => {
    setSelectedCategoryId(null);
    setSelectedCategoryName(null);
    setSelectedSuiteId(null);
    setSelectedSuiteName(null);
    setSelectedToolIds({});
    setCollectionDripEnabled(false);
  };

  // Handle suite selection
  const handleSuiteSelect = (suite: AISuite) => {
    setSelectedSuiteId(suite.id);
    setSelectedSuiteName(suite.title);
    
    // Reset tool selections when suite changes
    setSelectedToolIds({});
  };

  // Handle suite reset
  const handleSuiteReset = () => {
    setSelectedSuiteId(null);
    setSelectedSuiteName(null);
    setSelectedToolIds({});
    setSuiteDripEnabled(false);
  };

  // Handle tool selection
  const handleToolSelect = (tool: AITool) => {
    setSelectedToolIds(prev => ({
      ...prev,
      [tool.id]: true
    }));
    
    // Initialize drip settings for this tool
    if (!toolDripSettings[tool.id]) {
      setToolDripSettings(prev => ({
        ...prev,
        [tool.id]: { value: 1, unit: 'days' }
      }));
    }
  };

  // Handle tool removal
  const handleToolRemove = (toolId: string) => {
    const newToolIds = { ...selectedToolIds };
    delete newToolIds[toolId];
    setSelectedToolIds(newToolIds);
    
    // Remove drip settings for this tool
    if (toolDripEnabled[toolId]) {
      const newToolDripEnabled = { ...toolDripEnabled };
      delete newToolDripEnabled[toolId];
      setToolDripEnabled(newToolDripEnabled);
    }
    
    const newToolDripSettings = { ...toolDripSettings };
    delete newToolDripSettings[toolId];
    setToolDripSettings(newToolDripSettings);
  };

  // Handle drip settings
  const toggleCollectionDrip = () => {
    const newValue = !collectionDripEnabled;
    console.log(`🔥 COLLECTION DRIP TOGGLED: ${newValue ? 'ENABLED' : 'DISABLED'}`);
    setCollectionDripEnabled(newValue);
    if (newValue) {
      // Disable suite and tool drip when collection drip is enabled
      console.log(`🔥 DISABLING SUITE/TOOL DRIPS (Collection drip enabled)`);
      setSuiteDripEnabled(false);
      setToolDripEnabled({});
    }
  };

  const updateCollectionDripValue = (value: number) => {
    console.log(`🔥 COLLECTION DRIP VALUE CHANGED: ${value} ${collectionDripSettings.unit}`);
    setCollectionDripSettings(prev => ({ ...prev, value }));
  };

  const updateCollectionDripUnit = (unit: 'days' | 'weeks' | 'months') => {
    console.log(`🔥 COLLECTION DRIP UNIT CHANGED: ${collectionDripSettings.value} ${unit}`);
    setCollectionDripSettings(prev => ({ ...prev, unit }));
  };

  const toggleSuiteDrip = () => {
    const newValue = !suiteDripEnabled;
    console.log(`🔥 SUITE DRIP TOGGLED: ${newValue ? 'ENABLED' : 'DISABLED'}`);
    setSuiteDripEnabled(newValue);
    if (newValue) {
      // Disable tool drip when suite drip is enabled
      console.log(`🔥 DISABLING TOOL DRIPS (Suite drip enabled)`);
      setToolDripEnabled({});
    }
  };

  const updateSuiteDripValue = (value: number) => {
    console.log(`🔥 SUITE DRIP VALUE CHANGED: ${value} ${suiteDripSettings.unit}`);
    setSuiteDripSettings(prev => ({ ...prev, value }));
  };

  const updateSuiteDripUnit = (unit: 'days' | 'weeks' | 'months') => {
    console.log(`🔥 SUITE DRIP UNIT CHANGED: ${suiteDripSettings.value} ${unit}`);
    setSuiteDripSettings(prev => ({ ...prev, unit }));
  };

  const toggleToolDrip = (toolId: string) => {
    setToolDripEnabled(prev => ({
      ...prev,
      [toolId]: !prev[toolId]
    }));
  };

  const updateToolDripValue = (toolId: string, value: number) => {
    setToolDripSettings(prev => ({
      ...prev,
      [toolId]: { ...prev[toolId], value }
    }));
  };

  const updateToolDripUnit = (toolId: string, unit: 'days' | 'weeks' | 'months') => {
    setToolDripSettings(prev => ({
      ...prev,
      [toolId]: { ...prev[toolId], unit }
    }));
  };

  // Create final data structure for submission
  const handleSubmit = () => {
    console.log('AISelector handleSubmit called');
    
    if (!selectedCategoryId || !selectedSuiteId || Object.keys(selectedToolIds).filter(id => selectedToolIds[id]).length === 0) {
      console.error('Cannot submit, missing required selections');
      return;
    }
    
    // Create drip settings object - ensure it matches DripSetting type
    const dripSettings: {
      collectionDrip?: DripSetting;
      suiteDrip?: DripSetting;
      toolDrip?: Record<string, DripSetting>;
    } = {};
    
    // Collection level drip
    if (collectionDripEnabled && collectionDripSettings.value && collectionDripSettings.unit) {
      console.log(`  Collection drip: ${collectionDripSettings.value} ${collectionDripSettings.unit}`);
      dripSettings.collectionDrip = collectionDripSettings;
    }
    
    // Suite level drip
    if (suiteDripEnabled && suiteDripSettings.value && suiteDripSettings.unit) {
      console.log(`  Suite drip: ${suiteDripSettings.value} ${suiteDripSettings.unit}`);
      dripSettings.suiteDrip = suiteDripSettings;
    }
    
    // Tool level drips
    const toolDrips: Record<string, DripSetting> = {};
    Object.keys(toolDripEnabled)
      .filter(id => toolDripEnabled[id] && selectedToolIds[id])
      .forEach(id => {
        if (toolDripSettings[id]?.value && toolDripSettings[id]?.unit) {
          toolDrips[id] = toolDripSettings[id];
          console.log(`  Tool drip for ${id}: ${toolDripSettings[id].value} ${toolDripSettings[id].unit}`);
        }
      });
    
    if (Object.keys(toolDrips).length > 0) {
      dripSettings.toolDrip = toolDrips;
      console.log(`Found ${Object.keys(toolDrips).length} tool drips`);
    }
    
    // Build the complete data structure for submission
    const toolIds = Object.keys(selectedToolIds).filter(id => selectedToolIds[id]);
    const data = {
      categoryId: selectedCategoryId,
      categoryName: selectedCategoryName!,
      suiteId: selectedSuiteId,
      suiteName: selectedSuiteName!,
      toolIds,
      dripSettings
    };
    
    console.log('💧 Final drip settings object:', dripSettings);
    console.log('Complete AISelector submission data:', data);
    onComplete(data);
  };

  return (
    <div className="w-full space-y-6">
      {/* Category Selector */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-[var(--text-secondary)]">Choose Category</h3>
        <CategorySelector 
          selectedCategoryId={selectedCategoryId}
          selectedCategoryName={selectedCategoryName}
          onCategorySelect={handleCategorySelect}
          onCategoryReset={handleCategoryReset}
          collectionDripEnabled={collectionDripEnabled}
          toggleCollectionDrip={toggleCollectionDrip}
          collectionDripSettings={collectionDripSettings}
          updateCollectionDripValue={updateCollectionDripValue}
          updateCollectionDripUnit={updateCollectionDripUnit}
        />
      </div>
      
      {/* Suite Selector (only shown if category is selected) */}
      {selectedCategoryId && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-[var(--text-secondary)]">Choose Suite (Optional)</h3>
          <SuiteSelector 
            categoryId={selectedCategoryId}
            selectedSuiteId={selectedSuiteId}
            selectedSuiteName={selectedSuiteName}
            onSuiteSelect={handleSuiteSelect}
            onSuiteReset={handleSuiteReset}
            suiteDripEnabled={suiteDripEnabled}
            toggleSuiteDrip={toggleSuiteDrip}
            suiteDripSettings={suiteDripSettings}
            updateSuiteDripValue={updateSuiteDripValue}
            updateSuiteDripUnit={updateSuiteDripUnit}
            collectionDripEnabled={collectionDripEnabled}
          />
        </div>
      )}
      
      {/* Tool Selector (only shown if category is selected) */}
      {selectedCategoryId && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-[var(--text-secondary)]">Select Tools</h3>
          <ToolSelector 
            suiteId={selectedSuiteId}
            selectedToolIds={selectedToolIds}
            onToolSelect={handleToolSelect}
            onToolRemove={handleToolRemove}
            toolDripSettings={toolDripSettings}
            toolDripEnabled={toolDripEnabled}
            toggleToolDrip={toggleToolDrip}
            updateToolDripValue={updateToolDripValue}
            updateToolDripUnit={updateToolDripUnit}
            collectionDripEnabled={collectionDripEnabled}
            suiteDripEnabled={suiteDripEnabled}
          />
        </div>
      )}
      
      {/* Complete Button */}
      {selectedCategoryId && Object.keys(selectedToolIds).length > 0 && (
        <div className="pt-4">
          <button
            onClick={handleSubmit}
            className="w-full py-3 px-4 bg-[var(--accent)] text-white rounded-lg font-medium hover:bg-[var(--accent)]/90 transition-colors"
          >
            Complete AI Selection
          </button>
        </div>
      )}
    </div>
  );
} 
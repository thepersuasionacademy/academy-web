import { Template } from './types';

// Helper function to extract drip settings from access_overrides
export const extractDripSettings = (template: any) => {
  if (!template?.access_overrides?.media) return undefined;
  
  const dripSettings: Record<string, { unit: 'days' | 'weeks' | 'months', value: number }> = {};
  let collectionDripSettings = undefined;
  let suiteDripSettings = undefined;
  
  // Check which items have drip settings in the media overrides
  Object.entries(template.access_overrides.media).forEach(([itemId, settings]: [string, any]) => {
    if (settings?.delay && settings.status === 'pending') {
      // Check if this is a collection ID (matches the template's categoryId)
      if (template.categoryId === itemId) {
        collectionDripSettings = {
          unit: settings.delay.unit as 'days' | 'weeks' | 'months',
          value: settings.delay.value
        };
      }
      // Check if this is a suite ID (matches the template's suiteId)
      else if (template.suiteId === itemId) {
        suiteDripSettings = {
          unit: settings.delay.unit as 'days' | 'weeks' | 'months',
          value: settings.delay.value
        };
      }
      // Otherwise, it's a tool ID
      else {
        dripSettings[itemId] = {
          unit: settings.delay.unit as 'days' | 'weeks' | 'months',
          value: settings.delay.value
        };
      }
    }
  });
  
  return { 
    toolDripSettings: Object.keys(dripSettings).length > 0 ? dripSettings : undefined,
    collectionDripSettings,
    suiteDripSettings
  };
};

// Helper function to merge AI templates by suite
export const getMergedTemplates = (templates: Template[]): Template[] => {
  if (!templates || templates.length === 0) return [];
  
  // First, separate AI and non-AI templates
  const aiTemplates = templates.filter(t => t.type === 'ai');
  const nonAiTemplates = templates.filter(t => t.type !== 'ai');
  
  // Group AI templates by suite ID
  const templatesBySuite: Record<string, Template[]> = {};
  
  aiTemplates.forEach(template => {
    if (template.suiteId) {
      const key = `${template.categoryId}-${template.suiteId}`;
      if (!templatesBySuite[key]) {
        templatesBySuite[key] = [];
      }
      templatesBySuite[key].push(template);
    } else {
      // For templates without a suite (like category-level templates), treat individually
      const key = `${template.categoryId}-individual-${template.id}`;
      templatesBySuite[key] = [template];
    }
  });
  
  // Create merged templates for suites with multiple tools
  const mergedAiTemplates: Template[] = [];
  
  Object.keys(templatesBySuite).forEach(key => {
    const suiteTemplates = templatesBySuite[key];
    
    if (suiteTemplates.length === 1) {
      // Only one template for this suite, no merging needed
      mergedAiTemplates.push(suiteTemplates[0]);
    } else if (suiteTemplates.length > 1) {
      // Multiple templates for this suite, merge them
      const first = suiteTemplates[0];
      const toolIds = suiteTemplates.map(t => t.toolIds || []).flat().filter(Boolean);
      const toolNames = suiteTemplates.map(t => t.toolNames || []).flat().filter(Boolean);
      
      // Create a merged template
      const mergedTemplate: Template = {
        id: `merged-${first.suiteId}`,
        type: 'ai',
        name: first.suiteName || 'AI Suite',
        description: `${toolNames.length} tools from ${first.suiteName}`,
        categoryId: first.categoryId,
        categoryName: first.categoryName,
        suiteId: first.suiteId,
        suiteName: first.suiteName,
        // Include all tool IDs and names
        toolIds: toolIds,
        toolNames: toolNames,
        // Store original templates for reference when expanded
        originalTemplates: suiteTemplates
      };
      
      mergedAiTemplates.push(mergedTemplate);
    }
  });
  
  // Combine merged AI templates with non-AI templates
  return [...mergedAiTemplates, ...nonAiTemplates];
};

// Function to prepare templates for saving by consolidating drip settings
export const prepareTemplatesForSaving = (templates: Template[]) => {
  return templates.map(template => {
    if (template.type !== 'ai') return template;
    
    // Collection, suite, and tool level drip settings can all be present
    let hasAnyDripSettings = false;
    const mediaOverrides: Record<string, { delay?: { unit: string; value: number }, status: string }> = {
      ...(template.access_overrides?.media || {})
    };
    
    // Collection level drip
    if (template.collectionDripSettings && template.categoryId) {
      hasAnyDripSettings = true;
      mediaOverrides[template.categoryId] = {
        delay: {
          unit: template.collectionDripSettings.unit,
          value: template.collectionDripSettings.value
        },
        status: 'pending'
      };
    }
    
    // Suite level drip
    if (template.suiteDripSettings && template.suiteId) {
      hasAnyDripSettings = true;
      mediaOverrides[template.suiteId] = {
        delay: {
          unit: template.suiteDripSettings.unit,
          value: template.suiteDripSettings.value
        },
        status: 'pending'
      };
    }
    
    // Tool level drip
    if (template.dripSettings && Object.keys(template.dripSettings).length > 0) {
      hasAnyDripSettings = true;
      // Add each tool drip setting
      Object.entries(template.dripSettings).forEach(([toolId, setting]) => {
        mediaOverrides[toolId] = {
          delay: {
            unit: setting.unit,
            value: setting.value
          },
          status: 'pending'
        };
      });
    }
    
    // Return template with updated access_overrides
    if (hasAnyDripSettings) {
      return {
        ...template,
        access_overrides: {
          ...(template.access_overrides || {}),
          media: mediaOverrides
        }
      };
    }
    
    return template;
  });
}; 
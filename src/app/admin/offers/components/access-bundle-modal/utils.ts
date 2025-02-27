import { Template } from './types';

// Helper function to extract drip settings from access_overrides
export const extractDripSettings = (template: Template): Template['access_overrides'] => {
  // If template already has access_overrides, return it
  if (template.access_overrides) {
    return template.access_overrides;
  }
  
  // For content templates, create standard media wrapper
  if (template.type === 'content') {
    return { media: {} };
  }
  
  // For AI templates, create an empty access_overrides object
  return { media: {} };
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

// Take AI template objects and ensure all associated data is correctly formatted for saving
export function prepareTemplatesForSaving(templates: any[]): any[] {
  console.log(`🔥 PREPARING TEMPLATES FOR SAVING - COUNT: ${templates.length}`);
  
  return templates.map(template => {
    try {
      console.log(`🔄 Processing template: ${template.id} (${template.type}) with name: ${template.name}`);
      
      // Skip processing for non-AI templates - they're already properly formatted
      if (template.type !== 'ai') {
        console.log(`  Skipping non-AI template: ${template.name}`);
        return template;
      }

      // For AI templates, we need to ensure access_overrides are properly set
      // Debug the template's drip settings
      console.log(`  Drip settings debug for ${template.name}: {` +
        `collection: ${template.hasCollectionDrip ? 'YES' : 'NONE'}, ` +
        `suite: ${template.hasSuiteDrip ? 'YES' : 'NONE'}, ` + 
        `tools: ${template.hasToolDrip ? 'YES' : 'NONE'}}`);
      
      // Create fresh access_overrides - NO MEDIA OBJECT FOR AI TEMPLATES
      const access_overrides: Record<string, any> = {};
      let foundDripSettings = false;
      
      // Add collection level drip if present
      if (template.hasCollectionDrip && template.collectionDripSettings) {
        console.log(`  ✅ Adding collection drip: ${template.collectionDripSettings.value} ${template.collectionDripSettings.unit}`);
        if (template.categoryId) {
          access_overrides[template.categoryId] = {
            delay: {
              value: template.collectionDripSettings.value,
              unit: template.collectionDripSettings.unit
            },
            status: "enabled"
          };
          foundDripSettings = true;
        }
      }
      
      // Add suite level drip if present
      if (template.hasSuiteDrip && template.suiteDripSettings) {
        console.log(`  ✅ Adding suite drip: ${template.suiteDripSettings.value} ${template.suiteDripSettings.unit}`);
        if (template.suiteId) {
          access_overrides[template.suiteId] = {
            delay: {
              value: template.suiteDripSettings.value,
              unit: template.suiteDripSettings.unit
            },
            status: "enabled"
          };
          foundDripSettings = true;
        }
      }
      
      // Add tool level drips if present
      if (template.hasToolDrip && template.toolDripSettings) {
        Object.keys(template.toolDripSettings).forEach(toolId => {
          console.log(`  ✅ Adding tool drip for ${toolId}: ${template.toolDripSettings[toolId].value} ${template.toolDripSettings[toolId].unit}`);
          access_overrides[toolId] = {
            delay: {
              value: template.toolDripSettings[toolId].value,
              unit: template.toolDripSettings[toolId].unit
            },
            status: "enabled"
          };
          foundDripSettings = true;
        });
      }
      
      // If no drip settings were found, add a placeholder to ensure the field exists
      if (!foundDripSettings) {
        console.log(`  ⚠️ NO DRIP SETTINGS FOUND - adding placeholder`);
        access_overrides["__placeholder"] = { status: "enabled" };
      }
      
      // Set the access_overrides property directly - NO MEDIA WRAPPING
      console.log(`  📊 Final access_overrides contains ${Object.keys(access_overrides).length} items`);
      console.log(`  📊 access_overrides keys: ${Object.keys(access_overrides).join(', ')}`);
      
      return {
        ...template,
        access_overrides
      };
    } catch (error) {
      console.error(`Error preparing template ${template.name}:`, error);
      // Return the template with a valid access_overrides structure even in error case
      return {
        ...template,
        access_overrides: { "__error_placeholder": { status: "enabled" } }
      };
    }
  });
} 
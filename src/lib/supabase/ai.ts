import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export type AIToolStatus = 'draft' | 'published' | 'archived' | 'maintenance';

export interface AICollection {
  id: string;
  title: string | null;
  created_at: string;
  updated_at: string;
}

export interface AISuite {
  id: string;
  collection_id: string | null;
  title: string | null;
  created_at: string;
  updated_at: string;
}

export interface AITool {
  id: string;
  title: string;
  description: string;
  credits_cost: number;
  collection_title: string | null;
  suite_title: string | null;
  inputs: AIInput[];
  status?: AIToolStatus;
  prompts?: AIPrompt[]; // Only populated for super admins
}

export interface AIInput {
  id: string;
  tool_id: string | null;
  input_order: number;
  input_name: string | null;
  input_description: string | null;
  is_required: boolean;
  created_at: string;
  updated_at: string;
}

export interface AIPrompt {
  id: string;
  tool_id: string | null;
  prompt_order: number;
  prompt_text: string | null;
  created_at: string;
  updated_at: string;
}

export interface AIToolWithPermissions extends AITool {
  can_edit: boolean;
}

// Function to get all collections
export async function getAICollections() {
  const supabase = createClientComponentClient();
  const { data: collections, error } = await supabase
    .rpc('list_collections');

  if (error) {
    console.error('Error fetching AI collections:', error);
    throw error;
  }

  return collections;
}

// Function to get suites for a collection
export async function getAISuites(collectionId: string) {
  const supabase = createClientComponentClient();
  const { data: suites, error } = await supabase
    .rpc('get_suites_by_collection', { collection_id: collectionId });

  if (error) {
    console.error('Error fetching AI suites:', error);
    throw error;
  }

  return suites;
}

// Function to get tools for a suite
export async function getAITools(suiteId: string) {
  const supabase = createClientComponentClient();
  const { data: tools, error } = await supabase
    .rpc('get_tools_by_suite', { suite_id: suiteId });

  if (error) {
    console.error('Error fetching AI tools:', error);
    throw error;
  }

  return tools;
}

// Function to get a specific tool with its inputs
export async function getAITool(toolId: string) {
  const supabase = createClientComponentClient();
  
  // Fetch the tool with collection and suite titles
  const { data: tools, error: toolError } = await supabase
    .rpc('get_tool_with_names', { p_tool_id: toolId });

  if (toolError) {
    console.error('Error fetching AI tool:', toolError);
    throw toolError;
  }

  if (!tools || tools.length === 0) {
    throw new Error('Tool not found');
  }

  // The returned data already matches our interface - no need to remap
  const tool: AITool = tools[0];

  // Fetch the inputs
  const { data: inputs, error: inputsError } = await supabase
    .rpc('get_tool_inputs', { tool_id: toolId });

  if (inputsError) {
    console.error('Error fetching AI tool inputs:', inputsError);
    throw inputsError;
  }

  return {
    tool,
    inputs: inputs || []
  };
}

// Function to check if current user is super admin
export async function isSuperAdmin() {
  const supabase = createClientComponentClient();
  const { data, error } = await supabase.rpc('is_super_admin');
  
  if (error) {
    console.error('Error checking super admin status:', error);
    return false;
  }

  return data;
}

// Function to get a tool with permissions
export async function getToolWithPermissions(toolId: string): Promise<AIToolWithPermissions | null> {
  const supabase = createClientComponentClient();
  const { data, error } = await supabase
    .rpc('get_tool_with_permissions', { p_tool_id: toolId });

  if (error) {
    console.error('Error fetching tool with permissions:', error);
    throw error;
  }

  if (!data || data.length === 0) {
    return null;
  }

  return data[0] as AIToolWithPermissions;
} 
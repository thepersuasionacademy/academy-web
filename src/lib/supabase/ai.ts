import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

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
  suite_id: string | null;
  title: string | null;
  description: string | null;
  credits_cost: number;
  created_at: string;
  updated_at: string;
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
  input_order: number;
  input_name: string | null;
  input_description: string | null;
  is_required: boolean;
  created_at: string;
  updated_at: string;
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

// Function to get a specific tool with its inputs and prompts
export async function getAITool(toolId: string) {
  const supabase = createClientComponentClient();
  
  // Fetch the tool
  const { data: tools, error: toolError } = await supabase
    .rpc('get_tool_by_id', { tool_id: toolId });

  if (toolError) {
    console.error('Error fetching AI tool:', toolError);
    throw toolError;
  }

  if (!tools || tools.length === 0) {
    throw new Error('Tool not found');
  }

  const tool = tools[0];

  // Fetch the inputs
  const { data: inputs, error: inputsError } = await supabase
    .rpc('get_tool_inputs', { tool_id: toolId });

  if (inputsError) {
    console.error('Error fetching AI tool inputs:', inputsError);
    throw inputsError;
  }

  // Fetch the prompts
  const { data: prompts, error: promptsError } = await supabase
    .rpc('get_tool_prompts', { tool_id: toolId });

  if (promptsError) {
    console.error('Error fetching AI tool prompts:', promptsError);
    throw promptsError;
  }

  return {
    tool,
    inputs: inputs || [],
    prompts: prompts || []
  };
} 
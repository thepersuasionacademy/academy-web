import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { AITool, AIInput, AIPrompt } from '@/lib/supabase/ai';
import { generateClaudeCompletion } from '../models/claude/utils';

// Initialize Supabase client with service role key for secure operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export async function POST(request: Request) {
  try {
    // Use regular client for user authentication
    const supabase = createRouteHandlerClient({ cookies });
    const { toolId, inputs } = await request.json();

    // Verify user authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch the tool using service role client
    const { data: tools, error: toolError } = await supabaseAdmin
      .rpc('get_tool_by_id', { tool_id: toolId });

    if (toolError || !tools || tools.length === 0) {
      console.error('Tool fetch error:', toolError);
      return NextResponse.json({ error: 'Tool not found' }, { status: 404 });
    }

    const tool = tools[0];

    // Fetch the tool's inputs using service role client
    const { data: toolInputs, error: inputsError } = await supabaseAdmin
      .rpc('get_tool_inputs', { tool_id: toolId });

    if (inputsError) {
      console.error('Inputs fetch error:', inputsError);
      return NextResponse.json({ error: 'Failed to fetch tool inputs' }, { status: 500 });
    }

    // Fetch the tool's prompts using service role client - this is now secure
    const { data: toolPrompts, error: promptsError } = await supabaseAdmin
      .rpc('get_tool_prompts', { tool_id: toolId });

    if (promptsError) {
      console.error('Prompts fetch error:', promptsError);
      return NextResponse.json({ error: 'Failed to fetch tool prompts' }, { status: 500 });
    }

    // Validate required inputs
    const missingInputs = toolInputs
      ?.filter((input: AIInput) => input.is_required && !inputs[input.input_name || ''])
      .map((input: AIInput) => input.input_name);

    if (missingInputs && missingInputs.length > 0) {
      return NextResponse.json(
        { error: `Missing required inputs: ${missingInputs.join(', ')}` },
        { status: 400 }
      );
    }

    // Prepare the inputs for Claude API
    const claudeInputs = {
      field1: inputs[toolInputs[0]?.input_name || ''] || '',
      field2: inputs[toolInputs[1]?.input_name || ''] || undefined,
      field3: inputs[toolInputs[2]?.input_name || ''] || undefined,
    };

    // Combine all prompts into a single template, replacing placeholders with actual input values
    const combinedPrompt = toolPrompts
      ?.map((prompt: { prompt_text: string | null }) => {
        let promptText = prompt.prompt_text || '';
        // Replace input placeholders
        Object.entries(inputs as Record<string, string>).forEach(([key, value]) => {
          promptText = promptText.replaceAll(`{{${key}}}`, value);
        });
        return promptText;
      })
      .join('\n\n');

    if (!combinedPrompt) {
      return NextResponse.json({ error: 'No prompts found for this tool' }, { status: 400 });
    }

    // Call Claude directly using the utility function
    const content = await generateClaudeCompletion(combinedPrompt, claudeInputs);
    
    return NextResponse.json({
      output: content
    });
  } catch (error) {
    console.error('Error in AI generate route:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
} 
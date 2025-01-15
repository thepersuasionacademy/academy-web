// src/app/api/ai/models/claude/route.ts
import { NextResponse } from 'next/server';
import { generateClaudeCompletion } from './utils';

interface RequestBody {
  promptTemplate: string;
  inputs: {
    field1: string;
    field2?: string;
    field3?: string;
  };
}

export async function POST(request: Request) {
  try {
    const { promptTemplate, inputs } = await request.json() as RequestBody;
    
    console.log('Received request:', { promptTemplate, inputs });
    
    if (!promptTemplate || !inputs.field1) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const content = await generateClaudeCompletion(promptTemplate, inputs);
    
    return NextResponse.json({ content });
  } catch (error) {
    console.error('API Route Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate response';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
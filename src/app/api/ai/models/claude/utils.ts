// src/app/api/ai/models/claude/utils.ts

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const BASE_URL = 'https://api.anthropic.com/v1/messages';

interface FieldInputs {
  field1: string;
  field2?: string;
  field3?: string;
}

export const generateClaudeCompletion = async (promptTemplate: string, inputs: FieldInputs) => {
  // Log that we have an API key (without revealing it)
  console.log('API Key present:', !!ANTHROPIC_API_KEY);
  console.log('API Key length:', ANTHROPIC_API_KEY?.length || 0);

  if (!ANTHROPIC_API_KEY) {
    throw new Error('Anthropic API key not configured');
  }

  // Replace template placeholders with actual inputs
  let prompt = promptTemplate;
  Object.entries(inputs).forEach(([key, value]) => {
    if (value) { // Only replace if value exists
      const placeholder = `{${key}}`;
      prompt = prompt.replaceAll(placeholder, value);
    }
  });

  console.log('Sending prompt to Claude:', prompt);

  try {
    // Create headers object with proper typing
    const headers = new Headers({
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    });

    const response = await fetch(BASE_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1024,
        temperature: 0.7,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Claude API Error Response:', errorText);
      throw new Error(errorText);
    }

    const data = await response.json();
    console.log('Claude API Response:', data);

    // The response structure from Claude API v3
    if (data.content && data.content[0] && data.content[0].text) {
      return data.content[0].text;
    } else {
      throw new Error('Unexpected response structure from Claude API');
    }
  } catch (error) {
    console.error('Claude API Error:', error);
    throw error;
  }
};
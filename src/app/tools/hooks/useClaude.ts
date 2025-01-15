// src/app/hooks/useClaude.ts

export interface ClaudeResponse {
    onStreamResponse: (chunk: string) => void;
    onError: (error: string) => void;
    onComplete: () => void;
  }
  
  export interface ToolConfig {
    title: string;
    description: string;
    systemPrompt: string;
    temperature?: number;
    maxTokens?: number;
  }
  
  export const useClaudeAPI = () => {
    const generateResponse = async (
      prompt: string,
      callbacks: ClaudeResponse,
      toolConfig?: ToolConfig
    ) => {
      const { onStreamResponse, onError, onComplete } = callbacks;
      
      try {
        const response = await fetch('/api/ai/models/claude', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt,
            toolConfig
          })
        });
  
        if (!response.ok) {
          throw new Error('Failed to generate response');
        }
  
        const data = await response.json();
        const content = data.content[0].text;
        
        // Stream the response character by character
        for (let i = 0; i < content.length; i++) {
          await new Promise(resolve => setTimeout(resolve, 5));
          onStreamResponse(content[i]);
        }
        
        onComplete();
      } catch (error) {
        console.error('Error:', error);
        onError('Sorry, there was an error generating the response. Please try again.');
      }
    };
  
    return { generateResponse };
  };
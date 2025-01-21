// src/app/ai/lib/tools.ts
export interface Tool {
    PK: string;
    SK: string;
    creditCost: number;
    description: string;
    inputField1: string;
    inputField1Description: string;
    inputField2?: string;
    inputField2Description?: string;
    inputField3?: string;
    inputField3Description?: string;
    name: string;
    promptTemplate: string;
}
  
export class ToolService {
    parseToolIdentifier(toolId: string): { category: string; suite: string; toolName: string } {
        if (toolId.startsWith('SUITE#')) {
            // Full SK format: "SUITE#basics#TOOL#favorite-color-generator"
            const parts = toolId.split('#');
            return {
                suite: parts[1],
                toolName: parts[3],
                category: 'Email' // This should come from context/props
            };
        }

        // Simple tool ID format
        return {
            suite: 'basics',
            toolName: toolId,
            category: 'Email'
        };
    }

    async getToolById(toolId: string): Promise<Tool | null> {
        try {
            const { category, suite, toolName } = this.parseToolIdentifier(toolId);

            console.log('Making request with parsed values:', {
                category,
                suite,
                toolId: toolName
            });

            const response = await fetch('/api/ai/categories/suites/tools', {
                headers: {
                    'x-selected-category': category,
                    'x-selected-suite': suite,
                    'x-tool-id': toolName
                }
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Failed to fetch tool:', errorText);
                return null;
            }

            const data = await response.json();
            
            if (!data.tools || data.tools.length === 0) {
                console.log('No tool found');
                return null;
            }

            return data.tools[0];
        } catch (error) {
            console.error('Error fetching tool:', error);
            return null;
        }
    }
}
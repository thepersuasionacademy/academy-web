// app/lib/tools.ts
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
    async getToolById(toolId: string): Promise<Tool | null> {
        try {
            console.log('Fetching tool with ID:', toolId);
            
            const response = await fetch('/api/ai/categories/suites/tools', {
                headers: {
                    'x-tool-id': toolId
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
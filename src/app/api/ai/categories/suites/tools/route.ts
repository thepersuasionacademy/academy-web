// app/api/ai/categories/suites/tools/route.ts
import { NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { 
    DynamoDBDocumentClient, 
    QueryCommand,
    UpdateCommand
} from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
    }
});

const docClient = DynamoDBDocumentClient.from(client);

function formatToolId(toolId: string): string {
    if (toolId.startsWith('SUITE#')) {
        return toolId;
    }
    return `SUITE#basics#TOOL#`;
}

export async function GET(request: Request) {
    try {
        if (!process.env.DYNAMODB_TABLE_NAME) {
            throw new Error('DYNAMODB_TABLE_NAME environment variable is not set');
        }

        const selectedCategory = request.headers.get('x-selected-category');
        const selectedSuite = request.headers.get('x-selected-suite')?.toLowerCase(); // Add toLowerCase()

        if (!selectedCategory || !selectedSuite) {
            return NextResponse.json({ 
                error: 'Category and suite are required',
                details: 'Both category and suite must be specified in headers'
            }, { status: 400 });
        }

        console.log('Headers received:', { selectedCategory, selectedSuite });

        const queryParams = {
            TableName: process.env.DYNAMODB_TABLE_NAME,
            KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
            ExpressionAttributeValues: {
                ':pk': `AI#CATEGORY#${selectedCategory}`,
                ':sk': `SUITE#${selectedSuite}#TOOL#`  // selectedSuite is now lowercase
            }
        };

        console.log('DynamoDB Query:', {
            TableName: process.env.DYNAMODB_TABLE_NAME,
            PK: `AI#CATEGORY#${selectedCategory}`,
            SK_prefix: `SUITE#${selectedSuite}#TOOL#`
        });

        const result = await docClient.send(new QueryCommand(queryParams));
        console.log('DynamoDB result:', JSON.stringify(result, null, 2));

        if (!result.Items || result.Items.length === 0) {
            return NextResponse.json({ 
                tools: [],
                debug: {
                    category: selectedCategory,
                    suite: selectedSuite,
                    query: queryParams
                }
            });
        }

        const tools = result.Items.map(item => ({
            PK: item.PK,
            SK: item.SK,
            name: item.name,
            description: item.description,
            creditCost: item.creditCost,
            promptTemplate: item.promptTemplate,
            inputField1: item.inputField1,
            inputField1Description: item.inputField1Description,
            inputField2: item.inputField2 || undefined,
            inputField2Description: item.inputField2Description || undefined,
            inputField3: item.inputField3 || undefined,
            inputField3Description: item.inputField3Description || undefined
        }));

        return NextResponse.json({ tools });
    } catch (error) {
        console.error('Error fetching tools:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch tools';
        return NextResponse.json({ 
            error: errorMessage,
            stack: error instanceof Error ? error.stack : undefined
        }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        if (!process.env.DYNAMODB_TABLE_NAME) {
            throw new Error('DYNAMODB_TABLE_NAME environment variable is not set');
        }

        const selectedCategory = request.headers.get('x-selected-category');
        const selectedSuite = request.headers.get('x-selected-suite');
        const toolId = request.headers.get('x-tool-id');

        if (!selectedCategory || !selectedSuite || !toolId) {
            return NextResponse.json({ 
                error: 'Missing required headers',
                details: 'Category, suite, and tool ID are required'
            }, { status: 400 });
        }

        // Get the existing tool
        const existingTool = await docClient.send(new QueryCommand({
            TableName: process.env.DYNAMODB_TABLE_NAME,
            KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
            ExpressionAttributeValues: {
                ':pk': `AI#CATEGORY#${selectedCategory}`,
                ':sk': `SUITE#${selectedSuite}#TOOL#${toolId}`
            }
        }));

        if (!existingTool.Items || existingTool.Items.length === 0) {
            return NextResponse.json({ 
                error: 'Tool not found',
                details: `No tool found with ID ${toolId} in suite ${selectedSuite}`
            }, { status: 404 });
        }

        const tool = existingTool.Items[0];
        let body;
        
        try {
            body = await request.json();
        } catch (parseError) {
            return NextResponse.json({ 
                error: 'Invalid request body',
                details: 'Request body must be valid JSON'
            }, { status: 400 });
        }

        const result = await docClient.send(new UpdateCommand({
            TableName: process.env.DYNAMODB_TABLE_NAME,
            Key: {
                PK: tool.PK,
                SK: tool.SK
            },
            UpdateExpression: 'SET #name = :name, #desc = :description, #prompt = :promptTemplate, #cost = :creditCost, #field1 = :inputField1, #field1Desc = :inputField1Description',
            ExpressionAttributeNames: {
                '#name': 'name',
                '#desc': 'description',
                '#prompt': 'promptTemplate',
                '#cost': 'creditCost',
                '#field1': 'inputField1',
                '#field1Desc': 'inputField1Description'
            },
            ExpressionAttributeValues: {
                ':name': body.name,
                ':description': body.description,
                ':promptTemplate': body.promptTemplate,
                ':creditCost': body.creditCost,
                ':inputField1': body.inputField1,
                ':inputField1Description': body.inputField1Description
            },
            ReturnValues: 'ALL_NEW'
        }));

        return NextResponse.json({ 
            success: true,
            data: result.Attributes
        });
    } catch (error) {
        console.error('Error updating tool:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to update tool';
        return NextResponse.json({ 
            error: errorMessage,
            stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined
        }, { status: 500 });
    }
}
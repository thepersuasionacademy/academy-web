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
    return `SUITE#basics#TOOL#${toolId}`;
}

export async function GET(request: Request) {
    try {
        if (!process.env.DYNAMODB_TABLE_NAME) {
            throw new Error('DYNAMODB_TABLE_NAME environment variable is not set');
        }

        const toolId = request.headers.get('x-tool-id');
        if (!toolId) {
            return NextResponse.json({ 
                error: 'Tool ID is required' 
            }, { status: 400 });
        }

        console.log('Searching for tool:', toolId);
        const formattedSK = formatToolId(toolId);

        const queryParams = {
            TableName: process.env.DYNAMODB_TABLE_NAME,
            KeyConditionExpression: 'PK = :pk AND SK = :sk',
            ExpressionAttributeValues: {
                ':pk': 'AI#CATEGORY#EMAIL',
                ':sk': formattedSK
            }
        };

        console.log('Query parameters:', queryParams);
        const result = await docClient.send(new QueryCommand(queryParams));
        console.log('DynamoDB result:', JSON.stringify(result, null, 2));

        if (!result.Items || result.Items.length === 0) {
            return NextResponse.json({ 
                error: 'Tool not found' 
            }, { status: 404 });
        }

        const tools = result.Items.map(item => ({
            PK: item.PK,
            SK: item.SK,
            name: item.name,
            description: item.description,
            creditCost: item.creditCost,
            promptTemplate: item.promptTemplate,
            inputField1: item.inputField1,
            inputField1Description: item.inputFieldDescription,
            inputField2: item.inputField2,
            inputField2Description: item.inputField2Description,
            inputField3: item.inputField3 || undefined,
            inputField3Description: item.inputField3Description || undefined
        }));

        return NextResponse.json({ tools });
    } catch (error) {
        console.error('Error fetching tools:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch tools';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        if (!process.env.DYNAMODB_TABLE_NAME) {
            throw new Error('DYNAMODB_TABLE_NAME environment variable is not set');
        }

        const toolId = request.headers.get('x-tool-id');
        if (!toolId) {
            return NextResponse.json({ 
                error: 'Tool ID is required' 
            }, { status: 400 });
        }

        // Format the tool ID
        const formattedSK = formatToolId(toolId);

        // Get the existing tool using QueryCommand
        const existingTool = await docClient.send(new QueryCommand({
            TableName: process.env.DYNAMODB_TABLE_NAME,
            KeyConditionExpression: 'PK = :pk AND SK = :sk',
            ExpressionAttributeValues: {
                ':pk': 'AI#CATEGORY#EMAIL',
                ':sk': formattedSK
            }
        }));

        if (!existingTool.Items || existingTool.Items.length === 0) {
            return NextResponse.json({ 
                error: 'Tool not found' 
            }, { status: 404 });
        }

        const tool = existingTool.Items[0];
        let body;
        
        try {
            body = await request.json();
        } catch (parseError) {
            return NextResponse.json({ 
                error: 'Invalid request body' 
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
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
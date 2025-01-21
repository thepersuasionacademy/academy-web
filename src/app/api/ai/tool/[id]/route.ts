// src/app/api/tool/[id]/route.ts
import { NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
  }
});

const docClient = DynamoDBDocumentClient.from(client);

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = await Promise.resolve(params.id);
    
    // Use scan to find the tool by looking for its ID in the SK
    const result = await docClient.send(new ScanCommand({
      TableName: process.env.DYNAMODB_TABLE_NAME!,
      FilterExpression: 'contains(SK, :toolId)',
      ExpressionAttributeValues: {
        ':toolId': id
      }
    }));

    if (!result.Items || result.Items.length === 0) {
      return NextResponse.json({ 
        error: 'Tool not found',
        queriedId: id
      }, { status: 404 });
    }

    const tool = result.Items[0];
    return NextResponse.json({
      tools: [{
        name: tool.name,
        SK: tool.SK,
        PK: tool.PK,
        description: tool.description,
        creditCost: tool.creditCost,
        promptTemplate: tool.promptTemplate,
        inputField1: tool.inputField1,
        inputField1Description: tool.inputField1Description,
        inputField2: tool.inputField2,
        inputField2Description: tool.inputField2Description,
        inputField3: tool.inputField3,
        inputField3Description: tool.inputField3Description
      }]
    });
  } catch (error) {
    console.error('Error fetching tool:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch tool',
        details: error instanceof Error ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
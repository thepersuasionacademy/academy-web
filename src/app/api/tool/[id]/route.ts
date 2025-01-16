// src/app/api/tool/[id]/route.ts
import { NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb';

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
    // Properly await the params
    const id = await Promise.resolve(params.id);
    const toolSK = decodeURIComponent(id);

    console.log('Fetching tool with SK:', toolSK);

    const result = await docClient.send(new QueryCommand({
      TableName: process.env.DYNAMODB_TABLE_NAME!,
      KeyConditionExpression: 'PK = :pk AND SK = :sk',
      ExpressionAttributeValues: {
        ':pk': 'AI#CATEGORY#Email',
        ':sk': toolSK
      }
    }));

    console.log('DynamoDB result:', JSON.stringify(result, null, 2));

    if (!result.Items || result.Items.length === 0) {
      return NextResponse.json({ 
        error: 'Tool not found',
        queriedSK: toolSK
      }, { status: 404 });
    }

    const tool = result.Items[0];
    return NextResponse.json({
      tools: [{
        name: tool.name,
        SK: tool.SK,
        description: tool.description,
        creditCost: tool.creditCost,
        promptTemplate: tool.promptTemplate,
        inputField1: tool.inputField1,
        inputField1Description: tool.inputField1Description
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
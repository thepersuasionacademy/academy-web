import { NextResponse } from 'next/server'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { 
  DynamoDBDocumentClient, 
  QueryCommand,
  PutCommand
} from '@aws-sdk/lib-dynamodb'

const client = new DynamoDBClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
  }
})

const docClient = DynamoDBDocumentClient.from(client)

export async function GET(
    request: Request,
    { params }: { params: { categoryId: string } }
  ) {
    try {
      // First get everything in the category
      const result = await docClient.send(new QueryCommand({
        TableName: process.env.DYNAMODB_TABLE_NAME!,
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
        ExpressionAttributeValues: {
          ':pk': `AI#CATEGORY#${params.categoryId}`,
          ':sk': 'SUITE#'
        }
      }))

      // Then filter to get only pure suite entries by checking SK format
      const suites = (result.Items || [])
        .filter(item => {
          const skParts = item.SK.split('#');
          return skParts.length === 2 && skParts[0] === 'SUITE';
        })
        .map(item => ({
          id: item.SK,
          name: item.name
        }));
      
      return NextResponse.json({ suites })
    } catch (error) {
      console.error('Error fetching suites:', error)
      return NextResponse.json(
        { error: 'Failed to fetch suites' },
        { status: 500 }
      )
    }
  }

export async function POST(request: Request, { params }: { params: { categoryId: string } }) {
  try {
    const { name } = await request.json()

    if (!name) {
      return NextResponse.json(
        { error: 'Suite name is required' },
        { status: 400 }
      )
    }

    const item = {
      PK: `AI#CATEGORY#${params.categoryId}`,
      SK: `SUITE#${name}`,
      name: name
    }

    await docClient.send(new PutCommand({
      TableName: process.env.DYNAMODB_TABLE_NAME!,
      Item: item
    }))

    return NextResponse.json({
      suite: {
        id: `SUITE#${name}`,
        name
      }
    })
  } catch (error) {
    const err = error as Error
    return NextResponse.json(
      { error: 'Failed to create suite', details: err.message },
      { status: 500 }
    )
  }
}
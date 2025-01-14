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

export async function GET(request: Request) {
  try {
    const selectedCategory = request.headers.get('x-selected-category') || 'Cat'
    
    const result = await docClient.send(new QueryCommand({
      TableName: process.env.DYNAMODB_TABLE_NAME!,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': `AI#CATEGORY#${selectedCategory}`,
        ':sk': 'SUITE#'
      }
    }))

    const suites = result.Items
      ?.filter(item => (item.SK.match(/#/g) || []).length === 1)
      ?.map(item => ({
        id: item.SK.split('#')[1],
        name: item.name
      })) || []

    return NextResponse.json({ suites })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Failed to fetch suites' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const selectedCategory = request.headers.get('x-selected-category')
    if (!selectedCategory) {
      return NextResponse.json({ error: 'Category is required' }, { status: 400 })
    }

    const body = await request.json()
    if (!body.name) {
      return NextResponse.json({ error: 'Suite name is required' }, { status: 400 })
    }

    const suiteId = body.name.toLowerCase().replace(/[^a-z0-9]/g, '-')

    await docClient.send(new PutCommand({
      TableName: process.env.DYNAMODB_TABLE_NAME!,
      Item: {
        PK: `AI#CATEGORY#${selectedCategory}`,
        SK: `SUITE#${suiteId}`,
        name: body.name
      },
      // Ensure we don't overwrite an existing suite
      ConditionExpression: 'attribute_not_exists(PK) AND attribute_not_exists(SK)'
    }))

    return NextResponse.json({
      success: true,
      suite: {
        id: suiteId,
        name: body.name
      }
    })
  } catch (err) {
    console.error('Error creating suite:', err)
    
    // Type guard for ConditionalCheckFailedException
    if (err && 
        typeof err === 'object' && 
        'name' in err && 
        err.name === 'ConditionalCheckFailedException') {
      return NextResponse.json({ error: 'Suite already exists' }, { status: 409 })
    }
    
    return NextResponse.json({ error: 'Failed to create suite' }, { status: 500 })
  }
}
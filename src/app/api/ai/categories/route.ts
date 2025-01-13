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

export async function GET() {
    try {
      console.log('Fetching categories from DynamoDB...')
      const result = await docClient.send(new QueryCommand({
        TableName: process.env.DYNAMODB_TABLE_NAME!,
        IndexName: 'GSI1',  // Use the GSI1 index
        KeyConditionExpression: '#gsi1pk = :pk',
        ExpressionAttributeNames: {
          '#gsi1pk': 'GSI1-PK'
        },
        ExpressionAttributeValues: {
          ':pk': 'AI#CATEGORIES'
        }
      }))
  
      console.log('DynamoDB response:', result)
  
      const categories = result.Items?.map(item => ({
        id: item.PK.split('#')[2],
        name: item.name
      })) || []
  
      console.log('Returning categories:', categories)
      return NextResponse.json({ categories })
    } catch (error) {
      console.log("Full error:", error)
      console.error('Error fetching categories:', error)
      return NextResponse.json(
        { error: 'Failed to fetch categories' },
        { status: 500 }
      )
    }
  }

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name } = body

    console.log('Category creation requested for name:', name)

    if (!name) {
      return NextResponse.json(
        { error: 'Category name is required' },
        { status: 400 }
      )
    }

    // Use the name directly for the ID
    const categoryId = name

    const item = {
      PK: `AI#CATEGORY#${categoryId}`,
      SK: 'METADATA',
      'GSI1-PK': 'AI#CATEGORIES',  // Match the exact key name from DynamoDB
      name: name
    }

    console.log('Attempting to save category:', JSON.stringify(item, null, 2))

    await docClient.send(new PutCommand({
      TableName: process.env.DYNAMODB_TABLE_NAME!,
      Item: item
    }))

    console.log('Category saved successfully')

    return NextResponse.json({
      category: {
        id: categoryId,
        name
      }
    })
  } catch (error) {
    const err = error as Error
    console.log("Full error:", {
      message: err.message,
      stack: err.stack,
      error
    })
    return NextResponse.json(
      { error: 'Failed to create category', details: err.message },
      { status: 500 }
    )
  }
}
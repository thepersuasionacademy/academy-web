import { NextResponse } from 'next/server'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { 
  DynamoDBDocumentClient, 
  QueryCommand
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
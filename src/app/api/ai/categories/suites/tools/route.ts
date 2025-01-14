import { NextResponse } from 'next/server'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { 
  DynamoDBDocumentClient, 
  QueryCommand,
  UpdateCommand
} from '@aws-sdk/lib-dynamodb'

const client = new DynamoDBClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
  }
})

const docClient = DynamoDBDocumentClient.from(client)

// Helper function to validate required headers
function validateHeaders(request: Request) {
  const selectedCategory = request.headers.get('x-selected-category')
  const selectedSuite = request.headers.get('x-selected-suite')
  const toolId = request.headers.get('x-tool-id')

  if (!selectedCategory || !selectedSuite) {
    throw new Error('Missing required headers: category and suite are required')
  }

  return { selectedCategory, selectedSuite, toolId }
}

export async function GET(request: Request) {
  try {
    const { selectedCategory, selectedSuite } = validateHeaders(request)
    
    const result = await docClient.send(new QueryCommand({
      TableName: process.env.DYNAMODB_TABLE_NAME!,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': `AI#CATEGORY#${selectedCategory}`,
        ':sk': `SUITE#${selectedSuite}#TOOL#`
      }
    }))

    const tools = result.Items?.map(item => ({
      id: item.SK.split('#')[3],
      name: item.name,
      description: item.description,
      creditCost: item.creditCost,
      promptTemplate: item.promptTemplate,
      inputField1: item.inputField1,
      inputField1Description: item.inputField1Description
    })) || []

    return NextResponse.json({ tools })
  } catch (error) {
    console.error('Error fetching tools:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch tools'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

export async function PUT(request: Request) {
    try {
      const selectedCategory = request.headers.get('x-selected-category')
      const selectedSuite = request.headers.get('x-selected-suite')
      const toolId = request.headers.get('x-tool-id')
      
      console.log('Received update request for:', {
        category: selectedCategory,
        suite: selectedSuite,
        toolId
      })
  
      if (!selectedCategory || !selectedSuite || !toolId) {
        return NextResponse.json({ 
          error: 'Missing required headers',
          details: { selectedCategory, selectedSuite, toolId }
        }, { status: 400 })
      }
  
      let body
      try {
        body = await request.json()
      } catch (parseError) {
        return NextResponse.json({ 
          error: 'Invalid request body' 
        }, { status: 400 })
      }
  
      // Construct the exact DynamoDB key
      const key = {
        PK: `AI#CATEGORY#${selectedCategory}`,
        SK: `SUITE#${selectedSuite}#TOOL#${toolId}`
      }
  
      console.log('Attempting DynamoDB update with key:', key)
  
      try {
        const result = await docClient.send(new UpdateCommand({
          TableName: process.env.DYNAMODB_TABLE_NAME!,
          Key: key,
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
            ':inputField1Description': body.inputField1Description || ''
          },
          ReturnValues: 'ALL_NEW'
        }))
  
        console.log('DynamoDB update successful:', result)
  
        return NextResponse.json({ 
          success: true,
          data: result.Attributes
        })
      } catch (dbError) {
        console.error('DynamoDB error:', dbError)
        return NextResponse.json({ 
          error: 'Database update failed',
          details: dbError instanceof Error ? dbError.message : 'Unknown database error'
        }, { status: 500 })
      }
    } catch (error) {
      console.error('API route error:', error)
      return NextResponse.json({ 
        error: 'Failed to update tool',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 })
    }
  }
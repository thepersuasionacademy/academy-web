import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { 
  DynamoDBDocumentClient, 
  GetCommand, 
  QueryCommand, 
  PutCommand,
  DeleteCommand 
} from '@aws-sdk/lib-dynamodb'

const client = new DynamoDBClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
  }
})

const docClient = DynamoDBDocumentClient.from(client)

interface ToolCreationRequest {
  categoryName: string
  suiteName: string
  name: string
  description: string
  promptTemplate: string
  creditCost: number
  inputField1: string
  inputField1Description: string
  inputField2?: string
  inputField2Description?: string
  inputField3?: string
  inputField3Description?: string
}

interface ToolData {
  PK: string
  SK: string
  name: string
  description: string
  promptTemplate: string
  creditCost: number
  inputField1: string
  inputField1Description: string
  inputField2?: string
  inputField2Description?: string
  inputField3?: string
  inputField3Description?: string
}

const formatForDynamoDB = (name: string): string => {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-\s]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

const getCategoryId = async (categoryName: string): Promise<string | null> => {
  try {
    const result = await docClient.send(new QueryCommand({
      TableName: process.env.DYNAMODB_TABLE_NAME!,
      IndexName: 'GSI1',
      KeyConditionExpression: '#gsi1pk = :pk',
      FilterExpression: '#name = :categoryName',
      ExpressionAttributeNames: {
        '#gsi1pk': 'GSI1-PK',  
        '#name': 'name'
      },
      ExpressionAttributeValues: {
        ':pk': 'AI#CATEGORIES',
        ':categoryName': categoryName
      }
    }))
    
    if (result.Items?.[0]) {
      return result.Items[0].PK.split('#')[2]
    }
    return null
  } catch (error) {
    console.error('Error in getCategoryId:', error)
    return null
  }
}

const getSuiteId = async (suiteName: string, categoryId: string): Promise<string | null> => {
  try {
    const result = await docClient.send(new QueryCommand({
      TableName: process.env.DYNAMODB_TABLE_NAME!,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      FilterExpression: '#name = :suiteName',
      ExpressionAttributeNames: {
        '#name': 'name'
      },
      ExpressionAttributeValues: {
        ':pk': `AI#CATEGORY#${categoryId}`,
        ':sk': 'SUITE#',
        ':suiteName': suiteName
      }
    }))

    if (result.Items?.[0]) {
      return result.Items[0].SK.split('#')[1]
    }
    return null
  } catch (error) {
    console.error('Error in getSuiteId:', error)
    return null
  }
}

export async function GET(req: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('=== Starting GET request for tools ===')
    const selectedCategory = req.headers.get('x-selected-category')
    const selectedSuite = req.headers.get('x-selected-suite')

    console.log('Headers received:', { selectedCategory, selectedSuite })

    if (!selectedCategory || !selectedSuite) {
      return NextResponse.json({ 
        error: 'Missing required headers',
        details: 'Category and suite must be specified'
      }, { status: 400 })
    }

    const categoryId = await getCategoryId(selectedCategory)
    console.log('Category ID lookup:', { selectedCategory, categoryId })

    if (!categoryId) {
      return NextResponse.json({ 
        error: 'Category not found',
        details: `Category not found: ${selectedCategory}`
      }, { status: 404 })
    }

    const suiteName = await getSuiteId(selectedSuite, categoryId)
    console.log('Suite name lookup:', { selectedSuite, suiteName })

    if (!suiteName) {
      return NextResponse.json({ 
        error: 'Suite not found',
        details: `Suite not found: ${selectedSuite}`
      }, { status: 404 })
    }

    const queryParams = {
      TableName: process.env.DYNAMODB_TABLE_NAME!,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': `AI#CATEGORY#${categoryId}`,
        ':sk': `SUITE#${suiteName}#TOOL#`
      }
    }

    console.log('DynamoDB Query:', {
      TableName: process.env.DYNAMODB_TABLE_NAME,
      PK: `AI#CATEGORY#${categoryId}`,
      SK_prefix: `SUITE#${suiteName}#TOOL#`
    })

    const result = await docClient.send(new QueryCommand(queryParams))
    console.log('DynamoDB result:', result)

    return NextResponse.json({
      tools: result.Items?.map(item => ({
        name: item.name,
        SK: item.SK,
        description: item.description,
        creditCost: item.creditCost,
        promptTemplate: item.promptTemplate,
        inputField1: item.inputField1,
        inputField1Description: item.inputField1Description
      })) || []
    })

  } catch (error) {
    console.error('Error in GET handler:', error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to fetch tools',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { 
      categoryName, 
      suiteName, 
      name, 
      description, 
      promptTemplate, 
      creditCost,
      inputField1,
      inputField1Description,
      inputField2,
      inputField2Description,
      inputField3,
      inputField3Description
    }: ToolCreationRequest = await req.json()

    if (!name || !categoryName || !suiteName || !description || !promptTemplate || creditCost === undefined || !inputField1) {
      const missingFields = []
      if (!name) missingFields.push('name')
      if (!categoryName) missingFields.push('categoryName')
      if (!suiteName) missingFields.push('suiteName')
      if (!description) missingFields.push('description')
      if (!promptTemplate) missingFields.push('promptTemplate')
      if (creditCost === undefined) missingFields.push('creditCost')
      if (!inputField1) missingFields.push('inputField1')
      
      return NextResponse.json({ 
        error: 'Missing required fields', 
        details: `Missing fields: ${missingFields.join(', ')}` 
      }, { status: 400 })
    }

    const foundCategoryId = await getCategoryId(categoryName)
    if (!foundCategoryId) {
      return NextResponse.json({ 
        error: 'Invalid category',
        details: `Category not found: ${categoryName}`
      }, { status: 400 })
    }

    const foundSuiteId = await getSuiteId(suiteName, foundCategoryId)
    if (!foundSuiteId) {
      return NextResponse.json({ 
        error: 'Invalid suite',
        details: `Suite not found: ${suiteName} in category ${categoryName}`
      }, { status: 400 })
    }

    const toolId = formatForDynamoDB(name)

    // Check for existing tool
    const existingTool = await docClient.send(new GetCommand({
      TableName: process.env.DYNAMODB_TABLE_NAME!,
      Key: {
        PK: `AI#CATEGORY#${foundCategoryId}`,
        SK: `SUITE#${foundSuiteId}#TOOL#${toolId}`
      }
    }))

    if (existingTool.Item) {
      return NextResponse.json(
        { 
          error: 'Tool already exists',
          details: `A tool with the name "${name}" already exists in this suite`
        },
        { status: 409 }
      )
    }

    // Create tool
    await docClient.send(new PutCommand({
      TableName: process.env.DYNAMODB_TABLE_NAME!,
      Item: {
        PK: `AI#CATEGORY#${foundCategoryId}`,
        SK: `SUITE#${foundSuiteId}#TOOL#${toolId}`,
        name,
        description,
        promptTemplate,
        creditCost,
        inputField1,
        inputField1Description,
        ...(inputField2 && {
          inputField2,
          inputField2Description
        }),
        ...(inputField3 && {
          inputField3,
          inputField3Description
        })
      }
    }))

    return NextResponse.json({
      toolId,
      name,
      status: 'ACTIVE',
      category: foundCategoryId,
      categoryName,
      suite: foundSuiteId,
      suiteName,
      inputField1,
      inputField1Description,
      inputField2,
      inputField2Description,
      inputField3,
      inputField3Description
    })

  } catch (error) {
    console.error('Error creating tool:', error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? `Failed to create tool: ${error.message}` : 'Failed to create tool',
        details: process.env.NODE_ENV === 'development' ? error : undefined,
        env: {
          hasRegion: !!process.env.AWS_REGION,
          hasAccessKey: !!process.env.AWS_ACCESS_KEY_ID,
          hasSecretKey: !!process.env.AWS_SECRET_ACCESS_KEY,
          hasTableName: !!process.env.DYNAMODB_TABLE_NAME
        }
      },
      { status: 500 }
    )
  }
}

export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url)
    const toolName = url.pathname.split('/').pop()

    if (!toolName) {
      return NextResponse.json({ 
        error: 'Missing tool name',
        details: 'Tool name must be specified in the URL'
      }, { status: 400 })
    }

    const selectedCategory = req.headers.get('x-selected-category')
    const selectedSuite = req.headers.get('x-selected-suite')

    if (!selectedCategory || !selectedSuite) {
      return NextResponse.json({ 
        error: 'Missing required headers',
        details: 'Category and suite must be specified'
      }, { status: 400 })
    }

    const categoryId = await getCategoryId(selectedCategory)
    if (!categoryId) {
      return NextResponse.json({ 
        error: 'Category not found',
        details: `Category not found: ${selectedCategory}`
      }, { status: 404 })
    }

    const suiteId = await getSuiteId(selectedSuite, categoryId)
    if (!suiteId) {
      return NextResponse.json({ 
        error: 'Suite not found',
        details: `Suite not found: ${selectedSuite}`
      }, { status: 404 })
    }

    const formattedToolName = formatForDynamoDB(toolName)
    await docClient.send(new DeleteCommand({
      TableName: process.env.DYNAMODB_TABLE_NAME!,
      Key: {
        PK: `AI#CATEGORY#${categoryId}`,
        SK: `SUITE#${suiteId}#TOOL#${formattedToolName}`
      }
    }))

    return NextResponse.json({ 
      message: 'Tool deleted successfully',
      toolName: toolName
    })

  } catch (error) {
    console.error('Error deleting tool:', error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? `Failed to delete tool: ${error.message}` : 'Failed to delete tool',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    )
  }
}
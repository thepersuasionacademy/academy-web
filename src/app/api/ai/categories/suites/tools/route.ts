// app/api/ai/categories/suites/tools/route.ts
import { NextResponse } from 'next/server'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { 
    DynamoDBDocumentClient, 
    QueryCommand,
    UpdateCommand,
    DeleteCommand
} from '@aws-sdk/lib-dynamodb'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

const client = new DynamoDBClient({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
    }
})

const docClient = DynamoDBDocumentClient.from(client)

function formatToolId(toolId: string): string {
    if (toolId.startsWith('SUITE#')) {
        return toolId
    }
    return `SUITE#basics#TOOL#`
}

export async function GET(request: Request) {
    try {
        const cookieStore = cookies()
        const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

        const selectedSuite = request.headers.get('x-selected-suite')
        if (!selectedSuite) {
            return NextResponse.json({ error: 'No suite selected' }, { status: 400 })
        }

        // Get the suite ID for the selected suite
        const { data: suite, error: suiteError } = await supabase
            .from('ai.suites')
            .select('id')
            .eq('title', selectedSuite)
            .single()

        if (suiteError || !suite) {
            console.error('Error fetching suite:', suiteError)
            return NextResponse.json(
                { error: 'Suite not found' },
                { status: 404 }
            )
        }

        // Get all tools for the suite
        const { data: tools, error: toolsError } = await supabase
            .from('ai.tools')
            .select('id, title, description, credits_cost')
            .eq('suite_id', suite.id)
            .order('title')

        if (toolsError) {
            console.error('Error fetching tools:', toolsError)
            return NextResponse.json(
                { error: 'Failed to fetch tools' },
                { status: 500 }
            )
        }

        return NextResponse.json(tools)
    } catch (error) {
        console.error('Unexpected error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

export async function PUT(request: Request) {
    try {
        if (!process.env.DYNAMODB_TABLE_NAME) {
            throw new Error('DYNAMODB_TABLE_NAME environment variable is not set')
        }

        const selectedCategory = request.headers.get('x-selected-category')
        const selectedSuite = request.headers.get('x-selected-suite')
        const toolId = request.headers.get('x-tool-id')

        if (!selectedCategory || !selectedSuite || !toolId) {
            return NextResponse.json({ 
                error: 'Missing required headers',
                details: 'Category, suite, and tool ID are required'
            }, { status: 400 })
        }

        // Get the existing tool
        const existingTool = await docClient.send(new QueryCommand({
            TableName: process.env.DYNAMODB_TABLE_NAME,
            KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
            ExpressionAttributeValues: {
                ':pk': `AI#CATEGORY#${selectedCategory}`,
                ':sk': `SUITE#${selectedSuite}#TOOL#${toolId}`
            }
        }))

        if (!existingTool.Items || existingTool.Items.length === 0) {
            return NextResponse.json({ 
                error: 'Tool not found',
                details: `No tool found with ID ${toolId} in suite ${selectedSuite}`
            }, { status: 404 })
        }

        const tool = existingTool.Items[0]
        let body

        try {
            body = await request.json()
        } catch (parseError) {
            return NextResponse.json({ 
                error: 'Invalid request body',
                details: 'Request body must be valid JSON'
            }, { status: 400 })
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
        }))

        return NextResponse.json({ 
            success: true,
            data: result.Attributes
        })
    } catch (error) {
        console.error('Error updating tool:', error)
        const errorMessage = error instanceof Error ? error.message : 'Failed to update tool'
        return NextResponse.json({ 
            error: errorMessage,
            stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined
        }, { status: 500 })
    }
}

export async function DELETE(request: Request) {
    try {
        if (!process.env.DYNAMODB_TABLE_NAME) {
            throw new Error('DYNAMODB_TABLE_NAME environment variable is not set')
        }

        const selectedCategory = request.headers.get('x-selected-category')
        const selectedSuite = request.headers.get('x-selected-suite')?.toLowerCase()
        const toolId = request.headers.get('x-tool-id')

        if (!selectedCategory || !selectedSuite || !toolId) {
            return NextResponse.json({ 
                error: 'Missing required headers',
                details: 'Category, suite, and tool ID are required'
            }, { status: 400 })
        }

        console.log('Delete request headers:', { selectedCategory, selectedSuite, toolId })

        // Query to find the exact tool first
        const existingTool = await docClient.send(new QueryCommand({
            TableName: process.env.DYNAMODB_TABLE_NAME,
            KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
            ExpressionAttributeValues: {
                ':pk': `AI#CATEGORY#${selectedCategory}`,
                ':sk': `SUITE#${selectedSuite}#TOOL#${toolId.toLowerCase()}`
            }
        }))

        if (!existingTool.Items || existingTool.Items.length === 0) {
            return NextResponse.json({ 
                error: 'Tool not found',
                details: `No tool found with ID ${toolId} in suite ${selectedSuite}`
            }, { status: 404 })
        }

        // Delete the tool
        await docClient.send(new DeleteCommand({
            TableName: process.env.DYNAMODB_TABLE_NAME,
            Key: {
                PK: `AI#CATEGORY#${selectedCategory}`,
                SK: `SUITE#${selectedSuite}#TOOL#${toolId.toLowerCase()}`
            }
        }))

        return NextResponse.json({ 
            success: true,
            message: 'Tool deleted successfully'
        })
    } catch (error) {
        console.error('Error deleting tool:', error)
        const errorMessage = error instanceof Error ? error.message : 'Failed to delete tool'
        return NextResponse.json({ 
            error: errorMessage,
            stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined
        }, { status: 500 })
    }
}
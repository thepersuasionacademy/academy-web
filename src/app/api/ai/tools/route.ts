import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

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

export async function GET(req: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const selectedCategory = req.headers.get('x-selected-category')
    const selectedSuite = req.headers.get('x-selected-suite')

    if (!selectedCategory || !selectedSuite) {
      return NextResponse.json({ 
        error: 'Missing required headers',
        details: 'Category and suite must be specified'
      }, { status: 400 })
    }

    // First get the collection ID from the title
    const { data: collection, error: collectionError } = await supabase
      .from('ai.collections')
      .select('id')
      .eq('title', selectedCategory)
      .single()

    if (collectionError) throw collectionError
    if (!collection) {
      return NextResponse.json({ 
        error: 'Category not found',
        details: `Category not found: ${selectedCategory}`
      }, { status: 404 })
    }

    // Then get the suite ID using the collection ID
    const { data: suite, error: suiteError } = await supabase
      .from('ai.suites')
      .select('id')
      .eq('collection_id', collection.id)
      .eq('title', selectedSuite)
      .single()

    if (suiteError) throw suiteError
    if (!suite) {
      return NextResponse.json({ 
        error: 'Suite not found',
        details: `Suite not found: ${selectedSuite}`
      }, { status: 404 })
    }

    // Finally get the tools for this suite
    const { data: tools, error } = await supabase
      .rpc('get_tools_by_suite', { suite_id: suite.id })

    if (error) throw error

    return NextResponse.json({ tools })
  } catch (error) {
    console.error('Error in GET handler:', error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to fetch tools'
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

    // First get the collection ID from the title
    const { data: collection, error: collectionError } = await supabase
      .from('ai.collections')
      .select('id')
      .eq('title', categoryName)
      .single()

    if (collectionError) throw collectionError
    if (!collection) {
      return NextResponse.json({ 
        error: 'Category not found',
        details: `Category not found: ${categoryName}`
      }, { status: 404 })
    }

    // Then get the suite ID using the collection ID
    const { data: suite, error: suiteError } = await supabase
      .from('ai.suites')
      .select('id')
      .eq('collection_id', collection.id)
      .eq('title', suiteName)
      .single()

    if (suiteError) throw suiteError
    if (!suite) {
      return NextResponse.json({ 
        error: 'Suite not found',
        details: `Suite not found: ${suiteName}`
      }, { status: 404 })
    }

    // Create the tool using RPC function
    const { data: tool, error } = await supabase.rpc('create_tool', {
      suite_id: suite.id,
      title: name,
      description,
      credits_cost: creditCost
    })

    if (error) throw error

    // Create the inputs
    const { error: inputError } = await supabase
      .from('ai.inputs')
      .insert([
        {
          tool_id: tool.id,
          input_order: 1,
          input_name: inputField1,
          input_description: inputField1Description,
          is_required: true
        },
        ...(inputField2 ? [{
          tool_id: tool.id,
          input_order: 2,
          input_name: inputField2,
          input_description: inputField2Description,
          is_required: false
        }] : []),
        ...(inputField3 ? [{
          tool_id: tool.id,
          input_order: 3,
          input_name: inputField3,
          input_description: inputField3Description,
          is_required: false
        }] : [])
      ])

    if (inputError) throw inputError

    // Create the prompt
    const { error: promptError } = await supabase
      .from('ai.prompts')
      .insert({
        tool_id: tool.id,
        prompt_order: 1,
        prompt_text: promptTemplate
      })

    if (promptError) throw promptError

    return NextResponse.json({
      tool_id: tool.id,
      name: tool.title,
      status: 'ACTIVE',
      category: collection.id,
      categoryName,
      suite: suite.id,
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
        error: error instanceof Error ? `Failed to create tool: ${error.message}` : 'Failed to create tool'
      },
      { status: 500 }
    )
  }
}

export async function DELETE(req: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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

    // First get the collection ID from the title
    const { data: collection, error: collectionError } = await supabase
      .from('ai.collections')
      .select('id')
      .eq('title', selectedCategory)
      .single()

    if (collectionError) throw collectionError
    if (!collection) {
      return NextResponse.json({ 
        error: 'Category not found',
        details: `Category not found: ${selectedCategory}`
      }, { status: 404 })
    }

    // Then get the suite ID using the collection ID
    const { data: suite, error: suiteError } = await supabase
      .from('ai.suites')
      .select('id')
      .eq('collection_id', collection.id)
      .eq('title', selectedSuite)
      .single()

    if (suiteError) throw suiteError
    if (!suite) {
      return NextResponse.json({ 
        error: 'Suite not found',
        details: `Suite not found: ${selectedSuite}`
      }, { status: 404 })
    }

    // Get the tool ID
    const { data: tool, error: toolError } = await supabase
      .from('ai.tools')
      .select('id')
      .eq('suite_id', suite.id)
      .eq('title', toolName)
      .single()

    if (toolError) throw toolError
    if (!tool) {
      return NextResponse.json({ 
        error: 'Tool not found',
        details: `Tool not found: ${toolName}`
      }, { status: 404 })
    }

    // Delete the tool (this will cascade delete inputs and prompts)
    const { error } = await supabase
      .from('ai.tools')
      .delete()
      .eq('id', tool.id)

    if (error) throw error

    return NextResponse.json({ 
      message: 'Tool deleted successfully',
      toolName: toolName
    })
  } catch (error) {
    console.error('Error deleting tool:', error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to delete tool'
      },
      { status: 500 }
    )
  }
}
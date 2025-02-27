import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    const selectedCategory = request.headers.get('x-selected-category')
    if (!selectedCategory) {
      return NextResponse.json({ error: 'No category selected' }, { status: 400 })
    }

    // Get the collection ID for the selected category
    const { data: collection, error: collectionError } = await supabase
      .from('ai.collections')
      .select('id')
      .eq('title', selectedCategory)
      .single()

    if (collectionError || !collection) {
      console.error('Error fetching collection:', collectionError)
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      )
    }

    // Get all suites for the collection
    const { data: suites, error: suitesError } = await supabase
      .from('ai.suites')
      .select('id, title')
      .eq('collection_id', collection.id)
      .order('title')

    if (suitesError) {
      console.error('Error fetching suites:', suitesError)
      return NextResponse.json(
        { error: 'Failed to fetch suites' },
        { status: 500 }
      )
    }

    return NextResponse.json(suites)
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const selectedCategory = request.headers.get('x-selected-category')
    
    if (!selectedCategory) {
      return NextResponse.json(
        { error: 'Category is required' },
        { status: 400 }
      )
    }

    const body = await request.json()
    if (!body.name) {
      return NextResponse.json(
        { error: 'Suite name is required' },
        { status: 400 }
      )
    }

    // First get the collection ID from the title
    const { data: collection, error: collectionError } = await supabase
      .from('ai.collections')
      .select('id')
      .eq('title', selectedCategory)
      .single()

    if (collectionError) throw collectionError
    if (!collection) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      )
    }

    // Check if suite already exists
    const { data: existingSuite, error: checkError } = await supabase
      .from('ai.suites')
      .select('id')
      .eq('collection_id', collection.id)
      .eq('title', body.name)
      .single()

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      throw checkError
    }

    if (existingSuite) {
      return NextResponse.json(
        { error: 'Suite already exists' },
        { status: 409 }
      )
    }

    // Create new suite using RPC function
    const { data: suite, error } = await supabase.rpc('create_suite', {
      collection_id: collection.id,
      title: body.name
    })

    if (error) throw error

    return NextResponse.json({
      success: true,
      suite: {
        id: suite.id,
        name: suite.title
      }
    })
  } catch (error) {
    console.error('Error creating suite:', error)
    return NextResponse.json(
      { error: 'Failed to create suite' },
      { status: 500 }
    )
  }
}
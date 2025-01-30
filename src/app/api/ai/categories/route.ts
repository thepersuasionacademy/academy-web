import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import type { AICollection } from '@/lib/supabase/ai'

export async function GET() {
  try {
    console.log('Fetching categories from Supabase...')
    const supabase = createRouteHandlerClient({ cookies })
    
    const { data: collections, error } = await supabase.rpc('list_collections')
    console.log('Supabase response:', { collections, error })
    
    if (error) throw error

    // Transform the data to match the expected format
    const categories = (collections as AICollection[]).map(collection => ({
      id: collection.id,
      name: collection.title // Map title to name for backward compatibility
    }))

    console.log('Returning categories:', categories)
    return NextResponse.json({ categories })
  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const body = await request.json()
    const { name } = body

    console.log('Creating category with name:', name)

    if (!name) {
      return NextResponse.json(
        { error: 'Category name is required' },
        { status: 400 }
      )
    }

    if (name.length < 2) {
      return NextResponse.json(
        { error: 'Category name must be at least 2 characters long' },
        { status: 400 }
      )
    }

    // Check if category already exists
    const { data: existingCategory, error: checkError } = await supabase
      .from('ai.collections')
      .select('id')
      .eq('title', name)
      .single()

    console.log('Check existing category result:', { existingCategory, checkError })

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      throw checkError
    }

    if (existingCategory) {
      return NextResponse.json(
        { error: 'Category already exists' },
        { status: 409 }
      )
    }

    // Create new category using RPC function
    const { data: category, error } = await supabase.rpc('create_collection', {
      title: name
    })

    console.log('Create category result:', { category, error })

    if (error) throw error

    return NextResponse.json({
      category: {
        id: category.id,
        name: category.title
      }
    })
  } catch (error) {
    console.error('Error creating category:', error)
    return NextResponse.json(
      { error: 'Failed to create category' },
      { status: 500 }
    )
  }
}
import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

interface AccessList {
  id: string;
  name: string;
  description: string | null;
  list_type: 'auto_bundle' | 'auto_variation' | 'custom' | 'combination';
  bundle_id: string | null;
  variation_id: string | null;
  created_at: string;
  updated_at: string;
}

interface Bundle {
  id: string;
  name: string;
}

interface Variation {
  id: string;
  bundle_id: string;
  variation_name: string;
}

interface VariationInfo {
  name: string;
  bundleId: string;
}

interface VariationWithList {
  variationId: string;
  variationName: string;
  list: AccessList;
}

interface BundleGroup {
  bundleId: string;
  bundleName: string;
  bundleList?: AccessList;
  variations: VariationWithList[];
}

export async function GET(request: Request) {
  const searchParams = new URL(request.url).searchParams;
  const listType = searchParams.get('type'); // 'auto' or 'custom'
  
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Check if user is authenticated and has admin role
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Verify admin or super_admin role using RPC functions
    const [{ data: isAdmin }, { data: isSuperAdmin }] = await Promise.all([
      supabase.rpc('is_admin'),
      supabase.rpc('is_super_admin')
    ]);
      
    if (!isAdmin && !isSuperAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    // Use the RPC function to get organized access lists
    let listTypes: string[] = [];
    if (listType === 'auto') {
      listTypes = ['auto_bundle', 'auto_variation'];
    } else if (listType === 'custom') {
      listTypes = ['custom', 'combination'];
    }
    
    const { data, error } = await supabase
      .rpc('get_access_lists_organized', { p_list_type: listTypes });
    
    if (error) {
      console.error('Error fetching access lists:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    // Return the data directly from the RPC function
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in access lists API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// API endpoint to get list members
export async function POST(request: Request) {
  try {
    const { listId } = await request.json();
    
    if (!listId) {
      return NextResponse.json({ error: 'List ID is required' }, { status: 400 });
    }
    
    const supabase = createRouteHandlerClient({ cookies });
    
    // Check if user is authenticated and has admin role
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Verify admin or super_admin role using RPC functions
    const [{ data: isAdmin }, { data: isSuperAdmin }] = await Promise.all([
      supabase.rpc('is_admin'),
      supabase.rpc('is_super_admin')
    ]);
      
    if (!isAdmin && !isSuperAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    // Call the RPC function to get list members
    const { data, error } = await supabase
      .rpc('get_list_members', { p_list_id: listId });
    
    if (error) {
      console.error('Error fetching list members:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      members: data
    });
  } catch (error) {
    console.error('Error in list members API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 
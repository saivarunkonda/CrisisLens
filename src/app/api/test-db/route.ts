import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    console.log('Testing Supabase connection...');
    
    // Test with environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    console.log('URL:', supabaseUrl);
    console.log('Key exists:', !!supabaseKey);
    
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ 
        error: 'Missing environment variables',
        url: !!supabaseUrl,
        key: !!supabaseKey
      }, { status: 500 });
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Test simple connection
    const { data, error } = await supabase.from('regions').select('count');
    
    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ 
        error: 'Supabase query failed',
        details: error.message,
        code: error.code
      }, { status: 500 });
    }
    
    return NextResponse.json({ 
      success: true,
      message: 'Supabase connection working',
      count: data
    });
    
  } catch (err) {
    console.error('Test API error:', err);
    return NextResponse.json({ 
      error: 'Test API failed',
      message: err instanceof Error ? err.message : 'Unknown error'
    }, { status: 500 });
  }
}

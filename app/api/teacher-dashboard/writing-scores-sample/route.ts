import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: NextRequest) {
  try {
    // Get a sample of writing scores with all fields to understand the structure
    const { data: sampleScores, error } = await supabase
      .from('lesson_writing_scores')
      .select('*')
      .limit(5)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching sample writing scores:', error);
      return NextResponse.json(
        { error: 'Failed to fetch sample data', details: error },
        { status: 500 }
      );
    }

    // Just return the sample data since RPC might not exist
    const tableInfo = null;

    return NextResponse.json({
      sampleData: sampleScores,
      tableStructure: tableInfo,
      sampleCount: sampleScores?.length || 0,
      allFields: sampleScores?.length > 0 ? Object.keys(sampleScores[0]) : []
    });
  } catch (error) {
    console.error('Error in sample API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sample data', details: error },
      { status: 500 }
    );
  }
}
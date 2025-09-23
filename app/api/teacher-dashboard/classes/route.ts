/**
 * API endpoint for fetching teacher's classes
 * Returns all classes created by a teacher with student counts
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { teacherId } = body;

    if (!teacherId) {
      return NextResponse.json(
        { error: 'Teacher ID is required' },
        { status: 400 }
      );
    }

    // Fetch teacher's classes
    const { data: classes, error: classesError } = await supabase
      .from('teacher_classes')
      .select('*')
      .eq('teacher_id', teacherId)
      .order('created_at', { ascending: false });

    if (classesError) {
      console.error('Error fetching classes:', classesError);
      return NextResponse.json(
        { error: 'Failed to fetch classes' },
        { status: 500 }
      );
    }

    // Get student counts for each class
    const classesWithCounts = await Promise.all(
      (classes || []).map(async (cls) => {
        const { count } = await supabase
          .from('teacher_students')
          .select('*', { count: 'exact', head: true })
          .eq('class_id', cls.id)
          .eq('status', 'active');

        return {
          id: cls.id,
          name: cls.class_name,
          description: cls.description,
          studentCount: count || 0,
          createdAt: cls.created_at
        };
      })
    );

    return NextResponse.json(classesWithCounts);
  } catch (error) {
    console.error('Error in teacher-dashboard/classes API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch classes' },
      { status: 500 }
    );
  }
}
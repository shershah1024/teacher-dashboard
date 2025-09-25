import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { auth } from '@clerk/nextjs/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { email, courseId, classId } = body;

    if (!email || !courseId) {
      return NextResponse.json(
        { error: 'Email and courseId are required' },
        { status: 400 }
      );
    }

    // Update enrollment status to active
    let query = supabase
      .from('student_enrollments')
      .update({
        status: 'active',
        invitation_status: 'accepted',
        invitation_accepted_at: new Date().toISOString(),
        activated_at: new Date().toISOString(),
        clerk_user_id: userId
      })
      .eq('student_email', email)
      .eq('course_id', courseId);

    if (classId) {
      query = query.eq('class_id', classId);
    }

    const { data, error } = await query.select();

    if (error) {
      console.error('Error activating enrollment:', error);
      return NextResponse.json(
        { error: 'Failed to activate enrollment' },
        { status: 500 }
      );
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: 'Enrollment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Enrollment activated successfully',
      enrollment: data[0]
    });

  } catch (error) {
    console.error('Error in activate-enrollment API:', error);
    return NextResponse.json(
      { error: 'Failed to activate enrollment' },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { auth } from '@clerk/nextjs/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface ClassData {
  classId: string;
  className: string;
  courseId: string;
  organizationCode: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  schedule?: any;
  maxStudents?: number;
}

// GET - Fetch all classes
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const organizationCode = searchParams.get('organization') || 'ANB';
    const courseId = searchParams.get('course');
    const status = searchParams.get('status') || 'active';

    // Build query
    let query = supabase
      .from('classes')
      .select('*')
      .eq('organization_code', organizationCode);

    if (courseId) {
      query = query.eq('course_id', courseId);
    }

    if (status !== 'all') {
      query = query.eq('status', status);
    }

    const { data: classes, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching classes:', error);
      return NextResponse.json(
        { error: 'Failed to fetch classes' },
        { status: 500 }
      );
    }

    // Get enrollment counts for each class
    const classesWithCounts = await Promise.all(
      (classes || []).map(async (classItem) => {
        const { count } = await supabase
          .from('student_enrollments')
          .select('*', { count: 'exact', head: true })
          .eq('class_id', classItem.class_id)
          .eq('organization_code', organizationCode);

        return {
          ...classItem,
          current_students: count || 0
        };
      })
    );

    return NextResponse.json({
      classes: classesWithCounts,
      summary: {
        total: classesWithCounts.length,
        active: classesWithCounts.filter(c => c.status === 'active').length,
        totalStudents: classesWithCounts.reduce((sum, c) => sum + (c.current_students || 0), 0)
      }
    });

  } catch (error) {
    console.error('Error in GET classes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch classes' },
      { status: 500 }
    );
  }
}

// POST - Create a new class
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body: ClassData = await request.json();
    const {
      classId,
      className,
      courseId,
      organizationCode,
      description,
      startDate,
      endDate,
      schedule,
      maxStudents
    } = body;

    // Validate required fields
    if (!classId || !className || !courseId || !organizationCode) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate course ID
    const validCourses = ['telc_a1', 'telc_a2', 'telc_b1', 'telc_b2'];
    if (!validCourses.includes(courseId)) {
      return NextResponse.json(
        { error: 'Invalid course ID' },
        { status: 400 }
      );
    }

    // Check if class ID already exists
    const { data: existingClass } = await supabase
      .from('classes')
      .select('*')
      .eq('class_id', classId)
      .eq('organization_code', organizationCode)
      .single();

    if (existingClass) {
      return NextResponse.json(
        { error: 'Class ID already exists in this organization' },
        { status: 400 }
      );
    }

    // Create the class
    const { data: newClass, error: insertError } = await supabase
      .from('classes')
      .insert({
        class_id: classId,
        class_name: className,
        course_id: courseId,
        organization_code: organizationCode,
        teacher_id: userId,
        description,
        start_date: startDate,
        end_date: endDate,
        schedule,
        max_students: maxStudents || 30,
        current_students: 0,
        status: 'active'
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating class:', insertError);
      return NextResponse.json(
        { error: 'Failed to create class' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      class: newClass
    });

  } catch (error) {
    console.error('Error in POST classes:', error);
    return NextResponse.json(
      { error: 'Failed to create class' },
      { status: 500 }
    );
  }
}

// PUT - Update a class
export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Class ID required' },
        { status: 400 }
      );
    }

    const { data: updatedClass, error: updateError } = await supabase
      .from('classes')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating class:', updateError);
      return NextResponse.json(
        { error: 'Failed to update class' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      class: updatedClass
    });

  } catch (error) {
    console.error('Error in PUT classes:', error);
    return NextResponse.json(
      { error: 'Failed to update class' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a class
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { classId } = body;

    if (!classId) {
      return NextResponse.json(
        { error: 'Class ID required' },
        { status: 400 }
      );
    }

    // Check if there are students enrolled in this class
    const { count } = await supabase
      .from('student_enrollments')
      .select('*', { count: 'exact', head: true })
      .eq('class_id', classId);

    if (count && count > 0) {
      return NextResponse.json(
        { error: `Cannot delete class with ${count} enrolled students. Please reassign or remove students first.` },
        { status: 400 }
      );
    }

    const { error: deleteError } = await supabase
      .from('classes')
      .delete()
      .eq('class_id', classId);

    if (deleteError) {
      console.error('Error deleting class:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete class' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Class deleted successfully'
    });

  } catch (error) {
    console.error('Error in DELETE classes:', error);
    return NextResponse.json(
      { error: 'Failed to delete class' },
      { status: 500 }
    );
  }
}
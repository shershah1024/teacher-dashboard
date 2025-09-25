import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { auth } from '@clerk/nextjs/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Email validation regex
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface EnrollmentRequest {
  emails: string | string[];
  courseId: string;
  organizationCode: string;
  classId?: string;
}

interface EnrollmentResult {
  email: string;
  success: boolean;
  message: string;
  alreadyEnrolled?: boolean;
}

export async function POST(request: NextRequest) {
  try {
    // Get the authenticated user
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body: EnrollmentRequest = await request.json();
    const { emails, courseId, organizationCode, classId } = body;

    // Validate course ID
    const validCourses = ['telc_a1', 'telc_a2', 'telc_b1', 'telc_b2'];
    if (!validCourses.includes(courseId)) {
      return NextResponse.json(
        { error: 'Invalid course ID' },
        { status: 400 }
      );
    }

    // Parse emails - handle both string and array inputs
    let emailList: string[] = [];
    
    if (typeof emails === 'string') {
      // Split by comma, semicolon, or newline and clean up
      emailList = emails
        .split(/[,;\n]+/)
        .map(email => email.trim().toLowerCase())
        .filter(email => email.length > 0);
    } else if (Array.isArray(emails)) {
      emailList = emails.map(email => email.trim().toLowerCase());
    } else {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Remove duplicates
    emailList = [...new Set(emailList)];

    // Validate all emails
    const invalidEmails = emailList.filter(email => !emailRegex.test(email));
    if (invalidEmails.length > 0) {
      return NextResponse.json(
        { 
          error: 'Invalid email addresses found',
          invalidEmails 
        },
        { status: 400 }
      );
    }

    // Process each email
    const results: EnrollmentResult[] = [];
    
    for (const email of emailList) {
      try {
        // Build query to check existing enrollment
        let checkQuery = supabase
          .from('student_enrollments')
          .select('*')
          .eq('student_email', email)
          .eq('course_id', courseId)
          .eq('organization_code', organizationCode);
        
        // Add class_id to the query if provided
        if (classId) {
          checkQuery = checkQuery.eq('class_id', classId);
        }
        
        const { data: existingEnrollment, error: checkError } = await checkQuery.single();

        if (checkError && checkError.code !== 'PGRST116') {
          // Error other than "not found"
          results.push({
            email,
            success: false,
            message: 'Failed to check enrollment status'
          });
          continue;
        }

        if (existingEnrollment) {
          results.push({
            email,
            success: false,
            message: 'Student already enrolled in this course',
            alreadyEnrolled: true
          });
          continue;
        }

        // Create new enrollment
        const enrollmentData: any = {
          student_email: email,
          course_id: courseId,
          organization_code: organizationCode,
          invited_by: userId,
          invited_at: new Date().toISOString(),
          status: 'invited',
          enrollment_data: {
            source: 'teacher_dashboard',
            invited_via: 'manual_entry'
          }
        };
        
        // Add class_id if provided
        if (classId) {
          enrollmentData.class_id = classId;
        }
        
        const { error: insertError } = await supabase
          .from('student_enrollments')
          .insert(enrollmentData);

        if (insertError) {
          console.error('Enrollment error for', email, ':', insertError);
          results.push({
            email,
            success: false,
            message: 'Failed to create enrollment'
          });
        } else {
          results.push({
            email,
            success: true,
            message: 'Successfully enrolled'
          });
        }
      } catch (error) {
        console.error('Error processing email', email, ':', error);
        results.push({
          email,
          success: false,
          message: 'Unexpected error during enrollment'
        });
      }
    }

    // Summary statistics
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;
    const alreadyEnrolledCount = results.filter(r => r.alreadyEnrolled).length;

    return NextResponse.json({
      summary: {
        total: emailList.length,
        successful: successCount,
        failed: failureCount,
        alreadyEnrolled: alreadyEnrolledCount
      },
      results
    });

  } catch (error) {
    console.error('Error in enroll-students API:', error);
    return NextResponse.json(
      { error: 'Failed to process enrollment request' },
      { status: 500 }
    );
  }
}

// GET endpoint to fetch existing enrollments
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

    // Build query
    let query = supabase
      .from('student_enrollments')
      .select('*')
      .eq('organization_code', organizationCode)
      .order('invited_at', { ascending: false });

    if (courseId) {
      query = query.eq('course_id', courseId);
    }

    const { data: enrollments, error } = await query;

    if (error) {
      console.error('Error fetching enrollments:', error);
      return NextResponse.json(
        { error: 'Failed to fetch enrollments' },
        { status: 500 }
      );
    }

    // Group by course for summary
    const courseGroups = enrollments?.reduce((acc: any, enrollment) => {
      const course = enrollment.course_id;
      if (!acc[course]) {
        acc[course] = {
          total: 0,
          active: 0,
          invited: 0
        };
      }
      acc[course].total++;
      if (enrollment.status === 'active') {
        acc[course].active++;
      } else if (enrollment.status === 'invited') {
        acc[course].invited++;
      }
      return acc;
    }, {}) || {};

    return NextResponse.json({
      enrollments: enrollments || [],
      summary: {
        total: enrollments?.length || 0,
        byStatus: {
          active: enrollments?.filter(e => e.status === 'active').length || 0,
          invited: enrollments?.filter(e => e.status === 'invited').length || 0
        },
        byCourse: courseGroups
      }
    });

  } catch (error) {
    console.error('Error in GET enroll-students:', error);
    return NextResponse.json(
      { error: 'Failed to fetch enrollments' },
      { status: 500 }
    );
  }
}

// DELETE endpoint to remove enrollments
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
    const { enrollmentId } = body;

    if (!enrollmentId) {
      return NextResponse.json(
        { error: 'Enrollment ID required' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('student_enrollments')
      .delete()
      .eq('id', enrollmentId);

    if (error) {
      console.error('Error deleting enrollment:', error);
      return NextResponse.json(
        { error: 'Failed to delete enrollment' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Enrollment deleted successfully'
    });

  } catch (error) {
    console.error('Error in DELETE enroll-students:', error);
    return NextResponse.json(
      { error: 'Failed to delete enrollment' },
      { status: 500 }
    );
  }
}
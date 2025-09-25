import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { getCourseLessonUrl, isValidCourseId } from '@/lib/course-config';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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
  invitationId?: string;
  alreadyEnrolled?: boolean;
  userExists?: boolean;
}

const parseEmails = (emails: string | string[]): string[] => {
  let emailList: string[] = [];
  
  if (typeof emails === 'string') {
    emailList = emails
      .split(/[,;\n]+/)
      .map(email => email.trim().toLowerCase())
      .filter(email => email.length > 0);
  } else if (Array.isArray(emails)) {
    emailList = emails.map(email => email.trim().toLowerCase());
  }
  
  return [...new Set(emailList)];
};

const checkExistingEnrollment = async (
  email: string, 
  courseId: string, 
  organizationCode: string, 
  classId?: string
) => {
  let query = supabase
    .from('student_enrollments')
    .select('*')
    .eq('student_email', email)
    .eq('course_id', courseId)
    .eq('organization_code', organizationCode);
  
  if (classId && classId !== 'none') {
    query = query.eq('class_id', classId);
  }
  
  const { data, error } = await query.single();
  
  if (error && error.code !== 'PGRST116') {
    throw error;
  }
  
  return data;
};

export async function POST(request: NextRequest) {
  try {
    // Check if Clerk is properly configured
    if (!process.env.CLERK_SECRET_KEY) {
      console.error('CLERK_SECRET_KEY is not configured');
      return NextResponse.json(
        { error: 'Magic link invitations are not configured. Please contact support.' },
        { status: 500 }
      );
    }

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
    if (!isValidCourseId(courseId)) {
      return NextResponse.json(
        { error: 'Invalid course ID' },
        { status: 400 }
      );
    }

    // Parse emails
    const emailList = parseEmails(emails);

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

    const results: EnrollmentResult[] = [];

    for (const email of emailList) {
      try {
        // 1. Check existing enrollment
        const existingEnrollment = await checkExistingEnrollment(
          email, 
          courseId, 
          organizationCode, 
          classId === 'none' ? undefined : classId
        );
        
        if (existingEnrollment) {
          results.push({
            email,
            success: false,
            message: 'Student already enrolled in this course',
            alreadyEnrolled: true
          });
          continue;
        }

        // 2. Create Clerk invitation with metadata
        // Redirect directly to the course platform - no intermediary page
        const coursePlatformUrl = getCourseLessonUrl(courseId);
        const redirectUrl = coursePlatformUrl; // Direct redirect to course platform
        
        console.log('Creating invitation with direct redirect to:', redirectUrl);
        
        const invitationMetadata: any = {
          role: 'student',
          courseId,
          organizationCode,
          invitedBy: userId,
          enrollmentType: 'teacher_invitation',
          coursePlatformUrl: getCourseLessonUrl(courseId) // Store the platform URL
        };

        if (classId && classId !== 'none') {
          invitationMetadata.classId = classId;
        }

        // Get the Clerk client instance (async in v6+)
        const clerk = await clerkClient();
        
        const invitation = await clerk.invitations.createInvitation({
          emailAddress: email,
          redirectUrl,
          publicMetadata: invitationMetadata,
          notify: true
        });

        // 3. Create database enrollment record
        const enrollmentData: any = {
          student_email: email,
          course_id: courseId,
          organization_code: organizationCode,
          invited_by: userId,
          invitation_id: invitation.id,
          invitation_status: 'sent',
          invitation_sent_at: new Date().toISOString(),
          status: 'invited',
          enrollment_data: {
            source: 'teacher_dashboard',
            invitation_method: 'magic_link',
            clerk_invitation_id: invitation.id,
            course_platform_url: getCourseLessonUrl(courseId)
          }
        };

        if (classId && classId !== 'none') {
          enrollmentData.class_id = classId;
        }

        const { error: insertError } = await supabase
          .from('student_enrollments')
          .insert(enrollmentData);

        if (insertError) {
          console.error('Database enrollment error for', email, ':', insertError);
          
          // Attempt to revoke the invitation if database insert fails
          try {
            const clerk = await clerkClient();
            await clerk.invitations.revokeInvitation(invitation.id);
          } catch (revokeError) {
            console.error('Failed to revoke invitation:', revokeError);
          }
          
          results.push({
            email,
            success: false,
            message: 'Failed to create enrollment record'
          });
          continue;
        }

        results.push({
          email,
          success: true,
          message: 'Magic link invitation sent successfully',
          invitationId: invitation.id
        });

      } catch (error: any) {
        console.error(`Error inviting ${email}:`, error);
        
        // Log detailed error information for debugging
        if (error.errors) {
          console.error('Clerk error details:', JSON.stringify(error.errors, null, 2));
        }
        
        // Handle specific Clerk errors
        let errorMessage = 'Failed to send invitation';
        
        if (error.errors && error.errors.length > 0) {
          const clerkError = error.errors[0];
          
          if (clerkError.code === 'form_identifier_exists') {
            errorMessage = 'User already exists - they may sign in directly';
            results.push({
              email,
              success: false,
              message: errorMessage,
              userExists: true
            });
            continue;
          }
          
          if (clerkError.code === 'form_identifier_not_allowed') {
            errorMessage = 'Email address not allowed';
          }
          
          // Log the specific error for debugging
          errorMessage = clerkError.message || errorMessage;
          console.log(`Clerk error code: ${clerkError.code}, message: ${clerkError.message}`);
        }
        
        // Handle 422 Unprocessable Entity
        if (error.status === 422) {
          errorMessage = 'Invalid invitation parameters. Please check Clerk configuration.';
          console.error('422 Error - Possible causes:');
          console.error('1. Invitations not enabled in Clerk Dashboard');
          console.error('2. Invalid redirect URL (not whitelisted)');
          console.error('3. Sign-up mode is set to "Closed"');
        }

        results.push({
          email,
          success: false,
          message: errorMessage
        });
      }
    }

    // Summary statistics
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;
    const alreadyEnrolledCount = results.filter(r => r.alreadyEnrolled).length;
    const userExistsCount = results.filter(r => r.userExists).length;

    return NextResponse.json({
      summary: {
        total: emailList.length,
        successful: successCount,
        failed: failureCount,
        alreadyEnrolled: alreadyEnrolledCount,
        userExists: userExistsCount
      },
      results
    });

  } catch (error) {
    console.error('Error in enroll-students-magic API:', error);
    return NextResponse.json(
      { error: 'Failed to process magic link enrollments' },
      { status: 500 }
    );
  }
}

// GET endpoint to check invitation status
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
    const invitationId = searchParams.get('invitationId');

    if (invitationId) {
      // Get specific invitation status
      try {
        const clerk = await clerkClient();
        const invitation = await clerk.invitations.getInvitation(invitationId);
        return NextResponse.json({ invitation });
      } catch (error) {
        return NextResponse.json(
          { error: 'Invitation not found' },
          { status: 404 }
        );
      }
    }

    // Get all enrollments with invitation status
    const { data: enrollments, error } = await supabase
      .from('student_enrollments')
      .select('*')
      .eq('organization_code', organizationCode)
      .not('invitation_id', 'is', null)
      .order('invitation_sent_at', { ascending: false });

    if (error) {
      console.error('Error fetching enrollments with invitations:', error);
      return NextResponse.json(
        { error: 'Failed to fetch enrollments' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      enrollments: enrollments || [],
      summary: {
        total: enrollments?.length || 0,
        sent: enrollments?.filter(e => e.invitation_status === 'sent').length || 0,
        accepted: enrollments?.filter(e => e.invitation_status === 'accepted').length || 0,
        expired: enrollments?.filter(e => e.invitation_status === 'expired').length || 0
      }
    });

  } catch (error) {
    console.error('Error in GET enroll-students-magic:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invitation status' },
      { status: 500 }
    );
  }
}
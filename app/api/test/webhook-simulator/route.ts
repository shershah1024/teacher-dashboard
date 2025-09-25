import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// This is a TEST endpoint for simulating Clerk webhooks
// DO NOT USE IN PRODUCTION

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: NextRequest) {
  try {
    // Only allow in development
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'This endpoint is disabled in production' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { email, courseId, classId, organizationCode, action } = body;

    if (!email || !courseId || !organizationCode) {
      return NextResponse.json(
        { error: 'Missing required fields: email, courseId, organizationCode' },
        { status: 400 }
      );
    }

    // Simulate different webhook scenarios
    switch (action) {
      case 'activate': {
        // Simulate user.created webhook - activate enrollment
        const clerkUserId = `user_test_${Date.now()}`;
        
        let query = supabase
          .from('student_enrollments')
          .update({
            status: 'active',
            invitation_status: 'accepted',
            invitation_accepted_at: new Date().toISOString(),
            activated_at: new Date().toISOString(),
            clerk_user_id: clerkUserId
          })
          .eq('student_email', email)
          .eq('course_id', courseId)
          .eq('organization_code', organizationCode);

        if (classId && classId !== 'none') {
          query = query.eq('class_id', classId);
        } else {
          query = query.is('class_id', null);
        }

        const { data, error } = await query.select();

        if (error) {
          return NextResponse.json(
            { error: 'Failed to activate enrollment', details: error },
            { status: 500 }
          );
        }

        if (!data || data.length === 0) {
          return NextResponse.json(
            { error: 'No matching enrollment found' },
            { status: 404 }
          );
        }

        return NextResponse.json({
          success: true,
          message: 'Enrollment activated successfully',
          enrollment: data[0],
          simulatedWebhook: {
            type: 'user.created',
            clerkUserId,
            timestamp: new Date().toISOString()
          }
        });
      }

      case 'deactivate': {
        // Simulate user.deleted webhook - deactivate enrollment
        let query = supabase
          .from('student_enrollments')
          .update({
            status: 'inactive',
            clerk_user_id: null,
            enrollment_data: { user_deleted: true, deleted_at: new Date().toISOString() }
          })
          .eq('student_email', email)
          .eq('course_id', courseId)
          .eq('organization_code', organizationCode);

        if (classId && classId !== 'none') {
          query = query.eq('class_id', classId);
        }

        const { data, error } = await query.select();

        if (error) {
          return NextResponse.json(
            { error: 'Failed to deactivate enrollment', details: error },
            { status: 500 }
          );
        }

        return NextResponse.json({
          success: true,
          message: 'Enrollment deactivated successfully',
          enrollment: data?.[0],
          simulatedWebhook: {
            type: 'user.deleted',
            timestamp: new Date().toISOString()
          }
        });
      }

      case 'check': {
        // Check enrollment status
        let query = supabase
          .from('student_enrollments')
          .select('*')
          .eq('student_email', email)
          .eq('course_id', courseId)
          .eq('organization_code', organizationCode);

        if (classId && classId !== 'none') {
          query = query.eq('class_id', classId);
        }

        const { data, error } = await query;

        if (error) {
          return NextResponse.json(
            { error: 'Failed to check enrollment', details: error },
            { status: 500 }
          );
        }

        return NextResponse.json({
          success: true,
          enrollment: data?.[0] || null,
          found: data && data.length > 0
        });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: activate, deactivate, or check' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Webhook simulator error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint to show usage instructions
export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'This endpoint is disabled in production' },
      { status: 403 }
    );
  }

  return NextResponse.json({
    description: 'Webhook Simulator for Testing Clerk Integration',
    usage: {
      endpoint: 'POST /api/test/webhook-simulator',
      actions: {
        activate: 'Simulate user.created webhook to activate enrollment',
        deactivate: 'Simulate user.deleted webhook to deactivate enrollment',
        check: 'Check current enrollment status'
      },
      requiredFields: {
        email: 'Student email address',
        courseId: 'Course ID (e.g., telc_a1)',
        organizationCode: 'Organization code (e.g., ANB)',
        action: 'One of: activate, deactivate, check'
      },
      optionalFields: {
        classId: 'Class ID (optional)'
      }
    },
    examples: {
      activate: {
        method: 'POST',
        body: {
          email: 'student@example.com',
          courseId: 'telc_a1',
          organizationCode: 'ANB',
          action: 'activate'
        }
      },
      check: {
        method: 'POST',
        body: {
          email: 'student@example.com',
          courseId: 'telc_a1',
          organizationCode: 'ANB',
          action: 'check'
        }
      }
    },
    curlExamples: {
      activate: `curl -X POST http://localhost:3000/api/test/webhook-simulator \\
        -H "Content-Type: application/json" \\
        -d '{"email":"test@example.com","courseId":"telc_a1","organizationCode":"ANB","action":"activate"}'`,
      check: `curl -X POST http://localhost:3000/api/test/webhook-simulator \\
        -H "Content-Type: application/json" \\
        -d '{"email":"test@example.com","courseId":"telc_a1","organizationCode":"ANB","action":"check"}'`
    },
    warning: '⚠️ This endpoint is for testing only and will be disabled in production'
  });
}
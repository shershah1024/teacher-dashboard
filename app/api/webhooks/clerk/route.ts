import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { WebhookEvent } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

// Use service role key for webhook operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    console.error('CLERK_WEBHOOK_SECRET is not configured');
    return new Response('Webhook secret not configured', { status: 500 });
  }

  // Get the headers
  const headerPayload = headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    console.error('Missing svix headers');
    return new Response('Missing required headers', { status: 400 });
  }

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Create a new Svix instance with your webhook secret
  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: WebhookEvent;

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return new Response('Invalid webhook signature', { status: 400 });
  }

  // Handle the webhook
  const eventType = evt.type;
  console.log(`Received Clerk webhook: ${eventType}`);

  try {
    switch (eventType) {
      case 'user.created':
        await handleUserCreated(evt.data);
        break;
      
      case 'user.updated':
        await handleUserUpdated(evt.data);
        break;
      
      case 'user.deleted':
        await handleUserDeleted(evt.data);
        break;
      
      default:
        console.log(`Unhandled webhook event: ${eventType}`);
    }
  } catch (error) {
    console.error(`Error processing webhook ${eventType}:`, error);
    return new Response('Webhook processing failed', { status: 500 });
  }

  return new Response('Webhook processed successfully', { status: 200 });
}

async function handleUserCreated(userData: any) {
  const { id, email_addresses, public_metadata } = userData;
  
  console.log('Processing user.created webhook:', {
    userId: id,
    email: email_addresses[0]?.email_address,
    metadata: public_metadata
  });

  // Check if this is a student invitation
  if (public_metadata?.role === 'student' && public_metadata?.courseId) {
    const email = email_addresses[0]?.email_address;
    const { courseId, classId, organizationCode } = public_metadata;
    
    if (!email) {
      console.error('No email address found for user:', id);
      return;
    }

    try {
      // Build query to find matching enrollment
      let query = supabase
        .from('student_enrollments')
        .update({
          status: 'active',
          invitation_status: 'accepted',
          invitation_accepted_at: new Date().toISOString(),
          activated_at: new Date().toISOString(),
          clerk_user_id: id
        })
        .eq('student_email', email)
        .eq('course_id', courseId)
        .eq('organization_code', organizationCode);

      // Add class_id to query if provided
      if (classId) {
        query = query.eq('class_id', classId);
      } else {
        query = query.is('class_id', null);
      }

      const { data, error } = await query.select();

      if (error) {
        console.error('Error updating enrollment for user creation:', error);
        return;
      }

      if (!data || data.length === 0) {
        console.warn(`No matching enrollment found for ${email} in course ${courseId}`);
        return;
      }

      console.log(`Successfully activated enrollment for ${email} in ${courseId}`);
      
      // Optionally, you could trigger additional actions here like:
      // - Send welcome email
      // - Create initial progress records
      // - Notify teacher
      
    } catch (error) {
      console.error('Error processing student enrollment activation:', error);
    }
  }
}

async function handleUserUpdated(userData: any) {
  const { id, email_addresses, public_metadata } = userData;
  
  console.log('Processing user.updated webhook:', {
    userId: id,
    email: email_addresses[0]?.email_address
  });

  // Handle user updates if needed
  // For example, sync profile changes with your database
}

async function handleUserDeleted(userData: any) {
  const { id } = userData;
  
  console.log('Processing user.deleted webhook:', {
    userId: id
  });

  try {
    // Update enrollments when user is deleted
    const { error } = await supabase
      .from('student_enrollments')
      .update({
        status: 'inactive',
        clerk_user_id: null,
        enrollment_data: supabase.raw(`
          COALESCE(enrollment_data, '{}') || '{"user_deleted": true, "deleted_at": "${new Date().toISOString()}"}'
        `)
      })
      .eq('clerk_user_id', id);

    if (error) {
      console.error('Error updating enrollments for deleted user:', error);
    } else {
      console.log(`Updated enrollments for deleted user: ${id}`);
    }
  } catch (error) {
    console.error('Error processing user deletion:', error);
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';

// Test endpoint to debug Clerk invitations
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
    const { email } = body;

    const clerk = await clerkClient();
    
    // Test 1: Minimal invitation (no redirect URL)
    console.log('Test 1: Creating minimal invitation...');
    try {
      const invitation1 = await clerk.invitations.createInvitation({
        emailAddress: email
      });
      
      console.log('Success with minimal params:', invitation1);
      
      return NextResponse.json({
        success: true,
        test: 'minimal',
        invitationId: invitation1.id
      });
    } catch (error1: any) {
      console.error('Test 1 failed:', error1);
      console.error('Error details:', error1.errors);
      
      // Test 2: With notify parameter only
      console.log('Test 2: With notify parameter...');
      try {
        const invitation2 = await clerk.invitations.createInvitation({
          emailAddress: email,
          notify: true
        });
        
        console.log('Success with notify:', invitation2);
        
        return NextResponse.json({
          success: true,
          test: 'notify',
          invitationId: invitation2.id
        });
      } catch (error2: any) {
        console.error('Test 2 failed:', error2);
        console.error('Error details:', error2.errors);
        
        // Test 3: With metadata only
        console.log('Test 3: With metadata only...');
        try {
          const invitation3 = await clerk.invitations.createInvitation({
            emailAddress: email,
            publicMetadata: {
              role: 'student'
            }
          });
          
          console.log('Success with metadata:', invitation3);
          
          return NextResponse.json({
            success: true,
            test: 'metadata',
            invitationId: invitation3.id
          });
        } catch (error3: any) {
          console.error('Test 3 failed:', error3);
          console.error('Error details:', error3.errors);
          
          return NextResponse.json({
            error: 'All tests failed',
            test1Error: error1.errors?.[0],
            test2Error: error2.errors?.[0],
            test3Error: error3.errors?.[0]
          }, { status: 400 });
        }
      }
    }
  } catch (error: any) {
    console.error('General error:', error);
    return NextResponse.json(
      { error: 'Failed to test invitation' },
      { status: 500 }
    );
  }
}
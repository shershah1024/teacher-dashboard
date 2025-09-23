import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getUsersWithEmailsByIds } from '@/lib/clerk-utils';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { organizationCode, includeEmails = true } = body;

    const defaultOrgCode = 'ANB';
    const orgCode = organizationCode || defaultOrgCode;

    // Get all users in organization from Supabase
    const { data: orgUsers, error } = await supabase
      .from('user_organizations')
      .select('user_id, organization_name, organization_code')
      .eq('organization_code', orgCode);

    if (error) {
      console.error('Error fetching organization users:', error);
      return NextResponse.json(
        { error: 'Failed to fetch organization users' },
        { status: 500 }
      );
    }

    if (!orgUsers || orgUsers.length === 0) {
      return NextResponse.json({
        users: [],
        stats: {
          totalUsers: 0,
          usersWithEmails: 0,
          usersWithoutEmails: 0
        }
      });
    }

    const userIds = orgUsers.map(u => u.user_id);
    let usersWithEmails = [];

    if (includeEmails) {
      // Get email addresses from Clerk
      console.log(`Fetching email data for ${userIds.length} users...`);
      usersWithEmails = await getUsersWithEmailsByIds(userIds);
      
      // Enrich with organization data
      usersWithEmails = usersWithEmails.map(user => {
        const orgData = orgUsers.find(ou => ou.user_id === user.userId);
        return {
          ...user,
          organizationName: orgData?.organization_name || 'Unknown',
          organizationCode: orgData?.organization_code || orgCode
        };
      });
    } else {
      // Return basic user data without emails
      usersWithEmails = orgUsers.map(orgUser => ({
        userId: orgUser.user_id,
        email: null,
        firstName: null,
        lastName: null,
        fullName: `Student ${orgUser.user_id.slice(5, 9)}`,
        organizationName: orgUser.organization_name,
        organizationCode: orgUser.organization_code
      }));
    }

    // Calculate statistics
    const stats = {
      totalUsers: usersWithEmails.length,
      usersWithEmails: usersWithEmails.filter(u => u.email).length,
      usersWithoutEmails: usersWithEmails.filter(u => !u.email).length,
      organizationCode: orgCode
    };

    return NextResponse.json({
      users: usersWithEmails,
      stats
    });
  } catch (error) {
    console.error('Error in users-with-emails API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users with emails' },
      { status: 500 }
    );
  }
}

// GET endpoint for quick user lookup
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const orgCode = searchParams.get('organizationCode') || 'ANB';
  const limit = parseInt(searchParams.get('limit') || '50');

  try {
    const { data: orgUsers, error } = await supabase
      .from('user_organizations')
      .select('user_id, organization_name')
      .eq('organization_code', orgCode)
      .limit(limit);

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }

    const userIds = orgUsers?.map(u => u.user_id) || [];
    const usersWithEmails = await getUsersWithEmailsByIds(userIds);

    return NextResponse.json({
      users: usersWithEmails.slice(0, limit),
      totalFound: usersWithEmails.length
    });
  } catch (error) {
    console.error('Error in GET users-with-emails:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}
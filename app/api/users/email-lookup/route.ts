import { NextRequest, NextResponse } from 'next/server';
import { 
  getUserEmailById, 
  getUserWithEmailById, 
  getUsersWithEmailsByIds,
  getUsersByEmailAddresses,
  searchUsers 
} from '@/lib/clerk-utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, userIds, userId, emailAddresses, query } = body;

    switch (action) {
      case 'getEmailById':
        if (!userId) {
          return NextResponse.json({ error: 'userId is required' }, { status: 400 });
        }
        const email = await getUserEmailById(userId);
        return NextResponse.json({ userId, email });

      case 'getUserWithEmail':
        if (!userId) {
          return NextResponse.json({ error: 'userId is required' }, { status: 400 });
        }
        const user = await getUserWithEmailById(userId);
        return NextResponse.json({ user });

      case 'getBatchEmails':
        if (!userIds || !Array.isArray(userIds)) {
          return NextResponse.json({ error: 'userIds array is required' }, { status: 400 });
        }
        const users = await getUsersWithEmailsByIds(userIds);
        return NextResponse.json({ users });

      case 'getUsersByEmails':
        if (!emailAddresses || !Array.isArray(emailAddresses)) {
          return NextResponse.json({ error: 'emailAddresses array is required' }, { status: 400 });
        }
        const usersByEmails = await getUsersByEmailAddresses(emailAddresses);
        return NextResponse.json({ users: usersByEmails });

      case 'searchUsers':
        if (!query) {
          return NextResponse.json({ error: 'query is required' }, { status: 400 });
        }
        const searchResults = await searchUsers(query);
        return NextResponse.json({ users: searchResults });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in email-lookup API:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const userId = searchParams.get('userId');
  
  if (!userId) {
    return NextResponse.json({ error: 'userId query parameter is required' }, { status: 400 });
  }

  try {
    const user = await getUserWithEmailById(userId);
    return NextResponse.json({ user });
  } catch (error) {
    console.error('Error in email-lookup GET API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user data' },
      { status: 500 }
    );
  }
}
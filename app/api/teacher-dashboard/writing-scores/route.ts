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
    const { organizationCode, userId, filters } = body;

    const defaultOrgCode = 'ANB';
    const orgCode = organizationCode || defaultOrgCode;

    let query = supabase
      .from('lesson_writing_scores')
      .select('*')
      .order('created_at', { ascending: false });

    // If a specific user is requested
    if (userId) {
      query = query.eq('user_id', userId);
    } else {
      // Get all users in organization first
      const { data: orgUsers } = await supabase
        .from('user_organizations')
        .select('user_id')
        .eq('organization_code', orgCode);

      if (orgUsers && orgUsers.length > 0) {
        const userIds = orgUsers.map(u => u.user_id);
        query = query.in('user_id', userIds);
      }
    }

    // Apply filters
    if (filters) {
      // Date range filter
      if (filters.startDate) {
        query = query.gte('created_at', filters.startDate);
      }
      if (filters.endDate) {
        query = query.lte('created_at', filters.endDate);
      }
      
      // Score range filter
      if (filters.minScore !== undefined) {
        query = query.gte('score', filters.minScore);
      }
      if (filters.maxScore !== undefined) {
        query = query.lte('score', filters.maxScore);
      }
      
      // Task type filter
      if (filters.taskType) {
        query = query.eq('task_type', filters.taskType);
      }
      
      // Lesson filter
      if (filters.lessonId) {
        query = query.eq('lesson_id', filters.lessonId);
      }
    }

    const { data: writingScores, error } = await query;

    if (error) {
      console.error('Error fetching writing scores:', error);
      return NextResponse.json(
        { error: 'Failed to fetch writing scores' },
        { status: 500 }
      );
    }

    // Get user details for all unique user IDs
    const uniqueUserIds = [...new Set(writingScores?.map(score => score.user_id) || [])];
    
    // Get user details with emails from Clerk (optional)
    let usersWithEmails = [];
    try {
      if (process.env.CLERK_SECRET_KEY) {
        usersWithEmails = await getUsersWithEmailsByIds(uniqueUserIds);
      } else {
        console.warn('CLERK_SECRET_KEY not configured, skipping email lookup');
        // Create placeholder user data without emails
        usersWithEmails = uniqueUserIds.map(userId => ({
          userId,
          email: null,
          firstName: null,
          lastName: null,
          fullName: `Student ${userId.slice(5, 9)}`
        }));
      }
    } catch (error) {
      console.warn('Failed to fetch emails from Clerk:', error);
      // Fallback to placeholder data
      usersWithEmails = uniqueUserIds.map(userId => ({
        userId,
        email: null,
        firstName: null,
        lastName: null,
        fullName: `Student ${userId.slice(5, 9)}`
      }));
    }
    
    // Get organization data from Supabase
    const userDetailsPromises = uniqueUserIds.map(async (uid) => {
      const { data: orgData } = await supabase
        .from('user_organizations')
        .select('organization_name')
        .eq('user_id', uid)
        .single();

      return {
        user_id: uid,
        organization: orgData?.organization_name || 'Unknown'
      };
    });

    const orgDetails = await Promise.all(userDetailsPromises);
    const orgDetailsMap = Object.fromEntries(
      orgDetails.map(u => [u.user_id, u])
    );

    // Create combined user details map
    const userDetailsMap = Object.fromEntries(
      usersWithEmails.map(u => [u.userId, {
        user_id: u.userId,
        name: u.fullName || `Student ${u.userId.slice(5, 9)}`,
        email: u.email,
        firstName: u.firstName,
        lastName: u.lastName,
        organization: orgDetailsMap[u.userId]?.organization || 'Unknown'
      }])
    );

    // Enrich writing scores with user details
    const enrichedScores = writingScores?.map(score => ({
      ...score,
      userName: userDetailsMap[score.user_id]?.name,
      userEmail: userDetailsMap[score.user_id]?.email,
      userFirstName: userDetailsMap[score.user_id]?.firstName,
      userLastName: userDetailsMap[score.user_id]?.lastName,
      organization: userDetailsMap[score.user_id]?.organization
    }));

    // Calculate statistics
    const stats = {
      totalEntries: enrichedScores?.length || 0,
      averageScore: enrichedScores?.length 
        ? enrichedScores.reduce((acc, s) => acc + (s.score || 0), 0) / enrichedScores.length
        : 0,
      uniqueLearners: uniqueUserIds.length,
      scoreDistribution: calculateScoreDistribution(enrichedScores || []),
      recentActivity: enrichedScores?.slice(0, 10) || []
    };

    return NextResponse.json({
      scores: enrichedScores,
      stats,
      users: Object.values(userDetailsMap)
    });
  } catch (error) {
    console.error('Error in writing-scores API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch writing scores data' },
      { status: 500 }
    );
  }
}

function calculateScoreDistribution(scores: any[]) {
  const distribution = {
    '0-20': 0,
    '21-40': 0,
    '41-60': 0,
    '61-80': 0,
    '81-100': 0
  };

  scores.forEach(score => {
    const value = score.score || 0;
    if (value <= 20) distribution['0-20']++;
    else if (value <= 40) distribution['21-40']++;
    else if (value <= 60) distribution['41-60']++;
    else if (value <= 80) distribution['61-80']++;
    else distribution['81-100']++;
  });

  return distribution;
}
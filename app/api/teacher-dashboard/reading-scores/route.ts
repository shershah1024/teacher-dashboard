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
      .from('reading_results')
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
        query = query.gte('percentage', filters.minScore.toString());
      }
      if (filters.maxScore !== undefined) {
        query = query.lte('percentage', filters.maxScore.toString());
      }
      
      // Section filter
      if (filters.sectionId) {
        query = query.eq('section_id', filters.sectionId);
      }
      
      // Lesson filter
      if (filters.lessonId) {
        query = query.eq('lesson_id', filters.lessonId);
      }
      
      // Title filter
      if (filters.title) {
        query = query.ilike('title', `%${filters.title}%`);
      }
    }

    const { data: readingResults, error } = await query;

    if (error) {
      console.error('Error fetching reading results:', error);
      return NextResponse.json(
        { error: 'Failed to fetch reading results' },
        { status: 500 }
      );
    }

    // Get user details for all unique user IDs
    const uniqueUserIds = [...new Set(readingResults?.map(result => result.user_id) || [])];
    
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

    // Enrich reading results with user details and parse exercise results
    const enrichedResults = readingResults?.map(result => {
      let exerciseResults = [];
      try {
        exerciseResults = result.exercise_results ? JSON.parse(result.exercise_results) : [];
      } catch (e) {
        console.warn('Failed to parse exercise_results:', e);
      }

      return {
        ...result,
        userName: userDetailsMap[result.user_id]?.name,
        userEmail: userDetailsMap[result.user_id]?.email,
        userFirstName: userDetailsMap[result.user_id]?.firstName,
        userLastName: userDetailsMap[result.user_id]?.lastName,
        organization: userDetailsMap[result.user_id]?.organization,
        exerciseResults,
        scorePercentage: parseFloat(result.percentage) || 0
      };
    });

    // Calculate statistics
    const stats = {
      totalEntries: enrichedResults?.length || 0,
      averageScore: enrichedResults?.length 
        ? enrichedResults.reduce((acc, r) => acc + (parseFloat(r.percentage) || 0), 0) / enrichedResults.length
        : 0,
      uniqueLearners: uniqueUserIds.length,
      scoreDistribution: calculateScoreDistribution(enrichedResults || []),
      readingTopics: [...new Set(enrichedResults?.map(r => r.title) || [])],
      exerciseTypes: calculateExerciseTypeStats(enrichedResults || []),
      recentActivity: enrichedResults?.slice(0, 10) || []
    };

    return NextResponse.json({
      results: enrichedResults,
      stats,
      users: Object.values(userDetailsMap)
    });
  } catch (error) {
    console.error('Error in reading-scores API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reading scores data' },
      { status: 500 }
    );
  }
}

function calculateScoreDistribution(results: Array<{ percentage: string }>) {
  const distribution = {
    '0-20': 0,
    '21-40': 0,
    '41-60': 0,
    '61-80': 0,
    '81-100': 0
  };

  results.forEach(result => {
    const value = parseFloat(result.percentage) || 0;
    if (value <= 20) distribution['0-20']++;
    else if (value <= 40) distribution['21-40']++;
    else if (value <= 60) distribution['41-60']++;
    else if (value <= 80) distribution['61-80']++;
    else distribution['81-100']++;
  });

  return distribution;
}

function calculateExerciseTypeStats(results: Array<{ exerciseResults: any[], title: string }>) {
  const typeStats = new Map();
  
  results.forEach(result => {
    if (result.exerciseResults && Array.isArray(result.exerciseResults)) {
      result.exerciseResults.forEach(exercise => {
        const type = getExerciseType(exercise);
        if (!typeStats.has(type)) {
          typeStats.set(type, {
            type,
            totalQuestions: 0,
            correctAnswers: 0,
            accuracy: 0
          });
        }
        
        const stat = typeStats.get(type);
        stat.totalQuestions++;
        if (exercise.isCorrect) {
          stat.correctAnswers++;
        }
        stat.accuracy = (stat.correctAnswers / stat.totalQuestions) * 100;
      });
    }
  });
  
  return Array.from(typeStats.values());
}

function getExerciseType(exercise: any): string {
  // Determine exercise type based on the exercise structure
  if (exercise.userAnswer && exercise.correctAnswer) {
    if (exercise.userAnswer.length > 50) {
      return 'Text Comprehension';
    } else if (exercise.userAnswer.includes(',') || exercise.correctAnswer.includes(',')) {
      return 'Multiple Choice';
    } else {
      return 'Short Answer';
    }
  }
  return 'Reading Exercise';
}
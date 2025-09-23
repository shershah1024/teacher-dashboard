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
      .from('listening_results')
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
      
      // Task filter
      if (filters.taskId) {
        query = query.eq('task_id', filters.taskId);
      }
      
      // Exercise filter
      if (filters.exerciseId) {
        query = query.eq('exercise_id', filters.exerciseId);
      }
      
      // Audio title filter
      if (filters.audioTitle) {
        query = query.ilike('audio_title', `%${filters.audioTitle}%`);
      }
    }

    const { data: listeningResults, error } = await query;

    if (error) {
      console.error('Error fetching listening results:', error);
      return NextResponse.json(
        { error: 'Failed to fetch listening results' },
        { status: 500 }
      );
    }

    // Get user details for all unique user IDs
    const uniqueUserIds = [...new Set(listeningResults?.map(result => result.user_id) || [])];
    
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

    // Enrich listening results with user details and parse question results
    const enrichedResults = listeningResults?.map(result => {
      let questionResults = [];
      try {
        questionResults = result.question_results ? JSON.parse(result.question_results) : [];
      } catch (e) {
        console.warn('Failed to parse question_results:', e);
      }

      return {
        ...result,
        userName: userDetailsMap[result.user_id]?.name,
        userEmail: userDetailsMap[result.user_id]?.email,
        userFirstName: userDetailsMap[result.user_id]?.firstName,
        userLastName: userDetailsMap[result.user_id]?.lastName,
        organization: userDetailsMap[result.user_id]?.organization,
        questionResults,
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
      audioTopics: [...new Set(enrichedResults?.map(r => r.audio_title) || [])],
      questionTypes: calculateQuestionTypeStats(enrichedResults || []),
      audioEngagement: calculateAudioEngagementStats(enrichedResults || []),
      recentActivity: enrichedResults?.slice(0, 10) || []
    };

    return NextResponse.json({
      results: enrichedResults,
      stats,
      users: Object.values(userDetailsMap)
    });
  } catch (error) {
    console.error('Error in listening-scores API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch listening scores data' },
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

function calculateQuestionTypeStats(results: Array<{ questionResults: any[], audio_title: string }>) {
  const typeStats = new Map();
  
  results.forEach(result => {
    if (result.questionResults && Array.isArray(result.questionResults)) {
      result.questionResults.forEach(question => {
        const type = getQuestionType(question);
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
        if (question.isCorrect) {
          stat.correctAnswers++;
        }
        stat.accuracy = (stat.correctAnswers / stat.totalQuestions) * 100;
      });
    }
  });
  
  return Array.from(typeStats.values());
}

function calculateAudioEngagementStats(results: Array<{ 
  audio_play_count: number; 
  transcript_viewed: boolean; 
  time_taken_seconds?: number;
  scorePercentage: number;
}>) {
  const stats = {
    averagePlayCount: 0,
    transcriptViewRate: 0,
    averageTimeSpent: 0,
    playCountDistribution: {
      '1': 0,
      '2': 0,
      '3': 0,
      '4+': 0
    },
    transcriptImpactOnScore: {
      withTranscript: { count: 0, averageScore: 0 },
      withoutTranscript: { count: 0, averageScore: 0 }
    }
  };

  if (results.length === 0) return stats;

  let totalPlayCount = 0;
  let transcriptViewCount = 0;
  let totalTimeSpent = 0;
  let timeCount = 0;

  results.forEach(result => {
    // Play count analysis
    totalPlayCount += result.audio_play_count || 1;
    const playCount = result.audio_play_count || 1;
    if (playCount === 1) stats.playCountDistribution['1']++;
    else if (playCount === 2) stats.playCountDistribution['2']++;
    else if (playCount === 3) stats.playCountDistribution['3']++;
    else stats.playCountDistribution['4+']++;

    // Transcript analysis
    if (result.transcript_viewed) {
      transcriptViewCount++;
      stats.transcriptImpactOnScore.withTranscript.count++;
      stats.transcriptImpactOnScore.withTranscript.averageScore += result.scorePercentage;
    } else {
      stats.transcriptImpactOnScore.withoutTranscript.count++;
      stats.transcriptImpactOnScore.withoutTranscript.averageScore += result.scorePercentage;
    }

    // Time analysis
    if (result.time_taken_seconds) {
      totalTimeSpent += result.time_taken_seconds;
      timeCount++;
    }
  });

  stats.averagePlayCount = totalPlayCount / results.length;
  stats.transcriptViewRate = (transcriptViewCount / results.length) * 100;
  stats.averageTimeSpent = timeCount > 0 ? totalTimeSpent / timeCount : 0;

  // Calculate average scores for transcript impact
  if (stats.transcriptImpactOnScore.withTranscript.count > 0) {
    stats.transcriptImpactOnScore.withTranscript.averageScore /= stats.transcriptImpactOnScore.withTranscript.count;
  }
  if (stats.transcriptImpactOnScore.withoutTranscript.count > 0) {
    stats.transcriptImpactOnScore.withoutTranscript.averageScore /= stats.transcriptImpactOnScore.withoutTranscript.count;
  }

  return stats;
}

function getQuestionType(question: any): string {
  if (!question.selectedAnswer) return 'No Answer';
  
  const answer = question.selectedAnswer.toLowerCase();
  
  // Check for true/false questions
  if (answer === 'true' || answer === 'false') {
    return 'True/False';
  }
  
  // Check for fill-in-the-blank (usually single words or short phrases)
  if (answer.length <= 20 && !answer.includes(',') && answer.split(' ').length <= 3) {
    return 'Fill in the Blank';
  }
  
  // Everything else is multiple choice
  return 'Multiple Choice';
}
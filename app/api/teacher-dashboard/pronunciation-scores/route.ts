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
      .from('pronunciation_scores')
      .select('*')
      .order('completed_at', { ascending: false });

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
        query = query.gte('completed_at', filters.startDate);
      }
      if (filters.endDate) {
        query = query.lte('completed_at', filters.endDate);
      }
      
      // Score range filter
      if (filters.minScore !== undefined) {
        query = query.gte('pronunciation_score', filters.minScore.toString());
      }
      if (filters.maxScore !== undefined) {
        query = query.lte('pronunciation_score', filters.maxScore.toString());
      }
      
      // Word filter
      if (filters.word) {
        query = query.eq('word', filters.word);
      }
      
      // Course filter
      if (filters.course) {
        query = query.eq('course', filters.course);
      }
      
      // Task filter
      if (filters.taskId) {
        query = query.eq('task_id', filters.taskId);
      }
    }

    const { data: pronunciationScores, error } = await query;

    if (error) {
      console.error('Error fetching pronunciation scores:', error);
      return NextResponse.json(
        { error: 'Failed to fetch pronunciation scores' },
        { status: 500 }
      );
    }

    // Get user details for all unique user IDs
    const uniqueUserIds = [...new Set(pronunciationScores?.map(score => score.user_id) || [])];
    
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

    // Enrich pronunciation scores with user details
    const enrichedScores = pronunciationScores?.map(score => ({
      ...score,
      userName: userDetailsMap[score.user_id]?.name,
      userEmail: userDetailsMap[score.user_id]?.email,
      userFirstName: userDetailsMap[score.user_id]?.firstName,
      userLastName: userDetailsMap[score.user_id]?.lastName,
      organization: userDetailsMap[score.user_id]?.organization
    }));

    // Group scores by pronunciation sessions (attempt_id)
    const sessionMap = new Map();
    enrichedScores?.forEach(score => {
      if (!sessionMap.has(score.attempt_id)) {
        sessionMap.set(score.attempt_id, {
          attempt_id: score.attempt_id,
          user_id: score.user_id,
          userName: score.userName,
          organization: score.organization,
          task_id: score.task_id,
          course: score.course,
          completed_at: score.completed_at,
          words: [],
          averageScore: 0,
          totalWords: 0
        });
      }
      
      const session = sessionMap.get(score.attempt_id);
      session.words.push({
        word: score.word,
        score: parseFloat(score.pronunciation_score),
        id: score.id
      });
      session.totalWords++;
    });

    // Calculate average scores for sessions
    const sessions = Array.from(sessionMap.values()).map(session => {
      const totalScore = session.words.reduce((sum: number, w: any) => sum + w.score, 0);
      session.averageScore = totalScore / session.words.length;
      return session;
    });

    // Calculate statistics
    const stats = {
      totalEntries: enrichedScores?.length || 0,
      totalSessions: sessions.length,
      averageScore: enrichedScores?.length 
        ? enrichedScores.reduce((acc, s) => acc + parseFloat(s.pronunciation_score), 0) / enrichedScores.length
        : 0,
      uniqueLearners: uniqueUserIds.length,
      scoreDistribution: calculateScoreDistribution(enrichedScores || []),
      uniqueWords: [...new Set(enrichedScores?.map(s => s.word) || [])],
      wordDifficulty: calculateWordDifficulty(enrichedScores || []),
      recentActivity: sessions.slice(0, 10)
    };

    return NextResponse.json({
      scores: enrichedScores,
      sessions,
      stats,
      users: Object.values(userDetailsMap)
    });
  } catch (error) {
    console.error('Error in pronunciation-scores API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pronunciation scores data' },
      { status: 500 }
    );
  }
}

function calculateScoreDistribution(scores: Array<{ pronunciation_score: string }>) {
  const distribution = {
    '0-20': 0,
    '21-40': 0,
    '41-60': 0,
    '61-80': 0,
    '81-100': 0
  };

  scores.forEach(score => {
    const value = parseFloat(score.pronunciation_score) || 0;
    if (value <= 20) distribution['0-20']++;
    else if (value <= 40) distribution['21-40']++;
    else if (value <= 60) distribution['41-60']++;
    else if (value <= 80) distribution['61-80']++;
    else distribution['81-100']++;
  });

  return distribution;
}

function calculateWordDifficulty(scores: Array<{ word: string, pronunciation_score: string }>) {
  const wordStats = new Map();
  
  scores.forEach(score => {
    const word = score.word;
    const scoreValue = parseFloat(score.pronunciation_score);
    
    if (!wordStats.has(word)) {
      wordStats.set(word, {
        word,
        totalScore: 0,
        attempts: 0,
        averageScore: 0
      });
    }
    
    const stat = wordStats.get(word);
    stat.totalScore += scoreValue;
    stat.attempts++;
    stat.averageScore = stat.totalScore / stat.attempts;
  });
  
  return Array.from(wordStats.values())
    .sort((a, b) => a.averageScore - b.averageScore) // Hardest words first
    .slice(0, 10); // Top 10 most difficult words
}
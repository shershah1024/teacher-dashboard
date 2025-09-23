/**
 * API endpoint for fetching and analyzing lesson_speaking_scores data
 * Returns data in the same format as chatbot-scores for consistency
 */

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
    const { organizationCode = 'ANB' } = body;

    // Get all users in the organization
    const { data: orgUsers, error: orgError } = await supabase
      .from('user_organizations')
      .select('user_id')
      .eq('organization_code', organizationCode);

    if (orgError) {
      console.error('Error fetching organization users:', orgError);
      return NextResponse.json(
        { error: 'Failed to fetch organization users' },
        { status: 500 }
      );
    }

    const userIds = orgUsers?.map(u => u.user_id) || [];

    // Get user details with emails from Clerk (optional)
    let usersWithEmails = [];
    try {
      if (process.env.CLERK_SECRET_KEY) {
        usersWithEmails = await getUsersWithEmailsByIds(userIds);
      } else {
        console.warn('CLERK_SECRET_KEY not configured, skipping email lookup');
        // Create placeholder user data without emails
        usersWithEmails = userIds.map(userId => ({
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
      usersWithEmails = userIds.map(userId => ({
        userId,
        email: null,
        firstName: null,
        lastName: null,
        fullName: `Student ${userId.slice(5, 9)}`
      }));
    }

    const userDetailsMap = Object.fromEntries(
      usersWithEmails.map(u => [u.userId, u])
    );

    // Get all speaking scores for these users
    const { data: speakingScores, error } = await supabase
      .from('lesson_speaking_scores')
      .select('*')
      .in('user_id', userIds)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching speaking scores:', error);
      return NextResponse.json(
        { error: 'Failed to fetch speaking scores' },
        { status: 500 }
      );
    }

    // Get conversations from speaking_log table
    const scoreWithTaskIds = speakingScores?.filter(s => s.task_id) || [];
    const conversationMap = new Map();
    
    if (scoreWithTaskIds.length > 0) {
      // Get unique task-user pairs
      const uniquePairs = new Map();
      scoreWithTaskIds.forEach(s => {
        const key = `${s.user_id}_${s.task_id}`;
        if (!uniquePairs.has(key)) {
          uniquePairs.set(key, {
            task_id: s.task_id,
            user_id: s.user_id
          });
        }
      });
      
      // Fetch conversations from speaking_log for each pair
      for (const pair of uniquePairs.values()) {
        const { data: conversations } = await supabase
          .from('speaking_log')
          .select('role, content, message_index, created_at')
          .eq('task_id', pair.task_id)
          .eq('user_id', pair.user_id)
          .order('message_index', { ascending: true })
          .order('created_at', { ascending: true });
        
        if (conversations && conversations.length > 0) {
          // Convert to conversation history format
          const conversationHistory = conversations.map(msg => ({
            role: msg.role,
            content: msg.content
          }));
          
          const key = `${pair.user_id}_${pair.task_id}`;
          conversationMap.set(key, conversationHistory);
        }
      }
    }

    // Group scores by user
    const userScores = userIds.map(userId => {
      const userSpeakingScores = speakingScores?.filter(s => s.user_id === userId) || [];
      
      // Parse and enrich scores with conversation history
      const enrichedScores = userSpeakingScores.map(score => {
        let conversationHistory = [];
        let evaluationData = null;
        
        // First check if we have a conversation from speaking_log
        const conversationKey = `${score.user_id}_${score.task_id}`;
        const logConversation = conversationMap.get(conversationKey);
        
        if (logConversation && logConversation.length > 0) {
          // Use the conversation from speaking_log
          conversationHistory = logConversation;
        } else if (score.conversation_history) {
          // Fallback to the original conversation_history field if it exists
          try {
            conversationHistory = typeof score.conversation_history === 'string' 
              ? JSON.parse(score.conversation_history)
              : score.conversation_history;
          } catch (e) {
            console.warn('Failed to parse conversation_history:', e);
          }
        }
        
        try {
          if (score.evaluation_data) {
            evaluationData = typeof score.evaluation_data === 'string'
              ? JSON.parse(score.evaluation_data)
              : score.evaluation_data;
          }
        } catch (e) {
          console.warn('Failed to parse evaluation_data:', e);
        }
        
        // Map scores correctly
        const finalScore = Number(score.percentage_score || score.total_score || score.score || 0);
        
        return {
          ...score,
          conversation_history: conversationHistory,
          evaluation_data: evaluationData,
          score: finalScore,
          feedback: evaluationData?.overall_feedback || evaluationData?.feedback || '',
          evaluation: evaluationData,
          grammar_score: Number(score.grammar_vocabulary_score || score.grammar_score || 0),
          communication_score: Number(score.communication_score || 0)
        };
      });
      
      // Calculate statistics
      const totalSessions = enrichedScores.length;
      const averageScore = totalSessions > 0
        ? enrichedScores.reduce((sum, s) => sum + (s.score || 0), 0) / totalSessions
        : 0;
      
      const uniqueTasks = new Set(enrichedScores.map(s => s.task_id).filter(Boolean)).size;
      const uniqueCourses = new Set(enrichedScores.map(s => s.course_name).filter(Boolean)).size;
      
      const latestScore = enrichedScores[0]?.score || 0;
      const latestDate = enrichedScores[0]?.created_at || null;
      
      // Score distribution
      const scoreRanges = {
        '0-20': 0,
        '21-40': 0,
        '41-60': 0,
        '61-80': 0,
        '81-100': 0
      };
      
      enrichedScores.forEach(s => {
        const score = s.score || 0;
        if (score <= 20) scoreRanges['0-20']++;
        else if (score <= 40) scoreRanges['21-40']++;
        else if (score <= 60) scoreRanges['41-60']++;
        else if (score <= 80) scoreRanges['61-80']++;
        else scoreRanges['81-100']++;
      });
      
      // Calculate grammar and communication averages
      const grammarScores = enrichedScores
        .filter(s => s.grammar_score !== null && s.grammar_score !== undefined)
        .map(s => s.grammar_score);
      const avgGrammarScore = grammarScores.length > 0
        ? grammarScores.reduce((sum, score) => sum + score, 0) / grammarScores.length
        : 0;
        
      const communicationScores = enrichedScores
        .filter(s => s.communication_score !== null && s.communication_score !== undefined)
        .map(s => s.communication_score);
      const avgCommunicationScore = communicationScores.length > 0
        ? communicationScores.reduce((sum, score) => sum + score, 0) / communicationScores.length
        : 0;

      return {
        userId,
        name: userDetailsMap[userId]?.fullName || `Student ${userId.slice(5, 9)}`,
        email: userDetailsMap[userId]?.email,
        firstName: userDetailsMap[userId]?.firstName,
        lastName: userDetailsMap[userId]?.lastName,
        totalSessions,
        averageScore: Math.round(averageScore),
        averageGrammarScore: Math.round(avgGrammarScore),
        averageCommunicationScore: Math.round(avgCommunicationScore),
        uniqueLessons: uniqueTasks,
        uniqueTasks,
        uniqueCourses,
        latestScore,
        latestDate,
        scoreDistribution: scoreRanges,
        scores: enrichedScores
      };
    });

    // Filter out users with no sessions
    const activeUsers = userScores.filter(user => user.totalSessions > 0);
    
    return NextResponse.json(activeUsers);

  } catch (error) {
    console.error('Error in speaking-scores API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch speaking scores' },
      { status: 500 }
    );
  }
}
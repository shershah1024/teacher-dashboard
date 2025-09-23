import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getUsersWithEmailsByIds } from '@/lib/clerk-utils';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const lessonId = searchParams.get('lessonId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const minScore = searchParams.get('minScore');
    const maxScore = searchParams.get('maxScore');
    const includeEvaluation = searchParams.get('includeEvaluation') === 'true';

    // Select all columns including conversation_history and evaluation_data
    let query = supabase
      .from('lesson_chatbot_scores')
      .select('*')
      .order('created_at', { ascending: false });

    if (userId) {
      query = query.eq('user_id', userId);
    }
    
    if (lessonId) {
      query = query.eq('task_id', lessonId);
    }
    
    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    
    if (endDate) {
      query = query.lte('created_at', endDate);
    }
    
    if (minScore) {
      query = query.gte('total_score', parseInt(minScore));
    }
    
    if (maxScore) {
      query = query.lte('total_score', parseInt(maxScore));
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching chatbot scores:', error);
      return NextResponse.json(
        { error: 'Failed to fetch chatbot scores' },
        { status: 500 }
      );
    }

    // Log sample evaluation data structure if requested
    if (includeEvaluation && data && data.length > 0) {
      const sampleEvaluation = data.find(item => item.evaluation_data);
      if (sampleEvaluation) {
        console.log('Sample evaluation structure:', JSON.stringify(sampleEvaluation.evaluation_data, null, 2));
      }
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Error in chatbot-scores API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chatbot scores' },
      { status: 500 }
    );
  }
}

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

    // Get all chatbot scores for these users with conversation history
    const { data: scores, error: scoresError } = await supabase
      .from('lesson_chatbot_scores')
      .select('*')
      .in('user_id', userIds)
      .order('created_at', { ascending: false });

    if (scoresError) {
      console.error('Error fetching chatbot scores:', scoresError);
      return NextResponse.json(
        { error: 'Failed to fetch chatbot scores' },
        { status: 500 }
      );
    }

    // Get conversations from conversation_log table for better conversation history
    const scoreWithTaskIds = scores?.filter(s => s.task_id) || [];
    let conversationMap = new Map();
    
    if (scoreWithTaskIds.length > 0) {
      const taskUserPairs = scoreWithTaskIds.map(s => ({
        task_id: s.task_id,
        user_id: s.user_id
      }));
      
      // Fetch conversations from conversation_log
      for (const pair of taskUserPairs) {
        const { data: conversations } = await supabase
          .from('conversation_log')
          .select('conversation_id, role, message_content, created_at')
          .eq('task_id', pair.task_id)
          .eq('user_id', pair.user_id)
          .order('created_at', { ascending: true });
        
        if (conversations && conversations.length > 0) {
          // Group by conversation_id and convert to conversation history format
          const groupedConversations = conversations.reduce((acc, msg) => {
            if (!acc[msg.conversation_id]) {
              acc[msg.conversation_id] = [];
            }
            acc[msg.conversation_id].push({
              role: msg.role,
              content: msg.message_content
            });
            return acc;
          }, {} as Record<string, any[]>);
          
          // Use the longest conversation (most complete)
          const longestConversation = Object.values(groupedConversations)
            .sort((a, b) => b.length - a.length)[0] || [];
          
          const key = `${pair.user_id}_${pair.task_id}`;
          conversationMap.set(key, longestConversation);
        }
      }
    }

    // Group scores by user
    const userScores = userIds.map(userId => {
      const userChatbotScores = scores?.filter(s => s.user_id === userId) || [];
      
      // Parse the conversation history and evaluation data for each score
      const enrichedScores = userChatbotScores.map(score => {
        let conversationHistory = [];
        let evaluationData = null;
        
        // First check if we have a conversation from conversation_log
        const conversationKey = `${score.user_id}_${score.task_id}`;
        const logConversation = conversationMap.get(conversationKey);
        
        if (logConversation && logConversation.length > 0) {
          // Use the conversation from conversation_log (has actual assistant responses)
          conversationHistory = logConversation;
        } else {
          // Fall back to the original conversation_history field
          try {
            if (score.conversation_history) {
              conversationHistory = typeof score.conversation_history === 'string' 
                ? JSON.parse(score.conversation_history)
                : score.conversation_history;
            }
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
        
        // If conversation_history is still empty but evaluation_data has conversation, use that
        if ((!conversationHistory || conversationHistory.length === 0) && evaluationData?.conversation) {
          conversationHistory = evaluationData.conversation;
        }
        
        return {
          ...score,
          conversation_history: conversationHistory,
          evaluation_data: evaluationData,
          score: score.total_score || 0,
          feedback: evaluationData?.overall_feedback || '',
          evaluation: evaluationData
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
      
      // Calculate grammar and vocabulary averages
      const grammarScores = enrichedScores
        .filter(s => s.grammar_score !== null && s.grammar_score !== undefined)
        .map(s => s.grammar_score);
      const avgGrammarScore = grammarScores.length > 0
        ? grammarScores.reduce((sum, score) => sum + score, 0) / grammarScores.length
        : 0;
        
      const vocabularyScores = enrichedScores
        .filter(s => s.vocabulary_score !== null && s.vocabulary_score !== undefined)
        .map(s => s.vocabulary_score);
      const avgVocabularyScore = vocabularyScores.length > 0
        ? vocabularyScores.reduce((sum, score) => sum + score, 0) / vocabularyScores.length
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
        averageVocabularyScore: Math.round(avgVocabularyScore),
        uniqueLessons: uniqueTasks, // Use tasks as lessons
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
    console.error('Error in chatbot-scores API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chatbot scores' },
      { status: 500 }
    );
  }
}
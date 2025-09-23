/**
 * API endpoint for discourse analysis
 * Analyzes conversation patterns from speaking_log and conversation_log tables
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

    // Get user details with emails from Clerk
    let usersWithEmails = [];
    try {
      if (process.env.CLERK_SECRET_KEY) {
        usersWithEmails = await getUsersWithEmailsByIds(userIds);
      } else {
        console.warn('CLERK_SECRET_KEY not configured, skipping email lookup');
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

    // Fetch conversation data from both tables
    const [speakingData, conversationData] = await Promise.all([
      // Speaking log data - fetch recent data and filter in JavaScript
      // user_id format is "userId:::taskId"
      supabase
        .from('speaking_log')
        .select('*')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()) // Last 30 days
        .limit(1000)
        .order('created_at', { ascending: false }),
      
      // Conversation log data  
      supabase
        .from('conversation_log')
        .select('*')
        .in('user_id', userIds)
        .order('created_at', { ascending: false })
    ]);

    if (speakingData.error || conversationData.error) {
      console.error('Error fetching conversation data:', speakingData.error || conversationData.error);
      return NextResponse.json(
        { error: 'Failed to fetch conversation data' },
        { status: 500 }
      );
    }


    // Calculate date ranges for trends
    const now = new Date();
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Filter speaking data to only include our target users
    const filteredSpeakingData = (speakingData.data || []).filter(msg => {
      const baseUserId = msg.user_id?.split(':::')[0];
      return baseUserId && userIds.includes(baseUserId);
    });
    

    // Combine and normalize data from both sources
    const allConversations = [
      ...filteredSpeakingData.map(msg => ({
        ...msg,
        source: 'speaking',
        user_id: msg.user_id?.split(':::')[0] || msg.user_id,
        message_content: msg.content,
        conversation_id: msg.task_id
      })),
      ...(conversationData.data || []).map(msg => ({
        ...msg,
        source: 'chatbot',
        message_content: msg.message_content
      }))
    ];


    // ===== GENERAL DISCOURSE TRENDS =====
    const generalTrends = calculateGeneralTrends(allConversations, lastWeek, lastMonth);

    // ===== STUDENT DISCOURSE ANALYSIS =====
    const studentAnalysis = userIds.map(userId => {
      const userConversations = allConversations.filter(msg => {
        const msgUserId = msg.user_id?.split(':::')[0] || msg.user_id;
        return msgUserId === userId;
      });

      return analyzeUserDiscourse(userId, userConversations, userDetailsMap[userId], lastWeek, lastMonth);
    });

    // Filter out users with no conversation activity
    const activeStudents = studentAnalysis.filter(student => student.totalMessages > 0);

    return NextResponse.json({
      generalTrends,
      studentAnalysis: activeStudents,
      summary: {
        totalStudentsWithActivity: activeStudents.length,
        totalConversations: generalTrends.totalConversations,
        totalMessages: generalTrends.totalMessages,
        averageMessagesPerStudent: activeStudents.length > 0 
          ? Math.round(generalTrends.totalMessages / activeStudents.length) 
          : 0
      }
    });

  } catch (error) {
    console.error('Error in discourse-analysis API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch discourse analysis data' },
      { status: 500 }
    );
  }
}

function calculateGeneralTrends(conversations: any[], lastWeek: Date, lastMonth: Date) {
  const recentConversations = conversations.filter(c => new Date(c.created_at) >= lastWeek);
  const monthlyConversations = conversations.filter(c => new Date(c.created_at) >= lastMonth);
  
  // Group by conversation/task
  const conversationGroups = new Map();
  conversations.forEach(msg => {
    const key = `${msg.user_id}_${msg.conversation_id || msg.task_id}`;
    if (!conversationGroups.has(key)) {
      conversationGroups.set(key, []);
    }
    conversationGroups.get(key).push(msg);
  });

  // Calculate conversation metrics
  const conversationMetrics = Array.from(conversationGroups.values()).map(conversation => {
    const userMessages = conversation.filter(msg => msg.role === 'user');
    const assistantMessages = conversation.filter(msg => msg.role === 'assistant');
    
    return {
      messageCount: conversation.length,
      userMessageCount: userMessages.length,
      assistantMessageCount: assistantMessages.length,
      averageMessageLength: calculateAverageMessageLength(conversation),
      userAverageMessageLength: calculateAverageMessageLength(userMessages),
      turnTakingPattern: calculateTurnTakingPattern(conversation),
      conversationDuration: calculateConversationDuration(conversation),
      source: conversation[0]?.source || 'unknown'
    };
  });

  return {
    totalMessages: conversations.length,
    totalConversations: conversationGroups.size,
    recentMessages: recentConversations.length,
    monthlyMessages: monthlyConversations.length,
    
    averageConversationLength: conversationMetrics.length > 0 
      ? Math.round(conversationMetrics.reduce((sum, conv) => sum + conv.messageCount, 0) / conversationMetrics.length)
      : 0,
    
    averageMessageLength: calculateAverageMessageLength(conversations),
    
    sourceDistribution: {
      speaking: conversations.filter(c => c.source === 'speaking').length,
      chatbot: conversations.filter(c => c.source === 'chatbot').length
    },
    
    messagesByRole: {
      user: conversations.filter(c => c.role === 'user').length,
      assistant: conversations.filter(c => c.role === 'assistant').length
    },
    
    conversationLengthDistribution: calculateConversationLengthDistribution(conversationMetrics),
    
    dailyActivity: calculateDailyActivity(conversations),
    
    turnTakingAnalysis: analyzeTurnTakingPatterns(conversationMetrics)
  };
}

function analyzeUserDiscourse(userId: string, userConversations: any[], userDetails: any, lastWeek: Date, lastMonth: Date) {
  const recentConversations = userConversations.filter(c => new Date(c.created_at) >= lastWeek);
  const monthlyConversations = userConversations.filter(c => new Date(c.created_at) >= lastMonth);
  
  // Group user conversations by conversation/task ID
  const conversationGroups = new Map();
  userConversations.forEach(msg => {
    const key = msg.conversation_id || msg.task_id;
    if (!conversationGroups.has(key)) {
      conversationGroups.set(key, []);
    }
    conversationGroups.get(key).push(msg);
  });

  const userMessages = userConversations.filter(msg => msg.role === 'user');
  const conversationMetrics = Array.from(conversationGroups.values()).map(conversation => {
    const userMsgs = conversation.filter(msg => msg.role === 'user');
    const assistantMsgs = conversation.filter(msg => msg.role === 'assistant');
    
    return {
      messageCount: conversation.length,
      userMessageCount: userMsgs.length,
      assistantMessageCount: assistantMsgs.length,
      averageMessageLength: calculateAverageMessageLength(userMsgs),
      turnTaking: calculateTurnTakingPattern(conversation),
      createdAt: conversation[0]?.created_at,
      source: conversation[0]?.source
    };
  });

  // Calculate user-specific metrics
  const averageMessageLength = calculateAverageMessageLength(userMessages);
  const conversationFrequency = calculateConversationFrequency(conversationMetrics);
  const engagementScore = calculateEngagementScore(conversationMetrics);

  return {
    userId,
    name: userDetails?.fullName || `Student ${userId.slice(5, 9)}`,
    email: userDetails?.email,
    firstName: userDetails?.firstName,
    lastName: userDetails?.lastName,
    
    totalMessages: userConversations.length,
    totalUserMessages: userMessages.length,
    totalConversations: conversationGroups.size,
    
    recentMessages: recentConversations.length,
    monthlyMessages: monthlyConversations.length,
    
    averageMessageLength,
    averageConversationLength: conversationMetrics.length > 0 
      ? Math.round(conversationMetrics.reduce((sum, conv) => sum + conv.messageCount, 0) / conversationMetrics.length)
      : 0,
    
    conversationFrequency,
    engagementScore,
    
    conversationMetrics,
    
    sourceBreakdown: {
      speaking: userConversations.filter(c => c.source === 'speaking').length,
      chatbot: userConversations.filter(c => c.source === 'chatbot').length
    },
    
    mostRecentActivity: userConversations[0]?.created_at || null,
    
    // Detailed conversation analysis for modal
    detailedConversations: conversationMetrics.slice(0, 10).map(conv => ({
      ...conv,
      id: conv.createdAt,
      messageLength: conv.averageMessageLength,
      engagement: conv.userMessageCount / Math.max(1, conv.assistantMessageCount)
    }))
  };
}

// Helper functions for discourse analysis
function calculateAverageMessageLength(messages: any[]): number {
  if (messages.length === 0) return 0;
  
  const totalWords = messages.reduce((sum, msg) => {
    const content = msg.message_content || msg.content || '';
    return sum + content.split(/\s+/).filter(word => word.length > 0).length;
  }, 0);
  
  return Math.round(totalWords / messages.length);
}

function calculateTurnTakingPattern(conversation: any[]): string {
  if (conversation.length < 2) return 'minimal';
  
  const sortedConv = conversation.sort((a, b) => 
    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
  
  let alternations = 0;
  for (let i = 1; i < sortedConv.length; i++) {
    if (sortedConv[i].role !== sortedConv[i-1].role) {
      alternations++;
    }
  }
  
  const alternationRate = alternations / (sortedConv.length - 1);
  
  if (alternationRate > 0.8) return 'highly-interactive';
  if (alternationRate > 0.5) return 'interactive';
  if (alternationRate > 0.2) return 'moderate';
  return 'minimal';
}


function calculateConversationDuration(conversation: any[]): number {
  if (conversation.length < 2) return 0;
  
  const sorted = conversation.sort((a, b) => 
    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
  
  const start = new Date(sorted[0].created_at);
  const end = new Date(sorted[sorted.length - 1].created_at);
  
  return Math.round((end.getTime() - start.getTime()) / (1000 * 60)); // minutes
}

function calculateConversationLengthDistribution(conversations: any[]): Record<string, number> {
  const distribution = {
    'short (1-5)': 0,
    'medium (6-15)': 0,
    'long (16-30)': 0,
    'extended (30+)': 0
  };
  
  conversations.forEach(conv => {
    const length = conv.messageCount;
    if (length <= 5) distribution['short (1-5)']++;
    else if (length <= 15) distribution['medium (6-15)']++;
    else if (length <= 30) distribution['long (16-30)']++;
    else distribution['extended (30+)']++;
  });
  
  return distribution;
}

function calculateDailyActivity(conversations: any[]): { date: string; count: number }[] {
  const dailyMap = new Map<string, number>();
  
  conversations.forEach(conv => {
    const date = new Date(conv.created_at).toISOString().split('T')[0];
    dailyMap.set(date, (dailyMap.get(date) || 0) + 1);
  });
  
  return Array.from(dailyMap.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 14); // Last 14 days
}

function analyzeTurnTakingPatterns(conversations: any[]): any {
  const patterns = conversations.map(conv => conv.turnTakingPattern);
  const distribution = {
    'highly-interactive': 0,
    'interactive': 0,
    'moderate': 0,
    'minimal': 0
  };
  
  patterns.forEach(pattern => {
    if (pattern in distribution) {
      distribution[pattern as keyof typeof distribution]++;
    }
  });
  
  return distribution;
}



function calculateConversationFrequency(conversations: any[]): number {
  if (conversations.length === 0) return 0;
  
  const dates = conversations
    .map(conv => new Date(conv.createdAt).toISOString().split('T')[0])
    .filter((date, index, arr) => arr.indexOf(date) === index);
  
  return dates.length; // Unique days with conversations
}

function calculateEngagementScore(conversations: any[]): number {
  if (conversations.length === 0) return 0;
  
  const avgUserMessages = conversations.reduce((sum, conv) => sum + conv.userMessageCount, 0) / conversations.length;
  const avgTotalMessages = conversations.reduce((sum, conv) => sum + conv.messageCount, 0) / conversations.length;
  const avgMessageLength = conversations.reduce((sum, conv) => sum + conv.averageMessageLength, 0) / conversations.length;
  
  // Engagement score based on participation rate and message quality
  const participationRate = avgUserMessages / Math.max(1, avgTotalMessages);
  const lengthScore = Math.min(avgMessageLength / 10, 1); // Normalize to 0-1
  
  return Math.round((participationRate * 0.7 + lengthScore * 0.3) * 100);
}
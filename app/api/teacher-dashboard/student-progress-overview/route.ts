import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getUsersWithEmailsByIds } from '@/lib/clerk-utils';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface SkillMetrics {
  speaking: { score: number; trend: 'up' | 'down' | 'stable'; sessions: number };
  listening: { score: number; trend: 'up' | 'down' | 'stable'; sessions: number };
  reading: { score: number; trend: 'up' | 'down' | 'stable'; sessions: number };
  writing: { score: number; trend: 'up' | 'down' | 'stable'; sessions: number };
  grammar: { errorRate: number; trend: 'improving' | 'declining' | 'stable'; totalErrors: number };
  pronunciation: { accuracy: number; trend: 'up' | 'down' | 'stable'; sessions: number };
  vocabulary: { wordsLearned: number; weeklyNew: number; retentionRate: number };
}

interface StudentProgressCard {
  userId: string;
  name: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  organization: string;
  
  // Overall Progress
  overallProgress: number; // 0-100%
  currentLesson: string;
  currentModule: string;
  lessonsCompleted: number;
  totalLessons: number;
  expectedCompletion: string | null;
  learningVelocity: number; // lessons per week
  
  // Activity & Engagement
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string;
  weeklyActivityMap: { [key: string]: number }; // day -> hours
  averageDailyMinutes: number;
  totalStudyHours: number;
  mostActiveTime: string; // "morning", "afternoon", "evening"
  activityTrend: 'increasing' | 'decreasing' | 'stable';
  
  // Performance
  averageScore: number;
  strongestSkill: string;
  weakestSkill: string;
  needsAttention: boolean;
  performanceTrend: 'improving' | 'declining' | 'stable';
  recentScores: { date: string; score: number; type: string }[];
  
  // Skills Breakdown
  skills: SkillMetrics;
  
  // Learning Insights
  learningPace: 'ahead' | 'on-track' | 'behind';
  predictedCompletionWeeks: number | null;
  recommendedFocus: string[];
  achievements: { name: string; date: string; icon: string }[];
  
  // Recent Activity
  recentActivities: {
    type: string;
    title: string;
    score?: number;
    timestamp: string;
  }[];
  
  // Engagement Score (0-100)
  engagementScore: number;
  
  // Risk Indicators
  atRiskOfDropout: boolean;
  inactivityDays: number;
  strugglingAreas: string[];
}

function calculateTrend(recent: number[], older: number[]): 'up' | 'down' | 'stable' | 'improving' | 'declining' {
  if (recent.length === 0 || older.length === 0) return 'stable';
  const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
  const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
  if (recentAvg > olderAvg + 5) return 'up';
  if (recentAvg < olderAvg - 5) return 'down';
  return 'stable';
}

function getTimeOfDay(hour: number): string {
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}

function calculateEngagementScore(
  streak: number, 
  lastActive: string, 
  avgDaily: number,
  completionRate: number
): number {
  const daysSinceActive = Math.floor((Date.now() - new Date(lastActive).getTime()) / (1000 * 60 * 60 * 24));
  
  let score = 50; // Base score
  score += Math.min(streak * 2, 20); // Up to 20 points for streak
  score += Math.max(0, 20 - daysSinceActive * 2); // Up to 20 points for recency
  score += Math.min(avgDaily / 3, 20); // Up to 20 points for daily study time
  score += completionRate * 0.1; // Up to 10 points for completion
  
  return Math.min(100, Math.max(0, Math.round(score)));
}

export async function POST(request: NextRequest) {
  try {
    const { organizationCode } = await request.json();

    // Get all students in the organization
    const { data: orgData, error: orgError } = await supabase
      .from('user_organizations')
      .select('user_id')
      .eq('organization_code', organizationCode);

    if (orgError || !orgData) {
      console.error('Error fetching organization users:', orgError);
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }

    const userIds = orgData.map(u => u.user_id);
    
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
      console.error('Error fetching user emails from Clerk:', error);
      usersWithEmails = userIds.map(userId => ({
        userId,
        email: null,
        firstName: null,
        lastName: null,
        fullName: `Student ${userId.slice(5, 9)}`
      }));
    }

    // Create a map for quick lookups
    const userEmailMap = new Map(
      usersWithEmails.map(u => [u.userId, u])
    );
    
    const studentCards: StudentProgressCard[] = [];

    // Fetch all data in parallel for efficiency
    const [
      usersData,
      progressData,
      taskCompletions,
      speakingScores,
      listeningScores,
      readingScores,
      writingScores,
      grammarErrors,
      pronunciationScores,
      vocabularyData,
      chatbotScores
    ] = await Promise.all([
      // User details
      supabase.from('users').select('*').in('user_id', userIds),
      
      // Lesson progress
      supabase.from('user_lesson_progress').select('*').in('user_id', userIds),
      
      // Task completions
      supabase.from('task_completions').select('*').in('user_id', userIds),
      
      // Speaking scores
      supabase.from('lesson_speaking_scores').select('*').in('user_id', userIds),
      
      // Listening scores
      supabase.from('lesson_listening_scores').select('*').in('user_id', userIds),
      
      // Reading scores
      supabase.from('lesson_reading_scores').select('*').in('user_id', userIds),
      
      // Writing scores
      supabase.from('lesson_writing_scores').select('*').in('user_id', userIds),
      
      // Grammar errors
      supabase.from('german_grammar_error_logs').select('*').in('user_id', userIds),
      
      // Pronunciation scores
      supabase.from('pronunciation_scores').select('*').in('user_id', userIds),
      
      // Vocabulary
      supabase.from('german_user_vocabulary').select('*').in('user_id', userIds),
      
      // Chatbot scores
      supabase.from('chatbot_scores').select('*').in('user_id', userIds)
    ]);

    // Process each student
    for (const userId of userIds) {
      const userClerkData = userEmailMap.get(userId);
      const userData = usersData.data?.find(u => u.user_id === userId) || {};
      const progress = progressData.data?.filter(p => p.user_id === userId) || [];
      const tasks = taskCompletions.data?.filter(t => t.user_id === userId) || [];
      const speaking = speakingScores.data?.filter(s => s.user_id === userId) || [];
      const listening = listeningScores.data?.filter(l => l.user_id === userId) || [];
      const reading = readingScores.data?.filter(r => r.user_id === userId) || [];
      const writing = writingScores.data?.filter(w => w.user_id === userId) || [];
      const grammar = grammarErrors.data?.filter(g => g.user_id === userId) || [];
      const pronunciation = pronunciationScores.data?.filter(p => p.user_id === userId) || [];
      const vocabulary = vocabularyData.data?.filter(v => v.user_id === userId) || [];
      const chatbot = chatbotScores.data?.filter(c => c.user_id === userId) || [];

      // Calculate overall progress
      const totalLessons = 120; // Total lessons in the course
      const completedLessons = progress.filter(p => p.completion_percentage >= 100).length;
      const overallProgress = Math.round((completedLessons / totalLessons) * 100);
      
      // Get current lesson/module
      const latestProgress = progress.sort((a, b) => 
        new Date(b.last_accessed || 0).getTime() - new Date(a.last_accessed || 0).getTime()
      )[0];
      const currentLesson = latestProgress?.lesson_title || 'Not Started';
      const currentModule = latestProgress?.lesson_id?.split('_')[0] || 'Module 1';

      // Calculate streaks
      const sortedTasks = tasks.sort((a, b) => 
        new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime()
      );
      
      let currentStreak = 0;
      let longestStreak = 0;
      let tempStreak = 0;
      let lastDate: Date | null = null;
      
      for (const task of sortedTasks) {
        const taskDate = new Date(task.completed_at);
        taskDate.setHours(0, 0, 0, 0);
        
        if (!lastDate) {
          tempStreak = 1;
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const yesterday = new Date(today);
          yesterday.setDate(yesterday.getDate() - 1);
          
          if (taskDate.getTime() === today.getTime() || taskDate.getTime() === yesterday.getTime()) {
            currentStreak = 1;
          }
        } else {
          const dayDiff = Math.floor((lastDate.getTime() - taskDate.getTime()) / (1000 * 60 * 60 * 24));
          if (dayDiff === 1) {
            tempStreak++;
            if (currentStreak > 0) currentStreak++;
          } else {
            longestStreak = Math.max(longestStreak, tempStreak);
            tempStreak = 1;
            if (currentStreak > 0 && dayDiff > 1) currentStreak = 0;
          }
        }
        lastDate = taskDate;
      }
      longestStreak = Math.max(longestStreak, tempStreak);

      // Calculate activity metrics
      const lastActiveDate = sortedTasks[0]?.completed_at || new Date().toISOString();
      const daysSinceActive = Math.floor((Date.now() - new Date(lastActiveDate).getTime()) / (1000 * 60 * 60 * 24));
      
      // Weekly activity map (last 7 days)
      const weeklyActivityMap: { [key: string]: number } = {};
      const last7Days = [];
      for (let i = 0; i < 7; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        last7Days.push(dateStr);
        weeklyActivityMap[dateStr] = 0;
      }
      
      tasks.forEach(task => {
        const dateStr = task.completed_at.split('T')[0];
        if (weeklyActivityMap.hasOwnProperty(dateStr)) {
          weeklyActivityMap[dateStr]++;
        }
      });

      // Calculate average daily study time (rough estimate based on task completions)
      const last30DaysTasks = tasks.filter(t => {
        const taskDate = new Date(t.completed_at);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return taskDate >= thirtyDaysAgo;
      });
      const averageDailyMinutes = Math.round((last30DaysTasks.length * 15) / 30); // Assume 15 min per task
      const totalStudyHours = Math.round((tasks.length * 15) / 60);

      // Most active time of day
      const hourCounts: { [hour: number]: number } = {};
      tasks.forEach(task => {
        const hour = new Date(task.completed_at).getHours();
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
      });
      const mostActiveHour = Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '12';
      const mostActiveTime = getTimeOfDay(parseInt(mostActiveHour));

      // Activity trend
      const recentWeekTasks = tasks.filter(t => {
        const taskDate = new Date(t.completed_at);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return taskDate >= weekAgo;
      }).length;
      
      const previousWeekTasks = tasks.filter(t => {
        const taskDate = new Date(t.completed_at);
        const twoWeeksAgo = new Date();
        twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return taskDate >= twoWeeksAgo && taskDate < weekAgo;
      }).length;
      
      const activityTrend = recentWeekTasks > previousWeekTasks ? 'increasing' : 
                          recentWeekTasks < previousWeekTasks ? 'decreasing' : 'stable';

      // Calculate skill metrics
      const speakingScoresArray = speaking.map(s => s.score || 0);
      const listeningScoresArray = listening.map(l => l.score || 0);
      const readingScoresArray = reading.map(r => r.percentage_score || 0);
      const writingScoresArray = writing.map(w => w.score || 0);
      const pronunciationAccuracy = pronunciation.map(p => {
        const scores = JSON.parse(p.scores || '[]');
        return scores.length > 0 ? scores.reduce((a: number, b: any) => a + b.score, 0) / scores.length : 0;
      });

      const skills: SkillMetrics = {
        speaking: {
          score: speakingScoresArray.length > 0 ? Math.round(speakingScoresArray.reduce((a, b) => a + b, 0) / speakingScoresArray.length) : 0,
          trend: calculateTrend(speakingScoresArray.slice(0, 3), speakingScoresArray.slice(3, 6)) as 'up' | 'down' | 'stable',
          sessions: speaking.length
        },
        listening: {
          score: listeningScoresArray.length > 0 ? Math.round(listeningScoresArray.reduce((a, b) => a + b, 0) / listeningScoresArray.length) : 0,
          trend: calculateTrend(listeningScoresArray.slice(0, 3), listeningScoresArray.slice(3, 6)) as 'up' | 'down' | 'stable',
          sessions: listening.length
        },
        reading: {
          score: readingScoresArray.length > 0 ? Math.round(readingScoresArray.reduce((a, b) => a + b, 0) / readingScoresArray.length) : 0,
          trend: calculateTrend(readingScoresArray.slice(0, 3), readingScoresArray.slice(3, 6)) as 'up' | 'down' | 'stable',
          sessions: reading.length
        },
        writing: {
          score: writingScoresArray.length > 0 ? Math.round(writingScoresArray.reduce((a, b) => a + b, 0) / writingScoresArray.length) : 0,
          trend: calculateTrend(writingScoresArray.slice(0, 3), writingScoresArray.slice(3, 6)) as 'up' | 'down' | 'stable',
          sessions: writing.length
        },
        grammar: {
          errorRate: grammar.length > 0 ? Math.round((grammar.filter(g => g.severity === 'HIGH').length / grammar.length) * 100) : 0,
          trend: grammar.length > 10 ? 
            (grammar.slice(0, 5).filter(g => g.severity === 'HIGH').length < grammar.slice(5, 10).filter(g => g.severity === 'HIGH').length ? 'improving' : 'declining') 
            : 'stable',
          totalErrors: grammar.length
        },
        pronunciation: {
          accuracy: pronunciationAccuracy.length > 0 ? Math.round(pronunciationAccuracy.reduce((a, b) => a + b, 0) / pronunciationAccuracy.length) : 0,
          trend: calculateTrend(pronunciationAccuracy.slice(0, 3), pronunciationAccuracy.slice(3, 6)) as 'up' | 'down' | 'stable',
          sessions: pronunciation.length
        },
        vocabulary: {
          wordsLearned: vocabulary.length,
          weeklyNew: vocabulary.filter(v => {
            const wordDate = new Date(v.first_seen || v.created_at);
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            return wordDate >= weekAgo;
          }).length,
          retentionRate: vocabulary.length > 0 ? 
            Math.round((vocabulary.filter(v => v.times_correct > v.times_seen * 0.7).length / vocabulary.length) * 100) : 0
        }
      };

      // Calculate average score and determine strongest/weakest skills
      const skillScores = [
        { name: 'Speaking', score: skills.speaking.score },
        { name: 'Listening', score: skills.listening.score },
        { name: 'Reading', score: skills.reading.score },
        { name: 'Writing', score: skills.writing.score },
        { name: 'Pronunciation', score: skills.pronunciation.accuracy },
        { name: 'Grammar', score: 100 - skills.grammar.errorRate }
      ];
      
      const averageScore = Math.round(skillScores.reduce((a, b) => a + b.score, 0) / skillScores.length);
      const sortedSkills = [...skillScores].sort((a, b) => b.score - a.score);
      const strongestSkill = sortedSkills[0]?.name || 'None';
      const weakestSkill = sortedSkills[sortedSkills.length - 1]?.name || 'None';
      const needsAttention = averageScore < 60 || daysSinceActive > 7;

      // Performance trend
      const allRecentScores = [
        ...speakingScoresArray.slice(0, 5),
        ...listeningScoresArray.slice(0, 5),
        ...readingScoresArray.slice(0, 5),
        ...writingScoresArray.slice(0, 5)
      ];
      const allOlderScores = [
        ...speakingScoresArray.slice(5, 10),
        ...listeningScoresArray.slice(5, 10),
        ...readingScoresArray.slice(5, 10),
        ...writingScoresArray.slice(5, 10)
      ];
      const performanceTrend = calculateTrend(allRecentScores, allOlderScores) as 'improving' | 'declining' | 'stable';

      // Recent scores for sparkline
      const recentScores = [
        ...speaking.slice(0, 3).map(s => ({ date: s.created_at, score: s.score || 0, type: 'Speaking' })),
        ...listening.slice(0, 3).map(l => ({ date: l.created_at, score: l.score || 0, type: 'Listening' })),
        ...reading.slice(0, 3).map(r => ({ date: r.created_at, score: r.percentage_score || 0, type: 'Reading' })),
        ...writing.slice(0, 3).map(w => ({ date: w.created_at, score: w.score || 0, type: 'Writing' }))
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10);

      // Learning insights
      const expectedLessonsPerWeek = 5;
      const actualLessonsPerWeek = completedLessons / Math.max(1, Math.floor((Date.now() - new Date(userData.created_at || Date.now()).getTime()) / (1000 * 60 * 60 * 24 * 7)));
      const learningPace = actualLessonsPerWeek > expectedLessonsPerWeek * 1.2 ? 'ahead' :
                          actualLessonsPerWeek < expectedLessonsPerWeek * 0.8 ? 'behind' : 'on-track';
      
      const remainingLessons = totalLessons - completedLessons;
      const predictedCompletionWeeks = actualLessonsPerWeek > 0 ? Math.round(remainingLessons / actualLessonsPerWeek) : null;
      const expectedCompletion = predictedCompletionWeeks ? 
        new Date(Date.now() + predictedCompletionWeeks * 7 * 24 * 60 * 60 * 1000).toISOString() : null;

      // Recommended focus areas
      const recommendedFocus = [];
      if (skills.grammar.errorRate > 30) recommendedFocus.push('Grammar practice needed');
      if (skills.pronunciation.accuracy < 70) recommendedFocus.push('Pronunciation exercises');
      if (skills.vocabulary.weeklyNew < 10) recommendedFocus.push('Expand vocabulary');
      if (weakestSkill && sortedSkills[sortedSkills.length - 1].score < 60) {
        recommendedFocus.push(`Focus on ${weakestSkill}`);
      }
      if (currentStreak === 0) recommendedFocus.push('Re-establish daily practice');

      // Achievements
      const achievements = [];
      if (currentStreak >= 7) achievements.push({ name: 'Week Streak', date: new Date().toISOString(), icon: '🔥' });
      if (currentStreak >= 30) achievements.push({ name: 'Month Streak', date: new Date().toISOString(), icon: '⭐' });
      if (completedLessons >= 10) achievements.push({ name: '10 Lessons Complete', date: new Date().toISOString(), icon: '📚' });
      if (completedLessons >= 50) achievements.push({ name: '50 Lessons Complete', date: new Date().toISOString(), icon: '🎯' });
      if (vocabulary.length >= 100) achievements.push({ name: '100 Words Learned', date: new Date().toISOString(), icon: '💬' });
      if (averageScore >= 80) achievements.push({ name: 'High Performer', date: new Date().toISOString(), icon: '🏆' });

      // Recent activities (combine all activities)
      const allActivities = [
        ...tasks.slice(0, 5).map(t => ({
          type: 'Task',
          title: t.task_id || 'Practice',
          timestamp: t.completed_at
        })),
        ...speaking.slice(0, 2).map(s => ({
          type: 'Speaking',
          title: s.task_id || 'Speaking Practice',
          score: s.score,
          timestamp: s.created_at
        })),
        ...listening.slice(0, 2).map(l => ({
          type: 'Listening',
          title: l.lesson_id || 'Listening Practice',
          score: l.score,
          timestamp: l.created_at
        })),
        ...chatbot.slice(0, 2).map(c => ({
          type: 'AI Chat',
          title: 'Conversation Practice',
          score: c.score,
          timestamp: c.created_at
        }))
      ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 5);

      // Calculate engagement score
      const engagementScore = calculateEngagementScore(
        currentStreak,
        lastActiveDate,
        averageDailyMinutes,
        overallProgress
      );

      // Risk indicators
      const atRiskOfDropout = daysSinceActive > 7 || (currentStreak === 0 && daysSinceActive > 3);
      const strugglingAreas = skillScores.filter(s => s.score < 50).map(s => s.name);

      const studentCard: StudentProgressCard = {
        userId,
        name: userClerkData?.fullName || userData.name || userData.email?.split('@')[0] || `Student ${userId.slice(0, 8)}`,
        email: userClerkData?.email || userData.email,
        firstName: userClerkData?.firstName || userData.firstName,
        lastName: userClerkData?.lastName || userData.lastName,
        organization: organizationCode,
        
        // Overall Progress
        overallProgress,
        currentLesson,
        currentModule,
        lessonsCompleted: completedLessons,
        totalLessons,
        expectedCompletion,
        learningVelocity: Math.round(actualLessonsPerWeek * 10) / 10,
        
        // Activity & Engagement
        currentStreak,
        longestStreak,
        lastActiveDate,
        weeklyActivityMap,
        averageDailyMinutes,
        totalStudyHours,
        mostActiveTime,
        activityTrend,
        
        // Performance
        averageScore,
        strongestSkill,
        weakestSkill,
        needsAttention,
        performanceTrend,
        recentScores,
        
        // Skills
        skills,
        
        // Learning Insights
        learningPace,
        predictedCompletionWeeks,
        recommendedFocus,
        achievements,
        
        // Recent Activity
        recentActivities: allActivities,
        
        // Engagement
        engagementScore,
        
        // Risk Indicators
        atRiskOfDropout,
        inactivityDays: daysSinceActive,
        strugglingAreas
      };

      studentCards.push(studentCard);
    }

    // Sort by engagement score by default
    studentCards.sort((a, b) => b.engagementScore - a.engagementScore);

    return NextResponse.json({
      students: studentCards,
      summary: {
        totalStudents: studentCards.length,
        activeStudents: studentCards.filter(s => s.inactivityDays <= 7).length,
        atRiskStudents: studentCards.filter(s => s.atRiskOfDropout).length,
        averageProgress: Math.round(studentCards.reduce((sum, s) => sum + s.overallProgress, 0) / studentCards.length),
        averageEngagement: Math.round(studentCards.reduce((sum, s) => sum + s.engagementScore, 0) / studentCards.length)
      }
    });

  } catch (error) {
    console.error('Error in student progress overview endpoint:', error);
    return NextResponse.json(
      { error: 'Failed to fetch student progress data' },
      { status: 500 }
    );
  }
}
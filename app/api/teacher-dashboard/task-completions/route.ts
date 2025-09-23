/**
 * API endpoint for task completions analytics
 * Provides comprehensive task completion data, engagement metrics, and achievements
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

    // Fetch task completion data
    const { data: taskCompletions, error: completionsError } = await supabase
      .from('task_completions')
      .select('*')
      .in('user_id', userIds)
      .order('completed_at', { ascending: false });

    if (completionsError) {
      console.error('Error fetching task completions:', completionsError);
      return NextResponse.json(
        { error: 'Failed to fetch task completions' },
        { status: 500 }
      );
    }

    // Calculate date ranges for trends
    const now = new Date();
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // ===== GENERAL TASK COMPLETION TRENDS =====
    const generalTrends = calculateGeneralTrends(taskCompletions || [], lastWeek, lastMonth);

    // ===== STUDENT TASK ANALYTICS =====
    const studentAnalytics = userIds.map(userId => {
      const userCompletions = (taskCompletions || []).filter(completion => completion.user_id === userId);
      return analyzeStudentTaskMetrics(userId, userCompletions, userDetailsMap[userId], lastWeek, lastMonth);
    });

    // Filter out users with no task completions
    const activeStudents = studentAnalytics.filter(student => student.totalTasksCompleted > 0);

    return NextResponse.json({
      generalTrends,
      studentAnalytics: activeStudents,
      summary: {
        totalStudentsWithCompletions: activeStudents.length,
        totalCompletions: generalTrends.totalCompletions,
        totalUniqueTasks: generalTrends.totalUniqueTasks,
        averageCompletionsPerStudent: activeStudents.length > 0 
          ? Math.round(generalTrends.totalCompletions / activeStudents.length) 
          : 0
      }
    });

  } catch (error) {
    console.error('Error in task-completions API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch task completion data' },
      { status: 500 }
    );
  }
}

function calculateGeneralTrends(completions: any[], lastWeek: Date, lastMonth: Date) {
  const recentCompletions = completions.filter(c => new Date(c.completed_at) >= lastWeek);
  const monthlyCompletions = completions.filter(c => new Date(c.completed_at) >= lastMonth);
  
  // Calculate attempt distribution
  const attemptDistribution = completions.reduce((acc, completion) => {
    const attempts = completion.attempts;
    if (attempts <= 2) acc.easy++;
    else if (attempts <= 4) acc.medium++;
    else acc.hard++;
    return acc;
  }, { easy: 0, medium: 0, hard: 0 });

  // Calculate daily activity
  const dailyActivity = calculateDailyActivity(completions);

  // Calculate hourly patterns
  const hourlyPatterns = calculateHourlyPatterns(completions);

  // Calculate task difficulty insights
  const taskDifficulty = calculateTaskDifficulty(completions);

  return {
    totalCompletions: completions.length,
    totalUniqueTasks: new Set(completions.map(c => c.task_id)).size,
    totalUniqueUsers: new Set(completions.map(c => c.user_id)).size,
    recentCompletions: recentCompletions.length,
    monthlyCompletions: monthlyCompletions.length,
    
    averageAttempts: completions.length > 0 
      ? Math.round((completions.reduce((sum, c) => sum + c.attempts, 0) / completions.length) * 100) / 100 
      : 0,
    
    attemptDistribution,
    dailyActivity,
    hourlyPatterns,
    taskDifficulty,
    
    peakActivity: {
      date: dailyActivity[0]?.date || null,
      completions: dailyActivity[0]?.completions || 0
    }
  };
}

function analyzeStudentTaskMetrics(userId: string, userCompletions: any[], userDetails: any, lastWeek: Date, lastMonth: Date) {
  const recentCompletions = userCompletions.filter(c => new Date(c.completed_at) >= lastWeek);
  const monthlyCompletions = userCompletions.filter(c => new Date(c.completed_at) >= lastMonth);

  // Calculate learning streak
  const learningStreak = calculateLearningStreak(userCompletions);
  
  // Calculate activity calendar data
  const activityCalendar = calculateActivityCalendar(userCompletions);
  
  // Calculate achievements
  const achievements = calculateAchievements(userCompletions);
  
  // Calculate efficiency metrics
  const efficiencyMetrics = calculateEfficiencyMetrics(userCompletions);
  
  // Calculate time patterns
  const timePatterns = calculateTimePatterns(userCompletions);

  const averageAttempts = userCompletions.length > 0 
    ? Math.round((userCompletions.reduce((sum, c) => sum + c.attempts, 0) / userCompletions.length) * 100) / 100
    : 0;

  return {
    userId,
    name: userDetails?.fullName || `Student ${userId.slice(5, 9)}`,
    email: userDetails?.email,
    firstName: userDetails?.firstName,
    lastName: userDetails?.lastName,
    
    // Phase 1: Core Analytics
    totalTasksCompleted: userCompletions.length,
    recentTasksCompleted: recentCompletions.length,
    monthlyTasksCompleted: monthlyCompletions.length,
    averageAttempts,
    uniqueTasksCompleted: new Set(userCompletions.map(c => c.task_id)).size,
    
    // Phase 2: Engagement Tracking
    learningStreak,
    activityCalendar,
    achievements,
    efficiencyMetrics,
    timePatterns,
    
    // Activity dates
    firstCompletion: userCompletions[userCompletions.length - 1]?.completed_at || null,
    lastCompletion: userCompletions[0]?.completed_at || null,
    activeDays: new Set(userCompletions.map(c => new Date(c.completed_at).toDateString())).size,
    
    // Performance categorization
    efficiencyRating: getEfficiencyRating(averageAttempts),
    activityLevel: getActivityLevel(userCompletions.length, recentCompletions.length),
    
    // Detailed completion history for modal
    recentCompletionHistory: userCompletions.slice(0, 20).map(completion => ({
      taskId: completion.task_id,
      attempts: completion.attempts,
      completedAt: completion.completed_at,
      createdAt: completion.created_at,
      timeToComplete: new Date(completion.completed_at).getTime() - new Date(completion.created_at).getTime()
    }))
  };
}

// Helper functions
function calculateDailyActivity(completions: any[]): { date: string; completions: number; users: number }[] {
  const dailyMap = new Map<string, { completions: Set<string>; users: Set<string> }>();
  
  completions.forEach(completion => {
    const date = new Date(completion.completed_at).toISOString().split('T')[0];
    if (!dailyMap.has(date)) {
      dailyMap.set(date, { completions: new Set(), users: new Set() });
    }
    dailyMap.get(date)!.completions.add(completion.id);
    dailyMap.get(date)!.users.add(completion.user_id);
  });
  
  return Array.from(dailyMap.entries())
    .map(([date, data]) => ({
      date,
      completions: data.completions.size,
      users: data.users.size
    }))
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 30); // Last 30 days
}

function calculateHourlyPatterns(completions: any[]): { hour: number; completions: number; users: number }[] {
  const hourlyMap = new Map<number, { completions: number; users: Set<string> }>();
  
  for (let hour = 0; hour < 24; hour++) {
    hourlyMap.set(hour, { completions: 0, users: new Set() });
  }
  
  completions.forEach(completion => {
    const hour = new Date(completion.completed_at).getHours();
    const data = hourlyMap.get(hour)!;
    data.completions++;
    data.users.add(completion.user_id);
  });
  
  return Array.from(hourlyMap.entries()).map(([hour, data]) => ({
    hour,
    completions: data.completions,
    users: data.users.size
  }));
}

function calculateTaskDifficulty(completions: any[]): { taskId: string; averageAttempts: number; completionCount: number }[] {
  const taskMap = new Map<string, { attempts: number[]; count: number }>();
  
  completions.forEach(completion => {
    if (!taskMap.has(completion.task_id)) {
      taskMap.set(completion.task_id, { attempts: [], count: 0 });
    }
    const data = taskMap.get(completion.task_id)!;
    data.attempts.push(completion.attempts);
    data.count++;
  });
  
  return Array.from(taskMap.entries())
    .map(([taskId, data]) => ({
      taskId,
      averageAttempts: Math.round((data.attempts.reduce((sum, a) => sum + a, 0) / data.attempts.length) * 100) / 100,
      completionCount: data.count
    }))
    .filter(task => task.completionCount >= 3) // Only tasks with sufficient data
    .sort((a, b) => b.averageAttempts - a.averageAttempts)
    .slice(0, 10); // Top 10 most difficult tasks
}

function calculateLearningStreak(completions: any[]): { current: number; longest: number; lastActive: string | null } {
  if (completions.length === 0) return { current: 0, longest: 0, lastActive: null };
  
  const dates = [...new Set(completions.map(c => new Date(c.completed_at).toDateString()))].sort();
  const lastActive = dates[dates.length - 1];
  
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 1;
  
  // Calculate current streak (from most recent date backwards)
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString();
  
  if (lastActive === today || lastActive === yesterday) {
    currentStreak = 1;
    for (let i = dates.length - 2; i >= 0; i--) {
      const prevDate = new Date(dates[i]);
      const nextDate = new Date(dates[i + 1]);
      const dayDiff = (nextDate.getTime() - prevDate.getTime()) / (24 * 60 * 60 * 1000);
      
      if (dayDiff === 1) {
        currentStreak++;
      } else {
        break;
      }
    }
  }
  
  // Calculate longest streak
  for (let i = 1; i < dates.length; i++) {
    const prevDate = new Date(dates[i - 1]);
    const currentDate = new Date(dates[i]);
    const dayDiff = (currentDate.getTime() - prevDate.getTime()) / (24 * 60 * 60 * 1000);
    
    if (dayDiff === 1) {
      tempStreak++;
    } else {
      longestStreak = Math.max(longestStreak, tempStreak);
      tempStreak = 1;
    }
  }
  longestStreak = Math.max(longestStreak, tempStreak);
  
  return { current: currentStreak, longest: longestStreak, lastActive };
}

function calculateActivityCalendar(completions: any[]): { date: string; count: number; level: number }[] {
  const calendarMap = new Map<string, number>();
  const last90Days = [];
  
  // Generate last 90 days
  for (let i = 89; i >= 0; i--) {
    const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    last90Days.push(date);
    calendarMap.set(date, 0);
  }
  
  // Count completions per day
  completions.forEach(completion => {
    const date = new Date(completion.completed_at).toISOString().split('T')[0];
    if (calendarMap.has(date)) {
      calendarMap.set(date, calendarMap.get(date)! + 1);
    }
  });
  
  // Calculate activity levels (0-4 scale like GitHub)
  const maxCount = Math.max(...Array.from(calendarMap.values()));
  
  return last90Days.map(date => {
    const count = calendarMap.get(date) || 0;
    let level = 0;
    if (count > 0) {
      if (maxCount <= 2) level = count;
      else if (maxCount <= 5) level = Math.ceil((count / maxCount) * 3);
      else level = Math.ceil((count / maxCount) * 4);
    }
    
    return { date, count, level: Math.min(level, 4) };
  });
}

function calculateAchievements(completions: any[]): any {
  const achievements = {
    speedRunner: completions.filter(c => c.attempts === 1).length,
    persistent: completions.filter(c => c.attempts >= 5).length,
    earlyBird: completions.filter(c => new Date(c.completed_at).getHours() < 8).length,
    nightOwl: completions.filter(c => new Date(c.completed_at).getHours() >= 22).length,
    weekendWarrior: completions.filter(c => {
      const day = new Date(c.completed_at).getDay();
      return day === 0 || day === 6;
    }).length,
    taskMaster: completions.length >= 50,
    efficient: completions.length > 10 && (completions.reduce((sum, c) => sum + c.attempts, 0) / completions.length) < 2.0
  };
  
  return achievements;
}

function calculateEfficiencyMetrics(completions: any[]): any {
  if (completions.length === 0) return { successRate: 0, averageAttempts: 0, improvement: 0 };
  
  const averageAttempts = completions.reduce((sum, c) => sum + c.attempts, 0) / completions.length;
  const successRate = (completions.filter(c => c.attempts <= 2).length / completions.length) * 100;
  
  // Calculate improvement trend (last 10 vs first 10 completions)
  let improvement = 0;
  if (completions.length >= 10) {
    const recent = completions.slice(0, 10);
    const early = completions.slice(-10);
    const recentAvg = recent.reduce((sum, c) => sum + c.attempts, 0) / recent.length;
    const earlyAvg = early.reduce((sum, c) => sum + c.attempts, 0) / early.length;
    improvement = ((earlyAvg - recentAvg) / earlyAvg) * 100;
  }
  
  return {
    successRate: Math.round(successRate),
    averageAttempts: Math.round(averageAttempts * 100) / 100,
    improvement: Math.round(improvement)
  };
}

function calculateTimePatterns(completions: any[]): any {
  const hourCounts = new Array(24).fill(0);
  const dayCounts = new Array(7).fill(0);
  
  completions.forEach(completion => {
    const date = new Date(completion.completed_at);
    hourCounts[date.getHours()]++;
    dayCounts[date.getDay()]++;
  });
  
  const peakHour = hourCounts.indexOf(Math.max(...hourCounts));
  const peakDay = dayCounts.indexOf(Math.max(...dayCounts));
  
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  return {
    peakHour,
    peakDay: dayNames[peakDay],
    hourlyDistribution: hourCounts,
    weeklyDistribution: dayCounts
  };
}

function getEfficiencyRating(averageAttempts: number): 'excellent' | 'good' | 'needs-improvement' {
  if (averageAttempts <= 2) return 'excellent';
  if (averageAttempts <= 3.5) return 'good';
  return 'needs-improvement';
}

function getActivityLevel(totalCompletions: number, recentCompletions: number): 'high' | 'moderate' | 'low' {
  if (recentCompletions >= 5 || totalCompletions >= 30) return 'high';
  if (recentCompletions >= 2 || totalCompletions >= 10) return 'moderate';
  return 'low';
}
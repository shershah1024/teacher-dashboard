/**
 * API endpoint for fetching detailed student data for teacher view
 * Returns comprehensive analytics for a specific student
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { teacherId, studentId, timeRange = 'month' } = body;

    if (!teacherId || !studentId) {
      return NextResponse.json(
        { error: 'Teacher ID and Student ID are required' },
        { status: 400 }
      );
    }

    // Verify student exists in organization (for now, we're using A&B Recruiting for all)
    const { data: studentOrg, error: orgError } = await supabase
      .from('user_organizations')
      .select('*')
      .eq('user_id', studentId)
      .eq('organization_code', 'ANB')
      .single();

    if (orgError || !studentOrg) {
      console.error('Student not found in organization:', studentId, orgError);
      return NextResponse.json(
        { error: 'Student not found or access denied' },
        { status: 403 }
      );
    }

    // Use formatted user ID as name since we're using Clerk IDs
    const userData = {
      name: studentId.startsWith('user_') ? `Student ${studentId.slice(5, 9)}` : studentId,
      email: `${studentId}@student.com`
    };

    // Calculate date ranges
    const now = new Date();
    let startDate = new Date();

    switch (timeRange) {
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'all':
        startDate = new Date(studentOrg.created_at);
        break;
    }

    // Fetch vocabulary metrics (using german_user_vocabulary like original)
    const { data: allVocabData } = await supabase
      .from('german_user_vocabulary')
      .select('*')
      .eq('user_id', studentId);

    const { data: weekVocabData } = await supabase
      .from('german_user_vocabulary')
      .select('*')
      .eq('user_id', studentId)
      .gte('created_at', new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString());

    const { data: monthVocabData } = await supabase
      .from('german_user_vocabulary')
      .select('*')
      .eq('user_id', studentId)
      .gte('created_at', new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString());

    const totalWords = new Set(allVocabData?.map(item => item.term) || []).size;
    const weeklyWords = new Set(weekVocabData?.map(item => item.term) || []).size;
    const monthlyWords = new Set(monthVocabData?.map(item => item.term) || []).size;

    // Fetch conversation metrics (using lesson_speaking_scores and lesson_chatbot_scores like original)
    const { data: speakingScores } = await supabase
      .from('lesson_speaking_scores')
      .select('*')
      .eq('user_id', studentId);

    const { data: chatbotScores } = await supabase
      .from('lesson_chatbot_scores')
      .select('*')
      .eq('user_id', studentId);

    // Count unique conversations by task_id
    const speakingConversations = new Set(speakingScores?.map(item => item.task_id) || []).size;
    const chatbotConversations = new Set(chatbotScores?.map(item => item.task_id) || []).size;
    const totalConversations = speakingConversations + chatbotConversations;

    // Fetch streak data (calculated from task_completions like original)
    const { data: taskCompletions } = await supabase
      .from('task_completions')
      .select('completed_at')
      .eq('user_id', studentId)
      .eq('course_id', 'telc_a1')
      .order('completed_at', { ascending: false })
      .limit(365);

    let currentStreak = 0;
    let longestStreak = 0;
    if (taskCompletions && taskCompletions.length > 0) {
      const completionDates = new Set(
        taskCompletions.map(task =>
          new Date(task.completed_at).toISOString().split('T')[0]
        )
      );

      const sortedDates = Array.from(completionDates).sort((a, b) =>
        new Date(b).getTime() - new Date(a).getTime()
      );

      if (sortedDates.length > 0) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        const mostRecentDate = new Date(sortedDates[0]);
        mostRecentDate.setHours(0, 0, 0, 0);

        if (mostRecentDate >= yesterday) {
          currentStreak = 1;
          for (let i = 1; i < sortedDates.length; i++) {
            const currentDate = new Date(sortedDates[i]);
            const previousDate = new Date(sortedDates[i - 1]);
            const dayDiff = Math.floor(
              (previousDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24)
            );
            if (dayDiff === 1) {
              currentStreak++;
            } else {
              break;
            }
          }
        }

        // Calculate longest streak
        let tempStreak = 1;
        for (let i = 1; i < sortedDates.length; i++) {
          const currentDate = new Date(sortedDates[i]);
          const previousDate = new Date(sortedDates[i - 1]);
          const dayDiff = Math.floor(
            (previousDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24)
          );
          if (dayDiff === 1) {
            tempStreak++;
            longestStreak = Math.max(longestStreak, tempStreak);
          } else {
            tempStreak = 1;
          }
        }
        longestStreak = Math.max(longestStreak, tempStreak);
      }
    }

    // Calculate skill scores using exact same tables as original project
    const skills = {
      speaking: 0,
      listening: 0,
      reading: 0,
      writing: 0,
      grammar: 0,
      vocabulary: 0,
      pronunciation: 0
    };

    // Speaking scores (from speaking_scores table)
    const { data: speakingData } = await supabase
      .from('speaking_scores')
      .select('score')
      .eq('user_id', studentId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (speakingData && speakingData.length > 0) {
      skills.speaking = Math.round(
        speakingData.reduce((acc, item) => acc + (item.score || 0), 0) / speakingData.length
      );
    }

    // Listening scores (from lesson_listening_scores)
    const { data: listeningData } = await supabase
      .from('lesson_listening_scores')
      .select('score_percentage')
      .eq('user_id', studentId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (listeningData && listeningData.length > 0) {
      skills.listening = Math.round(
        listeningData.reduce((acc, item) => acc + (item.score_percentage || 0), 0) / listeningData.length
      );
    }

    // Reading scores (from lesson_reading_scores)
    const { data: readingData } = await supabase
      .from('lesson_reading_scores')
      .select('score_percentage')
      .eq('user_id', studentId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (readingData && readingData.length > 0) {
      skills.reading = Math.round(
        readingData.reduce((acc, item) => acc + (item.score_percentage || 0), 0) / readingData.length
      );
    }

    // Writing scores (from lesson_writing_scores)
    const { data: writingData } = await supabase
      .from('lesson_writing_scores')
      .select('score')
      .eq('user_id', studentId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (writingData && writingData.length > 0) {
      skills.writing = Math.round(
        writingData.reduce((acc, item) => acc + (item.score || 0), 0) / writingData.length
      );
    }

    // Grammar scores (from lesson_grammar_scores)
    const { data: grammarData } = await supabase
      .from('lesson_grammar_scores')
      .select('percentage_score')
      .eq('user_id', studentId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (grammarData && grammarData.length > 0) {
      skills.grammar = Math.round(
        grammarData.reduce((acc, item) => acc + (Number(item.percentage_score) || 0), 0) / grammarData.length
      );
    }

    // Pronunciation scores (from pronunciation_scores)
    const { data: pronunciationData } = await supabase
      .from('pronunciation_scores')
      .select('pronunciation_score')
      .eq('user_id', studentId)
      .gte('pronunciation_score', 0)
      .order('created_at', { ascending: false })
      .limit(20);

    if (pronunciationData && pronunciationData.length > 0) {
      skills.pronunciation = Math.round(
        pronunciationData.reduce((acc, item) => acc + (item.pronunciation_score || 0), 0) / pronunciationData.length
      );
    }

    // Vocabulary score (based on total words learned)
    const targetWords = 500; // Target for A1 level
    skills.vocabulary = Math.round(Math.min(100, (totalWords / targetWords) * 100));

    // Calculate overall progress (from user_lesson_progress like original)
    const { data: progressData } = await supabase
      .from('user_lesson_progress')
      .select('*')
      .eq('user_id', studentId);

    let overallProgress = 0;
    if (progressData && progressData.length > 0) {
      const totalLessons = 50; // Adjust based on course structure
      const completedLessons = progressData.filter(p => p.completed === true).length;
      overallProgress = Math.round((completedLessons / totalLessons) * 100);
    }

    // If no lesson progress, calculate based on activity
    if (overallProgress === 0) {
      const vocabProgress = Math.min((totalWords / 200) * 50, 50);
      const conversationProgress = Math.min((totalConversations / 40) * 50, 50);
      overallProgress = Math.round(vocabProgress + conversationProgress);
    }

    // Get weekly activity (using task_completions)
    const weeklyActivity = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);

      const { data: dayCompletions } = await supabase
        .from('task_completions')
        .select('*')
        .eq('user_id', studentId)
        .eq('course_id', 'telc_a1')
        .gte('completed_at', dayStart.toISOString())
        .lte('completed_at', dayEnd.toISOString());

      const exercisesCompleted = dayCompletions?.length || 0;
      const minutesSpent = exercisesCompleted * 15; // Estimate 15 minutes per task

      weeklyActivity.push({
        date: dayStart.toISOString(),
        minutesSpent,
        exercisesCompleted
      });
    }

    // Get recent activity from task_completions
    const { data: recentCompletions } = await supabase
      .from('task_completions')
      .select('completed_at, task_id, task_type, lesson_id')
      .eq('user_id', studentId)
      .eq('course_id', 'telc_a1')
      .order('completed_at', { ascending: false })
      .limit(20);

    const recentLessons = (recentCompletions || []).map(completion => ({
      date: completion.completed_at,
      lessonName: completion.lesson_id || 'Lesson',
      type: completion.task_type || 'exercise',
      taskId: completion.task_id,
      score: 0, // Scores are in separate tables
      timeSpent: 15 // Estimate
    }));

    // Get last activity
    const lastActive = recentCompletions && recentCompletions.length > 0
      ? recentCompletions[0].completed_at
      : studentOrg.created_at;

    // Generate test history from various score tables
    const testHistory = [];

    // Add recent speaking tests
    if (speakingData && speakingData.length > 0) {
      testHistory.push({
        date: new Date().toISOString(),
        testType: 'Speaking',
        score: skills.speaking,
        improvement: 0
      });
    }

    // Add recent listening tests
    if (listeningData && listeningData.length > 0) {
      testHistory.push({
        date: new Date().toISOString(),
        testType: 'Listening',
        score: skills.listening,
        improvement: 0
      });
    }

    // Add recent reading tests
    if (readingData && readingData.length > 0) {
      testHistory.push({
        date: new Date().toISOString(),
        testType: 'Reading',
        score: skills.reading,
        improvement: 0
      });
    }

    // Generate vocabulary progress data
    const vocabularyProgress = [];
    for (let i = 0; i < 30; i += 5) {
      const date = new Date();
      date.setDate(date.getDate() - i);

      const { data: vocabToDate } = await supabase
        .from('german_user_vocabulary')
        .select('term')
        .eq('user_id', studentId)
        .lte('created_at', date.toISOString());

      const wordsLearned = new Set(vocabToDate?.map(item => item.term) || []).size;

      vocabularyProgress.push({
        date: date.toISOString(),
        wordsLearned,
        totalWords
      });
    }

    // Generate strengths and weaknesses
    const skillsArray = Object.entries(skills);
    const sortedSkills = skillsArray.sort((a, b) => b[1] - a[1]);

    const strengths = sortedSkills
      .slice(0, 3)
      .filter(([_, score]) => score >= 60)
      .map(([skill, score]) => `Strong performance in ${skill} (${score}%)`);

    const weaknesses = sortedSkills
      .slice(-3)
      .filter(([_, score]) => score < 60)
      .map(([skill, score]) => `Needs improvement in ${skill} (${score}%)`);

    const recommendations = [];
    if (skills.speaking < 60) {
      recommendations.push('Schedule more speaking practice sessions');
    }
    if (skills.vocabulary < 50) {
      recommendations.push('Focus on daily vocabulary exercises');
    }
    if (skills.grammar < 60) {
      recommendations.push('Review grammar fundamentals');
    }
    if (currentStreak < 7) {
      recommendations.push('Encourage daily practice to build consistency');
    }

    const responseData: any = {
      id: studentId,
      name: userData.name,
      email: userData.email,
      enrolledAt: studentOrg.created_at,
      lastActive,
      overallProgress,
      dailyStreak: currentStreak,
      longestStreak: longestStreak,
      weeklyWords,
      monthlyWords,
      totalWords,
      totalConversations,
      speakingConversations,
      chatbotConversations,
      skills,
      weeklyActivity,
      recentLessons,
      strengthsAndWeaknesses: {
        strengths,
        weaknesses,
        recommendations
      },
      testHistory,
      vocabularyProgress: vocabularyProgress.reverse()
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Error in teacher-dashboard/student-details API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch student details' },
      { status: 500 }
    );
  }
}
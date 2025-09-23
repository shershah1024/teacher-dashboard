/**
 * API endpoint for fetching students with their progress data
 * Returns detailed analytics for each student in the organization
 * Uses the exact same data sources as the original telc_a1 project
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
    const { teacherId, organizationCode } = body;

    // For now, we'll fetch all students from a specific organization
    const defaultOrgCode = 'ANB'; // A&B Recruiting
    const orgCode = organizationCode || defaultOrgCode;

    // Fetch all users in the organization
    const { data: orgUsers, error: orgError } = await supabase
      .from('user_organizations')
      .select('user_id, organization_name')
      .eq('organization_code', orgCode);

    if (orgError) {
      console.error('Error fetching organization users:', orgError);
      return NextResponse.json(
        { error: 'Failed to fetch organization users' },
        { status: 500 }
      );
    }

    // Fetch detailed data for each student using the same tables as original project
    const studentsWithData = await Promise.all(
      (orgUsers || []).map(async (orgUser) => {
        const studentId = orgUser.user_id;

        // Use formatted user ID as name since we're using Clerk IDs
        const userData = {
          name: studentId.startsWith('user_') ? `Student ${studentId.slice(5, 9)}` : studentId,
          email: `${studentId}@student.com`
        };

        // Calculate dates for metrics
        const now = new Date();
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0, 0, 0, 0);

        // ===== VOCABULARY DATA (from german_user_vocabulary) =====
        const { data: vocabularyData } = await supabase
          .from('german_user_vocabulary')
          .select('*')
          .eq('user_id', studentId)
          .gte('created_at', startOfWeek.toISOString());

        const { data: allVocabData } = await supabase
          .from('german_user_vocabulary')
          .select('*')
          .eq('user_id', studentId);

        const weeklyWords = new Set(vocabularyData?.map(item => item.term) || []).size;
        const totalWords = new Set(allVocabData?.map(item => item.term) || []).size;

        // ===== CONVERSATION DATA (from lesson_speaking_scores & lesson_chatbot_scores) =====
        const { data: speakingScores } = await supabase
          .from('lesson_speaking_scores')
          .select('*')
          .eq('user_id', studentId);

        const { data: chatbotScores } = await supabase
          .from('lesson_chatbot_scores')
          .select('*')
          .eq('user_id', studentId);

        // Count unique conversations by task_id (as per original)
        const speakingConversations = new Set(speakingScores?.map(item => item.task_id) || []).size;
        const chatbotConversations = new Set(chatbotScores?.map(item => item.task_id) || []).size;
        const totalConversations = speakingConversations + chatbotConversations;

        // ===== STREAK DATA (from task_completions) =====
        const { data: taskCompletions } = await supabase
          .from('task_completions')
          .select('completed_at')
          .eq('user_id', studentId)
          .eq('course_id', 'telc_a1')
          .order('completed_at', { ascending: false })
          .limit(365);

        let dailyStreak = 0;
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
              dailyStreak = 1;
              for (let i = 1; i < sortedDates.length; i++) {
                const currentDate = new Date(sortedDates[i]);
                const previousDate = new Date(sortedDates[i - 1]);
                const dayDiff = Math.floor(
                  (previousDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24)
                );
                if (dayDiff === 1) {
                  dailyStreak++;
                } else {
                  break;
                }
              }
            }
          }
        }

        // ===== SKILL SCORES (from various lesson_*_scores tables) =====
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

        // ===== OVERALL PROGRESS (from user_lesson_progress) =====
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

        // If no lesson progress, calculate based on activity (as per original)
        if (overallProgress === 0) {
          const vocabProgress = Math.min((totalWords / 200) * 50, 50);
          const conversationProgress = Math.min((totalConversations / 40) * 50, 50);
          overallProgress = Math.round(vocabProgress + conversationProgress);
        }

        // ===== RECENT ACTIVITY =====
        const { data: recentCompletions } = await supabase
          .from('task_completions')
          .select('completed_at, task_id, task_type')
          .eq('user_id', studentId)
          .order('completed_at', { ascending: false })
          .limit(5);

        const recentActivity = (recentCompletions || []).map(activity => ({
          date: activity.completed_at,
          type: activity.task_type || 'lesson',
          taskId: activity.task_id
        }));

        const lastActive = recentCompletions && recentCompletions.length > 0
          ? recentCompletions[0].completed_at
          : new Date().toISOString();

        return {
          id: studentId,
          name: userData.name,
          email: userData.email,
          enrolledAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          lastActive,
          overallProgress,
          dailyStreak,
          weeklyWords,
          totalWords,
          totalConversations,
          speakingConversations,
          chatbotConversations,
          skills,
          recentActivity
        };
      })
    );

    // Filter out students with no activity
    const activeStudents = studentsWithData.filter(student => {
      // Check if student has any progress, words, conversations, or completed tasks
      return student.progress > 0 || 
             student.totalWords > 0 || 
             student.totalConversations > 0 || 
             student.currentStreak > 0 ||
             student.tasksCompleted > 0;
    });
    
    return NextResponse.json(activeStudents);
  } catch (error) {
    console.error('Error in teacher-dashboard/students API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch students data' },
      { status: 500 }
    );
  }
}
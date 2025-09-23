import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface ListeningScore {
  id: string;
  user_id: string;
  lesson_id: string;
  task_id: string;
  score_percentage: number;
  total_questions: number;
  correct_answers: number;
  time_spent_seconds: number;
  created_at: string;
  audio_replays?: number;
  difficulty_level?: string;
  error_types?: string[];
}

interface StudentData {
  user_id: string;
  name: string;
  scores: ListeningScore[];
  averageScore: number;
  totalAttempts: number;
  recentScore?: number;
  trend: 'improving' | 'declining' | 'stable';
  scoreDistribution: { range: string; count: number }[];
  lessonPerformance: { lesson: string; avgScore: number; attempts: number }[];
  timeAnalysis: {
    avgTimeSpent: number;
    totalTimeSpent: number;
    efficiencyScore: number;
  };
  weakAreas: string[];
  strongAreas: string[];
}

interface DashboardFilters {
  studentId?: string;
  organizationCode?: string;
  dateFrom?: string;
  dateTo?: string;
  minScore?: number;
  maxScore?: number;
  lessonIds?: string[];
  groupBy?: 'student' | 'lesson' | 'date' | 'score_range' | 'difficulty';
  sortBy?: 'score' | 'date' | 'attempts' | 'improvement';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
}

function calculateTrend(scores: ListeningScore[]): 'improving' | 'declining' | 'stable' {
  if (scores.length < 2) return 'stable';
  
  const sortedScores = scores.sort((a, b) => 
    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
  
  const recentScores = sortedScores.slice(-5);
  const olderScores = sortedScores.slice(Math.max(0, sortedScores.length - 10), -5);
  
  if (olderScores.length === 0) return 'stable';
  
  const recentAvg = recentScores.reduce((sum, s) => sum + s.score_percentage, 0) / recentScores.length;
  const olderAvg = olderScores.reduce((sum, s) => sum + s.score_percentage, 0) / olderScores.length;
  
  const difference = recentAvg - olderAvg;
  
  if (difference > 5) return 'improving';
  if (difference < -5) return 'declining';
  return 'stable';
}

function getScoreDistribution(scores: ListeningScore[]): { range: string; count: number }[] {
  const ranges = [
    { range: '0-20%', min: 0, max: 20, count: 0 },
    { range: '21-40%', min: 21, max: 40, count: 0 },
    { range: '41-60%', min: 41, max: 60, count: 0 },
    { range: '61-80%', min: 61, max: 80, count: 0 },
    { range: '81-100%', min: 81, max: 100, count: 0 }
  ];
  
  scores.forEach(score => {
    const range = ranges.find(r => 
      score.score_percentage >= r.min && score.score_percentage <= r.max
    );
    if (range) range.count++;
  });
  
  return ranges.map(({ range, count }) => ({ range, count }));
}

function analyzeLessonPerformance(scores: ListeningScore[]) {
  const lessonMap = new Map<string, { totalScore: number; count: number }>();
  
  scores.forEach(score => {
    const current = lessonMap.get(score.lesson_id) || { totalScore: 0, count: 0 };
    lessonMap.set(score.lesson_id, {
      totalScore: current.totalScore + score.score_percentage,
      count: current.count + 1
    });
  });
  
  return Array.from(lessonMap.entries()).map(([lesson, data]) => ({
    lesson,
    avgScore: Math.round(data.totalScore / data.count),
    attempts: data.count
  })).sort((a, b) => b.avgScore - a.avgScore);
}

function identifyWeakAreas(scores: ListeningScore[], lessonPerformance: any[]): string[] {
  const weakAreas: string[] = [];
  
  // Identify lessons with low performance
  const weakLessons = lessonPerformance
    .filter(lp => lp.avgScore < 60)
    .map(lp => `Lesson ${lp.lesson}`);
  weakAreas.push(...weakLessons.slice(0, 3));
  
  // Check for consistency issues
  const scoreVariance = calculateVariance(scores.map(s => s.score_percentage));
  if (scoreVariance > 400) {
    weakAreas.push('Inconsistent performance');
  }
  
  // Check for audio replay dependency
  const avgReplays = scores.reduce((sum, s) => sum + (s.audio_replays || 0), 0) / scores.length;
  if (avgReplays > 3) {
    weakAreas.push('High audio replay dependency');
  }
  
  return weakAreas;
}

function identifyStrongAreas(scores: ListeningScore[], lessonPerformance: any[]): string[] {
  const strongAreas: string[] = [];
  
  // Identify lessons with high performance
  const strongLessons = lessonPerformance
    .filter(lp => lp.avgScore >= 80)
    .map(lp => `Lesson ${lp.lesson}`);
  strongAreas.push(...strongLessons.slice(0, 3));
  
  // Check for speed
  const avgTime = scores.reduce((sum, s) => sum + s.time_spent_seconds, 0) / scores.length;
  const avgQuestions = scores.reduce((sum, s) => sum + s.total_questions, 0) / scores.length;
  if (avgTime / avgQuestions < 30) {
    strongAreas.push('Quick comprehension');
  }
  
  // Check for accuracy
  const highScoreRate = scores.filter(s => s.score_percentage >= 80).length / scores.length;
  if (highScoreRate > 0.7) {
    strongAreas.push('Consistent high accuracy');
  }
  
  return strongAreas;
}

function calculateVariance(numbers: number[]): number {
  const mean = numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
  const squaredDiffs = numbers.map(n => Math.pow(n - mean, 2));
  return squaredDiffs.reduce((sum, d) => sum + d, 0) / numbers.length;
}

export async function POST(request: NextRequest) {
  try {
    const filters: DashboardFilters = await request.json();
    
    // Build the query based on filters
    let query = supabase.from('lesson_listening_scores').select('*');
    
    if (filters.studentId) {
      query = query.eq('user_id', filters.studentId);
    }
    
    if (filters.dateFrom) {
      query = query.gte('created_at', filters.dateFrom);
    }
    
    if (filters.dateTo) {
      query = query.lte('created_at', filters.dateTo);
    }
    
    if (filters.minScore !== undefined) {
      query = query.gte('score_percentage', filters.minScore);
    }
    
    if (filters.maxScore !== undefined) {
      query = query.lte('score_percentage', filters.maxScore);
    }
    
    if (filters.lessonIds && filters.lessonIds.length > 0) {
      query = query.in('lesson_id', filters.lessonIds);
    }
    
    // Execute the query
    const { data: scoresData, error } = await query.order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching listening scores:', error);
      return NextResponse.json({ error: 'Failed to fetch listening scores' }, { status: 500 });
    }
    
    // If specific student is requested, return detailed analysis
    if (filters.studentId && scoresData) {
      const studentScores = scoresData as ListeningScore[];
      
      // Get user info (if needed for organization data)
      // const { data: orgUser } = await supabase
      //   .from('user_organizations')
      //   .select('*')
      //   .eq('user_id', filters.studentId)
      //   .single();
      
      const studentName = filters.studentId.startsWith('user_') 
        ? `Student ${filters.studentId.slice(5, 9)}` 
        : filters.studentId;
      
      const lessonPerformance = analyzeLessonPerformance(studentScores);
      
      const studentData: StudentData = {
        user_id: filters.studentId,
        name: studentName,
        scores: studentScores,
        averageScore: Math.round(
          studentScores.reduce((sum, s) => sum + s.score_percentage, 0) / studentScores.length
        ),
        totalAttempts: studentScores.length,
        recentScore: studentScores[0]?.score_percentage,
        trend: calculateTrend(studentScores),
        scoreDistribution: getScoreDistribution(studentScores),
        lessonPerformance,
        timeAnalysis: {
          avgTimeSpent: Math.round(
            studentScores.reduce((sum, s) => sum + s.time_spent_seconds, 0) / studentScores.length
          ),
          totalTimeSpent: studentScores.reduce((sum, s) => sum + s.time_spent_seconds, 0),
          efficiencyScore: Math.round(
            studentScores.reduce((sum, s) => {
              const timePerQuestion = s.time_spent_seconds / s.total_questions;
              const accuracyWeight = s.score_percentage / 100;
              return sum + (accuracyWeight * 100 / Math.max(timePerQuestion, 1));
            }, 0) / studentScores.length
          )
        },
        weakAreas: identifyWeakAreas(studentScores, lessonPerformance),
        strongAreas: identifyStrongAreas(studentScores, lessonPerformance)
      };
      
      return NextResponse.json({ type: 'student_detail', data: studentData });
    }
    
    // Otherwise, return grouped data based on groupBy parameter
    if (!scoresData) {
      return NextResponse.json({ type: 'empty', data: [] });
    }
    
    const allScores = scoresData as ListeningScore[];
    
    // Group by different criteria
    let groupedData: any = {};
    
    switch (filters.groupBy) {
      case 'lesson':
        // Group by lesson
        const lessonGroups = new Map<string, ListeningScore[]>();
        allScores.forEach(score => {
          const group = lessonGroups.get(score.lesson_id) || [];
          group.push(score);
          lessonGroups.set(score.lesson_id, group);
        });
        
        groupedData = {
          type: 'by_lesson',
          groups: Array.from(lessonGroups.entries()).map(([lesson, scores]) => ({
            lesson,
            studentCount: new Set(scores.map(s => s.user_id)).size,
            avgScore: Math.round(scores.reduce((sum, s) => sum + s.score_percentage, 0) / scores.length),
            totalAttempts: scores.length,
            scores
          })).sort((a, b) => b.avgScore - a.avgScore)
        };
        break;
      
      case 'score_range':
        // Group by score ranges
        const scoreRanges = [
          { label: 'Excellent (81-100%)', min: 81, max: 100, scores: [] as ListeningScore[] },
          { label: 'Good (61-80%)', min: 61, max: 80, scores: [] as ListeningScore[] },
          { label: 'Average (41-60%)', min: 41, max: 60, scores: [] as ListeningScore[] },
          { label: 'Below Average (21-40%)', min: 21, max: 40, scores: [] as ListeningScore[] },
          { label: 'Poor (0-20%)', min: 0, max: 20, scores: [] as ListeningScore[] }
        ];
        
        allScores.forEach(score => {
          const range = scoreRanges.find(r => 
            score.score_percentage >= r.min && score.score_percentage <= r.max
          );
          if (range) range.scores.push(score);
        });
        
        groupedData = {
          type: 'by_score_range',
          groups: scoreRanges.map(range => ({
            range: range.label,
            scoreRange: { min: range.min, max: range.max },
            studentCount: new Set(range.scores.map(s => s.user_id)).size,
            attemptCount: range.scores.length,
            percentage: Math.round((range.scores.length / allScores.length) * 100),
            scores: range.scores
          }))
        };
        break;
      
      case 'date':
        // Group by date
        const dateGroups = new Map<string, ListeningScore[]>();
        allScores.forEach(score => {
          const date = new Date(score.created_at).toISOString().split('T')[0];
          const group = dateGroups.get(date) ?? [];
          group.push(score);
          dateGroups.set(date, group);
        });
        
        groupedData = {
          type: 'by_date',
          groups: Array.from(dateGroups.entries())
            .map(([date, scores]) => ({
              date,
              studentCount: new Set(scores.map(s => s.user_id)).size,
              avgScore: Math.round(scores.reduce((sum, s) => sum + s.score_percentage, 0) / scores.length),
              totalAttempts: scores.length,
              scores
            }))
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        };
        break;
      
      default:
        // Group by student (default)
        const studentGroups = new Map<string, ListeningScore[]>();
        allScores.forEach(score => {
          const group = studentGroups.get(score.user_id) || [];
          group.push(score);
          studentGroups.set(score.user_id, group);
        });
        
        // Get organization users if needed
        let orgUsers: any[] = [];
        if (filters.organizationCode) {
          const { data } = await supabase
            .from('user_organizations')
            .select('user_id')
            .eq('organization_code', filters.organizationCode);
          orgUsers = data || [];
        }
        
        const students = Array.from(studentGroups.entries())
          .filter(([userId]) => 
            !filters.organizationCode || orgUsers.some(u => u.user_id === userId)
          )
          .map(([userId, scores]) => {
            const sortedScores = scores.sort((a, b) => 
              new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );
            const lessonPerformance = analyzeLessonPerformance(scores);
            
            return {
              user_id: userId,
              name: userId.startsWith('user_') ? `Student ${userId.slice(5, 9)}` : userId,
              averageScore: Math.round(
                scores.reduce((sum, s) => sum + s.score_percentage, 0) / scores.length
              ),
              totalAttempts: scores.length,
              recentScore: sortedScores[0]?.score_percentage,
              trend: calculateTrend(scores),
              lastAttempt: sortedScores[0]?.created_at,
              scoreDistribution: getScoreDistribution(scores),
              lessonPerformance: lessonPerformance.slice(0, 3),
              weakAreas: identifyWeakAreas(scores, lessonPerformance).slice(0, 2),
              scores: sortedScores.slice(0, 10)
            };
          });
        
        // Apply sorting
        if (filters.sortBy === 'score') {
          students.sort((a, b) => 
            filters.sortOrder === 'asc' 
              ? a.averageScore - b.averageScore 
              : b.averageScore - a.averageScore
          );
        } else if (filters.sortBy === 'attempts') {
          students.sort((a, b) => 
            filters.sortOrder === 'asc' 
              ? a.totalAttempts - b.totalAttempts 
              : b.totalAttempts - a.totalAttempts
          );
        } else if (filters.sortBy === 'date') {
          students.sort((a, b) => {
            const dateA = a.lastAttempt ? new Date(a.lastAttempt).getTime() : 0;
            const dateB = b.lastAttempt ? new Date(b.lastAttempt).getTime() : 0;
            return filters.sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
          });
        } else if (filters.sortBy === 'improvement') {
          const trendOrder = { improving: 3, stable: 2, declining: 1 };
          students.sort((a, b) => {
            const orderA = trendOrder[a.trend];
            const orderB = trendOrder[b.trend];
            return filters.sortOrder === 'asc' ? orderA - orderB : orderB - orderA;
          });
        }
        
        // Apply limit if specified
        const limitedStudents = filters.limit ? students.slice(0, filters.limit) : students;
        
        groupedData = {
          type: 'by_student',
          students: limitedStudents,
          summary: {
            totalStudents: students.length,
            averageScore: Math.round(
              allScores.reduce((sum, s) => sum + s.score_percentage, 0) / allScores.length
            ),
            totalAttempts: allScores.length,
            improvingStudents: students.filter(s => s.trend === 'improving').length,
            decliningStudents: students.filter(s => s.trend === 'declining').length
          }
        };
    }
    
    return NextResponse.json(groupedData);
  } catch (error) {
    console.error('Error in listening-dashboard API:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}

// GET endpoint to fetch metadata about available lessons and dates
export async function GET() {
  try {
    // Fetch distinct lessons
    const { data: lessons } = await supabase
      .from('lesson_listening_scores')
      .select('lesson_id')
      .order('lesson_id');
    
    const uniqueLessons = Array.from(new Set(lessons?.map(l => l.lesson_id) || []));
    
    // Fetch date range
    const { data: dateRange } = await supabase
      .from('lesson_listening_scores')
      .select('created_at')
      .order('created_at', { ascending: true })
      .limit(1);
    
    const { data: latestDate } = await supabase
      .from('lesson_listening_scores')
      .select('created_at')
      .order('created_at', { ascending: false })
      .limit(1);
    
    return NextResponse.json({
      lessons: uniqueLessons,
      dateRange: {
        earliest: dateRange?.[0]?.created_at || new Date().toISOString(),
        latest: latestDate?.[0]?.created_at || new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error fetching metadata:', error);
    return NextResponse.json({ error: 'Failed to fetch metadata' }, { status: 500 });
  }
}
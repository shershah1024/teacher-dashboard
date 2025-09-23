/**
 * API endpoint for fetching and analyzing grammar_errors data
 * Returns both student cards and general trend data for grammar errors dashboard
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

    // Get all grammar errors for these users
    const { data: grammarErrors, error } = await supabase
      .from('grammar_errors')
      .select('*')
      .in('user_id', userIds)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching grammar errors:', error);
      return NextResponse.json(
        { error: 'Failed to fetch grammar errors' },
        { status: 500 }
      );
    }

    // Calculate date ranges for trends
    const now = new Date();
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Filter errors by time periods
    const recentErrors = grammarErrors?.filter(e => new Date(e.created_at) >= lastWeek) || [];
    const monthlyErrors = grammarErrors?.filter(e => new Date(e.created_at) >= lastMonth) || [];

    // ===== GENERAL TREND DATA =====
    const generalTrends = {
      totalErrors: grammarErrors?.length || 0,
      recentErrors: recentErrors.length,
      monthlyErrors: monthlyErrors.length,
      
      // Error type distribution
      errorTypeDistribution: calculateErrorTypeDistribution(grammarErrors || []),
      
      // German grammar category distribution
      grammarCategoryDistribution: calculateGrammarCategoryDistribution(grammarErrors || []),
      
      // Severity distribution
      severityDistribution: calculateSeverityDistribution(grammarErrors || []),
      
      // Source type distribution
      sourceTypeDistribution: calculateSourceTypeDistribution(grammarErrors || []),
      
      // Top error types
      topErrorTypes: getTopErrorTypes(grammarErrors || [], 5),
      
      // Weekly trend (last 4 weeks)
      weeklyTrend: calculateWeeklyTrend(grammarErrors || []),
      
      // Most problematic areas
      problematicAreas: getMostProblematicAreas(grammarErrors || []),
      
      // German-specific analytics
      germanGrammarInsights: getGermanGrammarInsights(grammarErrors || [])
    };

    // ===== STUDENT CARDS DATA =====
    const studentCards = userIds.map(userId => {
      const userErrors = grammarErrors?.filter(e => e.user_id === userId) || [];
      const userRecentErrors = userErrors.filter(e => new Date(e.created_at) >= lastWeek);
      const userMonthlyErrors = userErrors.filter(e => new Date(e.created_at) >= lastMonth);
      
      // Calculate error trends (compare last 2 weeks vs previous 2 weeks)
      const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
      const fourWeeksAgo = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000);
      
      const lastTwoWeeksErrors = userErrors.filter(e => {
        const date = new Date(e.created_at);
        return date >= twoWeeksAgo && date < now;
      });
      
      const previousTwoWeeksErrors = userErrors.filter(e => {
        const date = new Date(e.created_at);
        return date >= fourWeeksAgo && date < twoWeeksAgo;
      });
      
      let trend: 'improving' | 'declining' | 'stable' = 'stable';
      const currentErrorRate = lastTwoWeeksErrors.length;
      const previousErrorRate = previousTwoWeeksErrors.length;
      
      if (currentErrorRate < previousErrorRate - 1) trend = 'improving';
      else if (currentErrorRate > previousErrorRate + 1) trend = 'declining';
      
      // Most common error types for this user
      const userErrorTypes = calculateErrorTypeDistribution(userErrors);
      const topUserErrorTypes = Object.entries(userErrorTypes)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([type, count]) => ({ type, count }));
      
      // Severity breakdown
      const userSeverityDist = calculateSeverityDistribution(userErrors);
      
      // German grammar category analysis for this user
      const userGrammarCategories = calculateGrammarCategoryDistribution(userErrors);
      const userGrammarInsights = getGermanGrammarInsights(userErrors);
      
      // Recent errors for detail view
      const recentErrorsDetail = userErrors.slice(0, 10).map(error => ({
        id: error.id,
        error_text: error.error_text,
        correction: error.correction,
        explanation: error.explanation,
        error_type: error.error_type,
        severity: error.severity,
        source_type: error.source_type,
        context: error.context,
        created_at: error.created_at,
        task_id: error.task_id
      }));

      return {
        userId,
        name: userDetailsMap[userId]?.fullName || `Student ${userId.slice(5, 9)}`,
        email: userDetailsMap[userId]?.email,
        firstName: userDetailsMap[userId]?.firstName,
        lastName: userDetailsMap[userId]?.lastName,
        totalErrors: userErrors.length,
        recentErrors: userRecentErrors.length,
        monthlyErrors: userMonthlyErrors.length,
        trend,
        topErrorTypes: topUserErrorTypes,
        severityDistribution: userSeverityDist,
        errorTypeDistribution: userErrorTypes,
        averageErrorsPerWeek: userErrors.length > 0 ? Math.round((userErrors.length / Math.max(1, Math.ceil((now.getTime() - new Date(userErrors[userErrors.length - 1].created_at).getTime()) / (7 * 24 * 60 * 60 * 1000)))) * 10) / 10 : 0,
        mostRecentError: userErrors[0]?.created_at || null,
        recentErrorsDetail,
        improvementScore: calculateImprovementScore(userErrors),
        grammarCategoryDistribution: userGrammarCategories,
        grammarInsights: userGrammarInsights
      };
    });

    // Filter out users with no errors
    const activeStudentCards = studentCards.filter(student => student.totalErrors > 0);

    return NextResponse.json({
      generalTrends,
      studentCards: activeStudentCards,
      summary: {
        totalStudentsWithErrors: activeStudentCards.length,
        totalErrors: grammarErrors?.length || 0,
        averageErrorsPerStudent: activeStudentCards.length > 0 
          ? Math.round((grammarErrors?.length || 0) / activeStudentCards.length * 10) / 10 
          : 0
      }
    });

  } catch (error) {
    console.error('Error in grammar-errors API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch grammar errors data' },
      { status: 500 }
    );
  }
}

// Helper functions
function calculateErrorTypeDistribution(errors: any[]) {
  const distribution: Record<string, number> = {};
  errors.forEach(error => {
    const type = error.error_type || error.grammar_category || 'UNKNOWN';
    distribution[type] = (distribution[type] || 0) + 1;
  });
  return distribution;
}

function calculateSeverityDistribution(errors: any[]) {
  const distribution = { LOW: 0, MEDIUM: 0, HIGH: 0, UNKNOWN: 0 };
  errors.forEach(error => {
    const severity = error.severity || 'UNKNOWN';
    distribution[severity as keyof typeof distribution] = (distribution[severity as keyof typeof distribution] || 0) + 1;
  });
  return distribution;
}

function calculateSourceTypeDistribution(errors: any[]) {
  const distribution: Record<string, number> = {};
  errors.forEach(error => {
    const source = error.source_type || 'UNKNOWN';
    distribution[source] = (distribution[source] || 0) + 1;
  });
  return distribution;
}

function getTopErrorTypes(errors: any[], limit: number = 5) {
  const distribution = calculateErrorTypeDistribution(errors);
  return Object.entries(distribution)
    .sort(([,a], [,b]) => b - a)
    .slice(0, limit)
    .map(([type, count]) => ({ type, count, percentage: Math.round((count / errors.length) * 100) }));
}

function calculateWeeklyTrend(errors: any[]) {
  const weeks = [];
  const now = new Date();
  
  for (let i = 0; i < 4; i++) {
    const weekStart = new Date(now.getTime() - (i + 1) * 7 * 24 * 60 * 60 * 1000);
    const weekEnd = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
    
    const weekErrors = errors.filter(error => {
      const errorDate = new Date(error.created_at);
      return errorDate >= weekStart && errorDate < weekEnd;
    });
    
    weeks.unshift({
      week: `Week ${4 - i}`,
      errors: weekErrors.length,
      startDate: weekStart.toISOString().split('T')[0]
    });
  }
  
  return weeks;
}

function getMostProblematicAreas(errors: any[]) {
  const severityWeights = { HIGH: 3, MEDIUM: 2, LOW: 1 };
  const areaScores: Record<string, { score: number, count: number }> = {};
  
  errors.forEach(error => {
    const type = error.error_type || error.grammar_category || 'UNKNOWN';
    const weight = severityWeights[error.severity as keyof typeof severityWeights] || 1;
    
    if (!areaScores[type]) {
      areaScores[type] = { score: 0, count: 0 };
    }
    
    areaScores[type].score += weight;
    areaScores[type].count += 1;
  });
  
  return Object.entries(areaScores)
    .map(([type, data]) => ({
      type,
      score: data.score,
      count: data.count,
      averageImpact: Math.round((data.score / data.count) * 100) / 100
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
}

function calculateImprovementScore(errors: any[]) {
  if (errors.length < 4) return 0;
  
  const now = new Date();
  const midpoint = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  
  const recentErrors = errors.filter(e => new Date(e.created_at) >= midpoint);
  const olderErrors = errors.filter(e => new Date(e.created_at) < midpoint);
  
  if (olderErrors.length === 0) return 0;
  
  const recentRate = recentErrors.length / 14; // errors per day
  const olderRate = olderErrors.length / Math.max(1, (midpoint.getTime() - new Date(errors[errors.length - 1].created_at).getTime()) / (24 * 60 * 60 * 1000));
  
  const improvement = ((olderRate - recentRate) / olderRate) * 100;
  return Math.round(Math.max(-100, Math.min(100, improvement)));
}

// German Grammar Category Mapping
const GERMAN_GRAMMAR_CATEGORIES = {
  'Case System': ['ARTICLES', 'NOUN_CASES', 'PRONOUN_CASES', 'ADJECTIVE_ENDINGS', 'GENDER_AGREEMENT'],
  'Verb System': ['VERB_CONJUGATION', 'VERB_POSITION', 'SEPARABLE_VERBS', 'MODAL_VERBS'],
  'Word Formation': ['SPELLING', 'CAPITALIZATION', 'PLURAL_FORMS'],
  'Sentence Structure': ['WORD_ORDER', 'SENTENCE_STRUCTURE', 'PREPOSITIONS', 'PUNCTUATION']
};

function getGrammarCategoryForErrorType(errorType: string): string {
  for (const [category, types] of Object.entries(GERMAN_GRAMMAR_CATEGORIES)) {
    if (types.includes(errorType)) {
      return category;
    }
  }
  return 'Other';
}

function calculateGrammarCategoryDistribution(errors: any[]) {
  const distribution: Record<string, number> = {
    'Case System': 0,
    'Verb System': 0,
    'Word Formation': 0,
    'Sentence Structure': 0,
    'Other': 0
  };

  errors.forEach(error => {
    const errorType = error.error_type || error.grammar_category || 'UNKNOWN';
    const category = getGrammarCategoryForErrorType(errorType);
    distribution[category] = (distribution[category] || 0) + 1;
  });

  return distribution;
}

function getGermanGrammarInsights(errors: any[]) {
  const categoryDist = calculateGrammarCategoryDistribution(errors);
  const totalErrors = errors.length;
  
  // Calculate difficulty levels based on German learning research
  const difficultyWeights = {
    'Case System': 4,      // Most difficult for learners
    'Verb System': 3,      // Moderately difficult
    'Sentence Structure': 2, // Challenging but learnable
    'Word Formation': 1    // Easiest to fix
  };
  
  const insights = {
    mostChallengingArea: '',
    difficultyScore: 0,
    caseSystemPercentage: totalErrors > 0 ? Math.round((categoryDist['Case System'] / totalErrors) * 100) : 0,
    verbSystemPercentage: totalErrors > 0 ? Math.round((categoryDist['Verb System'] / totalErrors) * 100) : 0,
    recommendations: [] as string[],
    learningPath: [] as string[]
  };
  
  // Find most challenging area
  let maxWeightedScore = 0;
  Object.entries(categoryDist).forEach(([category, count]) => {
    if (category in difficultyWeights) {
      const weightedScore = count * difficultyWeights[category as keyof typeof difficultyWeights];
      if (weightedScore > maxWeightedScore) {
        maxWeightedScore = weightedScore;
        insights.mostChallengingArea = category;
        insights.difficultyScore = Math.round((weightedScore / totalErrors) * 10);
      }
    }
  });
  
  // Generate recommendations
  if (categoryDist['Case System'] > totalErrors * 0.3) {
    insights.recommendations.push("Focus on German case system (der/die/das, accusative/dative)");
    insights.learningPath.push("Practice article declensions with common prepositions");
  }
  
  if (categoryDist['Verb System'] > totalErrors * 0.25) {
    insights.recommendations.push("Work on verb conjugations and modal verbs");
    insights.learningPath.push("Review present tense conjugations and separable verbs");
  }
  
  if (categoryDist['Word Formation'] > totalErrors * 0.4) {
    insights.recommendations.push("Focus on spelling and capitalization rules");
    insights.learningPath.push("Practice German capitalization rules for nouns");
  }
  
  if (categoryDist['Sentence Structure'] > totalErrors * 0.3) {
    insights.recommendations.push("Study German word order patterns");
    insights.learningPath.push("Practice main clause vs. subordinate clause word order");
  }
  
  return insights;
}
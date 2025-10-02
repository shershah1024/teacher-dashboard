'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import Link from 'next/link';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import {
  Headphones,
  Mic,
  MessageSquare,
  Users,
  UserPlus,
  ChevronRight,
  BookOpen,
  Volume2,
  FileText,
  BarChart3,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Target,
  Activity,
  Bell,
  Settings,
  School,
  Zap,
  Search,
  RefreshCw,
  Flame,
  AlertCircle,
  Filter,
  X,
  Award,
  Brain,
  Clock,
  Sparkles,
  Eye,
  Star
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Mic as MicIcon } from 'lucide-react';
import { MetricCard } from '@/components/MetricCard';
import {
  MetricCardSkeleton,
  TargetCardSkeleton,
  InsightsBannerSkeleton,
  StudentCardSkeleton,
  FilterPillsSkeleton
} from '@/components/LoadingSkeleton';

interface SkillMetrics {
  speaking: { score: number; trend: 'up' | 'down' | 'stable'; sessions: number };
  listening: { score: number; trend: 'up' | 'down' | 'stable'; sessions: number };
  reading: { score: number; trend: 'up' | 'down' | 'stable'; sessions: number };
  writing: { score: number; trend: 'up' | 'down' | 'stable'; sessions: number };
  grammar: { errorRate: number; trend: 'improving' | 'declining' | 'stable'; totalErrors: number };
  pronunciation: { accuracy: number; trend: 'up' | 'down' | 'stable'; sessions: number };
  vocabulary: { wordsLearned: number; weeklyNew: number; retentionRate: number };
}

interface TargetMetrics {
  weeklyLessons: number;
  weeklyMinutes: number;
  monthlyProgress: number; // percentage
  currentWeekLessons: number;
  currentWeekMinutes: number;
  currentMonthProgress: number;
  weeklyTargetMet: boolean;
  monthlyOnTrack: boolean;
}

interface StudentProgressCard {
  userId: string;
  name: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  organization: string;

  overallProgress: number;
  currentLesson: string;
  currentModule: string;
  lessonsCompleted: number;
  totalLessons: number;
  expectedCompletion: string | null;
  learningVelocity: number;

  targets?: TargetMetrics;
  
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string;
  weeklyActivityMap: { [key: string]: number };
  averageDailyMinutes: number;
  totalStudyHours: number;
  mostActiveTime: string;
  activityTrend: 'increasing' | 'decreasing' | 'stable';
  
  averageScore: number;
  strongestSkill: string;
  weakestSkill: string;
  needsAttention: boolean;
  performanceTrend: 'improving' | 'declining' | 'stable';
  recentScores: { date: string; score: number; type: string }[];
  
  skills: SkillMetrics;
  
  learningPace: 'ahead' | 'on-track' | 'behind';
  predictedCompletionWeeks: number | null;
  recommendedFocus: string[];
  achievements: { name: string; date: string; icon: string }[];
  
  recentActivities: {
    type: string;
    title: string;
    score?: number;
    timestamp: string;
  }[];
  
  engagementScore: number;
  
  atRiskOfDropout: boolean;
  inactivityDays: number;
  strugglingAreas: string[];
}

interface QuickAction {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  color: string;
  bgColor: string;
  count?: number;
}

const quickActions: QuickAction[] = [
  {
    title: 'Task Completions',
    description: 'Progress tracking',
    icon: CheckCircle2,
    href: '/teacher-dashboard/task-completions',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    count: 358
  },
  {
    title: 'Grammar',
    description: 'Exercise performance',
    icon: BookOpen,
    href: '/teacher-dashboard/grammar',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    count: 24
  },
  {
    title: 'Speaking',
    description: 'Oral practice',
    icon: Mic,
    href: '/teacher-dashboard/speaking',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    count: 152
  },
  {
    title: 'Listening',
    description: 'Comprehension',
    icon: Headphones,
    href: '/teacher-dashboard/listening',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    count: 18
  },
  {
    title: 'Reading',
    description: 'Text analysis',
    icon: FileText,
    href: '/teacher-dashboard/reading',
    color: 'text-teal-600',
    bgColor: 'bg-teal-50',
    count: 12
  },
  {
    title: 'Pronunciation',
    description: 'Accuracy metrics',
    icon: Volume2,
    href: '/teacher-dashboard/pronunciation',
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    count: 89
  },
  {
    title: 'Discourse',
    description: 'Conversations',
    icon: BarChart3,
    href: '/teacher-dashboard/discourse-analysis',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
    count: 45
  },
  {
    title: 'AI Chatbot',
    description: 'AI interactions',
    icon: MessageSquare,
    href: '/teacher-dashboard/chatbot-scores',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    count: 67
  },
  {
    title: 'Grammar Errors',
    description: 'Error analysis',
    icon: AlertTriangle,
    href: '/teacher-dashboard/grammar-errors',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    count: 146
  }
];

export default function Home() {
  const { user } = useUser();
  const router = useRouter();
  const [currentTime, setCurrentTime] = useState('');
  const [students, setStudents] = useState<StudentProgressCard[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<StudentProgressCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'engagement' | 'progress' | 'activity' | 'name'>('engagement');
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [summary, setSummary] = useState({
    totalStudents: 0,
    activeStudents: 0,
    atRiskStudents: 0,
    averageProgress: 0,
    averageEngagement: 0,
    studentsOnTrack: 0,
    studentsAheadOfTarget: 0,
    studentsBehindTarget: 0
  });

  // Default targets - can be customized per student later
  const defaultTargets: TargetMetrics = {
    weeklyLessons: 3,
    weeklyMinutes: 180, // 3 hours per week
    monthlyProgress: 15, // 15% progress per month
    currentWeekLessons: 0,
    currentWeekMinutes: 0,
    currentMonthProgress: 0,
    weeklyTargetMet: false,
    monthlyOnTrack: false
  };

  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(new Date().toLocaleString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }));
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchStudentProgress();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [students, searchQuery, sortBy, activeFilters]);

  const fetchStudentProgress = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/teacher-dashboard/student-progress-overview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationCode: 'ANB' })
      });

      const data = await response.json();

      // Add mock targets to students for now - will be replaced with real data
      const studentsWithTargets = (data.students || []).map((student: StudentProgressCard) => {
        // Calculate current week/month metrics based on student data
        const currentWeekLessons = Math.min(student.lessonsCompleted % 7, defaultTargets.weeklyLessons);
        const currentWeekMinutes = student.averageDailyMinutes * 7;
        const currentMonthProgress = student.learningVelocity * 4; // 4 weeks estimate

        return {
          ...student,
          targets: {
            ...defaultTargets,
            currentWeekLessons,
            currentWeekMinutes,
            currentMonthProgress,
            weeklyTargetMet: currentWeekLessons >= defaultTargets.weeklyLessons && currentWeekMinutes >= defaultTargets.weeklyMinutes,
            monthlyOnTrack: currentMonthProgress >= defaultTargets.monthlyProgress
          }
        };
      });

      // Calculate target-based summary metrics
      const studentsOnTrack = studentsWithTargets.filter((s: StudentProgressCard) => s.targets?.weeklyTargetMet && s.targets?.monthlyOnTrack).length;
      const studentsAheadOfTarget = studentsWithTargets.filter((s: StudentProgressCard) =>
        s.targets && s.targets.currentMonthProgress > s.targets.monthlyProgress * 1.2
      ).length;
      const studentsBehindTarget = studentsWithTargets.filter((s: StudentProgressCard) =>
        s.targets && !s.targets.monthlyOnTrack
      ).length;

      setStudents(studentsWithTargets);
      setSummary({
        ...(data.summary || {}),
        totalStudents: studentsWithTargets.length,
        studentsOnTrack,
        studentsAheadOfTarget,
        studentsBehindTarget
      });
    } catch (error) {
      console.error('Error fetching student progress:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...students];
    
    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(student => 
        student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.userId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (student.email && student.email.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    
    // Quick filters
    if (activeFilters.length > 0) {
      filtered = filtered.filter(student => {
        return activeFilters.every(filter => {
          switch (filter) {
            case 'high-achievers':
              return student.averageScore >= 80;
            case 'struggling':
              return student.averageScore < 60;
            case 'at-risk':
              return student.atRiskOfDropout;
            case 'improving':
              return student.performanceTrend === 'improving';
            case 'declining':
              return student.performanceTrend === 'declining';
            case 'highly-engaged':
              return student.engagementScore >= 80;
            case 'low-engagement':
              return student.engagementScore < 50;
            case 'active-streaks':
              return student.currentStreak > 0;
            case 'long-streaks':
              return student.currentStreak >= 7;
            case 'inactive-week':
              return student.inactivityDays >= 7;
            case 'ahead':
              return student.learningPace === 'ahead';
            case 'on-track':
              return student.learningPace === 'on-track';
            case 'behind':
              return student.learningPace === 'behind';
            case 'strong-speaking':
              return student.skills.speaking.score >= 80;
            case 'need-speaking':
              return student.skills.speaking.score < 60;
            case 'strong-listening':
              return student.skills.listening.score >= 80;
            case 'need-listening':
              return student.skills.listening.score < 60;
            case 'grammar-issues':
              return student.skills.grammar.errorRate > 30;
            case 'vocabulary-builders':
              return student.skills.vocabulary.weeklyNew >= 10;
            case 'active-today':
              return student.inactivityDays === 0;
            case 'needs-attention':
              return student.needsAttention;
            default:
              return true;
          }
        });
      });
    }
    
    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'engagement':
          return b.engagementScore - a.engagementScore;
        case 'progress':
          return b.overallProgress - a.overallProgress;
        case 'activity':
          return new Date(b.lastActiveDate).getTime() - new Date(a.lastActiveDate).getTime();
        case 'name':
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });
    
    setFilteredStudents(filtered);
  };

  const getTimeBasedGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const getEngagementColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 75) return 'text-green-600';
    if (progress >= 50) return 'text-blue-600';
    if (progress >= 25) return 'text-orange-600';
    return 'text-red-600';
  };

  const getPaceIcon = (pace: string) => {
    switch (pace) {
      case 'ahead': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'on-track': return <Activity className="h-4 w-4 text-blue-500" />;
      case 'behind': return <TrendingDown className="h-4 w-4 text-red-500" />;
    }
  };

  const toggleQuickFilter = (filter: string) => {
    setActiveFilters(prev => 
      prev.includes(filter) 
        ? prev.filter(f => f !== filter)
        : [...prev, filter]
    );
  };

  const clearAllFilters = () => {
    setActiveFilters([]);
    setSearchQuery('');
  };

  const getFilterCount = (filter: string): number => {
    return students.filter(student => {
      switch (filter) {
        case 'high-achievers': return student.averageScore >= 80;
        case 'struggling': return student.averageScore < 60;
        case 'at-risk': return student.atRiskOfDropout;
        case 'improving': return student.performanceTrend === 'improving';
        case 'declining': return student.performanceTrend === 'declining';
        case 'highly-engaged': return student.engagementScore >= 80;
        case 'low-engagement': return student.engagementScore < 50;
        case 'active-streaks': return student.currentStreak > 0;
        case 'long-streaks': return student.currentStreak >= 7;
        case 'inactive-week': return student.inactivityDays >= 7;
        case 'ahead': return student.learningPace === 'ahead';
        case 'on-track': return student.learningPace === 'on-track';
        case 'behind': return student.learningPace === 'behind';
        case 'strong-speaking': return student.skills.speaking.score >= 80;
        case 'need-speaking': return student.skills.speaking.score < 60;
        case 'strong-listening': return student.skills.listening.score >= 80;
        case 'need-listening': return student.skills.listening.score < 60;
        case 'grammar-issues': return student.skills.grammar.errorRate > 30;
        case 'vocabulary-builders': return student.skills.vocabulary.weeklyNew >= 10;
        case 'active-today': return student.inactivityDays === 0;
        case 'needs-attention': return student.needsAttention;
        default: return false;
      }
    }).length;
  };

  // Colorful filters without categories
  const quickFiltersList = [
    { key: 'high-achievers', label: 'High Achievers', icon: Award, bgColor: 'bg-emerald-50', borderColor: 'border-emerald-300', textColor: 'text-emerald-700', activeBg: 'bg-emerald-500' },
    { key: 'struggling', label: 'Struggling', icon: AlertTriangle, bgColor: 'bg-rose-50', borderColor: 'border-rose-300', textColor: 'text-rose-700', activeBg: 'bg-rose-500' },
    { key: 'improving', label: 'Improving', icon: TrendingUp, bgColor: 'bg-green-50', borderColor: 'border-green-300', textColor: 'text-green-700', activeBg: 'bg-green-500' },
    { key: 'declining', label: 'Declining', icon: TrendingDown, bgColor: 'bg-orange-50', borderColor: 'border-orange-300', textColor: 'text-orange-700', activeBg: 'bg-orange-500' },
    { key: 'highly-engaged', label: 'Highly Engaged', icon: Sparkles, bgColor: 'bg-purple-50', borderColor: 'border-purple-300', textColor: 'text-purple-700', activeBg: 'bg-purple-500' },
    { key: 'low-engagement', label: 'Low Engagement', icon: Eye, bgColor: 'bg-gray-50', borderColor: 'border-gray-300', textColor: 'text-gray-700', activeBg: 'bg-gray-500' },
    { key: 'active-streaks', label: 'Current Streaks', icon: Flame, bgColor: 'bg-amber-50', borderColor: 'border-amber-300', textColor: 'text-amber-700', activeBg: 'bg-amber-500' },
    { key: 'long-streaks', label: 'Long Streaks (7d+)', icon: Flame, bgColor: 'bg-red-50', borderColor: 'border-red-300', textColor: 'text-red-700', activeBg: 'bg-red-500' },
    { key: 'ahead', label: 'Ahead of Schedule', icon: TrendingUp, bgColor: 'bg-teal-50', borderColor: 'border-teal-300', textColor: 'text-teal-700', activeBg: 'bg-teal-500' },
    { key: 'on-track', label: 'On Track', icon: Activity, bgColor: 'bg-blue-50', borderColor: 'border-blue-300', textColor: 'text-blue-700', activeBg: 'bg-blue-500' },
    { key: 'behind', label: 'Behind Schedule', icon: TrendingDown, bgColor: 'bg-pink-50', borderColor: 'border-pink-300', textColor: 'text-pink-700', activeBg: 'bg-pink-500' },
    { key: 'strong-speaking', label: 'Strong Speaking', icon: MicIcon, bgColor: 'bg-indigo-50', borderColor: 'border-indigo-300', textColor: 'text-indigo-700', activeBg: 'bg-indigo-500' },
    { key: 'need-speaking', label: 'Need Speaking Help', icon: MicIcon, bgColor: 'bg-yellow-50', borderColor: 'border-yellow-300', textColor: 'text-yellow-700', activeBg: 'bg-yellow-500' },
    { key: 'grammar-issues', label: 'Grammar Issues', icon: BookOpen, bgColor: 'bg-amber-50', borderColor: 'border-amber-300', textColor: 'text-amber-700', activeBg: 'bg-amber-500' },
    { key: 'active-today', label: 'Active Today', icon: Clock, bgColor: 'bg-lime-50', borderColor: 'border-lime-300', textColor: 'text-lime-700', activeBg: 'bg-lime-600' },
    { key: 'needs-attention', label: 'Needs Attention', icon: AlertCircle, bgColor: 'bg-red-50', borderColor: 'border-red-300', textColor: 'text-red-700', activeBg: 'bg-red-500' },
  ];


  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Navigation Bar - Clean Design */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-8 py-6 max-w-7xl">
          <div className="flex items-center justify-between">
            {/* Logo and Brand */}
            <div className="flex items-center gap-4">
              <div className="p-2 bg-blue-600 rounded-lg shadow-md">
                <School className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">telc A1 German</h1>
                <p className="text-sm text-gray-600">Teacher Dashboard</p>
              </div>
            </div>

            {/* Navigation Links */}
            <div className="hidden lg:flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                onClick={() => router.push('/')}
              >
                <Users className="h-4 w-4 mr-2" />
                Overview
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                onClick={() => router.push('/teacher-dashboard/student-progress')}
              >
                <Activity className="h-4 w-4 mr-2" />
                All Students
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                onClick={() => router.push('/teacher-dashboard/manage-students')}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Manage
              </Button>

              <div className="ml-3 h-6 w-px bg-gray-300" />

              <Button
                variant="ghost"
                size="sm"
                className="text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                onClick={fetchStudentProgress}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>

            {/* User Info */}
            <div className="flex items-center gap-3">
              <div className="text-right hidden md:block">
                <p className="text-sm font-medium text-gray-900">{user?.firstName || 'Teacher'}</p>
                <p className="text-xs text-gray-500">{currentTime}</p>
              </div>
              <Avatar className="h-9 w-9 border border-gray-200">
                <AvatarFallback className="bg-gray-100 text-gray-700 text-sm font-medium">
                  {user?.firstName?.[0] || 'T'}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </div>
      </nav>

      {/* Enhanced Header with Time-based Greeting */}
      <div className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-8 py-6 max-w-7xl">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-1">
              {getTimeBasedGreeting()}, {user?.firstName || 'Teacher'}
            </h1>
            <p className="text-gray-600">
              A&B Recruiting Teacher Portal • {currentTime}
            </p>
          </div>

          {/* Key Metrics with Contextual Comparison - F-Pattern Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {loading ? (
              <>
                <MetricCardSkeleton variant="accent" />
                <MetricCardSkeleton variant="minimal" />
                <MetricCardSkeleton variant="minimal" />
                <MetricCardSkeleton variant="accent" />
              </>
            ) : (
              <>
                {/* Primary Metric - Active Students */}
                <div className="bg-blue-600 rounded-xl p-5 text-white shadow-md hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="text-sm font-medium text-blue-50 mb-1">Active Students (7d)</div>
                      <div className="text-4xl font-bold">{summary.activeStudents}</div>
                    </div>
                    <Activity className="h-8 w-8 text-blue-100" />
                  </div>
                  <div className="mt-3 text-xs text-blue-50">
                    {Math.round((summary.activeStudents / summary.totalStudents) * 100)}% engagement rate
                  </div>
                </div>

                {/* Alert Metric - Needs Attention */}
                <div className="bg-white rounded-xl p-5 border-2 border-amber-200 shadow-md hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="text-sm font-medium text-amber-700 mb-1">Needs Attention</div>
                      <div className="text-4xl font-bold text-amber-600">{summary.atRiskStudents}</div>
                    </div>
                    <div className="p-2 bg-amber-100 rounded-lg">
                      <AlertTriangle className="h-6 w-6 text-amber-600" />
                    </div>
                  </div>
                  <div className="text-sm text-amber-700">Students requiring support</div>
                </div>

                {/* Performance Metric */}
                <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-md hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="text-sm font-medium text-gray-600 mb-1">Average Progress</div>
                      <div className="text-4xl font-bold text-gray-900">{summary.averageProgress}%</div>
                    </div>
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Target className="h-6 w-6 text-purple-600" />
                    </div>
                  </div>
                  <Progress value={summary.averageProgress} className="h-2 mb-2" />
                  <div className="text-sm text-gray-600">{summary.totalStudents} total students</div>
                </div>

                {/* Success Metric */}
                <div className="bg-emerald-600 rounded-xl p-5 text-white shadow-md hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="text-sm font-medium text-emerald-50 mb-1">High Achievers</div>
                      <div className="text-4xl font-bold">{students.filter(s => s.averageScore >= 80).length}</div>
                    </div>
                    <Award className="h-8 w-8 text-emerald-100" />
                  </div>
                  <div className="text-sm text-emerald-50">Students above 80% score</div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="container mx-auto px-6 py-6 max-w-7xl space-y-6">

        {/* Main Dashboard Grid - Activity & Performance */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left Column: Insights & Students */}
          <div className="lg:col-span-2 space-y-6">

            {/* Actionable Insights Banner */}
            {loading ? (
              <InsightsBannerSkeleton />
            ) : (
              <div className="bg-indigo-600 rounded-xl p-6 text-white shadow-md">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="h-5 w-5" />
                      <h3 className="text-lg font-semibold">Today's Key Insights</h3>
                    </div>
                    <p className="text-indigo-50 mb-4">
                      📈 {summary.activeStudents} students active in the last 7 days ({Math.round((summary.activeStudents / summary.totalStudents) * 100)}% engagement).
                      {summary.atRiskStudents > 0 ? ` ⚠️ ${summary.atRiskStudents} students need immediate attention.` : ' All students on track!'}
                      {students.filter(s => s.averageScore >= 80).length > 0 && ` 🌟 ${students.filter(s => s.averageScore >= 80).length} high achievers excelling.`}
                    </p>
                    <div className="flex gap-3">
                      <Link href="/teacher-dashboard/student-progress">
                        <Button size="sm" variant="secondary" className="bg-indigo-500 hover:bg-indigo-400 text-white border-0">
                          View Details →
                        </Button>
                      </Link>
                    </div>
                  </div>
                  <div className="hidden md:flex items-center gap-4">
                    <div className="text-center px-4 border-l border-indigo-400">
                      <div className="text-3xl font-bold">{summary.averageProgress}%</div>
                      <div className="text-sm text-indigo-100">Avg Progress</div>
                    </div>
                    <div className="text-center px-4 border-l border-indigo-400">
                      <div className="text-3xl font-bold">{summary.averageEngagement}%</div>
                      <div className="text-sm text-indigo-100">Engagement</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Analytics - Bento Grid Card */}
            <Card className="border-gray-200 bg-white shadow-md">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                  <CardTitle className="text-gray-900">Quick Analytics</CardTitle>
                </div>
                <CardDescription>Detailed skill breakdowns and performance tracking</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {quickActions.map((action) => {
                    const IconComponent = action.icon;
                    return (
                      <Link key={action.href} href={action.href}>
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-blue-50 hover:border-blue-200 border border-gray-100 transition-all cursor-pointer group">
                          <div className={cn("p-2 rounded-md", action.bgColor)}>
                            <IconComponent className={cn("h-5 w-5", action.color)} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900">{action.title}</p>
                            <p className="text-xs text-gray-500">{action.description}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-xs font-bold">
                              {action.count}
                            </Badge>
                            <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
                <Link href="/teacher-dashboard">
                  <Button variant="outline" className="w-full mt-4 border-gray-300 hover:bg-gray-50">
                    View Full Dashboard →
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Performance & Alerts */}
          <div className="space-y-6">

            {/* Top Performers */}
            {loading ? (
              <Card className="border-emerald-200 bg-emerald-50 animate-pulse">
                <CardContent className="p-6 space-y-4">
                  <div className="h-6 w-32 bg-emerald-200 rounded" />
                  <div className="h-4 w-24 bg-emerald-100 rounded" />
                  {[1,2,3].map(i => <div key={i} className="h-16 bg-emerald-100 rounded" />)}
                </CardContent>
              </Card>
            ) : (
              <Card className="border-emerald-200 bg-emerald-50">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-emerald-600" />
                    <CardTitle className="text-emerald-900">Top Performers</CardTitle>
                  </div>
                  <CardDescription>Leading students this week</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {students
                    .filter(s => s.averageScore >= 70)
                    .sort((a, b) => b.averageScore - a.averageScore)
                    .slice(0, 3)
                    .map((student, index) => (
                      <Link key={student.userId} href={`/teacher-dashboard/student/${student.userId}`}>
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-white border border-emerald-100 hover:shadow-md transition-shadow cursor-pointer">
                          <div className="flex items-center gap-3 flex-1">
                            <div className="relative">
                              <Avatar className="h-10 w-10 border-2 border-emerald-200">
                                <AvatarFallback className="bg-emerald-500 text-white font-semibold">
                                  {student.name.substring(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              {index === 0 && <Star className="h-4 w-4 text-yellow-500 fill-current absolute -top-1 -right-1" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-gray-900 truncate">{student.name}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <Progress value={student.averageScore} className="h-1.5 flex-1" />
                                <span className="text-xs font-medium text-emerald-600">{student.averageScore}%</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center gap-1 text-orange-600">
                              <Flame className="h-3 w-3 fill-current" />
                              <span className="text-xs font-bold">{student.currentStreak}</span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  {students.filter(s => s.averageScore >= 70).length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-4">No high performers yet</p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* At-Risk Students Alert */}
            {loading ? (
              <Card className="border-red-200 bg-red-50 animate-pulse">
                <CardContent className="p-6 space-y-4">
                  <div className="h-6 w-32 bg-red-200 rounded" />
                  <div className="h-4 w-24 bg-red-100 rounded" />
                  {[1,2,3].map(i => <div key={i} className="h-16 bg-red-100 rounded" />)}
                </CardContent>
              </Card>
            ) : (
              <Card className="border-red-200 bg-red-50">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                    <CardTitle className="text-red-900">Needs Attention</CardTitle>
                  </div>
                  <CardDescription>Students requiring support</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {students
                    .filter(s => s.atRiskOfDropout || s.averageScore < 50)
                    .sort((a, b) => a.averageScore - b.averageScore)
                    .slice(0, 3)
                    .map((student) => (
                      <Link key={student.userId} href={`/teacher-dashboard/student/${student.userId}`}>
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-white border border-red-100 hover:shadow-md transition-shadow cursor-pointer">
                          <div className="flex items-center gap-3 flex-1">
                            <Avatar className="h-10 w-10 border-2 border-red-200">
                              <AvatarFallback className="bg-red-100 text-red-600 font-semibold">
                                {student.name.substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-gray-900 truncate">{student.name}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <Progress value={student.averageScore} className="h-1.5 flex-1" />
                                <span className="text-xs font-medium text-red-600">{student.averageScore}%</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge variant="outline" className="text-xs border-red-200 text-red-700">
                              {student.inactivityDays}d ago
                            </Badge>
                          </div>
                        </div>
                      </Link>
                    ))}
                  {students.filter(s => s.atRiskOfDropout || s.averageScore < 50).length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-4">All students doing well!</p>
                  )}
                  <Link href="/teacher-dashboard/student-progress">
                    <Button variant="outline" className="w-full mt-2 border-red-300 text-red-700 hover:bg-red-50">
                      Review All →
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Student Progress Cards Section */}
        <div className="space-y-6">
          {/* Results Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h2 className="text-2xl font-semibold text-gray-900">
                {filteredStudents.length} {filteredStudents.length === 1 ? 'Student' : 'Students'}
              </h2>

              {/* Clean Sort Tabs */}
              <div className="flex items-center gap-1 border border-gray-200 rounded-lg p-1 bg-white">
                <button
                  onClick={() => setSortBy('engagement')}
                  className={cn(
                    "px-3 py-1 text-sm font-medium rounded transition-all",
                    sortBy === 'engagement'
                      ? "bg-blue-600 text-white"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  )}
                >
                  Engagement
                </button>
                <button
                  onClick={() => setSortBy('progress')}
                  className={cn(
                    "px-3 py-1 text-sm font-medium rounded transition-all",
                    sortBy === 'progress'
                      ? "bg-blue-600 text-white"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  )}
                >
                  Progress
                </button>
                <button
                  onClick={() => setSortBy('activity')}
                  className={cn(
                    "px-3 py-1 text-sm font-medium rounded transition-all",
                    sortBy === 'activity'
                      ? "bg-blue-600 text-white"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  )}
                >
                  Activity
                </button>
                <button
                  onClick={() => setSortBy('name')}
                  className={cn(
                    "px-3 py-1 text-sm font-medium rounded transition-all",
                    sortBy === 'name'
                      ? "bg-blue-600 text-white"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  )}
                >
                  Name
                </button>
              </div>
            </div>

            <Button
              variant="outline"
              size="default"
              onClick={() => router.push('/teacher-dashboard/student-progress')}
              className="gap-2 border-gray-300 hover:bg-gray-50 text-gray-700"
            >
              View All
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Student Cards Grid - 2025 Modern Design */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="bg-white rounded-2xl p-6 border border-gray-100 animate-pulse">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="h-14 w-14 rounded-full bg-gray-100" />
                    <div className="flex-1">
                      <div className="h-5 w-28 bg-gray-100 rounded mb-2" />
                      <div className="h-3 w-20 bg-gray-50 rounded" />
                    </div>
                  </div>
                  <div className="space-y-4">
                    {[1,2,3,4,5,6].map(i => <div key={i} className="h-3 bg-gray-50 rounded" />)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filteredStudents.slice(0, 12).map((student) => (
                <div
                  key={student.userId}
                  className="group cursor-pointer bg-white rounded-2xl p-6 border border-gray-100 hover:border-gray-200 hover:shadow-xl transition-all duration-300"
                  onClick={() => router.push(`/teacher-dashboard/student/${student.userId}`)}
                >
                  {/* Header with improved spacing */}
                  <div className="flex items-start gap-3 mb-6">
                    <div className="relative flex-shrink-0">
                      <div className="h-14 w-14 rounded-full bg-gray-900 flex items-center justify-center">
                        <span className="text-white font-bold text-lg tracking-tight">
                          {student.name.substring(0, 2).toUpperCase()}
                        </span>
                      </div>
                      {student.currentStreak >= 7 && (
                        <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-orange-500 flex items-center justify-center border-2 border-white">
                          <Flame className="h-3 w-3 text-white fill-current" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 pt-1">
                      <h3 className="text-base font-semibold text-gray-900 truncate mb-0.5 tracking-tight leading-tight">
                        {student.name}
                      </h3>
                      <p className="text-xs text-gray-500 truncate leading-relaxed">{student.currentModule}</p>
                    </div>
                    {student.atRiskOfDropout && (
                      <div className="flex-shrink-0 pt-1">
                        <div className="h-8 w-8 rounded-full bg-red-50 flex items-center justify-center">
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Progress Bar - Prominent */}
                  <div className="mb-6">
                    <div className="flex items-baseline justify-between mb-2">
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Progress</span>
                      <span className="text-2xl font-bold text-gray-900 tracking-tight">{student.overallProgress}%</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gray-900 rounded-full transition-all duration-500"
                        style={{ width: `${student.overallProgress}%` }}
                      />
                    </div>
                  </div>

                  {/* Key Metrics Grid - Clean Typography */}
                  <div className="grid grid-cols-2 gap-x-4 gap-y-5 mb-6">
                    {/* Streak */}
                    <div>
                      <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">Streak</div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-xl font-bold text-gray-900 tracking-tight">{student.currentStreak}</span>
                        <span className="text-sm text-gray-500">days</span>
                      </div>
                    </div>

                    {/* Score */}
                    <div>
                      <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">Score</div>
                      <div className="flex items-baseline gap-1">
                        <span className={cn("text-xl font-bold tracking-tight",
                          student.averageScore >= 80 ? "text-green-600" :
                          student.averageScore >= 60 ? "text-blue-600" : "text-orange-600"
                        )}>
                          {student.averageScore}
                        </span>
                        <span className="text-sm text-gray-500">%</span>
                      </div>
                    </div>

                    {/* Engagement */}
                    <div>
                      <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">Engagement</div>
                      <div className="flex items-baseline gap-1">
                        <span className={cn("text-xl font-bold tracking-tight",
                          student.engagementScore >= 70 ? "text-green-600" :
                          student.engagementScore >= 40 ? "text-blue-600" : "text-red-600"
                        )}>
                          {student.engagementScore}
                        </span>
                        <span className="text-sm text-gray-500">%</span>
                      </div>
                    </div>

                    {/* Pace */}
                    <div>
                      <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">Pace</div>
                      <div className="flex items-center gap-1.5">
                        {student.learningPace === 'ahead' && <TrendingUp className="h-4 w-4 text-green-600" />}
                        {student.learningPace === 'on-track' && <Activity className="h-4 w-4 text-blue-600" />}
                        {student.learningPace === 'behind' && <TrendingDown className="h-4 w-4 text-red-600" />}
                        <span className={cn("text-sm font-semibold capitalize",
                          student.learningPace === 'ahead' ? 'text-green-600' :
                          student.learningPace === 'behind' ? 'text-red-600' : 'text-blue-600'
                        )}>
                          {student.learningPace}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Lessons - Bottom Stat */}
                  <div className="pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Lessons</span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-lg font-bold text-gray-900 tracking-tight">{student.lessonsCompleted}</span>
                        <span className="text-sm text-gray-400">/</span>
                        <span className="text-sm text-gray-500">{student.totalLessons}</span>
                      </div>
                    </div>
                  </div>

                  {/* Hover Action - Minimalist */}
                  <div className="mt-5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <button
                      className="w-full py-2.5 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/teacher-dashboard/student/${student.userId}`);
                      }}
                    >
                      View Profile
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* View All Students Link */}
          {filteredStudents.length > 12 && (
            <div className="text-center mt-8">
              <Button
                size="lg"
                onClick={() => router.push('/teacher-dashboard/student-progress')}
                className="gap-2 shadow-md bg-blue-600 hover:bg-blue-700 text-white"
              >
                View All {filteredStudents.length} Students
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-100 border-t mt-16">
        <div className="container mx-auto px-6 py-8 max-w-7xl">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <School className="h-6 w-6 text-gray-600" />
              <span className="text-gray-600 font-semibold">telc A1 German Learning Platform</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-gray-500">
              <span>© 2024 A&B Recruiting</span>
              <span>•</span>
              <Button variant="link" className="text-gray-500 hover:text-gray-700 p-0 h-auto">
                Help & Support
              </Button>
              <span>•</span>
              <Button variant="link" className="text-gray-500 hover:text-gray-700 p-0 h-auto">
                Privacy Policy
              </Button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
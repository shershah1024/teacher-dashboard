'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  Search,
  ChevronLeft,
  TrendingUp,
  TrendingDown,
  Users,
  AlertTriangle,
  Target,
  Activity,
  Zap,
  Clock,
  Flame,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Filter,
  X,
  Award,
  Brain,
  Sparkles,
  Eye,
  Mic,
  BookOpen,
  Settings,
  RefreshCw,
  Bell
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from 'next/navigation';
import { DashboardHeader } from "@/components/DashboardHeader";

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
  
  overallProgress: number;
  currentLesson: string;
  currentModule: string;
  lessonsCompleted: number;
  totalLessons: number;
  expectedCompletion: string | null;
  learningVelocity: number;
  
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

interface DashboardData {
  students: StudentProgressCard[];
  summary: {
    totalStudents: number;
    activeStudents: number;
    atRiskStudents: number;
    averageProgress: number;
    averageEngagement: number;
  };
}

export default function StudentProgressDashboard() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [filteredStudents, setFilteredStudents] = useState<StudentProgressCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'engagement' | 'progress' | 'activity' | 'name'>('engagement');
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  useEffect(() => {
    fetchProgressData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [data?.students, searchQuery, sortBy, activeFilters]);

  const fetchProgressData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/teacher-dashboard/student-progress-overview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });

      const responseData = await response.json();
      setData(responseData);
    } catch (error) {
      console.error('Error fetching student progress data:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    if (!data?.students) return;
    
    let filtered = [...data.students];
    
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

  const getSkillTrendIcon = (trend: string) => {
    if (trend === 'up' || trend === 'improving') return '↑';
    if (trend === 'down' || trend === 'declining') return '↓';
    return '→';
  };

  const getSkillTrendColor = (trend: string) => {
    if (trend === 'up' || trend === 'improving') return 'text-green-500';
    if (trend === 'down' || trend === 'declining') return 'text-red-500';
    return 'text-gray-500';
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
    if (!data?.students) return 0;
    return data.students.filter(student => {
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
    { key: 'strong-speaking', label: 'Strong Speaking', icon: Mic, bgColor: 'bg-indigo-50', borderColor: 'border-indigo-300', textColor: 'text-indigo-700', activeBg: 'bg-indigo-500' },
    { key: 'need-speaking', label: 'Need Speaking Help', icon: Mic, bgColor: 'bg-yellow-50', borderColor: 'border-yellow-300', textColor: 'text-yellow-700', activeBg: 'bg-yellow-500' },
    { key: 'grammar-issues', label: 'Grammar Issues', icon: BookOpen, bgColor: 'bg-amber-50', borderColor: 'border-amber-300', textColor: 'text-amber-700', activeBg: 'bg-amber-500' },
    { key: 'active-today', label: 'Active Today', icon: Clock, bgColor: 'bg-lime-50', borderColor: 'border-lime-300', textColor: 'text-lime-700', activeBg: 'bg-lime-600' },
    { key: 'needs-attention', label: 'Needs Attention', icon: AlertCircle, bgColor: 'bg-red-50', borderColor: 'border-red-300', textColor: 'text-red-700', activeBg: 'bg-red-500' },
  ];

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="text-center">
          <p className="text-muted-foreground">Failed to load student progress data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Consistent Dashboard Header */}
      <DashboardHeader
        title="Student Progress Dashboard"
        description="Comprehensive view of all student learning analytics and performance metrics"
        icon={Activity}
        showBackButton={true}
        onRefresh={fetchProgressData}
        actions={
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/')}
            className="text-white hover:bg-white/10 hover:text-white"
          >
            <Users className="h-4 w-4 mr-2" />
            Overview
          </Button>
        }
      />

      {/* Metrics Overview - Consistent Design */}
      <div className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-6 py-6 max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-blue-600 rounded-xl p-5 text-white shadow-md">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="text-sm font-medium text-blue-50 mb-1">Total Students</div>
                  <div className="text-4xl font-bold">{data.summary.totalStudents}</div>
                </div>
                <Users className="h-8 w-8 text-blue-100" />
              </div>
              <div className="text-sm text-blue-50">Across all programs</div>
            </div>

            <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-md">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="text-sm font-medium text-gray-600 mb-1">Active (7d)</div>
                  <div className="text-4xl font-bold text-gray-900">{data.summary.activeStudents}</div>
                </div>
                <Activity className="h-8 w-8 text-gray-400" />
              </div>
              <div className="text-sm text-gray-600">{Math.round((data.summary.activeStudents / data.summary.totalStudents) * 100)}% engagement</div>
            </div>

            <div className="bg-white rounded-xl p-5 border-2 border-red-200 shadow-md">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="text-sm font-medium text-red-700 mb-1">At Risk</div>
                  <div className="text-4xl font-bold text-red-600">{data.summary.atRiskStudents}</div>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-400" />
              </div>
              <div className="text-sm text-red-600">Need attention</div>
            </div>

            <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-md">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="text-sm font-medium text-gray-600 mb-1">Avg Progress</div>
                  <div className="text-4xl font-bold text-gray-900">{data.summary.averageProgress}%</div>
                </div>
                <Target className="h-8 w-8 text-gray-400" />
              </div>
            </div>

            <div className="bg-emerald-600 rounded-xl p-5 text-white shadow-md">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="text-sm font-medium text-emerald-50 mb-1">Engagement</div>
                  <div className="text-4xl font-bold">{data.summary.averageEngagement}%</div>
                </div>
                <Zap className="h-8 w-8 text-emerald-100" />
              </div>
              <div className="text-sm text-emerald-50">Overall class</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="container mx-auto px-6 py-8 max-w-7xl space-y-8">

        {/* Streamlined Filters & Search */}
        <Card>
        <CardContent className="p-6">
          {/* Header with Search */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900">Filters & Search</h3>
              {activeFilters.length > 0 && (
                <Badge variant="default" className="ml-2">
                  {activeFilters.length} active
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-3">
              {/* Search Field */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by name, email, or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-2 w-64 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              
              {/* Clear All Button */}
              {(activeFilters.length > 0 || searchQuery) && (
                <Button 
                  variant="outline" 
                  size="default" 
                  onClick={clearAllFilters}
                  className="gap-2 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                >
                  <X className="h-4 w-4" />
                  Clear All
                </Button>
              )}
            </div>
          </div>
          
          {/* Filter Buttons - Clean minimal design */}
          <div className="flex flex-wrap gap-2">
            {quickFiltersList.map((filter) => {
              const count = getFilterCount(filter.key);
              const isActive = activeFilters.includes(filter.key);
              const IconComponent = filter.icon;

              return (
                <button
                  key={filter.key}
                  onClick={() => toggleQuickFilter(filter.key)}
                  disabled={count === 0}
                  className={cn(
                    "inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all border-2",
                    isActive
                      ? "bg-blue-600 text-white border-blue-600 shadow-md"
                      : count === 0
                        ? "opacity-40 cursor-not-allowed border-gray-200 bg-gray-50 text-gray-500"
                        : "bg-white border-gray-200 text-gray-700 hover:border-blue-300 hover:bg-blue-50"
                  )}
                >
                  <IconComponent className="h-4 w-4" />
                  <span>{filter.label}</span>
                  <span className={cn(
                    "text-xs font-bold px-1.5 py-0.5 rounded",
                    isActive ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-700"
                  )}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>
        
        {/* Results Header with Sort */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-gray-900">
            {filteredStudents.length} {filteredStudents.length === 1 ? 'Student' : 'Students'}
          </h2>
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

        {/* Student Cards Grid - 2025 Modern Design */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
        {filteredStudents.map((student) => (
          <div
            key={student.userId}
            className="group cursor-pointer bg-white rounded-2xl p-6 border border-gray-100 hover:border-gray-200 hover:shadow-xl transition-all duration-300"
            onClick={() => router.push(`/teacher-dashboard/student/${student.userId}`)}
          >
              {/* Header */}
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
                  <h3 className="text-base font-semibold text-gray-900 truncate mb-0.5 tracking-tight">
                    {student.name}
                  </h3>
                  <p className="text-xs text-gray-500 truncate">{student.email || student.currentModule}</p>
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

              {/* Key Metrics Grid */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-5 mb-6">
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

                {/* Score */}
                <div>
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">Avg Score</div>
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

                {/* Streak */}
                <div>
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">Streak</div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xl font-bold text-gray-900 tracking-tight">{student.currentStreak}</span>
                    <span className="text-sm text-gray-500">days</span>
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

              {/* Bottom Stats */}
              <div className="pt-4 border-t border-gray-100 mb-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1">Study Time</span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-lg font-bold text-gray-900 tracking-tight">{student.averageDailyMinutes}</span>
                      <span className="text-sm text-gray-500">min/day</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1">Lessons</span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-lg font-bold text-gray-900 tracking-tight">{student.lessonsCompleted}</span>
                      <span className="text-sm text-gray-400">/</span>
                      <span className="text-sm text-gray-500">{student.totalLessons}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Hover Action */}
              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
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
          </div>
        ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-100 border-t mt-16">
        <div className="container mx-auto px-6 py-8 max-w-7xl">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <CheckCircle2 className="h-6 w-6 text-gray-600" />
              <span className="text-gray-600 font-semibold">German Learning Platform</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-gray-500">
              <span>© 2024 Teacher Dashboard</span>
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
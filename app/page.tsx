'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
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
  Eye
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Mic as MicIcon } from 'lucide-react';

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

interface QuickAction {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  color: string;
  count?: number;
}

const quickActions: QuickAction[] = [
  {
    title: 'Task Completions',
    description: 'Progress tracking',
    icon: CheckCircle2,
    href: '/teacher-dashboard/task-completions',
    color: 'text-emerald-600',
    count: 358
  },
  {
    title: 'Grammar',
    description: 'Exercise performance',
    icon: BookOpen,
    href: '/teacher-dashboard/grammar',
    color: 'text-green-600',
    count: 24
  },
  {
    title: 'Speaking',
    description: 'Oral practice',
    icon: Mic,
    href: '/teacher-dashboard/speaking',
    color: 'text-blue-600',
    count: 152
  },
  {
    title: 'Listening',
    description: 'Comprehension',
    icon: Headphones,
    href: '/teacher-dashboard/listening',
    color: 'text-orange-600',
    count: 18
  },
  {
    title: 'Reading',
    description: 'Text analysis',
    icon: FileText,
    href: '/teacher-dashboard/reading',
    color: 'text-teal-600',
    count: 12
  },
  {
    title: 'Pronunciation',
    description: 'Accuracy metrics',
    icon: Volume2,
    href: '/teacher-dashboard/pronunciation',
    color: 'text-amber-600',
    count: 89
  },
  {
    title: 'Discourse',
    description: 'Conversations',
    icon: BarChart3,
    href: '/teacher-dashboard/discourse-analysis',
    color: 'text-indigo-600',
    count: 45
  },
  {
    title: 'AI Chatbot',
    description: 'AI interactions',
    icon: MessageSquare,
    href: '/teacher-dashboard/chatbot-scores',
    color: 'text-purple-600',
    count: 67
  },
  {
    title: 'Grammar Errors',
    description: 'Error analysis',
    icon: AlertTriangle,
    href: '/teacher-dashboard/grammar-errors',
    color: 'text-red-600',
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
    averageEngagement: 0
  });

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
      setStudents(data.students || []);
      setSummary(data.summary || {
        totalStudents: 0,
        activeStudents: 0,
        atRiskStudents: 0,
        averageProgress: 0,
        averageEngagement: 0
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
      {/* Main Navigation Bar */}
      <nav className="bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg sticky top-0 z-50">
        <div className="container mx-auto px-6 py-6 max-w-7xl">
          <div className="flex items-center justify-between">
            {/* Logo and Brand */}
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/10 backdrop-blur rounded-lg">
                <School className="h-10 w-10 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">telc A1 German</h1>
                <p className="text-blue-100 text-base">Teacher Dashboard</p>
              </div>
            </div>

            {/* Navigation Links */}
            <div className="hidden lg:flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="default"
                className="text-white hover:bg-white/10 hover:text-white text-base py-2 px-4"
                onClick={() => router.push('/')}
              >
                <Users className="h-5 w-5 mr-2" />
                Overview
              </Button>
              <Button 
                variant="ghost" 
                size="default"
                className="text-white hover:bg-white/10 hover:text-white text-base py-2 px-4"
                onClick={() => router.push('/teacher-dashboard/student-progress')}
              >
                <Activity className="h-5 w-5 mr-2" />
                All Students
              </Button>
              <Button 
                variant="ghost" 
                size="default"
                className="text-white hover:bg-white/10 hover:text-white text-base py-2 px-4"
                onClick={() => router.push('/teacher-dashboard/manage-students')}
              >
                <UserPlus className="h-5 w-5 mr-2" />
                Manage
              </Button>
              <Button 
                variant="ghost" 
                size="default"
                className="text-white hover:bg-white/10 hover:text-white text-base py-2 px-4"
                onClick={() => router.push('/teacher-dashboard/task-completions')}
              >
                <CheckCircle2 className="h-5 w-5 mr-2" />
                Tasks
              </Button>
              <Button 
                variant="ghost" 
                size="default"
                className="text-white hover:bg-white/10 hover:text-white text-base py-2 px-4"
                onClick={() => router.push('/teacher-dashboard/skills')}
              >
                <BookOpen className="h-5 w-5 mr-2" />
                Skills
              </Button>
              
              <div className="ml-4 h-10 w-px bg-white/20" />
              
              <Button 
                variant="ghost" 
                size="default"
                className="text-white hover:bg-white/10 hover:text-white p-2.5"
                onClick={fetchStudentProgress}
              >
                <RefreshCw className="h-5 w-5" />
              </Button>
              <Button 
                variant="ghost" 
                size="default"
                className="text-white hover:bg-white/10 hover:text-white relative p-2.5"
              >
                <Bell className="h-5 w-5" />
                <span className="absolute top-1 right-1 h-3 w-3 bg-red-500 rounded-full animate-pulse" />
              </Button>
              <Button 
                variant="ghost" 
                size="default"
                className="text-white hover:bg-white/10 hover:text-white p-2.5"
              >
                <Settings className="h-5 w-5" />
              </Button>
            </div>

            {/* User Info */}
            <div className="flex items-center gap-4">
              <div className="text-right hidden md:block">
                <p className="font-semibold">{user?.firstName || 'Teacher'}</p>
                <p className="text-xs text-blue-100">{currentTime}</p>
              </div>
              <Avatar className="h-12 w-12 border-2 border-white/20">
                <AvatarFallback className="bg-white/10 text-white">
                  {user?.firstName?.[0] || 'T'}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </div>
      </nav>

      {/* Page Header with Stats */}
      <div className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-6 py-8 max-w-7xl">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {getTimeBasedGreeting()}, {user?.firstName || 'Teacher'}!
            </h1>
            <p className="text-gray-600">
              Monitor and track your students' German language learning progress
            </p>
          </div>

          {/* Real-time Stats Bar */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-blue-600">{summary.totalStudents}</div>
                  <div className="text-sm text-blue-700">Total Students</div>
                </div>
                <Users className="h-8 w-8 text-blue-500" />
              </div>
            </div>
            
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-green-600">{summary.activeStudents}</div>
                  <div className="text-sm text-green-700">Active (7d)</div>
                </div>
                <Activity className="h-8 w-8 text-green-500" />
              </div>
            </div>
            
            <div className="bg-red-50 rounded-lg p-4 border border-red-200">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-red-600">{summary.atRiskStudents}</div>
                  <div className="text-sm text-red-700">At Risk</div>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-500" />
              </div>
            </div>
            
            <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-purple-600">{summary.averageProgress}%</div>
                  <div className="text-sm text-purple-700">Avg Progress</div>
                </div>
                <Target className="h-8 w-8 text-purple-500" />
              </div>
            </div>
            
            <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-amber-600">{summary.averageEngagement}%</div>
                  <div className="text-sm text-amber-700">Avg Engagement</div>
                </div>
                <Zap className="h-8 w-8 text-amber-500" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="container mx-auto px-6 py-8 max-w-7xl space-y-8">
        {/* Quick Analytics Links - Compact Bar */}
        <div>
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {quickActions.map((action) => {
              const IconComponent = action.icon;
              return (
                <Link key={action.href} href={action.href}>
                  <Button variant="outline" size="sm" className="whitespace-nowrap">
                    <IconComponent className={cn("h-4 w-4 mr-2", action.color)} />
                    {action.title}
                    {action.count && (
                      <Badge variant="secondary" className="ml-2 px-1 py-0 text-xs">
                        {action.count}
                      </Badge>
                    )}
                  </Button>
                </Link>
              );
            })}
          </div>
        </div>

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
                    placeholder="Search by name or email..."
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
            
            {/* Filter Buttons - Colorful flat list */}
            <div className="flex flex-wrap gap-3">
              {quickFiltersList.map((filter) => {
                const count = getFilterCount(filter.key);
                const isActive = activeFilters.includes(filter.key);
                const IconComponent = filter.icon;
                
                return (
                  <Button
                    key={filter.key}
                    onClick={() => toggleQuickFilter(filter.key)}
                    disabled={count === 0}
                    variant="outline"
                    size="sm"
                    className={cn(
                      "gap-2 font-medium transition-all duration-200 border-2",
                      isActive ? [
                        filter.activeBg,
                        "text-white border-transparent shadow-lg scale-105 hover:opacity-90"
                      ] : [
                        filter.bgColor,
                        filter.borderColor,
                        filter.textColor,
                        count === 0
                          ? "opacity-50 cursor-not-allowed"
                          : "hover:scale-105 hover:shadow-md hover:border-opacity-100"
                      ]
                    )}
                  >
                    <IconComponent className="h-4 w-4" />
                    <span>{filter.label}</span>
                    <Badge 
                      variant="outline" 
                      className={cn(
                        "ml-1 px-1.5 py-0 text-xs font-bold border",
                        isActive ? "bg-white/20 text-white border-white/30" : [
                          filter.bgColor,
                          filter.borderColor,
                          filter.textColor
                        ]
                      )}
                    >
                      {count}
                    </Badge>
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Student Progress Cards Section */}
        <div className="space-y-6">
          {/* Results Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-semibold text-gray-900">
                {filteredStudents.length} Students Found
              </h2>
              {/* Sort Buttons */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Sort by:</span>
                <Button
                  size="sm"
                  variant={sortBy === 'engagement' ? 'default' : 'ghost'}
                  onClick={() => setSortBy('engagement')}
                  className="h-8"
                >
                  Engagement
                </Button>
                <Button
                  size="sm"
                  variant={sortBy === 'progress' ? 'default' : 'ghost'}
                  onClick={() => setSortBy('progress')}
                  className="h-8"
                >
                  Progress
                </Button>
                <Button
                  size="sm"
                  variant={sortBy === 'activity' ? 'default' : 'ghost'}
                  onClick={() => setSortBy('activity')}
                  className="h-8"
                >
                  Recent Activity
                </Button>
                <Button
                  size="sm"
                  variant={sortBy === 'name' ? 'default' : 'ghost'}
                  onClick={() => setSortBy('name')}
                  className="h-8"
                >
                  Name
                </Button>
              </div>
            </div>
            <Button 
              variant="default" 
              size="default"
              onClick={() => router.push('/teacher-dashboard/student-progress')}
              className="gap-2"
            >
              View Full Dashboard
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Student Cards Grid */}
          {loading ? (
            <div className="flex items-center justify-center h-96">
              <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              {filteredStudents.slice(0, 9).map((student) => (
                <Card 
                  key={student.userId} 
                  className="group relative overflow-hidden bg-gradient-to-br from-white via-white to-gray-50/50 border-2 border-gray-100 shadow-lg hover:shadow-2xl hover:border-gray-200 hover:-translate-y-2 transform transition-all duration-500 cursor-pointer backdrop-blur-sm"
                  onClick={() => router.push(`/teacher-dashboard/student/${student.userId}`)}
                >
                  {/* Animated Background Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-blue-50/30 group-hover:to-blue-100/50 transition-all duration-500" />
                  
                  {/* Status Indicator - Enhanced */}
                  <div className={cn(
                    "absolute top-0 left-0 right-0 h-2 bg-gradient-to-r",
                    student.atRiskOfDropout ? "from-red-400 to-red-600" :
                    student.engagementScore >= 70 ? "from-green-400 to-green-600" :
                    student.engagementScore >= 40 ? "from-blue-400 to-blue-600" :
                    "from-orange-400 to-red-500"
                  )} />
                  
                  {/* Risk Badge */}
                  {student.atRiskOfDropout && (
                    <div className="absolute top-4 right-4 z-10">
                      <div className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg animate-pulse">
                        <AlertTriangle className="h-3 w-3 inline mr-1" />
                        AT RISK
                      </div>
                    </div>
                  )}
                  
                  <CardContent className="relative z-10 p-6">
                    {/* Header Section - Reduced Size */}
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          {/* Large Avatar with Circular Progress Ring */}
                          <div className="relative">
                            <svg className="transform -rotate-90 w-20 h-20">
                              <circle
                                cx="40"
                                cy="40"
                                r="38"
                                stroke="#e5e7eb"
                                strokeWidth="4"
                                fill="transparent"
                              />
                              <circle
                                cx="40"
                                cy="40"
                                r="38"
                                stroke={student.engagementScore >= 70 ? "#10b981" : student.engagementScore >= 40 ? "#3b82f6" : "#f59e0b"}
                                strokeWidth="4"
                                fill="transparent"
                                strokeDasharray={`${(student.overallProgress * 239) / 100} 239`}
                                className="transition-all duration-1000 ease-out group-hover:stroke-width-6"
                              />
                            </svg>
                            <Avatar className="absolute inset-2 h-16 w-16">
                              <AvatarFallback className={cn(
                                "text-white font-bold text-xl shadow-lg",
                                student.engagementScore >= 70 ? "bg-gradient-to-br from-green-400 via-green-500 to-green-600" :
                                student.engagementScore >= 40 ? "bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600" :
                                "bg-gradient-to-br from-orange-400 via-orange-500 to-red-600"
                              )}>
                                {student.name.substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          </div>
                          {/* Streak Indicator - Enhanced */}
                          {student.currentStreak > 0 && (
                            <div className={cn(
                              "absolute -bottom-2 -right-2 rounded-full p-2 shadow-lg animate-pulse",
                              student.currentStreak > 7 ? "bg-gradient-to-r from-orange-400 to-red-500" : "bg-gradient-to-r from-blue-400 to-blue-500"
                            )}>
                              <Flame className="h-4 w-4 text-white" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-gray-900 mb-2">{student.name}</h3>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Badge 
                                variant={student.inactivityDays === 0 ? "default" : 
                                        student.inactivityDays <= 3 ? "secondary" : 
                                        "destructive"}
                                className="text-xs px-2 py-1"
                              >
                                {student.inactivityDays === 0 ? '🟢 Active today' :
                                 student.inactivityDays === 1 ? '🟡 Yesterday' :
                                 `🔴 ${student.inactivityDays}d inactive`}
                              </Badge>
                            </div>
                            {student.email && (
                              <p className="text-sm text-gray-600">{student.email}</p>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {getPaceIcon(student.learningPace)}
                        <span className={cn("text-sm font-medium capitalize", 
                          student.learningPace === 'ahead' ? 'text-green-600' :
                          student.learningPace === 'behind' ? 'text-red-600' :
                          'text-blue-600'
                        )}>
                          {student.learningPace}
                        </span>
                      </div>
                    </div>

                    {/* Main Metrics Grid - Enhanced */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      {/* Progress Card */}
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 shadow-inner">
                        <div className="text-center">
                          <div className={cn("text-3xl font-bold mb-2", getProgressColor(student.overallProgress))}>
                            {student.overallProgress}%
                          </div>
                          <p className="text-sm font-medium text-blue-700 mb-3">Course Progress</p>
                          <Progress value={student.overallProgress} className="h-2 bg-blue-200" />
                          <p className="text-xs text-blue-600 mt-2">
                            {student.lessonsCompleted} of {student.totalLessons} lessons
                          </p>
                        </div>
                      </div>

                      {/* Engagement Card */}
                      <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 shadow-inner">
                        <div className="text-center">
                          <div className={cn("text-3xl font-bold mb-2", getEngagementColor(student.engagementScore))}>
                            {student.engagementScore}%
                          </div>
                          <p className="text-sm font-medium text-green-700 mb-3">Engagement</p>
                          {student.currentStreak > 0 && (
                            <div className="flex items-center justify-center gap-2 bg-white/50 rounded-lg px-3 py-1">
                              <Flame className="h-4 w-4 text-orange-500" />
                              <span className="text-sm font-bold text-orange-600">{student.currentStreak} day streak</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Skills and Performance */}
                    <div className="space-y-6">
                      {/* Performance Score */}
                      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-700 mb-1">Average Score</p>
                            <div className={cn("text-3xl font-bold", 
                              student.averageScore >= 80 ? "text-green-600" :
                              student.averageScore >= 60 ? "text-blue-600" :
                              "text-red-600"
                            )}>
                              {student.averageScore}%
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center gap-2 mb-2">
                              <CheckCircle2 className="h-5 w-5 text-green-500" />
                              <span className="text-sm font-medium text-gray-700">Strongest:</span>
                            </div>
                            <p className="text-lg font-bold text-green-600">{student.strongestSkill}</p>
                          </div>
                        </div>
                      </div>

                      {/* Focus Area */}
                      {student.recommendedFocus.length > 0 && (
                        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4">
                          <div className="flex items-start gap-3">
                            <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                            <div>
                              <p className="text-sm font-bold text-amber-800 mb-1">Focus Area</p>
                              <p className="text-sm text-amber-700">{student.recommendedFocus[0]}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Study Stats */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-50 rounded-lg p-3 text-center">
                          <p className="text-lg font-bold text-gray-900">{student.averageDailyMinutes}</p>
                          <p className="text-xs text-gray-600">min/day avg</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3 text-center">
                          <p className="text-lg font-bold text-gray-900">{student.totalStudyHours}h</p>
                          <p className="text-xs text-gray-600">total study</p>
                        </div>
                      </div>
                    </div>

                    {/* Enhanced Hover Action */}
                    <div className="mt-8 transform translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                      <Button 
                        variant="default" 
                        size="lg" 
                        className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg text-lg font-semibold py-6"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/teacher-dashboard/student/${student.userId}`);
                        }}
                      >
                        View Detailed Analytics
                        <ChevronRight className="h-5 w-5 ml-2" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* View All Students Link */}
          {filteredStudents.length > 9 && (
            <div className="text-center mt-8">
              <Button 
                size="lg"
                onClick={() => router.push('/teacher-dashboard/student-progress')}
                className="gap-2 shadow-lg"
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
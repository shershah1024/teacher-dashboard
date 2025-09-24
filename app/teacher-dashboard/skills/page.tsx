'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from '@/components/ui/progress';
import { useRouter } from 'next/navigation';
import {
  BookOpen,
  Mic,
  Headphones,
  FileText,
  PenTool,
  Volume2,
  MessageSquare,
  Brain,
  AlertTriangle,
  TrendingUp,
  Users,
  Activity,
  CheckCircle2,
  ChevronRight,
  ArrowUpRight,
  Target,
  Award,
  BarChart3,
  Settings,
  Bell,
  RefreshCw,
  Sparkles,
  Clock,
  Eye,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SkillCard {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  color: string;
  bgColor: string;
  borderColor: string;
  stats: {
    total: number;
    active: number;
    improvement: number;
    label: string;
  };
  metrics: {
    avgScore: number;
    trend: 'up' | 'down' | 'stable';
    topPerformers: number;
    needsHelp: number;
  };
  recentActivity: string;
}

const skillsData: SkillCard[] = [
  {
    title: 'Grammar',
    description: 'Sentence structure, conjugation, and rules',
    icon: BookOpen,
    href: '/teacher-dashboard/grammar',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    stats: {
      total: 1245,
      active: 24,
      improvement: 12,
      label: 'exercises completed'
    },
    metrics: {
      avgScore: 72,
      trend: 'up',
      topPerformers: 8,
      needsHelp: 4
    },
    recentActivity: '15 minutes ago'
  },
  {
    title: 'Speaking',
    description: 'Oral communication and pronunciation',
    icon: Mic,
    href: '/teacher-dashboard/speaking',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    stats: {
      total: 856,
      active: 18,
      improvement: 15,
      label: 'speaking sessions'
    },
    metrics: {
      avgScore: 68,
      trend: 'up',
      topPerformers: 6,
      needsHelp: 7
    },
    recentActivity: '2 hours ago'
  },
  {
    title: 'Listening',
    description: 'Comprehension and audio understanding',
    icon: Headphones,
    href: '/teacher-dashboard/listening',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    stats: {
      total: 623,
      active: 20,
      improvement: -5,
      label: 'listening exercises'
    },
    metrics: {
      avgScore: 75,
      trend: 'stable',
      topPerformers: 10,
      needsHelp: 3
    },
    recentActivity: '1 hour ago'
  },
  {
    title: 'Reading',
    description: 'Text comprehension and analysis',
    icon: FileText,
    href: '/teacher-dashboard/reading',
    color: 'text-teal-600',
    bgColor: 'bg-teal-50',
    borderColor: 'border-teal-200',
    stats: {
      total: 412,
      active: 16,
      improvement: 8,
      label: 'texts analyzed'
    },
    metrics: {
      avgScore: 70,
      trend: 'up',
      topPerformers: 7,
      needsHelp: 5
    },
    recentActivity: '30 minutes ago'
  },
  {
    title: 'Writing',
    description: 'Written expression and composition',
    icon: PenTool,
    href: '/teacher-dashboard/writing',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    stats: {
      total: 289,
      active: 14,
      improvement: 10,
      label: 'compositions'
    },
    metrics: {
      avgScore: 65,
      trend: 'up',
      topPerformers: 5,
      needsHelp: 6
    },
    recentActivity: '45 minutes ago'
  },
  {
    title: 'Pronunciation',
    description: 'Accent, intonation, and phonetics',
    icon: Volume2,
    href: '/teacher-dashboard/pronunciation',
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    stats: {
      total: 934,
      active: 22,
      improvement: 18,
      label: 'practice sessions'
    },
    metrics: {
      avgScore: 71,
      trend: 'up',
      topPerformers: 9,
      needsHelp: 4
    },
    recentActivity: '3 hours ago'
  },
  {
    title: 'AI Chatbot',
    description: 'Conversational practice with AI',
    icon: MessageSquare,
    href: '/teacher-dashboard/chatbot-scores',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-200',
    stats: {
      total: 567,
      active: 19,
      improvement: 14,
      label: 'conversations'
    },
    metrics: {
      avgScore: 73,
      trend: 'up',
      topPerformers: 8,
      needsHelp: 3
    },
    recentActivity: '10 minutes ago'
  },
  {
    title: 'Discourse Analysis',
    description: 'Advanced conversation analysis',
    icon: Brain,
    href: '/teacher-dashboard/discourse-analysis',
    color: 'text-pink-600',
    bgColor: 'bg-pink-50',
    borderColor: 'border-pink-200',
    stats: {
      total: 178,
      active: 12,
      improvement: 7,
      label: 'analyses'
    },
    metrics: {
      avgScore: 66,
      trend: 'stable',
      topPerformers: 4,
      needsHelp: 5
    },
    recentActivity: '4 hours ago'
  },
  {
    title: 'Grammar Errors',
    description: 'Common mistakes and patterns',
    icon: AlertTriangle,
    href: '/teacher-dashboard/grammar-errors',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    stats: {
      total: 1456,
      active: 28,
      improvement: -12,
      label: 'errors tracked'
    },
    metrics: {
      avgScore: 58,
      trend: 'down',
      topPerformers: 3,
      needsHelp: 12
    },
    recentActivity: '5 minutes ago'
  }
];

export default function SkillsDashboard() {
  const router = useRouter();
  const [overallStats, setOverallStats] = useState({
    totalActivities: 0,
    activeStudents: 0,
    avgImprovement: 0,
    overallAvgScore: 0
  });

  useEffect(() => {
    // Calculate overall statistics
    const total = skillsData.reduce((acc, skill) => acc + skill.stats.total, 0);
    const active = skillsData.reduce((acc, skill) => acc + skill.stats.active, 0) / skillsData.length;
    const improvement = skillsData.reduce((acc, skill) => acc + skill.stats.improvement, 0) / skillsData.length;
    const avgScore = skillsData.reduce((acc, skill) => acc + skill.metrics.avgScore, 0) / skillsData.length;

    setOverallStats({
      totalActivities: total,
      activeStudents: Math.round(active),
      avgImprovement: Math.round(improvement),
      overallAvgScore: Math.round(avgScore)
    });
  }, []);

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down':
        return <TrendingUp className="h-4 w-4 text-red-500 rotate-180" />;
      case 'stable':
        return <Activity className="h-4 w-4 text-blue-500" />;
    }
  };

  const getTrendColor = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      case 'stable':
        return 'text-blue-600';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Navigation Bar */}
      <nav className="bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg sticky top-0 z-50">
        <div className="container mx-auto px-6 py-6 max-w-7xl">
          <div className="flex items-center justify-between">
            {/* Logo and Brand */}
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/10 backdrop-blur rounded-lg">
                <BookOpen className="h-10 w-10 text-white" />
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
                onClick={() => router.push('/teacher-dashboard/task-completions')}
              >
                <CheckCircle2 className="h-5 w-5 mr-2" />
                Tasks
              </Button>
              <Button 
                variant="ghost" 
                size="default"
                className="text-white/90 bg-white/10 text-base py-2 px-4"
              >
                <BookOpen className="h-5 w-5 mr-2" />
                Skills
              </Button>
              
              <div className="ml-4 h-10 w-px bg-white/20" />
              
              <Button 
                variant="ghost" 
                size="default"
                className="text-white hover:bg-white/10 hover:text-white p-2.5"
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
                <p className="font-semibold">Teacher</p>
                <p className="text-xs text-blue-100">Admin Access</p>
              </div>
              <Avatar className="h-12 w-12 border-2 border-white/20">
                <AvatarFallback className="bg-white/10 text-white">
                  T
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </div>
      </nav>

      {/* Page Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-6 py-8 max-w-7xl">
          <div className="mb-6">
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => router.push('/')}
                className="p-0 h-auto hover:text-gray-700"
              >
                Home
              </Button>
              <ChevronRight className="h-4 w-4" />
              <span className="text-gray-700 font-medium">Skills Dashboard</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-2">
              Skills & Performance Center
            </h1>
            <p className="text-gray-600">
              Monitor and analyze student performance across all language skills
            </p>
          </div>

          {/* Overall Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    {overallStats.totalActivities.toLocaleString()}
                  </div>
                  <div className="text-sm text-blue-700">Total Activities</div>
                </div>
                <BarChart3 className="h-8 w-8 text-blue-500" />
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {overallStats.activeStudents}
                  </div>
                  <div className="text-sm text-green-700">Avg Active Students</div>
                </div>
                <Users className="h-8 w-8 text-green-500" />
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-purple-600">
                    {overallStats.overallAvgScore}%
                  </div>
                  <div className="text-sm text-purple-700">Overall Avg Score</div>
                </div>
                <Target className="h-8 w-8 text-purple-500" />
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg p-4 border border-amber-200">
              <div className="flex items-center justify-between">
                <div>
                  <div className={cn("text-2xl font-bold flex items-center gap-2", 
                    overallStats.avgImprovement > 0 ? "text-green-600" : "text-red-600"
                  )}>
                    {overallStats.avgImprovement > 0 ? '+' : ''}{overallStats.avgImprovement}%
                  </div>
                  <div className="text-sm text-amber-700">Avg Improvement</div>
                </div>
                <TrendingUp className={cn("h-8 w-8", 
                  overallStats.avgImprovement > 0 ? "text-green-500" : "text-red-500 rotate-180"
                )} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Skills Grid */}
      <div className="container mx-auto px-6 py-8 max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {skillsData.map((skill) => {
            const IconComponent = skill.icon;
            return (
              <Card 
                key={skill.href}
                className="group hover:shadow-xl transition-all duration-300 cursor-pointer hover:-translate-y-1 overflow-hidden"
                onClick={() => router.push(skill.href)}
              >
                <div className={cn("h-2 bg-gradient-to-r", 
                  skill.metrics.trend === 'up' ? "from-green-400 to-green-600" :
                  skill.metrics.trend === 'down' ? "from-red-400 to-red-600" :
                  "from-blue-400 to-blue-600"
                )} />
                
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn("p-3 rounded-lg", skill.bgColor, skill.borderColor, "border")}>
                        <IconComponent className={cn("h-6 w-6", skill.color)} />
                      </div>
                      <div>
                        <CardTitle className="text-lg font-bold text-gray-900">
                          {skill.title}
                        </CardTitle>
                        <p className="text-sm text-gray-600 mt-1">{skill.description}</p>
                      </div>
                    </div>
                    <ArrowUpRight className="h-5 w-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Main Stats */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-700">Performance</span>
                      <div className="flex items-center gap-2">
                        <span className={cn("text-2xl font-bold", getTrendColor(skill.metrics.trend))}>
                          {skill.metrics.avgScore}%
                        </span>
                        {getTrendIcon(skill.metrics.trend)}
                      </div>
                    </div>
                    <Progress value={skill.metrics.avgScore} className="h-2 mb-3" />
                    
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        <Award className="h-4 w-4 text-green-500" />
                        <span className="text-gray-600">Top: {skill.metrics.topPerformers}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-orange-500" />
                        <span className="text-gray-600">Help: {skill.metrics.needsHelp}</span>
                      </div>
                    </div>
                  </div>

                  {/* Activity Stats */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Total {skill.stats.label}</span>
                      <span className="text-lg font-bold text-gray-900">
                        {skill.stats.total.toLocaleString()}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Active students</span>
                      <Badge variant="secondary" className="font-bold">
                        {skill.stats.active}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Week-over-week</span>
                      <span className={cn("text-sm font-bold", 
                        skill.stats.improvement > 0 ? "text-green-600" : 
                        skill.stats.improvement < 0 ? "text-red-600" : "text-gray-600"
                      )}>
                        {skill.stats.improvement > 0 ? '+' : ''}{skill.stats.improvement}%
                      </span>
                    </div>
                  </div>

                  {/* Recent Activity */}
                  <div className="pt-3 border-t">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600">Last activity</span>
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {skill.recentActivity}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="mt-12 bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              variant="outline" 
              className="justify-start gap-3 py-6"
              onClick={() => router.push('/teacher-dashboard/task-completions')}
            >
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <div className="text-left">
                <p className="font-semibold">View Task Completions</p>
                <p className="text-sm text-gray-600">Track student progress on assignments</p>
              </div>
            </Button>
            
            <Button 
              variant="outline" 
              className="justify-start gap-3 py-6"
              onClick={() => router.push('/teacher-dashboard/student-progress')}
            >
              <Users className="h-5 w-5 text-blue-600" />
              <div className="text-left">
                <p className="font-semibold">Student Overview</p>
                <p className="text-sm text-gray-600">Detailed individual performance</p>
              </div>
            </Button>
            
            <Button 
              variant="outline" 
              className="justify-start gap-3 py-6"
              onClick={() => router.push('/')}
            >
              <BarChart3 className="h-5 w-5 text-purple-600" />
              <div className="text-left">
                <p className="font-semibold">Analytics Dashboard</p>
                <p className="text-sm text-gray-600">Comprehensive data insights</p>
              </div>
            </Button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-100 border-t mt-16">
        <div className="container mx-auto px-6 py-8 max-w-7xl">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <BookOpen className="h-6 w-6 text-gray-600" />
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
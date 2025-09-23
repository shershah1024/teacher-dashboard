'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import Link from 'next/link';
import { useUser } from '@clerk/nextjs';
import {
  Headphones,
  Mic,
  PenTool,
  MessageSquare,
  Users,
  ChevronRight,
  BookOpen,
  Volume2,
  FileText,
  BarChart3,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Clock,
  Target,
  Award,
  Activity,
  Bell,
  Calendar,
  Eye,
  Filter,
  Search,
  RefreshCw,
  Download,
  Settings,
  School,
  Star,
  Zap,
  Coffee
} from 'lucide-react';

interface QuickAction {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  color: string;
  bgColor: string;
  priority: 'high' | 'medium' | 'low';
  stats?: string;
}

const quickActions: QuickAction[] = [
  {
    title: 'Task Completions',
    description: 'Monitor learning progress and engagement',
    icon: CheckCircle2,
    href: '/teacher-dashboard/task-completions',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50 hover:bg-emerald-100',
    priority: 'high',
    stats: '358 completed'
  },
  {
    title: 'Grammar Analysis',
    description: 'Track exercise performance and errors',
    icon: BookOpen,
    href: '/teacher-dashboard/grammar',
    color: 'text-green-600',
    bgColor: 'bg-green-50 hover:bg-green-100',
    priority: 'high',
    stats: '24 students active'
  },
  {
    title: 'Speaking Practice',
    description: 'Oral communication performance',
    icon: Mic,
    href: '/teacher-dashboard/speaking',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 hover:bg-blue-100',
    priority: 'medium',
    stats: '152 sessions'
  },
  {
    title: 'Pronunciation',
    description: 'Word-level accuracy analytics',
    icon: Volume2,
    href: '/teacher-dashboard/pronunciation',
    color: 'text-amber-600',
    bgColor: 'bg-amber-50 hover:bg-amber-100',
    priority: 'medium',
    stats: '89% avg accuracy'
  },
  {
    title: 'Listening Skills',
    description: 'Comprehension scores analysis',
    icon: Headphones,
    href: '/teacher-dashboard/listening',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50 hover:bg-orange-100',
    priority: 'medium',
    stats: '18 assessments'
  },
  {
    title: 'Reading & Writing',
    description: 'Text comprehension and composition',
    icon: FileText,
    href: '/teacher-dashboard/reading',
    color: 'text-teal-600',
    bgColor: 'bg-teal-50 hover:bg-teal-100',
    priority: 'low',
    stats: '12 exercises'
  },
  {
    title: 'Discourse Analysis',
    description: 'Conversation patterns and engagement',
    icon: BarChart3,
    href: '/teacher-dashboard/discourse-analysis',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50 hover:bg-indigo-100',
    priority: 'low',
    stats: '45 conversations'
  },
  {
    title: 'Chatbot Interactions',
    description: 'AI conversation practice analytics',
    icon: MessageSquare,
    href: '/teacher-dashboard/chatbot-scores',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 hover:bg-blue-100',
    priority: 'low',
    stats: '67 chats'
  }
];

export default function TeacherDashboardPage() {
  const { user } = useUser();
  const [currentTime, setCurrentTime] = useState('');
  const [dashboardStats, setDashboardStats] = useState({
    totalStudents: 24,
    activeToday: 18,
    avgProgress: 78,
    weeklyGrowth: 12
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

  const getTimeBasedGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const priorityActions = quickActions.filter(action => action.priority === 'high');
  const regularActions = quickActions.filter(action => action.priority !== 'high');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Enhanced Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="container mx-auto p-6 max-w-7xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-blue-600 rounded-lg">
                <School className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">telc A1 Teacher Portal</h1>
                <p className="text-gray-600">
                  {getTimeBasedGreeting()}, {user?.firstName || 'Teacher'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-sm text-gray-500">{currentTime}</div>
                <div className="flex items-center gap-2 text-blue-600">
                  <Users className="h-4 w-4" />
                  <span className="text-sm font-medium">{dashboardStats.totalStudents} Students</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Bell className="h-4 w-4 mr-2" />
                  Alerts
                </Button>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
              </div>
            </div>
          </div>

          {/* Real-time Stats Bar */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-blue-600">{dashboardStats.totalStudents}</div>
                  <div className="text-sm text-blue-700">Total Students</div>
                </div>
                <Users className="h-8 w-8 text-blue-500" />
              </div>
            </div>
            
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-green-600">{dashboardStats.activeToday}</div>
                  <div className="text-sm text-green-700">Active Today</div>
                </div>
                <Activity className="h-8 w-8 text-green-500" />
              </div>
            </div>
            
            <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-amber-600">{dashboardStats.avgProgress}%</div>
                  <div className="text-sm text-amber-700">Avg Progress</div>
                </div>
                <Target className="h-8 w-8 text-amber-500" />
              </div>
            </div>
            
            <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-5 w-5 text-emerald-600" />
                    <span className="text-2xl font-bold text-emerald-600">+{dashboardStats.weeklyGrowth}%</span>
                  </div>
                  <div className="text-sm text-emerald-700">Weekly Growth</div>
                </div>
                <Award className="h-8 w-8 text-emerald-500" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto p-6 max-w-7xl space-y-6">

        {/* Priority Actions Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Quick Actions</h2>
              <p className="text-gray-600">Access your most important analytics dashboards</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </div>
          </div>

          {/* High Priority Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {priorityActions.map((action) => {
              const IconComponent = action.icon;
              return (
                <Link key={action.href} href={action.href}>
                  <Card className={`${action.bgColor} border-2 border-transparent hover:border-gray-300 hover:shadow-lg transition-all duration-200 cursor-pointer h-full relative`}>
                    <Badge variant="destructive" className="absolute top-4 right-4 bg-red-500">
                      Priority
                    </Badge>
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`p-4 rounded-xl bg-white shadow-sm border-2 border-gray-100`}>
                            <IconComponent className={`h-8 w-8 ${action.color}`} />
                          </div>
                          <div>
                            <CardTitle className="text-xl text-gray-900">{action.title}</CardTitle>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="secondary" className="text-xs">
                                {action.stats}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                Updated now
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-center gap-2">
                          <ChevronRight className="h-6 w-6 text-gray-400" />
                          <Eye className="h-4 w-4 text-gray-400" />
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <CardDescription className="text-gray-700 text-base leading-relaxed mb-4">
                        {action.description}
                      </CardDescription>
                      <div className="flex items-center gap-2">
                        <Progress value={75} className="flex-1 h-2" />
                        <span className="text-sm text-gray-600">75% complete</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Regular Analytics Dashboards */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Analytics Dashboards</h3>
              <p className="text-gray-600">Detailed performance analysis by skill area</p>
            </div>
            <Button variant="outline" size="sm">
              <Search className="h-4 w-4 mr-2" />
              Search Dashboards
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {regularActions.map((action) => {
              const IconComponent = action.icon;
              return (
                <Link key={action.href} href={action.href}>
                  <Card className={`${action.bgColor} border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all duration-200 cursor-pointer h-full`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-3 rounded-lg bg-white shadow-sm`}>
                            <IconComponent className={`h-5 w-5 ${action.color}`} />
                          </div>
                          <div>
                            <CardTitle className="text-lg text-gray-900">{action.title}</CardTitle>
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <CardDescription className="text-gray-700 text-sm leading-relaxed mb-3">
                        {action.description}
                      </CardDescription>
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary" className="text-xs">
                          {action.stats}
                        </Badge>
                        <span className="text-xs text-gray-500">View details →</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Quick Actions Footer */}
        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Need Help?</h3>
              <p className="text-gray-600">Access documentation, tutorials, and support resources</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export Data
              </Button>
              <Button variant="outline">
                <Calendar className="h-4 w-4 mr-2" />
                Schedule Report
              </Button>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Star className="h-4 w-4 mr-2" />
                Get Support
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-2 text-gray-600">
              <Coffee className="h-4 w-4" />
              <span>Last updated: Just now</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Zap className="h-4 w-4" />
              <span>System status: All systems operational</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Clock className="h-4 w-4" />
              <span>Next sync: In 5 minutes</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
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
import { DashboardHeader } from "@/components/DashboardHeader";
import { MetricCard } from "@/components/MetricCard";

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
    title: 'Manage Students',
    description: 'Enroll and manage student accounts',
    icon: Users,
    href: '/teacher-dashboard/manage-students',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 hover:bg-blue-100',
    priority: 'high',
    stats: '5 pending invites'
  },
  {
    title: 'Student Progress',
    description: 'Track overall learning progress',
    icon: TrendingUp,
    href: '/teacher-dashboard/student-progress',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50 hover:bg-emerald-100',
    priority: 'high',
    stats: '24 active students'
  },
  {
    title: 'Skills Overview',
    description: 'Comprehensive skills assessment',
    icon: BarChart3,
    href: '/teacher-dashboard/skills',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50 hover:bg-purple-100',
    priority: 'medium',
    stats: 'All skills'
  },
  {
    title: 'Grammar Analysis',
    description: 'Track exercise performance',
    icon: BookOpen,
    href: '/teacher-dashboard/grammar',
    color: 'text-green-600',
    bgColor: 'bg-green-50 hover:bg-green-100',
    priority: 'low',
    stats: '89% accuracy'
  },
  {
    title: 'Speaking Practice',
    description: 'Oral communication performance',
    icon: Mic,
    href: '/teacher-dashboard/speaking',
    color: 'text-amber-600',
    bgColor: 'bg-amber-50 hover:bg-amber-100',
    priority: 'low',
    stats: '152 sessions'
  },
  {
    title: 'Task Completions',
    description: 'Daily learning activities',
    icon: CheckCircle2,
    href: '/teacher-dashboard/task-completions',
    color: 'text-teal-600',
    bgColor: 'bg-teal-50 hover:bg-teal-100',
    priority: 'low',
    stats: '358 completed'
  },
  {
    title: 'Pronunciation',
    description: 'Word-level accuracy analytics',
    icon: Volume2,
    href: '/teacher-dashboard/pronunciation',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50 hover:bg-indigo-100',
    priority: 'low',
    stats: '89% accuracy'
  }
];

interface RecentActivity {
  id: string;
  student: string;
  action: string;
  time: string;
  type: 'success' | 'warning' | 'info';
}

interface StudentPerformance {
  name: string;
  progress: number;
  streak: number;
  avatar: string;
}

export default function TeacherDashboardPage() {
  const { user } = useUser();
  const [currentTime, setCurrentTime] = useState('');
  const [dashboardStats, setDashboardStats] = useState({
    totalStudents: 24,
    activeToday: 18,
    avgProgress: 78,
    weeklyGrowth: 12,
    needsAttention: 3,
    topPerformers: 7,
    completionRate: 85,
    yesterdayActive: 16
  });

  const recentActivity: RecentActivity[] = [
    { id: '1', student: 'Maria Schmidt', action: 'Completed Lesson 15', time: '2 min ago', type: 'success' },
    { id: '2', student: 'Ahmed Hassan', action: 'Started Speaking Practice', time: '5 min ago', type: 'info' },
    { id: '3', student: 'Priya Patel', action: '7-day streak achieved!', time: '12 min ago', type: 'success' },
    { id: '4', student: 'Carlos Mendez', action: 'No activity for 3 days', time: '1 hour ago', type: 'warning' },
    { id: '5', student: 'Sofia Rossi', action: 'Grammar test: 95%', time: '2 hours ago', type: 'success' },
  ];

  const topPerformersData: StudentPerformance[] = [
    { name: 'Sofia Rossi', progress: 95, streak: 12, avatar: 'SR' },
    { name: 'Priya Patel', progress: 92, streak: 7, avatar: 'PP' },
    { name: 'Ahmed Hassan', progress: 88, streak: 5, avatar: 'AH' },
  ];

  const atRiskStudents: StudentPerformance[] = [
    { name: 'Carlos Mendez', progress: 42, streak: 0, avatar: 'CM' },
    { name: 'John Smith', progress: 38, streak: 0, avatar: 'JS' },
    { name: 'Lisa Wang', progress: 35, streak: 1, avatar: 'LW' },
  ];

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
      {/* Consistent Dashboard Header */}
      <DashboardHeader
        title={`${getTimeBasedGreeting()}, ${user?.firstName || 'Teacher'}`}
        description={`Teacher Dashboard • ${currentTime}`}
        icon={School}
        showBackButton={false}
        onRefresh={() => window.location.reload()}
        actions={
          <Link href="/teacher-dashboard/manage-students">
            <Button size="default" className="gap-2 bg-white text-blue-600 hover:bg-blue-50">
              <Users className="h-4 w-4" />
              Manage Students
            </Button>
          </Link>
        }
      />

      {/* Metrics Overview - Consistent Design */}
      <div className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-6 py-6 max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Primary Metric - Top Left (Most Important) */}
            <div className="bg-blue-600 rounded-xl p-5 text-white shadow-md">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="text-sm font-medium text-blue-50 mb-1">Active Students Today</div>
                  <div className="text-4xl font-bold">{dashboardStats.activeToday}</div>
                </div>
                <Activity className="h-8 w-8 text-blue-100" />
              </div>
              <div className="text-sm text-blue-50">
                +{dashboardStats.activeToday - dashboardStats.yesterdayActive} from yesterday • {Math.round((dashboardStats.activeToday / dashboardStats.totalStudents) * 100)}% engagement
              </div>
            </div>

            {/* Secondary Metric - Needs Attention (Alert Status) */}
            <div className="bg-white rounded-xl p-5 border-2 border-red-200 shadow-md">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="text-sm font-medium text-red-700 mb-1">Needs Attention</div>
                  <div className="text-4xl font-bold text-red-600">{dashboardStats.needsAttention}</div>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-400" />
              </div>
              <div className="text-sm text-red-600">Students below 50% progress</div>
            </div>

            {/* Performance Metric */}
            <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-md">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="text-sm font-medium text-gray-600 mb-1">Average Progress</div>
                  <div className="text-4xl font-bold text-gray-900">{dashboardStats.avgProgress}%</div>
                </div>
                <Target className="h-8 w-8 text-gray-400" />
              </div>
              <Progress value={dashboardStats.avgProgress} className="h-2 mb-2" />
              <div className="flex items-center gap-1 text-sm text-green-600">
                <TrendingUp className="h-3 w-3" />
                <span>+{dashboardStats.weeklyGrowth}% this week</span>
              </div>
            </div>

            {/* Success Metric */}
            <div className="bg-emerald-600 rounded-xl p-5 text-white shadow-md">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="text-sm font-medium text-emerald-50 mb-1">Top Performers</div>
                  <div className="text-4xl font-bold">{dashboardStats.topPerformers}</div>
                </div>
                <Award className="h-8 w-8 text-emerald-100" />
              </div>
              <div className="text-sm text-emerald-50">
                Students above 90% • {dashboardStats.completionRate}% completion rate
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto p-6 max-w-7xl space-y-6">

        {/* Main Dashboard Grid - Activity & Performance */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left Column: Recent Activity Feed */}
          <div className="lg:col-span-2 space-y-6">

            {/* Actionable Insights Banner */}
            <div className="bg-indigo-600 rounded-xl p-6 text-white shadow-md">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="h-5 w-5" />
                    <h3 className="text-lg font-semibold">Today's Key Insights</h3>
                  </div>
                  <p className="text-indigo-50 mb-4">
                    📈 Student engagement is up {dashboardStats.activeToday - dashboardStats.yesterdayActive} from yesterday.
                    {dashboardStats.needsAttention > 0 ? ` ⚠️ ${dashboardStats.needsAttention} students need immediate attention.` : ' All students on track!'}
                    {dashboardStats.topPerformers > 0 && ` 🌟 ${dashboardStats.topPerformers} top performers ready for advancement.`}
                  </p>
                  <div className="flex gap-3">
                    <Link href="/teacher-dashboard/student-progress">
                      <Button size="sm" className="bg-indigo-500 hover:bg-indigo-400 text-white border-0">
                        View Details →
                      </Button>
                    </Link>
                  </div>
                </div>
                <div className="hidden md:flex items-center gap-4">
                  <div className="text-center px-4 border-l border-indigo-500">
                    <div className="text-3xl font-bold">{dashboardStats.completionRate}%</div>
                    <div className="text-sm text-indigo-100">Task Completion</div>
                  </div>
                  <div className="text-center px-4 border-l border-indigo-500">
                    <div className="text-3xl font-bold">+{dashboardStats.weeklyGrowth}%</div>
                    <div className="text-sm text-indigo-100">Weekly Growth</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Real-Time Activity Feed */}
            <Card className="border-gray-200">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-blue-600" />
                    <CardTitle>Live Activity Feed</CardTitle>
                  </div>
                  <Badge className="bg-green-500 text-white animate-pulse">Live</Badge>
                </div>
                <CardDescription>Real-time student activities and achievements</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                    <div className={`p-2 rounded-full ${
                      activity.type === 'success' ? 'bg-green-100' :
                      activity.type === 'warning' ? 'bg-amber-100' : 'bg-blue-100'
                    }`}>
                      {activity.type === 'success' && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                      {activity.type === 'warning' && <AlertTriangle className="h-4 w-4 text-amber-600" />}
                      {activity.type === 'info' && <Activity className="h-4 w-4 text-blue-600" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{activity.student}</p>
                      <p className="text-sm text-gray-600">{activity.action}</p>
                    </div>
                    <span className="text-xs text-gray-500 whitespace-nowrap">{activity.time}</span>
                  </div>
                ))}
                <Link href="/teacher-dashboard/student-progress">
                  <Button variant="outline" className="w-full mt-2">
                    View All Activity →
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Performance & Alerts */}
          <div className="space-y-6">

            {/* Top Performers */}
            <Card className="border-emerald-200 bg-emerald-50">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-emerald-600" />
                  <CardTitle className="text-emerald-900">Top Performers</CardTitle>
                </div>
                <CardDescription>Leading students this week</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {topPerformersData.map((student, index) => (
                  <div key={student.name} className="flex items-center gap-3 p-3 rounded-lg bg-white border border-emerald-100">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="relative">
                        <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center font-semibold">
                          {student.avatar}
                        </div>
                        {index === 0 && <Star className="h-4 w-4 text-yellow-500 fill-current absolute -top-1 -right-1" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900">{student.name}</p>
                        <div className="flex items-center gap-2">
                          <Progress value={student.progress} className="h-1.5 flex-1" />
                          <span className="text-xs font-medium text-emerald-600">{student.progress}%</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-orange-600">
                        <Zap className="h-3 w-3 fill-current" />
                        <span className="text-xs font-bold">{student.streak}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* At-Risk Students Alert */}
            <Card className="border-red-200 bg-red-50">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <CardTitle className="text-red-900">Needs Attention</CardTitle>
                </div>
                <CardDescription>Students requiring support</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {atRiskStudents.map((student) => (
                  <div key={student.name} className="flex items-center gap-3 p-3 rounded-lg bg-white border border-red-100">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-semibold">
                        {student.avatar}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900">{student.name}</p>
                        <div className="flex items-center gap-2">
                          <Progress value={student.progress} className="h-1.5 flex-1" />
                          <span className="text-xs font-medium text-red-600">{student.progress}%</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className="text-xs border-red-200 text-red-700">
                        {student.streak} days
                      </Badge>
                    </div>
                  </div>
                ))}
                <Link href="/teacher-dashboard/student-progress">
                  <Button variant="outline" className="w-full mt-2 border-red-300 text-red-700 hover:bg-red-50">
                    Review All →
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Quick Access Dashboards - Progressive Disclosure */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Quick Access Dashboards</h2>
              <p className="text-gray-600">Jump directly to detailed analytics and student management</p>
            </div>
          </div>

          {/* High Priority Cards - Scannable Design */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {priorityActions.map((action) => {
              const IconComponent = action.icon;
              return (
                <Link key={action.href} href={action.href}>
                  <Card className="border-2 border-gray-200 hover:border-blue-400 hover:shadow-xl transition-all duration-200 cursor-pointer h-full bg-white">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1">
                          <div className={`p-3 rounded-xl ${action.bgColor} border-2 border-gray-100`}>
                            <IconComponent className={`h-7 w-7 ${action.color}`} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <CardTitle className="text-lg text-gray-900">{action.title}</CardTitle>
                              <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                                Live
                              </Badge>
                            </div>
                            <CardDescription className="text-gray-600 text-sm">
                              {action.description}
                            </CardDescription>
                          </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0" />
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                        <span className="text-sm font-medium text-gray-700">{action.stats}</span>
                        <div className="flex items-center gap-2">
                          <Activity className="h-4 w-4 text-green-500" />
                          <span className="text-xs text-green-600">Updated now</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Skill-Based Analytics - Organized by Category */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Skill Analytics</h3>
              <p className="text-gray-600">Detailed insights into student performance by skill area</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {regularActions.map((action) => {
              const IconComponent = action.icon;
              return (
                <Link key={action.href} href={action.href}>
                  <Card className="border border-gray-200 hover:border-gray-400 hover:shadow-lg transition-all duration-200 cursor-pointer h-full bg-white group">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className={`p-2.5 rounded-lg ${action.bgColor} group-hover:scale-110 transition-transform`}>
                          <IconComponent className={`h-5 w-5 ${action.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-sm font-semibold text-gray-900 mb-1">{action.title}</CardTitle>
                          <CardDescription className="text-xs text-gray-600 mb-2 line-clamp-1">
                            {action.description}
                          </CardDescription>
                          <div className="flex items-center justify-between">
                            <Badge variant="secondary" className="text-xs font-medium">
                              {action.stats}
                            </Badge>
                            <ChevronRight className="h-3 w-3 text-gray-400 group-hover:text-blue-500 transition-colors" />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Quick Actions & System Status Footer */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2 border-gray-200 bg-white">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Quick Actions</CardTitle>
                  <CardDescription>Export reports and schedule updates</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                <Button variant="outline" className="gap-2">
                  <Download className="h-4 w-4" />
                  Export Dashboard
                </Button>
                <Button variant="outline" className="gap-2">
                  <Calendar className="h-4 w-4" />
                  Schedule Report
                </Button>
                <Button variant="outline" className="gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Refresh Data
                </Button>
                <Button variant="outline" className="gap-2">
                  <Settings className="h-4 w-4" />
                  Settings
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200 bg-white">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="h-5 w-5 text-green-600" />
                System Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Dashboard</span>
                <Badge className="bg-green-100 text-green-700 border-green-200">Operational</Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Last sync</span>
                <span className="text-gray-900 font-medium">Just now</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Next update</span>
                <span className="text-gray-900 font-medium">5 minutes</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
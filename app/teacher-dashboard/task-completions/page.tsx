'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { format } from "date-fns";
import { 
  Search, 
  ChevronLeft, 
  User, 
  Clock, 
  Eye, 
  TrendingUp, 
  TrendingDown,
  CheckCircle2,
  Target,
  Zap,
  Activity,
  Calendar,
  Trophy,
  Star,
  Flame,
  Award,
  BarChart3,
  FileText,
  Mail,
  Users,
  Hash,
  Timer,
  Coffee,
  Moon
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from 'next/navigation';
import { TaskCompletionsModal } from "@/components/task-completions-modal";

interface StudentTaskMetrics {
  userId: string;
  name: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  totalTasksCompleted: number;
  recentTasksCompleted: number;
  monthlyTasksCompleted: number;
  averageAttempts: number;
  uniqueTasksCompleted: number;
  learningStreak: { current: number; longest: number; lastActive: string | null };
  activityCalendar: { date: string; count: number; level: number }[];
  achievements: any;
  efficiencyMetrics: any;
  timePatterns: any;
  firstCompletion: string | null;
  lastCompletion: string | null;
  activeDays: number;
  efficiencyRating: 'excellent' | 'good' | 'needs-improvement';
  activityLevel: 'high' | 'moderate' | 'low';
  recentCompletionHistory: any[];
}

interface GeneralTrends {
  totalCompletions: number;
  totalUniqueTasks: number;
  totalUniqueUsers: number;
  recentCompletions: number;
  monthlyCompletions: number;
  averageAttempts: number;
  attemptDistribution: { easy: number; medium: number; hard: number };
  dailyActivity: { date: string; completions: number; users: number }[];
  hourlyPatterns: { hour: number; completions: number; users: number }[];
  taskDifficulty: { taskId: string; averageAttempts: number; completionCount: number }[];
  peakActivity: { date: string | null; completions: number };
}

interface DashboardData {
  generalTrends: GeneralTrends;
  studentAnalytics: StudentTaskMetrics[];
  summary: {
    totalStudentsWithCompletions: number;
    totalCompletions: number;
    totalUniqueTasks: number;
    averageCompletionsPerStudent: number;
  };
}

export default function TaskCompletionsDashboard() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [filteredStudents, setFilteredStudents] = useState<StudentTaskMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<StudentTaskMetrics | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'totalTasks' | 'efficiency' | 'streak' | 'recent'>('totalTasks');

  useEffect(() => {
    fetchTaskCompletionsData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [data?.studentAnalytics, searchQuery, sortBy]);

  const fetchTaskCompletionsData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/teacher-dashboard/task-completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationCode: 'default' })
      });
      
      const responseData = await response.json();
      setData(responseData);
    } catch (error) {
      console.error('Error fetching task completions data:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    if (!data?.studentAnalytics) return;
    
    let filtered = [...data.studentAnalytics];
    
    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(student => 
        student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.userId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (student.email && student.email.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    
    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'totalTasks':
          return b.totalTasksCompleted - a.totalTasksCompleted;
        case 'efficiency':
          return a.averageAttempts - b.averageAttempts;
        case 'streak':
          return b.learningStreak.current - a.learningStreak.current;
        case 'recent':
          return new Date(b.lastCompletion || 0).getTime() - new Date(a.lastCompletion || 0).getTime();
        default:
          return 0;
      }
    });
    
    setFilteredStudents(filtered);
  };

  const handleStudentClick = (student: StudentTaskMetrics) => {
    setSelectedStudent(student);
    setIsModalOpen(true);
  };

  const getEfficiencyColor = (rating: string) => {
    switch (rating) {
      case 'excellent': return 'text-green-600';
      case 'good': return 'text-blue-600';
      case 'needs-improvement': return 'text-orange-600';
      default: return 'text-gray-600';
    }
  };

  const getEfficiencyBadgeVariant = (rating: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (rating) {
      case 'excellent': return 'default';
      case 'good': return 'secondary';
      case 'needs-improvement': return 'outline';
      default: return 'destructive';
    }
  };

  const getActivityLevelColor = (level: string) => {
    switch (level) {
      case 'high': return 'text-green-600 bg-green-50';
      case 'moderate': return 'text-blue-600 bg-blue-50';
      case 'low': return 'text-orange-600 bg-orange-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getTrendIcon = (efficiency: string, recent: number) => {
    if (efficiency === 'excellent' || recent >= 5) {
      return <TrendingUp className="h-4 w-4 text-green-500" />;
    } else if (efficiency === 'needs-improvement' || recent === 0) {
      return <TrendingDown className="h-4 w-4 text-red-500" />;
    }
    return <BarChart3 className="h-4 w-4 text-blue-500" />;
  };

  const getStreakIcon = (current: number) => {
    if (current >= 7) return <Flame className="h-4 w-4 text-red-500" />;
    if (current >= 3) return <Zap className="h-4 w-4 text-orange-500" />;
    if (current >= 1) return <Star className="h-4 w-4 text-yellow-500" />;
    return <Clock className="h-4 w-4 text-gray-400" />;
  };

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
          <p className="text-muted-foreground">Failed to load task completions data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Task Completions Dashboard</h1>
          <p className="text-muted-foreground mt-2">Learning progress, achievements, and engagement analytics</p>
        </div>
        <Button 
          variant="ghost" 
          onClick={() => router.push('/teacher-dashboard')}
          className="gap-2"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Main Dashboard
        </Button>
      </div>

      {/* General Trend Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              Total Completions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.generalTrends.totalCompletions}</div>
            <p className="text-xs text-muted-foreground">
              {data.generalTrends.recentCompletions} this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-500" />
              Active Students
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.totalStudentsWithCompletions}</div>
            <p className="text-xs text-muted-foreground">
              Avg {data.summary.averageCompletionsPerStudent} tasks per student
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Target className="h-4 w-4 text-orange-500" />
              Average Attempts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.generalTrends.averageAttempts}</div>
            <p className="text-xs text-muted-foreground">
              per task completion
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Hash className="h-4 w-4 text-gray-600" />
              Unique Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.generalTrends.totalUniqueTasks}</div>
            <p className="text-xs text-muted-foreground">
              completed by students
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Task Difficulty Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Task Difficulty Distribution
          </CardTitle>
          <CardDescription>Success rate by attempt count</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <div>
                  <div className="font-medium text-green-900">Easy Tasks</div>
                  <div className="text-sm text-green-700">1-2 attempts</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-green-900">{data.generalTrends.attemptDistribution.easy}</div>
                <div className="text-xs text-green-600">
                  {Math.round((data.generalTrends.attemptDistribution.easy / data.generalTrends.totalCompletions) * 100)}%
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Target className="h-5 w-5 text-blue-600" />
                <div>
                  <div className="font-medium text-blue-900">Medium Tasks</div>
                  <div className="text-sm text-blue-700">3-4 attempts</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-blue-900">{data.generalTrends.attemptDistribution.medium}</div>
                <div className="text-xs text-blue-600">
                  {Math.round((data.generalTrends.attemptDistribution.medium / data.generalTrends.totalCompletions) * 100)}%
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Zap className="h-5 w-5 text-orange-600" />
                <div>
                  <div className="font-medium text-orange-900">Hard Tasks</div>
                  <div className="text-sm text-orange-700">5+ attempts</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-orange-900">{data.generalTrends.attemptDistribution.hard}</div>
                <div className="text-xs text-orange-600">
                  {Math.round((data.generalTrends.attemptDistribution.hard / data.generalTrends.totalCompletions) * 100)}%
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters & Search</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="col-span-2">
              <Label htmlFor="search">Search Students</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by name, email, or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="sort">Sort By</Label>
              <Select value={sortBy} onValueChange={(value: typeof sortBy) => setSortBy(value)}>
                <SelectTrigger id="sort">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="totalTasks">Total Tasks</SelectItem>
                  <SelectItem value="efficiency">Efficiency</SelectItem>
                  <SelectItem value="streak">Learning Streak</SelectItem>
                  <SelectItem value="recent">Most Recent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Student Cards */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">
            {filteredStudents.length} Student{filteredStudents.length !== 1 ? 's' : ''} with Task Completions
          </h2>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <FileText className="h-4 w-4" />
            {data.generalTrends.totalCompletions} Total Completions
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
          {filteredStudents.map((student) => (
            <Card 
              key={student.userId} 
              className="hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 cursor-pointer border border-gray-200 shadow-md bg-white relative"
              onClick={() => handleStudentClick(student)}
            >
              
              <CardHeader className="relative pb-4">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-blue-600 text-white text-lg font-bold">
                        {student.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg font-bold text-gray-900">{student.name}</CardTitle>
                      <CardDescription className="text-sm space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">ANB</Badge>
                          <Badge variant={getEfficiencyBadgeVariant(student.efficiencyRating)} className="text-xs font-medium">
                            {student.efficiencyRating}
                          </Badge>
                        </div>
                        {student.email && (
                          <div className="flex items-center gap-1 text-muted-foreground mt-1">
                            <Mail className="h-3 w-3" />
                            <span className="truncate text-xs">{student.email}</span>
                          </div>
                        )}
                      </CardDescription>
                    </div>
                  </div>
                  {getTrendIcon(student.efficiencyRating, student.recentTasksCompleted)}
                </div>

                {/* Key Stats Row */}
                <div className="grid grid-cols-3 gap-4 p-4 bg-white/60 rounded-lg border">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{student.totalTasksCompleted}</div>
                    <div className="text-xs text-muted-foreground">Tasks Completed</div>
                  </div>
                  <div className="text-center border-x border-gray-200">
                    <div className="text-2xl font-bold text-green-600">{student.averageAttempts}</div>
                    <div className="text-xs text-muted-foreground">Avg Attempts</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{student.efficiencyMetrics.successRate}%</div>
                    <div className="text-xs text-muted-foreground">Success Rate</div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="relative space-y-4">
                {/* Learning Streak Section */}
                <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getStreakIcon(student.learningStreak.current)}
                      <span className="font-medium text-sm">Learning Streak</span>
                    </div>
                    <Badge variant="destructive" className="bg-orange-500">
                      {student.learningStreak.current} day{student.learningStreak.current !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Longest: {student.learningStreak.longest} days</span>
                    <span>Last: {student.learningStreak.lastActive ? format(new Date(student.learningStreak.lastActive), 'MMM dd') : 'N/A'}</span>
                  </div>
                  <Progress 
                    value={Math.min((student.learningStreak.current / Math.max(student.learningStreak.longest, 1)) * 100, 100)} 
                    className="h-2 mt-2" 
                  />
                </div>

                {/* Activity & Performance */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2 mb-1">
                      <Activity className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium">Recent Activity</span>
                    </div>
                    <div className="text-lg font-bold text-blue-700">{student.recentTasksCompleted}</div>
                    <div className="text-xs text-blue-600">tasks this week</div>
                  </div>

                  <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                    <div className="flex items-center gap-2 mb-1">
                      <Target className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium">Active Days</span>
                    </div>
                    <div className="text-lg font-bold text-green-700">{student.activeDays}</div>
                    <div className="text-xs text-green-600">total days</div>
                  </div>
                </div>

                {/* Mini Activity Calendar Preview */}
                <div className="bg-gray-50 p-3 rounded-lg border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Activity Heatmap</span>
                    <Badge className={cn("text-xs", getActivityLevelColor(student.activityLevel))}>
                      {student.activityLevel}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-10 gap-1">
                    {student.activityCalendar.slice(-30).map((day, index) => (
                      <div
                        key={index}
                        className={cn(
                          "w-3 h-3 rounded-sm",
                          day.level === 0 ? "bg-gray-200" :
                          day.level === 1 ? "bg-green-200" :
                          day.level === 2 ? "bg-green-300" :
                          day.level === 3 ? "bg-green-400" : "bg-green-500"
                        )}
                        title={`${day.date}: ${day.count} tasks`}
                      />
                    ))}
                  </div>
                </div>

                {/* Achievements Showcase */}
                <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Trophy className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm font-medium">Top Achievements</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {student.achievements.speedRunner > 0 && (
                      <div className="flex items-center gap-1 bg-white/60 px-2 py-1 rounded">
                        <Zap className="h-3 w-3 text-yellow-600" />
                        <span className="text-xs font-medium">Speed x{student.achievements.speedRunner}</span>
                      </div>
                    )}
                    {student.achievements.persistent > 0 && (
                      <div className="flex items-center gap-1 bg-white/60 px-2 py-1 rounded">
                        <Trophy className="h-3 w-3 text-yellow-600" />
                        <span className="text-xs font-medium">Persistent x{student.achievements.persistent}</span>
                      </div>
                    )}
                    {student.achievements.taskMaster && (
                      <div className="flex items-center gap-1 bg-white/60 px-2 py-1 rounded">
                        <Award className="h-3 w-3 text-yellow-600" />
                        <span className="text-xs font-medium">Task Master</span>
                      </div>
                    )}
                    {student.achievements.efficient && (
                      <div className="flex items-center gap-1 bg-white/60 px-2 py-1 rounded">
                        <Star className="h-3 w-3 text-yellow-600" />
                        <span className="text-xs font-medium">Efficient</span>
                      </div>
                    )}
                    {student.achievements.earlyBird > 0 && (
                      <div className="flex items-center gap-1 bg-white/60 px-2 py-1 rounded">
                        <Coffee className="h-3 w-3 text-yellow-600" />
                        <span className="text-xs font-medium">Early Bird</span>
                      </div>
                    )}
                    {student.achievements.nightOwl > 0 && (
                      <div className="flex items-center gap-1 bg-white/60 px-2 py-1 rounded">
                        <Moon className="h-3 w-3 text-yellow-600" />
                        <span className="text-xs font-medium">Night Owl</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Performance Insights */}
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-2 mb-2">
                    <BarChart3 className="h-4 w-4 text-gray-600" />
                    <span className="text-sm font-medium">Performance Insights</span>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Peak Learning:</span>
                      <span className="font-medium">{student.timePatterns.peakDay}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Improvement:</span>
                      <span className={cn("font-medium", 
                        student.efficiencyMetrics.improvement > 0 ? "text-green-600" : 
                        student.efficiencyMetrics.improvement < 0 ? "text-red-600" : "text-gray-600"
                      )}>
                        {student.efficiencyMetrics.improvement > 0 ? '+' : ''}{student.efficiencyMetrics.improvement}%
                      </span>
                    </div>
                    {student.lastCompletion && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Last Activity:</span>
                        <span className="font-medium">{format(new Date(student.lastCompletion), 'MMM dd')}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Button */}
                <Button 
                  variant="default" 
                  size="lg" 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStudentClick(student);
                  }}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View Detailed Analytics
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Task Completions Modal */}
      <TaskCompletionsModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedStudent(null);
        }}
        student={selectedStudent}
      />
    </div>
  );
}
'use client';

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { format } from "date-fns";
import { 
  CheckCircle2, 
  Target, 
  TrendingUp,
  TrendingDown,
  Calendar,
  User,
  Trophy,
  Star,
  CheckCircle,
  XCircle,
  Clock,
  Flame,
  Zap,
  Award,
  Coffee,
  Moon,
  Activity,
  BarChart3,
  Hash,
  Timer,
  MessageCircle,
  ArrowRight,
  Users
} from "lucide-react";
import { cn } from "@/lib/utils";

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

interface TaskCompletionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: StudentTaskMetrics | null;
}

export function TaskCompletionsModal({ isOpen, onClose, student }: TaskCompletionsModalProps) {
  if (!student) return null;

  const getEfficiencyColor = (rating: string) => {
    switch (rating) {
      case 'excellent': return 'text-green-700 bg-green-50';
      case 'good': return 'text-blue-700 bg-blue-50';
      case 'needs-improvement': return 'text-orange-700 bg-orange-50';
      default: return 'text-gray-700 bg-gray-50';
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
      case 'high': return 'text-green-700 bg-green-50';
      case 'moderate': return 'text-blue-700 bg-blue-50';
      case 'low': return 'text-orange-700 bg-orange-50';
      default: return 'text-gray-700 bg-gray-50';
    }
  };

  const getStreakIcon = (current: number) => {
    if (current >= 7) return <Flame className="h-4 w-4 text-red-500" />;
    if (current >= 3) return <Zap className="h-4 w-4 text-orange-500" />;
    if (current >= 1) return <Star className="h-4 w-4 text-yellow-500" />;
    return <Clock className="h-4 w-4 text-gray-400" />;
  };

  const getCalendarCellColor = (level: number) => {
    switch (level) {
      case 0: return 'bg-gray-100';
      case 1: return 'bg-green-200';
      case 2: return 'bg-green-300';
      case 3: return 'bg-green-400';
      case 4: return 'bg-green-500';
      default: return 'bg-gray-100';
    }
  };

  const getTimeIcon = (hour: number) => {
    if (hour >= 6 && hour < 12) return <Coffee className="h-4 w-4 text-orange-500" />;
    if (hour >= 12 && hour < 18) return <Clock className="h-4 w-4 text-blue-500" />;
    if (hour >= 18 && hour < 22) return <Activity className="h-4 w-4 text-purple-500" />;
    return <Moon className="h-4 w-4 text-indigo-500" />;
  };

  const formatHour = (hour: number) => {
    if (hour === 0) return '12 AM';
    if (hour < 12) return `${hour} AM`;
    if (hour === 12) return '12 PM';
    return `${hour - 12} PM`;
  };

  const formatDuration = (milliseconds: number) => {
    const minutes = Math.floor(milliseconds / (1000 * 60));
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[95vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              Task Completion Analytics - {student.name}
            </div>
            <Badge variant={getEfficiencyBadgeVariant(student.efficiencyRating)} className="text-lg px-3 py-1">
              {student.efficiencyRating.charAt(0).toUpperCase() + student.efficiencyRating.slice(1)} Performance
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Detailed task completion analytics, learning patterns, and achievement tracking
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[calc(95vh-120px)]">
          <div className="space-y-4 pr-4">
            {/* Student Overview */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Student Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <User className="h-3 w-3 text-muted-foreground" />
                      <span className="text-muted-foreground">Student:</span>
                      <span className="font-medium">{student.name}</span>
                    </div>
                    {student.email && (
                      <div className="flex items-center gap-2">
                        <MessageCircle className="h-3 w-3 text-muted-foreground" />
                        <span className="text-muted-foreground">Email:</span>
                        <span className="font-medium">{student.email}</span>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-3 w-3 text-muted-foreground" />
                      <span className="text-muted-foreground">Tasks Completed:</span>
                      <span className="font-medium">{student.totalTasksCompleted}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      <span className="text-muted-foreground">Active Days:</span>
                      <span className="font-medium">{student.activeDays} days</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5 h-auto">
                <TabsTrigger value="overview" className="text-xs px-2 py-2">Overview</TabsTrigger>
                <TabsTrigger value="calendar" className="text-xs px-2 py-2">Activity</TabsTrigger>
                <TabsTrigger value="achievements" className="text-xs px-2 py-2">Achievements</TabsTrigger>
                <TabsTrigger value="patterns" className="text-xs px-2 py-2">Patterns</TabsTrigger>
                <TabsTrigger value="history" className="text-xs px-2 py-2">History</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Performance Metrics */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <BarChart3 className="h-4 w-4" />
                        Performance Metrics
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="text-center">
                          <div className="text-2xl font-bold">{student.totalTasksCompleted}</div>
                          <div className="text-muted-foreground">Total Tasks</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold">{student.averageAttempts}</div>
                          <div className="text-muted-foreground">Avg Attempts</div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>This Week</span>
                          <span className="font-bold">{student.recentTasksCompleted}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>This Month</span>
                          <span className="font-bold">{student.monthlyTasksCompleted}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Success Rate</span>
                          <span className="font-bold">{student.efficiencyMetrics.successRate}%</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Learning Streak */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        {getStreakIcon(student.learningStreak.current)}
                        Learning Streak
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="text-center">
                        <Badge variant="default" className="text-3xl font-bold px-4 py-2">
                          {student.learningStreak.current} day{student.learningStreak.current !== 1 ? 's' : ''}
                        </Badge>
                        <div className="text-sm text-muted-foreground mt-2">
                          Current streak
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Longest Streak</span>
                          <span className="text-sm font-bold">{student.learningStreak.longest} days</span>
                        </div>
                        <Progress value={Math.min((student.learningStreak.current / Math.max(student.learningStreak.longest, 1)) * 100, 100)} className="h-2" />
                        {student.learningStreak.lastActive && (
                          <div className="text-xs text-muted-foreground">
                            Last active: {format(new Date(student.learningStreak.lastActive), 'MMM dd, yyyy')}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Efficiency Analysis */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      Efficiency Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-xl font-bold">{student.efficiencyMetrics.successRate}%</div>
                        <div className="text-xs text-muted-foreground">Success Rate</div>
                        <div className="text-xs text-muted-foreground">(1-2 attempts)</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-bold">{student.averageAttempts}</div>
                        <div className="text-xs text-muted-foreground">Average Attempts</div>
                        <Badge className={cn("text-xs mt-1", getEfficiencyColor(student.efficiencyRating))}>
                          {student.efficiencyRating}
                        </Badge>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-bold">
                          {student.efficiencyMetrics.improvement > 0 ? '+' : ''}{student.efficiencyMetrics.improvement}%
                        </div>
                        <div className="text-xs text-muted-foreground">Improvement</div>
                        <div className="text-xs text-muted-foreground">(recent vs early)</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Activity Calendar Tab */}
              <TabsContent value="calendar" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Activity Calendar (Last 90 Days)
                    </CardTitle>
                    <div className="text-sm text-muted-foreground">
                      Daily task completion activity
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Calendar Grid */}
                      <div className="grid grid-cols-13 gap-1 text-xs">
                        {student.activityCalendar.map((day, index) => (
                          <div
                            key={day.date}
                            className={cn(
                              "w-3 h-3 rounded-sm",
                              getCalendarCellColor(day.level)
                            )}
                            title={`${day.date}: ${day.count} tasks`}
                          />
                        ))}
                      </div>
                      
                      {/* Legend */}
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Less</span>
                        <div className="flex items-center gap-1">
                          <div className="w-3 h-3 rounded-sm bg-gray-100"></div>
                          <div className="w-3 h-3 rounded-sm bg-green-200"></div>
                          <div className="w-3 h-3 rounded-sm bg-green-300"></div>
                          <div className="w-3 h-3 rounded-sm bg-green-400"></div>
                          <div className="w-3 h-3 rounded-sm bg-green-500"></div>
                        </div>
                        <span className="text-muted-foreground">More</span>
                      </div>

                      {/* Activity Summary */}
                      <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                        <div className="text-center">
                          <div className="text-lg font-bold">{student.activeDays}</div>
                          <div className="text-xs text-muted-foreground">Active Days</div>
                        </div>
                        <div className="text-center">
                          <Badge className={cn("text-sm", getActivityLevelColor(student.activityLevel))}>
                            {student.activityLevel} activity
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Achievements Tab */}
              <TabsContent value="achievements" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Achievement Badges */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Trophy className="h-4 w-4" />
                        Achievement Badges
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex items-center gap-2 p-2 bg-yellow-50 rounded">
                          <Zap className="h-4 w-4 text-yellow-600" />
                          <div>
                            <div className="font-medium text-xs">Speed Runner</div>
                            <div className="text-xs text-muted-foreground">{student.achievements.speedRunner} tasks</div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 p-2 bg-blue-50 rounded">
                          <Trophy className="h-4 w-4 text-blue-600" />
                          <div>
                            <div className="font-medium text-xs">Persistent</div>
                            <div className="text-xs text-muted-foreground">{student.achievements.persistent} tasks</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 p-2 bg-orange-50 rounded">
                          <Coffee className="h-4 w-4 text-orange-600" />
                          <div>
                            <div className="font-medium text-xs">Early Bird</div>
                            <div className="text-xs text-muted-foreground">{student.achievements.earlyBird} tasks</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 p-2 bg-purple-50 rounded">
                          <Moon className="h-4 w-4 text-purple-600" />
                          <div>
                            <div className="font-medium text-xs">Night Owl</div>
                            <div className="text-xs text-muted-foreground">{student.achievements.nightOwl} tasks</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 p-2 bg-green-50 rounded">
                          <Users className="h-4 w-4 text-green-600" />
                          <div>
                            <div className="font-medium text-xs">Weekend Warrior</div>
                            <div className="text-xs text-muted-foreground">{student.achievements.weekendWarrior} tasks</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 p-2 bg-red-50 rounded">
                          <Award className="h-4 w-4 text-red-600" />
                          <div>
                            <div className="font-medium text-xs">Task Master</div>
                            <div className="text-xs text-muted-foreground">{student.achievements.taskMaster ? 'Achieved' : 'In Progress'}</div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Special Achievements */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Star className="h-4 w-4" />
                        Special Recognition
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {student.achievements.efficient && (
                        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded">
                          <CheckCircle className="h-5 w-5 text-green-600" />
                          <div>
                            <div className="font-medium text-sm text-green-900">Efficiency Expert</div>
                            <div className="text-xs text-green-700">Maintains excellent success rate</div>
                          </div>
                        </div>
                      )}
                      
                      {student.achievements.taskMaster && (
                        <div className="flex items-center gap-2 p-3 bg-purple-50 border border-purple-200 rounded">
                          <Award className="h-5 w-5 text-purple-600" />
                          <div>
                            <div className="font-medium text-sm text-purple-900">Task Master</div>
                            <div className="text-xs text-purple-700">Completed 50+ tasks</div>
                          </div>
                        </div>
                      )}

                      {student.learningStreak.current >= 7 && (
                        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded">
                          <Flame className="h-5 w-5 text-red-600" />
                          <div>
                            <div className="font-medium text-sm text-red-900">On Fire!</div>
                            <div className="text-xs text-red-700">7+ day learning streak</div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Time Patterns Tab */}
              <TabsContent value="patterns" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Peak Hours */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Learning Time Patterns
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-2 mb-2">
                          {getTimeIcon(student.timePatterns.peakHour)}
                          <span className="font-bold text-lg">{formatHour(student.timePatterns.peakHour)}</span>
                        </div>
                        <div className="text-sm text-muted-foreground">Most active hour</div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Preferred Day</span>
                          <span className="font-bold">{student.timePatterns.peakDay}</span>
                        </div>
                      </div>

                      {/* Time Distribution */}
                      <div className="pt-2 border-t">
                        <div className="text-xs text-muted-foreground mb-2">Hourly Activity Distribution</div>
                        <div className="grid grid-cols-12 gap-1">
                          {student.timePatterns.hourlyDistribution.map((count, hour) => (
                            <div
                              key={hour}
                              className="h-8 bg-blue-100 rounded-sm flex items-end justify-center"
                              title={`${formatHour(hour)}: ${count} tasks`}
                            >
                              <div
                                className="w-full bg-blue-500 rounded-sm"
                                style={{
                                  height: `${Math.max((count / Math.max(...student.timePatterns.hourlyDistribution)) * 100, 5)}%`
                                }}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Learning Insights */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Activity className="h-4 w-4" />
                        Learning Insights
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="space-y-2">
                        {student.efficiencyRating === 'excellent' && (
                          <div className="flex items-center gap-2 text-green-700 bg-green-50 p-2 rounded">
                            <ArrowRight className="h-3 w-3" />
                            <span className="text-sm">Excellent task completion efficiency</span>
                          </div>
                        )}
                        
                        {student.learningStreak.current >= 3 && (
                          <div className="flex items-center gap-2 text-blue-700 bg-blue-50 p-2 rounded">
                            <ArrowRight className="h-3 w-3" />
                            <span className="text-sm">Strong learning consistency</span>
                          </div>
                        )}
                        
                        {student.recentTasksCompleted > 5 && (
                          <div className="flex items-center gap-2 text-purple-700 bg-purple-50 p-2 rounded">
                            <ArrowRight className="h-3 w-3" />
                            <span className="text-sm">High recent activity</span>
                          </div>
                        )}

                        {student.achievements.earlyBird > 0 && (
                          <div className="flex items-center gap-2 text-orange-700 bg-orange-50 p-2 rounded">
                            <ArrowRight className="h-3 w-3" />
                            <span className="text-sm">Prefers morning learning sessions</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Recent History Tab */}
              <TabsContent value="history" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Recent Task Completions</CardTitle>
                    <div className="text-sm text-muted-foreground">
                      Last {Math.min(student.recentCompletionHistory.length, 20)} completed tasks
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[400px]">
                      <div className="space-y-3">
                        {student.recentCompletionHistory.map((completion, index) => (
                          <Card key={index} className="p-3">
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-xs">
                                    Task #{completion.taskId.slice(-8)}
                                  </Badge>
                                  <Badge variant={completion.attempts === 1 ? "default" : completion.attempts <= 3 ? "secondary" : "destructive"} className="text-xs">
                                    {completion.attempts} attempt{completion.attempts !== 1 ? 's' : ''}
                                  </Badge>
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {format(new Date(completion.completedAt), 'MMM dd, HH:mm')}
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <div className="text-xs text-muted-foreground">Time to Complete</div>
                                  <div className="font-medium">{formatDuration(completion.timeToComplete)}</div>
                                </div>
                                <div>
                                  <div className="text-xs text-muted-foreground">Efficiency</div>
                                  <div className="font-medium">
                                    {completion.attempts === 1 ? 'Perfect' : completion.attempts <= 2 ? 'Good' : 'Needs Work'}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
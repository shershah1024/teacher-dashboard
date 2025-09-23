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
  MessageSquare,
  Users,
  FileText, 
  BarChart3, 
  MessageCircle,
  Mail,
  Target,
  Activity,
  Calendar,
  Zap,
  Timer,
  Hash
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from 'next/navigation';
import { DiscourseAnalysisModal } from "@/components/discourse-analysis-modal";

interface StudentDiscourse {
  userId: string;
  name: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  totalMessages: number;
  totalUserMessages: number;
  totalConversations: number;
  recentMessages: number;
  monthlyMessages: number;
  averageMessageLength: number;
  averageConversationLength: number;
  conversationFrequency: number;
  engagementScore: number;
  sourceBreakdown: { speaking: number; chatbot: number };
  mostRecentActivity: string | null;
  detailedConversations: any[];
  conversationMetrics: any[];
}

interface GeneralTrends {
  totalMessages: number;
  totalConversations: number;
  recentMessages: number;
  monthlyMessages: number;
  averageConversationLength: number;
  averageMessageLength: number;
  sourceDistribution: { speaking: number; chatbot: number };
  messagesByRole: { user: number; assistant: number };
  conversationLengthDistribution: Record<string, number>;
  dailyActivity: { date: string; count: number }[];
  turnTakingAnalysis: Record<string, number>;
}

interface DashboardData {
  generalTrends: GeneralTrends;
  studentAnalysis: StudentDiscourse[];
  summary: {
    totalStudentsWithActivity: number;
    totalConversations: number;
    totalMessages: number;
    averageMessagesPerStudent: number;
  };
}

export default function DiscourseAnalysisDashboard() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [filteredStudents, setFilteredStudents] = useState<StudentDiscourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<StudentDiscourse | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'totalMessages' | 'engagement' | 'recent'>('totalMessages');

  useEffect(() => {
    fetchDiscourseData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [data?.studentAnalysis, searchQuery, sortBy]);

  const fetchDiscourseData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/teacher-dashboard/discourse-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationCode: 'ANB' })
      });
      
      const responseData = await response.json();
      setData(responseData);
    } catch (error) {
      console.error('Error fetching discourse analysis data:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    if (!data?.studentAnalysis) return;
    
    let filtered = [...data.studentAnalysis];
    
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
        case 'totalMessages':
          return b.totalMessages - a.totalMessages;
        case 'engagement':
          return b.engagementScore - a.engagementScore;
        case 'recent':
          return new Date(b.mostRecentActivity || 0).getTime() - new Date(a.mostRecentActivity || 0).getTime();
        default:
          return 0;
      }
    });
    
    setFilteredStudents(filtered);
  };

  const handleStudentClick = (student: StudentDiscourse) => {
    setSelectedStudent(student);
    setIsModalOpen(true);
  };

  const getEngagementColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getEngagementBadgeVariant = (score: number): "default" | "secondary" | "destructive" | "outline" => {
    if (score >= 80) return 'default';
    if (score >= 60) return 'secondary';
    if (score >= 40) return 'outline';
    return 'destructive';
  };

  const getTurnTakingIcon = (pattern: string) => {
    switch (pattern) {
      case 'highly-interactive': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'interactive': return <Activity className="h-4 w-4 text-blue-500" />;
      case 'moderate': return <BarChart3 className="h-4 w-4 text-orange-500" />;
      default: return <TrendingDown className="h-4 w-4 text-red-500" />;
    }
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
          <p className="text-muted-foreground">Failed to load discourse analysis data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Enhanced Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="container mx-auto p-6 max-w-7xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-gray-900">Discourse Analysis Dashboard</h1>
              <p className="text-gray-600 mt-2">Conversation patterns, engagement, and communication analytics</p>
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

          {/* Real-time Stats Bar */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-indigo-600">{data.summary.totalStudentsWithActivity}</div>
                  <div className="text-sm text-indigo-700">Active Students</div>
                </div>
                <Users className="h-8 w-8 text-indigo-500" />
              </div>
            </div>
            
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-blue-600">{data.generalTrends.totalConversations}</div>
                  <div className="text-sm text-blue-700">Conversations</div>
                </div>
                <MessageCircle className="h-8 w-8 text-blue-500" />
              </div>
            </div>
            
            <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-emerald-600">{data.generalTrends.totalMessages}</div>
                  <div className="text-sm text-emerald-700">Total Messages</div>
                </div>
                <MessageSquare className="h-8 w-8 text-emerald-500" />
              </div>
            </div>
            
            <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-amber-600">{data.generalTrends.averageMessageLength}</div>
                  <div className="text-sm text-amber-700">Avg Message Length</div>
                </div>
                <Hash className="h-8 w-8 text-amber-500" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto p-6 max-w-7xl space-y-6">


      {/* Conversation Analytics Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Conversation Length Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Conversation Length Distribution
            </CardTitle>
            <CardDescription>Distribution of conversation lengths by message count</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(data.generalTrends.conversationLengthDistribution).map(([range, count]) => {
                const percentage = data.generalTrends.totalConversations > 0 
                  ? Math.round((count / data.generalTrends.totalConversations) * 100) 
                  : 0;
                
                return (
                  <div key={range} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium w-20">{range}</span>
                      <Progress value={percentage} className="h-2 w-32" />
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold">{count}</div>
                      <div className="text-xs text-muted-foreground">{percentage}%</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Turn-Taking Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Turn-Taking Patterns
            </CardTitle>
            <CardDescription>Interaction patterns in conversations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(data.generalTrends.turnTakingAnalysis).map(([pattern, count]) => {
                const percentage = data.generalTrends.totalConversations > 0 
                  ? Math.round((count / data.generalTrends.totalConversations) * 100) 
                  : 0;
                
                return (
                  <div key={pattern} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getTurnTakingIcon(pattern)}
                      <span className="text-sm font-medium capitalize">{pattern.replace('-', ' ')}</span>
                      <Progress value={percentage} className="h-2 w-24" />
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold">{count}</div>
                      <div className="text-xs text-muted-foreground">{percentage}%</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

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
                  <SelectItem value="totalMessages">Total Messages</SelectItem>
                  <SelectItem value="engagement">Engagement Score</SelectItem>
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
            {filteredStudents.length} Student{filteredStudents.length !== 1 ? 's' : ''}
          </h2>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <FileText className="h-4 w-4" />
            {data.generalTrends.totalMessages} Total Messages
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStudents.map((student) => (
            <Card 
              key={student.userId} 
              className="hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 cursor-pointer border border-gray-200 shadow-md bg-white relative"
              onClick={() => handleStudentClick(student)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback className="bg-primary/10 text-primary">
                        <MessageSquare className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base">{student.name}</CardTitle>
                      <CardDescription className="text-xs space-y-1">
                        <div>ANB</div>
                        {student.email && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            <span className="truncate">{student.email}</span>
                          </div>
                        )}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant={getEngagementBadgeVariant(student.engagementScore)} className="text-xs">
                    {student.engagementScore}%
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-muted-foreground">Messages</p>
                    <p className="font-semibold text-lg">{student.totalMessages}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Conversations</p>
                    <p className="font-semibold text-lg">{student.totalConversations}</p>
                  </div>
                </div>
                
                <div className="pt-3 border-t">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Avg Message Length</span>
                    <span className="font-bold">{student.averageMessageLength} words</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Avg Conversation</span>
                    <span className="font-bold">{student.averageConversationLength} messages</span>
                  </div>
                </div>

                <div className="pt-2">
                  <p className="text-xs text-muted-foreground mb-2">Activity Sources:</p>
                  <div className="flex gap-2">
                    {student.sourceBreakdown.speaking > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        Speaking: {student.sourceBreakdown.speaking}
                      </Badge>
                    )}
                    {student.sourceBreakdown.chatbot > 0 && (
                      <Badge variant="outline" className="text-xs">
                        Chatbot: {student.sourceBreakdown.chatbot}
                      </Badge>
                    )}
                  </div>
                </div>

                {student.mostRecentActivity && (
                  <div className="pt-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3 inline mr-1" />
                    Last activity: {format(new Date(student.mostRecentActivity), 'MMM dd, yyyy')}
                  </div>
                )}
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStudentClick(student);
                  }}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View Discourse Analysis
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Discourse Analysis Modal */}
      <DiscourseAnalysisModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedStudent(null);
        }}
        student={selectedStudent}
      />
      </div>
    </div>
  );
}
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
  AlertTriangle,
  CheckCircle2,
  FileText, 
  BarChart3, 
  BookOpen,
  Mail,
  Target,
  Zap,
  Activity,
  Calendar,
  XCircle,
  Users
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from 'next/navigation';
import { GrammarErrorModal } from "@/components/grammar-error-modal";

interface ErrorType {
  type: string;
  count: number;
  percentage?: number;
}

interface StudentCard {
  userId: string;
  name: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  totalErrors: number;
  recentErrors: number;
  monthlyErrors: number;
  trend: 'improving' | 'declining' | 'stable';
  topErrorTypes: ErrorType[];
  severityDistribution: { LOW: number; MEDIUM: number; HIGH: number; UNKNOWN: number };
  errorTypeDistribution: Record<string, number>;
  averageErrorsPerWeek: number;
  mostRecentError: string | null;
  recentErrorsDetail: any[];
  improvementScore: number;
  grammarCategoryDistribution: Record<string, number>;
  grammarInsights: GermanGrammarInsights;
}

interface GermanGrammarInsights {
  mostChallengingArea: string;
  difficultyScore: number;
  caseSystemPercentage: number;
  verbSystemPercentage: number;
  recommendations: string[];
  learningPath: string[];
}

interface GeneralTrends {
  totalErrors: number;
  recentErrors: number;
  monthlyErrors: number;
  errorTypeDistribution: Record<string, number>;
  grammarCategoryDistribution: Record<string, number>;
  severityDistribution: { LOW: number; MEDIUM: number; HIGH: number; UNKNOWN: number };
  sourceTypeDistribution: Record<string, number>;
  topErrorTypes: ErrorType[];
  weeklyTrend: { week: string; errors: number; startDate: string }[];
  problematicAreas: { type: string; score: number; count: number; averageImpact: number }[];
  germanGrammarInsights: GermanGrammarInsights;
}

interface DashboardData {
  generalTrends: GeneralTrends;
  studentCards: StudentCard[];
  summary: {
    totalStudentsWithErrors: number;
    totalErrors: number;
    averageErrorsPerStudent: number;
  };
}

export default function GrammarErrorsDashboard() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [filteredCards, setFilteredCards] = useState<StudentCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<StudentCard | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'totalErrors' | 'recent' | 'improvement'>('totalErrors');

  useEffect(() => {
    fetchGrammarErrorsData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [data?.studentCards, searchQuery, sortBy]);

  const fetchGrammarErrorsData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/teacher-dashboard/grammar-errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationCode: 'ANB' })
      });
      
      const responseData = await response.json();
      setData(responseData);
    } catch (error) {
      console.error('Error fetching grammar errors data:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    if (!data?.studentCards) return;
    
    let filtered = [...data.studentCards];
    
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
        case 'totalErrors':
          return b.totalErrors - a.totalErrors;
        case 'recent':
          return new Date(b.mostRecentError || 0).getTime() - new Date(a.mostRecentError || 0).getTime();
        case 'improvement':
          return b.improvementScore - a.improvementScore;
        default:
          return 0;
      }
    });
    
    setFilteredCards(filtered);
  };

  const handleStudentClick = (student: StudentCard) => {
    setSelectedStudent(student);
    setIsModalOpen(true);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toUpperCase()) {
      case 'HIGH': return 'text-red-600 bg-red-50';
      case 'MEDIUM': return 'text-orange-600 bg-orange-50';
      case 'LOW': return 'text-yellow-600 bg-yellow-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getTrendIcon = (trend: string, improvementScore: number) => {
    if (trend === 'improving' || improvementScore > 20) {
      return <TrendingUp className="h-4 w-4 text-green-500" />;
    } else if (trend === 'declining' || improvementScore < -20) {
      return <TrendingDown className="h-4 w-4 text-red-500" />;
    }
    return <BarChart3 className="h-4 w-4 text-blue-500" />;
  };

  const getImprovementScoreColor = (score: number) => {
    if (score > 20) return 'text-green-700 bg-green-50';
    if (score > 0) return 'text-blue-700 bg-blue-50';
    if (score > -20) return 'text-orange-700 bg-orange-50';
    return 'text-red-700 bg-red-50';
  };

  const getImprovementScoreBadgeVariant = (score: number): "default" | "secondary" | "destructive" | "outline" => {
    if (score > 20) return 'default'; // Green
    if (score > 0) return 'secondary'; // Blue
    if (score > -20) return 'outline'; // Orange
    return 'destructive'; // Red
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
          <p className="text-muted-foreground">Failed to load grammar errors data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Grammar Errors Dashboard</h1>
          <p className="text-muted-foreground mt-2">Grammar mistake analysis and student improvement tracking</p>
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
              <AlertTriangle className="h-4 w-4 text-red-500" />
              Total Errors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.generalTrends.totalErrors}</div>
            <p className="text-xs text-muted-foreground">
              {data.generalTrends.recentErrors} this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-500" />
              Students with Errors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.totalStudentsWithErrors}</div>
            <p className="text-xs text-muted-foreground">
              Avg {data.summary.averageErrorsPerStudent} errors/student
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Target className="h-4 w-4 text-orange-500" />
              Most Challenging Area
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">
              {data.generalTrends.germanGrammarInsights.mostChallengingArea || 'None'}
            </div>
            <p className="text-xs text-muted-foreground">
              Difficulty: {data.generalTrends.germanGrammarInsights.difficultyScore}/10
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Activity className="h-4 w-4 text-green-500" />
              Weekly Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">
              {data.generalTrends.weeklyTrend[3]?.errors || 0} errors
            </div>
            <p className="text-xs text-muted-foreground">
              This week
            </p>
          </CardContent>
        </Card>
      </div>

      {/* German Grammar Category Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            German Grammar Analysis
          </CardTitle>
          <CardDescription>Breakdown by German grammar categories</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(data.generalTrends.grammarCategoryDistribution).map(([category, count]) => {
              const percentage = data.generalTrends.totalErrors > 0 
                ? Math.round((count / data.generalTrends.totalErrors) * 100) 
                : 0;
              
              const getCategoryColor = (cat: string) => {
                switch (cat) {
                  case 'Case System': return 'text-red-600 bg-red-50';
                  case 'Verb System': return 'text-orange-600 bg-orange-50';
                  case 'Sentence Structure': return 'text-blue-600 bg-blue-50';
                  case 'Word Formation': return 'text-green-600 bg-green-50';
                  default: return 'text-gray-600 bg-gray-50';
                }
              };
              
              if (count === 0) return null;
              
              return (
                <div key={category} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                  <div className="flex items-center gap-3">
                    <Badge className={cn("text-xs", getCategoryColor(category))}>
                      {category}
                    </Badge>
                    <div>
                      <div className="text-sm font-medium">{count} errors</div>
                      <Progress value={percentage} className="h-1 w-20 mt-1" />
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold">{percentage}%</div>
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Key Insights */}
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
              <div>
                <h5 className="font-medium text-sm text-yellow-800">Key Insights</h5>
                <div className="text-sm text-yellow-700 mt-1">
                  <p>Case System: {data.generalTrends.germanGrammarInsights.caseSystemPercentage}% of all errors</p>
                  <p>Verb System: {data.generalTrends.germanGrammarInsights.verbSystemPercentage}% of all errors</p>
                  {data.generalTrends.germanGrammarInsights.caseSystemPercentage > 30 && (
                    <p className="mt-1 font-medium">⚠️ High case system error rate indicates need for focused der/die/das practice</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Error Types Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Error Type Analysis
          </CardTitle>
          <CardDescription>Most common grammar mistakes across all students</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.generalTrends.topErrorTypes.slice(0, 6).map((errorType, index) => (
              <div key={errorType.type} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium text-sm">{errorType.type.replace(/_/g, ' ')}</div>
                  <div className="text-xs text-muted-foreground">{errorType.count} errors</div>
                </div>
                <Badge variant="outline">{errorType.percentage}%</Badge>
              </div>
            ))}
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
                  <SelectItem value="totalErrors">Total Errors</SelectItem>
                  <SelectItem value="recent">Most Recent</SelectItem>
                  <SelectItem value="improvement">Improvement Score</SelectItem>
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
            {filteredCards.length} Student{filteredCards.length !== 1 ? 's' : ''}
          </h2>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <FileText className="h-4 w-4" />
            {data.generalTrends.totalErrors} Total Grammar Errors
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredCards.map((student) => (
            <Card 
              key={student.userId} 
              className="hover:shadow-lg transition-all cursor-pointer"
              onClick={() => handleStudentClick(student)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback className="bg-primary/10 text-primary">
                        <AlertTriangle className="h-4 w-4" />
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
                  {getTrendIcon(student.trend, student.improvementScore)}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-muted-foreground">Total Errors</p>
                    <p className="font-semibold text-lg text-red-600">{student.totalErrors}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">This Week</p>
                    <p className="font-semibold text-lg">{student.recentErrors}</p>
                  </div>
                </div>
                
                <div className="pt-3 border-t">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Improvement</span>
                    <Badge variant={getImprovementScoreBadgeVariant(student.improvementScore)} className="text-sm">
                      {student.improvementScore > 0 ? '+' : ''}{student.improvementScore}%
                    </Badge>
                  </div>
                  <Progress 
                    value={Math.abs(student.improvementScore)} 
                    className={cn("h-2", student.improvementScore > 0 ? "text-green-600" : "text-red-600")} 
                  />
                </div>

                <div className="pt-2">
                  <p className="text-xs text-muted-foreground mb-2">Main Challenge:</p>
                  <div className="space-y-1">
                    <Badge variant="destructive" className="text-xs">
                      {student.grammarInsights.mostChallengingArea || 'General Grammar'}
                    </Badge>
                    {student.grammarInsights.recommendations.length > 0 && (
                      <p className="text-xs text-muted-foreground italic">
                        {student.grammarInsights.recommendations[0]?.slice(0, 40)}...
                      </p>
                    )}
                  </div>
                </div>

                {student.mostRecentError && (
                  <div className="pt-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3 inline mr-1" />
                    Last error: {format(new Date(student.mostRecentError), 'MMM dd, yyyy')}
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
                  View Error Details
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Grammar Error Modal */}
      <GrammarErrorModal
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
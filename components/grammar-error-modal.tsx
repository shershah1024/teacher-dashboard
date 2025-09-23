'use client';

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { format } from "date-fns";
import { 
  AlertTriangle, 
  Target, 
  TrendingUp,
  TrendingDown,
  Calendar,
  User,
  BookOpen,
  CheckCircle2,
  XCircle,
  Brain,
  FileText,
  MessageCircle,
  Activity,
  BarChart3,
  ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ErrorType {
  type: string;
  count: number;
  percentage?: number;
}

interface GrammarError {
  id: number;
  error_text: string;
  correction: string;
  explanation: string;
  error_type: string;
  severity: string;
  source_type: string;
  context: string;
  created_at: string;
  task_id?: string;
}

interface GermanGrammarInsights {
  mostChallengingArea: string;
  difficultyScore: number;
  caseSystemPercentage: number;
  verbSystemPercentage: number;
  recommendations: string[];
  learningPath: string[];
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
  grammarCategoryDistribution: Record<string, number>;
  grammarInsights: GermanGrammarInsights;
  averageErrorsPerWeek: number;
  mostRecentError: string | null;
  recentErrorsDetail: GrammarError[];
  improvementScore: number;
}

interface GrammarErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: StudentCard | null;
}

export function GrammarErrorModal({ isOpen, onClose, student }: GrammarErrorModalProps) {
  if (!student) return null;

  const getSeverityColor = (severity: string) => {
    switch (severity.toUpperCase()) {
      case 'HIGH': return 'text-red-700 bg-red-50 border-red-200';
      case 'MEDIUM': return 'text-orange-700 bg-orange-50 border-orange-200';
      case 'LOW': return 'text-yellow-700 bg-yellow-50 border-yellow-200';
      default: return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity.toUpperCase()) {
      case 'HIGH': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'MEDIUM': return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'LOW': return <CheckCircle2 className="h-4 w-4 text-yellow-500" />;
      default: return <Brain className="h-4 w-4 text-gray-500" />;
    }
  };

  const getSourceTypeIcon = (sourceType: string) => {
    switch (sourceType.toLowerCase()) {
      case 'writing': return <FileText className="h-3 w-3" />;
      case 'chatbot': return <MessageCircle className="h-3 w-3" />;
      case 'speaking': return <Activity className="h-3 w-3" />;
      default: return <BookOpen className="h-3 w-3" />;
    }
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

  const getTrendIcon = (trend: string, improvementScore: number) => {
    if (trend === 'improving' || improvementScore > 20) {
      return <TrendingUp className="h-4 w-4 text-green-500" />;
    } else if (trend === 'declining' || improvementScore < -20) {
      return <TrendingDown className="h-4 w-4 text-red-500" />;
    }
    return <BarChart3 className="h-4 w-4 text-blue-500" />;
  };

  const totalSeverityErrors = student.severityDistribution.HIGH + 
                             student.severityDistribution.MEDIUM + 
                             student.severityDistribution.LOW + 
                             student.severityDistribution.UNKNOWN;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Grammar Error Analysis - {student.name}
            </div>
            <Badge variant={getImprovementScoreBadgeVariant(student.improvementScore)} className="text-lg px-3 py-1">
              {student.improvementScore > 0 ? '+' : ''}{student.improvementScore}% Improvement
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Detailed grammar error analysis and improvement tracking
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[calc(90vh-120px)]">
          <div className="space-y-4 pr-4">
            {/* Student Information */}
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
                      <Target className="h-3 w-3 text-muted-foreground" />
                      <span className="text-muted-foreground">Total Errors:</span>
                      <span className="font-medium text-red-600">{student.totalErrors}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      <span className="text-muted-foreground">Recent Activity:</span>
                      <span className="font-medium">{student.recentErrors} errors this week</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5 h-auto">
                <TabsTrigger value="overview" className="text-xs px-2 py-2">Overview</TabsTrigger>
                <TabsTrigger value="german" className="text-xs px-2 py-2">German</TabsTrigger>
                <TabsTrigger value="errors" className="text-xs px-2 py-2">Errors</TabsTrigger>
                <TabsTrigger value="patterns" className="text-xs px-2 py-2">Patterns</TabsTrigger>
                <TabsTrigger value="progress" className="text-xs px-2 py-2">Progress</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Error Statistics */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <BarChart3 className="h-4 w-4" />
                        Error Statistics
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-red-600">{student.totalErrors}</div>
                          <div className="text-muted-foreground">Total Errors</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold">{student.averageErrorsPerWeek}</div>
                          <div className="text-muted-foreground">Avg/Week</div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>This Week</span>
                          <span className="font-bold">{student.recentErrors}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>This Month</span>
                          <span className="font-bold">{student.monthlyErrors}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Improvement Tracking */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        {getTrendIcon(student.trend, student.improvementScore)}
                        Improvement Tracking
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="text-center">
                        <Badge variant={getImprovementScoreBadgeVariant(student.improvementScore)} className="text-3xl font-bold px-4 py-2">
                          {student.improvementScore > 0 ? '+' : ''}{student.improvementScore}%
                        </Badge>
                        <div className="text-sm text-muted-foreground capitalize">
                          {student.trend} trend
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Progress</span>
                          <span className="text-sm font-bold">
                            {student.improvementScore > 0 ? 'Improving' : student.improvementScore < 0 ? 'Needs Focus' : 'Stable'}
                          </span>
                        </div>
                        <Progress 
                          value={Math.abs(student.improvementScore)} 
                          className="h-2" 
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Severity Distribution */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      Error Severity Distribution
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-xl font-bold text-red-600">{student.severityDistribution.HIGH}</div>
                        <div className="text-xs text-muted-foreground">High Severity</div>
                        <div className="text-xs text-muted-foreground">
                          {totalSeverityErrors > 0 ? Math.round((student.severityDistribution.HIGH / totalSeverityErrors) * 100) : 0}%
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-bold text-orange-600">{student.severityDistribution.MEDIUM}</div>
                        <div className="text-xs text-muted-foreground">Medium</div>
                        <div className="text-xs text-muted-foreground">
                          {totalSeverityErrors > 0 ? Math.round((student.severityDistribution.MEDIUM / totalSeverityErrors) * 100) : 0}%
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-bold text-yellow-600">{student.severityDistribution.LOW}</div>
                        <div className="text-xs text-muted-foreground">Low</div>
                        <div className="text-xs text-muted-foreground">
                          {totalSeverityErrors > 0 ? Math.round((student.severityDistribution.LOW / totalSeverityErrors) * 100) : 0}%
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-bold text-gray-600">{student.severityDistribution.UNKNOWN}</div>
                        <div className="text-xs text-muted-foreground">Unknown</div>
                        <div className="text-xs text-muted-foreground">
                          {totalSeverityErrors > 0 ? Math.round((student.severityDistribution.UNKNOWN / totalSeverityErrors) * 100) : 0}%
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* German Grammar Tab */}
              <TabsContent value="german" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Grammar Categories */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <BookOpen className="h-4 w-4" />
                        German Grammar Categories
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {Object.entries(student.grammarCategoryDistribution).map(([category, count]) => {
                        if (count === 0) return null;
                        
                        const percentage = Math.round((count / student.totalErrors) * 100);
                        
                        const getCategoryColor = (cat: string) => {
                          switch (cat) {
                            case 'Case System': return 'text-red-700 bg-red-50 border-red-200';
                            case 'Verb System': return 'text-orange-700 bg-orange-50 border-orange-200';
                            case 'Sentence Structure': return 'text-blue-700 bg-blue-50 border-blue-200';
                            case 'Word Formation': return 'text-green-700 bg-green-50 border-green-200';
                            default: return 'text-gray-700 bg-gray-50 border-gray-200';
                          }
                        };
                        
                        const getCategoryIcon = (cat: string) => {
                          switch (cat) {
                            case 'Case System': return <Target className="h-4 w-4" />;
                            case 'Verb System': return <Activity className="h-4 w-4" />;
                            case 'Sentence Structure': return <BarChart3 className="h-4 w-4" />;
                            case 'Word Formation': return <Brain className="h-4 w-4" />;
                            default: return <BookOpen className="h-4 w-4" />;
                          }
                        };
                        
                        return (
                          <div key={category} className={cn("p-3 rounded border", getCategoryColor(category))}>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {getCategoryIcon(category)}
                                <span className="font-medium text-sm">{category}</span>
                              </div>
                              <Badge variant="outline">{count} errors</Badge>
                            </div>
                            <div className="mt-2">
                              <Progress value={percentage} className="h-2" />
                              <div className="text-xs text-muted-foreground mt-1">{percentage}% of total errors</div>
                            </div>
                          </div>
                        );
                      })}
                    </CardContent>
                  </Card>

                  {/* Learning Insights */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Brain className="h-4 w-4" />
                        Learning Insights
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <div className="text-sm font-medium text-muted-foreground mb-2">Most Challenging Area</div>
                        <div className="text-lg font-bold text-red-600">
                          {student.grammarInsights.mostChallengingArea}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Difficulty Score: {student.grammarInsights.difficultyScore}/10
                        </div>
                      </div>
                      
                      <div>
                        <div className="text-sm font-medium text-muted-foreground mb-2">German Case System</div>
                        <div className="text-sm">
                          {student.grammarInsights.caseSystemPercentage}% of errors are case-related
                        </div>
                        <Progress value={student.grammarInsights.caseSystemPercentage} className="h-2 mt-1" />
                      </div>
                      
                      <div>
                        <div className="text-sm font-medium text-muted-foreground mb-2">German Verb System</div>
                        <div className="text-sm">
                          {student.grammarInsights.verbSystemPercentage}% of errors are verb-related
                        </div>
                        <Progress value={student.grammarInsights.verbSystemPercentage} className="h-2 mt-1" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Recommendations */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">German Grammar Recommendations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Immediate Focus */}
                      <div>
                        <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-blue-500" />
                          Immediate Focus Areas
                        </h4>
                        <div className="space-y-2">
                          {student.grammarInsights.recommendations.map((rec, index) => (
                            <div key={index} className="flex items-start gap-2 p-2 bg-blue-50 border border-blue-200 rounded">
                              <ArrowRight className="h-3 w-3 text-blue-600 mt-1 flex-shrink-0" />
                              <span className="text-sm text-blue-800">{rec}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Learning Path */}
                      <div>
                        <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                          <Target className="h-4 w-4 text-green-500" />
                          Suggested Learning Path
                        </h4>
                        <div className="space-y-2">
                          {student.grammarInsights.learningPath.map((step, index) => (
                            <div key={index} className="flex items-start gap-2">
                              <span className="bg-green-100 text-green-700 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold flex-shrink-0">
                                {index + 1}
                              </span>
                              <span className="text-sm text-green-800">{step}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Error Details Tab */}
              <TabsContent value="errors" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Recent Grammar Errors</CardTitle>
                    <div className="text-sm text-muted-foreground">
                      {student.recentErrorsDetail.length} recent errors found
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[400px]">
                      <div className="space-y-3">
                        {student.recentErrorsDetail.map((error) => (
                          <Card key={error.id} className="p-4">
                            <div className="space-y-3">
                              {/* Error Header */}
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  {getSeverityIcon(error.severity)}
                                  <Badge className={cn("text-xs", getSeverityColor(error.severity))}>
                                    {error.severity}
                                  </Badge>
                                  <Badge variant="outline" className="text-xs">
                                    {error.error_type.replace(/_/g, ' ')}
                                  </Badge>
                                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    {getSourceTypeIcon(error.source_type)}
                                    {error.source_type}
                                  </div>
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {format(new Date(error.created_at), 'MMM dd, HH:mm')}
                                </div>
                              </div>

                              {/* Error Details */}
                              <div className="space-y-2">
                                <div className="bg-red-50 border border-red-200 p-3 rounded">
                                  <div className="text-sm font-medium text-red-800 mb-1">Incorrect:</div>
                                  <div className="text-red-700 font-mono text-sm">"{error.error_text}"</div>
                                </div>
                                
                                {error.correction && (
                                  <div className="flex items-center gap-2">
                                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                    <div className="bg-green-50 border border-green-200 p-3 rounded flex-1">
                                      <div className="text-sm font-medium text-green-800 mb-1">Correction:</div>
                                      <div className="text-green-700 font-mono text-sm">"{error.correction}"</div>
                                    </div>
                                  </div>
                                )}

                                {error.explanation && (
                                  <div className="bg-blue-50 border border-blue-200 p-3 rounded">
                                    <div className="text-sm font-medium text-blue-800 mb-1">Explanation:</div>
                                    <div className="text-blue-700 text-sm">{error.explanation}</div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Error Patterns Tab */}
              <TabsContent value="patterns" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Top Error Types</CardTitle>
                    <div className="text-sm text-muted-foreground">
                      Most common grammar mistakes for this student
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {student.topErrorTypes.map((errorType, index) => (
                        <div key={errorType.type} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="text-lg font-bold text-muted-foreground">#{index + 1}</div>
                            <div>
                              <div className="font-medium">{errorType.type.replace(/_/g, ' ')}</div>
                              <div className="text-sm text-muted-foreground">{errorType.count} occurrences</div>
                            </div>
                          </div>
                          <Badge variant="secondary">
                            {Math.round((errorType.count / student.totalErrors) * 100)}%
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Progress Tab */}
              <TabsContent value="progress" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Learning Recommendations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium text-sm mb-2">Focus Areas:</h4>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                          {student.topErrorTypes.slice(0, 3).map((errorType) => (
                            <li key={errorType.type} className="flex items-center gap-2">
                              <AlertTriangle className="h-3 w-3 text-orange-500" />
                              Work on {errorType.type.replace(/_/g, ' ').toLowerCase()} ({errorType.count} errors)
                            </li>
                          ))}
                          
                          {student.improvementScore < 0 && (
                            <li className="flex items-center gap-2">
                              <Target className="h-3 w-3 text-blue-500" />
                              Increase practice frequency to improve error rate
                            </li>
                          )}
                          
                          {student.severityDistribution.HIGH > 0 && (
                            <li className="flex items-center gap-2">
                              <XCircle className="h-3 w-3 text-red-500" />
                              Focus on high-severity errors that significantly impact communication
                            </li>
                          )}
                        </ul>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-sm mb-2">Progress Notes:</h4>
                        <div className="text-sm text-muted-foreground space-y-1">
                          {student.improvementScore > 20 && (
                            <p className="text-green-700 bg-green-50 p-2 rounded">
                              ✓ Excellent progress! Error rate has decreased significantly.
                            </p>
                          )}
                          {student.improvementScore > 0 && student.improvementScore <= 20 && (
                            <p className="text-blue-700 bg-blue-50 p-2 rounded">
                              ↗ Showing improvement in grammar accuracy.
                            </p>
                          )}
                          {student.improvementScore < 0 && (
                            <p className="text-orange-700 bg-orange-50 p-2 rounded">
                              ⚠ Needs additional support and practice to reduce error frequency.
                            </p>
                          )}
                          
                          <p>Total of {student.totalErrors} errors identified across {student.recentErrorsDetail.length} recent activities.</p>
                          
                          {student.mostRecentError && (
                            <p>Last error recorded on {format(new Date(student.mostRecentError), 'MMMM dd, yyyy')}.</p>
                          )}
                        </div>
                      </div>
                    </div>
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
'use client';

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { format } from "date-fns";
import { 
  FileText, 
  Target, 
  MessageSquare, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle,
  TrendingUp,
  Calendar,
  User,
  BookOpen,
  PenTool,
  Award
} from "lucide-react";
import { cn } from "@/lib/utils";

interface GrammarError {
  error: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  correction: string;
  explanation: string;
  grammar_category: string;
}

interface ScoreBreakdown {
  content_points: number[];
  communicative_design: number;
}

interface TaskCompletion {
  score: number;
  comment: string;
  max_score: number;
  final_comment: string;
}

interface CommunicativeDesign {
  score: number;
  comment: string;
  max_score: number;
  final_comment: string;
}

interface EvaluationData {
  attempt_id: number;
  grammar_errors: GrammarError[];
  score_breakdown: ScoreBreakdown;
  task_completion: TaskCompletion;
  overall_evaluation: string;
  communicative_design: CommunicativeDesign;
}

interface WritingScore {
  id: string | number;
  user_id: string;
  userName?: string;
  organization?: string;
  task_id: string;
  course?: string;
  section?: number;
  task_type?: string;
  prompt?: string;
  response?: string;
  score: number;
  total_score?: number;
  percentage?: number;
  evaluation_data?: EvaluationData;
  created_at: string;
  updated_at?: string;
  attempt_id?: number;
}

interface WritingEvaluationModalProps {
  isOpen: boolean;
  onClose: () => void;
  score: WritingScore | null;
}

export function WritingEvaluationModal({ isOpen, onClose, score }: WritingEvaluationModalProps) {
  if (!score) return null;

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'HIGH': return 'text-red-600 bg-red-50';
      case 'MEDIUM': return 'text-yellow-600 bg-yellow-50';
      case 'LOW': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-blue-600';
    if (percentage >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const scorePercentage = score.percentage || (score.total_score ? (score.score / score.total_score) * 100 : 0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Writing Task Evaluation
            </div>
            <Badge className={cn("text-lg px-3 py-1", getScoreColor(scorePercentage))}>
              {score.score}/{score.total_score || 100} ({scorePercentage.toFixed(1)}%)
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Detailed evaluation for {score.userName || score.user_id}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[calc(90vh-120px)]">
          <div className="space-y-4 pr-4">
            {/* Task Information */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Task Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-2">
                    <User className="h-3 w-3 text-muted-foreground" />
                    <span className="text-muted-foreground">Student:</span>
                    <span className="font-medium">{score.userName || score.user_id}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3 w-3 text-muted-foreground" />
                    <span className="text-muted-foreground">Date:</span>
                    <span className="font-medium">{format(new Date(score.created_at), 'MMM dd, yyyy HH:mm')}</span>
                  </div>
                  {score.task_type && (
                    <div className="flex items-center gap-2">
                      <PenTool className="h-3 w-3 text-muted-foreground" />
                      <span className="text-muted-foreground">Type:</span>
                      <Badge variant="outline" className="capitalize">{score.task_type}</Badge>
                    </div>
                  )}
                  {score.course && (
                    <div className="flex items-center gap-2">
                      <Award className="h-3 w-3 text-muted-foreground" />
                      <span className="text-muted-foreground">Course:</span>
                      <span className="font-medium uppercase">{score.course}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="content">Content</TabsTrigger>
                <TabsTrigger value="grammar">Grammar</TabsTrigger>
                <TabsTrigger value="scores">Scores</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-4">
                {score.evaluation_data?.overall_evaluation && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        Overall Evaluation
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm leading-relaxed">{score.evaluation_data.overall_evaluation}</p>
                    </CardContent>
                  </Card>
                )}

                {/* Score Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Performance Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {score.evaluation_data?.task_completion && (
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Task Completion</span>
                          <span className="text-sm font-bold">
                            {score.evaluation_data.task_completion.score}/{score.evaluation_data.task_completion.max_score}
                          </span>
                        </div>
                        <Progress 
                          value={(score.evaluation_data.task_completion.score / score.evaluation_data.task_completion.max_score) * 100} 
                        />
                      </div>
                    )}
                    
                    {score.evaluation_data?.communicative_design && (
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Communicative Design</span>
                          <span className="text-sm font-bold">
                            {score.evaluation_data.communicative_design.score}/{score.evaluation_data.communicative_design.max_score}
                          </span>
                        </div>
                        <Progress 
                          value={(score.evaluation_data.communicative_design.score / score.evaluation_data.communicative_design.max_score) * 100} 
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Content Tab */}
              <TabsContent value="content" className="space-y-4">
                {score.prompt && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Target className="h-4 w-4" />
                        Task Prompt
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm whitespace-pre-wrap bg-muted p-3 rounded-md">{score.prompt}</p>
                    </CardContent>
                  </Card>
                )}

                {score.response && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <PenTool className="h-4 w-4" />
                        Student Response
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm whitespace-pre-wrap bg-blue-50 dark:bg-blue-950 p-3 rounded-md">
                        {score.response}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Grammar Tab */}
              <TabsContent value="grammar" className="space-y-4">
                {score.evaluation_data?.grammar_errors && score.evaluation_data.grammar_errors.length > 0 ? (
                  <div className="space-y-3">
                    {score.evaluation_data.grammar_errors.map((error, index) => (
                      <Card key={index}>
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <CardTitle className="text-sm flex items-center gap-2">
                              <AlertTriangle className="h-4 w-4" />
                              Grammar Issue #{index + 1}
                            </CardTitle>
                            <Badge className={cn("text-xs", getSeverityColor(error.severity))}>
                              {error.severity}
                            </Badge>
                          </div>
                          <CardDescription className="text-xs">
                            Category: {error.grammar_category.replace(/_/g, ' ')}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                          <div className="space-y-1">
                            <div className="flex items-start gap-2">
                              <XCircle className="h-4 w-4 text-red-500 mt-0.5" />
                              <div>
                                <span className="text-muted-foreground">Error:</span>
                                <p className="font-mono text-red-600 bg-red-50 p-1 rounded mt-1">
                                  {error.error}
                                </p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="space-y-1">
                            <div className="flex items-start gap-2">
                              <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                              <div>
                                <span className="text-muted-foreground">Correction:</span>
                                <p className="font-mono text-green-600 bg-green-50 p-1 rounded mt-1">
                                  {error.correction}
                                </p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="pt-2 border-t">
                            <p className="text-muted-foreground text-xs">Explanation:</p>
                            <p className="text-sm mt-1">{error.explanation}</p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center text-muted-foreground">
                        <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-500" />
                        <p>No grammar errors detected</p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Scores Tab */}
              <TabsContent value="scores" className="space-y-4">
                {score.evaluation_data?.task_completion && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Task Completion Feedback</CardTitle>
                      <CardDescription>
                        Score: {score.evaluation_data.task_completion.score}/{score.evaluation_data.task_completion.max_score}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                      <div>
                        <p className="font-medium mb-2">Initial Comment:</p>
                        <p className="text-muted-foreground">{score.evaluation_data.task_completion.comment}</p>
                      </div>
                      <Separator />
                      <div>
                        <p className="font-medium mb-2">Recommendations:</p>
                        <p className="text-muted-foreground">{score.evaluation_data.task_completion.final_comment}</p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {score.evaluation_data?.communicative_design && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Communicative Design</CardTitle>
                      <CardDescription>
                        Score: {score.evaluation_data.communicative_design.score}/{score.evaluation_data.communicative_design.max_score}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                      <div>
                        <p className="font-medium mb-2">Assessment:</p>
                        <p className="text-muted-foreground">{score.evaluation_data.communicative_design.comment}</p>
                      </div>
                      <Separator />
                      <div>
                        <p className="font-medium mb-2">Improvement Tips:</p>
                        <p className="text-muted-foreground">{score.evaluation_data.communicative_design.final_comment}</p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {score.evaluation_data?.score_breakdown?.content_points && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Content Points Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {score.evaluation_data.score_breakdown.content_points.map((point, index) => (
                          <div key={index} className="flex items-center justify-between">
                            <span className="text-sm">Point {index + 1}</span>
                            <Badge variant={point > 0 ? "default" : "secondary"}>
                              {point}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
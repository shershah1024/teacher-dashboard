'use client';

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { format } from "date-fns";
import { 
  FileText, 
  Target, 
  MessageSquare, 
  CheckCircle2, 
  XCircle,
  TrendingUp,
  Calendar,
  User,
  BookOpen,
  PenTool,
  Award,
  Clock,
  HelpCircle,
  List
} from "lucide-react";
import { cn } from "@/lib/utils";

interface QuestionResult {
  points: number;
  isCorrect: boolean;
  questionId: string;
  explanation: string;
  earnedPoints: number;
  correctAnswer: string;
  userAnswer?: string;
}

interface UserAnswer {
  answer: string;
  questionId: string;
}

interface QuestionsData {
  results: QuestionResult[];
  user_answers: UserAnswer[];
  is_scored?: boolean;
  save_timestamp?: string;
  score_timestamp?: string;
}

interface EvaluationData {
  timestamp: string;
  grammar_topics: string[];
  score_breakdown: {
    word_order_score: number;
    fill_in_blanks_score: number;
    multiple_choice_score: number;
    error_correction_score: number;
  };
  max_points_by_type: {
    word_order_score: number;
    fill_in_blanks_score: number;
    multiple_choice_score: number;
    error_correction_score: number;
  };
}

interface GrammarScore {
  id: string;
  user_id: string;
  userName?: string;
  organization?: string;
  task_id: string;
  course_name: string;
  unit_id: string;
  grammar_topic: string;
  correct_answers: number;
  total_questions: number;
  score: string;
  total_score: string;
  percentage_score: string;
  questions_data?: QuestionsData;
  multiple_choice_score: string;
  fill_in_blanks_score: string;
  word_order_score: string;
  error_correction_score: string;
  evaluation_data?: EvaluationData;
  time_spent?: number;
  created_at: string;
  updated_at: string;
  attempt_id: number;
  is_scored: boolean;
}

interface GrammarEvaluationModalProps {
  isOpen: boolean;
  onClose: () => void;
  score: GrammarScore | null;
}

export function GrammarEvaluationModal({ isOpen, onClose, score }: GrammarEvaluationModalProps) {
  if (!score) return null;

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-blue-600';
    if (percentage >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const scorePercentage = parseFloat(score.percentage_score) || 0;
  const maxScore = parseFloat(score.total_score) || 0;
  const currentScore = parseFloat(score.score) || 0;

  const getQuestionTypeLabel = (questionId: string) => {
    if (questionId.includes('q11') || questionId.includes('q12') || questionId.includes('q13') || questionId.includes('q14') || questionId.includes('q15')) {
      return 'Word Order';
    }
    if (questionId.includes('q8') || questionId.includes('q9') || questionId.includes('q10')) {
      return 'Fill in Blanks';
    }
    return 'Multiple Choice';
  };

  const getQuestionTypeColor = (type: string) => {
    switch (type) {
      case 'Word Order': return 'bg-purple-50 text-purple-700';
      case 'Fill in Blanks': return 'bg-blue-50 text-blue-700';
      case 'Multiple Choice': return 'bg-green-50 text-green-700';
      default: return 'bg-gray-50 text-gray-700';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Grammar Exercise Evaluation
            </div>
            <Badge className={cn("text-lg px-3 py-1", getScoreColor(scorePercentage))}>
              {currentScore}/{maxScore} ({scorePercentage.toFixed(1)}%)
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
                  <Target className="h-4 w-4" />
                  Exercise Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
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
                    <div className="flex items-center gap-2">
                      <Award className="h-3 w-3 text-muted-foreground" />
                      <span className="text-muted-foreground">Course:</span>
                      <span className="font-medium uppercase">{score.course_name}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-3 w-3 text-muted-foreground" />
                      <span className="text-muted-foreground">Unit:</span>
                      <Badge variant="outline">{score.unit_id}</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <PenTool className="h-3 w-3 text-muted-foreground" />
                      <span className="text-muted-foreground">Topic:</span>
                      <Badge variant="secondary" className="text-xs">{score.grammar_topic}</Badge>
                    </div>
                    {score.time_spent && (
                      <div className="flex items-center gap-2">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span className="text-muted-foreground">Time:</span>
                        <span className="font-medium">{score.time_spent} minutes</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="breakdown">Score Breakdown</TabsTrigger>
                <TabsTrigger value="questions">Questions</TabsTrigger>
                <TabsTrigger value="analysis">Analysis</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Performance Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                      <div className="space-y-1">
                        <p className="text-2xl font-bold text-green-600">{score.correct_answers}</p>
                        <p className="text-xs text-muted-foreground">Correct</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-2xl font-bold text-red-600">{score.total_questions - score.correct_answers}</p>
                        <p className="text-xs text-muted-foreground">Incorrect</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-2xl font-bold text-blue-600">{score.total_questions}</p>
                        <p className="text-xs text-muted-foreground">Total</p>
                      </div>
                      <div className="space-y-1">
                        <p className={cn("text-2xl font-bold", getScoreColor(scorePercentage))}>{scorePercentage.toFixed(1)}%</p>
                        <p className="text-xs text-muted-foreground">Score</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Overall Progress</span>
                        <span className="text-sm font-bold">{currentScore}/{maxScore}</span>
                      </div>
                      <Progress value={scorePercentage} className="h-2" />
                    </div>
                  </CardContent>
                </Card>

                {/* Grammar Topic Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      Grammar Focus
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Badge variant="outline" className="text-sm p-2">
                      {score.grammar_topic}
                    </Badge>
                    <p className="text-sm text-muted-foreground mt-2">
                      This exercise focused on {score.grammar_topic.toLowerCase()} with {score.total_questions} questions 
                      across different question types.
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Score Breakdown Tab */}
              <TabsContent value="breakdown" className="space-y-4">
                {score.evaluation_data && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(score.evaluation_data.score_breakdown).map(([type, scoreValue]) => {
                      const maxPoints = score.evaluation_data?.max_points_by_type[type as keyof typeof score.evaluation_data.max_points_by_type] || 0;
                      const percentage = maxPoints > 0 ? (scoreValue / maxPoints) * 100 : 0;
                      
                      return (
                        <Card key={type}>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-sm capitalize">
                              {type.replace('_', ' ')}
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-sm">Score</span>
                              <span className="font-bold">{scoreValue}/{maxPoints}</span>
                            </div>
                            <Progress value={percentage} className="h-2" />
                            <p className="text-xs text-muted-foreground">
                              {percentage.toFixed(1)}% accuracy
                            </p>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </TabsContent>

              {/* Questions Tab */}
              <TabsContent value="questions" className="space-y-4">
                {score.questions_data?.results && score.questions_data.results.length > 0 ? (
                  <div className="space-y-3">
                    {score.questions_data.results.map((question, index) => {
                      const userAnswer = score.questions_data?.user_answers?.find(ua => ua.questionId === question.questionId);
                      const questionType = getQuestionTypeLabel(question.questionId);
                      
                      return (
                        <Card key={question.questionId}>
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-2">
                                <CardTitle className="text-sm flex items-center gap-2">
                                  <List className="h-4 w-4" />
                                  Question {index + 1}
                                </CardTitle>
                                <Badge className={cn("text-xs", getQuestionTypeColor(questionType))}>
                                  {questionType}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-2">
                                {question.isCorrect ? (
                                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                                ) : (
                                  <XCircle className="h-5 w-5 text-red-500" />
                                )}
                                <Badge variant={question.isCorrect ? "default" : "destructive"}>
                                  {question.earnedPoints}/{question.points} pts
                                </Badge>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-3 text-sm">
                            {userAnswer && (
                              <div className="space-y-2">
                                <div className="flex items-start gap-2">
                                  <User className="h-4 w-4 text-blue-500 mt-0.5" />
                                  <div className="flex-1">
                                    <span className="text-muted-foreground">Your Answer:</span>
                                    <p className={cn(
                                      "font-mono p-2 rounded mt-1",
                                      question.isCorrect 
                                        ? "text-green-600 bg-green-50" 
                                        : "text-red-600 bg-red-50"
                                    )}>
                                      {userAnswer.answer || "No answer provided"}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}
                            
                            <div className="space-y-2">
                              <div className="flex items-start gap-2">
                                <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                                <div className="flex-1">
                                  <span className="text-muted-foreground">Correct Answer:</span>
                                  <p className="font-mono text-green-600 bg-green-50 p-2 rounded mt-1">
                                    {question.correctAnswer}
                                  </p>
                                </div>
                              </div>
                            </div>
                            
                            <div className="pt-2 border-t">
                              <div className="flex items-start gap-2">
                                <HelpCircle className="h-4 w-4 text-blue-500 mt-0.5" />
                                <div className="flex-1">
                                  <p className="text-muted-foreground text-xs mb-1">Explanation:</p>
                                  <p className="text-sm leading-relaxed">{question.explanation}</p>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center text-muted-foreground">
                        <FileText className="h-8 w-8 mx-auto mb-2" />
                        <p>No detailed question data available</p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Analysis Tab */}
              <TabsContent value="analysis" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Performance Analysis</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center p-4 border rounded-lg">
                        <div className={cn("text-2xl font-bold", getScoreColor(scorePercentage))}>
                          {scorePercentage >= 80 ? "Excellent" : scorePercentage >= 60 ? "Good" : scorePercentage >= 40 ? "Fair" : "Needs Work"}
                        </div>
                        <p className="text-sm text-muted-foreground">Overall Performance</p>
                      </div>
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">
                          {((score.correct_answers / score.total_questions) * 100).toFixed(0)}%
                        </div>
                        <p className="text-sm text-muted-foreground">Accuracy Rate</p>
                      </div>
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">
                          {score.attempt_id}
                        </div>
                        <p className="text-sm text-muted-foreground">Attempt Number</p>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h4 className="font-medium mb-2">Recommendations:</h4>
                      <ul className="space-y-1 text-sm text-muted-foreground">
                        {scorePercentage < 60 && (
                          <li>• Review the {score.grammar_topic.toLowerCase()} rules and practice more exercises</li>
                        )}
                        {score.correct_answers < score.total_questions * 0.7 && (
                          <li>• Focus on understanding the explanations for incorrect answers</li>
                        )}
                        {scorePercentage >= 80 && (
                          <li>• Excellent work! Continue practicing to maintain your skills</li>
                        )}
                        <li>• Pay attention to the specific grammar patterns in this topic</li>
                      </ul>
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
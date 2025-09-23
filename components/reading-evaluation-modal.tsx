'use client';

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { format } from "date-fns";
import { 
  BookOpen, 
  Target, 
  TrendingUp,
  Calendar,
  User,
  FileText,
  Award,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  MessageSquare,
  Brain,
  HelpCircle,
  BarChart3
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ExerciseResult {
  exerciseId: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  pointsEarned: number;
}

interface ReadingResult {
  id: string;
  user_id: string;
  userName?: string;
  organization?: string;
  task_id: string;
  section_id: string;
  lesson_id: string;
  title: string;
  score: number;
  max_score: number;
  percentage: string;
  scorePercentage: number;
  time_taken_seconds?: number;
  exercise_results: string;
  exerciseResults: ExerciseResult[];
  reading_text_preview?: string;
  created_at: string;
  updated_at: string;
  attempt_id?: number;
}

interface ReadingEvaluationModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: ReadingResult | null;
}

export function ReadingEvaluationModal({ isOpen, onClose, result }: ReadingEvaluationModalProps) {
  if (!result) return null;

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadgeVariant = (score: number): "default" | "secondary" | "destructive" | "outline" => {
    if (score >= 80) return 'default';
    if (score >= 60) return 'secondary';
    if (score >= 40) return 'outline';
    return 'destructive';
  };

  const getComprehensionLevel = (score: number) => {
    if (score >= 90) return { level: 'Excellent', color: 'text-green-700', bgColor: 'bg-green-50' };
    if (score >= 80) return { level: 'Proficient', color: 'text-blue-700', bgColor: 'bg-blue-50' };
    if (score >= 70) return { level: 'Developing', color: 'text-yellow-700', bgColor: 'bg-yellow-50' };
    if (score >= 60) return { level: 'Emerging', color: 'text-orange-700', bgColor: 'bg-orange-50' };
    return { level: 'Needs Support', color: 'text-red-700', bgColor: 'bg-red-50' };
  };

  const analyzeExerciseTypes = () => {
    const typeAnalysis = new Map<string, { correct: number; total: number }>();
    
    result.exerciseResults?.forEach(exercise => {
      const type = getExerciseType(exercise);
      if (!typeAnalysis.has(type)) {
        typeAnalysis.set(type, { correct: 0, total: 0 });
      }
      const analysis = typeAnalysis.get(type)!;
      analysis.total++;
      if (exercise.isCorrect) {
        analysis.correct++;
      }
    });

    return Array.from(typeAnalysis.entries()).map(([type, data]) => ({
      type,
      correct: data.correct,
      total: data.total,
      percentage: data.total > 0 ? (data.correct / data.total) * 100 : 0
    }));
  };

  const getExerciseType = (exercise: ExerciseResult): string => {
    if (exercise.userAnswer && exercise.correctAnswer) {
      if (exercise.userAnswer.length > 50) {
        return 'Text Comprehension';
      } else if (exercise.userAnswer.includes(',') || exercise.correctAnswer.includes(',')) {
        return 'Multiple Choice';
      } else {
        return 'Short Answer';
      }
    }
    return 'Reading Exercise';
  };

  const getQuestionIcon = (exercise: ExerciseResult) => {
    const type = getExerciseType(exercise);
    switch (type) {
      case 'Multiple Choice':
        return <HelpCircle className="h-3 w-3" />;
      case 'Text Comprehension':
        return <FileText className="h-3 w-3" />;
      case 'Short Answer':
        return <MessageSquare className="h-3 w-3" />;
      default:
        return <BookOpen className="h-3 w-3" />;
    }
  };

  const formatTime = (seconds?: number) => {
    if (!seconds) return 'N/A';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const exerciseTypeAnalysis = analyzeExerciseTypes();
  const comprehensionLevel = getComprehensionLevel(result.scorePercentage);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Reading Comprehension Analysis
            </div>
            <Badge variant={getScoreBadgeVariant(result.scorePercentage)} className="text-lg px-3 py-1">
              {result.scorePercentage}% ({result.score}/{result.max_score})
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Detailed analysis of reading comprehension performance
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[calc(90vh-120px)]">
          <div className="space-y-4 pr-4">
            {/* Session Information */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Reading Exercise Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <User className="h-3 w-3 text-muted-foreground" />
                      <span className="text-muted-foreground">Student:</span>
                      <span className="font-medium">{result.userName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      <span className="text-muted-foreground">Date:</span>
                      <span className="font-medium">{format(new Date(result.created_at), 'MMM dd, yyyy HH:mm')}</span>
                    </div>
                    {result.time_taken_seconds && (
                      <div className="flex items-center gap-2">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span className="text-muted-foreground">Time:</span>
                        <span className="font-medium">{formatTime(result.time_taken_seconds)}</span>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <FileText className="h-3 w-3 text-muted-foreground" />
                      <span className="text-muted-foreground">Topic:</span>
                      <Badge variant="outline">{result.title}</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Award className="h-3 w-3 text-muted-foreground" />
                      <span className="text-muted-foreground">Section:</span>
                      <span className="font-medium">{result.section_id}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-3 w-3 text-muted-foreground" />
                      <span className="text-muted-foreground">Lesson:</span>
                      <span className="font-medium">{result.lesson_id}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="questions">Question Analysis</TabsTrigger>
                <TabsTrigger value="breakdown">Score Breakdown</TabsTrigger>
                <TabsTrigger value="text">Reading Text</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Comprehension Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-center">
                      <div className={cn("text-4xl font-bold", getScoreColor(result.scorePercentage))}>
                        {result.scorePercentage}%
                      </div>
                      <div className={cn("text-sm mt-1", comprehensionLevel.color)}>
                        {comprehensionLevel.level} Comprehension
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {result.score} out of {result.max_score} points earned
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Overall Performance</span>
                        <span className="text-sm font-bold">{result.scorePercentage}%</span>
                      </div>
                      <Progress value={result.scorePercentage} className="h-2" />
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Performance Indicators */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        Correct Answers
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600">
                        {result.exerciseResults?.filter(e => e.isCorrect).length || 0}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        out of {result.exerciseResults?.length || 0} questions
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-red-500" />
                        Incorrect Answers
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-red-600">
                        {result.exerciseResults?.filter(e => !e.isCorrect).length || 0}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        need review
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Question Analysis Tab */}
              <TabsContent value="questions" className="space-y-4">
                {result.exerciseResults && result.exerciseResults.length > 0 ? (
                  <div className="space-y-3">
                    {result.exerciseResults.map((exercise, index) => (
                      <Card key={index} className={cn(
                        "border-l-4",
                        exercise.isCorrect ? "border-l-green-500" : "border-l-red-500"
                      )}>
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-sm flex items-center gap-2">
                              {getQuestionIcon(exercise)}
                              Question {index + 1}
                              <Badge variant="outline" className="text-xs">
                                {getExerciseType(exercise)}
                              </Badge>
                            </CardTitle>
                            <div className="flex items-center gap-2">
                              {exercise.isCorrect ? (
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                              ) : (
                                <XCircle className="h-4 w-4 text-red-500" />
                              )}
                              <Badge variant={exercise.isCorrect ? "default" : "destructive"}>
                                {exercise.pointsEarned} pts
                              </Badge>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div>
                            <div className="text-xs font-medium text-muted-foreground mb-1">Student Answer:</div>
                            <div className={cn(
                              "text-sm p-2 rounded bg-gray-50 border",
                              exercise.isCorrect ? "border-green-200" : "border-red-200"
                            )}>
                              {exercise.userAnswer || 'No answer provided'}
                            </div>
                          </div>
                          
                          {!exercise.isCorrect && (
                            <div>
                              <div className="text-xs font-medium text-muted-foreground mb-1">Correct Answer:</div>
                              <div className="text-sm p-2 rounded bg-green-50 border border-green-200">
                                {exercise.correctAnswer}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center text-muted-foreground">
                        <HelpCircle className="h-8 w-8 mx-auto mb-2" />
                        <p>Question details not available for this exercise</p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Score Breakdown Tab */}
              <TabsContent value="breakdown" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Brain className="h-4 w-4" />
                      Performance by Question Type
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {exerciseTypeAnalysis.length > 0 ? (
                      exerciseTypeAnalysis.map((analysis, index) => (
                        <div key={index} className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">{analysis.type}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-sm">{analysis.correct}/{analysis.total}</span>
                              <Badge className={cn(
                                "text-xs",
                                analysis.percentage >= 80 ? "bg-green-100 text-green-700" :
                                analysis.percentage >= 60 ? "bg-blue-100 text-blue-700" :
                                analysis.percentage >= 40 ? "bg-yellow-100 text-yellow-700" :
                                "bg-red-100 text-red-700"
                              )}>
                                {analysis.percentage.toFixed(0)}%
                              </Badge>
                            </div>
                          </div>
                          <Progress value={analysis.percentage} className="h-2" />
                        </div>
                      ))
                    ) : (
                      <div className="text-center text-muted-foreground">
                        <BarChart3 className="h-8 w-8 mx-auto mb-2" />
                        <p>Score breakdown not available</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Recommendations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Based on this performance:</h4>
                      <ul className="space-y-1 text-sm text-muted-foreground">
                        {result.scorePercentage >= 90 && (
                          <li>• Excellent comprehension! Continue reading challenging texts</li>
                        )}
                        {result.scorePercentage >= 80 && result.scorePercentage < 90 && (
                          <li>• Strong reading skills. Practice with more complex texts</li>
                        )}
                        {result.scorePercentage >= 60 && result.scorePercentage < 80 && (
                          <li>• Good foundation. Focus on detailed comprehension questions</li>
                        )}
                        {result.scorePercentage < 60 && (
                          <li>• Practice basic reading comprehension strategies</li>
                        )}
                        <li>• Review vocabulary from this text</li>
                        <li>• Try re-reading the text for better understanding</li>
                        {result.time_taken_seconds && result.time_taken_seconds > 600 && (
                          <li>• Work on reading speed and efficiency</li>
                        )}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Reading Text Tab */}
              <TabsContent value="text" className="space-y-4">
                {result.reading_text_preview ? (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Reading Text Preview
                      </CardTitle>
                      <div className="text-sm text-muted-foreground">
                        Topic: {result.title}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="prose prose-sm max-w-none">
                        <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                          {result.reading_text_preview.replace(/##\s*/g, '').replace(/\*\*/g, '')}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center text-muted-foreground">
                        <Eye className="h-8 w-8 mx-auto mb-2" />
                        <p>Reading text preview not available</p>
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
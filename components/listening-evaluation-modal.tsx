'use client';

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { format } from "date-fns";
import { 
  Headphones, 
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
  Play,
  Volume2,
  Brain,
  HelpCircle,
  BarChart3,
  MessageSquare
} from "lucide-react";
import { cn } from "@/lib/utils";

interface QuestionResult {
  questionNumber: number;
  selectedAnswer: string;
  isCorrect: boolean;
}

interface ListeningResult {
  id: string;
  user_id: string;
  userName?: string;
  organization?: string;
  task_id: string;
  exercise_id: string;
  audio_title: string;
  audio_url?: string;
  score: number;
  max_score: number;
  percentage: string;
  scorePercentage: number;
  audio_play_count: number;
  time_taken_seconds?: number;
  question_results: string;
  questionResults: QuestionResult[];
  transcript_viewed: boolean;
  created_at: string;
  updated_at: string;
  attempt_id?: number;
}

interface ListeningEvaluationModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: ListeningResult | null;
}

export function ListeningEvaluationModal({ isOpen, onClose, result }: ListeningEvaluationModalProps) {
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

  const getEngagementLevel = (playCount: number) => {
    if (playCount >= 4) return { level: 'High Effort', color: 'text-orange-600', description: 'Needed multiple replays' };
    if (playCount === 3) return { level: 'Good Effort', color: 'text-yellow-600', description: 'Used some replays' };
    if (playCount === 2) return { level: 'Moderate', color: 'text-blue-600', description: 'One replay used' };
    return { level: 'Single Listen', color: 'text-green-600', description: 'Understood on first listen' };
  };

  const analyzeQuestionTypes = () => {
    const typeAnalysis = new Map<string, { correct: number; total: number }>();
    
    result.questionResults?.forEach(question => {
      const type = getQuestionType(question);
      if (!typeAnalysis.has(type)) {
        typeAnalysis.set(type, { correct: 0, total: 0 });
      }
      const analysis = typeAnalysis.get(type)!;
      analysis.total++;
      if (question.isCorrect) {
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

  const getQuestionType = (question: QuestionResult): string => {
    if (!question.selectedAnswer) return 'No Answer';
    
    const answer = question.selectedAnswer.toLowerCase();
    
    // Check for true/false questions
    if (answer === 'true' || answer === 'false') {
      return 'True/False';
    }
    
    // Check for fill-in-the-blank (usually single words or short phrases)
    if (answer.length <= 20 && !answer.includes(',') && answer.split(' ').length <= 3) {
      return 'Fill in the Blank';
    }
    
    // Everything else is multiple choice
    return 'Multiple Choice';
  };

  const getQuestionIcon = (question: QuestionResult) => {
    const type = getQuestionType(question);
    switch (type) {
      case 'True/False':
        return <CheckCircle2 className="h-3 w-3" />;
      case 'Multiple Choice':
        return <HelpCircle className="h-3 w-3" />;
      case 'Fill in the Blank':
        return <MessageSquare className="h-3 w-3" />;
      default:
        return <Headphones className="h-3 w-3" />;
    }
  };

  const formatTime = (seconds?: number) => {
    if (!seconds) return 'N/A';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const questionTypeAnalysis = analyzeQuestionTypes();
  const comprehensionLevel = getComprehensionLevel(result.scorePercentage);
  const engagementLevel = getEngagementLevel(result.audio_play_count);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Headphones className="h-5 w-5" />
              Listening Comprehension Analysis
            </div>
            <Badge variant={getScoreBadgeVariant(result.scorePercentage)} className="text-lg px-3 py-1">
              {result.scorePercentage}% ({result.score}/{result.max_score})
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Detailed analysis of audio comprehension performance and engagement
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[calc(90vh-120px)]">
          <div className="space-y-4 pr-4">
            {/* Session Information */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Audio Exercise Details
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
                      <Volume2 className="h-3 w-3 text-muted-foreground" />
                      <span className="text-muted-foreground">Audio:</span>
                      <Badge variant="outline" className="text-xs max-w-[200px] truncate">
                        {result.audio_title}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Award className="h-3 w-3 text-muted-foreground" />
                      <span className="text-muted-foreground">Task:</span>
                      <span className="font-medium text-xs">{result.task_id.slice(0, 8)}...</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Play className="h-3 w-3 text-muted-foreground" />
                      <span className="text-muted-foreground">Audio Plays:</span>
                      <Badge variant="secondary" className={cn("text-xs", engagementLevel.color)}>
                        {result.audio_play_count}x
                      </Badge>
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
                <TabsTrigger value="audio">Audio Details</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Listening Performance Summary
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        Correct Answers
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600">
                        {result.questionResults?.filter(q => q.isCorrect).length || 0}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        out of {result.questionResults?.length || 0} questions
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Play className="h-4 w-4 text-blue-500" />
                        Audio Engagement
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className={cn("text-2xl font-bold", engagementLevel.color)}>
                        {result.audio_play_count}x
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {engagementLevel.description}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <FileText className="h-4 w-4 text-purple-500" />
                        Transcript Support
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className={cn("text-2xl font-bold", result.transcript_viewed ? "text-blue-600" : "text-gray-400")}>
                        {result.transcript_viewed ? 'Used' : 'Not Used'}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {result.transcript_viewed ? 'Used transcript help' : 'Audio only'}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Question Analysis Tab */}
              <TabsContent value="questions" className="space-y-4">
                {result.questionResults && result.questionResults.length > 0 ? (
                  <div className="space-y-3">
                    {result.questionResults.map((question, index) => (
                      <Card key={index} className={cn(
                        "border-l-4",
                        question.isCorrect ? "border-l-green-500" : "border-l-red-500"
                      )}>
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-sm flex items-center gap-2">
                              {getQuestionIcon(question)}
                              Question {question.questionNumber}
                              <Badge variant="outline" className="text-xs">
                                {getQuestionType(question)}
                              </Badge>
                            </CardTitle>
                            <div className="flex items-center gap-2">
                              {question.isCorrect ? (
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                              ) : (
                                <XCircle className="h-4 w-4 text-red-500" />
                              )}
                              <Badge variant={question.isCorrect ? "default" : "destructive"}>
                                {question.isCorrect ? 'Correct' : 'Incorrect'}
                              </Badge>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div>
                            <div className="text-xs font-medium text-muted-foreground mb-1">Student Answer:</div>
                            <div className={cn(
                              "text-sm p-2 rounded bg-gray-50 border",
                              question.isCorrect ? "border-green-200" : "border-red-200"
                            )}>
                              {question.selectedAnswer || 'No answer provided'}
                            </div>
                          </div>
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
                    {questionTypeAnalysis.length > 0 ? (
                      questionTypeAnalysis.map((analysis, index) => (
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
                    <CardTitle className="text-base">Listening Strategy Analysis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                        <span className="text-sm font-medium">Audio Replay Strategy</span>
                        <Badge variant="outline" className={cn("text-xs", engagementLevel.color)}>
                          {engagementLevel.level}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                        <span className="text-sm font-medium">Transcript Usage</span>
                        <Badge variant="outline" className={cn(
                          "text-xs",
                          result.transcript_viewed ? "text-blue-600" : "text-green-600"
                        )}>
                          {result.transcript_viewed ? 'Support Used' : 'Independent'}
                        </Badge>
                      </div>

                      {result.time_taken_seconds && (
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                          <span className="text-sm font-medium">Completion Speed</span>
                          <Badge variant="outline" className="text-xs">
                            {formatTime(result.time_taken_seconds)}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Audio Details Tab */}
              <TabsContent value="audio" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Volume2 className="h-4 w-4" />
                      Audio Exercise Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="text-sm font-medium text-muted-foreground">Audio Title</div>
                        <div className="text-sm font-semibold">{result.audio_title}</div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="text-sm font-medium text-muted-foreground">Exercise ID</div>
                        <div className="text-sm font-mono">{result.exercise_id.slice(0, 16)}...</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      Engagement Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-gray-50 rounded">
                        <div className={cn("text-2xl font-bold", engagementLevel.color)}>
                          {result.audio_play_count}
                        </div>
                        <div className="text-sm text-muted-foreground">Audio Replays</div>
                        <div className="text-xs mt-1">{engagementLevel.description}</div>
                      </div>
                      
                      <div className="text-center p-4 bg-gray-50 rounded">
                        <div className={cn("text-2xl font-bold", result.transcript_viewed ? "text-blue-600" : "text-gray-400")}>
                          {result.transcript_viewed ? 'Yes' : 'No'}
                        </div>
                        <div className="text-sm text-muted-foreground">Transcript Used</div>
                        <div className="text-xs mt-1">
                          {result.transcript_viewed ? 'Used reading support' : 'Audio-only approach'}
                        </div>
                      </div>

                      {result.time_taken_seconds && (
                        <div className="text-center p-4 bg-gray-50 rounded">
                          <div className="text-2xl font-bold text-purple-600">
                            {formatTime(result.time_taken_seconds)}
                          </div>
                          <div className="text-sm text-muted-foreground">Total Time</div>
                          <div className="text-xs mt-1">Including all replays</div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Recommendations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Based on this listening performance:</h4>
                      <ul className="space-y-1 text-sm text-muted-foreground">
                        {result.scorePercentage >= 90 && (
                          <li>• Excellent listening skills! Try more challenging audio content</li>
                        )}
                        {result.scorePercentage >= 80 && result.scorePercentage < 90 && (
                          <li>• Strong comprehension. Practice with longer audio segments</li>
                        )}
                        {result.scorePercentage >= 60 && result.scorePercentage < 80 && (
                          <li>• Good foundation. Focus on challenging audio types from this exercise</li>
                        )}
                        {result.scorePercentage < 60 && (
                          <li>• Practice basic listening comprehension with shorter audio clips</li>
                        )}
                        
                        {result.audio_play_count >= 4 && (
                          <li>• Consider using transcript support to improve understanding</li>
                        )}
                        {result.audio_play_count === 1 && result.scorePercentage >= 80 && (
                          <li>• Excellent listening efficiency - understood on first listen</li>
                        )}
                        
                        {!result.transcript_viewed && result.scorePercentage < 70 && (
                          <li>• Try using transcript support for difficult parts next time</li>
                        )}
                        {result.transcript_viewed && result.scorePercentage >= 80 && (
                          <li>• Great use of available resources to understand the content</li>
                        )}
                        
                        <li>• Review vocabulary from this audio topic for better comprehension</li>
                        <li>• Practice similar audio content to reinforce learning</li>
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
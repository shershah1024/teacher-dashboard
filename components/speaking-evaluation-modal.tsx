'use client';

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { format } from "date-fns";
import { 
  MessageSquare, 
  Target, 
  TrendingUp,
  Calendar,
  User,
  BookOpen,
  Award,
  Mic,
  CheckCircle2,
  AlertTriangle,
  Brain,
  Languages,
  MessageCircle,
  Volume2
} from "lucide-react";
import { cn } from "@/lib/utils";

interface EvaluationData {
  overall_score?: number;
  grammar_score?: number;
  vocabulary_score?: number;
  communication_score?: number;
  pronunciation_score?: number;
  fluency_score?: number;
  feedback?: string;
  overall_feedback?: string;
  strengths?: string[];
  improvements?: string[];
  errors?: Array<{
    type: string;
    message: string;
    correction?: string;
  }>;
  [key: string]: any;
}

interface SpeakingScore {
  id: string;
  user_id: string;
  task_id?: string;
  course_name?: string;
  grammar_vocabulary_score?: number;
  communication_score?: number;
  total_score?: number;
  percentage_score?: number;
  score: number;
  created_at: string;
  feedback?: string;
  evaluation?: EvaluationData;
  evaluation_data?: any;
  conversation_history?: Array<{
    role: string;
    content: string;
  }>;
  task_instructions?: string;
}

interface SpeakingEvaluationModalProps {
  isOpen: boolean;
  onClose: () => void;
  score: SpeakingScore | null;
}

export function SpeakingEvaluationModal({ isOpen, onClose, score }: SpeakingEvaluationModalProps) {
  if (!score) return null;

  const getScoreColor = (scoreValue: number) => {
    if (scoreValue >= 80) return 'text-green-600';
    if (scoreValue >= 60) return 'text-blue-600';
    if (scoreValue >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getSkillLevel = (scoreValue: number) => {
    if (scoreValue >= 85) return { level: 'Excellent', color: 'text-green-700', bgColor: 'bg-green-50' };
    if (scoreValue >= 70) return { level: 'Proficient', color: 'text-blue-700', bgColor: 'bg-blue-50' };
    if (scoreValue >= 55) return { level: 'Developing', color: 'text-yellow-700', bgColor: 'bg-yellow-50' };
    if (scoreValue >= 40) return { level: 'Emerging', color: 'text-orange-700', bgColor: 'bg-orange-50' };
    return { level: 'Needs Support', color: 'text-red-700', bgColor: 'bg-red-50' };
  };

  const evaluation = score.evaluation || score.evaluation_data;
  
  // Handle various conversation data structures
  let conversation = score.conversation_history || evaluation?.conversation || [];
  
  const hasDetailedScores = evaluation || score.grammar_vocabulary_score || score.communication_score;
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mic className="h-5 w-5" />
              Speaking Practice Analysis
            </div>
            <Badge className={cn("text-lg px-3 py-1", getScoreColor(score.score))}>
              {score.score}% Overall
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Detailed evaluation of speaking performance
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[calc(90vh-120px)]">
          <div className="space-y-4 pr-4">
            {/* Session Information */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Session Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <User className="h-3 w-3 text-muted-foreground" />
                      <span className="text-muted-foreground">Session ID:</span>
                      <span className="font-medium">{score.id}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      <span className="text-muted-foreground">Date:</span>
                      <span className="font-medium">{format(new Date(score.created_at), 'MMM dd, yyyy HH:mm')}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {score.course_name && (
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-3 w-3 text-muted-foreground" />
                        <span className="text-muted-foreground">Course:</span>
                        <Badge variant="outline">{score.course_name.replace(/_/g, ' ')}</Badge>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Award className="h-3 w-3 text-muted-foreground" />
                      <span className="text-muted-foreground">Task:</span>
                      <span className="font-medium">
                        {score.task_id ? 
                          (score.task_id.includes('week') ? 
                            score.task_id.replace(/_/g, ' ') : 
                            `Task ${score.task_id.slice(0, 8)}...`) 
                          : 'General Practice'}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 h-auto">
                <TabsTrigger value="overview" className="text-xs px-2 py-2">Overview</TabsTrigger>
                <TabsTrigger value="skills" className="text-xs px-2 py-2">Skills</TabsTrigger>
                <TabsTrigger value="conversation" className="text-xs px-2 py-2">Transcript</TabsTrigger>
                <TabsTrigger value="feedback" className="text-xs px-2 py-2">Feedback</TabsTrigger>
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
                    <div className="text-center">
                      <div className={cn("text-4xl font-bold", getScoreColor(score.score))}>
                        {score.score}%
                      </div>
                      <div className={cn("text-sm mt-1", getSkillLevel(score.score).color)}>
                        {getSkillLevel(score.score).level}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Overall Performance</span>
                        <span className="text-sm font-bold">{score.score}%</span>
                      </div>
                      <Progress value={score.score} className="h-2" />
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Performance Indicators */}
                {hasDetailedScores && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                          Strong Areas
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {evaluation?.strengths?.slice(0, 3).map((strength: string, index: number) => (
                            <div key={index} className="text-sm text-green-700 bg-green-50 p-2 rounded">
                              {strength}
                            </div>
                          )) || (
                            <div className="space-y-1">
                              {(score.grammar_vocabulary_score || 0) >= 70 && (
                                <div className="text-sm text-green-700">Good grammar and vocabulary usage</div>
                              )}
                              {(score.communication_score || 0) >= 70 && (
                                <div className="text-sm text-green-700">Clear communication</div>
                              )}
                              {evaluation?.pronunciation_score && evaluation.pronunciation_score >= 70 && (
                                <div className="text-sm text-green-700">Good pronunciation</div>
                              )}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-orange-500" />
                          Growth Areas
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {evaluation?.improvements?.slice(0, 3).map((improvement: string, index: number) => (
                            <div key={index} className="text-sm text-orange-700 bg-orange-50 p-2 rounded">
                              {improvement}
                            </div>
                          )) || (
                            <div className="space-y-1">
                              {(score.grammar_vocabulary_score || 0) < 60 && (
                                <div className="text-sm text-orange-700">Focus on grammar and vocabulary</div>
                              )}
                              {(score.communication_score || 0) < 60 && (
                                <div className="text-sm text-orange-700">Work on communication clarity</div>
                              )}
                              {evaluation?.pronunciation_score && evaluation.pronunciation_score < 60 && (
                                <div className="text-sm text-orange-700">Practice pronunciation</div>
                              )}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </TabsContent>

              {/* Skills Analysis Tab */}
              <TabsContent value="skills" className="space-y-4">
                {hasDetailedScores ? (
                  <div className="space-y-4">
                    {(score.grammar_vocabulary_score !== undefined && score.grammar_vocabulary_score !== null) && (
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <Brain className="h-4 w-4" />
                            Grammar & Vocabulary
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Accuracy & Range</span>
                            <div className="flex items-center gap-2">
                              <span className="font-bold">{score.grammar_vocabulary_score}%</span>
                              <Badge className={cn("text-xs", getSkillLevel(score.grammar_vocabulary_score).color, getSkillLevel(score.grammar_vocabulary_score).bgColor)}>
                                {getSkillLevel(score.grammar_vocabulary_score).level}
                              </Badge>
                            </div>
                          </div>
                          <Progress value={score.grammar_vocabulary_score} className="h-2" />
                        </CardContent>
                      </Card>
                    )}

                    {(score.communication_score !== undefined && score.communication_score !== null) && (
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <MessageCircle className="h-4 w-4" />
                            Communication Effectiveness
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Clarity & Coherence</span>
                            <div className="flex items-center gap-2">
                              <span className="font-bold">{score.communication_score}%</span>
                              <Badge className={cn("text-xs", getSkillLevel(score.communication_score).color, getSkillLevel(score.communication_score).bgColor)}>
                                {getSkillLevel(score.communication_score).level}
                              </Badge>
                            </div>
                          </div>
                          <Progress value={score.communication_score} className="h-2" />
                        </CardContent>
                      </Card>
                    )}

                    {evaluation?.pronunciation_score !== undefined && (
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <Volume2 className="h-4 w-4" />
                            Pronunciation
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Clarity & Accuracy</span>
                            <div className="flex items-center gap-2">
                              <span className="font-bold">{evaluation.pronunciation_score}%</span>
                              <Badge className={cn("text-xs", getSkillLevel(evaluation.pronunciation_score).color, getSkillLevel(evaluation.pronunciation_score).bgColor)}>
                                {getSkillLevel(evaluation.pronunciation_score).level}
                              </Badge>
                            </div>
                          </div>
                          <Progress value={evaluation.pronunciation_score} className="h-2" />
                        </CardContent>
                      </Card>
                    )}

                    {evaluation?.fluency_score !== undefined && (
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <MessageSquare className="h-4 w-4" />
                            Fluency
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Natural Flow</span>
                            <div className="flex items-center gap-2">
                              <span className="font-bold">{evaluation.fluency_score}%</span>
                              <Badge className={cn("text-xs", getSkillLevel(evaluation.fluency_score).color, getSkillLevel(evaluation.fluency_score).bgColor)}>
                                {getSkillLevel(evaluation.fluency_score).level}
                              </Badge>
                            </div>
                          </div>
                          <Progress value={evaluation.fluency_score} className="h-2" />
                        </CardContent>
                      </Card>
                    )}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center text-muted-foreground">
                        <Brain className="h-8 w-8 mx-auto mb-2" />
                        <p>Detailed skill breakdown not available for this session</p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Conversation Transcript Tab */}
              <TabsContent value="conversation" className="space-y-4">
                {conversation && conversation.length > 0 ? (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Conversation Transcript</CardTitle>
                      <div className="text-sm text-muted-foreground">
                        {conversation.length} messages exchanged
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {conversation.map((message: any, index: number) => {
                          // Handle various possible message formats
                          let role = message.role || message.sender || 'unknown';
                          let content = message.content || message.text || message.message || '';
                          
                          // Normalize role names
                          role = role.toLowerCase();
                          const isStudent = role === 'user' || role === 'student' || role === 'human' || role === 'learner';
                          const isAssistant = role === 'assistant' || role === 'bot' || role === 'ai' || role === 'system';
                          
                          return (
                            <div
                              key={index}
                              className={cn(
                                "p-3 rounded-lg text-sm",
                                isStudent
                                  ? 'bg-blue-50 border border-blue-100 ml-8' 
                                  : 'bg-gray-50 border border-gray-200 mr-8'
                              )}
                            >
                              <div className="text-xs font-medium text-gray-500 mb-1 flex items-center gap-2">
                                {isStudent ? (
                                  <>
                                    <User className="h-3 w-3" />
                                    Student
                                  </>
                                ) : (
                                  <>
                                    <Mic className="h-3 w-3" />
                                    AI Assistant
                                  </>
                                )}
                              </div>
                              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{content || 'No content available'}</p>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center text-muted-foreground">
                        <MessageSquare className="h-8 w-8 mx-auto mb-2" />
                        <p>Conversation transcript not available</p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Feedback Tab */}
              <TabsContent value="feedback" className="space-y-4">
                {(evaluation?.feedback || evaluation?.overall_feedback || score.feedback) && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Evaluation Feedback</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {evaluation?.feedback || evaluation?.overall_feedback || score.feedback}
                      </p>
                    </CardContent>
                  </Card>
                )}

                {score.task_instructions && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Task Instructions</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {score.task_instructions}
                      </p>
                    </CardContent>
                  </Card>
                )}

                {evaluation?.errors && evaluation.errors.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Language Errors & Corrections</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {evaluation.errors.map((error: any, index: number) => (
                          <div key={index} className="border-l-4 border-red-200 pl-4 py-2">
                            <div className="font-medium text-sm text-red-700">{error.type}</div>
                            <div className="text-sm text-gray-600 mt-1">{error.message}</div>
                            {error.correction && (
                              <div className="text-sm text-green-700 mt-1 font-medium">
                                Suggestion: {error.correction}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Recommendations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Next Steps:</h4>
                      <ul className="space-y-1 text-sm text-muted-foreground">
                        {score.score < 60 && (
                          <li>• Focus on basic conversation patterns and pronunciation</li>
                        )}
                        {score.score >= 60 && score.score < 80 && (
                          <li>• Practice more complex sentence structures and natural flow</li>
                        )}
                        {score.score >= 80 && (
                          <li>• Excellent work! Continue practicing to maintain fluency</li>
                        )}
                        <li>• Engage in more speaking practice sessions to build confidence</li>
                        <li>• Pay attention to feedback patterns across multiple sessions</li>
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
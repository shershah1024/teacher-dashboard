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
  Bot,
  CheckCircle2,
  AlertTriangle,
  Brain,
  Languages,
  MessageCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

interface EvaluationData {
  overall_score?: number;
  grammar_score?: number;
  vocabulary_score?: number;
  coherence_score?: number;
  task_completion_score?: number;
  pronunciation_score?: number;
  fluency_score?: number;
  feedback?: string;
  strengths?: string[];
  improvements?: string[];
  errors?: Array<{
    type: string;
    message: string;
    correction?: string;
  }>;
  conversation?: Array<{
    role: string;
    content: string;
  }>;
  [key: string]: any;
}

interface ChatbotScore {
  id: string;
  user_id: string;
  lesson_id?: string;
  task_id?: string;
  course_name?: string;
  score: number;
  total_score?: number;
  grammar_score?: number;
  vocabulary_score?: number;
  created_at: string;
  feedback?: string;
  evaluation?: EvaluationData;
  evaluation_data?: any;
  conversation_history?: Array<{
    role: string;
    content: string;
  }>;
}

interface ChatbotEvaluationModalProps {
  isOpen: boolean;
  onClose: () => void;
  score: ChatbotScore | null;
}

export function ChatbotEvaluationModal({ isOpen, onClose, score }: ChatbotEvaluationModalProps) {
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
  
  // If conversation is an array of strings, convert to message objects
  if (Array.isArray(conversation) && conversation.length > 0 && typeof conversation[0] === 'string') {
    conversation = conversation.map((msg, index) => ({
      role: index % 2 === 0 ? 'user' : 'assistant',
      content: msg
    }));
  }
  
  
  const hasDetailedScores = evaluation && (
    evaluation.grammar_score !== undefined ||
    evaluation.vocabulary_score !== undefined ||
    evaluation.coherence_score !== undefined ||
    evaluation.task_completion_score !== undefined ||
    evaluation.fluency_score !== undefined
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              AI Conversation Analysis
            </div>
            <Badge className={cn("text-lg px-3 py-1", getScoreColor(score.score))}>
              {score.score}% Overall
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Detailed evaluation of AI conversation performance
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[calc(90vh-120px)]">
          <div className="space-y-4 pr-4">
            {/* Session Information */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Conversation Details
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
                      <span className="font-medium">{score.task_id ? `Task ${score.task_id.slice(0, 8)}...` : 'General Conversation'}</span>
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
                          {evaluation?.strengths?.slice(0, 3).map((strength, index) => (
                            <div key={index} className="text-sm text-green-700 bg-green-50 p-2 rounded">
                              {strength}
                            </div>
                          )) || (
                            <div className="space-y-1">
                              {evaluation?.grammar_score && evaluation.grammar_score >= 70 && (
                                <div className="text-sm text-green-700">Good grammar usage</div>
                              )}
                              {evaluation?.vocabulary_score && evaluation.vocabulary_score >= 70 && (
                                <div className="text-sm text-green-700">Strong vocabulary</div>
                              )}
                              {evaluation?.coherence_score && evaluation.coherence_score >= 70 && (
                                <div className="text-sm text-green-700">Clear communication</div>
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
                          {evaluation?.improvements?.slice(0, 3).map((improvement, index) => (
                            <div key={index} className="text-sm text-orange-700 bg-orange-50 p-2 rounded">
                              {improvement}
                            </div>
                          )) || (
                            <div className="space-y-1">
                              {evaluation?.grammar_score && evaluation.grammar_score < 60 && (
                                <div className="text-sm text-orange-700">Focus on grammar patterns</div>
                              )}
                              {evaluation?.vocabulary_score && evaluation.vocabulary_score < 60 && (
                                <div className="text-sm text-orange-700">Expand vocabulary range</div>
                              )}
                              {evaluation?.coherence_score && evaluation.coherence_score < 60 && (
                                <div className="text-sm text-orange-700">Work on clarity</div>
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
                    {evaluation?.grammar_score !== undefined && (
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <Brain className="h-4 w-4" />
                            Grammar & Structure
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Accuracy</span>
                            <div className="flex items-center gap-2">
                              <span className="font-bold">{evaluation.grammar_score}%</span>
                              <Badge className={cn("text-xs", getSkillLevel(evaluation.grammar_score).color, getSkillLevel(evaluation.grammar_score).bgColor)}>
                                {getSkillLevel(evaluation.grammar_score).level}
                              </Badge>
                            </div>
                          </div>
                          <Progress value={evaluation.grammar_score} className="h-2" />
                        </CardContent>
                      </Card>
                    )}

                    {evaluation?.vocabulary_score !== undefined && (
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <Languages className="h-4 w-4" />
                            Vocabulary Usage
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Range & Appropriateness</span>
                            <div className="flex items-center gap-2">
                              <span className="font-bold">{evaluation.vocabulary_score}%</span>
                              <Badge className={cn("text-xs", getSkillLevel(evaluation.vocabulary_score).color, getSkillLevel(evaluation.vocabulary_score).bgColor)}>
                                {getSkillLevel(evaluation.vocabulary_score).level}
                              </Badge>
                            </div>
                          </div>
                          <Progress value={evaluation.vocabulary_score} className="h-2" />
                        </CardContent>
                      </Card>
                    )}

                    {evaluation?.coherence_score !== undefined && (
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <MessageCircle className="h-4 w-4" />
                            Communication Clarity
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Coherence & Flow</span>
                            <div className="flex items-center gap-2">
                              <span className="font-bold">{evaluation.coherence_score}%</span>
                              <Badge className={cn("text-xs", getSkillLevel(evaluation.coherence_score).color, getSkillLevel(evaluation.coherence_score).bgColor)}>
                                {getSkillLevel(evaluation.coherence_score).level}
                              </Badge>
                            </div>
                          </div>
                          <Progress value={evaluation.coherence_score} className="h-2" />
                        </CardContent>
                      </Card>
                    )}

                    {evaluation?.task_completion_score !== undefined && (
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <Target className="h-4 w-4" />
                            Task Completion
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Goal Achievement</span>
                            <div className="flex items-center gap-2">
                              <span className="font-bold">{evaluation.task_completion_score}%</span>
                              <Badge className={cn("text-xs", getSkillLevel(evaluation.task_completion_score).color, getSkillLevel(evaluation.task_completion_score).bgColor)}>
                                {getSkillLevel(evaluation.task_completion_score).level}
                              </Badge>
                            </div>
                          </div>
                          <Progress value={evaluation.task_completion_score} className="h-2" />
                        </CardContent>
                      </Card>
                    )}

                    {evaluation?.fluency_score !== undefined && (
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <MessageSquare className="h-4 w-4" />
                            Conversational Fluency
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
                        {conversation.map((message, index) => {
                          // Handle various possible message formats
                          let role = message.role || message.sender || 'unknown';
                          const content = message.content || message.text || message.message || '';
                          
                          // Normalize role names
                          role = role.toLowerCase();
                          const isStudent = role === 'user' || role === 'student' || role === 'human' || role === 'learner';
                          const isAssistant = role === 'assistant' || role === 'bot' || role === 'ai' || role === 'chatbot' || role === 'system';
                          
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
                                    <Bot className="h-3 w-3" />
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
                {(evaluation?.feedback || score.feedback) && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">AI Evaluation Feedback</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {evaluation?.feedback || score.feedback}
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
                        {evaluation.errors.map((error, index) => (
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
                          <li>• Focus on basic conversation patterns and common phrases</li>
                        )}
                        {score.score >= 60 && score.score < 80 && (
                          <li>• Practice more complex sentence structures and varied vocabulary</li>
                        )}
                        {score.score >= 80 && (
                          <li>• Excellent work! Continue practicing to maintain fluency</li>
                        )}
                        <li>• Engage in more AI conversations to build confidence</li>
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
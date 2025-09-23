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
  TrendingDown,
  Calendar,
  User,
  Hash,
  Activity,
  BarChart3,
  MessageCircle,
  Timer,
  Zap,
  Clock,
  Users,
  ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";

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

interface DiscourseAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: StudentDiscourse | null;
}

export function DiscourseAnalysisModal({ isOpen, onClose, student }: DiscourseAnalysisModalProps) {
  if (!student) return null;

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

  const getTurnTakingLabel = (pattern: string) => {
    switch (pattern) {
      case 'highly-interactive': return 'Highly Interactive';
      case 'interactive': return 'Interactive';
      case 'moderate': return 'Moderate';
      default: return 'Minimal';
    }
  };

  const getMessageLengthCategory = (length: number) => {
    if (length >= 15) return { label: 'Detailed', color: 'text-green-600', bgColor: 'bg-green-50' };
    if (length >= 8) return { label: 'Moderate', color: 'text-blue-600', bgColor: 'bg-blue-50' };
    if (length >= 4) return { label: 'Brief', color: 'text-orange-600', bgColor: 'bg-orange-50' };
    return { label: 'Very Brief', color: 'text-red-600', bgColor: 'bg-red-50' };
  };


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Discourse Analysis - {student.name}
            </div>
            <Badge variant={getEngagementBadgeVariant(student.engagementScore)} className="text-lg px-3 py-1">
              {student.engagementScore}% Engagement
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Detailed conversation patterns and communication analytics
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[calc(90vh-120px)]">
          <div className="space-y-4 pr-4">
            {/* Student Information */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Communication Overview
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
                      <MessageSquare className="h-3 w-3 text-muted-foreground" />
                      <span className="text-muted-foreground">Total Messages:</span>
                      <span className="font-medium">{student.totalMessages}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Target className="h-3 w-3 text-muted-foreground" />
                      <span className="text-muted-foreground">Conversations:</span>
                      <span className="font-medium">{student.totalConversations}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 h-auto">
                <TabsTrigger value="overview" className="text-xs px-2 py-2">Overview</TabsTrigger>
                <TabsTrigger value="patterns" className="text-xs px-2 py-2">Patterns</TabsTrigger>
                <TabsTrigger value="conversations" className="text-xs px-2 py-2">Conversations</TabsTrigger>
                <TabsTrigger value="insights" className="text-xs px-2 py-2">Insights</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Communication Statistics */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <BarChart3 className="h-4 w-4" />
                        Communication Statistics
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="text-center">
                          <div className="text-2xl font-bold">{student.totalMessages}</div>
                          <div className="text-muted-foreground">Total Messages</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold">{student.totalConversations}</div>
                          <div className="text-muted-foreground">Conversations</div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Recent Activity</span>
                          <span className="font-bold">{student.recentMessages} messages</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Monthly Total</span>
                          <span className="font-bold">{student.monthlyMessages} messages</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Engagement Tracking */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Zap className="h-4 w-4" />
                        Engagement Analysis
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="text-center">
                        <Badge variant={getEngagementBadgeVariant(student.engagementScore)} className="text-3xl font-bold px-4 py-2">
                          {student.engagementScore}%
                        </Badge>
                        <div className="text-sm text-muted-foreground mt-2">
                          Overall Engagement Score
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Conversation Frequency</span>
                          <span className="text-sm font-bold">{student.conversationFrequency} days</span>
                        </div>
                        <Progress value={Math.min((student.conversationFrequency / 30) * 100, 100)} className="h-2" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Message Length Analysis */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Hash className="h-4 w-4" />
                      Message Length Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-xl font-bold">{student.averageMessageLength}</div>
                        <div className="text-xs text-muted-foreground">Avg Words/Message</div>
                        <Badge className={cn("text-xs mt-1", getMessageLengthCategory(student.averageMessageLength).color, getMessageLengthCategory(student.averageMessageLength).bgColor)}>
                          {getMessageLengthCategory(student.averageMessageLength).label}
                        </Badge>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-bold">{student.averageConversationLength}</div>
                        <div className="text-xs text-muted-foreground">Avg Messages/Conversation</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-bold">{student.conversationFrequency}</div>
                        <div className="text-xs text-muted-foreground">Active Days</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Communication Patterns Tab */}
              <TabsContent value="patterns" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Activity Sources */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Activity className="h-4 w-4" />
                        Activity Sources
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <MessageCircle className="h-4 w-4 text-blue-500" />
                            <span className="text-sm">Speaking Practice</span>
                          </div>
                          <Badge variant="secondary">{student.sourceBreakdown.speaking} messages</Badge>
                        </div>
                        <Progress 
                          value={student.totalMessages > 0 ? (student.sourceBreakdown.speaking / student.totalMessages) * 100 : 0} 
                          className="h-2" 
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <MessageSquare className="h-4 w-4 text-green-500" />
                            <span className="text-sm">Chatbot Conversations</span>
                          </div>
                          <Badge variant="outline">{student.sourceBreakdown.chatbot} messages</Badge>
                        </div>
                        <Progress 
                          value={student.totalMessages > 0 ? (student.sourceBreakdown.chatbot / student.totalMessages) * 100 : 0} 
                          className="h-2" 
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Turn-Taking Patterns */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Interaction Patterns
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {student.conversationMetrics.slice(0, 4).map((conversation, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div className="flex items-center gap-2">
                            {getTurnTakingIcon(conversation.turnTaking)}
                            <span className="text-sm">{getTurnTakingLabel(conversation.turnTaking)}</span>
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-muted-foreground">{conversation.messageCount} messages</div>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>

                {/* Language Patterns */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Activity className="h-4 w-4" />
                      Communication Patterns
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-medium text-sm mb-3">Conversation Activity</h4>
                        <div className="space-y-2">
                          <div className="text-3xl font-bold text-center">{student.conversationFrequency}</div>
                          <div className="text-sm text-center text-muted-foreground">active days with conversations</div>
                          <Progress value={Math.min((student.conversationFrequency / 30) * 100, 100)} className="h-3" />
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-sm mb-3">Communication Quality</h4>
                        <div className="space-y-2">
                          {student.averageMessageLength >= 8 && (
                            <div className="flex items-center gap-2 text-blue-700 bg-blue-50 p-2 rounded">
                              <ArrowRight className="h-3 w-3" />
                              <span className="text-sm">Detailed responses</span>
                            </div>
                          )}
                          {student.engagementScore >= 70 && (
                            <div className="flex items-center gap-2 text-green-700 bg-green-50 p-2 rounded">
                              <ArrowRight className="h-3 w-3" />
                              <span className="text-sm">High engagement level</span>
                            </div>
                          )}
                          {student.conversationFrequency >= 15 && (
                            <div className="flex items-center gap-2 text-green-700 bg-green-50 p-2 rounded">
                              <ArrowRight className="h-3 w-3" />
                              <span className="text-sm">Regular practice schedule</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Conversations Tab */}
              <TabsContent value="conversations" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Recent Conversations</CardTitle>
                    <div className="text-sm text-muted-foreground">
                      {student.detailedConversations.length} recent conversation sessions
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[400px]">
                      <div className="space-y-3">
                        {student.detailedConversations.map((conversation, index) => (
                          <Card key={index} className="p-4">
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-xs">
                                    {conversation.source === 'speaking' ? 'Speaking Practice' : 'Chatbot Chat'}
                                  </Badge>
                                  {conversation.turnTaking && (
                                    <Badge variant="secondary" className="text-xs">
                                      {getTurnTakingLabel(conversation.turnTaking)}
                                    </Badge>
                                  )}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {conversation.createdAt && format(new Date(conversation.createdAt), 'MMM dd, HH:mm')}
                                </div>
                              </div>

                              <div className="grid grid-cols-3 gap-4 text-sm">
                                <div className="text-center">
                                  <div className="font-bold">{conversation.messageCount}</div>
                                  <div className="text-muted-foreground text-xs">Total Messages</div>
                                </div>
                                <div className="text-center">
                                  <div className="font-bold">{conversation.userMessageCount}</div>
                                  <div className="text-muted-foreground text-xs">User Messages</div>
                                </div>
                                <div className="text-center">
                                  <div className="font-bold">{conversation.averageMessageLength}</div>
                                  <div className="text-muted-foreground text-xs">Avg Words</div>
                                </div>
                              </div>

                              <div className="flex items-center justify-between pt-2 border-t">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-muted-foreground">Engagement:</span>
                                  <Progress value={Math.min(conversation.engagement * 50, 100)} className="h-1 w-16" />
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

              {/* Insights Tab */}
              <TabsContent value="insights" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Communication Insights & Recommendations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium text-sm mb-2">Strengths:</h4>
                        <div className="space-y-2 text-sm text-green-700">
                          {student.engagementScore >= 70 && (
                            <div className="flex items-center gap-2 bg-green-50 p-2 rounded">
                              <ArrowRight className="h-3 w-3" />
                              High engagement and active participation in conversations
                            </div>
                          )}
                          {student.averageMessageLength >= 10 && (
                            <div className="flex items-center gap-2 bg-green-50 p-2 rounded">
                              <ArrowRight className="h-3 w-3" />
                              Provides detailed and thoughtful responses
                            </div>
                          )}
                          {student.conversationFrequency >= 15 && (
                            <div className="flex items-center gap-2 bg-green-50 p-2 rounded">
                              <ArrowRight className="h-3 w-3" />
                              Regular and consistent practice schedule
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-sm mb-2">Areas for Improvement:</h4>
                        <div className="space-y-2 text-sm text-orange-700">
                          {student.averageMessageLength < 5 && (
                            <div className="flex items-center gap-2 bg-orange-50 p-2 rounded">
                              <ArrowRight className="h-3 w-3" />
                              Encourage longer, more detailed responses
                            </div>
                          )}
                          {student.engagementScore < 50 && (
                            <div className="flex items-center gap-2 bg-orange-50 p-2 rounded">
                              <ArrowRight className="h-3 w-3" />
                              Increase participation and interaction frequency
                            </div>
                          )}
                          {student.conversationFrequency < 7 && (
                            <div className="flex items-center gap-2 bg-orange-50 p-2 rounded">
                              <ArrowRight className="h-3 w-3" />
                              Establish more regular conversation practice
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-sm mb-2">Progress Summary:</h4>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p>Total of {student.totalMessages} messages across {student.totalConversations} conversations.</p>
                          <p>Average message length of {student.averageMessageLength} words indicates {getMessageLengthCategory(student.averageMessageLength).label.toLowerCase()} communication style.</p>
                          <p>Active on {student.conversationFrequency} different days, showing {student.conversationFrequency >= 15 ? 'regular' : student.conversationFrequency >= 7 ? 'moderate' : 'limited'} practice frequency.</p>
                          {student.mostRecentActivity && (
                            <p>Most recent conversation activity on {format(new Date(student.mostRecentActivity), 'MMMM dd, yyyy')}.</p>
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
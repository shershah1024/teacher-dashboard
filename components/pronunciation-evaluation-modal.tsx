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
  Volume2, 
  Target, 
  TrendingUp,
  Calendar,
  User,
  BookOpen,
  Award,
  Mic,
  Play,
  BarChart3,
  CheckCircle2,
  AlertTriangle
} from "lucide-react";
import { cn } from "@/lib/utils";

interface WordScore {
  word: string;
  score: number;
  id: number;
}

interface PronunciationSession {
  attempt_id: string;
  user_id: string;
  userName?: string;
  organization?: string;
  task_id: string;
  course: string;
  completed_at: string;
  words: WordScore[];
  averageScore: number;
  totalWords: number;
}

interface PronunciationEvaluationModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: PronunciationSession | null;
}

export function PronunciationEvaluationModal({ isOpen, onClose, session }: PronunciationEvaluationModalProps) {
  if (!session) return null;

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getWordScoreBadgeVariant = (score: number): "default" | "secondary" | "destructive" | "outline" => {
    if (score >= 80) return 'default';
    if (score >= 60) return 'secondary';
    if (score >= 40) return 'outline';
    return 'destructive';
  };

  const getWordDifficultyLevel = (score: number) => {
    if (score >= 90) return { level: 'Excellent', color: 'text-green-700', bgColor: 'bg-green-50' };
    if (score >= 80) return { level: 'Good', color: 'text-blue-700', bgColor: 'bg-blue-50' };
    if (score >= 70) return { level: 'Fair', color: 'text-yellow-700', bgColor: 'bg-yellow-50' };
    if (score >= 60) return { level: 'Needs Work', color: 'text-orange-700', bgColor: 'bg-orange-50' };
    return { level: 'Challenging', color: 'text-red-700', bgColor: 'bg-red-50' };
  };

  const sortedWords = [...session.words].sort((a, b) => a.score - b.score); // Lowest scores first
  const excellentWords = session.words.filter(w => w.score >= 85);
  const challengingWords = session.words.filter(w => w.score < 70);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Volume2 className="h-5 w-5" />
              Pronunciation Session Analysis
            </div>
            <Badge className={cn("text-lg px-3 py-1", getScoreColor(session.averageScore))}>
              {session.averageScore.toFixed(1)}% Average
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Detailed pronunciation evaluation for {session.userName || session.user_id}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[calc(90vh-120px)]">
          <div className="space-y-4 pr-4">
            {/* Session Information */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Session Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <User className="h-3 w-3 text-muted-foreground" />
                      <span className="text-muted-foreground">Student:</span>
                      <span className="font-medium">{session.userName || session.user_id}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      <span className="text-muted-foreground">Date:</span>
                      <span className="font-medium">{format(new Date(session.completed_at), 'MMM dd, yyyy HH:mm')}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-3 w-3 text-muted-foreground" />
                      <span className="text-muted-foreground">Task:</span>
                      <Badge variant="outline">{session.task_id.replace(/_/g, ' ')}</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Award className="h-3 w-3 text-muted-foreground" />
                      <span className="text-muted-foreground">Course:</span>
                      <span className="font-medium uppercase">{session.course}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="words">Word Details</TabsTrigger>
                <TabsTrigger value="analysis">Analysis</TabsTrigger>
                <TabsTrigger value="recommendations">Tips</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Session Performance
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                      <div className="space-y-1">
                        <p className="text-2xl font-bold text-blue-600">{session.totalWords}</p>
                        <p className="text-xs text-muted-foreground">Words Practiced</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-2xl font-bold text-green-600">{excellentWords.length}</p>
                        <p className="text-xs text-muted-foreground">Excellent (85%+)</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-2xl font-bold text-red-600">{challengingWords.length}</p>
                        <p className="text-xs text-muted-foreground">Challenging (&lt;70%)</p>
                      </div>
                      <div className="space-y-1">
                        <p className={cn("text-2xl font-bold", getScoreColor(session.averageScore))}>
                          {session.averageScore.toFixed(1)}%
                        </p>
                        <p className="text-xs text-muted-foreground">Average Score</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Overall Progress</span>
                        <span className="text-sm font-bold">{session.averageScore.toFixed(1)}%</span>
                      </div>
                      <Progress value={session.averageScore} className="h-2" />
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Word Summary */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        Strong Words
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {excellentWords.slice(0, 5).map((word, index) => (
                          <div key={index} className="flex items-center justify-between">
                            <span className="text-sm font-medium">{word.word}</span>
                            <Badge variant="default" className="text-xs">
                              {word.score.toFixed(0)}%
                            </Badge>
                          </div>
                        ))}
                        {excellentWords.length === 0 && (
                          <p className="text-sm text-muted-foreground">No words scored above 85%</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-orange-500" />
                        Needs Practice
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {challengingWords.slice(0, 5).map((word, index) => (
                          <div key={index} className="flex items-center justify-between">
                            <span className="text-sm font-medium">{word.word}</span>
                            <Badge variant="destructive" className="text-xs">
                              {word.score.toFixed(0)}%
                            </Badge>
                          </div>
                        ))}
                        {challengingWords.length === 0 && (
                          <p className="text-sm text-muted-foreground">All words scored above 70%</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Word Details Tab */}
              <TabsContent value="words" className="space-y-4">
                <div className="space-y-3">
                  {sortedWords.map((wordScore, index) => {
                    const difficulty = getWordDifficultyLevel(wordScore.score);
                    
                    return (
                      <Card key={wordScore.id}>
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <CardTitle className="text-lg font-bold">
                                {wordScore.word}
                              </CardTitle>
                              <Badge className={cn("text-xs px-2 py-1", difficulty.color, difficulty.bgColor)}>
                                {difficulty.level}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-3">
                              <Badge variant={getWordScoreBadgeVariant(wordScore.score)} className="text-lg px-3 py-1">
                                {wordScore.score.toFixed(1)}%
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                #{index + 1}
                              </Badge>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-muted-foreground">Pronunciation Accuracy</span>
                              <span className="text-sm font-medium">{wordScore.score.toFixed(1)}%</span>
                            </div>
                            <Progress value={wordScore.score} className="h-2" />
                          </div>
                          
                          <div className="flex items-center justify-between pt-2 border-t">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Mic className="h-4 w-4" />
                              <span>Audio recording available</span>
                            </div>
                            <Badge variant="outline" className="flex items-center gap-1 text-xs">
                              <Play className="h-3 w-3" />
                              Play Recording
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
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
                        <div className={cn("text-2xl font-bold", getScoreColor(session.averageScore))}>
                          {session.averageScore >= 85 ? "Excellent" : 
                           session.averageScore >= 70 ? "Good" : 
                           session.averageScore >= 60 ? "Fair" : "Needs Work"}
                        </div>
                        <p className="text-sm text-muted-foreground">Overall Level</p>
                      </div>
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">
                          {((excellentWords.length / session.totalWords) * 100).toFixed(0)}%
                        </div>
                        <p className="text-sm text-muted-foreground">Words Mastered</p>
                      </div>
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">
                          {session.totalWords}
                        </div>
                        <p className="text-sm text-muted-foreground">Words Practiced</p>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-3">
                      <h4 className="font-medium">Score Distribution</h4>
                      <div className="space-y-2">
                        {[
                          { range: '90-100%', count: session.words.filter(w => w.score >= 90).length, color: 'bg-green-500' },
                          { range: '80-89%', count: session.words.filter(w => w.score >= 80 && w.score < 90).length, color: 'bg-blue-500' },
                          { range: '70-79%', count: session.words.filter(w => w.score >= 70 && w.score < 80).length, color: 'bg-yellow-500' },
                          { range: '60-69%', count: session.words.filter(w => w.score >= 60 && w.score < 70).length, color: 'bg-orange-500' },
                          { range: '0-59%', count: session.words.filter(w => w.score < 60).length, color: 'bg-red-500' }
                        ].map((item, index) => (
                          <div key={index} className="flex items-center gap-3">
                            <div className="w-16 text-xs text-muted-foreground">{item.range}</div>
                            <div className="flex-1 bg-gray-100 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full ${item.color}`}
                                style={{ width: `${(item.count / session.totalWords) * 100}%` }}
                              />
                            </div>
                            <div className="w-8 text-xs text-right">{item.count}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Recommendations Tab */}
              <TabsContent value="recommendations" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Practice Recommendations</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <h4 className="font-medium flex items-center gap-2">
                        <BarChart3 className="h-4 w-4" />
                        Personalized Tips
                      </h4>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        {session.averageScore < 70 && (
                          <li>• Focus on fundamental pronunciation patterns and repeat words slowly</li>
                        )}
                        {challengingWords.length > 0 && (
                          <li>• Pay special attention to these challenging words: <strong>{challengingWords.slice(0, 3).map(w => w.word).join(', ')}</strong></li>
                        )}
                        {session.averageScore >= 85 && (
                          <li>• Excellent work! Continue practicing to maintain your pronunciation skills</li>
                        )}
                        <li>• Practice with native speaker audio and record yourself for comparison</li>
                        <li>• Focus on rhythm and intonation patterns in German</li>
                        {session.totalWords < 5 && (
                          <li>• Try practicing with more words in each session for better progress</li>
                        )}
                      </ul>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <h4 className="font-medium">Next Steps</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <Card className="p-3">
                          <h5 className="text-sm font-medium text-green-700 mb-1">Keep Practicing</h5>
                          <p className="text-xs text-muted-foreground">
                            Words you&apos;ve mastered: {excellentWords.slice(0, 3).map(w => w.word).join(', ')}
                          </p>
                        </Card>
                        <Card className="p-3">
                          <h5 className="text-sm font-medium text-red-700 mb-1">Focus Areas</h5>
                          <p className="text-xs text-muted-foreground">
                            {challengingWords.length > 0 
                              ? `Work on: ${challengingWords.slice(0, 3).map(w => w.word).join(', ')}`
                              : "All words are progressing well!"
                            }
                          </p>
                        </Card>
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
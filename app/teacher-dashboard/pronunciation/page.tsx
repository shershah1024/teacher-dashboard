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
import { format } from "date-fns";
import { Search, ChevronLeft, User, Clock, Eye, TrendingUp, TrendingDown, FileText, BarChart3, Volume2, Mic, Mail } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from 'next/navigation';
import { PronunciationEvaluationModal } from "@/components/pronunciation-evaluation-modal";

interface WordScore {
  word: string;
  score: number;
  id: number;
}

interface PronunciationSession {
  attempt_id: string;
  user_id: string;
  userName?: string;
  userEmail?: string;
  userFirstName?: string;
  userLastName?: string;
  organization?: string;
  task_id: string;
  course: string;
  completed_at: string;
  words: WordScore[];
  averageScore: number;
  totalWords: number;
}


interface LearnerCard {
  user_id: string;
  name: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  organization: string;
  totalSessions: number;
  totalWords: number;
  averageScore: number;
  latestScore: number;
  latestDate: string;
  sessions: PronunciationSession[];
  trend: 'up' | 'down' | 'stable';
  difficultWords: string[];
  strongWords: string[];
}

export default function PronunciationDashboard() {
  const router = useRouter();
  const [pronunciationSessions, setPronunciationSessions] = useState<PronunciationSession[]>([]);
  const [learnerCards, setLearnerCards] = useState<LearnerCard[]>([]);
  const [filteredCards, setFilteredCards] = useState<LearnerCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSession, setSelectedSession] = useState<PronunciationSession | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLearner, setSelectedLearner] = useState<LearnerCard | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'score' | 'recent' | 'sessions'>('name');

  useEffect(() => {
    fetchPronunciationScores();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [learnerCards, searchQuery, sortBy]);

  const fetchPronunciationScores = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/teacher-dashboard/pronunciation-scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationCode: 'default' })
      });
      
      const data = await response.json();
      const sessions = data.sessions || [];
      
      setPronunciationSessions(sessions);
      
      // Group sessions by learner
      const learnerMap = new Map<string, LearnerCard>();
      
      sessions.forEach((session: PronunciationSession) => {
        if (!learnerMap.has(session.user_id)) {
          learnerMap.set(session.user_id, {
            user_id: session.user_id,
            name: session.userName || `Student ${session.user_id.slice(5, 9)}`,
            email: session.userEmail,
            firstName: session.userFirstName,
            lastName: session.userLastName,
            organization: session.organization || 'Unknown',
            totalSessions: 0,
            totalWords: 0,
            averageScore: 0,
            latestScore: 0,
            latestDate: session.completed_at,
            sessions: [],
            trend: 'stable',
            difficultWords: [],
            strongWords: []
          });
        }
        
        const learner = learnerMap.get(session.user_id)!;
        learner.sessions.push(session);
        learner.totalSessions++;
        learner.totalWords += session.totalWords;
        
        // Update latest score and date
        if (new Date(session.completed_at) > new Date(learner.latestDate)) {
          learner.latestDate = session.completed_at;
          learner.latestScore = session.averageScore;
        }
      });
      
      // Calculate averages, trends, and word difficulty analysis
      learnerMap.forEach(learner => {
        const totalScore = learner.sessions.reduce((sum, s) => sum + s.averageScore, 0);
        learner.averageScore = totalScore / learner.sessions.length;
        
        // Calculate trend (compare last 3 sessions if available)
        if (learner.sessions.length >= 2) {
          const sortedSessions = [...learner.sessions].sort((a, b) => 
            new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime()
          );
          const recent = sortedSessions.slice(0, Math.min(3, sortedSessions.length));
          const older = sortedSessions.slice(Math.min(3, sortedSessions.length));
          
          if (older.length > 0) {
            const recentAvg = recent.reduce((sum, s) => sum + s.averageScore, 0) / recent.length;
            const olderAvg = older.reduce((sum, s) => sum + s.averageScore, 0) / older.length;
            
            if (recentAvg > olderAvg + 5) learner.trend = 'up';
            else if (recentAvg < olderAvg - 5) learner.trend = 'down';
            else learner.trend = 'stable';
          }
        }
        
        // Analyze word difficulty for this learner
        const wordScores = new Map<string, number[]>();
        learner.sessions.forEach(session => {
          session.words.forEach(wordScore => {
            if (!wordScores.has(wordScore.word)) {
              wordScores.set(wordScore.word, []);
            }
            wordScores.get(wordScore.word)!.push(wordScore.score);
          });
        });
        
        const wordAverages = Array.from(wordScores.entries()).map(([word, scores]) => ({
          word,
          averageScore: scores.reduce((sum, score) => sum + score, 0) / scores.length
        }));
        
        learner.difficultWords = wordAverages
          .filter(w => w.averageScore < 70)
          .sort((a, b) => a.averageScore - b.averageScore)
          .slice(0, 3)
          .map(w => w.word);
          
        learner.strongWords = wordAverages
          .filter(w => w.averageScore >= 85)
          .sort((a, b) => b.averageScore - a.averageScore)
          .slice(0, 3)
          .map(w => w.word);
        
        // Sort sessions by date
        learner.sessions.sort((a, b) => 
          new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime()
        );
      });
      
      setLearnerCards(Array.from(learnerMap.values()));
    } catch (error) {
      console.error('Error fetching pronunciation scores:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...learnerCards];
    
    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(learner => 
        learner.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        learner.user_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (learner.email && learner.email.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    
    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'score':
          return b.averageScore - a.averageScore;
        case 'recent':
          return new Date(b.latestDate).getTime() - new Date(a.latestDate).getTime();
        case 'sessions':
          return b.totalSessions - a.totalSessions;
        default:
          return 0;
      }
    });
    
    setFilteredCards(filtered);
  };

  const handleSessionClick = (session: PronunciationSession) => {
    setSelectedSession(session);
    setIsModalOpen(true);
  };

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

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Enhanced Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="container mx-auto p-6 max-w-7xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-gray-900">Pronunciation Dashboard</h1>
              <p className="text-gray-600 mt-2">Individual learner pronunciation performance</p>
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

          {/* Real-time Stats Bar */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-amber-600">{filteredCards.length}</div>
                  <div className="text-sm text-amber-700">Active Learners</div>
                </div>
                <Volume2 className="h-8 w-8 text-amber-500" />
              </div>
            </div>
            
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-blue-600">{pronunciationSessions.length}</div>
                  <div className="text-sm text-blue-700">Total Sessions</div>
                </div>
                <Mic className="h-8 w-8 text-blue-500" />
              </div>
            </div>
            
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {filteredCards.length > 0 ? Math.round(filteredCards.reduce((sum, c) => sum + c.averageScore, 0) / filteredCards.length) : 0}%
                  </div>
                  <div className="text-sm text-green-700">Avg Score</div>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500" />
              </div>
            </div>
            
            <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-purple-600">
                    {filteredCards.length > 0 ? Math.round(filteredCards.reduce((sum, c) => sum + c.totalWords, 0) / filteredCards.length) : 0}
                  </div>
                  <div className="text-sm text-purple-700">Avg Words</div>
                </div>
                <FileText className="h-8 w-8 text-purple-500" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto p-6 max-w-7xl space-y-6">

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters & Search</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="col-span-2">
              <Label htmlFor="search">Search Learners</Label>
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
              <Select value={sortBy} onValueChange={(value: 'name' | 'score' | 'recent' | 'sessions') => setSortBy(value)}>
                <SelectTrigger id="sort">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="score">Average Score</SelectItem>
                  <SelectItem value="recent">Most Recent</SelectItem>
                  <SelectItem value="sessions">Sessions</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content - Learner View or Cards Grid */}
      {selectedLearner ? (
        // Individual Learner View
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold flex items-center gap-2">
              <User className="h-6 w-6" />
              {selectedLearner.name}&apos;s Pronunciation History
            </h2>
            <Button onClick={() => setSelectedLearner(null)} variant="outline">
              Back to All Learners
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Total Sessions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{selectedLearner.totalSessions}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Average Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={cn("text-2xl font-bold", getScoreColor(selectedLearner.averageScore))}>
                  {selectedLearner.averageScore.toFixed(1)}%
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Latest Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={cn("text-2xl font-bold", getScoreColor(selectedLearner.latestScore))}>
                  {selectedLearner.latestScore.toFixed(1)}%
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  {selectedLearner.trend === 'up' && <TrendingUp className="h-5 w-5 text-green-500" />}
                  {selectedLearner.trend === 'down' && <TrendingDown className="h-5 w-5 text-red-500" />}
                  {selectedLearner.trend === 'stable' && <BarChart3 className="h-5 w-5 text-blue-500" />}
                  <span className="font-medium capitalize">{selectedLearner.trend}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Word Performance Analysis */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Challenging Words</CardTitle>
                <CardDescription>Words that need more practice</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {selectedLearner.difficultWords.length > 0 ? (
                    selectedLearner.difficultWords.map((word, index) => (
                      <Badge key={index} variant="destructive" className="mr-2 mb-1">
                        {word}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No challenging words identified</p>
                  )}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Strong Words</CardTitle>
                <CardDescription>Words with excellent pronunciation</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {selectedLearner.strongWords.length > 0 ? (
                    selectedLearner.strongWords.map((word, index) => (
                      <Badge key={index} variant="default" className="mr-2 mb-1">
                        {word}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No strong words identified yet</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Pronunciation Sessions</CardTitle>
              <CardDescription>Click any session to view word-by-word pronunciation scores</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="space-y-3">
                  {selectedLearner.sessions.map((session) => (
                    <Card 
                      key={session.attempt_id} 
                      className="p-4 cursor-pointer hover:shadow-md transition-all"
                      onClick={() => handleSessionClick(session)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-3">
                            <Badge variant="outline" className="capitalize">
                              {session.task_id.replace(/_/g, ' ')}
                            </Badge>
                            <span className="text-sm text-muted-foreground uppercase">{session.course}</span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {format(new Date(session.completed_at), 'MMM dd, yyyy HH:mm')}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <Badge variant={getScoreBadgeVariant(session.averageScore)} className="text-lg px-3 py-1">
                              {session.averageScore.toFixed(1)}%
                            </Badge>
                            <p className="text-xs text-muted-foreground mt-1">
                              {session.totalWords} words
                            </p>
                          </div>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t">
                        <div className="flex flex-wrap gap-1">
                          {session.words.slice(0, 5).map((wordScore, index) => (
                            <Badge 
                              key={index} 
                              variant={wordScore.score >= 80 ? "default" : wordScore.score >= 60 ? "secondary" : "destructive"}
                              className="text-xs"
                            >
                              {wordScore.word}: {wordScore.score.toFixed(0)}%
                            </Badge>
                          ))}
                          {session.words.length > 5 && (
                            <Badge variant="outline" className="text-xs">
                              +{session.words.length - 5} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      ) : (
        // All Learners Grid View
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">
              {filteredCards.length} Learner{filteredCards.length !== 1 ? 's' : ''}
            </h2>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileText className="h-4 w-4" />
              {pronunciationSessions.length} Total Sessions
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCards.map((learner) => (
              <Card 
                key={learner.user_id} 
                className="hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 cursor-pointer border border-gray-200 shadow-md bg-white relative"
                onClick={() => setSelectedLearner(learner)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback className="bg-primary/10 text-primary">
                          <Volume2 className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base">{learner.name}</CardTitle>
                        <CardDescription className="text-xs space-y-1">
                          <div>{learner.organization}</div>
                          {learner.email && (
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Mail className="h-3 w-3" />
                              <span className="truncate">{learner.email}</span>
                            </div>
                          )}
                        </CardDescription>
                      </div>
                    </div>
                    {learner.trend === 'up' && <TrendingUp className="h-4 w-4 text-green-500" />}
                    {learner.trend === 'down' && <TrendingDown className="h-4 w-4 text-red-500" />}
                    {learner.trend === 'stable' && <BarChart3 className="h-4 w-4 text-blue-500" />}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-muted-foreground">Sessions</p>
                      <p className="font-semibold text-lg">{learner.totalSessions}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Avg Score</p>
                      <p className={cn("font-semibold text-lg", getScoreColor(learner.averageScore))}>
                        {learner.averageScore.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                  
                  <div className="pt-3 border-t">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Latest Score</span>
                      <Badge variant={getScoreBadgeVariant(learner.latestScore)}>
                        {learner.latestScore.toFixed(1)}%
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      <Clock className="h-3 w-3 inline mr-1" />
                      {format(new Date(learner.latestDate), 'MMM dd, yyyy')}
                    </p>
                  </div>

                  <div className="pt-2">
                    <p className="text-xs text-muted-foreground mb-1">Words practiced: {learner.totalWords}</p>
                    {learner.difficultWords.length > 0 && (
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-red-600">Challenging:</span>
                        <div className="flex flex-wrap gap-1">
                          {learner.difficultWords.slice(0, 2).map((word, index) => (
                            <Badge key={index} variant="destructive" className="text-xs px-1 py-0">
                              {word}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedLearner(learner);
                    }}
                  >
                    <Mic className="h-4 w-4 mr-2" />
                    View Pronunciation History
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Evaluation Modal */}
      <PronunciationEvaluationModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedSession(null);
        }}
        session={selectedSession}
      />
      </div>
    </div>
  );
}
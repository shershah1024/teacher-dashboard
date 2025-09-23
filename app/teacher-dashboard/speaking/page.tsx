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
import { Search, ChevronLeft, User, Clock, Eye, TrendingUp, TrendingDown, FileText, BarChart3, MessageSquare, Mic, Mail } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from 'next/navigation';
import { SpeakingEvaluationModal } from "@/components/speaking-evaluation-modal";

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

interface LearnerCard {
  user_id: string;
  name: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  organization: string;
  totalSessions: number;
  averageScore: number;
  averageGrammarScore?: number;
  averageCommunicationScore?: number;
  latestScore: number;
  latestDate: string;
  sessions: SpeakingScore[];
  trend: 'up' | 'down' | 'stable';
  uniqueLessons: number;
  uniqueTasks: number;
  conversationTopics: string[];
}

export default function SpeakingDashboard() {
  const router = useRouter();
  const [speakingScores, setSpeakingScores] = useState<SpeakingScore[]>([]);
  const [learnerCards, setLearnerCards] = useState<LearnerCard[]>([]);
  const [filteredCards, setFilteredCards] = useState<LearnerCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedScore, setSelectedScore] = useState<SpeakingScore | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLearner, setSelectedLearner] = useState<LearnerCard | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'score' | 'recent' | 'sessions'>('name');

  useEffect(() => {
    fetchSpeakingScores();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [learnerCards, searchQuery, sortBy]);

  const fetchSpeakingScores = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/teacher-dashboard/speaking-scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationCode: 'ANB' })
      });
      
      const userData = await response.json();
      
      // Convert the API structure to our format
      const allScores: SpeakingScore[] = [];
      const learnerMap = new Map<string, LearnerCard>();
      
      userData.forEach((user: any) => {
        allScores.push(...user.scores);
        
        if (!learnerMap.has(user.userId)) {
          learnerMap.set(user.userId, {
            user_id: user.userId,
            name: user.name,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            organization: 'ANB',
            totalSessions: user.totalSessions,
            averageScore: user.averageScore,
            averageGrammarScore: user.averageGrammarScore,
            averageCommunicationScore: user.averageCommunicationScore,
            latestScore: user.latestScore || 0,
            latestDate: user.latestDate || '',
            sessions: user.scores,
            trend: 'stable',
            uniqueLessons: user.uniqueLessons,
            uniqueTasks: user.uniqueTasks,
            conversationTopics: []
          });
        }
      });
      
      // Calculate trends and analyze conversation topics
      learnerMap.forEach(learner => {
        // Calculate trend (compare last 3 sessions if available)
        if (learner.sessions.length >= 2) {
          const sortedSessions = [...learner.sessions].sort((a, b) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
          const recent = sortedSessions.slice(0, Math.min(3, sortedSessions.length));
          const older = sortedSessions.slice(Math.min(3, sortedSessions.length));
          
          if (older.length > 0) {
            const recentAvg = recent.reduce((sum, s) => sum + s.score, 0) / recent.length;
            const olderAvg = older.reduce((sum, s) => sum + s.score, 0) / older.length;
            
            if (recentAvg > olderAvg + 5) learner.trend = 'up';
            else if (recentAvg < olderAvg - 5) learner.trend = 'down';
            else learner.trend = 'stable';
          }
        }
        
        // Extract conversation topics from task IDs or course names
        const topics = [...new Set(learner.sessions
          .map(s => {
            const topicSource = s.task_id || s.course_name || '';
            return topicSource
              .replace(/_/g, ' ')
              .replace(/lesson /i, '')
              .replace(/task /i, '')
              .replace(/week /i, 'Week ')
              .replace(/day/i, 'Day ')
              .trim();
          })
          .filter(Boolean)
        )];
        learner.conversationTopics = topics.slice(0, 5);
        
        // Sort sessions by date
        learner.sessions.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      });
      
      setSpeakingScores(allScores);
      setLearnerCards(Array.from(learnerMap.values()));
    } catch (error) {
      console.error('Error fetching speaking scores:', error);
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

  const handleScoreClick = (score: SpeakingScore) => {
    setSelectedScore(score);
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
              <h1 className="text-3xl font-bold tracking-tight text-gray-900">Speaking Practice Dashboard</h1>
              <p className="text-gray-600 mt-2">Oral communication performance and conversation analytics</p>
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
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-blue-600">{filteredCards.length}</div>
                  <div className="text-sm text-blue-700">Active Speakers</div>
                </div>
                <Mic className="h-8 w-8 text-blue-500" />
              </div>
            </div>
            
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-green-600">{speakingScores.length}</div>
                  <div className="text-sm text-green-700">Speaking Sessions</div>
                </div>
                <MessageSquare className="h-8 w-8 text-green-500" />
              </div>
            </div>
            
            <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-amber-600">
                    {filteredCards.length > 0 ? Math.round(filteredCards.reduce((sum, c) => sum + c.averageScore, 0) / filteredCards.length) : 0}%
                  </div>
                  <div className="text-sm text-amber-700">Avg Score</div>
                </div>
                <TrendingUp className="h-8 w-8 text-amber-500" />
              </div>
            </div>
            
            <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-indigo-600">
                    {filteredCards.length > 0 ? Math.round(filteredCards.reduce((sum, c) => sum + c.uniqueLessons, 0) / filteredCards.length) : 0}
                  </div>
                  <div className="text-sm text-indigo-700">Avg Topics</div>
                </div>
                <BarChart3 className="h-8 w-8 text-indigo-500" />
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
              {selectedLearner.name}&apos;s Speaking History
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
                  {selectedLearner.latestScore}%
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

          {/* Sub-scores if available */}
          {(selectedLearner.averageGrammarScore || selectedLearner.averageCommunicationScore) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Average Grammar & Vocabulary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={cn("text-2xl font-bold", getScoreColor(selectedLearner.averageGrammarScore || 0))}>
                    {selectedLearner.averageGrammarScore?.toFixed(1) || 0}%
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Average Communication</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={cn("text-2xl font-bold", getScoreColor(selectedLearner.averageCommunicationScore || 0))}>
                    {selectedLearner.averageCommunicationScore?.toFixed(1) || 0}%
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Speaking Topics */}
          <Card>
            <CardHeader>
              <CardTitle>Speaking Topics</CardTitle>
              <CardDescription>Topics covered in speaking practice sessions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {selectedLearner.conversationTopics.map((topic, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {topic}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Speaking Sessions</CardTitle>
              <CardDescription>Click any session to view detailed evaluation and conversation transcript</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="space-y-3">
                  {selectedLearner.sessions.map((session) => (
                    <Card 
                      key={session.id} 
                      className="p-4 cursor-pointer hover:shadow-md transition-all"
                      onClick={() => handleScoreClick(session)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-3">
                            <Badge variant="outline" className="capitalize">
                              {session.course_name ? session.course_name.replace(/_/g, ' ') : 'Practice'}
                            </Badge>
                            {session.task_id && (
                              <Badge variant="secondary" className="text-xs">
                                {session.task_id.includes('week') ? session.task_id.replace(/_/g, ' ') : `Task ${session.task_id.slice(0, 8)}...`}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {format(new Date(session.created_at), 'MMM dd, yyyy HH:mm')}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant={getScoreBadgeVariant(session.score)} className="text-lg px-3 py-1">
                            {session.score}%
                          </Badge>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      {session.feedback && (
                        <div className="mt-3 pt-3 border-t">
                          <p className="text-sm text-muted-foreground line-clamp-2">{session.feedback}</p>
                        </div>
                      )}
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
              {speakingScores.length} Total Speaking Sessions
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
                          <Mic className="h-4 w-4" />
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
                        {learner.latestScore}%
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      <Clock className="h-3 w-3 inline mr-1" />
                      {learner.latestDate ? format(new Date(learner.latestDate), 'MMM dd, yyyy') : 'No recent activity'}
                    </p>
                  </div>

                  <div className="pt-2">
                    <p className="text-xs text-muted-foreground mb-1">
                      Topics: {learner.uniqueLessons} | Tasks: {learner.uniqueTasks}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {learner.conversationTopics.slice(0, 2).map((topic, index) => (
                        <Badge key={index} variant="secondary" className="text-xs px-1 py-0">
                          {topic.slice(0, 15)}...
                        </Badge>
                      ))}
                      {learner.conversationTopics.length > 2 && (
                        <Badge variant="outline" className="text-xs px-1 py-0">
                          +{learner.conversationTopics.length - 2}
                        </Badge>
                      )}
                    </div>
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
                    <MessageSquare className="h-4 w-4 mr-2" />
                    View Speaking Sessions
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Evaluation Modal */}
      <SpeakingEvaluationModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedScore(null);
        }}
        score={selectedScore}
      />
      </div>
    </div>
  );
}
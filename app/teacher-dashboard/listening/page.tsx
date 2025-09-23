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
import { Search, ChevronLeft, User, Clock, Eye, TrendingUp, TrendingDown, FileText, BarChart3, Headphones, Play, Volume2, Mail } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from 'next/navigation';
import { ListeningEvaluationModal } from "@/components/listening-evaluation-modal";

interface QuestionResult {
  questionNumber: number;
  selectedAnswer: string;
  isCorrect: boolean;
}

interface ListeningResult {
  id: string;
  user_id: string;
  userName?: string;
  userEmail?: string;
  userFirstName?: string;
  userLastName?: string;
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

interface LearnerCard {
  user_id: string;
  name: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  organization: string;
  totalAttempts: number;
  averageScore: number;
  latestScore: number;
  latestDate: string;
  results: ListeningResult[];
  trend: 'up' | 'down' | 'stable';
  audioTopics: string[];
  strongTopics: string[];
  challengingTopics: string[];
  totalAudiosCompleted: number;
  averagePlayCount: number;
  transcriptUsageRate: number;
}

export default function ListeningDashboard() {
  const router = useRouter();
  const [listeningResults, setListeningResults] = useState<ListeningResult[]>([]);
  const [learnerCards, setLearnerCards] = useState<LearnerCard[]>([]);
  const [filteredCards, setFilteredCards] = useState<LearnerCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedResult, setSelectedResult] = useState<ListeningResult | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLearner, setSelectedLearner] = useState<LearnerCard | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'score' | 'recent' | 'attempts'>('name');

  useEffect(() => {
    fetchListeningResults();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [learnerCards, searchQuery, sortBy]);

  const fetchListeningResults = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/teacher-dashboard/listening-scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationCode: 'ANB' })
      });
      
      const data = await response.json();
      const results = data.results || [];
      setListeningResults(results);
      
      // Group results by learner
      const learnerMap = new Map<string, LearnerCard>();
      
      results.forEach((result: ListeningResult) => {
        if (!learnerMap.has(result.user_id)) {
          learnerMap.set(result.user_id, {
            user_id: result.user_id,
            name: result.userName || `Student ${result.user_id.slice(5, 9)}`,
            email: result.userEmail,
            firstName: result.userFirstName,
            lastName: result.userLastName,
            organization: result.organization || 'Unknown',
            totalAttempts: 0,
            averageScore: 0,
            latestScore: 0,
            latestDate: result.created_at,
            results: [],
            trend: 'stable',
            audioTopics: [],
            strongTopics: [],
            challengingTopics: [],
            totalAudiosCompleted: 0,
            averagePlayCount: 0,
            transcriptUsageRate: 0
          });
        }
        
        const learner = learnerMap.get(result.user_id)!;
        learner.results.push(result);
        learner.totalAttempts++;
        
        // Update latest score and date
        if (new Date(result.created_at) > new Date(learner.latestDate)) {
          learner.latestDate = result.created_at;
          learner.latestScore = result.scorePercentage;
        }
        
        // Collect unique audio topics
        if (result.audio_title && !learner.audioTopics.includes(result.audio_title)) {
          learner.audioTopics.push(result.audio_title);
        }
      });
      
      // Calculate averages, trends, and topic analysis
      learnerMap.forEach(learner => {
        const totalScore = learner.results.reduce((sum, r) => sum + r.scorePercentage, 0);
        learner.averageScore = totalScore / learner.results.length;
        learner.totalAudiosCompleted = learner.audioTopics.length;
        
        // Calculate audio engagement metrics
        const totalPlayCount = learner.results.reduce((sum, r) => sum + r.audio_play_count, 0);
        learner.averagePlayCount = totalPlayCount / learner.results.length;
        
        const transcriptUsedCount = learner.results.filter(r => r.transcript_viewed).length;
        learner.transcriptUsageRate = (transcriptUsedCount / learner.results.length) * 100;
        
        // Calculate trend (compare last 3 attempts if available)
        if (learner.results.length >= 2) {
          const sortedResults = [...learner.results].sort((a, b) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
          const recent = sortedResults.slice(0, Math.min(3, sortedResults.length));
          const older = sortedResults.slice(Math.min(3, sortedResults.length));
          
          if (older.length > 0) {
            const recentAvg = recent.reduce((sum, r) => sum + r.scorePercentage, 0) / recent.length;
            const olderAvg = older.reduce((sum, r) => sum + r.scorePercentage, 0) / older.length;
            
            if (recentAvg > olderAvg + 5) learner.trend = 'up';
            else if (recentAvg < olderAvg - 5) learner.trend = 'down';
            else learner.trend = 'stable';
          }
        }
        
        // Analyze topic performance
        const topicPerformance = new Map<string, number[]>();
        learner.results.forEach(result => {
          if (!topicPerformance.has(result.audio_title)) {
            topicPerformance.set(result.audio_title, []);
          }
          topicPerformance.get(result.audio_title)!.push(result.scorePercentage);
        });
        
        const topicAverages = Array.from(topicPerformance.entries()).map(([topic, scores]) => ({
          topic,
          averageScore: scores.reduce((sum, score) => sum + score, 0) / scores.length
        }));
        
        learner.strongTopics = topicAverages
          .filter(t => t.averageScore >= 80)
          .sort((a, b) => b.averageScore - a.averageScore)
          .slice(0, 3)
          .map(t => t.topic);
          
        learner.challengingTopics = topicAverages
          .filter(t => t.averageScore < 60)
          .sort((a, b) => a.averageScore - b.averageScore)
          .slice(0, 3)
          .map(t => t.topic);
        
        // Sort results by date
        learner.results.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      });
      
      setLearnerCards(Array.from(learnerMap.values()));
    } catch (error) {
      console.error('Error fetching listening results:', error);
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
        case 'attempts':
          return b.totalAttempts - a.totalAttempts;
        default:
          return 0;
      }
    });
    
    setFilteredCards(filtered);
  };

  const handleResultClick = (result: ListeningResult) => {
    setSelectedResult(result);
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

  const getEngagementColor = (playCount: number) => {
    if (playCount >= 3) return 'text-orange-600';
    if (playCount === 2) return 'text-yellow-600';
    return 'text-green-600';
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
              <h1 className="text-3xl font-bold tracking-tight text-gray-900">Listening Comprehension Dashboard</h1>
              <p className="text-gray-600 mt-2">Audio comprehension performance and engagement analytics</p>
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
            <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-orange-600">{filteredCards.length}</div>
                  <div className="text-sm text-orange-700">Active Learners</div>
                </div>
                <Headphones className="h-8 w-8 text-orange-500" />
              </div>
            </div>
            
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-blue-600">{listeningResults.length}</div>
                  <div className="text-sm text-blue-700">Total Attempts</div>
                </div>
                <Volume2 className="h-8 w-8 text-blue-500" />
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
            
            <div className="bg-teal-50 rounded-lg p-4 border border-teal-200">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-teal-600">
                    {filteredCards.length > 0 ? Math.round(filteredCards.reduce((sum, c) => sum + c.totalAudiosCompleted, 0) / filteredCards.length) : 0}
                  </div>
                  <div className="text-sm text-teal-700">Avg Audios</div>
                </div>
                <FileText className="h-8 w-8 text-teal-500" />
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
              <Select value={sortBy} onValueChange={(value: 'name' | 'score' | 'recent' | 'attempts') => setSortBy(value)}>
                <SelectTrigger id="sort">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="score">Average Score</SelectItem>
                  <SelectItem value="recent">Most Recent</SelectItem>
                  <SelectItem value="attempts">Attempts</SelectItem>
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
              {selectedLearner.name}&apos;s Listening History
            </h2>
            <Button onClick={() => setSelectedLearner(null)} variant="outline">
              Back to All Learners
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Total Attempts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{selectedLearner.totalAttempts}</div>
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

          {/* Audio Engagement Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Play className="h-4 w-4" />
                  Avg. Audio Replays
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={cn("text-2xl font-bold", getEngagementColor(selectedLearner.averagePlayCount))}>
                  {selectedLearner.averagePlayCount.toFixed(1)}x
                </div>
                <p className="text-xs text-muted-foreground">per exercise</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Transcript Usage
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {selectedLearner.transcriptUsageRate.toFixed(0)}%
                </div>
                <p className="text-xs text-muted-foreground">of exercises</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Volume2 className="h-4 w-4" />
                  Audio Topics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {selectedLearner.totalAudiosCompleted}
                </div>
                <p className="text-xs text-muted-foreground">unique audios</p>
              </CardContent>
            </Card>
          </div>

          {/* Audio Performance Analysis */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Strong Audio Topics</CardTitle>
                <CardDescription>Topics with excellent comprehension</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {selectedLearner.strongTopics.length > 0 ? (
                    selectedLearner.strongTopics.map((topic, index) => (
                      <Badge key={index} variant="default" className="mr-2 mb-1 text-xs">
                        {topic.length > 40 ? `${topic.slice(0, 40)}...` : topic}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No strong topics identified yet</p>
                  )}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Challenging Topics</CardTitle>
                <CardDescription>Topics that need more practice</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {selectedLearner.challengingTopics.length > 0 ? (
                    selectedLearner.challengingTopics.map((topic, index) => (
                      <Badge key={index} variant="destructive" className="mr-2 mb-1 text-xs">
                        {topic.length > 40 ? `${topic.slice(0, 40)}...` : topic}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No challenging topics identified</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Listening Attempts</CardTitle>
              <CardDescription>Click any attempt to view detailed analysis and question breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="space-y-3">
                  {selectedLearner.results.map((result) => (
                    <Card 
                      key={result.id} 
                      className="p-4 cursor-pointer hover:shadow-md transition-all"
                      onClick={() => handleResultClick(result)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-3">
                            <Badge variant="outline" className="capitalize">
                              {result.audio_title.length > 30 ? `${result.audio_title.slice(0, 30)}...` : result.audio_title}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {format(new Date(result.created_at), 'MMM dd, yyyy HH:mm')}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <Badge variant={getScoreBadgeVariant(result.scorePercentage)} className="text-lg px-3 py-1">
                              {result.scorePercentage}%
                            </Badge>
                            <p className="text-xs text-muted-foreground mt-1">
                              {result.score}/{result.max_score} points
                            </p>
                          </div>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t flex items-center justify-between">
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Play className="h-3 w-3" />
                            <span className={cn(getEngagementColor(result.audio_play_count))}>
                              {result.audio_play_count}x played
                            </span>
                          </div>
                          {result.transcript_viewed && (
                            <div className="flex items-center gap-1">
                              <FileText className="h-3 w-3" />
                              <span className="text-blue-600">Transcript viewed</span>
                            </div>
                          )}
                          {result.time_taken_seconds && (
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span>{Math.floor(result.time_taken_seconds / 60)}m {result.time_taken_seconds % 60}s</span>
                            </div>
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
              {listeningResults.length} Total Listening Attempts
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
                          <Headphones className="h-4 w-4" />
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
                      <p className="text-muted-foreground">Attempts</p>
                      <p className="font-semibold text-lg">{learner.totalAttempts}</p>
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
                      {format(new Date(learner.latestDate), 'MMM dd, yyyy')}
                    </p>
                  </div>

                  <div className="pt-2">
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                      <span>Audios: {learner.totalAudiosCompleted}</span>
                      <span className={cn(getEngagementColor(learner.averagePlayCount))}>
                        {learner.averagePlayCount.toFixed(1)}x avg replays
                      </span>
                    </div>
                    {learner.transcriptUsageRate > 0 && (
                      <div className="flex items-center gap-1 mb-1">
                        <FileText className="h-3 w-3 text-blue-500" />
                        <span className="text-xs text-blue-600">
                          {learner.transcriptUsageRate.toFixed(0)}% transcript use
                        </span>
                      </div>
                    )}
                    {learner.strongTopics.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {learner.strongTopics.slice(0, 1).map((topic, index) => (
                          <Badge key={index} variant="default" className="text-xs px-1 py-0">
                            {topic.slice(0, 15)}...
                          </Badge>
                        ))}
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
                    <Headphones className="h-4 w-4 mr-2" />
                    View Listening History
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Evaluation Modal */}
      <ListeningEvaluationModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedResult(null);
        }}
        result={selectedResult}
      />
      </div>
    </div>
  );
}
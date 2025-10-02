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
import { Search, ChevronLeft, User, Clock, Eye, PenTool, TrendingUp, TrendingDown, Award, FileText, BarChart3, Mail } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from 'next/navigation';
import { WritingEvaluationModal } from "@/components/writing-evaluation-modal";

interface WritingScore {
  id: string | number;
  user_id: string;
  userName?: string;
  userEmail?: string;
  userFirstName?: string;
  userLastName?: string;
  organization?: string;
  lesson_id?: string;
  task_id?: string;
  course?: string;
  section?: number;
  task_type?: string;
  prompt?: string;
  response?: string;
  score: number;
  total_score?: number;
  percentage?: number;
  evaluation_data?: any;
  feedback?: string;
  user_input?: string;
  correct_answer?: string;
  created_at: string;
  updated_at?: string;
  attempt_id?: number;
}

interface LearnerCard {
  user_id: string;
  name: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  organization: string;
  totalSubmissions: number;
  averageScore: number;
  latestScore: number;
  latestDate: string;
  scores: WritingScore[];
  trend: 'up' | 'down' | 'stable';
}

export default function WritingDashboard() {
  const router = useRouter();
  const [writingScores, setWritingScores] = useState<WritingScore[]>([]);
  const [learnerCards, setLearnerCards] = useState<LearnerCard[]>([]);
  const [filteredCards, setFilteredCards] = useState<LearnerCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedScore, setSelectedScore] = useState<WritingScore | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLearner, setSelectedLearner] = useState<LearnerCard | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'score' | 'recent' | 'submissions'>('name');

  useEffect(() => {
    fetchWritingScores();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [learnerCards, searchQuery, sortBy]);

  const fetchWritingScores = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/teacher-dashboard/writing-scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationCode: 'default' })
      });
      
      const data = await response.json();
      const scores = data.scores || [];
      setWritingScores(scores);
      
      // Group scores by learner
      const learnerMap = new Map<string, LearnerCard>();
      
      scores.forEach((score: WritingScore) => {
        if (!learnerMap.has(score.user_id)) {
          learnerMap.set(score.user_id, {
            user_id: score.user_id,
            name: score.userName || `Student ${score.user_id.slice(5, 9)}`,
            email: score.userEmail,
            firstName: score.userFirstName,
            lastName: score.userLastName,
            organization: score.organization || 'Unknown',
            totalSubmissions: 0,
            averageScore: 0,
            latestScore: 0,
            latestDate: score.created_at,
            scores: [],
            trend: 'stable'
          });
        }
        
        const learner = learnerMap.get(score.user_id)!;
        learner.scores.push(score);
        learner.totalSubmissions++;
        
        // Update latest score and date
        if (new Date(score.created_at) > new Date(learner.latestDate)) {
          learner.latestDate = score.created_at;
          learner.latestScore = score.percentage || score.score;
        }
      });
      
      // Calculate averages and trends
      learnerMap.forEach(learner => {
        const totalScore = learner.scores.reduce((sum, s) => sum + (s.percentage || s.score), 0);
        learner.averageScore = totalScore / learner.scores.length;
        
        // Calculate trend (compare last 3 scores if available)
        if (learner.scores.length >= 2) {
          const sortedScores = [...learner.scores].sort((a, b) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
          const recent = sortedScores.slice(0, Math.min(3, sortedScores.length));
          const older = sortedScores.slice(Math.min(3, sortedScores.length));
          
          if (older.length > 0) {
            const recentAvg = recent.reduce((sum, s) => sum + (s.percentage || s.score), 0) / recent.length;
            const olderAvg = older.reduce((sum, s) => sum + (s.percentage || s.score), 0) / older.length;
            
            if (recentAvg > olderAvg + 5) learner.trend = 'up';
            else if (recentAvg < olderAvg - 5) learner.trend = 'down';
            else learner.trend = 'stable';
          }
        }
        
        // Sort scores by date
        learner.scores.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      });
      
      setLearnerCards(Array.from(learnerMap.values()));
    } catch (error) {
      console.error('Error fetching writing scores:', error);
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
        case 'submissions':
          return b.totalSubmissions - a.totalSubmissions;
        default:
          return 0;
      }
    });
    
    setFilteredCards(filtered);
  };

  const handleScoreClick = (score: WritingScore) => {
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
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Writing Dashboard</h1>
          <p className="text-muted-foreground mt-2">Individual learner writing performance</p>
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
              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger id="sort">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="score">Average Score</SelectItem>
                  <SelectItem value="recent">Most Recent</SelectItem>
                  <SelectItem value="submissions">Submissions</SelectItem>
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
              {selectedLearner.name}'s Writing History
            </h2>
            <Button onClick={() => setSelectedLearner(null)} variant="outline">
              Back to All Learners
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Total Submissions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{selectedLearner.totalSubmissions}</div>
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

          <Card>
            <CardHeader>
              <CardTitle>Writing Submissions</CardTitle>
              <CardDescription>Click any submission to view detailed evaluation</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="space-y-3">
                  {selectedLearner.scores.map((score) => (
                    <Card 
                      key={score.id} 
                      className="p-4 cursor-pointer hover:shadow-md transition-all"
                      onClick={() => handleScoreClick(score)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-3">
                            <Badge variant="outline" className="capitalize">
                              {score.task_type || 'Writing Task'}
                            </Badge>
                            {score.course && (
                              <span className="text-sm text-muted-foreground uppercase">{score.course}</span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {format(new Date(score.created_at), 'MMM dd, yyyy HH:mm')}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant={getScoreBadgeVariant(score.percentage || score.score)} className="text-lg px-3 py-1">
                            {score.percentage || score.score}%
                          </Badge>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      {score.prompt && (
                        <div className="mt-3 pt-3 border-t">
                          <p className="text-sm text-muted-foreground line-clamp-2">{score.prompt}</p>
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
              {writingScores.length} Total Submissions
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredCards.map((learner) => (
              <Card 
                key={learner.user_id} 
                className="hover:shadow-lg transition-all cursor-pointer"
                onClick={() => setSelectedLearner(learner)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {learner.name.slice(0, 2).toUpperCase()}
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
                      <p className="text-muted-foreground">Submissions</p>
                      <p className="font-semibold text-lg">{learner.totalSubmissions}</p>
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
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedLearner(learner);
                    }}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Writing History
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Evaluation Modal */}
      <WritingEvaluationModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedScore(null);
        }}
        score={selectedScore}
      />
    </div>
  );
}
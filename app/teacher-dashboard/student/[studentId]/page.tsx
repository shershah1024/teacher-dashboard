/**
 * Individual Student Detail Page for Teachers
 *
 * Shows comprehensive analytics and progress for a single student
 * Allows teachers to drill down into specific areas of student performance
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import {
  ArrowLeft,
  Download,
  Mail,
  Calendar,
  Clock,
  TrendingUp,
  TrendingDown,
  Target,
  Award,
  AlertCircle,
  BookOpen,
  Headphones,
  Mic,
  PenTool,
  Brain,
  Volume2,
  MessageSquare,
  BarChart3,
  Activity,
  ChevronRight
} from 'lucide-react';
import { DashboardHeader } from "@/components/DashboardHeader";

interface DetailedStudentData {
  id: string;
  name: string;
  email: string;
  enrolledAt: string;
  lastActive: string;
  overallProgress: number;
  dailyStreak: number;
  longestStreak: number;
  weeklyWords: number;
  monthlyWords: number;
  totalWords: number;
  totalConversations: number;
  speakingConversations: number;
  chatbotConversations: number;
  skills: {
    speaking: number;
    listening: number;
    reading: number;
    writing: number;
    grammar: number;
    vocabulary: number;
    pronunciation: number;
  };
  weeklyActivity: {
    date: string;
    minutesSpent: number;
    exercisesCompleted: number;
  }[];
  recentLessons: {
    date: string;
    lessonName: string;
    type: string;
    score: number;
    timeSpent: number;
  }[];
  strengthsAndWeaknesses: {
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
  };
  testHistory: {
    date: string;
    testType: string;
    score: number;
    improvement: number;
  }[];
  vocabularyProgress: {
    date: string;
    wordsLearned: number;
    totalWords: number;
  }[];
}

export default function StudentDetailPage() {
  const params = useParams();
  const { user } = useUser();
  const studentId = params.studentId as string;
  const [studentData, setStudentData] = useState<DetailedStudentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState<'week' | 'month' | 'all'>('month');

  useEffect(() => {
    if (user?.id && studentId) {
      fetchStudentDetails();
    }
  }, [user?.id, studentId, selectedTimeRange]);

  const fetchStudentDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/teacher-dashboard/student-details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teacherId: user?.id,
          studentId,
          timeRange: selectedTimeRange
        })
      });

      if (response.ok) {
        const data = await response.json();
        setStudentData(data);
      }
    } catch (error) {
      console.error('Error fetching student details:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
        </div>
      </div>
    );
  }

  if (!studentData) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="text-center">
          <p className="text-gray-600">Student data not found</p>
          <Link href="/teacher-dashboard">
            <Button className="mt-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Consistent Dashboard Header */}
      <DashboardHeader
        title={studentData.name}
        description={studentData.email}
        icon={Activity}
        showBackButton={true}
        onRefresh={fetchStudentDetails}
        actions={
          <>
            <Button variant="ghost" size="sm" className="text-white hover:bg-white/10 hover:text-white">
              <Mail className="h-4 w-4 mr-2" />
              Send Message
            </Button>
            <Button variant="ghost" size="sm" className="text-white hover:bg-white/10 hover:text-white">
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          </>
        }
      />

      {/* Metrics Overview - Consistent Design */}
      <div className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-6 py-6 max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-blue-600 rounded-xl p-5 text-white shadow-md">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="text-sm font-medium text-blue-50 mb-1">Overall Progress</div>
                  <div className="text-4xl font-bold">{studentData.overallProgress}%</div>
                </div>
                <BarChart3 className="h-8 w-8 text-blue-100" />
              </div>
              <div className="text-sm text-blue-50">+8% this month</div>
            </div>

            <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-md">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="text-sm font-medium text-gray-600 mb-1">Current Streak</div>
                  <div className="text-4xl font-bold text-gray-900">{studentData.dailyStreak}</div>
                </div>
                <Target className="h-8 w-8 text-gray-400" />
              </div>
              <div className="text-sm text-gray-600">Longest: {studentData.longestStreak} days</div>
            </div>

            <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-md">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="text-sm font-medium text-gray-600 mb-1">Words Learned</div>
                  <div className="text-4xl font-bold text-gray-900">{studentData.totalWords}</div>
                </div>
                <Brain className="h-8 w-8 text-gray-400" />
              </div>
              <div className="text-sm text-gray-600">+{studentData.weeklyWords} this week</div>
            </div>

            <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-md">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="text-sm font-medium text-gray-600 mb-1">Conversations</div>
                  <div className="text-4xl font-bold text-gray-900">{studentData.totalConversations}</div>
                </div>
                <MessageSquare className="h-8 w-8 text-gray-400" />
              </div>
              <div className="text-sm text-gray-600">{studentData.speakingConversations} speaking</div>
            </div>

            <div className="bg-emerald-600 rounded-xl p-5 text-white shadow-md">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="text-sm font-medium text-emerald-50 mb-1">Last Active</div>
                  <div className="text-lg font-bold">{new Date(studentData.lastActive).toLocaleDateString()}</div>
                </div>
                <Clock className="h-8 w-8 text-emerald-100" />
              </div>
              <div className="text-sm text-emerald-50">{new Date(studentData.lastActive).toLocaleTimeString()}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto p-6 max-w-7xl">

      {/* Detailed Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="skills">Skills Analysis</TabsTrigger>
          <TabsTrigger value="activity">Activity Log</TabsTrigger>
          <TabsTrigger value="tests">Test History</TabsTrigger>
          <TabsTrigger value="vocabulary">Vocabulary</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Skills Radar */}
            <Card>
              <CardHeader>
                <CardTitle>Skills Overview</CardTitle>
                <CardDescription>Current proficiency levels</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Mic className="h-5 w-5 text-blue-500" />
                    <span className="text-sm font-medium w-24">Speaking</span>
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${studentData.skills.speaking}%` }}
                      />
                    </div>
                    <span className="text-sm font-bold w-12 text-right">
                      {studentData.skills.speaking}%
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <Headphones className="h-5 w-5 text-orange-500" />
                    <span className="text-sm font-medium w-24">Listening</span>
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-orange-500 h-2 rounded-full"
                        style={{ width: `${studentData.skills.listening}%` }}
                      />
                    </div>
                    <span className="text-sm font-bold w-12 text-right">
                      {studentData.skills.listening}%
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <BookOpen className="h-5 w-5 text-green-500" />
                    <span className="text-sm font-medium w-24">Reading</span>
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: `${studentData.skills.reading}%` }}
                      />
                    </div>
                    <span className="text-sm font-bold w-12 text-right">
                      {studentData.skills.reading}%
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <PenTool className="h-5 w-5 text-pink-500" />
                    <span className="text-sm font-medium w-24">Writing</span>
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-pink-500 h-2 rounded-full"
                        style={{ width: `${studentData.skills.writing}%` }}
                      />
                    </div>
                    <span className="text-sm font-bold w-12 text-right">
                      {studentData.skills.writing}%
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <AlertCircle className="h-5 w-5 text-red-500" />
                    <span className="text-sm font-medium w-24">Grammar</span>
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-red-500 h-2 rounded-full"
                        style={{ width: `${studentData.skills.grammar}%` }}
                      />
                    </div>
                    <span className="text-sm font-bold w-12 text-right">
                      {studentData.skills.grammar}%
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <Brain className="h-5 w-5 text-purple-500" />
                    <span className="text-sm font-medium w-24">Vocabulary</span>
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-purple-500 h-2 rounded-full"
                        style={{ width: `${studentData.skills.vocabulary}%` }}
                      />
                    </div>
                    <span className="text-sm font-bold w-12 text-right">
                      {studentData.skills.vocabulary}%
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <Volume2 className="h-5 w-5 text-cyan-500" />
                    <span className="text-sm font-medium w-24">Pronunciation</span>
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-cyan-500 h-2 rounded-full"
                        style={{ width: `${studentData.skills.pronunciation}%` }}
                      />
                    </div>
                    <span className="text-sm font-bold w-12 text-right">
                      {studentData.skills.pronunciation}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Lessons</CardTitle>
                <CardDescription>Last 10 completed activities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {studentData.recentLessons.slice(0, 10).map((lesson, index) => (
                    <div key={index} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                      <div className="flex-1">
                        <p className="text-sm font-medium">{lesson.lessonName}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs text-gray-500">
                            {new Date(lesson.date).toLocaleDateString()}
                          </span>
                          <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                            {lesson.type}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold">{lesson.score}%</p>
                        <p className="text-xs text-gray-500">{lesson.timeSpent} min</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Weekly Activity Chart */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Weekly Activity</CardTitle>
              <CardDescription>Time spent and exercises completed</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between gap-2 h-32">
                {studentData.weeklyActivity.map((day, index) => (
                  <div key={index} className="flex-1 flex flex-col items-center">
                    <div className="w-full bg-gray-200 rounded-t flex-1 flex items-end">
                      <div
                        className="w-full bg-blue-600 rounded-t"
                        style={{
                          height: `${(day.minutesSpent / 60) * 100}%`,
                          minHeight: day.minutesSpent > 0 ? '4px' : '0'
                        }}
                      />
                    </div>
                    <p className="text-xs mt-2">{new Date(day.date).toLocaleDateString('en', { weekday: 'short' })}</p>
                    <p className="text-xs text-gray-500">{day.minutesSpent}m</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Other tabs would be implemented similarly */}
        <TabsContent value="skills">
          <Card>
            <CardHeader>
              <CardTitle>Detailed Skills Analysis</CardTitle>
              <CardDescription>In-depth breakdown of student performance</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Skills analysis content would go here...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>Activity Log</CardTitle>
              <CardDescription>Complete history of student activities</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Activity log content would go here...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tests">
          <Card>
            <CardHeader>
              <CardTitle>Test History</CardTitle>
              <CardDescription>Performance in assessments over time</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Test history content would go here...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vocabulary">
          <Card>
            <CardHeader>
              <CardTitle>Vocabulary Progress</CardTitle>
              <CardDescription>Words learned and retention rate</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Vocabulary progress content would go here...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recommendations">
          <Card>
            <CardHeader>
              <CardTitle>Personalized Recommendations</CardTitle>
              <CardDescription>AI-generated insights and suggestions</CardDescription>
            </CardHeader>
            <CardContent>
              {studentData.strengthsAndWeaknesses && (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-medium mb-2 flex items-center gap-2">
                      <Award className="h-4 w-4 text-green-500" />
                      Strengths
                    </h3>
                    <ul className="space-y-1">
                      {studentData.strengthsAndWeaknesses.strengths.map((strength, index) => (
                        <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                          <ChevronRight className="h-4 w-4 text-green-500 mt-0.5" />
                          {strength}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-medium mb-2 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-yellow-500" />
                      Areas for Improvement
                    </h3>
                    <ul className="space-y-1">
                      {studentData.strengthsAndWeaknesses.weaknesses.map((weakness, index) => (
                        <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                          <ChevronRight className="h-4 w-4 text-yellow-500 mt-0.5" />
                          {weakness}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-medium mb-2 flex items-center gap-2">
                      <Target className="h-4 w-4 text-blue-500" />
                      Recommended Actions
                    </h3>
                    <ul className="space-y-1">
                      {studentData.strengthsAndWeaknesses.recommendations.map((rec, index) => (
                        <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                          <ChevronRight className="h-4 w-4 text-blue-500 mt-0.5" />
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
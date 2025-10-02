'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { getAllCourses, getCourseLessonUrl } from '@/lib/course-config';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import {
  Users,
  UserPlus,
  Mail,
  Upload,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Trash2,
  Download,
  Send,
  BookOpen,
  Activity,
  Settings,
  Bell,
  RefreshCw,
  Search,
  Clock,
  School,
  GraduationCap,
  TrendingUp,
  TrendingDown,
  BarChart3,
  FileSpreadsheet,
  Filter,
  MoreVertical,
  ArrowUpRight,
  UserCheck,
  UserX,
  Calendar,
  Building2,
  Award,
  Sparkles,
  Zap,
  Shield,
  ChevronLeft,
  Eye,
  Edit3,
  Copy,
  MailCheck,
  Loader2,
  CheckCheck,
  Info,
  ArrowRight,
  Target,
  Briefcase,
  Globe,
  Hash,
  Layers
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { DashboardHeader } from "@/components/DashboardHeader";

interface EnrollmentResult {
  email: string;
  success: boolean;
  message: string;
  alreadyEnrolled?: boolean;
  userExists?: boolean;
  invitationId?: string;
}

interface Enrollment {
  id: string;
  student_email: string;
  course_id: string;
  class_id?: string;
  organization_code: string;
  invited_by: string;
  invited_at: string;
  status: 'invited' | 'active';
  enrollment_data?: any;
  invitation_id?: string;
  invitation_status?: 'sent' | 'opened' | 'accepted' | 'expired' | 'revoked';
  invitation_sent_at?: string;
  invitation_accepted_at?: string;
  clerk_user_id?: string;
}

interface Class {
  id: string;
  class_id: string;
  class_name: string;
  course_id: string;
  organization_code: string;
  teacher_id: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  schedule?: any;
  max_students: number;
  current_students: number;
  status: string;
}

// Get courses from config and extend with UI properties
const coursesConfig = getAllCourses();
const courses = coursesConfig.map(course => {
  const colorMap: Record<string, { color: string; lightColor: string }> = {
    telc_a1: {
      color: 'from-emerald-500 to-teal-600',
      lightColor: 'bg-emerald-50 text-emerald-700 border-emerald-200'
    },
    telc_a2: {
      color: 'from-blue-500 to-indigo-600',
      lightColor: 'bg-blue-50 text-blue-700 border-blue-200'
    },
    telc_b1: {
      color: 'from-purple-500 to-pink-600',
      lightColor: 'bg-purple-50 text-purple-700 border-purple-200'
    },
    telc_b2: {
      color: 'from-orange-500 to-red-600',
      lightColor: 'bg-orange-50 text-orange-700 border-orange-200'
    }
  };
  
  return {
    ...course,
    ...colorMap[course.id],
    description: `Level ${course.level} German course`
  };
});

export default function ManageStudentsPage() {
  const router = useRouter();
  const { user } = useUser();
  const [selectedCourse, setSelectedCourse] = useState('telc_a1');
  const [selectedClass, setSelectedClass] = useState<string>('none');
  const [classes, setClasses] = useState<Class[]>([]);
  const [emailInput, setEmailInput] = useState('');
  const [bulkEmails, setBulkEmails] = useState('');
  const [inputMode, setInputMode] = useState<'single' | 'bulk'>('single');
  const [loading, setLoading] = useState(false);
  const [enrollmentResults, setEnrollmentResults] = useState<EnrollmentResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [filteredEnrollments, setFilteredEnrollments] = useState<Enrollment[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCourse, setFilterCourse] = useState('all');
  const [filterClass, setFilterClass] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [loadingEnrollments, setLoadingEnrollments] = useState(true);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [invitationMethod, setInvitationMethod] = useState<'regular' | 'magic_link'>('magic_link');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedEnrollments, setSelectedEnrollments] = useState<string[]>([]);

  useEffect(() => {
    fetchEnrollments();
    fetchClasses();
  }, []);

  useEffect(() => {
    const courseClasses = classes.filter(c => c.course_id === selectedCourse);
    if (courseClasses.length > 0 && selectedClass !== 'none' && !courseClasses.find(c => c.class_id === selectedClass)) {
      setSelectedClass(courseClasses[0]?.class_id || 'none');
    }
  }, [selectedCourse, classes, selectedClass]);

  useEffect(() => {
    applyFilters();
  }, [enrollments, searchQuery, filterCourse, filterClass, filterStatus]);

  const fetchClasses = async () => {
    try {
      setLoadingClasses(true);
      const response = await fetch(`/api/teacher-dashboard/classes`);
      const data = await response.json();

      if (response.ok && data.classes) {
        setClasses(data.classes);
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
    } finally {
      setLoadingClasses(false);
    }
  };

  const fetchEnrollments = async () => {
    try {
      setLoadingEnrollments(true);
      const response = await fetch(`/api/teacher-dashboard/enroll-students`);
      const data = await response.json();

      if (response.ok) {
        setEnrollments(data.enrollments);
      }
    } catch (error) {
      console.error('Error fetching enrollments:', error);
    } finally {
      setLoadingEnrollments(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...enrollments];

    if (searchQuery) {
      filtered = filtered.filter(enrollment =>
        enrollment.student_email.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (filterCourse !== 'all') {
      filtered = filtered.filter(enrollment => enrollment.course_id === filterCourse);
    }

    if (filterClass !== 'all') {
      filtered = filtered.filter(enrollment => enrollment.class_id === filterClass);
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(enrollment => enrollment.status === filterStatus);
    }

    setFilteredEnrollments(filtered);
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleAddStudents = async () => {
    setLoading(true);
    setShowResults(false);
    setEnrollmentResults([]);

    let emailsToProcess = '';
    if (inputMode === 'single') {
      emailsToProcess = emailInput;
    } else {
      emailsToProcess = bulkEmails;
    }

    if (!emailsToProcess.trim()) {
      setLoading(false);
      return;
    }

    try {
      const apiEndpoint = invitationMethod === 'magic_link' 
        ? '/api/teacher-dashboard/enroll-students-magic'
        : '/api/teacher-dashboard/enroll-students';
        
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emails: emailsToProcess,
          courseId: selectedCourse,
          classId: selectedClass === 'none' ? undefined : selectedClass
        })
      });

      const data = await response.json();

      if (response.ok) {
        setEnrollmentResults(data.results);
        setShowResults(true);
        
        if (data.summary.successful > 0) {
          setEmailInput('');
          setBulkEmails('');
          fetchEnrollments();
        }
      } else {
        console.error('Enrollment error:', data);
      }
    } catch (error) {
      console.error('Error adding students:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEnrollment = async (enrollmentId: string) => {
    if (!confirm('Are you sure you want to remove this student enrollment?')) {
      return;
    }

    try {
      const response = await fetch('/api/teacher-dashboard/enroll-students', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enrollmentId })
      });

      if (response.ok) {
        fetchEnrollments();
      }
    } catch (error) {
      console.error('Error deleting enrollment:', error);
    }
  };

  const getEmailCount = (): number => {
    const emails = inputMode === 'single' ? emailInput : bulkEmails;
    if (!emails.trim()) return 0;
    
    const emailList = emails.split(/[,;\n]+/).filter(e => e.trim());
    return emailList.length;
  };

  const downloadTemplate = () => {
    const template = `email,notes
john.doe@example.com,New student
jane.smith@example.com,Transfer student
peter.jones@example.com,`;
    
    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'student_import_template.csv';
    a.click();
  };

  const getCourseInfo = (courseId: string) => {
    return courses.find(c => c.id === courseId) || courses[0];
  };

  // Calculate statistics
  const stats = {
    total: enrollments.length,
    active: enrollments.filter(e => e.status === 'active').length,
    invited: enrollments.filter(e => e.status === 'invited').length,
    acceptanceRate: enrollments.length > 0 
      ? Math.round((enrollments.filter(e => e.status === 'active').length / enrollments.length) * 100)
      : 0,
    recentActivity: enrollments.filter(e => {
      const enrolledDate = new Date(e.invited_at);
      const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      return enrolledDate > dayAgo;
    }).length
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Consistent Dashboard Header */}
      <DashboardHeader
        title="Student Enrollment Center"
        description="Manage student enrollments, send invitations, and track registration progress"
        icon={UserPlus}
        showBackButton={true}
        onRefresh={fetchEnrollments}
        actions={
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 text-white hover:bg-white/10 hover:text-white"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Export
          </Button>
        }
      />

      {/* Metrics Overview - Consistent Design */}
      <div className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-6 py-6 max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-blue-600 rounded-xl p-5 text-white shadow-md">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="text-sm font-medium text-blue-50 mb-1">Total Students</div>
                  <div className="text-4xl font-bold">{stats.total}</div>
                </div>
                <Users className="h-8 w-8 text-blue-100" />
              </div>
              <div className="text-sm text-blue-50">+12% this month</div>
            </div>

            <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-md">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="text-sm font-medium text-gray-600 mb-1">Active Students</div>
                  <div className="text-4xl font-bold text-gray-900">{stats.active}</div>
                </div>
                <UserCheck className="h-8 w-8 text-gray-400" />
              </div>
              <Progress value={stats.acceptanceRate} className="h-2" />
            </div>

            <div className="bg-white rounded-xl p-5 border-2 border-yellow-200 shadow-md">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="text-sm font-medium text-yellow-700 mb-1">Pending Invites</div>
                  <div className="text-4xl font-bold text-yellow-600">{stats.invited}</div>
                </div>
                <Clock className="h-8 w-8 text-yellow-400" />
              </div>
              <div className="text-sm text-yellow-600">Awaiting response</div>
            </div>

            <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-md">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="text-sm font-medium text-gray-600 mb-1">Acceptance Rate</div>
                  <div className="text-4xl font-bold text-gray-900">{stats.acceptanceRate}%</div>
                </div>
                <Target className="h-8 w-8 text-gray-400" />
              </div>
              <div className="text-sm text-gray-600">Last 30 days</div>
            </div>

            <div className="bg-emerald-600 rounded-xl p-5 text-white shadow-md">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="text-sm font-medium text-emerald-50 mb-1">Recent Activity</div>
                  <div className="text-4xl font-bold">{stats.recentActivity}</div>
                </div>
                <Activity className="h-8 w-8 text-emerald-100" />
              </div>
              <div className="text-sm text-emerald-50">Last 24 hours</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-6">
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
          {/* Enrollment Form Section */}
          <div className="xl:col-span-2">
            <Card className="shadow-lg border-0">
              <CardHeader className="bg-blue-600 text-white">
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5" />
                  Add New Students
                </CardTitle>
                <CardDescription className="text-blue-50">
                  Invite students to join your courses
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {/* Invitation Method */}
                <div className="space-y-3">
                  <Label className="text-sm font-semibold text-gray-700">Invitation Method</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant={invitationMethod === 'magic_link' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setInvitationMethod('magic_link')}
                      className="justify-start gap-2"
                    >
                      <Zap className="h-4 w-4" />
                      <span>Magic Link</span>
                    </Button>
                    <Button
                      variant={invitationMethod === 'regular' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setInvitationMethod('regular')}
                      className="justify-start gap-2"
                    >
                      <Mail className="h-4 w-4" />
                      <span>Regular</span>
                    </Button>
                  </div>
                  {invitationMethod === 'magic_link' && (
                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex gap-2">
                        <Shield className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        <div className="text-xs text-blue-700 space-y-1">
                          <p className="font-medium">Passwordless Authentication</p>
                          <p>Students receive secure magic links via email for instant access.</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Course Selection */}
                <div className="space-y-3">
                  <Label className="text-sm font-semibold text-gray-700">Select Course</Label>
                  <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                    <SelectTrigger className="h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {courses.map(course => (
                        <SelectItem key={course.id} value={course.id}>
                          <div className="flex items-center gap-2">
                            <span className="text-base">{course.icon}</span>
                            <span className="font-medium">{course.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Class Selection */}
                <div className="space-y-3">
                  <Label className="text-sm font-semibold text-gray-700">Select Class</Label>
                  <Select value={selectedClass} onValueChange={setSelectedClass}>
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="No specific class" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">
                        <div className="flex items-center gap-2">
                          <Layers className="h-4 w-4 text-gray-400" />
                          <span>No specific class</span>
                        </div>
                      </SelectItem>
                      {classes
                        .filter(c => c.course_id === selectedCourse)
                        .map(classItem => (
                          <SelectItem key={classItem.class_id} value={classItem.class_id}>
                            <div className="flex items-center justify-between w-full">
                              <span>{classItem.class_name}</span>
                              <Badge variant="outline" className="text-xs ml-2">
                                {classItem.current_students}/{classItem.max_students}
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Email Input */}
                <div className="space-y-3">
                  <Tabs value={inputMode} onValueChange={(v) => setInputMode(v as 'single' | 'bulk')}>
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="single">Single Email</TabsTrigger>
                      <TabsTrigger value="bulk">Bulk Import</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="single" className="space-y-3 mt-4">
                      <Label className="text-sm font-semibold text-gray-700">Email Address</Label>
                      <div className="relative">
                        <Input
                          type="email"
                          placeholder="student@example.com"
                          value={emailInput}
                          onChange={(e) => setEmailInput(e.target.value)}
                          className="pr-10"
                        />
                        {emailInput && validateEmail(emailInput) && (
                          <CheckCheck className="absolute right-3 top-3 h-4 w-4 text-green-500" />
                        )}
                      </div>
                      {emailInput && !validateEmail(emailInput) && (
                        <p className="text-xs text-red-500">Please enter a valid email address</p>
                      )}
                    </TabsContent>
                    
                    <TabsContent value="bulk" className="space-y-3 mt-4">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-semibold text-gray-700">Email List</Label>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={downloadTemplate}
                          className="gap-1 text-xs"
                        >
                          <Download className="h-3 w-3" />
                          Template
                        </Button>
                      </div>
                      <Textarea
                        placeholder="Enter multiple emails (comma, semicolon, or line separated)"
                        value={bulkEmails}
                        onChange={(e) => setBulkEmails(e.target.value)}
                        className="min-h-[120px] font-mono text-sm"
                      />
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                          {getEmailCount()} email{getEmailCount() !== 1 ? 's' : ''} detected
                        </span>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>

                {/* Submit Button */}
                <Button
                  onClick={handleAddStudents}
                  disabled={loading || (inputMode === 'single' ? !emailInput || !validateEmail(emailInput) : getEmailCount() === 0)}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send Invitations
                    </>
                  )}
                </Button>

                {/* Results Display */}
                {showResults && enrollmentResults.length > 0 && (
                  <Alert className="border-0 bg-gray-50">
                    <div className="flex items-start gap-2">
                      {enrollmentResults.every(r => r.success) ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
                      )}
                      <div className="flex-1 space-y-2">
                        <AlertTitle className="text-sm font-semibold">
                          {enrollmentResults.filter(r => r.success).length} of {enrollmentResults.length} invitations sent
                        </AlertTitle>
                        <AlertDescription>
                          <div className="space-y-1">
                            {enrollmentResults.map((result, index) => (
                              <div key={index} className="flex items-start gap-2 text-xs">
                                {result.success ? (
                                  <CheckCircle2 className="h-3 w-3 text-green-600 mt-0.5" />
                                ) : result.alreadyEnrolled ? (
                                  <AlertCircle className="h-3 w-3 text-yellow-600 mt-0.5" />
                                ) : (
                                  <XCircle className="h-3 w-3 text-red-600 mt-0.5" />
                                )}
                                <div className="flex-1">
                                  <span className="font-medium">{result.email}</span>
                                  <span className="text-gray-500 ml-1">- {result.message}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </AlertDescription>
                      </div>
                    </div>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Student List Section */}
          <div className="xl:col-span-3">
            <Card className="shadow-lg border-0">
              <CardHeader className="border-b bg-gray-50">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Enrolled Students</CardTitle>
                    <CardDescription>
                      {filteredEnrollments.length} of {enrollments.length} students shown
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant={viewMode === 'grid' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('grid')}
                      className="gap-1"
                    >
                      <BarChart3 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'list' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('list')}
                      className="gap-1"
                    >
                      <Filter className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {/* Filters */}
                <div className="flex flex-col lg:flex-row gap-3 mb-6">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search students..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  
                  <Select value={filterCourse} onValueChange={setFilterCourse}>
                    <SelectTrigger className="w-full lg:w-[180px]">
                      <SelectValue placeholder="All Courses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Courses</SelectItem>
                      {courses.map(course => (
                        <SelectItem key={course.id} value={course.id}>
                          {course.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Select value={filterClass} onValueChange={setFilterClass}>
                    <SelectTrigger className="w-full lg:w-[180px]">
                      <SelectValue placeholder="All Classes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Classes</SelectItem>
                      {classes.map(classItem => (
                        <SelectItem key={classItem.class_id} value={classItem.class_id}>
                          {classItem.class_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-full lg:w-[140px]">
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="invited">Invited</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Enrollments Display */}
                <div className="space-y-3">
                  {loadingEnrollments ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                    </div>
                  ) : filteredEnrollments.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                        <UserX className="h-8 w-8 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">No students found</h3>
                      <p className="text-sm text-gray-500">
                        {searchQuery || filterCourse !== 'all' || filterStatus !== 'all'
                          ? 'Try adjusting your filters'
                          : 'Start by inviting your first student'}
                      </p>
                    </div>
                  ) : (
                    <div className={viewMode === 'grid' ? 'grid grid-cols-1 gap-4' : 'space-y-3'}>
                      {filteredEnrollments.map((enrollment) => {
                        const courseInfo = getCourseInfo(enrollment.course_id);
                        const classInfo = classes.find(c => c.class_id === enrollment.class_id);
                        
                        return (
                          <div 
                            key={enrollment.id} 
                            className="group bg-white border rounded-xl p-5 hover:shadow-md transition-all duration-200"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-4">
                                <Avatar className="h-12 w-12 border-2 border-gray-100">
                                  <AvatarFallback className="bg-blue-600 text-white font-semibold">
                                    {enrollment.student_email.substring(0, 2).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <p className="font-semibold text-gray-900">{enrollment.student_email}</p>
                                    {enrollment.invitation_status === 'accepted' && (
                                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Badge className={cn("text-xs border", courseInfo.lightColor)}>
                                      {courseInfo.icon} {courseInfo.level}
                                    </Badge>
                                    {classInfo && (
                                      <Badge variant="outline" className="text-xs">
                                        <School className="h-3 w-3 mr-1" />
                                        {classInfo.class_name}
                                      </Badge>
                                    )}
                                    <Badge 
                                      variant={enrollment.status === 'active' ? 'default' : 'secondary'}
                                      className="text-xs"
                                    >
                                      {enrollment.status === 'active' ? (
                                        <><UserCheck className="h-3 w-3 mr-1" /> Active</>
                                      ) : (
                                        <><Clock className="h-3 w-3 mr-1" /> Invited</>
                                      )}
                                    </Badge>
                                    {enrollment.invitation_status && (
                                      <Badge 
                                        variant="outline" 
                                        className={cn("text-xs", {
                                          'border-yellow-200 bg-yellow-50 text-yellow-700': enrollment.invitation_status === 'sent',
                                          'border-green-200 bg-green-50 text-green-700': enrollment.invitation_status === 'accepted',
                                          'border-red-200 bg-red-50 text-red-700': enrollment.invitation_status === 'expired',
                                        })}
                                      >
                                        {enrollment.invitation_status === 'sent' && <><Send className="h-3 w-3 mr-1" /> Sent</>}
                                        {enrollment.invitation_status === 'accepted' && <><MailCheck className="h-3 w-3 mr-1" /> Accepted</>}
                                        {enrollment.invitation_status === 'expired' && <><Clock className="h-3 w-3 mr-1" /> Expired</>}
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-xs text-gray-500">
                                    Invited {new Date(enrollment.invited_at).toLocaleDateString('en-US', { 
                                      month: 'short', 
                                      day: 'numeric', 
                                      year: 'numeric' 
                                    })}
                                  </p>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                >
                                  <Edit3 className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteEnrollment(enrollment.id)}
                                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Bulk Actions (when items selected) */}
                {selectedEnrollments.length > 0 && (
                  <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-4">
                    <span className="text-sm">{selectedEnrollments.length} selected</span>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="secondary">
                        <Mail className="h-4 w-4 mr-2" />
                        Message
                      </Button>
                      <Button size="sm" variant="secondary">
                        <Copy className="h-4 w-4 mr-2" />
                        Duplicate
                      </Button>
                      <Button size="sm" variant="secondary" className="text-red-600">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remove
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
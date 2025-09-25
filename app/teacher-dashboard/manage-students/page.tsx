'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
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
  FileText,
  Copy,
  Send,
  BookOpen,
  Activity,
  Settings,
  Bell,
  RefreshCw,
  Search,
  Filter,
  Calendar,
  Clock,
  School,
  GraduationCap
} from 'lucide-react';
import { cn } from '@/lib/utils';

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

const courses = [
  { id: 'telc_a1', name: 'telc A1 - Beginner', level: 'A1', color: 'bg-green-100 text-green-800 border-green-200' },
  { id: 'telc_a2', name: 'telc A2 - Elementary', level: 'A2', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  { id: 'telc_b1', name: 'telc B1 - Intermediate', level: 'B1', color: 'bg-purple-100 text-purple-800 border-purple-200' },
  { id: 'telc_b2', name: 'telc B2 - Upper Intermediate', level: 'B2', color: 'bg-orange-100 text-orange-800 border-orange-200' },
];

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

  useEffect(() => {
    fetchEnrollments();
    fetchClasses();
  }, []);

  useEffect(() => {
    // Filter classes based on selected course
    const courseClasses = classes.filter(c => c.course_id === selectedCourse);
    if (courseClasses.length > 0 && selectedClass !== 'none' && !courseClasses.find(c => c.class_id === selectedClass)) {
      setSelectedClass(courseClasses[0]?.class_id || 'none');
    }
  }, [selectedCourse, classes, selectedClass]);

  useEffect(() => {
    applyFilters();
  }, [enrollments, searchQuery, filterCourse, filterStatus]);

  const fetchClasses = async () => {
    try {
      setLoadingClasses(true);
      const response = await fetch(`/api/teacher-dashboard/classes?organization=ANB`);
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
      const response = await fetch(`/api/teacher-dashboard/enroll-students?organization=ANB`);
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

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(enrollment =>
        enrollment.student_email.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Course filter
    if (filterCourse !== 'all') {
      filtered = filtered.filter(enrollment => enrollment.course_id === filterCourse);
    }

    // Class filter
    if (filterClass !== 'all') {
      filtered = filtered.filter(enrollment => enrollment.class_id === filterClass);
    }

    // Status filter
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
          classId: selectedClass === 'none' ? undefined : selectedClass,
          organizationCode: 'ANB' // You might want to make this dynamic
        })
      });

      const data = await response.json();

      if (response.ok) {
        setEnrollmentResults(data.results);
        setShowResults(true);
        
        // Clear inputs on success
        if (data.summary.successful > 0) {
          setEmailInput('');
          setBulkEmails('');
          // Refresh enrollments list
          fetchEnrollments();
        }
      } else {
        // Handle error
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Navigation Bar */}
      <nav className="bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg sticky top-0 z-50">
        <div className="container mx-auto px-6 py-6 max-w-7xl">
          <div className="flex items-center justify-between">
            {/* Logo and Brand */}
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/10 backdrop-blur rounded-lg">
                <School className="h-10 w-10 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">telc A1 German</h1>
                <p className="text-blue-100 text-base">Teacher Dashboard</p>
              </div>
            </div>

            {/* Navigation Links */}
            <div className="hidden lg:flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="default"
                className="text-white hover:bg-white/10 hover:text-white text-base py-2 px-4"
                onClick={() => router.push('/')}
              >
                <Users className="h-5 w-5 mr-2" />
                Overview
              </Button>
              <Button 
                variant="ghost" 
                size="default"
                className="text-white hover:bg-white/10 hover:text-white text-base py-2 px-4"
                onClick={() => router.push('/teacher-dashboard/student-progress')}
              >
                <Activity className="h-5 w-5 mr-2" />
                All Students
              </Button>
              <Button 
                variant="ghost" 
                size="default"
                className="text-white/90 bg-white/10 text-base py-2 px-4"
              >
                <UserPlus className="h-5 w-5 mr-2" />
                Manage Students
              </Button>
              <Button 
                variant="ghost" 
                size="default"
                className="text-white hover:bg-white/10 hover:text-white text-base py-2 px-4"
                onClick={() => router.push('/teacher-dashboard/skills')}
              >
                <BookOpen className="h-5 w-5 mr-2" />
                Skills
              </Button>
              
              <div className="ml-4 h-10 w-px bg-white/20" />
              
              <Button 
                variant="ghost" 
                size="default"
                className="text-white hover:bg-white/10 hover:text-white p-2.5"
                onClick={fetchEnrollments}
              >
                <RefreshCw className="h-5 w-5" />
              </Button>
              <Button 
                variant="ghost" 
                size="default"
                className="text-white hover:bg-white/10 hover:text-white relative p-2.5"
              >
                <Bell className="h-5 w-5" />
                <span className="absolute top-1 right-1 h-3 w-3 bg-red-500 rounded-full animate-pulse" />
              </Button>
              <Button 
                variant="ghost" 
                size="default"
                className="text-white hover:bg-white/10 hover:text-white p-2.5"
              >
                <Settings className="h-5 w-5" />
              </Button>
            </div>

            {/* User Info */}
            <div className="flex items-center gap-4">
              <div className="text-right hidden md:block">
                <p className="font-semibold">{user?.firstName || 'Teacher'}</p>
                <p className="text-xs text-blue-100">Admin Access</p>
              </div>
              <Avatar className="h-12 w-12 border-2 border-white/20">
                <AvatarFallback className="bg-white/10 text-white">
                  {user?.firstName?.[0] || 'T'}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </div>
      </nav>

      {/* Page Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-6 py-8 max-w-7xl">
          <div className="mb-6">
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => router.push('/')}
                className="p-0 h-auto hover:text-gray-700"
              >
                Home
              </Button>
              <ChevronRight className="h-4 w-4" />
              <span className="text-gray-700 font-medium">Manage Students</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-2">
              Student Enrollment Management
            </h1>
            <p className="text-gray-600">
              Add new students to courses and manage existing enrollments
            </p>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {courses.map(course => {
              const courseEnrollments = enrollments.filter(e => e.course_id === course.id);
              return (
                <div key={course.id} className={cn("rounded-lg p-4 border", course.color)}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold">{courseEnrollments.length}</div>
                      <div className="text-sm font-medium">{course.level}</div>
                    </div>
                    <GraduationCap className="h-8 w-8 opacity-50" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8 max-w-7xl space-y-8">
        {/* Add Students Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Add New Students
            </CardTitle>
            <CardDescription>
              Enroll students by entering their email addresses. They'll receive an invitation to join the course.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Invitation Method Selection */}
            <div className="space-y-3">
              <Label>Invitation Method</Label>
              <Tabs value={invitationMethod} onValueChange={(v) => setInvitationMethod(v as 'regular' | 'magic_link')}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="magic_link" className="flex items-center gap-2">
                    <Send className="h-4 w-4" />
                    Magic Link (Recommended)
                  </TabsTrigger>
                  <TabsTrigger value="regular" className="flex items-center gap-2">
                    <UserPlus className="h-4 w-4" />
                    Regular Enrollment
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              
              <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-md">
                {invitationMethod === 'magic_link' ? (
                  <div className="flex items-start gap-2">
                    <Send className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <strong className="text-blue-800">Magic Link:</strong> Students receive a professional email with a passwordless sign-in link. 
                      Their email is automatically verified and they're enrolled instantly.
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-2">
                    <UserPlus className="h-4 w-4 text-gray-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <strong className="text-gray-700">Regular:</strong> Students are added to the database. 
                      They need to sign up manually with their credentials.
                    </div>
                  </div>
                )}
              </div>
            </div>
            {/* Course and Class Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="course">Select Course</Label>
                <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map(course => (
                      <SelectItem key={course.id} value={course.id}>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className={cn("text-xs", course.color)}>
                            {course.level}
                          </Badge>
                          {course.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="class">Select Class (Optional)</Label>
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger>
                    <SelectValue placeholder="No specific class" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No specific class</SelectItem>
                    {classes
                      .filter(c => c.course_id === selectedCourse)
                      .map(classItem => (
                        <SelectItem key={classItem.class_id} value={classItem.class_id}>
                          <div className="flex items-center gap-2">
                            <span>{classItem.class_name}</span>
                            <Badge variant="outline" className="text-xs">
                              {classItem.current_students}/{classItem.max_students} students
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Input Mode Tabs */}
            <Tabs value={inputMode} onValueChange={(v) => setInputMode(v as 'single' | 'bulk')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="single">
                  <Mail className="h-4 w-4 mr-2" />
                  Single Email
                </TabsTrigger>
                <TabsTrigger value="bulk">
                  <Upload className="h-4 w-4 mr-2" />
                  Bulk Import
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="single" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Student Email Address</Label>
                  <div className="flex gap-2">
                    <Input
                      id="email"
                      type="email"
                      placeholder="student@example.com"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      onClick={handleAddStudents}
                      disabled={!emailInput || loading || !validateEmail(emailInput)}
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Add Student
                    </Button>
                  </div>
                  {emailInput && !validateEmail(emailInput) && (
                    <p className="text-sm text-red-500">Please enter a valid email address</p>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="bulk" className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="bulk-emails">Email Addresses</Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={downloadTemplate}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download Template
                    </Button>
                  </div>
                  <Textarea
                    id="bulk-emails"
                    placeholder="Enter multiple email addresses separated by commas, semicolons, or one per line:

john.doe@example.com
jane.smith@example.com
peter.jones@example.com"
                    value={bulkEmails}
                    onChange={(e) => setBulkEmails(e.target.value)}
                    className="min-h-[150px] font-mono text-sm"
                  />
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-500">
                      {getEmailCount()} email{getEmailCount() !== 1 ? 's' : ''} detected
                    </p>
                    <Button
                      onClick={handleAddStudents}
                      disabled={!bulkEmails || loading || getEmailCount() === 0}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Add All Students
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            {/* Results Display */}
            {showResults && enrollmentResults.length > 0 && (
              <Alert className={cn(
                "border-2",
                enrollmentResults.every(r => r.success) ? "border-green-200 bg-green-50" : "border-yellow-200 bg-yellow-50"
              )}>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>
                  {invitationMethod === 'magic_link' ? 'Magic Link Invitations Sent' : 'Enrollment Results'}
                </AlertTitle>
                <AlertDescription>
                  <div className="mt-3 space-y-2">
                    {enrollmentResults.map((result, index) => (
                      <div key={index} className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          {result.success ? (
                            <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                          ) : result.alreadyEnrolled ? (
                            <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
                          ) : result.userExists ? (
                            <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-600 mt-0.5" />
                          )}
                          <div className="text-sm">
                            <div>
                              <strong>{result.email}</strong>
                            </div>
                            <div className="text-gray-600">
                              {result.message}
                              {invitationMethod === 'magic_link' && result.success && (
                                <span className="block text-xs text-blue-600 mt-1">
                                  ✉️ Passwordless invitation sent - student can join instantly
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        {result.success && result.invitationId && (
                          <div className="text-xs text-gray-400 font-mono">
                            ID: {result.invitationId.slice(-8)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Existing Enrollments */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Enrolled Students
                </CardTitle>
                <CardDescription>
                  Manage existing student enrollments across all courses
                </CardDescription>
              </div>
              <Badge variant="secondary" className="text-lg px-3 py-1">
                {filteredEnrollments.length} students
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="flex flex-col lg:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={filterCourse} onValueChange={setFilterCourse}>
                <SelectTrigger className="w-full lg:w-[200px]">
                  <SelectValue placeholder="Filter by course" />
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
                <SelectTrigger className="w-full lg:w-[200px]">
                  <SelectValue placeholder="Filter by class" />
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
                <SelectTrigger className="w-full lg:w-[150px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="invited">Invited</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Enrollments List */}
            <div className="space-y-3">
              {loadingEnrollments ? (
                <div className="text-center py-8">
                  <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
                </div>
              ) : filteredEnrollments.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No students found</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredEnrollments.map((enrollment) => {
                    const courseInfo = getCourseInfo(enrollment.course_id);
                    const classInfo = classes.find(c => c.class_id === enrollment.class_id);
                    return (
                      <div key={enrollment.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarFallback className="bg-gradient-to-br from-blue-400 to-blue-600 text-white">
                                {enrollment.student_email.substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-gray-900">{enrollment.student_email}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge className={cn("text-xs", courseInfo?.color || 'bg-gray-100 text-gray-800 border-gray-200')}>
                                  {courseInfo?.level || 'Unknown'}
                                </Badge>
                                {classInfo && (
                                  <Badge variant="outline" className="text-xs">
                                    {classInfo.class_name}
                                  </Badge>
                                )}
                                <Badge 
                                  variant={enrollment.status === 'active' ? 'default' : 'secondary'}
                                  className="text-xs"
                                >
                                  {enrollment.status}
                                </Badge>
                                {enrollment.invitation_status && (
                                  <Badge 
                                    variant="outline" 
                                    className={cn("text-xs", {
                                      'border-yellow-500 text-yellow-700 bg-yellow-50': enrollment.invitation_status === 'sent',
                                      'border-green-500 text-green-700 bg-green-50': enrollment.invitation_status === 'accepted',
                                      'border-red-500 text-red-700 bg-red-50': enrollment.invitation_status === 'expired',
                                      'border-gray-500 text-gray-700 bg-gray-50': enrollment.invitation_status === 'revoked'
                                    })}
                                  >
                                    {enrollment.invitation_status === 'sent' && '📧 Magic Link Sent'}
                                    {enrollment.invitation_status === 'accepted' && '✓ Joined via Link'}
                                    {enrollment.invitation_status === 'expired' && '⚠️ Link Expired'}
                                    {enrollment.invitation_status === 'revoked' && '🚫 Revoked'}
                                  </Badge>
                                )}
                                <span className="text-xs text-gray-500">
                                  <Clock className="h-3 w-3 inline mr-1" />
                                  {new Date(enrollment.invited_at).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteEnrollment(enrollment.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <footer className="bg-gray-100 border-t mt-16">
        <div className="container mx-auto px-6 py-8 max-w-7xl">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <School className="h-6 w-6 text-gray-600" />
              <span className="text-gray-600 font-semibold">telc A1 German Learning Platform</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-gray-500">
              <span>© 2024 A&B Recruiting</span>
              <span>•</span>
              <Button variant="link" className="text-gray-500 hover:text-gray-700 p-0 h-auto">
                Help & Support
              </Button>
              <span>•</span>
              <Button variant="link" className="text-gray-500 hover:text-gray-700 p-0 h-auto">
                Privacy Policy
              </Button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getCourseConfig, getCourseLessonUrl } from '@/lib/course-config';
import { 
  CheckCircle2, 
  BookOpen, 
  Users, 
  Target, 
  Clock,
  Calendar,
  School,
  ArrowRight,
  Mail,
  Shield,
  Zap
} from 'lucide-react';

// Extended course details with local properties
interface ExtendedCourseDetails {
  id: string;
  name: string;
  level: string;
  platformUrl: string;
  duration: string;
  description: string;
  color: string;
}

const courseDescriptions: Record<string, { duration: string; description: string; color: string }> = {
  'telc_a1': {
    duration: '3 months',
    description: 'Start your German journey with essential vocabulary and basic grammar',
    color: 'bg-green-100 text-green-800 border-green-200'
  },
  'telc_a2': {
    duration: '3 months',
    description: 'Build confidence in everyday German conversations and situations',
    color: 'bg-blue-100 text-blue-800 border-blue-200'
  },
  'telc_b1': {
    duration: '4 months',
    description: 'Express yourself clearly on familiar topics and handle travel situations',
    color: 'bg-purple-100 text-purple-800 border-purple-200'
  },
  'telc_b2': {
    duration: '4 months',
    description: 'Engage in complex discussions and understand abstract topics',
    color: 'bg-orange-100 text-orange-800 border-orange-200'
  }
};

export default function StudentOnboardingPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [courseDetails, setCourseDetails] = useState<ExtendedCourseDetails | null>(null);
  const [classInfo, setClassInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState(5);

  useEffect(() => {
    if (isLoaded && user?.publicMetadata) {
      const { courseId, classId, organizationCode } = user.publicMetadata as any;
      
      // Also check URL params as fallback
      const urlCourseId = searchParams.get('course') || courseId;
      
      if (urlCourseId) {
        const config = getCourseConfig(urlCourseId);
        const descriptions = courseDescriptions[urlCourseId];
        
        if (config && descriptions) {
          setCourseDetails({
            id: config.id,
            name: config.name,
            level: config.level,
            platformUrl: config.platformUrl,
            ...descriptions
          });
          
          // Activate enrollment
          const email = user.primaryEmailAddress?.emailAddress;
          if (email) {
            activateEnrollment(email, urlCourseId, classId);
          }
        }
      }
      
      setLoading(false);
    } else if (isLoaded) {
      // No metadata found - redirect to sign up
      router.push('/sign-up');
    }
  }, [user, isLoaded, router, searchParams]);

  const activateEnrollment = async (email: string, courseId: string, classId?: string) => {
    try {
      setActivating(true);
      const response = await fetch('/api/student/activate-enrollment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, courseId, classId })
      });

      if (response.ok) {
        console.log('Enrollment activated successfully');
      } else {
        console.error('Failed to activate enrollment');
      }
    } catch (error) {
      console.error('Error activating enrollment:', error);
    } finally {
      setActivating(false);
    }
  };

  const handleStartLearning = () => {
    if (courseDetails) {
      setRedirecting(true);
      const lessonUrl = getCourseLessonUrl(courseDetails.id);
      
      // Start countdown
      const timer = setInterval(() => {
        setRedirectCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            // Redirect to the course platform
            window.location.href = lessonUrl;
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Setting up your learning experience...</p>
        </div>
      </div>
    );
  }

  if (!courseDetails) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="max-w-md mx-4">
          <CardContent className="pt-6 text-center">
            <Shield className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Invalid Invitation</h2>
            <p className="text-gray-600 mb-4">
              This invitation link appears to be invalid or expired.
            </p>
            <Button onClick={() => router.push('/sign-up')} variant="outline">
              Sign Up Manually
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Welcome Header */}
        <div className="text-center mb-8 pt-8">
          <div className="flex justify-center mb-4">
            <div className="bg-green-100 p-3 rounded-full">
              <CheckCircle2 className="h-16 w-16 text-green-600" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Welcome to Your German Learning Journey!
          </h1>
          <p className="text-xl text-gray-600">
            You've been enrolled in <span className="font-semibold text-blue-700">{courseDetails.name}</span>
          </p>
          <div className="flex items-center justify-center gap-2 mt-4">
            <Mail className="h-4 w-4 text-green-600" />
            <span className="text-sm text-green-700 font-medium">
              Email verified automatically ✓
            </span>
          </div>
        </div>

        {/* Magic Link Benefits */}
        <Card className="mb-6 border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="h-5 w-5 text-green-600" />
              <h3 className="font-semibold text-green-800">Magic Link Benefits</h3>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="flex items-start gap-2">
                <Shield className="h-4 w-4 text-green-600 mt-1 flex-shrink-0" />
                <div className="text-sm">
                  <div className="font-medium text-green-800">No Password Needed</div>
                  <div className="text-green-700">Secure, passwordless access</div>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-1 flex-shrink-0" />
                <div className="text-sm">
                  <div className="font-medium text-green-800">Email Verified</div>
                  <div className="text-green-700">Automatically confirmed</div>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Zap className="h-4 w-4 text-green-600 mt-1 flex-shrink-0" />
                <div className="text-sm">
                  <div className="font-medium text-green-800">Instant Access</div>
                  <div className="text-green-700">Ready to start learning</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Course Details Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Your Course Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6 mb-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <Target className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <div className="text-sm text-gray-600">Level</div>
                <div className="text-2xl font-bold text-gray-900">
                  {courseDetails.level}
                </div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <Clock className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <div className="text-sm text-gray-600">Duration</div>
                <div className="text-2xl font-bold text-gray-900">
                  {courseDetails.duration}
                </div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <Users className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                <div className="text-sm text-gray-600">Class Size</div>
                <div className="text-2xl font-bold text-gray-900">
                  20-30
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-700 text-center">
                {courseDetails.description}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* What's Next Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>What Happens Next?</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-4">
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                  1
                </span>
                <div>
                  <p className="font-semibold">Complete Your Profile</p>
                  <p className="text-sm text-gray-600">Add your learning goals and preferences</p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                  2
                </span>
                <div>
                  <p className="font-semibold">Take the Placement Test</p>
                  <p className="text-sm text-gray-600">Help us understand your current German level</p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                  3
                </span>
                <div>
                  <p className="font-semibold">Start Your First Lesson</p>
                  <p className="text-sm text-gray-600">Begin with interactive exercises and vocabulary</p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                  4
                </span>
                <div>
                  <p className="font-semibold">Meet Your Classmates</p>
                  <p className="text-sm text-gray-600">Connect with other learners in your class</p>
                </div>
              </li>
            </ol>
          </CardContent>
        </Card>

        {/* Learning Features Preview */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>What You'll Experience</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-900">Interactive Learning</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Speaking practice with AI feedback</li>
                  <li>• Interactive grammar exercises</li>
                  <li>• Real-world conversation scenarios</li>
                  <li>• Vocabulary building games</li>
                </ul>
              </div>
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-900">Progress Tracking</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Daily learning streaks</li>
                  <li>• Skill-specific progress charts</li>
                  <li>• Achievement badges</li>
                  <li>• Teacher feedback and guidance</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CTA Button */}
        <div className="text-center pb-8">
          <Button
            size="lg"
            onClick={handleStartLearning}
            disabled={activating || redirecting}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-12 py-6 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
          >
            {activating ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                Setting up your account...
              </>
            ) : redirecting ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                Redirecting to {courseDetails?.name} in {redirectCountdown}s...
              </>
            ) : (
              <>
                Start Learning Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </>
            )}
          </Button>
          {redirecting && courseDetails && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-700 text-center">
                Taking you to: <strong>{getCourseLessonUrl(courseDetails.id)}</strong>
              </p>
            </div>
          )}
          {!redirecting && (
            <p className="mt-4 text-sm text-gray-600">
              Your teacher will be notified once you begin
            </p>
          )}
          <p className="mt-2 text-xs text-gray-500">
            Welcome to A&B Recruiting's German Learning Platform
          </p>
        </div>
      </div>
    </div>
  );
}
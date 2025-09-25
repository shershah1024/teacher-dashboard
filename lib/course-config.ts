// Course configuration with platform URLs
export interface CourseConfig {
  id: string;
  name: string;
  level: string;
  platformUrl: string;
  lessonsPath: string;
  icon: string;
}

export const COURSE_CONFIGS: Record<string, CourseConfig> = {
  telc_a1: {
    id: 'telc_a1',
    name: 'telc A1 - Beginner',
    level: 'A1',
    platformUrl: 'https://telc-a1.thesmartlanguage.com',
    lessonsPath: '/lessons',
    icon: '🌱'
  },
  telc_a2: {
    id: 'telc_a2',
    name: 'telc A2 - Elementary',
    level: 'A2',
    platformUrl: 'https://telc-a2.thesmartlanguage.com',
    lessonsPath: '/lessons',
    icon: '📘'
  },
  telc_b1: {
    id: 'telc_b1',
    name: 'telc B1 - Intermediate',
    level: 'B1',
    platformUrl: 'https://telc-b1.thesmartlanguage.com',
    lessonsPath: '/lessons',
    icon: '🎯'
  },
  telc_b2: {
    id: 'telc_b2',
    name: 'telc B2 - Upper Intermediate',
    level: 'B2',
    platformUrl: 'https://telc-b2.thesmartlanguage.com',
    lessonsPath: '/lessons',
    icon: '🚀'
  }
};

// Helper function to get full lesson URL for a course
export function getCourseLessonUrl(courseId: string): string {
  const course = COURSE_CONFIGS[courseId];
  if (!course) {
    console.error(`Invalid course ID: ${courseId}`);
    return '/';
  }
  return `${course.platformUrl}${course.lessonsPath}`;
}

// Helper function to get course config
export function getCourseConfig(courseId: string): CourseConfig | null {
  return COURSE_CONFIGS[courseId] || null;
}

// Get all courses as array
export function getAllCourses(): CourseConfig[] {
  return Object.values(COURSE_CONFIGS);
}

// Validate if course ID exists
export function isValidCourseId(courseId: string): boolean {
  return courseId in COURSE_CONFIGS;
}
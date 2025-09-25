# 🎯 Course Platform Redirect Configuration

## Overview
Students are automatically redirected to their course-specific learning platform after signing up through magic links. Each course level (A1, A2, B1, B2) has its own dedicated platform URL.

## 📚 Course Platform URLs

| Course | Level | Platform URL | Lessons Path |
|--------|-------|-------------|--------------|
| telc A1 | Beginner | https://telc-a1.thesmartlanguage.com | /lessons |
| telc A2 | Elementary | https://telc-a2.thesmartlanguage.com | /lessons |
| telc B1 | Intermediate | https://telc-b1.thesmartlanguage.com | /lessons |
| telc B2 | Upper Intermediate | https://telc-b2.thesmartlanguage.com | /lessons |

## 🔄 Student Flow

### 1. Teacher Sends Invitation
- Teacher selects a course (e.g., telc A1)
- Magic link invitation is sent with course metadata
- Platform URL is stored in enrollment data

### 2. Student Clicks Magic Link
- Student is directed to sign-up page
- Account is created with course information
- Redirected to `/student-onboarding?course=telc_a1`

### 3. Onboarding Page
- Shows welcome message and course details
- Displays what to expect in the course
- "Start Learning Now" button appears

### 4. Automatic Redirect
- When student clicks "Start Learning Now"
- 5-second countdown begins
- Automatically redirects to the course platform
- Example: `https://telc-a1.thesmartlanguage.com/lessons`

## 🛠️ Configuration

### Course Configuration File
Location: `/lib/course-config.ts`

```typescript
export const COURSE_CONFIGS: Record<string, CourseConfig> = {
  telc_a1: {
    id: 'telc_a1',
    name: 'telc A1 - Beginner',
    level: 'A1',
    platformUrl: 'https://telc-a1.thesmartlanguage.com',
    lessonsPath: '/lessons',
    icon: '🌱'
  },
  // ... other courses
};
```

### Helper Functions

```typescript
// Get full lesson URL for a course
getCourseLessonUrl('telc_a1') 
// Returns: https://telc-a1.thesmartlanguage.com/lessons

// Get course configuration
getCourseConfig('telc_a1')
// Returns: CourseConfig object

// Validate course ID
isValidCourseId('telc_a1')
// Returns: true/false
```

## 📝 How It Works

### Magic Link Invitation
When creating an invitation, the system:
1. Validates the course ID
2. Stores the platform URL in metadata
3. Creates redirect URL with course parameter

```typescript
// In enroll-students-magic/route.ts
const redirectUrl = `${baseUrl}/student-onboarding?course=${courseId}`;
const invitationMetadata = {
  role: 'student',
  courseId,
  coursePlatformUrl: getCourseLessonUrl(courseId)
};
```

### Student Onboarding
The onboarding page:
1. Reads course ID from URL params or user metadata
2. Fetches course configuration
3. Displays course information
4. Handles redirect with countdown

```typescript
// In student-onboarding/page.tsx
const handleStartLearning = () => {
  const lessonUrl = getCourseLessonUrl(courseDetails.id);
  // Start countdown and redirect
  window.location.href = lessonUrl;
};
```

## 🔧 Customization

### To Add a New Course

1. Update `/lib/course-config.ts`:
```typescript
telc_c1: {
  id: 'telc_c1',
  name: 'telc C1 - Advanced',
  level: 'C1',
  platformUrl: 'https://telc-c1.thesmartlanguage.com',
  lessonsPath: '/lessons',
  icon: '🏆'
}
```

2. The system will automatically:
- Include it in course selection dropdowns
- Handle redirects to the new platform
- Validate the course ID

### To Change Platform URLs

Simply update the `platformUrl` in the course configuration:
```typescript
platformUrl: 'https://new-domain.com'
```

### To Customize Redirect Behavior

In `/app/student-onboarding/page.tsx`, modify:
- `redirectCountdown` - Change countdown duration (default: 5 seconds)
- `handleStartLearning` - Add custom logic before redirect
- Remove countdown for immediate redirect

## 🧪 Testing Redirects

### Manual Testing
1. Create a test enrollment:
```bash
# Send invitation for specific course
Course: telc_a1
Email: test@example.com
```

2. Simulate sign-up:
```bash
# Visit onboarding page with course parameter
http://localhost:3000/student-onboarding?course=telc_a1
```

3. Verify redirect:
- Click "Start Learning Now"
- Confirm countdown appears
- Verify redirect to correct platform

### Check Configuration
```bash
# Use the test script to verify enrollment
./test-webhook-flow.sh test@example.com telc_a1 ANB
```

## 📊 Tracking Redirects

### Database Fields
The system stores platform URLs in enrollment data:
```sql
SELECT 
  student_email,
  course_id,
  enrollment_data->>'course_platform_url' as platform_url
FROM student_enrollments
WHERE status = 'active';
```

### Analytics Integration
You can track successful redirects by:
1. Adding analytics events before redirect
2. Implementing UTM parameters
3. Using redirect confirmation callbacks

## 🔒 Security Considerations

1. **URL Validation**: Always validate platform URLs
2. **HTTPS Only**: All platform URLs must use HTTPS
3. **Course Access**: Verify student enrollment before redirect
4. **Session Management**: Consider passing auth tokens if needed

## 🚀 Production Checklist

- [ ] Verify all platform URLs are accessible
- [ ] Test redirects for each course level
- [ ] Confirm HTTPS on all platforms
- [ ] Set up analytics tracking
- [ ] Monitor redirect success rates
- [ ] Configure error handling for failed redirects
- [ ] Document platform URL changes

## 🆘 Troubleshooting

### Redirect Not Working
- Check if course ID is valid
- Verify platform URL in config
- Check browser console for errors
- Ensure pop-up blockers aren't interfering

### Wrong Platform
- Verify course ID in enrollment
- Check URL parameters
- Confirm course configuration

### Platform Not Loading
- Verify platform is online
- Check CORS settings if needed
- Confirm student has access

---

*Last Updated: September 2025*
*Configuration: `/lib/course-config.ts`*
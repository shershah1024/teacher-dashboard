# 🚀 External Platform Redirect Setup

## Overview
Students are redirected **directly** to the external learning platform (thesmartlanguage.com) after signing up via Clerk magic links. They authenticate on the external platform, not on the teacher dashboard.

## 🔄 Complete Student Flow

### 1. Teacher Sends Invitation
- Teacher selects student email and course (e.g., telc A1)
- System creates Clerk invitation with platform URL as redirect
- Magic link email sent to student

### 2. Student Clicks Magic Link
- Takes student to Clerk sign-up (hosted by Clerk)
- Student creates account (passwordless)
- No authentication on teacher dashboard

### 3. Direct External Redirect
- After Clerk sign-up, student is redirected to:
  - telc A1 → `https://telc-a1.thesmartlanguage.com/lessons`
  - telc A2 → `https://telc-a2.thesmartlanguage.com/lessons`
  - telc B1 → `https://telc-b1.thesmartlanguage.com/lessons`
  - telc B2 → `https://telc-b2.thesmartlanguage.com/lessons`

### 4. Platform Authentication
- Student authenticates at thesmartlanguage.com
- Separate authentication system from teacher dashboard
- Student never returns to teacher dashboard

### 5. Enrollment Tracking
- Clerk webhook fires when student signs up
- Teacher dashboard updates enrollment status to "active"
- Teacher can monitor student enrollments

## ⚙️ Clerk Dashboard Configuration

### CRITICAL: Whitelist External URLs

1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Navigate to **Paths** → **Redirect URLs**
3. Add ALL platform URLs:
   ```
   https://telc-a1.thesmartlanguage.com/lessons
   https://telc-a2.thesmartlanguage.com/lessons
   https://telc-b1.thesmartlanguage.com/lessons
   https://telc-b2.thesmartlanguage.com/lessons
   ```
4. Save changes

**⚠️ Important**: Clerk will reject redirects to URLs not in this whitelist!

### Sign-up Mode Configuration
1. Go to **User & Authentication** → **Restrictions**
2. Set to **"Public"** or **"Restricted"** (NOT "Closed")
3. Enable **"Allow sign-up with invitations"**

### Webhook Configuration
1. Go to **Webhooks** → **Add Endpoint**
2. For production: `https://yourdomain.com/api/webhooks/clerk`
3. For testing: Use Svix Play URL
4. Enable `user.created` event
5. Copy signing secret to `.env.local`

## 📝 Implementation Details

### Magic Link Creation
```typescript
// In /api/teacher-dashboard/enroll-students-magic/route.ts
const coursePlatformUrl = getCourseLessonUrl(courseId);
const invitation = await clerk.invitations.createInvitation({
  emailAddress: email,
  redirectUrl: coursePlatformUrl, // Direct to external platform
  publicMetadata: {
    role: 'student',
    courseId,
    organizationCode,
    coursePlatformUrl
  },
  notify: true
});
```

### Course Configuration
```typescript
// In /lib/course-config.ts
export const COURSE_CONFIGS = {
  telc_a1: {
    platformUrl: 'https://telc-a1.thesmartlanguage.com',
    lessonsPath: '/lessons'
  }
  // ... other courses
};
```

### Webhook Processing
```typescript
// Student never comes to teacher dashboard
// Webhook only updates enrollment status
if (publicMetadata?.role === 'student') {
  await updateEnrollmentStatus(email, 'active');
  // No redirect handling needed
}
```

## 🔒 Security Considerations

### 1. URL Validation
- All external URLs must use HTTPS
- URLs must be whitelisted in Clerk Dashboard
- Validate course IDs before generating URLs

### 2. Data Flow
- Teacher Dashboard: Only for teachers
- Student Data: Enrollment status only
- Authentication: Handled by external platform
- No student PII stored beyond email

### 3. Webhook Security
- Always verify Clerk webhook signatures
- Use webhook secret from environment
- Implement idempotency for duplicate events

## 🧪 Testing the Flow

### 1. Test Invitation
```bash
# Send test invitation
curl -X POST http://localhost:3000/api/teacher-dashboard/enroll-students-magic \
  -H "Content-Type: application/json" \
  -d '{
    "emails": "test@example.com",
    "courseId": "telc_a1",
    "organizationCode": "ANB"
  }'
```

### 2. Verify Redirect URL
Check the invitation response for correct platform URL:
```json
{
  "redirectUrl": "https://telc-a1.thesmartlanguage.com/lessons"
}
```

### 3. Monitor Webhook
View webhook payload at Svix Play dashboard to confirm enrollment update

## 🚨 Common Issues

### "Invalid redirect URL" Error
**Cause**: URL not whitelisted in Clerk
**Fix**: Add URL to Clerk Dashboard → Paths → Redirect URLs

### Student Lands on Teacher Dashboard
**Cause**: Incorrect redirect URL configuration
**Fix**: Ensure `redirectUrl` uses `coursePlatformUrl`, not local URL

### Enrollment Not Updating
**Cause**: Webhook not configured or failing
**Fix**: Check webhook secret and endpoint configuration

### 422 Error on Invitation
**Cause**: Invalid parameters or configuration
**Fix**: Verify all URLs are HTTPS and whitelisted

## 📊 Monitoring

### Track Successful Redirects
```sql
-- Check enrollments with platform URLs
SELECT 
  student_email,
  course_id,
  status,
  enrollment_data->>'course_platform_url' as redirect_url,
  invitation_sent_at,
  activated_at
FROM student_enrollments
WHERE invitation_id IS NOT NULL
ORDER BY created_at DESC;
```

### Verify No Student Access
```sql
-- Students should never appear in teacher dashboard logs
-- Check for any student role users accessing the dashboard
SELECT * FROM audit_logs 
WHERE user_role = 'student' 
AND path LIKE '/teacher-dashboard%';
-- Should return empty
```

## 🎯 Key Points

1. **Students never access teacher dashboard**
2. **Direct redirect to external platform**
3. **External URLs must be whitelisted**
4. **Separate authentication systems**
5. **Webhook only updates enrollment status**

## 📋 Checklist

- [ ] External URLs whitelisted in Clerk Dashboard
- [ ] Redirect URLs use HTTPS
- [ ] Webhook endpoint configured
- [ ] Enrollment tracking working
- [ ] Students redirected to correct platform
- [ ] No student access to teacher dashboard
- [ ] Platform authentication working

---

*Last Updated: September 2025*
*Architecture: Teacher Dashboard (Teachers Only) → Clerk Magic Links → External Platform (Students)*
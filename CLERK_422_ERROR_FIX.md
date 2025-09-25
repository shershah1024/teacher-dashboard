# 🔧 Fixing Clerk 422 Unprocessable Entity Error

## 🚨 Error Details
```
Error: Unprocessable Entity
status: 422
```

This error occurs when Clerk rejects the invitation request due to invalid parameters or configuration issues.

## 📋 Common Causes & Solutions

### 1. **Missing or Invalid Redirect URL**
The `NEXT_PUBLIC_APP_URL` environment variable is not set, causing an invalid redirect URL.

**Solution Applied:**
```typescript
// Use a default URL if not configured
const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3003';
const redirectUrl = `${baseUrl}/student-onboarding`;
```

**Fix in `.env.local`:**
```env
NEXT_PUBLIC_APP_URL=http://localhost:3003
```

### 2. **Clerk Dashboard Configuration Issues**

You need to check these settings in your [Clerk Dashboard](https://dashboard.clerk.com):

#### a) **Enable Invitations**
1. Go to **User & Authentication** → **Email, Phone, Username**
2. Ensure **"Allow sign-up with invitations"** is enabled
3. Make sure **"Email address"** is enabled as a contact method

#### b) **Sign-up Mode**
1. Go to **User & Authentication** → **Restrictions**
2. Check if sign-up mode is set to:
   - ✅ **"Public"** - Anyone can sign up
   - ✅ **"Restricted"** - Only invited users can sign up
   - ❌ **"Closed"** - No one can sign up (this will cause 422 errors!)

#### c) **Redirect URLs**
1. Go to **Paths** → **Redirect URLs**
2. Add your redirect URL to the allowed list:
   - For development: `http://localhost:3000/student-onboarding`
   - For production: `https://yourdomain.com/student-onboarding`

### 3. **Testing Tool Created**

I've created a test endpoint to help diagnose the issue:

**Test it with curl:**
```bash
curl -X POST http://localhost:3003/api/teacher-dashboard/test-invitation \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
```

This will try different parameter combinations to identify what works.

## 🎯 Quick Fixes to Try

### Option 1: Minimal Invitation (No Redirect)
```typescript
const invitation = await clerk.invitations.createInvitation({
  emailAddress: email
});
```

### Option 2: With Notify Only
```typescript
const invitation = await clerk.invitations.createInvitation({
  emailAddress: email,
  notify: true
});
```

### Option 3: Without Metadata
```typescript
const invitation = await clerk.invitations.createInvitation({
  emailAddress: email,
  redirectUrl: 'http://localhost:3003/sign-up',  // Use default sign-up page
  notify: true
});
```

## 🔍 Debugging Steps

1. **Check Console Logs**
   The updated code now logs detailed error information:
   - Specific Clerk error codes
   - Error messages
   - Redirect URL being used

2. **Verify Environment Variables**
   ```bash
   grep "NEXT_PUBLIC_APP_URL\|CLERK_SECRET_KEY" .env.local
   ```

3. **Test with Different Parameters**
   Use the test endpoint to identify which parameters cause issues

4. **Check Clerk Dashboard Settings**
   - Invitations enabled?
   - Sign-up mode not "Closed"?
   - Redirect URLs whitelisted?

## 🚀 Recommended Action Plan

1. **Add to `.env.local`:**
   ```env
   NEXT_PUBLIC_APP_URL=http://localhost:3003
   ```

2. **In Clerk Dashboard:**
   - Enable invitations
   - Set sign-up mode to "Restricted" or "Public"
   - Add `http://localhost:3003/student-onboarding` to allowed redirect URLs

3. **Try Simplified Invitation:**
   If still failing, try removing parameters one by one:
   - Remove `redirectUrl`
   - Remove `publicMetadata`
   - Keep only `emailAddress` and `notify`

4. **Check Clerk Plan Limits:**
   - Free tier may have invitation limits
   - Check if you've hit monthly quotas

## 📝 Alternative Approach

If invitations continue to fail, consider using **Sign-up Links** instead:

```typescript
// Generate a sign-up link with pre-filled email
const signUpUrl = `${baseUrl}/sign-up?email_address=${encodeURIComponent(email)}&redirect_url=/student-onboarding`;

// Store enrollment in database
await supabase.from('student_enrollments').insert({
  student_email: email,
  status: 'invited',
  signup_link: signUpUrl
});

// Send custom email with the link
```

## 🔄 Next Steps

1. Run the test endpoint to identify the exact issue
2. Check Clerk Dashboard configuration
3. Add missing environment variables
4. Try simplified invitation parameters
5. Consider fallback to sign-up links if needed

The error should be resolved once the Clerk Dashboard is properly configured and the redirect URL is whitelisted!
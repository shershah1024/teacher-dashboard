# 📚 Clerk SDK 2025 Implementation Guide

## 🚨 **BREAKING CHANGE in Clerk v6+ (2024/2025)**

The most critical change in Clerk SDK v6+ is that **`clerkClient()` is now ASYNCHRONOUS**. This is a fundamental shift from previous versions.

## ❌ **OLD Implementation (Pre-v6)**
```typescript
// This NO LONGER WORKS in 2025!
import { clerkClient } from '@clerk/nextjs/server';

// Synchronous usage - DEPRECATED
const invitation = clerkClient.invitations.createInvitation({...});
```

## ✅ **CORRECT Implementation (v6+ / 2025)**
```typescript
import { auth, clerkClient } from '@clerk/nextjs/server';

// MUST await clerkClient() first!
const clerk = await clerkClient();

// Then use the clerk instance
const invitation = await clerk.invitations.createInvitation({
  emailAddress: email,
  redirectUrl: redirectUrl,
  publicMetadata: metadata,
  notify: true
});
```

## 🔧 **Complete Working Example**

### API Route with Magic Links (Next.js App Router)
```typescript
// app/api/teacher-dashboard/enroll-students-magic/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';

export async function POST(request: NextRequest) {
  try {
    // 1. Check authentication
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { email, courseId, organizationCode } = body;

    // 2. Get Clerk client instance (ASYNC!)
    const clerk = await clerkClient();
    
    // 3. Create invitation with metadata
    const invitation = await clerk.invitations.createInvitation({
      emailAddress: email,
      redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/student-onboarding`,
      publicMetadata: {
        role: 'student',
        courseId,
        organizationCode,
        invitedBy: userId
      },
      notify: true // Sends email automatically
    });

    return NextResponse.json({
      success: true,
      invitationId: invitation.id,
      message: 'Magic link invitation sent'
    });

  } catch (error: any) {
    console.error('Error creating invitation:', error);
    
    // Handle specific Clerk errors
    if (error.errors?.[0]?.code === 'form_identifier_exists') {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create invitation' },
      { status: 500 }
    );
  }
}
```

## 🎯 **Key Changes in 2025**

### 1. Async Pattern Required
```typescript
// ❌ WRONG (old pattern)
const client = clerkClient;
const user = client.users.getUser(userId);

// ✅ CORRECT (new pattern)
const client = await clerkClient();
const user = await client.users.getUser(userId);
```

### 2. Error Handling
```typescript
try {
  const clerk = await clerkClient();
  const result = await clerk.invitations.createInvitation({...});
} catch (error) {
  // Clerk client might fail to initialize
  console.error('Clerk initialization error:', error);
}
```

### 3. Multiple Operations
```typescript
const clerk = await clerkClient(); // Call once

// Then use the instance multiple times
const invitation = await clerk.invitations.createInvitation({...});
const user = await clerk.users.getUser(userId);
const organization = await clerk.organizations.getOrganization(orgId);
```

## 📦 **Package Versions**

### Latest Stable (Sep 2025):
```json
{
  "@clerk/nextjs": "^6.32.0",
  "@clerk/backend": "^1.19.6",
  "next": "^15.5.2"
}
```

### Installation:
```bash
npm install @clerk/nextjs@latest
```

## 🔍 **Available Methods**

Once you have the clerk instance:
```typescript
const clerk = await clerkClient();

// Available resources:
clerk.invitations       // User invitations
clerk.users            // User management  
clerk.organizations    // Organization management
clerk.sessions         // Session management
clerk.emailAddresses   // Email management
clerk.phoneNumbers     // Phone management
clerk.clients          // Client management
```

## 🚫 **Common Mistakes to Avoid**

### 1. Forgetting to await clerkClient()
```typescript
// ❌ This will cause: Cannot read properties of undefined
const invitation = await clerkClient.invitations.createInvitation({...});

// ✅ Correct
const clerk = await clerkClient();
const invitation = await clerk.invitations.createInvitation({...});
```

### 2. Using old import patterns
```typescript
// ❌ Don't use @clerk/backend directly for Next.js
import { createClerkClient } from '@clerk/backend';

// ✅ Use Next.js-specific imports
import { clerkClient } from '@clerk/nextjs/server';
```

### 3. Not handling async initialization
```typescript
// ❌ Missing error handling
const clerk = await clerkClient();

// ✅ Proper error handling
try {
  const clerk = await clerkClient();
  // Use clerk...
} catch (error) {
  console.error('Clerk initialization failed:', error);
  // Handle gracefully
}
```

## 🔐 **Environment Variables**

Required for Clerk to work:
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
CLERK_SECRET_KEY=sk_test_xxx
CLERK_WEBHOOK_SECRET=whsec_xxx  # For webhooks
```

## 🧪 **Testing Checklist**

- [ ] Verify `await clerkClient()` is used before any Clerk operations
- [ ] Check all error handling for async operations
- [ ] Confirm environment variables are set correctly
- [ ] Test invitation creation and email delivery
- [ ] Verify webhook processing if applicable
- [ ] Check build succeeds without TypeScript errors

## 📚 **References**

- [Clerk Next.js SDK Documentation](https://clerk.com/docs/references/nextjs/overview)
- [Clerk Backend SDK Reference](https://clerk.com/docs/references/backend/overview)  
- [Clerk v6 Migration Guide](https://clerk.com/docs/upgrade-guides/nextjs/v6)
- [Clerk Changelog](https://clerk.com/changelog)

## 💡 **Pro Tips**

1. **Cache the client instance** within a request if making multiple calls:
   ```typescript
   let clerkInstance: any;
   
   async function getClerk() {
     if (!clerkInstance) {
       clerkInstance = await clerkClient();
     }
     return clerkInstance;
   }
   ```

2. **Use TypeScript** for better type safety:
   ```typescript
   import type { Invitation } from '@clerk/nextjs/server';
   ```

3. **Check Clerk status** before operations:
   ```typescript
   if (!process.env.CLERK_SECRET_KEY) {
     throw new Error('Clerk is not configured');
   }
   ```

## ✨ **Summary**

The key takeaway for 2025: **Always await clerkClient()** before using any Clerk methods. This async pattern is required in v6+ and aligns with modern Next.js server component architecture.

---

*Last updated: September 2025 | Clerk v6.32.0 | Next.js 15.5.2*
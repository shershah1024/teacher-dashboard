# 🚀 Dual Auth Implementation Plan

## Phase 1: Database Schema & RLS Setup

### 1.1 Create Institution & Teacher Tables

```sql
-- Run in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Institutions table
CREATE TABLE institutions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  subdomain TEXT UNIQUE,
  logo_url TEXT,
  settings JSONB DEFAULT '{
    "max_teachers": 50,
    "max_students_per_teacher": 100,
    "enabled_courses": ["telc_a1", "telc_a2", "telc_b1", "telc_b2"],
    "features": {
      "bulk_enrollment": true,
      "analytics": true,
      "custom_branding": false
    }
  }'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Teachers table (links to Supabase auth.users)
CREATE TABLE teachers (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT DEFAULT 'teacher' CHECK (role IN ('teacher', 'institution_admin', 'super_admin')),
  permissions JSONB DEFAULT '{
    "can_invite_students": true,
    "can_view_analytics": true,
    "can_export_data": false,
    "can_manage_teachers": false
  }'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login TIMESTAMPTZ
);

-- Update student_enrollments to link with teachers
ALTER TABLE student_enrollments 
  ADD COLUMN IF NOT EXISTS teacher_id UUID REFERENCES teachers(id),
  ADD COLUMN IF NOT EXISTS institution_id UUID REFERENCES institutions(id);

-- Create indexes for performance
CREATE INDEX idx_teachers_institution_id ON teachers(institution_id);
CREATE INDEX idx_teachers_email ON teachers(email);
CREATE INDEX idx_student_enrollments_teacher_id ON student_enrollments(teacher_id);
CREATE INDEX idx_student_enrollments_institution_id ON student_enrollments(institution_id);
```

### 1.2 Row Level Security Policies

```sql
-- Enable RLS
ALTER TABLE institutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_enrollments ENABLE ROW LEVEL SECURITY;

-- INSTITUTIONS POLICIES
-- Super admins see all institutions
CREATE POLICY "Super admins see all institutions" ON institutions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM teachers 
      WHERE teachers.id = auth.uid() 
      AND teachers.role = 'super_admin'
    )
  );

-- Institution admins see their institution
CREATE POLICY "Institution admins see own institution" ON institutions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM teachers 
      WHERE teachers.id = auth.uid() 
      AND teachers.institution_id = institutions.id
      AND teachers.role = 'institution_admin'
    )
  );

-- TEACHERS POLICIES
-- Teachers see themselves
CREATE POLICY "Teachers see own profile" ON teachers
  FOR SELECT USING (id = auth.uid());

-- Teachers update own profile (except role and institution)
CREATE POLICY "Teachers update own profile" ON teachers
  FOR UPDATE USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid() 
    AND role = (SELECT role FROM teachers WHERE id = auth.uid())
    AND institution_id = (SELECT institution_id FROM teachers WHERE id = auth.uid())
  );

-- Institution admins manage teachers in their institution
CREATE POLICY "Institution admins manage teachers" ON teachers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM teachers t 
      WHERE t.id = auth.uid() 
      AND t.role = 'institution_admin'
      AND t.institution_id = teachers.institution_id
    )
  );

-- STUDENT ENROLLMENTS POLICIES
-- Teachers see and manage their own students
CREATE POLICY "Teachers manage own students" ON student_enrollments
  FOR ALL USING (teacher_id = auth.uid());

-- Institution admins see all students in their institution
CREATE POLICY "Institution admins see all students" ON student_enrollments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM teachers 
      WHERE teachers.id = auth.uid() 
      AND teachers.role = 'institution_admin'
      AND teachers.institution_id = student_enrollments.institution_id
    )
  );
```

### 1.3 Helper Functions

```sql
-- Function to get current user's role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
BEGIN
  RETURN (SELECT role FROM teachers WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get current user's institution
CREATE OR REPLACE FUNCTION get_user_institution()
RETURNS UUID AS $$
BEGIN
  RETURN (SELECT institution_id FROM teachers WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can perform action
CREATE OR REPLACE FUNCTION can_user_perform(action TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  user_permissions JSONB;
BEGIN
  SELECT permissions INTO user_permissions 
  FROM teachers WHERE id = auth.uid();
  
  RETURN (user_permissions->action)::boolean;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Phase 2: Supabase Auth Integration

### 2.1 Install Supabase Client

```bash
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
```

### 2.2 Create Supabase Client Configuration

```typescript
// /lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

```typescript
// /lib/supabase/server.ts
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: '', ...options })
        },
      },
    }
  )
}
```

### 2.3 Create Auth Context Provider

```typescript
// /components/providers/supabase-auth-provider.tsx
'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'

interface AuthContext {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, metadata?: any) => Promise<void>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
}

const AuthContext = createContext<AuthContext | undefined>(undefined)

export function SupabaseAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
    router.push('/teacher-dashboard')
  }

  const signUp = async (email: string, password: string, metadata?: any) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
      },
    })
    if (error) throw error
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })
    if (error) throw error
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, resetPassword }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within SupabaseAuthProvider')
  }
  return context
}
```

## Phase 3: Update API Routes

### 3.1 Modify Enrollment API to Use Dual Auth

```typescript
// /app/api/teacher-dashboard/enroll-students-magic/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { clerkClient } from '@clerk/nextjs/server';

export async function POST(request: NextRequest) {
  // Get teacher from Supabase auth
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (!user || authError) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get teacher details
  const { data: teacher } = await supabase
    .from('teachers')
    .select('*, institution:institutions(*)')
    .eq('id', user.id)
    .single();

  if (!teacher) {
    return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
  }

  // Check permissions
  if (!teacher.permissions?.can_invite_students) {
    return NextResponse.json({ error: 'No permission to invite students' }, { status: 403 });
  }

  const body = await request.json();
  const { emails, courseId, classId } = body;

  // Process with Clerk for magic links
  const clerk = await clerkClient();
  const results = [];

  for (const email of emails.split(',')) {
    try {
      // Create Clerk invitation
      const invitation = await clerk.invitations.createInvitation({
        emailAddress: email.trim(),
        redirectUrl: getCourseLessonUrl(courseId),
        publicMetadata: {
          teacherId: teacher.id,
          institutionId: teacher.institution_id,
          courseId,
          classId,
        },
        notify: true
      });

      // Store enrollment in database with teacher association
      const { data: enrollment } = await supabase
        .from('student_enrollments')
        .insert({
          student_email: email.trim(),
          course_id: courseId,
          class_id: classId,
          teacher_id: teacher.id,
          institution_id: teacher.institution_id,
          organization_code: teacher.institution.subdomain,
          invitation_id: invitation.id,
          status: 'invited',
          invited_by: teacher.id,
          invitation_sent_at: new Date().toISOString()
        })
        .select()
        .single();

      results.push({ email, success: true, enrollment });
    } catch (error) {
      results.push({ email, success: false, error: error.message });
    }
  }

  return NextResponse.json({ results });
}
```

## Phase 4: Create Teacher Auth Pages

### 4.1 Teacher Login Page

```typescript
// /app/auth/login/page.tsx
'use client';

import { useState } from 'react';
import { useAuth } from '@/components/providers/supabase-auth-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

export default function TeacherLoginPage() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signIn(email, password);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mb-4">
            <h1 className="text-2xl font-bold">A&B Recruiting</h1>
            <p className="text-sm text-gray-600">Teacher Portal</p>
          </div>
          <CardTitle>Sign In</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && (
              <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                {error}
              </div>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            <Link href="/auth/reset-password" className="text-blue-600 hover:underline">
              Forgot password?
            </Link>
          </div>
          <div className="mt-6 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
            <p className="text-xs text-yellow-800">
              <strong>Note for Students:</strong> Use the magic link from your teacher to access courses directly.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

## Phase 5: Migration Strategy

### 5.1 Migration Steps

1. **Deploy Database Changes**
   - Run SQL migrations in Supabase
   - Test RLS policies

2. **Deploy Auth Pages**
   - Deploy new login/signup pages
   - Keep Clerk for backward compatibility

3. **Migrate Teachers**
   - Create teacher accounts in Supabase
   - Send password reset emails
   - Map existing Clerk IDs to Supabase IDs

4. **Update API Routes**
   - Switch to dual auth gradually
   - Test with pilot group

5. **Full Rollout**
   - Enable for all users
   - Monitor for issues
   - Remove Clerk teacher auth code

## Phase 6: Testing Checklist

- [ ] Teacher can log in with Supabase
- [ ] Teacher can send student invitations via Clerk
- [ ] Students redirect to external platform
- [ ] RLS policies work correctly
- [ ] Institution admin can manage teachers
- [ ] Webhooks update enrollments
- [ ] Session management works
- [ ] Password reset works
- [ ] Audit trails are created

## Benefits of This Approach

1. **Clean Separation**: Teachers never touch Clerk UI, students never touch Supabase UI
2. **Cost Effective**: Only pay for Clerk invitations, not teacher seats
3. **Scalable**: Can add thousands of teachers without Clerk costs
4. **Secure**: RLS ensures data isolation at DB level
5. **Flexible**: Easy to add features like SSO, 2FA for teachers

---

*This implementation gives you the best of both worlds: Supabase for teacher management with RLS, and Clerk for student invitations with magic links.*
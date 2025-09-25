# 🚀 Multi-Institution SaaS Implementation Roadmap

## Current State (Single Institution - A&B Recruiting)

### What's Working Now
- ✅ Teacher dashboard for A&B Recruiting
- ✅ Teachers can send magic link invitations to students
- ✅ Students redirect directly to course platforms (telc-a1.thesmartlanguage.com)
- ✅ Clerk handles invitations and magic links
- ✅ Webhook updates enrollment status
- ✅ Professional UI with enrollment management

### Current Architecture
```
Teacher Dashboard (A&B Recruiting only)
    ├── Teachers log in (currently using Clerk)
    ├── Send magic links to students
    └── Students → External platform (thesmartlanguage.com)
```

## 🎯 Future State: Multi-Institution SaaS Platform

### Vision
```
TheSmartLanguage SaaS Platform
    ├── Institution A (A&B Recruiting)
    ├── Institution B (Berlin Academy)
    ├── Institution C (Munich Center)
    └── ... (Unlimited institutions)

Each institution has:
    ├── Their own teachers
    ├── Their own students
    ├── Their own branding (optional)
    └── Their own analytics
```

## 📋 Implementation Checklist

### Phase 1: Enable Clerk Organizations (Week 1)

#### 1.1 Configure Clerk Dashboard
```bash
1. Go to dashboard.clerk.com
2. Navigate to Organizations
3. Enable Organizations feature
4. Configure settings:
   - Max memberships: 1 (users belong to one institution)
   - Creator role: org:admin
   - Member deletion: Allowed
```

#### 1.2 Create Roles and Permissions
```javascript
// In Clerk Dashboard → Organizations → Roles

// Institution Admin
{
  "key": "org:admin",
  "name": "Institution Admin",
  "permissions": [
    "org:sys:profile:manage",
    "org:sys:memberships:manage", 
    "org:teachers:manage",
    "org:billing:manage"
  ]
}

// Teacher
{
  "key": "org:teacher", 
  "name": "Teacher",
  "permissions": [
    "org:students:invite",
    "org:students:manage_own",
    "org:courses:assign"
  ]
}
```

#### 1.3 Update Environment Variables
```env
# Add to .env.local
NEXT_PUBLIC_CLERK_ORGANIZATION_ENABLED=true
NEXT_PUBLIC_APP_MODE=multi_tenant # or single_tenant for current
```

### Phase 2: Database Updates (Week 1)

#### 2.1 Run Migration Script
```sql
-- Save this as: supabase/migrations/add_multi_institution_support.sql

-- Add institution tracking to existing tables
ALTER TABLE student_enrollments 
  ADD COLUMN IF NOT EXISTS institution_id VARCHAR(255),
  ADD COLUMN IF NOT EXISTS institution_name VARCHAR(255);

-- Create institutions table
CREATE TABLE IF NOT EXISTS institutions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clerk_org_id VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  subdomain VARCHAR(255) UNIQUE,
  settings JSONB DEFAULT '{}',
  plan VARCHAR(50) DEFAULT 'trial',
  trial_ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for performance
CREATE INDEX idx_institutions_clerk_org_id ON institutions(clerk_org_id);
CREATE INDEX idx_enrollments_institution_id ON student_enrollments(institution_id);
```

### Phase 3: Update API Routes (Week 2)

#### 3.1 Modify Enrollment API
```typescript
// Update: /app/api/teacher-dashboard/enroll-students-magic/route.ts

import { auth } from '@clerk/nextjs';

export async function POST(request: NextRequest) {
  const { userId, orgId, orgSlug } = await auth();
  
  // Check if multi-tenant mode
  const isMultiTenant = process.env.NEXT_PUBLIC_APP_MODE === 'multi_tenant';
  
  if (isMultiTenant && !orgId) {
    return NextResponse.json(
      { error: 'Organization required' },
      { status: 403 }
    );
  }

  // ... existing code ...

  // Add institution context to invitation
  const invitation = await clerk.invitations.createInvitation({
    emailAddress: email,
    redirectUrl: coursePlatformUrl,
    publicMetadata: {
      ...(isMultiTenant && {
        institutionId: orgId,
        institutionSlug: orgSlug,
      }),
      teacherId: userId,
      courseId
    }
  });

  // Store with institution reference
  const enrollment = {
    student_email: email,
    course_id: courseId,
    ...(isMultiTenant && {
      institution_id: orgId,
      institution_name: orgSlug,
    }),
    // ... rest of fields
  };
}
```

### Phase 4: Add Organization UI Components (Week 2)

#### 4.1 Create Organization Switcher
```typescript
// Create: /components/organization-switcher.tsx

import { OrganizationSwitcher } from '@clerk/nextjs';

export function OrgSwitcher() {
  const isMultiTenant = process.env.NEXT_PUBLIC_APP_MODE === 'multi_tenant';
  
  if (!isMultiTenant) return null;
  
  return (
    <OrganizationSwitcher 
      appearance={{
        elements: {
          organizationSwitcherTrigger: "px-4 py-2",
        }
      }}
    />
  );
}
```

#### 4.2 Add to Layout
```typescript
// Update: /app/teacher-dashboard/page.tsx

import { OrgSwitcher } from '@/components/organization-switcher';

// Add to header
<div className="flex items-center gap-4">
  <OrgSwitcher />
  {/* existing user menu */}
</div>
```

### Phase 5: Institution Onboarding (Week 3)

#### 5.1 Create Self-Service Signup
```typescript
// Create: /app/institutions/signup/page.tsx

export default function InstitutionSignup() {
  const [step, setStep] = useState(1);
  
  return (
    <OnboardingFlow>
      {step === 1 && <AccountDetails />}
      {step === 2 && <InstitutionInfo />}
      {step === 3 && <PlanSelection />}
      {step === 4 && <Complete />}
    </OnboardingFlow>
  );
}
```

#### 5.2 Create Institution API
```typescript
// Create: /app/api/institutions/create/route.ts

export async function POST(request: Request) {
  const data = await request.json();
  
  // 1. Create Clerk user
  const user = await clerk.users.createUser({
    emailAddress: data.email,
    password: data.password,
  });
  
  // 2. Create organization
  const org = await clerk.organizations.createOrganization({
    name: data.institutionName,
    slug: data.subdomain,
    createdBy: user.id,
    publicMetadata: {
      plan: 'trial',
      trialEndsAt: addDays(new Date(), 14)
    }
  });
  
  // 3. Store in database
  await supabase.from('institutions').insert({
    clerk_org_id: org.id,
    name: data.institutionName,
    slug: data.subdomain,
    plan: 'trial'
  });
  
  return NextResponse.json({ success: true });
}
```

### Phase 6: Add Billing (Week 4)

#### 6.1 Integrate Stripe
```bash
npm install @stripe/stripe-js stripe
```

#### 6.2 Create Billing Portal
```typescript
// Create: /app/teacher-dashboard/billing/page.tsx

export default function BillingPage() {
  const { organization } = useOrganization();
  
  return (
    <BillingPortal
      organizationId={organization.id}
      plans={pricingPlans}
      currentPlan={organization.publicMetadata.plan}
    />
  );
}
```

## 🔄 Migration Strategy

### For Existing A&B Recruiting Data

```typescript
// One-time migration script
async function migrateToOrganizations() {
  // 1. Create A&B Recruiting organization
  const org = await clerk.organizations.createOrganization({
    name: 'A&B Recruiting',
    slug: 'ab-recruiting',
  });
  
  // 2. Migrate existing users to organization
  const users = await clerk.users.getUserList();
  for (const user of users) {
    await clerk.organizationMemberships.createOrganizationMembership({
      organizationId: org.id,
      userId: user.id,
      role: 'org:teacher'
    });
  }
  
  // 3. Update database records
  await supabase
    .from('student_enrollments')
    .update({ 
      institution_id: org.id,
      institution_name: 'A&B Recruiting'
    })
    .is('institution_id', null);
}
```

## 🧪 Testing Plan

### Test Scenarios
1. **Single Institution Mode** (current)
   - [ ] Existing flows work unchanged
   - [ ] No organization UI appears
   - [ ] A&B Recruiting continues working

2. **Multi-Institution Mode** (future)
   - [ ] New institution can sign up
   - [ ] Institution admin can invite teachers
   - [ ] Teachers see only their institution's students
   - [ ] Data isolation works correctly
   - [ ] Billing processes correctly

### Feature Flags
```typescript
// utils/feature-flags.ts
export const features = {
  multiTenant: process.env.NEXT_PUBLIC_APP_MODE === 'multi_tenant',
  selfServiceSignup: process.env.NEXT_PUBLIC_ENABLE_SIGNUP === 'true',
  billing: process.env.NEXT_PUBLIC_ENABLE_BILLING === 'true',
};
```

## 📊 Monitoring & Analytics

### Key Metrics to Track
- Number of institutions
- Teachers per institution
- Students per institution
- Active usage per institution
- Conversion rate (trial → paid)
- Churn rate by plan

### Analytics Implementation
```typescript
// Track institution events
analytics.track('Institution Created', {
  institutionId: org.id,
  plan: 'trial',
  source: 'self_service'
});

analytics.track('Teacher Invited', {
  institutionId: org.id,
  teacherId: user.id,
  totalTeachers: teacherCount
});
```

## 🚀 Launch Checklist

### Pre-Launch
- [ ] Enable Organizations in Clerk
- [ ] Run database migrations
- [ ] Update all API routes
- [ ] Add organization UI components
- [ ] Test with dummy institution
- [ ] Set up billing

### Launch Day
- [ ] Enable feature flag
- [ ] Monitor error logs
- [ ] Track signups
- [ ] Be ready for support

### Post-Launch
- [ ] Gather feedback
- [ ] Optimize onboarding
- [ ] Add requested features
- [ ] Scale infrastructure

## 💡 Quick Commands

```bash
# Check current mode
echo $NEXT_PUBLIC_APP_MODE

# Switch to multi-tenant mode
export NEXT_PUBLIC_APP_MODE=multi_tenant

# Run in single-tenant mode (current)
export NEXT_PUBLIC_APP_MODE=single_tenant

# Test institution signup flow
npm run test:institution-signup

# Migrate existing data
npm run migrate:add-organizations
```

## 📞 Support Contacts

When implementing, refer to:
- Clerk Organizations: https://clerk.com/docs/organizations
- Clerk Support: support@clerk.com
- This roadmap: README_MULTI_INSTITUTION_ROADMAP.md

## ⚠️ Important Notes

1. **Keep single-tenant mode working** during transition
2. **Test thoroughly** before enabling for all
3. **Backup database** before migration
4. **Gradual rollout** - start with one test institution
5. **Monitor costs** - each org counts as MAO in Clerk

---

*This roadmap provides everything needed to transform the current single-institution teacher dashboard into a multi-tenant SaaS platform. Follow the phases in order for smooth implementation.*
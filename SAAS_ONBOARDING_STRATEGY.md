# 🚪 SaaS Onboarding Strategy: Who Creates Organizations?

## The Two Approaches

### Approach A: Self-Service (Institution Signs Up Themselves)
```
1. Institution visits: thesmartlanguage.com/get-started
2. Fills out form: "Start Your Language School"
3. Creates account → Automatically creates organization
4. Becomes org:admin → Can invite teachers
5. Teachers invite students
```

### Approach B: Managed Onboarding (You Invite Institutions)
```
1. Sales team talks to institution
2. You create organization in Clerk
3. Send invitation to institution admin
4. They accept → Become org:admin
5. Can then invite their teachers
```

## 🎯 RECOMMENDED: Hybrid Approach

**Best of both worlds: Self-service with approval**

```
┌──────────────────────────────────────────┐
│         Public Landing Page               │
│     thesmartlanguage.com/institutions     │
└────────────┬─────────────────────────────┘
             │
             ↓
┌──────────────────────────────────────────┐
│         Sign Up Flow Options              │
│                                           │
│  1. "Start Free Trial" (Self-service)    │
│  2. "Request Demo" (Sales-led)           │
│  3. "Enterprise Contact" (Custom)        │
└──────────────────────────────────────────┘
```

## 📊 Detailed Implementation

### Option 1: Fully Self-Service (Recommended for Scale)

```typescript
// /app/onboarding/institution/page.tsx
export default function InstitutionOnboarding() {
  return (
    <OnboardingFlow>
      {/* Step 1: Account Creation */}
      <Step1_CreateAccount />
      
      {/* Step 2: Institution Details */}
      <Step2_InstitutionInfo>
        - Institution Name
        - Subdomain (berlin.teacherdashboard.thesmartlanguage.com)
        - Country/Timezone
        - Expected number of teachers
      </Step2_InstitutionInfo>
      
      {/* Step 3: Plan Selection */}
      <Step3_SelectPlan>
        - Free Trial (14 days)
        - Basic ($49/month)
        - Professional ($99/month)
        - Enterprise (Contact sales)
      </Step3_SelectPlan>
      
      {/* Step 4: Organization Created */}
      <Step4_Complete>
        ✓ Organization created
        ✓ Admin account ready
        → Redirect to dashboard
      </Step4_Complete>
    </OnboardingFlow>
  );
}
```

**Backend Flow:**
```typescript
// /api/onboarding/create-institution/route.ts
export async function POST(request: Request) {
  const { 
    email, 
    password, 
    institutionName, 
    subdomain 
  } = await request.json();

  // 1. Create user in Clerk
  const user = await clerkClient.users.createUser({
    emailAddress: email,
    password: password,
  });

  // 2. Create organization
  const organization = await clerkClient.organizations.createOrganization({
    name: institutionName,
    slug: subdomain,
    createdBy: user.id,
    publicMetadata: {
      plan: 'trial',
      trialEndsAt: addDays(new Date(), 14),
      maxTeachers: 5, // Trial limit
      onboardingCompleted: false
    }
  });

  // 3. Make user the admin
  await clerkClient.organizationMemberships.createOrganizationMembership({
    organizationId: organization.id,
    userId: user.id,
    role: 'org:admin'
  });

  // 4. Store in your database
  await supabase.from('institutions').insert({
    clerk_org_id: organization.id,
    name: institutionName,
    subdomain: subdomain,
    owner_email: email,
    plan: 'trial',
    status: 'active'
  });

  // 5. Send welcome email
  await sendWelcomeEmail(email, institutionName);

  return { success: true, organizationId: organization.id };
}
```

### Option 2: Invitation-Only (Recommended for Premium/Enterprise)

```typescript
// Admin tool for SmartLanguage team
// /app/admin/invite-institution/page.tsx

export default function InviteInstitutionPage() {
  const handleInvite = async (data) => {
    // Create organization without user
    const org = await clerkClient.organizations.createOrganization({
      name: data.institutionName,
      slug: data.subdomain,
      publicMetadata: {
        plan: data.plan,
        salesRep: currentUser.id,
        contractTerms: data.terms
      }
    });

    // Send invitation email
    await clerkClient.invitations.createInvitation({
      emailAddress: data.adminEmail,
      redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/accept-institution-invite`,
      publicMetadata: {
        organizationId: org.id,
        role: 'org:admin',
        institutionName: data.institutionName
      }
    });
  };

  return (
    <Form onSubmit={handleInvite}>
      <Input name="institutionName" label="Institution Name" />
      <Input name="adminEmail" label="Admin Email" />
      <Select name="plan" options={['enterprise', 'professional']} />
      <Button type="submit">Send Invitation</Button>
    </Form>
  );
}
```

### Option 3: Hybrid Model (BEST FOR YOUR CASE)

```typescript
// Public signup with approval process
const signupFlow = {
  // 1. Anyone can request
  publicSignup: async (data) => {
    // Create pending organization
    await supabase.from('institution_requests').insert({
      name: data.institutionName,
      email: data.email,
      status: 'pending_approval',
      requested_at: new Date()
    });
    
    // Notify your team
    await notifyAdmins('New institution request', data);
  },

  // 2. You approve/deny
  adminApproval: async (requestId, approved) => {
    if (approved) {
      const request = await getRequest(requestId);
      
      // Create organization
      const org = await createOrganization(request);
      
      // Invite admin
      await inviteInstitutionAdmin(request.email, org.id);
      
      // Update status
      await updateRequestStatus(requestId, 'approved');
    }
  },

  // 3. They complete setup
  completeSetup: async (invitationToken) => {
    // Admin accepts invitation
    // Sets up their account
    // Can start inviting teachers
  }
};
```

## 💰 Pricing Strategy Based on Onboarding

### Self-Service Tiers
```javascript
const pricingPlans = {
  trial: {
    price: 0,
    duration: '14 days',
    limits: {
      teachers: 5,
      students: 50,
      features: ['basic']
    }
  },
  starter: {
    price: 49,
    limits: {
      teachers: 10,
      students: 200,
      features: ['basic', 'analytics']
    }
  },
  professional: {
    price: 99,
    limits: {
      teachers: 50,
      students: 1000,
      features: ['all']
    }
  },
  enterprise: {
    price: 'custom',
    limits: 'unlimited',
    features: ['all', 'sso', 'api', 'whitelabel']
  }
};
```

## 🎯 My Recommendation for TheSmartLanguage

### Go with: **Self-Service with Automatic Approval**

```
1. Institution signs up at: institutions.thesmartlanguage.com
2. Fills form → Creates account → Organization auto-created
3. Starts with 14-day free trial
4. You get notified → Can reach out for sales
5. After trial → Must upgrade to continue
```

### Why This Works Best:

1. **Scalable**: No manual work per institution
2. **Fast Growth**: Institutions can start immediately
3. **Qualify Leads**: Free trial filters serious customers
4. **Sales Opportunity**: You can still do high-touch for big accounts
5. **Data Collection**: You learn what institutions need

### Implementation Steps:

```typescript
// 1. Create landing page
/app/get-started/page.tsx
  → Beautiful form
  → Value proposition
  → Pricing tiers

// 2. Onboarding API
/api/institutions/signup/route.ts
  → Create user
  → Create organization
  → Start trial
  → Send emails

// 3. Admin Dashboard (for you)
/app/admin/institutions/page.tsx
  → See all signups
  → Monitor usage
  → Upgrade/downgrade
  → Support tools

// 4. Billing Integration
Stripe or Paddle
  → Automatic billing after trial
  → Usage-based pricing
  → Invoice generation
```

## 📊 What Successful EdTech SaaS Companies Do

| Company | Model | Why It Works |
|---------|-------|--------------|
| **Duolingo for Schools** | Self-service | Teachers sign up directly |
| **Google Classroom** | Self-service with admin | Schools can start immediately |
| **Canvas LMS** | Sales-led for institutions | High-touch for large contracts |
| **Kahoot!** | Freemium self-service | Easy start, upgrade later |

## 🚀 Quick Decision Tree

```
Q: Do you want to grow fast?
→ Yes: Self-service

Q: Do you want to control quality?
→ Yes: Invitation-only

Q: Do you want both?
→ Yes: Self-service with trial limits

Q: What about enterprise clients?
→ Keep a "Contact Sales" option
```

## ✅ Final Recommendation

**For TheSmartLanguage.com:**

1. **Primary Path**: Self-service signup
   - Institution creates account
   - Auto-creates organization
   - 14-day trial with 5 teachers
   - Must add payment to continue

2. **Enterprise Path**: Contact sales
   - Custom onboarding
   - Negotiated pricing
   - White-glove setup

3. **Referral Path**: Partner institutions
   - You create org for them
   - Special pricing
   - Co-branded experience

This gives you **maximum growth potential** while maintaining **quality control** through trial limits and payment requirements.

---

*The key insight: Let institutions self-onboard to scale, but maintain control through trials, limits, and payment gates. This is how modern SaaS wins.*
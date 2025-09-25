# 🔗 Clerk Webhook Setup Guide

## Overview
This guide will help you set up Clerk webhooks to automatically activate student enrollments when they accept magic link invitations.

## 🧪 Testing with Svix Play

For development and testing, we're using Svix Play to inspect webhook payloads:
- **Testing Endpoint**: https://play.svix.com/in/e_da5s0n37XgZHqVWCA9qO0rtOUuz/
- This allows you to see all webhook payloads in real-time

## 📋 Step-by-Step Setup

### Step 1: Configure Webhook in Clerk Dashboard

1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Navigate to **Webhooks** in the sidebar
3. Click **Add Endpoint**
4. Configure the endpoint:

#### For Development/Testing:
```
Endpoint URL: https://play.svix.com/in/e_da5s0n37XgZHqVWCA9qO0rtOUuz/
```

#### For Production:
```
Endpoint URL: https://yourdomain.com/api/webhooks/clerk
```

### Step 2: Select Events

Enable the following events:
- ✅ `user.created` - **Required** for enrollment activation
- ✅ `user.updated` - Optional, for profile updates
- ✅ `user.deleted` - Optional, for cleanup

### Step 3: Get the Signing Secret

1. After creating the webhook, click on it
2. Copy the **Signing Secret** (starts with `whsec_`)
3. It will look like: `whsec_MfKQ9r8GKYqrTwjUPD8ILPZIo2LaLaSw`

### Step 4: Update Environment Variables

Add the webhook secret to your `.env.local`:

```env
# Clerk Webhook Configuration
CLERK_WEBHOOK_SECRET=whsec_YOUR_SECRET_HERE

# For local development with ngrok (optional)
# NEXT_PUBLIC_APP_URL=https://your-ngrok-url.ngrok.io
```

### Step 5: Test the Webhook

#### Option A: Using Svix Play (Recommended for Development)

1. Open [Svix Play Dashboard](https://play.svix.com/in/e_da5s0n37XgZHqVWCA9qO0rtOUuz/)
2. Send a magic link invitation from your app
3. When student signs up, watch the webhook payload appear
4. Copy the payload for testing

#### Option B: Using ngrok for Local Testing

1. Install ngrok: `brew install ngrok` (or download from ngrok.com)
2. Start your Next.js app: `npm run dev`
3. In another terminal: `ngrok http 3000`
4. Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`)
5. Update Clerk webhook URL to: `https://abc123.ngrok.io/api/webhooks/clerk`

## 🔄 Webhook Flow

### 1. Teacher Sends Invitation
```javascript
// Magic link invitation created with metadata
{
  emailAddress: "student@example.com",
  publicMetadata: {
    role: "student",
    courseId: "telc_a1",
    classId: "class_123",
    organizationCode: "ANB"
  }
}
```

### 2. Student Accepts Invitation
When student clicks the magic link and creates account

### 3. Webhook Triggered
Clerk sends `user.created` event to your webhook:

```json
{
  "type": "user.created",
  "data": {
    "id": "user_abc123",
    "email_addresses": [{
      "email_address": "student@example.com"
    }],
    "public_metadata": {
      "role": "student",
      "courseId": "telc_a1",
      "classId": "class_123",
      "organizationCode": "ANB"
    }
  }
}
```

### 4. Enrollment Activated
Webhook handler updates the database:

```sql
UPDATE student_enrollments 
SET 
  status = 'active',
  invitation_status = 'accepted',
  clerk_user_id = 'user_abc123',
  activated_at = NOW()
WHERE 
  student_email = 'student@example.com'
  AND course_id = 'telc_a1'
  AND organization_code = 'ANB'
```

## 🧪 Testing the Complete Flow

### Manual Test Script

Create a test file `test-webhook.js`:

```javascript
// test-webhook.js
const testWebhook = async () => {
  const webhookUrl = 'http://localhost:3000/api/webhooks/clerk';
  
  const payload = {
    type: 'user.created',
    data: {
      id: 'user_test_' + Date.now(),
      email_addresses: [{
        email_address: 'test@example.com',
        verification: { status: 'verified' }
      }],
      public_metadata: {
        role: 'student',
        courseId: 'telc_a1',
        organizationCode: 'ANB',
        classId: null
      },
      created_at: new Date().toISOString()
    }
  };

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'svix-id': 'msg_test',
      'svix-timestamp': Math.floor(Date.now() / 1000).toString(),
      'svix-signature': 'test_signature' // Note: Won't pass verification
    },
    body: JSON.stringify(payload)
  });

  console.log('Response:', await response.text());
};

testWebhook();
```

## 🔍 Debugging Webhooks

### Check Webhook Logs

1. **In Clerk Dashboard**:
   - Go to Webhooks → Your webhook
   - Click "Message Attempts" to see delivery history
   - Check for failures and retry if needed

2. **In Your Application**:
   ```bash
   # Check Next.js logs
   npm run dev
   # Look for: "Received Clerk webhook: user.created"
   ```

3. **In Svix Play**:
   - Visit your endpoint URL to see all received payloads
   - Check payload structure and headers

### Common Issues

#### 1. Webhook Secret Not Set
```
Error: CLERK_WEBHOOK_SECRET is not configured
```
**Solution**: Add `CLERK_WEBHOOK_SECRET=whsec_...` to `.env.local`

#### 2. Signature Verification Failed
```
Error: Invalid webhook signature
```
**Solution**: Ensure webhook secret matches exactly (no extra spaces)

#### 3. Enrollment Not Found
```
Warning: No matching enrollment found for email
```
**Solution**: Check that invitation was sent before user signed up

#### 4. Database Update Failed
```
Error: Error updating enrollment for user creation
```
**Solution**: Check Supabase connection and RLS policies

## 🚀 Production Deployment

### Vercel Deployment

1. Add environment variables in Vercel Dashboard:
   - `CLERK_WEBHOOK_SECRET`
   - `NEXT_PUBLIC_APP_URL`

2. Update Clerk webhook URL to your production domain:
   ```
   https://yourdomain.vercel.app/api/webhooks/clerk
   ```

3. Test with a real enrollment

### Security Best Practices

1. **Always verify webhook signatures**
2. **Use HTTPS in production**
3. **Implement idempotency** - Handle duplicate webhooks
4. **Add rate limiting** to prevent abuse
5. **Log all webhook events** for audit trail

## 📊 Monitoring

### Key Metrics to Track

- Webhook delivery success rate
- Average processing time
- Failed enrollment activations
- User creation to activation time

### Sample Monitoring Query

```sql
-- Check recent webhook activity
SELECT 
  student_email,
  invitation_status,
  invitation_sent_at,
  invitation_accepted_at,
  EXTRACT(EPOCH FROM (invitation_accepted_at - invitation_sent_at))/60 as minutes_to_accept
FROM student_enrollments
WHERE invitation_id IS NOT NULL
ORDER BY invitation_sent_at DESC
LIMIT 20;
```

## 🔧 Troubleshooting Checklist

- [ ] Webhook secret correctly set in `.env.local`
- [ ] Webhook URL accessible from internet (use ngrok for local)
- [ ] Events selected in Clerk Dashboard
- [ ] Database has matching enrollment record
- [ ] Public metadata correctly set in invitation
- [ ] Supabase RLS policies allow updates
- [ ] Webhook handler has proper error handling

## 📝 Test Scenarios

1. **Happy Path**: Student accepts invitation → Enrollment activated
2. **Duplicate Prevention**: Same student signs up twice
3. **Missing Enrollment**: User signs up without invitation
4. **Metadata Validation**: Invalid course or organization
5. **Cleanup**: User account deleted → Enrollment deactivated

## 🆘 Support Resources

- [Clerk Webhooks Documentation](https://clerk.com/docs/webhooks/overview)
- [Svix Play](https://play.svix.com) for webhook testing
- [ngrok Documentation](https://ngrok.com/docs) for local tunneling
- Application logs in Vercel Dashboard

---

*Last Updated: September 2025*
*Status: ✅ Ready for Testing with Svix Play*
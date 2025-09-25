# 🧪 Webhook Testing Guide

## Quick Start

### 1️⃣ Set Up Webhook in Clerk Dashboard

1. Go to [Clerk Dashboard](https://dashboard.clerk.com) → **Webhooks**
2. Click **Add Endpoint**
3. Use the Svix Play URL for testing:
   ```
   https://play.svix.com/in/e_da5s0n37XgZHqVWCA9qO0rtOUuz/
   ```
4. Enable these events:
   - `user.created` ✅ (Required)
   - `user.updated` (Optional)
   - `user.deleted` (Optional)

### 2️⃣ Get the Signing Secret

1. Click on your webhook endpoint in Clerk
2. Copy the **Signing Secret** (starts with `whsec_`)
3. Add to `.env.local`:
   ```env
   CLERK_WEBHOOK_SECRET=whsec_YOUR_SECRET_HERE
   ```

### 3️⃣ Test the Flow

#### Option A: Use the Test Script
```bash
# Make it executable (first time only)
chmod +x test-webhook-flow.sh

# Run the test
./test-webhook-flow.sh

# Or with custom parameters
./test-webhook-flow.sh student@test.com telc_a1 ANB
```

#### Option B: Manual Testing with curl

1. **First, create an enrollment** (send invitation):
   ```bash
   # This would normally be done through the UI
   # Just for testing, you can manually insert a test enrollment
   ```

2. **Check enrollment status**:
   ```bash
   curl -X POST http://localhost:3000/api/test/webhook-simulator \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","courseId":"telc_a1","organizationCode":"ANB","action":"check"}'
   ```

3. **Simulate user sign-up** (activate enrollment):
   ```bash
   curl -X POST http://localhost:3000/api/test/webhook-simulator \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","courseId":"telc_a1","organizationCode":"ANB","action":"activate"}'
   ```

4. **Verify activation**:
   ```bash
   curl -X POST http://localhost:3000/api/test/webhook-simulator \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","courseId":"telc_a1","organizationCode":"ANB","action":"check"}'
   ```

## 📊 Monitor Webhook Activity

### View Webhooks in Svix Play
Open the dashboard to see all webhook payloads in real-time:
👉 [https://play.svix.com/in/e_da5s0n37XgZHqVWCA9qO0rtOUuz/](https://play.svix.com/in/e_da5s0n37XgZHqVWCA9qO0rtOUuz/)

### Check Application Logs
```bash
# In your terminal running npm run dev, look for:
🔔 Received Clerk webhook: user.created
✅ Successfully activated enrollment for test@example.com in telc_a1
```

### Query Database Directly
```sql
-- Check recent enrollments
SELECT 
  student_email,
  course_id,
  status,
  invitation_status,
  clerk_user_id,
  invited_at,
  activated_at
FROM student_enrollments
WHERE organization_code = 'ANB'
ORDER BY created_at DESC
LIMIT 10;
```

## 🔄 Complete Test Flow

### Step 1: Send Magic Link Invitation
1. Go to `/teacher-dashboard/manage-students`
2. Enable "Send magic link invitations"
3. Add student email
4. Select course and class
5. Click "Add Students"

### Step 2: Student Signs Up
1. Student receives email with magic link
2. Clicks link → redirected to sign-up
3. Creates account (passwordless)
4. Clerk triggers `user.created` webhook

### Step 3: Webhook Processes
1. Webhook received at `/api/webhooks/clerk`
2. Verifies signature
3. Extracts metadata (course, class, organization)
4. Updates enrollment to `active`

### Step 4: Verify Success
1. Check Svix Play dashboard for webhook
2. Check application logs for confirmation
3. Refresh manage students page
4. Student should show as "Active"

## 🐛 Troubleshooting

### Issue: Webhook not received
- Check Clerk Dashboard → Webhooks → Message Attempts
- Verify endpoint URL is correct
- Check if webhook is enabled

### Issue: Signature verification failed
- Ensure `CLERK_WEBHOOK_SECRET` is set correctly
- No extra spaces or quotes in the secret
- Restart Next.js after updating .env.local

### Issue: Enrollment not activating
- Check if enrollment exists in database
- Verify email matches exactly
- Check course_id and organization_code match
- Look for error logs in console

### Issue: 404 on webhook endpoint
- Ensure `/api/webhooks/clerk/route.ts` exists
- Check for TypeScript errors
- Restart development server

## 📝 Test Checklist

- [ ] Webhook endpoint configured in Clerk
- [ ] Signing secret added to .env.local
- [ ] Test script runs successfully
- [ ] Can view webhooks in Svix Play
- [ ] Enrollment activates on user.created
- [ ] Logs show successful processing
- [ ] UI reflects enrollment status

## 🚀 Next Steps

Once testing is complete:

1. **For Production**:
   - Change webhook URL to your production domain
   - Use proper webhook secret
   - Enable webhook verification
   - Add monitoring and alerts

2. **Security**:
   - Always verify webhook signatures
   - Use HTTPS in production
   - Implement rate limiting
   - Add idempotency checks

3. **Monitoring**:
   - Track webhook success rate
   - Monitor activation times
   - Set up error alerts
   - Log all webhook events

---

*Last Updated: September 2025*
*Testing Endpoint: https://play.svix.com/in/e_da5s0n37XgZHqVWCA9qO0rtOUuz/*
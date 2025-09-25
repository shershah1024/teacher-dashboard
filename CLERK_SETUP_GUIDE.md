# Clerk Magic Links Setup Guide

## ✅ Setup Confirmation
The Clerk magic links functionality has been successfully configured and tested. Invitations are working correctly.

## 📋 Required Clerk Dashboard Configuration

### 1. Enable Invitations
1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Navigate to **User & Authentication** → **Email, Phone, Username**
3. Enable **"Allow sign-up with invitations"**
4. Ensure **"Email address"** is enabled as a contact method

### 2. Configure Sign-up Mode
1. Go to **User & Authentication** → **Restrictions**
2. Set sign-up mode to one of:
   - **"Public"** - Anyone can sign up (recommended for testing)
   - **"Restricted"** - Only invited users can sign up (recommended for production)
   - ⚠️ **NOT "Closed"** - This will block all sign-ups including invitations

### 3. Whitelist Redirect URLs
1. Go to **Paths** → **Redirect URLs**
2. Add these URLs to the allowed list:
   - Development: `http://localhost:3000/student-onboarding`
   - Production: `https://yourdomain.com/student-onboarding`

### 4. Configure Webhooks (For User Activation)
1. Go to **Webhooks** → **Add Endpoint**
2. Set endpoint URL:
   - Development: Use ngrok or similar tunnel service
   - Production: `https://yourdomain.com/api/webhooks/clerk`
3. Select events:
   - `user.created`
   - `user.updated` (optional)
4. Copy the **Signing Secret**
5. Add to `.env.local`:
   ```env
   CLERK_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET_HERE
   ```

## 🔧 Environment Variables

Add these to your `.env.local` file:

```env
# Clerk Configuration
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_YOUR_KEY
CLERK_SECRET_KEY=sk_test_YOUR_KEY
CLERK_WEBHOOK_SECRET=whsec_YOUR_SECRET

# Application URL (important for redirects)
NEXT_PUBLIC_APP_URL=http://localhost:3000  # Change for production

# Clerk URLs
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/teacher-dashboard
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/teacher-dashboard
```

## 🚀 How Magic Links Work

### Teacher Side (Sending Invitations)
1. Teacher goes to **Manage Students** page
2. Enables "Send magic link invitations" toggle
3. Enters student emails and selects course/class
4. System creates Clerk invitations with metadata
5. Students receive email with magic sign-up link

### Student Side (Accepting Invitations)
1. Student clicks magic link in email
2. Redirected to `/student-onboarding` page
3. Creates account (passwordless)
4. System automatically:
   - Activates enrollment
   - Links to organization
   - Sets up course access

## 📊 Database Schema

The system tracks invitations in `student_enrollments` table:

```sql
-- Key columns for magic links
invitation_id VARCHAR(255)        -- Clerk invitation ID
invitation_status VARCHAR(50)     -- sent, accepted, expired
invitation_sent_at TIMESTAMPTZ    -- When invitation was sent
clerk_user_id VARCHAR(255)        -- Clerk user ID after sign-up
```

## 🧪 Testing the System

### Test with curl:
```bash
# Test basic invitation creation (requires auth)
curl -X POST http://localhost:3000/api/teacher-dashboard/test-invitation \
  -H "Content-Type: application/json" \
  -H "Cookie: YOUR_AUTH_COOKIE" \
  -d '{"email": "test@example.com"}'
```

### Test from UI:
1. Sign in as teacher
2. Go to `/teacher-dashboard/manage-students`
3. Enable magic links toggle
4. Add a test email
5. Check console logs for invitation details

## 🔍 Troubleshooting

### Common Issues:

1. **422 Unprocessable Entity**
   - Check if invitations are enabled in Clerk
   - Verify redirect URLs are whitelisted
   - Ensure sign-up mode isn't "Closed"

2. **Invitation emails not sending**
   - Check Clerk email settings
   - Verify `notify: true` in invitation call
   - Check spam folders

3. **Webhook not activating enrollments**
   - Ensure `CLERK_WEBHOOK_SECRET` is set
   - Use ngrok for local webhook testing
   - Check webhook logs in Clerk Dashboard

4. **"form_identifier_exists" error**
   - User already exists in Clerk
   - They should sign in normally instead

## 📈 Production Checklist

- [ ] Set `NEXT_PUBLIC_APP_URL` to production domain
- [ ] Configure production redirect URLs in Clerk
- [ ] Set up production webhook endpoint
- [ ] Add `CLERK_WEBHOOK_SECRET` from production webhook
- [ ] Set sign-up mode to "Restricted" for invite-only access
- [ ] Test end-to-end flow with real emails
- [ ] Monitor Clerk Dashboard for invitation metrics

## 🎯 Success Metrics

Monitor these in Clerk Dashboard:
- Invitation sent count
- Invitation acceptance rate
- Time to acceptance
- Failed invitation reasons

## 🔐 Security Considerations

1. **Rate Limiting**: Implement rate limiting on invitation endpoint
2. **Email Validation**: Always validate email format before sending
3. **Duplicate Prevention**: Check existing enrollments before inviting
4. **Webhook Verification**: Always verify webhook signatures
5. **Metadata Validation**: Validate all public metadata fields

## 📞 Support

- Clerk Documentation: https://clerk.com/docs
- Clerk Support: support@clerk.com
- Application Issues: Check server logs and Clerk Dashboard

---

*Last Updated: September 2025*
*Status: ✅ Configured and Working*
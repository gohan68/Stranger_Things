# Integration Guide

**Last Updated**: Phase 1 - Initial Setup  
**Purpose**: Step-by-step guide to integrate backend features

---

## 📚 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Phase-by-Phase Integration](#phase-by-phase-integration)
3. [Feature-Specific Guides](#feature-specific-guides)
4. [Testing Each Feature](#testing-each-feature)
5. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Accounts
- [ ] Supabase account (project created)
- [ ] Google Cloud Console account (for OAuth)
- [ ] Resend account (for email)
- [ ] Vercel account (for deployment)

### Required Tools
- [ ] Node.js 18+ installed
- [ ] Git installed
- [ ] Code editor (VS Code recommended)

### Environment Setup
- [ ] `.env` file created and populated
- [ ] Dependencies installed (`npm install` or `yarn install`)
- [ ] Development server running (`npm run dev`)

---

## Phase-by-Phase Integration

### Phase 1: Environment Setup ✅
*Current Phase*

**What we're doing:**
- Creating documentation structure
- Setting up environment variables
- Documenting architecture

**Deliverables:**
- [x] `/app/docs/ARCHITECTURE.md`
- [x] `/app/docs/ENVIRONMENT_SETUP.md`
- [x] `/app/docs/API_REFERENCE.md`
- [x] `/app/.env.example`
- [x] `/app/.env` (with your credentials)

**Next:** Phase 2 - Database Schema

---

### Phase 2: Database Schema
*Coming Next*

**What we'll do:**
1. Create SQL schema for all tables
2. Set up Row Level Security policies
3. Create database indexes
4. Run migrations on your Supabase project

**You'll need to:**
- Access Supabase SQL Editor
- Run provided SQL scripts
- Verify tables are created

---

### Phase 3: Authentication

**What we'll do:**
1. Set up Supabase client
2. Create authentication context
3. Implement Google OAuth
4. Add user profile management

**You'll need to:**
- Configure Google OAuth in Cloud Console
- Add OAuth credentials to Supabase
- Test sign-in flow

---

### Phase 4: Comments System

**What we'll do:**
1. Create comment components
2. Implement real-time subscriptions
3. Add moderation dashboard
4. Set up rate limiting

**You'll test:**
- Posting comments (anonymous & authenticated)
- Real-time updates
- Admin moderation tools

---

### Phase 5: Reading Progress Sync

**What we'll do:**
1. Update Reader component
2. Implement auto-save logic
3. Add sync indicator
4. Maintain localStorage fallback

**You'll test:**
- Progress saving on scroll
- Sync across devices
- Offline behavior

---

### Phase 6: OpenGraph Images

**What we'll do:**
1. Create Vercel serverless function
2. Implement image generation
3. Add dynamic meta tags

**You'll test:**
- Image generation locally
- Social media preview (Twitter, Facebook)

---

### Phase 7: Newsletter

**What we'll do:**
1. Set up Resend integration
2. Implement double opt-in flow
3. Create email templates
4. Add unsubscribe functionality

**You'll test:**
- Email subscription
- Confirmation email
- Unsubscribe link

---

## Feature-Specific Guides

### How to Enable/Disable Features

Edit your `.env` file:

```bash
# Disable comments
VITE_ENABLE_COMMENTS=false

# Disable progress sync
VITE_ENABLE_PROGRESS_SYNC=false

# Disable newsletter
VITE_ENABLE_NEWSLETTER=false
```

Restart your dev server after changes.

---

### How to Add Admin Users

1. Sign in to your app with Google
2. Open browser console
3. Run:
   ```javascript
   const { data } = await supabase.auth.getUser();
   console.log('User ID:', data.user.id);
   ```
4. Copy the UUID
5. Add to `.env`:
   ```bash
   VITE_ADMIN_USER_IDS=uuid-from-step-4
   ```
6. For multiple admins, separate with commas:
   ```bash
   VITE_ADMIN_USER_IDS=uuid1,uuid2,uuid3
   ```

---

### How to Test Locally

**1. Comments:**
```typescript
// Navigate to any chapter
// Scroll to bottom
// You should see comment section
// Post a test comment
// Open in another browser (incognito)
// Should see comment appear in real-time
```

**2. Progress Sync:**
```typescript
// Sign in with Google
// Read a chapter, scroll to 50%
// Open same account in different browser
// Navigate to same chapter
// Should scroll to 50% automatically
```

**3. Newsletter:**
```typescript
// Navigate to footer
// Enter email address
// Check email for confirmation link
// Click confirmation link
// Should see success message
```

---

## Testing Each Feature

### Manual Testing Checklist

#### Comments
- [ ] Can post comment as anonymous user
- [ ] Can post comment as authenticated user
- [ ] Comments appear in real-time
- [ ] Can flag inappropriate comment
- [ ] Admin can see flagged comments
- [ ] Admin can delete comments
- [ ] Rate limiting works (try posting 11 comments)

#### Reading Progress
- [ ] Progress saves on scroll (authenticated)
- [ ] Progress syncs across devices
- [ ] LocalStorage fallback works (anonymous)
- [ ] Sync indicator shows status
- [ ] Offline mode maintains localStorage

#### OpenGraph Images
- [ ] Images generate for each chapter
- [ ] Twitter Card Validator shows correct image
- [ ] Facebook Debugger shows correct image
- [ ] Fallback image works on error

#### Newsletter
- [ ] Can subscribe with valid email
- [ ] Confirmation email arrives
- [ ] Confirmation link works
- [ ] Duplicate email rejected
- [ ] Unsubscribe link works
- [ ] Rate limiting prevents spam

---

## Troubleshooting

### Common Issues

**Issue: Features not appearing**
- Check `.env` file has `VITE_ENABLE_*=true`
- Restart dev server
- Clear browser cache

**Issue: Supabase connection failed**
- Verify URL and anon key in `.env`
- Check Supabase project is not paused
- Run schema migrations

**Issue: OAuth redirect loop**
- Verify redirect URI in Google Console
- Check `VITE_SITE_URL` matches current URL
- Clear browser cookies

**Issue: Emails not sending**
- Check Resend API key is valid
- Verify `RESEND_FROM_EMAIL` domain
- Check rate limits in Resend dashboard

---

## Next Steps

After completing all phases:

1. **Full Testing**: Run through all features end-to-end
2. **Performance Check**: Lighthouse audit
3. **Security Review**: Test RLS policies
4. **Deploy to Vercel**: See `DEPLOYMENT.md`
5. **Monitor**: Set up error tracking

---

**Status**: 👀 Living document - updated with each phase  
**Current Phase**: Phase 1 complete, moving to Phase 2

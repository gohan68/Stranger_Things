# Environment Setup Guide

**Last Updated**: Phase 1 - Initial Setup

---

## 🚦 Quick Start

1. Copy `.env.example` to `.env`
2. Fill in the required values
3. Restart your development server

---

## 🔑 Required Environment Variables

### 1. Supabase Configuration

#### `VITE_SUPABASE_URL`
- **Required**: Yes
- **Type**: String (URL)
- **Example**: `https://xxxxx.supabase.co`
- **Where to find**: 
  1. Go to [Supabase Dashboard](https://app.supabase.com)
  2. Select your project
  3. Settings → API
  4. Copy "Project URL"

#### `VITE_SUPABASE_ANON_KEY`
- **Required**: Yes
- **Type**: String (JWT)
- **Example**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- **Where to find**:
  1. Same page as above
  2. Copy "anon public" key
- **Security**: Safe to expose to client-side

#### `SUPABASE_SERVICE_ROLE_KEY`
- **Required**: Yes (for API routes only)
- **Type**: String (JWT)
- **Example**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- **Where to find**:
  1. Same page as above
  2. Copy "service_role" key
- **Security**: ⚠️ **NEVER expose to client-side**
- **Usage**: Only in Vercel API routes

---

### 2. Google OAuth (Optional but Recommended)

#### `GOOGLE_CLIENT_ID`
- **Required**: No (but needed for Google Sign-In)
- **Type**: String
- **Example**: `123456789-abc.apps.googleusercontent.com`
- **How to get**:
  1. Go to [Google Cloud Console](https://console.cloud.google.com)
  2. Create a new project (or select existing)
  3. Enable Google+ API
  4. Credentials → Create Credentials → OAuth Client ID
  5. Application type: Web application
  6. Authorized redirect URIs:
     - `http://localhost:3000/auth/callback` (development)
     - `https://yourdomain.com/auth/callback` (production)
     - `https://ykhcfqconyixlatlezrk.supabase.co/auth/v1/callback` (Supabase)
  7. Copy Client ID

#### `GOOGLE_CLIENT_SECRET`
- **Required**: No (but needed with GOOGLE_CLIENT_ID)
- **Type**: String
- **Where to find**: Same page as above, copy Client Secret

#### **Configure in Supabase:**
1. Supabase Dashboard → Authentication → Providers
2. Enable Google
3. Paste Client ID and Client Secret
4. Save

---

### 3. Email Service (Resend)

#### `RESEND_API_KEY`
- **Required**: Yes (for newsletter feature)
- **Type**: String
- **Example**: `re_xxxxxxxxxxxx`
- **How to get**:
  1. Go to [Resend](https://resend.com)
  2. Sign up for free account
  3. API Keys → Create API Key
  4. Copy the key (shown only once!)
- **Free Tier**: 100 emails/day, 3,000/month

#### `RESEND_FROM_EMAIL`
- **Required**: Yes
- **Type**: String (email address)
- **Examples**:
  - Development: `noreply@resend.dev` (no verification needed)
  - Production: `noreply@yourdomain.com` (requires domain verification)
- **Domain Verification**:
  1. Resend Dashboard → Domains
  2. Add your domain
  3. Add DNS records (TXT, MX, CNAME)
  4. Wait for verification (5-30 minutes)

---

### 4. Application Configuration

#### `VITE_SITE_URL`
- **Required**: Yes
- **Type**: String (URL)
- **Examples**:
  - Development: `http://localhost:3000`
  - Production: `https://yourdomain.com`
- **Usage**: OAuth redirects, email links, OG images

#### `VITE_ENABLE_COMMENTS`
- **Required**: No
- **Type**: String (`"true"` or `"false"`)
- **Default**: `"true"`
- **Purpose**: Enable/disable comment system

#### `VITE_ENABLE_PROGRESS_SYNC`
- **Required**: No
- **Type**: String (`"true"` or `"false"`)
- **Default**: `"true"`
- **Purpose**: Enable/disable reading progress sync

#### `VITE_ENABLE_NEWSLETTER`
- **Required**: No
- **Type**: String (`"true"` or `"false"`)
- **Default**: `"true"`
- **Purpose**: Enable/disable newsletter signup

#### `VITE_ADMIN_USER_IDS`
- **Required**: No
- **Type**: String (comma-separated UUIDs)
- **Example**: `uuid1,uuid2,uuid3`
- **Purpose**: Supabase user IDs with admin access
- **How to find your user ID**:
  1. Sign in to your app
  2. Open browser console
  3. Run: `(await supabase.auth.getUser()).data.user.id`
  4. Copy the UUID

---

### 5. Rate Limiting

#### `RATE_LIMIT_COMMENTS`
- **Required**: No
- **Type**: Number
- **Default**: `10`
- **Purpose**: Max comments per user per hour

#### `RATE_LIMIT_NEWSLETTER`
- **Required**: No
- **Type**: Number
- **Default**: `5`
- **Purpose**: Max newsletter signups per IP per day

---

## 📦 Development vs Production

### Development (`.env`)
```bash
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

RESEND_API_KEY=re_xxx
RESEND_FROM_EMAIL=noreply@resend.dev

VITE_SITE_URL=http://localhost:3000
VITE_ENABLE_COMMENTS=true
VITE_ENABLE_PROGRESS_SYNC=true
VITE_ENABLE_NEWSLETTER=true

RATE_LIMIT_COMMENTS=10
RATE_LIMIT_NEWSLETTER=5
```

### Production (Vercel Environment Variables)

**How to set in Vercel:**
1. Vercel Dashboard → Your Project
2. Settings → Environment Variables
3. Add each variable
4. Select environments (Production, Preview, Development)
5. Save

**Important:**
- Use your production domain for `VITE_SITE_URL`
- Use verified domain for `RESEND_FROM_EMAIL`
- Keep `SUPABASE_SERVICE_ROLE_KEY` secure

---

## ✅ Verification Steps

### 1. Supabase Connection
```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// Test connection
const { data, error } = await supabase.from('profiles').select('count');
if (error) console.error('Supabase connection failed:', error);
else console.log('✅ Supabase connected');
```

### 2. Google OAuth
1. Go to `http://localhost:3000`
2. Click "Sign in with Google"
3. Should redirect to Google consent screen
4. After approval, should redirect back to your app

### 3. Resend Email
```typescript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const { data, error } = await resend.emails.send({
  from: 'Test <noreply@resend.dev>',
  to: 'your@email.com',
  subject: 'Test Email',
  text: 'If you receive this, Resend is working!',
});

if (error) console.error('Resend failed:', error);
else console.log('✅ Email sent');
```

---

## 🚀 Deployment Checklist

### Before Deploying:
- [ ] All environment variables set in Vercel
- [ ] Google OAuth redirect URIs updated for production domain
- [ ] Resend domain verified (for production email)
- [ ] Supabase RLS policies tested
- [ ] Admin user IDs configured
- [ ] Feature flags set appropriately
- [ ] Rate limits adjusted for production traffic

---

## 🐛 Troubleshooting

### Issue: "Supabase client not initialized"
**Solution**: Check that `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set and start with `VITE_`

### Issue: Google OAuth redirect fails
**Solution**: Verify redirect URI is exactly `https://ykhcfqconyixlatlezrk.supabase.co/auth/v1/callback` in Google Console

### Issue: Emails not sending
**Solution**: 
1. Check API key is valid
2. Verify domain (if not using resend.dev)
3. Check rate limits
4. Check Resend dashboard for errors

### Issue: "Invalid API key" for Resend
**Solution**: Regenerate API key in Resend dashboard, update `.env`, restart dev server

### Issue: Feature flags not working
**Solution**: 
1. Ensure variables start with `VITE_` (client-side)
2. Restart dev server after changing `.env`
3. Check value is string `"true"`, not boolean

---

## 🔒 Security Best Practices

1. **Never commit `.env` to Git**
   - Already in `.gitignore`
   - Use `.env.example` as template

2. **Rotate keys regularly**
   - Especially after public exposure
   - Supabase: Can regenerate anon key
   - Resend: Create new API key

3. **Use different keys for dev/prod**
   - Separate Supabase projects if possible
   - Separate Resend API keys

4. **Monitor usage**
   - Supabase Dashboard → Usage
   - Resend Dashboard → Analytics
   - Set up alerts for quota limits

5. **Implement rate limiting**
   - Already configured in environment
   - Adjust based on traffic patterns

---

## 📚 Additional Resources

- [Supabase Environment Variables](https://supabase.com/docs/guides/getting-started/local-development#environment-variables)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
- [Google OAuth Setup](https://developers.google.com/identity/protocols/oauth2)
- [Resend Getting Started](https://resend.com/docs/send-with-nodejs)

---

**Status**: ✅ Environment setup documentation complete  
**Next**: Proceed to Phase 2 - Database Schema

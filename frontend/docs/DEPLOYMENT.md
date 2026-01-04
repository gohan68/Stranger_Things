# Deployment Guide

**Project**: Stranger Things - The Right Side Up  
**Stack**: React + TypeScript + Vite + Supabase  
**Last Updated**: Phase 8 - Integration & Polish

---

## 📋 Prerequisites

Before deploying, ensure you have:

1. **Supabase Project**
   - Project URL
   - Anon Key
   - Service Role Key (for admin features)

2. **Google OAuth Credentials** (Optional, for authentication)
   - Google Client ID
   - Google Client Secret

3. **Deployment Platform Account**
   - Vercel (recommended)
   - Netlify
   - Or any static hosting service

---

## 🚀 Deployment Steps

### Option 1: Vercel (Recommended)

#### 1. Install Vercel CLI
```bash
npm install -g vercel
```

#### 2. Login to Vercel
```bash
vercel login
```

#### 3. Deploy from Project Directory
```bash
cd /app
vercel
```

#### 4. Configure Environment Variables

In Vercel Dashboard (Settings → Environment Variables), add:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Application Configuration
VITE_SITE_URL=https://your-domain.vercel.app
VITE_ENABLE_COMMENTS=true
VITE_ENABLE_PROGRESS_SYNC=true
VITE_ENABLE_NEWSLETTER=false

# Rate Limiting
RATE_LIMIT_COMMENTS=10
RATE_LIMIT_NEWSLETTER=5

# Google OAuth (Optional)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Admin Configuration
VITE_ADMIN_USER_IDS=uuid-of-admin-users
```

#### 5. Deploy
```bash
vercel --prod
```

---

### Option 2: Netlify

#### 1. Install Netlify CLI
```bash
npm install -g netlify-cli
```

#### 2. Login to Netlify
```bash
netlify login
```

#### 3. Initialize
```bash
cd /app
netlify init
```

#### 4. Configure Build Settings

In `netlify.toml`:
```toml
[build]
  command = "yarn build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

#### 5. Add Environment Variables

In Netlify Dashboard (Site settings → Environment variables), add the same variables as Vercel.

#### 6. Deploy
```bash
netlify deploy --prod
```

---

### Option 3: Manual Build & Deploy

#### 1. Build the Project
```bash
cd /app
yarn install
yarn build
```

#### 2. The build output will be in `/app/dist`

#### 3. Upload to your hosting provider:
- **AWS S3 + CloudFront**
- **Google Cloud Storage**
- **Azure Static Web Apps**
- **GitHub Pages**

---

## 🔧 Post-Deployment Configuration

### 1. Update Supabase Authentication URLs

In your Supabase Dashboard:
1. Go to **Authentication → URL Configuration**
2. Add your deployment URL to:
   - Site URL: `https://your-domain.com`
   - Redirect URLs: `https://your-domain.com/#/`

### 2. Configure Google OAuth (if enabled)

In Google Cloud Console:
1. Go to **APIs & Services → Credentials**
2. Add Authorized redirect URI:
   - `https://your-supabase-project.supabase.co/auth/v1/callback`

### 3. Update PDF Path

If you're using a custom PDF:
1. Ensure `/public/stranger-things-the-right-side-up.pdf` is included in build
2. Verify the path is accessible at `https://your-domain.com/stranger-things-the-right-side-up.pdf`

### 4. Test All Features

- ✅ Authentication (Google OAuth)
- ✅ Comment posting (authenticated & anonymous)
- ✅ Reading progress sync
- ✅ Admin dashboard (for admin users)
- ✅ PDF download
- ✅ Real-time comment updates

---

## 🔒 Security Checklist

- [ ] All environment variables set correctly
- [ ] Supabase RLS policies enabled
- [ ] Service Role Key kept server-side only
- [ ] CORS configured properly in Supabase
- [ ] Rate limiting tested
- [ ] Admin user IDs configured
- [ ] Google OAuth credentials secured

---

## 📊 Performance Optimization

### Enable Caching Headers

For Vercel, create `vercel.json`:
```json
{
  "headers": [
    {
      "source": "/stranger-things-the-right-side-up.pdf",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=86400"
        }
      ]
    },
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ]
}
```

---

## 🐛 Troubleshooting

### Issue: Comments not loading
**Solution**: Check Supabase URL and Anon Key are correct

### Issue: Google OAuth not working
**Solution**: Verify redirect URLs match in both Google Console and Supabase

### Issue: Admin dashboard not accessible
**Solution**: Ensure your user ID is in `VITE_ADMIN_USER_IDS` environment variable

### Issue: PDF download not working
**Solution**: Check PDF file is in `/public` directory and path is correct

### Issue: Build fails
**Solution**: 
```bash
rm -rf node_modules yarn.lock
yarn install
yarn build
```

---

## 📱 Custom Domain Setup

### Vercel
1. Go to Project Settings → Domains
2. Add your custom domain
3. Update DNS records as instructed
4. Update `VITE_SITE_URL` in environment variables

### Netlify
1. Go to Site Settings → Domain management
2. Add custom domain
3. Configure DNS
4. Enable HTTPS (automatic)

---

## 🔄 Continuous Deployment

### GitHub Integration (Vercel)
1. Connect GitHub repository in Vercel dashboard
2. Enable automatic deployments
3. Every push to `main` triggers a deployment

### GitHub Integration (Netlify)
1. Connect repository in Netlify
2. Configure build settings
3. Enable automatic deployments

---

## 📈 Monitoring

### Recommended Tools
- **Vercel Analytics**: Built-in performance monitoring
- **Sentry**: Error tracking
- **Google Analytics**: User analytics
- **Supabase Dashboard**: Database and auth monitoring

---

## 🆘 Support

For deployment issues:
1. Check logs in your deployment platform
2. Verify environment variables
3. Test locally first with `yarn build && yarn preview`
4. Check Supabase logs for backend errors

---

**Next Steps**: See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for common issues and solutions.

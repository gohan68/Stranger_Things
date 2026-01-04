# Feature Flags Guide

**Project**: Stranger Things - The Right Side Up  
**Last Updated**: Phase 8 - Integration & Polish

---

## 🎛️ Overview

This application uses environment-based feature flags to enable/disable backend features independently. This allows for:

- **Graceful degradation**: App works without backend
- **Flexible deployment**: Enable features when ready
- **Testing**: Test features individually
- **Progressive rollout**: Enable features gradually

---

## 📋 Available Feature Flags

### 1. Comments System
**Environment Variable**: `VITE_ENABLE_COMMENTS`  
**Default**: `true`  
**Type**: `boolean`

**What it controls**:
- Comment submission form
- Comment display section
- Real-time comment updates
- Comment moderation (admin)

**Example**:
```env
VITE_ENABLE_COMMENTS=true   # Enable comments
VITE_ENABLE_COMMENTS=false  # Disable comments
```

**When to disable**:
- During maintenance
- If moderation capacity is limited
- For read-only mode
- During spam attacks

---

### 2. Reading Progress Sync
**Environment Variable**: `VITE_ENABLE_PROGRESS_SYNC`  
**Default**: `true`  
**Type**: `boolean`

**What it controls**:
- Syncing progress to Supabase
- Cross-device progress sync
- Progress display in UI

**Note**: LocalStorage fallback still works when disabled

**Example**:
```env
VITE_ENABLE_PROGRESS_SYNC=true   # Enable sync
VITE_ENABLE_PROGRESS_SYNC=false  # Disable sync (local only)
```

**When to disable**:
- To reduce database load
- For privacy-focused mode
- During database maintenance
- For testing local-only mode

---

### 3. Newsletter System
**Environment Variable**: `VITE_ENABLE_NEWSLETTER`  
**Default**: `false` (not implemented)  
**Type**: `boolean`

**What it controls**:
- Newsletter subscription form
- Email capture
- Confirmation emails

**Example**:
```env
VITE_ENABLE_NEWSLETTER=false  # Keep disabled (not implemented)
```

**Status**: Skipped in Phase 7, can be implemented later

---

## 🔧 How to Use Feature Flags

### Setting in Development

1. **Edit `.env` file**:
   ```env
   VITE_ENABLE_COMMENTS=true
   VITE_ENABLE_PROGRESS_SYNC=true
   VITE_ENABLE_NEWSLETTER=false
   ```

2. **Restart development server**:
   ```bash
   # Stop current server (Ctrl+C)
   yarn dev
   ```

3. **Verify in browser console**:
   ```javascript
   console.log(import.meta.env.VITE_ENABLE_COMMENTS)
   ```

---

### Setting in Production

#### Vercel
1. Go to Project Settings → Environment Variables
2. Add variable: `VITE_ENABLE_COMMENTS` = `true`
3. Redeploy the application

#### Netlify
1. Go to Site Settings → Environment variables
2. Add variable: `VITE_ENABLE_COMMENTS` = `true`
3. Trigger a new deploy

---

## 🎯 Testing Feature Flags

### Test Plan

1. **All Features Enabled**
   ```env
   VITE_ENABLE_COMMENTS=true
   VITE_ENABLE_PROGRESS_SYNC=true
   ```
   - ✅ Comments section appears
   - ✅ Comments can be posted
   - ✅ Progress syncs to Supabase
   - ✅ Sync indicator shows in header

2. **Comments Disabled**
   ```env
   VITE_ENABLE_COMMENTS=false
   VITE_ENABLE_PROGRESS_SYNC=true
   ```
   - ✅ Comment section doesn't render
   - ✅ No comment-related API calls
   - ✅ Reading experience unaffected
   - ✅ Progress sync still works

3. **Progress Sync Disabled**
   ```env
   VITE_ENABLE_COMMENTS=true
   VITE_ENABLE_PROGRESS_SYNC=false
   ```
   - ✅ Comments work normally
   - ✅ Progress saves to localStorage only
   - ✅ No Supabase progress API calls
   - ✅ No sync indicator in header

4. **All Features Disabled**
   ```env
   VITE_ENABLE_COMMENTS=false
   VITE_ENABLE_PROGRESS_SYNC=false
   ```
   - ✅ Pure reading experience
   - ✅ No backend dependencies
   - ✅ Works completely offline
   - ✅ Progress saves locally

---

## 💡 Implementation Details

### How It Works

Feature flags are checked at runtime using Vite's environment variables:

```typescript
// Example in CommentSection.tsx
const commentsEnabled = import.meta.env.VITE_ENABLE_COMMENTS === 'true';

if (!commentsEnabled) {
  return null; // Don't render component
}
```

### Important Notes

1. **String Comparison**: Environment variables are strings
   ```typescript
   // ✅ Correct
   import.meta.env.VITE_ENABLE_COMMENTS === 'true'
   
   // ❌ Wrong
   import.meta.env.VITE_ENABLE_COMMENTS === true
   ```

2. **VITE_ Prefix**: Required for client-side access
   ```env
   # ✅ Accessible in client
   VITE_ENABLE_COMMENTS=true
   
   # ❌ Not accessible in client
   ENABLE_COMMENTS=true
   ```

3. **Build Time**: Values are set at build time
   - Changing values requires rebuild
   - Not dynamic at runtime

---

## 🚀 Rollout Strategy

### Recommended Approach

1. **Initial Launch**: All features enabled
   ```env
   VITE_ENABLE_COMMENTS=true
   VITE_ENABLE_PROGRESS_SYNC=true
   ```

2. **If Issues Arise**: Disable problematic feature
   ```env
   VITE_ENABLE_COMMENTS=false  # Temporary disable
   VITE_ENABLE_PROGRESS_SYNC=true
   ```

3. **Fix and Re-enable**: Once fixed, enable again
   ```env
   VITE_ENABLE_COMMENTS=true
   VITE_ENABLE_PROGRESS_SYNC=true
   ```

---

## 🔒 Security Considerations

### What's Safe to Expose

✅ Safe (can be in client-side code):
- Feature flags (VITE_ENABLE_*)
- Supabase URL (VITE_SUPABASE_URL)
- Supabase Anon Key (VITE_SUPABASE_ANON_KEY)

❌ Never expose to client:
- Service Role Key (SUPABASE_SERVICE_ROLE_KEY)
- Google Client Secret (GOOGLE_CLIENT_SECRET)
- Email API keys (RESEND_API_KEY)

---

## 📊 Monitoring

### Metrics to Track

When changing feature flags, monitor:

1. **User Engagement**
   - Comments per day
   - Active users
   - Session duration

2. **Performance**
   - Page load time
   - API response time
   - Error rates

3. **Database**
   - Query performance
   - Connection usage
   - Storage size

---

## 🛠️ Advanced: Dynamic Feature Flags

### Future Enhancement (Not Implemented)

For runtime feature toggles, consider:

1. **Remote Config** (Supabase Functions)
   ```typescript
   const { data } = await supabase
     .from('feature_flags')
     .select('enabled')
     .eq('name', 'comments')
     .single();
   ```

2. **Admin Control Panel**
   - Toggle features from admin dashboard
   - Real-time updates via Supabase Realtime
   - No redeployment needed

3. **User-Level Flags**
   - Beta features for specific users
   - A/B testing
   - Gradual rollouts

---

## 📝 Checklist: Changing a Feature Flag

Before changing a feature flag in production:

- [ ] Test change in development environment
- [ ] Verify no errors in browser console
- [ ] Test affected features work correctly
- [ ] Check fallback behavior
- [ ] Notify team/users if disabling major feature
- [ ] Update `.env.example` if needed
- [ ] Document change in release notes
- [ ] Monitor application after change
- [ ] Have rollback plan ready

---

## 🆘 Troubleshooting

### Feature flag not working

**Issue**: Changed `.env` but nothing happens

**Solutions**:
1. Restart development server
2. Clear browser cache
3. Check for typos in variable name
4. Verify `VITE_` prefix
5. Check build output includes variable

### Feature still showing after disabling

**Issue**: Comments still visible after setting `VITE_ENABLE_COMMENTS=false`

**Solutions**:
1. Hard refresh browser (Ctrl+Shift+R)
2. Check `.env` file is being loaded
3. Verify no cached build files
4. Check conditional rendering logic

---

## 📚 Related Documentation

- [DEPLOYMENT.md](./DEPLOYMENT.md) - Deployment instructions
- [ENVIRONMENT_SETUP.md](./ENVIRONMENT_SETUP.md) - Environment variables
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - Common issues

---

**Need help?** Check the [Troubleshooting Guide](./TROUBLESHOOTING.md) or review browser console logs.
